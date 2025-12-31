"""add shipment_logs table

Revision ID: a2132ceb608b
Revises: 02e644281c92
Create Date: 2025-12-31 07:37:30.288869

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a2132ceb608b'
down_revision: Union[str, Sequence[str], None] = '02e644281c92'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table(
        'shipment_logs',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('shipment_id', sa.Integer, sa.ForeignKey('shipments.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(30), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

def downgrade() -> None:
    op.drop_table('shipment_logs')