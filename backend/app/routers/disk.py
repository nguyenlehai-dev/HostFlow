import psutil
from fastapi import APIRouter

router = APIRouter()


@router.get("/partitions")
def partitions():
    items = []
    for p in psutil.disk_partitions(all=False):
        try:
            u = psutil.disk_usage(p.mountpoint)
            items.append({
                "device": p.device,
                "mountpoint": p.mountpoint,
                "fstype": p.fstype,
                "opts": p.opts,
                "total": u.total,
                "used": u.used,
                "free": u.free,
                "percent": u.percent,
            })
        except PermissionError:
            items.append({
                "device": p.device,
                "mountpoint": p.mountpoint,
                "fstype": p.fstype,
                "opts": p.opts,
                "error": "permission denied",
            })
    return {"count": len(items), "items": items}


@router.get("/io")
def io_stats():
    counters = psutil.disk_io_counters(perdisk=True) or {}
    items = []
    for name, c in counters.items():
        items.append({
            "name": name,
            "read_count": c.read_count,
            "write_count": c.write_count,
            "read_bytes": c.read_bytes,
            "write_bytes": c.write_bytes,
            "read_time": c.read_time,
            "write_time": c.write_time,
        })
    return {"count": len(items), "items": items}
