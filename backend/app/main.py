from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.auth import auth_middleware
from app.config import settings
from app.routers import auth, carriers, clients, orders, reports, system, vehicles


app = FastAPI(
    title="Raznaia TMS",
    description="Transport Management System MVP API",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.static_root else settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.middleware("http")(auth_middleware)

api_prefix = "/api/v1"
app.include_router(auth.router, prefix=api_prefix)
app.include_router(system.router, prefix=api_prefix)
app.include_router(reports.router, prefix=api_prefix)
app.include_router(clients.router, prefix=api_prefix)
app.include_router(carriers.router, prefix=api_prefix)
app.include_router(vehicles.router, prefix=api_prefix)
app.include_router(orders.router, prefix=api_prefix)


if settings.static_root:
    static_path = Path(settings.static_root)
    if static_path.is_dir():
        assets_dir = static_path / "assets"
        if assets_dir.is_dir():
            app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

        @app.get("/")
        def spa_index():
            return FileResponse(static_path / "index.html")

        @app.get("/{full_path:path}")
        def spa_files(full_path: str):
            if full_path.startswith("api/"):
                raise HTTPException(status_code=404, detail="Not found")
            candidate = static_path / full_path
            if candidate.is_file():
                return FileResponse(candidate)
            return FileResponse(static_path / "index.html")
else:

    @app.get("/")
    def root():
        return {
            "name": "Raznaia TMS",
            "version": "0.2.0",
            "docs": "/docs",
            "api": "/api/v1/health",
        }
