from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import OrderStatus, User
from app.schemas import (
    OrderCreate,
    OrderRead,
    OrderStatusChange,
    OrderUpdate,
    PaginatedOrders,
)
from app.services import (
    change_order_status,
    create_order,
    get_order,
    list_orders,
    order_to_read,
    update_order,
)
from app.services.pdf import generate_order_application_pdf

router = APIRouter(prefix="/orders", tags=["orders"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=PaginatedOrders)
def get_orders(
    status: OrderStatus | None = None,
    client_id: UUID | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    items, total = list_orders(db, status, client_id, date_from, date_to, limit, offset)
    return PaginatedOrders(
        items=[order_to_read(item) for item in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=OrderRead, status_code=201)
def post_order(payload: OrderCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    try:
        return order_to_read(create_order(db, payload))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/{order_id}", response_model=OrderRead)
def get_order_by_id(order_id: UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    entity = get_order(db, order_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Order not found")
    return order_to_read(entity)


@router.patch("/{order_id}", response_model=OrderRead)
def patch_order(
    order_id: UUID,
    payload: OrderUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    entity = get_order(db, order_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Order not found")
    try:
        return order_to_read(update_order(db, entity, payload))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.patch("/{order_id}/status", response_model=OrderRead)
def patch_order_status(
    order_id: UUID,
    payload: OrderStatusChange,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    entity = get_order(db, order_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Order not found")
    try:
        return order_to_read(change_order_status(db, entity, payload.status))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/{order_id}/application.pdf")
def get_order_application(order_id: UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    entity = get_order(db, order_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Order not found")

    pdf_bytes = generate_order_application_pdf(entity)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="application-{entity.number}.pdf"'},
    )
