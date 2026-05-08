# HostFlow

Web-based VPS management dashboard. Monitor and manage every part of your server from a single UI.

- **Frontend:** React + Vite + TypeScript + Tailwind
- **Backend:** Python FastAPI + psutil
- **Reverse proxy:** nginx
- **Service:** systemd

## Tabs / Modules

| Tab | What it shows |
|---|---|
| Overview | CPU/RAM/Disk/Net/load/uptime at a glance |
| CPU | Per-core usage, frequency, top CPU consumers |
| Memory | RAM + swap breakdown, top RAM consumers |
| Disk | Partitions, I/O stats, mount points |
| Network | Interfaces, throughput, connections, listening ports, firewall |
| Processes | All processes, sortable |
| Services | systemd services list, start/stop/restart |
| Docker | Containers + images |
| Logs | Recent journalctl |
| Optimize | Analyze server, give recommendations |

## Quick deploy on VPS

```
git clone https://github.com/nguyenlehai-dev/HostFlow.git /opt/HostFlow
cd /opt/HostFlow
sudo bash deploy/install.sh
```

Then open `http://<server>/` (nginx serves the SPA, proxies `/api/*` to FastAPI on `127.0.0.1:8765`).

## Dev

### Backend
```
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8765
```

### Frontend
```
cd frontend
npm install
npm run dev    # http://localhost:5173
```
