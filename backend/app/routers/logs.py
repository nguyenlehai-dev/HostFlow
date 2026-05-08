import subprocess

from fastapi import APIRouter, HTTPException, Query

router = APIRouter()


@router.get("/units")
def list_units():
    """List units that have recent log entries."""
    try:
        out = subprocess.run(
            ["journalctl", "--field=_SYSTEMD_UNIT"],
            capture_output=True, text=True, timeout=10, check=False,
        )
        units = sorted({u.strip() for u in out.stdout.splitlines() if u.strip()})
        return {"count": len(units), "items": units}
    except Exception as exc:
        raise HTTPException(500, str(exc))


@router.get("")
def get_logs(
    unit: str | None = None,
    lines: int = Query(200, le=2000),
    priority: str | None = None,
    since: str | None = None,
):
    args = ["journalctl", "--no-pager", "-n", str(lines)]
    if unit:
        args += ["-u", unit]
    if priority:
        args += ["-p", priority]
    if since:
        args += ["--since", since]
    try:
        out = subprocess.run(args, capture_output=True, text=True, timeout=15, check=False)
        return {"unit": unit, "lines": lines, "output": out.stdout}
    except Exception as exc:
        raise HTTPException(500, str(exc))
