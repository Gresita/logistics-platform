import os
from app.db.session import SessionLocal
from app.db.models import User
from app.core.security import get_password_hash

def ensure_admin_user() -> None:
    username = os.getenv("ADMIN_USERNAME", "admin")
    password = os.getenv("ADMIN_PASSWORD", "admin123")
    role = os.getenv("ADMIN_ROLE", "admin")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if user:
            return
        db.add(User(username=username, hashed_password=get_password_hash(password), role=role))
        db.commit()
    finally:
        db.close()