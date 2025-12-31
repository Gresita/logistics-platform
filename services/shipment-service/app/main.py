from contextlib import asynccontextmanager

from fastapi import FastAPI
from dotenv import load_dotenv
from app.routes import shipment_logs
from app.routes.shipments import router as shipments_router
from app.kafka.producer import start_producer, stop_producer
from app.routes import shipment_logs
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await start_producer()
    try:
        yield
    finally:
        await stop_producer()


app = FastAPI(title="Shipment Service", lifespan=lifespan)
app.include_router(shipments_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "shipment-service"}


app.include_router(shipment_logs.router)
