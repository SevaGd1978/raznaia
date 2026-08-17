from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config import settings
from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.schemas import DashboardStats, HealthResponse
from app.services import get_dashboard_stats

router = APIRouter(tags=["system"])


@router.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(status="ok", app_env=settings.app_env)


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return get_dashboard_stats(db)
