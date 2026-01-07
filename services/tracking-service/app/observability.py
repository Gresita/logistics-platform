from __future__ import annotations

import os
from fastapi import FastAPI

from prometheus_fastapi_instrumentator import Instrumentator

from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter


def setup_observability(app: FastAPI, service_name: str) -> None:
    # --- Prometheus metrics ---
    Instrumentator().instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)

    # --- OpenTelemetry tracing (OTLP -> Jaeger) ---
    enabled = os.getenv("OTEL_ENABLED", "true").lower() in ("1", "true", "yes")
    if not enabled:
        return

    # default: Jaeger all-in-one OTLP HTTP
    endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://127.0.0.1:4318/v1/traces")

    # avoid re-init in reload
    if isinstance(trace.get_tracer_provider(), TracerProvider):
        FastAPIInstrumentor.instrument_app(app)
        return

    resource = Resource.create({"service.name": service_name})
    provider = TracerProvider(resource=resource)
    exporter = OTLPSpanExporter(endpoint=endpoint)
    provider.add_span_processor(BatchSpanProcessor(exporter))
    trace.set_tracer_provider(provider)

    FastAPIInstrumentor.instrument_app(app)
