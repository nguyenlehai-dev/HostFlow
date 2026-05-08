import subprocess
from typing import List

from fastapi import APIRouter, HTTPException

router = APIRouter()


def _run(cmd: List[str], timeout: int = 10) -> str:
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, check=False)
        return out.stdout
    except Exception as exc:
        raise HTTPException(500, f"command failed: {exc}")


@router.get("")
def list_services(state: str = "all"):
    """List systemd units. state = all|running|failed."""
    args = ["systemctl", "list-units", "--type=service", "--no-pager", "--no-legend", "--plain"]
    if state == "running":
        args.append("--state=running")
    elif state == "failed":
        args.append("--state=failed")
    else:
        args.append("--all")

    raw = _run(args)
    items = []
    for line in raw.splitlines():
        parts = line.strip().split(None, 4)
        if len(parts) < 4:
            continue
        unit, load, active, sub = parts[0], parts[1], parts[2], parts[3]
        desc = parts[4] if len(parts) > 4 else ""
        items.append({
            "unit": unit,
            "load": load,
            "active": active,
            "sub": sub,
            "description": desc,
        })
    return {"count": len(items), "items": items}


@router.get("/{name}")
def service_detail(name: str):
    safe = name.replace("/", "")
    raw = _run(["systemctl", "show", safe, "--no-pager"])
    info = {}
    for line in raw.splitlines():
        if "=" in line:
            k, v = line.split("=", 1)
            info[k] = v
    status = _run(["systemctl", "status", safe, "--no-pager", "-l", "-n", "20"])
    return {"unit": safe, "properties": info, "status_text": status}


@router.post("/{name}/{action}")
def service_action(name: str, action: str):
    if action not in ("start", "stop", "restart", "reload", "enable", "disable"):
        raise HTTPException(400, "invalid action")
    safe = name.replace("/", "")
    out = _run(["systemctl", action, safe], timeout=20)
    return {"unit": safe, "action": action, "output": out}
