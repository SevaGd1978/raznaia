from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import CounterpartyType, User
from app.schemas import (
    CounterpartyCreate,
    CounterpartyRead,
    CounterpartyUpdate,
    PaginatedCounterparties,
)
from app.services import (
    create_counterparty,
    get_counterparty,
    list_counterparties,
    soft_delete_counterparty,
    update_counterparty,
)

router = APIRouter(prefix="/carriers", tags=["carriers"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=PaginatedCounterparties)
def get_carriers(
    search: str | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    items, total = list_counterparties(db, CounterpartyType.CARRIER, search, limit, offset)
    return PaginatedCounterparties(
        items=[CounterpartyRead.model_validate(item) for item in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=CounterpartyRead, status_code=201)
def post_carrier(payload: CounterpartyCreate, db: Session = Depends(get_db)):
    return create_counterparty(db, CounterpartyType.CARRIER, payload)


@router.get("/{carrier_id}", response_model=CounterpartyRead)
def get_carrier(carrier_id: UUID, db: Session = Depends(get_db)):
    entity = get_counterparty(db, carrier_id)
    if not entity or entity.type != CounterpartyType.CARRIER or not entity.is_active:
        raise HTTPException(status_code=404, detail="Carrier not found")
    return entity


@router.patch("/{carrier_id}", response_model=CounterpartyRead)
def patch_carrier(carrier_id: UUID, payload: CounterpartyUpdate, db: Session = Depends(get_db)):
    entity = get_counterparty(db, carrier_id)
    if not entity or entity.type != CounterpartyType.CARRIER or not entity.is_active:
        raise HTTPException(status_code=404, detail="Carrier not found")
    return update_counterparty(db, entity, payload)


@router.delete("/{carrier_id}", status_code=204)
def delete_carrier(carrier_id: UUID, db: Session = Depends(get_db)):
    entity = get_counterparty(db, carrier_id)
    if not entity or entity.type != CounterpartyType.CARRIER or not entity.is_active:
        raise HTTPException(status_code=404, detail="Carrier not found")
    soft_delete_counterparty(db, entity)
