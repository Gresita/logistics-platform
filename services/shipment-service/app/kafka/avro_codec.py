from __future__ import annotations

import os
import struct
from io import BytesIO
from pathlib import Path
from typing import Any, Optional

import httpx
from fastavro import parse_schema, schemaless_reader, schemaless_writer

SCHEMA_REGISTRY_URL = os.getenv("SCHEMA_REGISTRY_URL", "http://127.0.0.1:8081")

_schema_id_cache: dict[str, int] = {}
_schema_by_id_cache: dict[int, dict] = {}
_parsed_schema_cache: dict[str, Any] = {}


def _find_schema_dir() -> Path:
    p = Path(__file__).resolve()
    for parent in p.parents:
        d = parent / "schemas"
        if d.exists() and d.is_dir():
            return d
    # fallback: repo root is usually .../logistics-platform
    return Path.cwd() / "schemas"


def load_schema_text(filename: str) -> str:
    schema_dir = _find_schema_dir()
    f = schema_dir / filename
    return f.read_text(encoding="utf-8")


def register_schema(subject: str, schema_str: str) -> int:
    if subject in _schema_id_cache:
        return _schema_id_cache[subject]

    url = f"{SCHEMA_REGISTRY_URL}/subjects/{subject}/versions"
    with httpx.Client(timeout=5.0) as client:
        r = client.post(url, json={"schema": schema_str})
        r.raise_for_status()
        schema_id = int(r.json()["id"])
        _schema_id_cache[subject] = schema_id
        return schema_id


def _get_schema_by_id(schema_id: int) -> dict:
    if schema_id in _schema_by_id_cache:
        return _schema_by_id_cache[schema_id]

    url = f"{SCHEMA_REGISTRY_URL}/schemas/ids/{schema_id}"
    with httpx.Client(timeout=5.0) as client:
        r = client.get(url)
        r.raise_for_status()
        schema_str = r.json()["schema"]

    parsed = parse_schema(eval(schema_str) if schema_str.strip().startswith("{") is False else __import__("json").loads(schema_str))
    _schema_by_id_cache[schema_id] = parsed
    return parsed


def encode_confluent(subject: str, schema_filename: str, record: dict[str, Any]) -> bytes:
    schema_str = load_schema_text(schema_filename)
    schema_id = register_schema(subject, schema_str)

    if schema_filename not in _parsed_schema_cache:
        _parsed_schema_cache[schema_filename] = parse_schema(__import__("json").loads(schema_str))

    parsed = _parsed_schema_cache[schema_filename]
    bio = BytesIO()
    schemaless_writer(bio, parsed, record)
    payload = bio.getvalue()

    return b"\x00" + struct.pack(">I", schema_id) + payload


def decode_confluent(data: bytes) -> Optional[dict[str, Any]]:
    if not data or len(data) < 5:
        return None
    if data[0] != 0:
        return None

    schema_id = struct.unpack(">I", data[1:5])[0]
    parsed = _get_schema_by_id(schema_id)
    bio = BytesIO(data[5:])
    return schemaless_reader(bio, parsed)

