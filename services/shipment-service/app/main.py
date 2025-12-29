import os
from fastapi import FastAPI
from dotenv import load_dotenv

from app.routes.shipments import router as shipments_router
from app.kafka.producer import start_producer, stop_producer

load_dotenv()

app = FastAPI(title="Shipment Service")

@app.on_event("startup")
async def on_startup():
    await start_producer()

@app.on_event("shutdown")
async def on_shutdown():
    await stop_producer()

app.include_router(shipments_router)

@app.get("/health")
def health():
    return {"status": "ok", "service": "shipment-service"}