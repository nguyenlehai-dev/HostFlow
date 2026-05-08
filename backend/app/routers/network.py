import subprocess

import psutil
from fastapi import APIRouter

router = APIRouter()


@router.get("/interfaces")
def interfaces():
    addrs = psutil.net_if_addrs()
    stats = psutil.net_if_stats()
    counters = psutil.net_io_counters(pernic=True)
    items = []
    for name, addr_list in addrs.items():
        s = stats.get(name)
        c = counters.get(name)
        items.append({
            "name": name,
            "addresses": [
                {"family": str(a.family), "address": a.address, "netmask": a.netmask}
                for a in addr_list
            ],
            "is_up": s.isup if s else False,
            "speed_mbps": s.speed if s else 0,
            "mtu": s.mtu if s else 0,
            "bytes_sent": c.bytes_sent if c else 0,
            "bytes_recv": c.bytes_recv if c else 0,
            "packets_sent": c.packets_sent if c else 0,
            "packets_recv": c.packets_recv if c else 0,
            "errin": c.errin if c else 0,
            "errout": c.errout if c else 0,
            "dropin": c.dropin if c else 0,
            "dropout": c.dropout if c else 0,
        })
    return {"count": len(items), "items": items}


@router.get("/connections")
def connections(kind: str = "inet"):
    items = []
    try:
        for conn in psutil.net_connections(kind=kind):
            items.append({
                "fd": conn.fd,
                "family": str(conn.family),
                "type": str(conn.type),
                "laddr": f"{conn.laddr.ip}:{conn.laddr.port}" if conn.laddr else "",
                "raddr": f"{conn.raddr.ip}:{conn.raddr.port}" if conn.raddr else "",
                "status": conn.status,
                "pid": conn.pid,
            })
    except (psutil.AccessDenied, PermissionError):
        return {"count": 0, "items": [], "note": "permission denied (run backend as root for full info)"}
    return {"count": len(items), "items": items}


@router.get("/listening")
def listening_ports():
    out = {"tcp": [], "udp": []}
    try:
        for conn in psutil.net_connections(kind="tcp"):
            if conn.status == psutil.CONN_LISTEN:
                pname = ""
                try:
                    if conn.pid:
                        pname = psutil.Process(conn.pid).name()
                except Exception:
                    pass
                out["tcp"].append({
                    "addr": f"{conn.laddr.ip}:{conn.laddr.port}" if conn.laddr else "",
                    "pid": conn.pid,
                    "process": pname,
                })
        for conn in psutil.net_connections(kind="udp"):
            pname = ""
            try:
                if conn.pid:
                    pname = psutil.Process(conn.pid).name()
            except Exception:
                pass
            out["udp"].append({
                "addr": f"{conn.laddr.ip}:{conn.laddr.port}" if conn.laddr else "",
                "pid": conn.pid,
                "process": pname,
            })
    except (psutil.AccessDenied, PermissionError):
        return {"tcp": [], "udp": [], "note": "permission denied"}
    return out


@router.get("/firewall")
def firewall_status():
    """Return UFW status if available."""
    try:
        out = subprocess.run(
            ["ufw", "status", "verbose"],
            capture_output=True, text=True, timeout=5, check=False,
        )
        return {"available": True, "output": out.stdout or out.stderr}
    except Exception as exc:
        return {"available": False, "error": str(exc)}
