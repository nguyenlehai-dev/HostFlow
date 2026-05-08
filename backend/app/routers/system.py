import platform
import socket
import time
from datetime import datetime

import psutil
from fastapi import APIRouter

router = APIRouter()


def _bootinfo():
    boot = psutil.boot_time()
    return {
        "boot_time": boot,
        "uptime_seconds": int(time.time() - boot),
        "boot_time_iso": datetime.fromtimestamp(boot).isoformat(),
    }


@router.get("/overview")
def overview():
    vm = psutil.virtual_memory()
    sw = psutil.swap_memory()
    du = psutil.disk_usage("/")
    la1, la5, la15 = psutil.getloadavg()
    return {
        "host": {
            "hostname": socket.gethostname(),
            "fqdn": socket.getfqdn(),
            "os": platform.platform(),
            "kernel": platform.release(),
            "arch": platform.machine(),
            "python": platform.python_version(),
        },
        **_bootinfo(),
        "cpu": {
            "count_logical": psutil.cpu_count(logical=True),
            "count_physical": psutil.cpu_count(logical=False),
            "percent": psutil.cpu_percent(interval=0.3),
            "load_avg": {"1m": la1, "5m": la5, "15m": la15},
        },
        "memory": {
            "total": vm.total,
            "used": vm.used,
            "free": vm.available,
            "percent": vm.percent,
        },
        "swap": {
            "total": sw.total,
            "used": sw.used,
            "free": sw.free,
            "percent": sw.percent,
        },
        "disk_root": {
            "total": du.total,
            "used": du.used,
            "free": du.free,
            "percent": du.percent,
        },
    }


@router.get("/cpu")
def cpu_detail():
    freq = psutil.cpu_freq(percpu=False)
    per_core_pct = psutil.cpu_percent(interval=0.3, percpu=True)
    per_core_freq = []
    try:
        per_core_freq = [
            {"current": f.current, "min": f.min, "max": f.max}
            for f in (psutil.cpu_freq(percpu=True) or [])
        ]
    except Exception:
        pass

    times = psutil.cpu_times_percent(interval=0)
    stats = psutil.cpu_stats()
    temps = {}
    try:
        for k, v in (psutil.sensors_temperatures() or {}).items():
            temps[k] = [{"label": s.label, "current": s.current, "high": s.high} for s in v]
    except Exception:
        pass

    return {
        "count_logical": psutil.cpu_count(logical=True),
        "count_physical": psutil.cpu_count(logical=False),
        "freq": {"current": freq.current, "min": freq.min, "max": freq.max} if freq else None,
        "per_core_percent": per_core_pct,
        "per_core_freq": per_core_freq,
        "times_percent": {
            "user": times.user,
            "system": times.system,
            "idle": times.idle,
            "iowait": getattr(times, "iowait", 0.0),
            "irq": getattr(times, "irq", 0.0),
            "softirq": getattr(times, "softirq", 0.0),
        },
        "stats": {
            "ctx_switches": stats.ctx_switches,
            "interrupts": stats.interrupts,
            "soft_interrupts": stats.soft_interrupts,
            "syscalls": stats.syscalls,
        },
        "temperatures": temps,
    }


@router.get("/memory")
def memory_detail():
    vm = psutil.virtual_memory()
    sw = psutil.swap_memory()
    return {
        "virtual": {
            "total": vm.total,
            "available": vm.available,
            "used": vm.used,
            "free": vm.free,
            "active": getattr(vm, "active", None),
            "inactive": getattr(vm, "inactive", None),
            "buffers": getattr(vm, "buffers", None),
            "cached": getattr(vm, "cached", None),
            "shared": getattr(vm, "shared", None),
            "percent": vm.percent,
        },
        "swap": {
            "total": sw.total,
            "used": sw.used,
            "free": sw.free,
            "percent": sw.percent,
            "sin": sw.sin,
            "sout": sw.sout,
        },
    }
