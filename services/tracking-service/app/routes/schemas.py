from __future__ import annotations

from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field

class ShipmentEventOut(BaseModel):
    id: int
    event_type: str
    shipment_id: int | None = None
    reference: str | None = None
    payload_json: Any | None = None
    created_at: datetime

class PaginatedEvents(BaseModel):
    total: int
    limit: int
    offset: int
    items: list[ShipmentEventOut] = Field(default_factory=list)