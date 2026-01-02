from contextlib import asynccontextmanager

from fastapi import FastAPI
from dotenv import load_dotenv
from app.routes import shipment_logs
from app.routes.shipments import router as shipments_router
from app.kafka.producer import start_producer, stop_producer
from app.routes import shipment_logs
from app.api.api_v1.endpoints import auth
from app.core.seed import ensure_admin_user
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_admin_user()
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
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])