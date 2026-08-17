from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
    allow_origins=settings.cors_origin_list,
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


@app.get("/")
def root():
    return {
        "name": "Raznaia TMS",
        "version": "0.2.0",
        "docs": "/docs",
        "api": "/api/v1/health",
    }
