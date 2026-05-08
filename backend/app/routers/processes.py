import psutil
from fastapi import APIRouter, Query

router = APIRouter()


@router.get("")
def list_processes(
    sort: str = Query("cpu", regex="^(cpu|mem|pid|name)$"),
    limit: int = 50,
):
    procs = []
    for p in psutil.process_iter(["pid", "name", "username", "status", "cpu_percent", "memory_percent", "cmdline", "create_time"]):
        try:
            info = p.info
            procs.append({
                "pid": info["pid"],
                "name": info.get("name") or "",
                "user": info.get("username") or "",
                "status": info.get("status") or "",
                "cpu": round(info.get("cpu_percent") or 0.0, 1),
                "mem": round(info.get("memory_percent") or 0.0, 2),
                "cmd": " ".join((info.get("cmdline") or [])[:6])[:200],
                "started": info.get("create_time"),
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass

    keymap = {"cpu": "cpu", "mem": "mem", "pid": "pid", "name": "name"}
    reverse = sort in ("cpu", "mem")
    procs.sort(key=lambda x: x[keymap[sort]] if not isinstance(x[keymap[sort]], str) else x[keymap[sort]].lower(), reverse=reverse)
    return {"count": len(procs), "items": procs[:limit]}
