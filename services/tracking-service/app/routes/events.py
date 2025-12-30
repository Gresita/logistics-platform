from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Query, Depends
from sqlalchemy import select, desc, func
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models import ShipmentEvent
from app.routes.schemas import ShipmentEventOut, PaginatedEvents

router = APIRouter(prefix="/events", tags=["events"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _to_out(e: ShipmentEvent) -> ShipmentEventOut:
    return ShipmentEventOut(
        id=e.id,
        event_type=e.event_type,
        shipment_id=e.shipment_id,
        reference=e.reference,
        payload_json=e.payload_json,
        created_at=e.created_at,
    )


@router.get("", response_model=PaginatedEvents)
def list_events(
    shipment_id: Optional[int] = Query(default=None, ge=1),
    event_type: Optional[str] = Query(default=None, min_length=1, max_length=64),
    reference: Optional[str] = Query(default=None, min_length=1, max_length=64),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    # Base query with filters
    base = select(ShipmentEvent)

    if shipment_id is not None:
        base = base.where(ShipmentEvent.shipment_id == shipment_id)
    if event_type is not None:
        base = base.where(ShipmentEvent.event_type == event_type)
    if reference is not None:
        base = base.where(ShipmentEvent.reference == reference)

    # Total count (same filters)
    count_stmt = select(func.count()).select_from(base.subquery())
    total = db.execute(count_stmt).scalar_one()

    # Items
    items_stmt = base.order_by(desc(ShipmentEvent.id)).offset(offset).limit(limit)
    rows = db.execute(items_stmt).scalars().all()

    return PaginatedEvents(
        total=total,
        limit=limit,
        offset=offset,
        items=[_to_out(r) for r in rows],
    )


@router.get("/{event_id}", response_model=ShipmentEventOut)
def get_event(event_id: int, db: Session = Depends(get_db)):
    stmt = select(ShipmentEvent).where(ShipmentEvent.id == event_id)
    event = db.execute(stmt).scalars().first()
    # FastAPI automatikisht kthen 404 vetëm nëse e ngrisim vetë, por për thjeshtësi:
    if event is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Event not found")
    return _to_out(event)