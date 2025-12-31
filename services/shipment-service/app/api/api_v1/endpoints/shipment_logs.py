import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.dependencies import require_role, get_db
from app.db.models import Shipment, ShipmentLog
from app.kafka.producer import publish_shipment_created

router = APIRouter(prefix="/shipments", tags=["shipments"])

class CreateShipmentRequest(BaseModel):
    tracking_number: str | None = None
    origin: str = Field(..., min_length=2, max_length=100)
    destination: str = Field(..., min_length=2, max_length=100)
    status: str = Field(default="CREATED", min_length=2, max_length=30)


@router.post("", dependencies=[Depends(require_role(["admin", "user"]))])
async def create_shipment(body: CreateShipmentRequest, db: Session = Depends(get_db)):
    tn = body.tracking_number or f"TRK-{uuid.uuid4().hex[:10].upper()}"

    shipment = Shipment(
        tracking_number=tn,
        origin=body.origin,
        destination=body.destination,
        status=body.status,
    )
    db.add(shipment)
    db.commit()
    db.refresh(shipment)

    # Krijo log inicial
    log = ShipmentLog(shipment_id=shipment.id, status=shipment.status)
    db.add(log)
    db.commit()

    # Publish event te Kafka (tracking-service,
    # perputhet me `reference` me tracking_number)
    await publish_shipment_created(
        {
            "id": shipment.id,
            "tracking_number": shipment.tracking_number,
            "reference": shipment.tracking_number,
            "origin": shipment.origin,
            "destination": shipment.destination,
            "status": shipment.status,
        }
    )

    return {
        "id": shipment.id,
        "tracking_number": shipment.tracking_number,
        "origin": shipment.origin,
        "destination": shipment.destination,
        "status": shipment.status,
    }

@router.delete("/{shipment_id}", dependencies=[Depends(require_role(["admin"]))])
async def delete_shipment(shipment_id: int, db: Session = Depends(get_db)):
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if shipment is None:
        raise HTTPException(status_code=404, detail="Shipment not found")
    db.delete(shipment)
    db.commit()
    return {"detail": "Shipment deleted"}