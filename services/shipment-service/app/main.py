from contextlib import asynccontextmanager
import asyncio
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.api.shipments import router as shipments_router
from app.routes.shipment_logs import router as shipment_logs_router
from app.api.api_v1.endpoints import auth, admin
from app.kafka.producer import start_producer, stop_producer
from app.core.seed import ensure_admin_user
from app.observability import setup_observability

load_dotenv()

logger = logging.getLogger("shipment-service")


async def start_producer_with_retry(max_retries: int = 10, delay_seconds: int = 2) -> bool:
    """
    Retry Kafka producer startup. If Kafka is down, don't crash the API.
    Returns True if producer started, False otherwise (degraded mode).
    """
    for i in range(max_retries):
        try:
            await start_producer()
            logger.info("Kafka producer started")
            return True
        except Exception as e:
            logger.warning("Kafka not ready (%s). retry %s/%s", e, i + 1, max_retries)
            await asyncio.sleep(delay_seconds)

    logger.error("Kafka unavailable. Starting API without producer (degraded mode).")
    return False


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_admin_user()

    producer_started = await start_producer_with_retry()
    app.state.kafka_producer_started = producer_started

    try:
        yield
    finally:
        # stop only if it actually started (avoid errors on shutdown)
        if getattr(app.state, "kafka_producer_started", False):
            await stop_producer()


app = FastAPI(
    title="Shipment Service",
    lifespan=lifespan
)
setup_observability(app, "shipment-service")


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(shipments_router)
app.include_router(shipment_logs_router)
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(admin.router, prefix="/api/v1", tags=["admin"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "shipment-service"}