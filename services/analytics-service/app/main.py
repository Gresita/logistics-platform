from __future__ import annotations

import os
import asyncio
from datetime import datetime, timezone

from fastapi import FastAPI
from app.observability import setup_observability
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.db import engine, SessionLocal
from app.models import Base, ShipmentState, Anomaly, StatusBucket, RouteStats
from app.api import router as analytics_router
from app.kafka_consumer import run_consumer

NO_UPDATE_HOURS = float(os.getenv("NO_UPDATE_HOURS", "6"))
ANOMALY_INTERVAL_SECONDS = int(os.getenv("ANOMALY_INTERVAL_SECONDS", "300"))

def _now_utc_naive():
    return datetime.now(timezone.utc).replace(tzinfo=None)

async def anomaly_loop(stop_event: asyncio.Event):
    while not stop_event.is_set():
        try:
            _scan_no_update()
        except Exception:
            pass
        await asyncio.sleep(ANOMALY_INTERVAL_SECONDS)

def _scan_no_update():
    now = _now_utc_naive()
    db = SessionLocal()
    try:
        rows = db.execute(select(ShipmentState)).scalars().all()
        for s in rows:
            if (s.last_status or "").upper() != "IN_TRANSIT":
                continue

            hours = (now - s.last_ts).total_seconds() / 3600.0
            if hours < NO_UPDATE_HOURS:
                continue

            existing = db.execute(
                select(Anomaly).where(
                    Anomaly.shipment_id == s.shipment_id,
                    Anomaly.type == "NO_UPDATE",
                    Anomaly.resolved == False,  # noqa
                )
            ).scalars().first()

            if existing:
                continue

            sev = "HIGH" if hours >= (NO_UPDATE_HOURS * 2) else "MEDIUM"
            msg = f"No updates for {hours:.1f}h while IN_TRANSIT (threshold {NO_UPDATE_HOURS}h)"
            db.add(
                Anomaly(
                    shipment_id=s.shipment_id,
                    type="NO_UPDATE",
                    severity=sev,
                    message=msg,
                    created_at=now,
                    resolved=False,
                )
            )

        db.commit()
    finally:
        db.close()

app = FastAPI(title="analytics-service")
setup_observability(app, "analytics-service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(analytics_router)

@app.on_event("startup")
async def _startup():
    Base.metadata.create_all(bind=engine)
    app.state.stop_event = asyncio.Event()
    app.state.consumer_task = asyncio.create_task(run_consumer(app.state.stop_event))
    app.state.anomaly_task = asyncio.create_task(anomaly_loop(app.state.stop_event))

@app.on_event("shutdown")
async def _shutdown():
    app.state.stop_event.set()
    for t in [getattr(app.state, "consumer_task", None), getattr(app.state, "anomaly_task", None)]:
        if t:
            t.cancel()

def _scan_no_progress():
    """
    Anomaly: shipment stuck in CREATED for too long.
    """
    now = _now_utc_naive()
    db = SessionLocal()
    try:
        rows = db.execute(select(ShipmentState)).scalars().all()
        for s in rows:
            if (s.last_status or "").upper() != "CREATED":
                continue
            if s.created_ts is None:
                continue

            hours = (now - s.created_ts).total_seconds() / 3600.0
            if hours < NO_PROGRESS_HOURS:
                continue

            existing = db.execute(
                select(Anomaly).where(
                    Anomaly.shipment_id == s.shipment_id,
                    Anomaly.type == "NO_PROGRESS",
                    Anomaly.resolved == False,  # noqa
                )
            ).scalars().first()
            if existing:
                continue

            msg = f"Still CREATED for {hours:.1f}h (threshold {NO_PROGRESS_HOURS}h)"
            db.add(Anomaly(
                shipment_id=s.shipment_id,
                type="NO_PROGRESS",
                severity="MEDIUM",
                message=msg,
                created_at=now,
                resolved=False,
            ))
        db.commit()
    finally:
        db.close()


def _scan_delayed_spike():
    """
    Spike detector on DELAYED status changes using 5-min buckets.
    Compares last bucket count vs mean of previous baseline buckets.
    """
    now = _now_utc_naive()
    db = SessionLocal()
    try:
        # get latest DELAYED buckets (need baseline+1)
        buckets = (
            db.query(StatusBucket)
              .filter(StatusBucket.status == "DELAYED")
              .order_by(StatusBucket.bucket_start.desc())
              .limit(SPIKE_BASELINE_BUCKETS + 1)
              .all()
        )
        if len(buckets) < (SPIKE_BASELINE_BUCKETS + 1):
            return

        latest = buckets[0]
        baseline = buckets[1:]

        mean = sum(b.count for b in baseline) / max(1, len(baseline))
        if mean <= 0:
            return

        if latest.count >= mean * SPIKE_MULTIPLIER and latest.count >= 3:
            # create global anomaly (shipment_id=0) to show in UI
            existing = db.execute(
                select(Anomaly).where(
                    Anomaly.shipment_id == 0,
                    Anomaly.type == "DELAYED_SPIKE",
                    Anomaly.resolved == False,  # noqa
                )
            ).scalars().first()
            if existing:
                return

            msg = f"DELAYED spike: {latest.count} events in 5-min bucket (baseline mean {mean:.2f})"
            db.add(Anomaly(
                shipment_id=0,
                type="DELAYED_SPIKE",
                severity="HIGH",
                message=msg,
                created_at=now,
                resolved=False,
            ))
            db.commit()
    finally:
        db.close()

@app.get("/health")
def health():
    return {"status": "ok", "service": "analytics-service"}

