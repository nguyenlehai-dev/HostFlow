from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import system, processes, services, docker_router, network, disk, logs, optimize

app = FastAPI(title="HostFlow", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(system.router, prefix="/api/system", tags=["system"])
app.include_router(processes.router, prefix="/api/processes", tags=["processes"])
app.include_router(services.router, prefix="/api/services", tags=["services"])
app.include_router(docker_router.router, prefix="/api/docker", tags=["docker"])
app.include_router(network.router, prefix="/api/network", tags=["network"])
app.include_router(disk.router, prefix="/api/disk", tags=["disk"])
app.include_router(logs.router, prefix="/api/logs", tags=["logs"])
app.include_router(optimize.router, prefix="/api/optimize", tags=["optimize"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
