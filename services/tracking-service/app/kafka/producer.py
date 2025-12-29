import os, json
from aiokafka import AIOKafkaProducer

KAFKA_BROKERS = os.getenv("KAFKA_BROKERS", "localhost:9092")
DLQ_TOPIC = os.getenv("KAFKA_TOPIC_SHIPMENT_CREATED_DLQ", "shipment.created.dlq")

producer: AIOKafkaProducer | None = None

async def start_producer():
    global producer
    producer = AIOKafkaProducer(bootstrap_servers=KAFKA_BROKERS)
    await producer.start()

async def stop_producer():
    global producer
    if producer:
        await producer.stop()
        producer = None

async def send_to_dlq(original_payload: dict, reason: str):
    if not producer:
        raise RuntimeError("DLQ producer not started")

    msg = {"reason": reason, "original_payload": original_payload}
    await producer.send_and_wait(DLQ_TOPIC, json.dumps(msg).encode("utf-8"))