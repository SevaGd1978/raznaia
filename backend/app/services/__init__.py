from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import extract, func, select
from sqlalchemy.orm import Session

from app.models import Counterparty, CounterpartyType, Order, OrderStatus, OrderStatusHistory, Vehicle
from app.schemas import (
    CounterpartyCreate,
    CounterpartyUpdate,
    DashboardStats,
    OrderCreate,
    OrderRead,
    OrderUpdate,
    VehicleCreate,
    VehicleUpdate,
)

ALLOWED_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.DRAFT: {OrderStatus.CONFIRMED, OrderStatus.CANCELLED},
    OrderStatus.CONFIRMED: {OrderStatus.ASSIGNED, OrderStatus.CANCELLED},
    OrderStatus.ASSIGNED: {OrderStatus.IN_TRANSIT, OrderStatus.CANCELLED},
    OrderStatus.IN_TRANSIT: {OrderStatus.COMPLETED, OrderStatus.CANCELLED},
    OrderStatus.COMPLETED: {OrderStatus.CLOSED},
    OrderStatus.CLOSED: set(),
    OrderStatus.CANCELLED: set(),
}


def compute_margin(order: Order) -> Decimal | None:
    if order.client_rate is None or order.carrier_rate is None:
        return None
    return order.client_rate - order.carrier_rate


def order_to_read(order: Order) -> OrderRead:
    data = OrderRead.model_validate(order)
    data.margin = compute_margin(order)
    return data


def generate_order_number(db: Session) -> str:
    year = date.today().year
    prefix = f"TT-{year}-"
    count = db.scalar(
        select(func.count()).select_from(Order).where(Order.number.like(f"{prefix}%"))
    )
    return f"{prefix}{(count or 0) + 1:05d}"


def list_counterparties(
    db: Session,
    counterparty_type: CounterpartyType,
    search: str | None,
    limit: int,
    offset: int,
) -> tuple[list[Counterparty], int]:
    query = select(Counterparty).where(
        Counterparty.type == counterparty_type,
        Counterparty.is_active.is_(True),
    )
    if search:
        pattern = f"%{search}%"
        query = query.where(Counterparty.name.ilike(pattern) | Counterparty.inn.ilike(pattern))

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = db.scalars(query.order_by(Counterparty.name).limit(limit).offset(offset)).all()
    return items, total


def create_counterparty(
    db: Session, counterparty_type: CounterpartyType, payload: CounterpartyCreate
) -> Counterparty:
    entity = Counterparty(type=counterparty_type, **payload.model_dump())
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return entity


def get_counterparty(db: Session, counterparty_id: UUID) -> Counterparty | None:
    return db.get(Counterparty, counterparty_id)


def update_counterparty(
    db: Session, entity: Counterparty, payload: CounterpartyUpdate
) -> Counterparty:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(entity, field, value)
    db.commit()
    db.refresh(entity)
    return entity


def soft_delete_counterparty(db: Session, entity: Counterparty) -> None:
    entity.is_active = False
    db.commit()


def list_vehicles(
    db: Session, carrier_id: UUID | None, limit: int, offset: int
) -> tuple[list[Vehicle], int]:
    query = select(Vehicle).where(Vehicle.is_active.is_(True))
    if carrier_id:
        query = query.where(Vehicle.carrier_id == carrier_id)

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = db.scalars(query.order_by(Vehicle.plate_number).limit(limit).offset(offset)).all()
    return items, total


def create_vehicle(db: Session, payload: VehicleCreate) -> Vehicle:
    carrier = db.get(Counterparty, payload.carrier_id)
    if not carrier or carrier.type != CounterpartyType.CARRIER:
        raise ValueError("carrier_id must reference an active carrier")

    entity = Vehicle(**payload.model_dump())
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return entity


def get_vehicle(db: Session, vehicle_id: UUID) -> Vehicle | None:
    return db.get(Vehicle, vehicle_id)


