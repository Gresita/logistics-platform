import os
import json
import time
import base64
import traceback
import logging
from typing import Optional
from aiokafka import AIOKafkaProducer

logger = logging.getLogger("dlq")

_DLQ_PRODUCER: Optional[AIOKafkaProducer] = None

def _brokers() -> str:
    return os.getenv("KAFKA_BROKERS", "")

def _dlq_topic() -> str:
    return os.getenv("KAFKA_DLQ_TOPIC", "shipment.events.dlq")

async def start_dlq_producer() -> None:
    global _DLQ_PRODUCER
    if _DLQ_PRODUCER is not None:
        return
    _DLQ_PRODUCER = AIOKafkaProducer(bootstrap_servers=_brokers())
    await _DLQ_PRODUCER.start()
    logger.info("DLQ producer started (topic=%s)", _dlq_topic())

async def stop_dlq_producer() -> None:
    global _DLQ_PRODUCER
    if _DLQ_PRODUCER is None:
        return
    await _DLQ_PRODUCER.stop()
    _DLQ_PRODUCER = None
    logger.info("DLQ producer stopped")

async def publish_to_dlq(msg, err: Exception) -> None:
    """
    Publikon në DLQ si JSON.
    raw_value_b64 ruan bytes origjinale (p.sh. Avro), pa humbje.
    """
    await start_dlq_producer()

    payload = {
        "failed_at_unix": int(time.time()),
        "source_topic": getattr(msg, "topic", None),
        "partition": getattr(msg, "partition", None),
        "offset": getattr(msg, "offset", None),
        "key": (msg.key.decode("utf-8", errors="ignore") if getattr(msg, "key", None) else None),
        "error": str(err),
        "traceback": traceback.format_exc(),
        "raw_value_b64": base64.b64encode(getattr(msg, "value", b"") or b"").decode("ascii"),
    }

    data = json.dumps(payload).encode("utf-8")
    await _DLQ_PRODUCER.send_and_wait(_dlq_topic(), data)
