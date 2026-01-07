import os
import json
from typing import Any

from aiokafka import AIOKafkaProducer

from app.kafka.avro_codec import encode_confluent

KAFKA_BROKERS = os.getenv("KAFKA_BROKERS") or os.getenv("KAFKA_BROKER") or "127.0.0.1:9092"

TOPIC_CREATED = os.getenv("KAFKA_TOPIC_SHIPMENT_CREATED", "shipment.created")
TOPIC_STATUS_CHANGED = os.getenv("KAFKA_TOPIC_SHIPMENT_STATUS_CHANGED", "shipment.status_changed")

USE_AVRO = os.getenv("KAFKA_USE_AVRO", "true").lower() in ("1", "true", "yes")

_producer: AIOKafkaProducer | None = None


async def start_producer() -> None:
    global _producer
    if _producer is None:
        _producer = AIOKafkaProducer(bootstrap_servers=KAFKA_BROKERS)
        await _producer.start()


async def stop_producer() -> None:
    global _producer
    if _producer is not None:
        await _producer.stop()
        _producer = None


async def publish_shipment_created(payload: dict[str, Any]) -> None:
    if _producer is None:
        raise RuntimeError("Kafka producer not started. Ensure start_producer() runs on app startup.")

    if USE_AVRO:
        try:
            # Confluent convention: <topic>-value
            data = encode_confluent(f"{TOPIC_CREATED}-value", "shipment.created.avsc", payload)
            await _producer.send_and_wait(TOPIC_CREATED, data)
            return
        except Exception:
            # fallback JSON (backward compatible)
            pass

    await _producer.send_and_wait(TOPIC_CREATED, json.dumps(payload).encode("utf-8"))


async def publish_shipment_status_changed(payload: dict[str, Any]) -> None:
    if _producer is None:
        raise RuntimeError("Kafka producer not started. Ensure start_producer() runs on app startup.")

    if USE_AVRO:
        try:
            data = encode_confluent(
                f"{TOPIC_STATUS_CHANGED}-value",
                "shipment.status_changed.avsc",
                payload,
            )
            await _producer.send_and_wait(TOPIC_STATUS_CHANGED, data)
            return
        except Exception as e:
            print("AVRO publish_shipment_status_changed failed:", repr(e))
            pass

    await _producer.send_and_wait(TOPIC_STATUS_CHANGED, json.dumps(payload).encode("utf-8"))
