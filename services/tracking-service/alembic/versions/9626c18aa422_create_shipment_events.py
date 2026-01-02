"""create shipment_events

Revision ID: 9626c18aa422
Revises:
Create Date: 2025-12-31 00:17:49.283457
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = "9626c18aa422"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "shipment_events",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("event_type", sa.String(length=255), nullable=False),
        sa.Column("shipment_id", sa.BigInteger(), nullable=True),
        sa.Column("reference", sa.String(length=255), nullable=True),
        sa.Column("payload_json", mysql.JSON(), nullable=True),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        mysql_engine="InnoDB",
    )


def downgrade() -> None:
    op.drop_table("shipment_events")