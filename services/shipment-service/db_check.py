from sqlalchemy import text
from app.db.session import engine

with engine.connect() as conn:
    tables = conn.execute(text("SHOW TABLES")).fetchall()
    print("Tables:", tables)

    try:
        cols = conn.execute(text("DESCRIBE shipments")).fetchall()
        print("\nshipments columns:")
        for c in cols:
            print(c)
    except Exception as e:
        print("\nNo shipments table (or cannot describe):", e)

    try:
        ver = conn.execute(text("SELECT version_num FROM alembic_version")).fetchall()
        print("\nalembic_version:", ver)
    except Exception as e:
        print("\nNo alembic_version table:", e)