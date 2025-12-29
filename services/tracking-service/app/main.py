import asyncio
from fastapi import FastAPI
from dotenv import load_dotenv

from app.routes.events import router as events_router
from app.kafka.consumer import start_consumer
from app.kafka.producer import start_producer, stop_producer

load_dotenv()

app = FastAPI(title="Tracking Service")

@app.on_event("startup")
async def on_startup():
    await start_producer()
    asyncio.create_task(start_consumer())

@app.on_event("shutdown")
async def on_shutdown():
    await stop_producer()

app.include_router(events_router)

@app.get("/health")
def health():
    return {"status": "ok", "service": "tracking-service"}