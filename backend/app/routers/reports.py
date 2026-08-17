from datetime import date
from enum import Enum

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import OrdersReportRead
from app.services import list_orders_for_period, orders_report_to_csv
from app.services import compute_margin
from app.schemas import OrderRead

router = APIRouter(prefix="/reports", tags=["reports"])


class ReportFormat(str, Enum):
    JSON = "json"
    CSV = "csv"


def _order_to_read(order) -> OrderRead:
    data = OrderRead.model_validate(order)
    data.margin = compute_margin(order)
    return data


@router.get("/orders")
def get_orders_report(
    from_date: date = Query(alias="from"),
    to_date: date = Query(alias="to"),
    format: ReportFormat = ReportFormat.JSON,
    db: Session = Depends(get_db),
):
    if to_date < from_date:
        from fastapi import HTTPException

        raise HTTPException(status_code=422, detail="to must be on or after from")

    orders = list_orders_for_period(db, from_date, to_date)

    if format == ReportFormat.CSV:
        csv_content = orders_report_to_csv(orders)
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": (
                    f'attachment; filename="orders-report-{from_date.isoformat()}-'
                    f'{to_date.isoformat()}.csv"'
                )
            },
        )

    items = [_order_to_read(order) for order in orders]
    return OrdersReportRead(
        items=items,
        total=len(items),
        from_date=from_date,
        to_date=to_date,
    )
