#!/bin/bash
# HostFlow installer — run on the target VPS as root.
# Assumes repo is at /opt/HostFlow and Node.js + Python3 + nginx are installed.

set -euo pipefail

REPO=/opt/HostFlow
[ -d "$REPO" ] || { echo "Clone repo to $REPO first."; exit 1; }
cd "$REPO"

echo "===> Backend: virtualenv + deps"
cd backend
python3 -m venv .venv
.venv/bin/pip install --upgrade pip wheel
.venv/bin/pip install -r requirements.txt
cd ..

echo "===> Frontend: install + build"
cd frontend
if command -v pnpm >/dev/null; then pnpm install --frozen-lockfile=false; pnpm run build;
elif command -v npm >/dev/null; then npm install; npm run build;
else echo "Node/npm not found. Install Node.js LTS."; exit 1; fi
cd ..

echo "===> systemd service"
cp deploy/hostflow-backend.service /etc/systemd/system/hostflow-backend.service
systemctl daemon-reload
systemctl enable --now hostflow-backend

echo "===> nginx config"
cp deploy/hostflow.nginx.conf /etc/nginx/sites-available/hostflow
ln -sf /etc/nginx/sites-available/hostflow /etc/nginx/sites-enabled/hostflow
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo
echo "===> Done. Open http://<your-ip>/"
echo "    Backend:  systemctl status hostflow-backend"
echo "    Logs:     journalctl -u hostflow-backend -f"
