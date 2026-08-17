from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import PaginatedVehicles, VehicleCreate, VehicleRead, VehicleUpdate
from app.services import create_vehicle, get_vehicle, list_vehicles, update_vehicle

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


@router.get("", response_model=PaginatedVehicles)
def get_vehicles(
    carrier_id: UUID | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    items, total = list_vehicles(db, carrier_id, limit, offset)
    return PaginatedVehicles(
        items=[VehicleRead.model_validate(item) for item in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=VehicleRead, status_code=201)
def post_vehicle(payload: VehicleCreate, db: Session = Depends(get_db)):
    try:
        return create_vehicle(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/{vehicle_id}", response_model=VehicleRead)
def get_vehicle_by_id(vehicle_id: UUID, db: Session = Depends(get_db)):
    entity = get_vehicle(db, vehicle_id)
    if not entity or not entity.is_active:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return entity


@router.patch("/{vehicle_id}", response_model=VehicleRead)
def patch_vehicle(vehicle_id: UUID, payload: VehicleUpdate, db: Session = Depends(get_db)):
    entity = get_vehicle(db, vehicle_id)
    if not entity or not entity.is_active:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    try:
        return update_vehicle(db, entity, payload)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
