#!/bin/bash
# Pull latest code and rebuild.
set -euo pipefail

REPO=/opt/HostFlow
cd "$REPO"

git fetch --all
git reset --hard origin/main 2>/dev/null || git reset --hard origin/master

cd backend
.venv/bin/pip install -r requirements.txt
cd ..

cd frontend
if command -v npm >/dev/null; then npm install --silent; npm run build;
else pnpm install --config.dangerously-allow-all-builds=true; pnpm run build; fi
cd ..

systemctl restart hostflow-backend
systemctl reload nginx

echo "===> Updated."
