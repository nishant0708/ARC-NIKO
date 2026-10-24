#!/usr/bin/env bash
# Deploy the latest code from GitHub: pull, install, test, build, restart.
#   sudo bash arc-cockpit/deploy/update.sh
set -euo pipefail
if [[ $EUID -ne 0 ]]; then echo "Run with sudo: sudo bash $0"; exit 1; fi

COCKPIT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_DIR="$(cd "$COCKPIT_DIR/.." && pwd)"
APP_USER=arc
as_app() { sudo -u "$APP_USER" HOME=/tmp "$@"; }

cd "$REPO_DIR"
before="$(as_app git rev-parse --short HEAD)"
as_app git pull --ff-only
after="$(as_app git rev-parse --short HEAD)"
echo "== $before -> $after"

cd "$COCKPIT_DIR"
as_app npm ci --no-audit --no-fund --loglevel=error
as_app npm test --silent >/dev/null && echo "== tests passed"
as_app npm run build --workspace web --silent

# nginx config or service file changed in the repo? re-run setup.sh to apply them.
systemctl restart arc-cockpit
for i in {1..30}; do
  curl -fsS http://127.0.0.1:4000/health >/dev/null 2>&1 && { echo "== server is up"; break; }
  systemctl is-active --quiet arc-cockpit || { journalctl -u arc-cockpit -n 30 --no-pager; exit 1; }
  sleep 2
done
journalctl -u arc-cockpit -n 20 --no-pager | grep -E "\[erp\]|Source:" || true
