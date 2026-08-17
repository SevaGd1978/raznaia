from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import carriers, clients, orders, system, vehicles


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Raznaia TMS",
    description="Transport Management System MVP API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_prefix = "/api/v1"
app.include_router(system.router, prefix=api_prefix)
app.include_router(clients.router, prefix=api_prefix)
app.include_router(carriers.router, prefix=api_prefix)
app.include_router(vehicles.router, prefix=api_prefix)
app.include_router(orders.router, prefix=api_prefix)


@app.get("/")
def root():
    return {
        "name": "Raznaia TMS",
        "docs": "/docs",
        "api": "/api/v1/health",
    }
