"""Seed demo data for local development."""

from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import func, select

from app.database import Base, SessionLocal, engine
from app.models import Counterparty, CounterpartyType, Order, OrderStatus, OrderStatusHistory, Vehicle
from app.services import generate_order_number


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.scalar(select(func.count()).select_from(Counterparty)) > 0:
            print("Database already seeded, skipping.")
            return

        client = Counterparty(
            type=CounterpartyType.CLIENT,
            name='ООО "СеверТрейд"',
            inn="7701234567",
            phone="+7 (495) 123-45-67",
            email="logist@severtrade.ru",
        )
        carrier = Counterparty(
            type=CounterpartyType.CARRIER,
            name="ИП Петров А.В.",
            inn="500987654321",
            phone="+7 (916) 555-12-34",
        )
        db.add_all([client, carrier])
        db.flush()

        vehicle = Vehicle(
            carrier_id=carrier.id,
            plate_number="А123BC777",
            brand="MAN TGS",
            capacity_kg=20000,
            volume_m3=82,
        )
        db.add(vehicle)
        db.flush()

        today = date.today()
        order = Order(
            number=generate_order_number(db),
            client_id=client.id,
            carrier_id=carrier.id,
            vehicle_id=vehicle.id,
            status=OrderStatus.ASSIGNED,
            origin="Москва, ул. Складская 1",
            destination="Санкт-Петербург, ул. Портовая 5",
            load_date=today,
            unload_date=today + timedelta(days=1),
            cargo_weight_kg=15000,
            cargo_volume_m3=60,
            client_rate=Decimal("85000.00"),
            carrier_rate=Decimal("70000.00"),
            notes="Тент, задняя погрузка",
        )
        db.add(order)
        db.flush()
        db.add(
            OrderStatusHistory(
                order_id=order.id,
                from_status=None,
                to_status=OrderStatus.DRAFT,
            )
        )
        db.add(
            OrderStatusHistory(
                order_id=order.id,
                from_status=OrderStatus.DRAFT,
                to_status=OrderStatus.CONFIRMED,
            )
        )
        db.add(
            OrderStatusHistory(
                order_id=order.id,
                from_status=OrderStatus.CONFIRMED,
                to_status=OrderStatus.ASSIGNED,
            )
        )
        db.commit()
        print("Seed completed: 1 client, 1 carrier, 1 vehicle, 1 order.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
