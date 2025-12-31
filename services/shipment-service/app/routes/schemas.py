from pydantic import BaseModel
from datetime import datetime

class ShipmentLogOut(BaseModel):
    id: int
    shipment_id: int
    status: str
    timestamp: datetime

    class Config:
        orm_mode = True