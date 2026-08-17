from datetime import date
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.schemas import OrdersReportRead
from app.services import list_orders_for_period, order_to_read, orders_report_to_csv

router = APIRouter(prefix="/reports", tags=["reports"], dependencies=[Depends(get_current_user)])


class ReportFormat(str, Enum):
    JSON = "json"
    CSV = "csv"


@router.get("/orders")
def get_orders_report(
    from_date: date = Query(alias="from"),
    to_date: date = Query(alias="to"),
    format: ReportFormat = ReportFormat.JSON,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if to_date < from_date:
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

    items = [order_to_read(order) for order in orders]
    return OrdersReportRead(
        items=items,
        total=len(items),
        from_date=from_date,
        to_date=to_date,
    )
