"""initial schema

Revision ID: 001_initial
Revises:
Create Date: 2026-08-17

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

counterparty_type = postgresql.ENUM("client", "carrier", name="counterpartytype")
user_role = postgresql.ENUM("admin", "logist", "accountant", name="userrole")
order_status = postgresql.ENUM(
    "draft",
    "confirmed",
    "assigned",
    "in_transit",
    "completed",
    "closed",
    "cancelled",
    name="orderstatus",
)


def upgrade() -> None:
    counterparty_type.create(op.get_bind(), checkfirst=True)
    user_role.create(op.get_bind(), checkfirst=True)
    order_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", user_role, nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "counterparties",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("type", counterparty_type, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("inn", sa.String(length=12), nullable=True),
        sa.Column("phone", sa.String(length=32), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_counterparties_inn"), "counterparties", ["inn"], unique=False)
    op.create_index(op.f("ix_counterparties_name"), "counterparties", ["name"], unique=False)
    op.create_index(op.f("ix_counterparties_type"), "counterparties", ["type"], unique=False)

    op.create_table(
        "vehicles",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("carrier_id", sa.UUID(), nullable=False),
        sa.Column("plate_number", sa.String(length=16), nullable=False),
        sa.Column("brand", sa.String(length=128), nullable=True),
        sa.Column("capacity_kg", sa.Float(), nullable=True),
        sa.Column("volume_m3", sa.Float(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["carrier_id"], ["counterparties.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_vehicles_plate_number"), "vehicles", ["plate_number"], unique=False)

    op.create_table(
        "orders",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("number", sa.String(length=32), nullable=False),
        sa.Column("client_id", sa.UUID(), nullable=False),
        sa.Column("carrier_id", sa.UUID(), nullable=True),
        sa.Column("vehicle_id", sa.UUID(), nullable=True),
        sa.Column("status", order_status, nullable=False),
        sa.Column("origin", sa.String(length=255), nullable=False),
        sa.Column("destination", sa.String(length=255), nullable=False),
        sa.Column("load_date", sa.Date(), nullable=False),
        sa.Column("unload_date", sa.Date(), nullable=False),
        sa.Column("cargo_weight_kg", sa.Float(), nullable=True),
        sa.Column("cargo_volume_m3", sa.Float(), nullable=True),
        sa.Column("client_rate", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("carrier_rate", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["carrier_id"], ["counterparties.id"]),
        sa.ForeignKeyConstraint(["client_id"], ["counterparties.id"]),
        sa.ForeignKeyConstraint(["vehicle_id"], ["vehicles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_orders_load_date"), "orders", ["load_date"], unique=False)
    op.create_index(op.f("ix_orders_number"), "orders", ["number"], unique=True)
    op.create_index(op.f("ix_orders_status"), "orders", ["status"], unique=False)

    op.create_table(
        "order_status_history",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("order_id", sa.UUID(), nullable=False),
        sa.Column("from_status", order_status, nullable=True),
        sa.Column("to_status", order_status, nullable=False),
        sa.Column(
            "changed_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("order_status_history")
    op.drop_index(op.f("ix_orders_status"), table_name="orders")
    op.drop_index(op.f("ix_orders_number"), table_name="orders")
    op.drop_index(op.f("ix_orders_load_date"), table_name="orders")
    op.drop_table("orders")
    op.drop_index(op.f("ix_vehicles_plate_number"), table_name="vehicles")
    op.drop_table("vehicles")
    op.drop_index(op.f("ix_counterparties_type"), table_name="counterparties")
    op.drop_index(op.f("ix_counterparties_name"), table_name="counterparties")
    op.drop_index(op.f("ix_counterparties_inn"), table_name="counterparties")
    op.drop_table("counterparties")

    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")

    order_status.drop(op.get_bind(), checkfirst=True)
    user_role.drop(op.get_bind(), checkfirst=True)
    counterparty_type.drop(op.get_bind(), checkfirst=True)
