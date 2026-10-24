#!/usr/bin/env bash
# One-time setup of the ARC cockpit on a Debian 12 VM.
#   nginx (HTTPS + password) -> web/dist (static) and /graphql -> Node server on 127.0.0.1:4000 (systemd)
#
# Run from the cloned repo, as a user with sudo:
#   sudo bash arc-cockpit/deploy/setup.sh
# Safe to run again: every step checks what is already there.
set -euo pipefail

if [[ $EUID -ne 0 ]]; then echo "Run with sudo: sudo bash $0"; exit 1; fi

COCKPIT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"   # .../arc-cockpit
REPO_DIR="$(cd "$COCKPIT_DIR/.." && pwd)"
APP_USER=arc
PUBLIC_IP="$(curl -fsS -H 'Metadata-Flavor: Google' http://169.254.169.254/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip 2>/dev/null || curl -fsS https://api.ipify.org)"
DEFAULT_DOMAIN="${PUBLIC_IP//./-}.sslip.io"

echo "== ARC cockpit setup"
echo "   repo:      $REPO_DIR"
echo "   public IP: $PUBLIC_IP"
read -rp "Domain for the cockpit [$DEFAULT_DOMAIN]: " DOMAIN
DOMAIN="${DOMAIN:-$DEFAULT_DOMAIN}"
read -rp "Email for the HTTPS certificate (Let's Encrypt expiry notices): " LE_EMAIL

# ---------------------------------------------------------------- packages
echo "== Installing packages"
apt-get update -qq
apt-get install -y -qq ca-certificates curl git nginx apache2-utils certbot python3-certbot-nginx >/dev/null
if ! command -v node >/dev/null || [[ "$(node -p 'process.versions.node.split(".")[0]')" -lt 22 ]]; then
  echo "== Installing Node.js 22"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null
  apt-get install -y -qq nodejs >/dev/null
fi
echo "   node $(node -v), npm $(npm -v)"

# ---------------------------------------------------------------- app user and files
id "$APP_USER" >/dev/null 2>&1 || useradd --system --home-dir /nonexistent --shell /usr/sbin/nologin "$APP_USER"
chown -R "$APP_USER:$APP_USER" "$REPO_DIR"
chmod 755 "$REPO_DIR" "$COCKPIT_DIR"
git config --system --add safe.directory "$REPO_DIR" 2>/dev/null || true

# ---------------------------------------------------------------- ERP settings (server/.env)
ENV_FILE="$COCKPIT_DIR/server/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "== ERP connection (stored in server/.env, readable only by the service)"
  read -rp "Airgen ERP MCP URL [https://dynamic-cyan-raccoon.erp.airgen.ai/mcp]: " ERP_URL
  ERP_URL="${ERP_URL:-https://dynamic-cyan-raccoon.erp.airgen.ai/mcp}"
  read -rsp "Airgen ERP API key (input hidden; use a read-only key): " ERP_TOKEN; echo
  cat >"$ENV_FILE" <<EOF
DATA_SOURCE=airgen
AGENTIC_ERP_URL=$ERP_URL
AGENTIC_ERP_TOKEN=$ERP_TOKEN
ERP_REFRESH_MINUTES=15
PORT=4000
HOST=127.0.0.1
EOF
fi
chown "$APP_USER:$APP_USER" "$ENV_FILE"
chmod 600 "$ENV_FILE"

# ---------------------------------------------------------------- install and build
echo "== Installing dependencies and building the web app"
cd "$COCKPIT_DIR"
sudo -u "$APP_USER" HOME=/tmp npm ci --no-audit --no-fund --loglevel=error
sudo -u "$APP_USER" HOME=/tmp npm run build --workspace web --silent
sudo -u "$APP_USER" HOME=/tmp npm test --silent >/dev/null && echo "   tests passed"

# ---------------------------------------------------------------- systemd service
echo "== Installing the service"
sed -e "s#@COCKPIT_DIR@#$COCKPIT_DIR#g" -e "s#@APP_USER@#$APP_USER#g" \
  "$COCKPIT_DIR/deploy/arc-cockpit.service" >/etc/systemd/system/arc-cockpit.service
systemctl daemon-reload
systemctl enable --quiet arc-cockpit
systemctl restart arc-cockpit
for i in {1..30}; do
  curl -fsS http://127.0.0.1:4000/health >/dev/null 2>&1 && break
  if ! systemctl is-active --quiet arc-cockpit; then
    echo "!! The server stopped. Last log lines:"; journalctl -u arc-cockpit -n 30 --no-pager; exit 1
  fi
  sleep 2
done
curl -fsS http://127.0.0.1:4000/health >/dev/null || { echo "!! Server did not answer"; journalctl -u arc-cockpit -n 30 --no-pager; exit 1; }
journalctl -u arc-cockpit -n 20 --no-pager | grep -E "\[erp\]|Source:" || true

# ---------------------------------------------------------------- password
HTPASSWD=/etc/nginx/arc-cockpit.htpasswd
if [[ ! -s "$HTPASSWD" ]]; then
  echo "== Cockpit login (everyone opening the cockpit must enter this)"
  read -rp "Username: " WEB_USER
  htpasswd -cB "$HTPASSWD" "$WEB_USER"
fi
chown root:www-data "$HTPASSWD"
chmod 640 "$HTPASSWD"

# ---------------------------------------------------------------- nginx
echo "== Configuring nginx for $DOMAIN"
sed -e "s#@DOMAIN@#$DOMAIN#g" -e "s#@COCKPIT_DIR@#$COCKPIT_DIR#g" \
  "$COCKPIT_DIR/deploy/nginx-arc-cockpit.conf" >/etc/nginx/sites-available/arc-cockpit
ln -sf /etc/nginx/sites-available/arc-cockpit /etc/nginx/sites-enabled/arc-cockpit
rm -f /etc/nginx/sites-enabled/default
nginx -t -q
systemctl reload nginx

# ---------------------------------------------------------------- HTTPS
echo "== Getting an HTTPS certificate"
if certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$LE_EMAIL" --redirect; then
  URL="https://$DOMAIN"
else
  URL="http://$DOMAIN"
  echo "!! No certificate. Check that the VM allows HTTP and HTTPS traffic (GCP firewall) and that $DOMAIN points to $PUBLIC_IP, then run:"
  echo "   sudo certbot --nginx -d $DOMAIN --redirect"
  echo "   Until then the password travels unencrypted: do not share the link."
fi

echo
echo "== Done. Cockpit: $URL"
echo "   Logs:    sudo journalctl -u arc-cockpit -f"
echo "   Update:  sudo bash $COCKPIT_DIR/deploy/update.sh"
