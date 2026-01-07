from __future__ import annotations

import os
import struct
import json
from io import BytesIO
from typing import Any, Optional

import httpx
from fastavro import parse_schema, schemaless_reader

SCHEMA_REGISTRY_URL = os.getenv("SCHEMA_REGISTRY_URL", "http://127.0.0.1:8081")
_schema_by_id_cache: dict[int, Any] = {}


def _get_schema_by_id(schema_id: int) -> Any:
    if schema_id in _schema_by_id_cache:
        return _schema_by_id_cache[schema_id]

    url = f"{SCHEMA_REGISTRY_URL}/schemas/ids/{schema_id}"
    with httpx.Client(timeout=5.0) as client:
        r = client.get(url)
        r.raise_for_status()
        schema_str = r.json()["schema"]

    parsed = parse_schema(json.loads(schema_str))
    _schema_by_id_cache[schema_id] = parsed
    return parsed


def decode_confluent(data: bytes) -> Optional[dict[str, Any]]:
    if not data or len(data) < 5:
        return None
    if data[0] != 0:
        return None

    schema_id = struct.unpack(">I", data[1:5])[0]
    schema = _get_schema_by_id(schema_id)
    bio = BytesIO(data[5:])
    return schemaless_reader(bio, schema)
