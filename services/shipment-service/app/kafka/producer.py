import os
import json
from typing import Any

from aiokafka import AIOKafkaProducer

KAFKA_BROKERS = os.getenv("KAFKA_BROKERS", "127.0.0.1:9092")
TOPIC = os.getenv("KAFKA_TOPIC_SHIPMENT_CREATED", "shipment.created")

_producer: AIOKafkaProducer | None = None


async def start_producer() -> None:
    """Start Kafka producer once (idempotent)."""
    global _producer
    if _producer is None:
        _producer = AIOKafkaProducer(bootstrap_servers=KAFKA_BROKERS)
        await _producer.start()


async def stop_producer() -> None:
    """Stop Kafka producer if running (idempotent)."""
    global _producer
    if _producer is not None:
        await _producer.stop()
        _producer = None


async def publish_shipment_created(payload: dict[str, Any]) -> None:
    """
    Publish shipment.created event.
    Requires producer to be started by app lifespan/startup.
    """
    if _producer is None:
        raise RuntimeError("Kafka producer not started. Ensure start_producer() runs on app startup.")
    await _producer.send_and_wait(TOPIC, json.dumps(payload).encode("utf-8"))