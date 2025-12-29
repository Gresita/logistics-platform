import uuid
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import SessionLocal, engine
from app.db.models import Base, Shipment
from app.kafka.producer import publish_shipment_created

router = APIRouter(prefix="/shipments", tags=["shipments"])

# Krijo tabelat (për MVP; më vonë e bëjmë me Alembic migrations)
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class CreateShipmentRequest(BaseModel):
    reference: str | None = None

@router.post("")
async def create_shipment(body: CreateShipmentRequest, db: Session = Depends(get_db)):
    ref = body.reference or str(uuid.uuid4())[:8]

    shipment = Shipment(reference=ref, status="CREATED")
    db.add(shipment)
    db.commit()
    db.refresh(shipment)

    await publish_shipment_created({
        "id": shipment.id,
        "reference": shipment.reference,
        "status": shipment.status
    })

    return {"id": shipment.id, "reference": shipment.reference, "status": shipment.status}