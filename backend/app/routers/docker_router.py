from fastapi import APIRouter, HTTPException

router = APIRouter()


def _client():
    try:
        import docker
        return docker.from_env()
    except Exception as exc:
        raise HTTPException(503, f"docker not available: {exc}")


@router.get("/info")
def docker_info():
    try:
        c = _client()
        info = c.info()
        return {
            "server_version": info.get("ServerVersion"),
            "containers": info.get("Containers"),
            "containers_running": info.get("ContainersRunning"),
            "containers_paused": info.get("ContainersPaused"),
            "containers_stopped": info.get("ContainersStopped"),
            "images": info.get("Images"),
            "kernel": info.get("KernelVersion"),
            "os": info.get("OperatingSystem"),
            "architecture": info.get("Architecture"),
            "ncpu": info.get("NCPU"),
            "mem_total": info.get("MemTotal"),
            "storage_driver": info.get("Driver"),
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(500, str(exc))


@router.get("/containers")
def list_containers(all: bool = True):
    c = _client()
    items = []
    for ct in c.containers.list(all=all):
        try:
            stats = None
            attrs = ct.attrs
            items.append({
                "id": ct.short_id,
                "name": ct.name,
                "image": ct.image.tags[0] if ct.image.tags else ct.image.short_id,
                "status": ct.status,
                "state": attrs.get("State", {}).get("Status"),
                "started": attrs.get("State", {}).get("StartedAt"),
                "created": attrs.get("Created"),
                "ports": [
                    {"private": k, "public": v}
                    for k, v in (attrs.get("NetworkSettings", {}).get("Ports") or {}).items()
                ],
                "command": attrs.get("Config", {}).get("Cmd"),
                "labels": attrs.get("Config", {}).get("Labels") or {},
                "restart_count": attrs.get("RestartCount", 0),
            })
        except Exception:
            pass
    return {"count": len(items), "items": items}


@router.get("/images")
def list_images():
    c = _client()
    items = []
    for img in c.images.list():
        items.append({
            "id": img.short_id,
            "tags": img.tags,
            "size": img.attrs.get("Size", 0),
            "created": img.attrs.get("Created"),
        })
    return {"count": len(items), "items": items}


@router.post("/containers/{cid}/{action}")
def container_action(cid: str, action: str):
    if action not in ("start", "stop", "restart", "remove", "pause", "unpause"):
        raise HTTPException(400, "invalid action")
    c = _client()
    try:
        ct = c.containers.get(cid)
    except Exception:
        raise HTTPException(404, "container not found")
    try:
        if action == "remove":
            ct.remove(force=True)
        else:
            getattr(ct, action)()
        return {"id": cid, "action": action, "ok": True}
    except Exception as exc:
        raise HTTPException(500, str(exc))
