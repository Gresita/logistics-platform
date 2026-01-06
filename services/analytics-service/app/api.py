from __future__ import annotations

import os
from datetime import datetime, timezone
from fastapi import APIRouter, Query
from sqlalchemy import select

from app.db import SessionLocal
from app.models import ShipmentState, Anomaly, RouteStats

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])

NO_UPDATE_HOURS = float(os.getenv("NO_UPDATE_HOURS", "6"))

def _now_utc_naive():
    return datetime.now(timezone.utc).replace(tzinfo=None)

def compute_risk(s: ShipmentState):
    now = _now_utc_naive()
    hours = (now - s.last_ts).total_seconds() / 3600.0
    status = (s.last_status or "").upper()

    risk = 0
    if status == "IN_TRANSIT":
        if hours >= NO_UPDATE_HOURS:
            risk = min(100, 60 + int((hours - NO_UPDATE_HOURS) * 10))
        else:
            risk = min(50, int(hours * (50 / NO_UPDATE_HOURS)))
    elif status == "DELAYED":
        risk = 85
    elif status in ("DELIVERED", "CANCELLED"):
        risk = 0
    else:
        risk = min(20, int(hours * 2))

    level = "LOW" if risk < 40 else ("MEDIUM" if risk < 75 else "HIGH")
    return {
        "risk_score": risk,
        "risk_level": level,
        "hours_since_last_update": round(hours, 2),
        "status": status,
    }

@router.get("/shipments/{shipment_id}/risk")
def get_risk(shipment_id: int):
    db = SessionLocal()
    try:
        s = db.get(ShipmentState, shipment_id)
        if not s:
            return {"shipment_id": shipment_id, "found": False}
        out = compute_risk(s)
        out["shipment_id"] = shipment_id
        out["found"] = True
        return out
    finally:
        db.close()

@router.get("/anomalies")
def list_anomalies(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    unresolved_only: bool = True,
):
    db = SessionLocal()
    try:
        q = select(Anomaly).order_by(Anomaly.id.desc())
        if unresolved_only:
            q = q.where(Anomaly.resolved == False)  # noqa
        rows = db.execute(q.offset(offset).limit(limit)).scalars().all()
        return {
            "items": [
                {
                    "id": a.id,
                    "shipment_id": a.shipment_id,
                    "type": a.type,
                    "severity": a.severity,
                    "message": a.message,
                    "created_at": a.created_at.isoformat(),
                    "resolved": a.resolved,
                }
                for a in rows
            ],
            "limit": limit,
            "offset": offset,
        }
    finally:
        db.close()

@router.get("/at-risk")
def at_risk(
    min_score: int = Query(75, ge=0, le=100),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    db = SessionLocal()
    try:
        rows = db.execute(select(ShipmentState).order_by(ShipmentState.shipment_id.desc())).scalars().all()
        scored = []
        for s in rows:
            r = compute_risk(s)
            if r["risk_score"] >= min_score:
                scored.append({
                    "shipment_id": s.shipment_id,
                    "origin": s.origin,
                    "destination": s.destination,
                    "assigned_to": s.assigned_to,
                    "last_status": s.last_status,
                    "last_ts": s.last_ts.isoformat(),
                    **r,
                })

        scored.sort(key=lambda x: (x["risk_score"], x["last_ts"]), reverse=True)
        return {
            "items": scored[offset:offset + limit],
            "total": len(scored),
            "limit": limit,
            "offset": offset,
            "min_score": min_score,
        }
    finally:
        db.close()


@router.get("/summary")
def summary():
    db = SessionLocal()
    try:
        states = db.execute(select(ShipmentState)).scalars().all()
        in_transit = [s for s in states if (s.last_status or "").upper() == "IN_TRANSIT"]

        at_risk_count = 0
        for s in states:
            if compute_risk(s)["risk_score"] >= 75:
                at_risk_count += 1

        unresolved = db.execute(select(Anomaly).where(Anomaly.resolved == False)).scalars().all()  # noqa

        return {
            "shipments_total": len(states),
            "in_transit": len(in_transit),
            "at_risk": at_risk_count,
            "unresolved_anomalies": len(unresolved),
            "no_update_hours_threshold": NO_UPDATE_HOURS,
        }
    finally:
        db.close()

@router.get("/shipments/{shipment_id}/eta")
def get_eta(shipment_id: int):
    db = SessionLocal()
    try:
        s = db.get(ShipmentState, shipment_id)
        if not s:
            return {"shipment_id": shipment_id, "found": False}

        if not s.origin or not s.destination:
            return {"shipment_id": shipment_id, "found": True, "has_route": False}

        rs = (
            db.execute(
                select(RouteStats).where(
                    RouteStats.origin == s.origin,
                    RouteStats.destination == s.destination,
                )
            ).scalars().first()
        )

        if not rs or rs.samples < 1:
            return {
                "shipment_id": shipment_id,
                "found": True,
                "has_route": True,
                "eta_available": False,
                "reason": "Not enough historical delivered samples for this route",
            }

        expected_hours = float(rs.mean_hours)
        out = {
            "shipment_id": shipment_id,
            "found": True,
            "has_route": True,
            "eta_available": True,
            "expected_hours": round(expected_hours, 2),
            "samples": rs.samples,
        }

        if s.created_ts:
            now = _now_utc_naive()
            elapsed_h = (now - s.created_ts).total_seconds() / 3600.0
            out["elapsed_hours"] = round(elapsed_h, 2)
            out["overdue"] = elapsed_h > expected_hours
        return out
    finally:
        db.close()

