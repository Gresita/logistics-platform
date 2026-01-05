from contextlib import asynccontextmanager

from fastapi import FastAPI
from dotenv import load_dotenv
from app.routes import shipment_logs
from app.api.shipments import router as shipments_router
from app.routes.shipment_logs import router as shipment_logs_router
from app.kafka.producer import start_producer, stop_producer
from app.routes import shipment_logs
from app.api.api_v1.endpoints import auth
from app.core.seed import ensure_admin_user
from fastapi.middleware.cors import CORSMiddleware
load_dotenv()

app = FastAPI(title="Shipment Service")
app = FastAPI()
app.include_router(shipments_router)
app.include_router(shipment_logs_router)
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