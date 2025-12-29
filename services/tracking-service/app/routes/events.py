from fastapi import APIRouter
from sqlalchemy import select, desc
from app.db.session import SessionLocal
from app.db.models import ShipmentEvent

router = APIRouter(prefix="/events", tags=["events"])

@router.get("")
def list_events(limit: int = 50):
    db = SessionLocal()
    try:
        q = select(ShipmentEvent).order_by(desc(ShipmentEvent.id)).limit(limit)
        rows = db.execute(q).scalars().all()
        return [
            {
                "id": r.id,
                "event_type": r.event_type,
                "shipment_id": r.shipment_id,
                "reference": r.reference,
                "created_at": str(r.created_at),
            }
            for r in rows
        ]
    finally:
        db.close()