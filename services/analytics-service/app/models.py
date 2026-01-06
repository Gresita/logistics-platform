from __future__ import annotations

from datetime import datetime
from sqlalchemy import Boolean, DateTime, Integer, String, Text, Float
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class ShipmentState(Base):
    __tablename__ = "shipment_state"

    shipment_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    origin: Mapped[str | None] = mapped_column(String(100), nullable=True)
    destination: Mapped[str | None] = mapped_column(String(100), nullable=True)
    assigned_to: Mapped[int | None] = mapped_column(Integer, nullable=True)

    last_status: Mapped[str] = mapped_column(String(30), nullable=False, default="CREATED")
    last_ts: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    created_ts: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class Anomaly(Base):
    __tablename__ = "anomalies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    shipment_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(40), nullable=False)  # NO_UPDATE
    severity: Mapped[str] = mapped_column(String(10), nullable=False)  # LOW/MEDIUM/HIGH
    message: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    resolved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

class RouteStats(Base):
    __tablename__ = "route_stats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    origin: Mapped[str] = mapped_column(String(100), nullable=False)
    destination: Mapped[str] = mapped_column(String(100), nullable=False)

    samples: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    mean_hours: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    last_updated: Mapped[datetime] = mapped_column(DateTime, nullable=False)


class StatusBucket(Base):
    """
    Rolling bucket counter for spike detection.
    bucket_start is rounded to 5-min windows.
    """
    __tablename__ = "status_buckets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    bucket_start: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
