import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from dotenv import load_dotenv

from app.routes.events import router as events_router
from app.kafka.consumer import start_consumer
from app.kafka.producer import start_producer, stop_producer

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await start_producer()

    consumer_task = asyncio.create_task(start_consumer())
    app.state.consumer_task = consumer_task

    try:
        yield
    finally:
        consumer_task.cancel()
        try:
            await consumer_task
        except asyncio.CancelledError:
            pass

        await stop_producer()


app = FastAPI(title="Tracking Service", lifespan=lifespan)
app.include_router(events_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "tracking-service"}