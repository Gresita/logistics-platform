import os, json
from aiokafka import AIOKafkaProducer

KAFKA_BROKERS = os.getenv("KAFKA_BROKERS", "localhost:9092")
TOPIC = os.getenv("KAFKA_TOPIC_SHIPMENT_CREATED", "shipment.created")

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

async def publish_shipment_created(payload: dict):
    if not producer:
        raise RuntimeError("Kafka producer not started")
    await producer.send_and_wait(TOPIC, json.dumps(payload).encode("utf-8"))