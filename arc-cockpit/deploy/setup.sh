#!/usr/bin/env bash
# One-time setup of the ARC cockpit on a Linux VM, as your normal user. No sudo, no root:
#   - Node.js 22 goes into ~/.local/node
#   - the Node server serves the web app and /graphql on one port (default 8080), with its own login
#   - deploy/cockpit.sh keeps it running (restarts on crash) and a crontab @reboot line starts it after a reboot
#
#   bash ~/ARC-NIKO/arc-cockpit/deploy/setup.sh
# Safe to run again.
set -euo pipefail
if [[ $EUID -eq 0 ]]; then echo "Run this as your normal user, not root or sudo."; exit 1; fi

COCKPIT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_DIR="$HOME/.local/node"
export PATH="$NODE_DIR/bin:$PATH"

node_ok() { command -v node >/dev/null && [[ "$(node -p 'process.versions.node.split(".")[0]')" -ge 22 ]]; }

# ---------------------------------------------------------------- Node.js 22 (in your home folder)
if ! node_ok; then
  case "$(uname -m)" in
    x86_64) ARCH=x64 ;;
    aarch64 | arm64) ARCH=arm64 ;;
    *) echo "Unsupported CPU: $(uname -m)"; exit 1 ;;
  esac
  BASE=https://nodejs.org/dist/latest-v22.x
  echo "== Installing Node.js 22 into $NODE_DIR"
  LINE="$(curl -fsSL "$BASE/SHASUMS256.txt" | grep "linux-$ARCH.tar.gz\$")"
  SUM="${LINE%% *}"; FILE="${LINE##* }"
  TMP="$(mktemp -d)"
  curl -fsSL -o "$TMP/$FILE" "$BASE/$FILE"
  echo "$SUM  $TMP/$FILE" | sha256sum -c --quiet
  rm -rf "$NODE_DIR" && mkdir -p "$NODE_DIR"
  tar -xzf "$TMP/$FILE" -C "$NODE_DIR" --strip-components=1
  rm -rf "$TMP"
  grep -q '.local/node/bin' "$HOME/.profile" 2>/dev/null || echo 'export PATH="$HOME/.local/node/bin:$PATH"' >>"$HOME/.profile"
fi
echo "   node $(node -v), npm $(npm -v)"

# ---------------------------------------------------------------- settings (server/.env)
ENV_FILE="$COCKPIT_DIR/server/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "== ERP connection (saved in server/.env, readable only by you)"
  read -rp "Airgen ERP MCP URL [https://dynamic-cyan-raccoon.erp.airgen.ai/mcp]: " ERP_URL
  ERP_URL="${ERP_URL:-https://dynamic-cyan-raccoon.erp.airgen.ai/mcp}"
  read -rsp "Airgen ERP API key (hidden; use a read-only key): " ERP_TOKEN; echo
  read -rp "Port for the cockpit [8080]: " PORT
  PORT="${PORT:-8080}"
  umask 077
  cat >"$ENV_FILE" <<EOF
DATA_SOURCE=airgen
AGENTIC_ERP_URL=$ERP_URL
AGENTIC_ERP_TOKEN=$ERP_TOKEN
ERP_REFRESH_MINUTES=15
# 0.0.0.0 = reachable from other machines (a login is required then)
HOST=0.0.0.0
PORT=$PORT
EOF
  umask 022
fi
chmod 600 "$ENV_FILE"

# ---------------------------------------------------------------- install, test, build
echo "== Installing dependencies, testing and building the web app"
cd "$COCKPIT_DIR"
npm ci --no-audit --no-fund --loglevel=error
npm test --silent >/dev/null && echo "   tests passed"
npm run build --workspace web --silent >/dev/null && echo "   web app built"

# ---------------------------------------------------------------- login
if [[ ! -s "$COCKPIT_DIR/server/users.txt" ]]; then
  echo "== Cockpit login (everyone opening the cockpit needs it; add more later with deploy/cockpit.sh adduser <name>)"
  read -rp "Username: " WEB_USER
  npm run user:add --workspace server --silent -- "$WEB_USER"
fi

# ---------------------------------------------------------------- start, and start again after a reboot
bash "$COCKPIT_DIR/deploy/cockpit.sh" restart
if command -v crontab >/dev/null; then
  LINE="@reboot /bin/bash $COCKPIT_DIR/deploy/cockpit.sh start"
  { crontab -l 2>/dev/null | grep -v 'deploy/cockpit.sh' || true; echo "$LINE"; } | crontab -
  echo "== Will start again automatically after a reboot (crontab)"
else
  echo "!! crontab is not available: after a VM reboot, run: bash $COCKPIT_DIR/deploy/cockpit.sh start"
fi

PORT="$(grep -E '^PORT=' "$ENV_FILE" | cut -d= -f2)"
IP="$(curl -fsS -m 3 -H 'Metadata-Flavor: Google' http://169.254.169.254/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip 2>/dev/null || echo '<VM external IP>')"
cat <<EOF

== Done. The cockpit runs on port $PORT.
   From your laptop now (no firewall change needed), open an SSH tunnel and browse to http://localhost:$PORT :
       ssh -N -L $PORT:localhost:$PORT $USER@$IP
   For a direct link (http://$IP:$PORT), a GCP firewall rule must allow TCP $PORT to this VM.
   Manage:  bash $COCKPIT_DIR/deploy/cockpit.sh status|logs|restart|stop|adduser <name>
   Update:  bash $COCKPIT_DIR/deploy/update.sh
EOF
