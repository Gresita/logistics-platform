# app/routes/shipment_logs.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import require_role, get_db
from app.db.models import ShipmentLog

router = APIRouter(prefix="/shipment-logs", tags=["shipment-logs"])

@router.get("/{shipment_id}", dependencies=[Depends(require_role(["admin", "user", "shipman"]))])
async def list_shipment_logs(
    shipment_id: int,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(ShipmentLog)
        .filter(ShipmentLog.shipment_id == shipment_id)
        .order_by(ShipmentLog.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [{"id": r.id, "shipment_id": r.shipment_id, "status": r.status, "timestamp": r.timestamp} for r in rows]