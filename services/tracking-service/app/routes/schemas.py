from datetime import datetime
from pydantic import BaseModel


class ShipmentEventOut(BaseModel):
    id: int
    event_type: str
    shipment_id: int
    reference: str
    payload_json: str
    created_at: datetime


class PaginatedEvents(BaseModel):
    total: int
    limit: int
    offset: int
    items: list[ShipmentEventOut]