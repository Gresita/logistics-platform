import os, json, asyncio
from aiokafka import AIOKafkaConsumer
from sqlalchemy.orm import Session

from app.db.session import SessionLocal, engine
from app.db.models import Base, ShipmentEvent
from app.kafka.producer import send_to_dlq

Base.metadata.create_all(bind=engine)

KAFKA_BROKERS = os.getenv("KAFKA_BROKERS", "localhost:9092")
TOPIC = os.getenv("KAFKA_TOPIC_SHIPMENT_CREATED", "shipment.created")
GROUP = os.getenv("KAFKA_CONSUMER_GROUP", "tracking-service")

async def start_consumer():
    consumer = AIOKafkaConsumer(
        TOPIC,
        bootstrap_servers=KAFKA_BROKERS,
        group_id=GROUP,
        enable_auto_commit=False,
        auto_offset_reset="earliest",
    )
    await consumer.start()

    try:
        async for msg in consumer:
            payload = json.loads(msg.value.decode("utf-8"))

            max_attempts = 3
            last_error = None

            for attempt in range(1, max_attempts + 1):
                try:
                    _store_event(payload)
                    await consumer.commit()
                    last_error = None
                    break
                except Exception as e:
                    last_error = str(e)
                    await asyncio.sleep(0.5 * attempt)

            if last_error:
                await send_to_dlq(payload, last_error)
                await consumer.commit()

    finally:
        await consumer.stop()

def _store_event(payload: dict):
    # simulate poison message for DLQ testing
    if payload.get("reference") == "FAIL":
        raise ValueError("Simulated processing failure (DLQ test)")

    db: Session = SessionLocal()
    try:
        db.add(
            ShipmentEvent(
                event_type="shipment.created",
                shipment_id=int(payload["id"]),
                reference=str(payload.get("reference", "")),
                payload_json=json.dumps(payload),
            )
        )
        db.commit()
    finally:
        db.close()