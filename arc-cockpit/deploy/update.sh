#!/usr/bin/env bash
# Deploy the latest code from GitHub (no sudo): pull, install, test, build, restart.
#   bash ~/ARC-NIKO/arc-cockpit/deploy/update.sh
set -euo pipefail
COCKPIT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="$HOME/.local/node/bin:$PATH"

cd "$COCKPIT_DIR"
before="$(git rev-parse --short HEAD)"
git pull --ff-only
echo "== $before -> $(git rev-parse --short HEAD)"
npm ci --no-audit --no-fund --loglevel=error
npm test --silent >/dev/null && echo "== tests passed"
npm run build --workspace web --silent >/dev/null && echo "== web app built"
bash "$COCKPIT_DIR/deploy/cockpit.sh" restart
