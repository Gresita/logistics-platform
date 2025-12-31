"""create users table

Revision ID: d74be4f52c44
Revises: ccba1ccd3794
Create Date: 2025-12-31 07:58:51.830855

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd74be4f52c44'
down_revision: Union[str, Sequence[str], None] = 'ccba1ccd3794'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None





def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("username", sa.String(64), unique=True, nullable=False),
        sa.Column("hashed_password", sa.String(128), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("users")
