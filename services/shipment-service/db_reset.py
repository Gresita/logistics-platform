from sqlalchemy import text
from app.db.session import engine

DDL = [
    "DROP TABLE IF EXISTS alembic_version",
    "DROP TABLE IF EXISTS shipments",
]

with engine.begin() as conn:
    for stmt in DDL:
        conn.execute(text(stmt))

print("Dropped: alembic_version, shipments")