#!/usr/bin/env bash
# Runs the ARC cockpit server without root: a small supervisor restarts it if it stops.
#   bash deploy/cockpit.sh start | stop | restart | status | logs | adduser <name>
set -uo pipefail

COCKPIT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$COCKPIT_DIR/.run"
PIDFILE="$RUN_DIR/supervisor.pid"
LOG="$RUN_DIR/server.log"
export PATH="$HOME/.local/node/bin:$PATH"
mkdir -p "$RUN_DIR"

port() { grep -E '^PORT=' "$COCKPIT_DIR/server/.env" 2>/dev/null | cut -d= -f2 || echo 4000; }
running() { [[ -f "$PIDFILE" ]] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; }
healthy() { curl -fsS -m 3 "http://127.0.0.1:$(port)/health" >/dev/null 2>&1; }

supervise() {
  echo $$ >"$PIDFILE"
  local child=0
  trap 'kill "$child" 2>/dev/null; wait "$child" 2>/dev/null; rm -f "$PIDFILE"; exit 0' TERM INT
  while true; do
    # keep the log under ~10 MB
    if [[ -f "$LOG" && $(stat -c %s "$LOG") -gt 10485760 ]]; then mv -f "$LOG" "$LOG.1"; fi
    echo "[$(date -Is)] starting server" >>"$LOG"
    (cd "$COCKPIT_DIR/server" && NODE_ENV=production exec "$COCKPIT_DIR/node_modules/.bin/tsx" src/index.ts) >>"$LOG" 2>&1 &
    child=$!
    wait "$child"
    echo "[$(date -Is)] server exited with code $?; restarting in 15 s" >>"$LOG"
    sleep 15
  done
}

start() {
  if running; then echo "Already running (pid $(cat "$PIDFILE"))."; return 0; fi
  nohup setsid bash "${BASH_SOURCE[0]}" supervise >/dev/null 2>&1 &
  echo -n "Starting"
  for _ in $(seq 1 40); do
    if healthy; then echo " - up on port $(port)."; grep -E "Source:|\[erp\] tables|Login" "$LOG" | tail -3; return 0; fi
    echo -n "."; sleep 2
  done
  echo; echo "!! Not answering yet. Last log lines:"; tail -n 25 "$LOG"; return 1
}

stop() {
  if ! running; then echo "Not running."; return 0; fi
  kill "$(cat "$PIDFILE")"
  for _ in $(seq 1 15); do running || { echo "Stopped."; return 0; }; sleep 1; done
  echo "!! Did not stop in time."; return 1
}

case "${1:-}" in
  supervise) supervise ;;
  start) start ;;
  stop) stop ;;
  restart) stop && start ;;
  status)
    if running && healthy; then echo "Running and healthy on port $(port) (supervisor pid $(cat "$PIDFILE"))."
    elif running; then echo "Supervisor running, server not answering (starting, or failing - see: $0 logs)."
    else echo "Not running."; fi ;;
  logs) tail -n 50 -f "$LOG" ;;
  adduser)
    [[ -n "${2:-}" ]] || { echo "Usage: $0 adduser <username>"; exit 1; }
    (cd "$COCKPIT_DIR" && npm run user:add --workspace server --silent -- "$2") && stop && start ;;
  *) echo "Usage: $0 start|stop|restart|status|logs|adduser <name>"; exit 1 ;;
esac
