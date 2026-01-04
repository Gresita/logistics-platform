from fastapi import FastAPI
from app.api.shipments import router as shipments_router

app = FastAPI()
app.include_router(shipments_router)