def update_vehicle(db: Session, entity: Vehicle, payload: VehicleUpdate) -> Vehicle:
    data = payload.model_dump(exclude_unset=True)
    if "carrier_id" in data:
        carrier = db.get(Counterparty, data["carrier_id"])
        if not carrier or carrier.type != CounterpartyType.CARRIER:
            raise ValueError("carrier_id must reference an active carrier")

    for field, value in data.items():
        setattr(entity, field, value)
    db.commit()
    db.refresh(entity)
    return entity


def list_orders(
    db: Session,
    status: OrderStatus | None,
    client_id: UUID | None,
    date_from: date | None,
    date_to: date | None,
    limit: int,
    offset: int,
) -> tuple[list[Order], int]:
    query = select(Order)
    if status:
        query = query.where(Order.status == status)
    if client_id:
        query = query.where(Order.client_id == client_id)
    if date_from:
        query = query.where(Order.load_date >= date_from)
    if date_to:
        query = query.where(Order.load_date <= date_to)

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = db.scalars(query.order_by(Order.load_date.desc()).limit(limit).offset(offset)).all()
    return items, total


def create_order(db: Session, payload: OrderCreate) -> Order:
    client = db.get(Counterparty, payload.client_id)
    if not client or client.type != CounterpartyType.CLIENT:
        raise ValueError("client_id must reference an active client")

    entity = Order(number=generate_order_number(db), **payload.model_dump())
    db.add(entity)
    db.flush()
    db.add(
        OrderStatusHistory(
            order_id=entity.id,
            from_status=None,
            to_status=OrderStatus.DRAFT,
        )
    )
    db.commit()
    db.refresh(entity)
    return entity


def get_order(db: Session, order_id: UUID) -> Order | None:
    return db.get(Order, order_id)


def update_order(db: Session, entity: Order, payload: OrderUpdate) -> Order:
    data = payload.model_dump(exclude_unset=True)
    if "client_id" in data:
        client = db.get(Counterparty, data["client_id"])
        if not client or client.type != CounterpartyType.CLIENT:
            raise ValueError("client_id must reference an active client")
    if "carrier_id" in data and data["carrier_id"] is not None:
        carrier = db.get(Counterparty, data["carrier_id"])
        if not carrier or carrier.type != CounterpartyType.CARRIER:
            raise ValueError("carrier_id must reference an active carrier")
    if "vehicle_id" in data and data["vehicle_id"] is not None:
        vehicle = db.get(Vehicle, data["vehicle_id"])
        if not vehicle:
            raise ValueError("vehicle_id not found")

    load_date = data.get("load_date", entity.load_date)
    unload_date = data.get("unload_date", entity.unload_date)
    if unload_date < load_date:
        raise ValueError("unload_date must be on or after load_date")

    for field, value in data.items():
        setattr(entity, field, value)
    db.commit()
    db.refresh(entity)
    return entity


def change_order_status(db: Session, entity: Order, new_status: OrderStatus) -> Order:
    allowed = ALLOWED_TRANSITIONS.get(entity.status, set())
    if new_status not in allowed:
        raise ValueError(f"Cannot transition from {entity.status.value} to {new_status.value}")

    history = OrderStatusHistory(
        order_id=entity.id,
        from_status=entity.status,
        to_status=new_status,
    )
    entity.status = new_status
    db.add(history)
    db.commit()
    db.refresh(entity)
    return entity


def get_dashboard_stats(db: Session) -> DashboardStats:
    total_orders = db.scalar(select(func.count()).select_from(Order)) or 0
    today = date.today()
    orders_today = (
        db.scalar(select(func.count()).select_from(Order).where(Order.load_date == today)) or 0
    )

    by_status: dict[str, int] = {}
    rows = db.execute(select(Order.status, func.count()).group_by(Order.status)).all()
    for status, count in rows:
        by_status[status.value] = count

    margin_rows = db.scalars(
        select(Order).where(Order.client_rate.is_not(None), Order.carrier_rate.is_not(None))
    ).all()
    total_margin = sum((compute_margin(order) or Decimal("0")) for order in margin_rows)

    return DashboardStats(
        total_orders=total_orders,
        by_status=by_status,
        orders_today=orders_today,
        total_margin=total_margin,
    )


from app.services.pdf import generate_order_application_pdf  # noqa: E402
from app.services.reports import list_orders_for_period, orders_report_to_csv  # noqa: E402
