from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import SessionLocal
from app.db.models import ShipmentLog
from app.routes.schemas import ShipmentLogOut
from pydantic import BaseModel

router = APIRouter(prefix="/shipment-logs", tags=["shipment-logs"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/{shipment_id}", response_model=List[ShipmentLogOut])
def get_shipment_logs(shipment_id: int, db: Session = Depends(get_db)):
    logs = db.query(ShipmentLog).filter(ShipmentLog.shipment_id == shipment_id).order_by(ShipmentLog.timestamp.asc()).all()
    if not logs:
        raise HTTPException(status_code=404, detail="No logs found for shipment")
    return logs

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ShipmentLogOut(BaseModel):
    id: int
    shipment_id: int
    status: str
    timestamp: str

    class Config:
        orm_mode = True

@router.get("/{shipment_id}", response_model=List[ShipmentLogOut])
def get_logs(shipment_id: int, db: Session = Depends(get_db)):
    logs = db.query(ShipmentLog).filter(ShipmentLog.shipment_id == shipment_id).order_by(ShipmentLog.timestamp.asc()).all()
    if not logs:
        raise HTTPException(status_code=404, detail="No logs found for shipment")
    return logs