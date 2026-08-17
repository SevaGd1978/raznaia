from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models import CounterpartyType, OrderStatus


class CounterpartyBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    inn: str | None = Field(default=None, max_length=12)
    phone: str | None = Field(default=None, max_length=32)
    email: str | None = Field(default=None, max_length=255)


class CounterpartyCreate(CounterpartyBase):
    pass


class CounterpartyUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    inn: str | None = Field(default=None, max_length=12)
    phone: str | None = Field(default=None, max_length=32)
    email: str | None = Field(default=None, max_length=255)
    is_active: bool | None = None


class CounterpartyRead(CounterpartyBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    type: CounterpartyType
    is_active: bool
    created_at: datetime


class VehicleBase(BaseModel):
    carrier_id: UUID
    plate_number: str = Field(min_length=1, max_length=16)
    brand: str | None = Field(default=None, max_length=128)
    capacity_kg: float | None = Field(default=None, ge=0)
    volume_m3: float | None = Field(default=None, ge=0)


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    carrier_id: UUID | None = None
    plate_number: str | None = Field(default=None, min_length=1, max_length=16)
    brand: str | None = Field(default=None, max_length=128)
    capacity_kg: float | None = Field(default=None, ge=0)
    volume_m3: float | None = Field(default=None, ge=0)
    is_active: bool | None = None


class VehicleRead(VehicleBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    is_active: bool
    created_at: datetime


class OrderBase(BaseModel):
    client_id: UUID
    origin: str = Field(min_length=1, max_length=255)
    destination: str = Field(min_length=1, max_length=255)
    load_date: date
    unload_date: date
    cargo_weight_kg: float | None = Field(default=None, ge=0)
    cargo_volume_m3: float | None = Field(default=None, ge=0)
    client_rate: Decimal | None = Field(default=None, ge=0)
    carrier_rate: Decimal | None = Field(default=None, ge=0)
    notes: str | None = None

    @model_validator(mode="after")
    def validate_dates(self) -> "OrderBase":
        if self.unload_date < self.load_date:
            raise ValueError("unload_date must be on or after load_date")
        return self


class OrderCreate(OrderBase):
    pass


class OrderUpdate(BaseModel):
    client_id: UUID | None = None
    carrier_id: UUID | None = None
    vehicle_id: UUID | None = None
    origin: str | None = Field(default=None, min_length=1, max_length=255)
    destination: str | None = Field(default=None, min_length=1, max_length=255)
    load_date: date | None = None
    unload_date: date | None = None
    cargo_weight_kg: float | None = Field(default=None, ge=0)
    cargo_volume_m3: float | None = Field(default=None, ge=0)
    client_rate: Decimal | None = Field(default=None, ge=0)
    carrier_rate: Decimal | None = Field(default=None, ge=0)
    notes: str | None = None


class OrderStatusChange(BaseModel):
    status: OrderStatus


class OrderStatusHistoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    from_status: OrderStatus | None
    to_status: OrderStatus
    changed_at: datetime


class OrderRead(OrderBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    number: str
    carrier_id: UUID | None
    vehicle_id: UUID | None
    status: OrderStatus
    margin: Decimal | None = None
    created_at: datetime
    updated_at: datetime
    status_history: list[OrderStatusHistoryRead] = []


class PaginatedCounterparties(BaseModel):
    items: list[CounterpartyRead]
    total: int
    limit: int
    offset: int


class PaginatedVehicles(BaseModel):
    items: list[VehicleRead]
    total: int
    limit: int
    offset: int


class PaginatedOrders(BaseModel):
    items: list[OrderRead]
    total: int
    limit: int
    offset: int


class DashboardStats(BaseModel):
    total_orders: int
    by_status: dict[str, int]
    orders_today: int
    total_margin: Decimal


class HealthResponse(BaseModel):
    status: str
    app_env: str
