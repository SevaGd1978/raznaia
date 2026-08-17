from datetime import datetime
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import HTML

from app.models import Order, OrderStatus

TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates"

_STATUS_LABELS: dict[OrderStatus, str] = {
    OrderStatus.DRAFT: "Черновик",
    OrderStatus.CONFIRMED: "Подтверждён",
    OrderStatus.ASSIGNED: "Назначен перевозчик",
    OrderStatus.IN_TRANSIT: "В пути",
    OrderStatus.COMPLETED: "Выполнен",
    OrderStatus.CLOSED: "Закрыт",
    OrderStatus.CANCELLED: "Отменён",
}

_jinja_env = Environment(
    loader=FileSystemLoader(TEMPLATES_DIR),
    autoescape=select_autoescape(["html"]),
)


def _format_money(value) -> str:
    if value is None:
        return "—"
    return f"{value:,.2f}".replace(",", " ").replace(".", ",")


def render_order_application_html(order: Order) -> str:
    margin = (
        order.client_rate - order.carrier_rate
        if order.client_rate is not None and order.carrier_rate is not None
        else None
    )
    template = _jinja_env.get_template("application.html")
    return template.render(
        order=order,
        status_label=_STATUS_LABELS.get(order.status, order.status.value),
        generated_at=datetime.now().strftime("%d.%m.%Y %H:%M"),
        client_rate=_format_money(order.client_rate),
        carrier_rate=_format_money(order.carrier_rate),
        margin=_format_money(margin),
    )


def generate_order_application_pdf(order: Order) -> bytes:
    html = render_order_application_html(order)
    return HTML(string=html).write_pdf()
