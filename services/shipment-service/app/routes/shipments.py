import uuid
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models import Shipment
from app.kafka.producer import publish_shipment_created

router = APIRouter(prefix="/shipments", tags=["shipments"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class CreateShipmentRequest(BaseModel):
    tracking_number: str | None = None
    origin: str = Field(..., min_length=2, max_length=100)
    destination: str = Field(..., min_length=2, max_length=100)
    status: str = Field(default="CREATED", min_length=2, max_length=30)


@router.post("")
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

    # tracking-service e ruan reference -> e mbushim me tracking_number
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