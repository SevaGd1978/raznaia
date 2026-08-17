import enum
import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    LOGIST = "logist"
    ACCOUNTANT = "accountant"


class CounterpartyType(str, enum.Enum):
    CLIENT = "client"
    CARRIER = "carrier"


class OrderStatus(str, enum.Enum):
    DRAFT = "draft"
    CONFIRMED = "confirmed"
    ASSIGNED = "assigned"
    IN_TRANSIT = "in_transit"
    COMPLETED = "completed"
    CLOSED = "closed"
    CANCELLED = "cancelled"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False, default=UserRole.ADMIN)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Counterparty(Base):
    __tablename__ = "counterparties"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type: Mapped[CounterpartyType] = mapped_column(Enum(CounterpartyType), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    inn: Mapped[str | None] = mapped_column(String(12), nullable=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    vehicles: Mapped[list["Vehicle"]] = relationship(back_populates="carrier")
    client_orders: Mapped[list["Order"]] = relationship(
        back_populates="client", foreign_keys="Order.client_id"
    )
    carrier_orders: Mapped[list["Order"]] = relationship(
        back_populates="carrier", foreign_keys="Order.carrier_id"
    )


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    carrier_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("counterparties.id"))
    plate_number: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    brand: Mapped[str | None] = mapped_column(String(128), nullable=True)
    capacity_kg: Mapped[float | None] = mapped_column(nullable=True)
    volume_m3: Mapped[float | None] = mapped_column(nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    carrier: Mapped["Counterparty"] = relationship(back_populates="vehicles")
    orders: Mapped[list["Order"]] = relationship(back_populates="vehicle")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    number: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("counterparties.id"))
    carrier_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("counterparties.id"), nullable=True
    )
    vehicle_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=True
    )
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus), default=OrderStatus.DRAFT, index=True
    )
    origin: Mapped[str] = mapped_column(String(255), nullable=False)
    destination: Mapped[str] = mapped_column(String(255), nullable=False)
    load_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    unload_date: Mapped[date] = mapped_column(Date, nullable=False)
    cargo_weight_kg: Mapped[float | None] = mapped_column(nullable=True)
    cargo_volume_m3: Mapped[float | None] = mapped_column(nullable=True)
    client_rate: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    carrier_rate: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    client: Mapped["Counterparty"] = relationship(back_populates="client_orders", foreign_keys=[client_id])
    carrier: Mapped["Counterparty | None"] = relationship(
        back_populates="carrier_orders", foreign_keys=[carrier_id]
    )
    vehicle: Mapped["Vehicle | None"] = relationship(back_populates="orders")
    status_history: Mapped[list["OrderStatusHistory"]] = relationship(
        back_populates="order", order_by="OrderStatusHistory.changed_at"
    )


class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id"))
    from_status: Mapped[OrderStatus | None] = mapped_column(Enum(OrderStatus), nullable=True)
    to_status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), nullable=False)
    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    order: Mapped["Order"] = relationship(back_populates="status_history")
