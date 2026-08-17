from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import OrderStatus
from app.schemas import (
    OrderCreate,
    OrderRead,
    OrderStatusChange,
    OrderUpdate,
    PaginatedOrders,
)
from app.services import (
    change_order_status,
    compute_margin,
    create_order,
    get_order,
    list_orders,
    update_order,
)

router = APIRouter(prefix="/orders", tags=["orders"])


def _order_to_read(order) -> OrderRead:
    data = OrderRead.model_validate(order)
    data.margin = compute_margin(order)
    return data


@router.get("", response_model=PaginatedOrders)
def get_orders(
    status: OrderStatus | None = None,
    client_id: UUID | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    items, total = list_orders(db, status, client_id, date_from, date_to, limit, offset)
    return PaginatedOrders(
        items=[_order_to_read(item) for item in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=OrderRead, status_code=201)
def post_order(payload: OrderCreate, db: Session = Depends(get_db)):
    try:
        return _order_to_read(create_order(db, payload))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/{order_id}", response_model=OrderRead)
def get_order_by_id(order_id: UUID, db: Session = Depends(get_db)):
    entity = get_order(db, order_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Order not found")
    return _order_to_read(entity)


@router.patch("/{order_id}", response_model=OrderRead)
def patch_order(order_id: UUID, payload: OrderUpdate, db: Session = Depends(get_db)):
    entity = get_order(db, order_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Order not found")
    try:
        return _order_to_read(update_order(db, entity, payload))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.patch("/{order_id}/status", response_model=OrderRead)
def patch_order_status(order_id: UUID, payload: OrderStatusChange, db: Session = Depends(get_db)):
    entity = get_order(db, order_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Order not found")
    try:
        return _order_to_read(change_order_status(db, entity, payload.status))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/{order_id}/application.pdf")
def get_order_application(order_id: UUID, db: Session = Depends(get_db)):
    entity = get_order(db, order_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Order not found")

    html = f"""
    <!DOCTYPE html>
    <html lang="ru">
    <head><meta charset="utf-8"><title>Заявка {entity.number}</title></head>
    <body>
      <h1>Заявка на перевозку № {entity.number}</h1>
      <p><strong>Клиент:</strong> {entity.client.name}</p>
      <p><strong>Маршрут:</strong> {entity.origin} → {entity.destination}</p>
      <p><strong>Погрузка:</strong> {entity.load_date}</p>
      <p><strong>Выгрузка:</strong> {entity.unload_date}</p>
      <p><strong>Ставка клиента:</strong> {entity.client_rate or '—'} ₽</p>
      <p><strong>Примечание:</strong> {entity.notes or '—'}</p>
    </body>
    </html>
    """
    return HTMLResponse(
        content=html,
        headers={"Content-Disposition": f'inline; filename="application-{entity.number}.html"'},
    )
