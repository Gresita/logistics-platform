import requests
import time

SHIPMENT = "http://127.0.0.1:4001"
TRACKING = "http://127.0.0.1:4002"

def test_health():
    assert requests.get(f"{SHIPMENT}/health", timeout=5).status_code == 200
    assert requests.get(f"{TRACKING}/health", timeout=5).status_code == 200

def test_e2e_create_shipment_creates_tracking_event():
    token_resp = requests.post(
        f"{SHIPMENT}/api/v1/auth/token",
        data={"username": "admin", "password": "admin123"},
        timeout=10,
    )
    assert token_resp.status_code == 200
    token = token_resp.json()["access_token"]

    payload = {"reference": "PYTEST-1", "origin": "Prishtina", "destination": "Tirana", "status": "CREATED"}
    create_resp = requests.post(
        f"{SHIPMENT}/shipments",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
        timeout=10,
    )
    assert create_resp.status_code == 200
    shipment_id = create_resp.json()["id"]

    time.sleep(2)

    events_resp = requests.get(f"{TRACKING}/events?limit=50&offset=0", timeout=10)
    assert events_resp.status_code == 200
    data = events_resp.json()
    assert "items" in data
    assert any(item.get("shipment_id") == shipment_id for item in data["items"])