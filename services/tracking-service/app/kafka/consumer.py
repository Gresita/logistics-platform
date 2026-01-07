import os
import json
import asyncio
from aiokafka import AIOKafkaConsumer
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models import ShipmentEvent
from app.kafka.producer import send_to_dlq
from app.kafka.avro_codec import decode_confluent

KAFKA_BROKERS = os.getenv("KAFKA_BROKERS", "127.0.0.1:9092")
TOPIC = os.getenv("KAFKA_TOPIC_SHIPMENT_CREATED", "shipment.created")
DLQ_MAX_RETRIES = int(os.getenv("DLQ_MAX_RETRIES", "3"))
GROUP = os.getenv("KAFKA_CONSUMER_GROUP", "tracking-service")


async def start_consumer():
    consumer = AIOKafkaConsumer(
        TOPIC,
        bootstrap_servers=KAFKA_BROKERS,
        group_id=GROUP,
        enable_auto_commit=False,
        auto_offset_reset="earliest",
        session_timeout_ms=30000,
        heartbeat_interval_ms=3000,
    )

    try:
        await consumer.start()

        async for msg in consumer:
            raw_str = msg.value.decode("utf-8", errors="replace")
            try:
                payload = json.loads(raw_str)
            except Exception as e:
                await send_to_dlq(None, f"JSON decode error: {e}", raw_value=raw_str)
                await consumer.commit()
                continue

            last_error = None
            for attempt in range(1, DLQ_MAX_RETRIES + 1):
                try:
                    await asyncio.to_thread(_store_event, payload)
                    await consumer.commit()
                    last_error = None
                    break
                except Exception as e:
                    last_error = str(e)
                    await asyncio.sleep(0.5 * attempt)

            if last_error:
                await send_to_dlq(
                    payload,
                    f"processing failed after {DLQ_MAX_RETRIES} retries: {last_error}",
                    raw_value=raw_str,
                )
                await consumer.commit()

    except asyncio.CancelledError:
        # lejo shutdown graceful
        raise
    finally:
        try:
            await consumer.stop()
        except Exception:
            pass


def _store_event(payload: dict):
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
