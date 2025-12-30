import os, json
from aiokafka import AIOKafkaProducer

KAFKA_BROKERS = os.getenv("KAFKA_BROKERS", "127.0.0.1:9092")
DLQ_TOPIC = os.getenv("KAFKA_TOPIC_SHIPMENT_CREATED_DLQ", "shipment.created.dlq")

_producer: AIOKafkaProducer | None = None

async def start_producer():
    global _producer
    if _producer is None:
        _producer = AIOKafkaProducer(bootstrap_servers=KAFKA_BROKERS)
        await _producer.start()

async def stop_producer():
    global _producer
    if _producer is not None:
        await _producer.stop()
        _producer = None

async def send_to_dlq(payload: dict | None, error: str, raw_value: str | None = None):
    # ensure producer started
    if _producer is None:
        await start_producer()

    msg = {
        "error": error,
        "payload": payload,
        "raw_value": raw_value,
    }
    await _producer.send_and_wait(DLQ_TOPIC, json.dumps(msg).encode("utf-8"))