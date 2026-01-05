from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_role
from app.db.models import User

router = APIRouter()

class UpdateUserRoleRequest(BaseModel):
    role: str  # admin | user | shipman

@router.get("/admin/users", dependencies=[Depends(require_role(["admin"]))])
async def list_users(db: Session = Depends(get_db)):
    rows = db.query(User).order_by(User.id.asc()).all()
    return {"items": [{"id": u.id, "username": u.username, "role": u.role} for u in rows]}

@router.patch("/admin/users/{user_id}/role", dependencies=[Depends(require_role(["admin"]))])
async def update_user_role(user_id: int, body: UpdateUserRoleRequest, db: Session = Depends(get_db)):
    role = (body.role or "").lower().strip()
    if role not in ("admin", "user", "shipman"):
        raise HTTPException(status_code=400, detail="Invalid role")

    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    u.role = role
    db.commit()
    db.refresh(u)
    return {"id": u.id, "role": u.role}
