import csv
import io
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Order


def list_orders_for_period(db: Session, date_from: date, date_to: date) -> list[Order]:
    query = (
        select(Order)
        .where(Order.load_date >= date_from, Order.load_date <= date_to)
        .order_by(Order.load_date, Order.number)
    )
    return list(db.scalars(query).all())


def orders_report_to_csv(orders: list[Order]) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "number",
            "status",
            "origin",
            "destination",
            "load_date",
            "unload_date",
            "client_name",
            "client_rate",
            "carrier_rate",
            "margin",
        ]
    )
    for order in orders:
        margin = (
            order.client_rate - order.carrier_rate
            if order.client_rate is not None and order.carrier_rate is not None
            else None
        )
        writer.writerow(
            [
                order.number,
                order.status.value,
                order.origin,
                order.destination,
                order.load_date.isoformat(),
                order.unload_date.isoformat(),
                order.client.name,
                str(order.client_rate) if order.client_rate is not None else "",
                str(order.carrier_rate) if order.carrier_rate is not None else "",
                str(margin) if margin is not None else "",
            ]
        )
    return output.getvalue()
