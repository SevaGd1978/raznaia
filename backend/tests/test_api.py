import os
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["SECRET_KEY"] = "test-secret"

from app.database import Base, get_db
from app.main import app

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(setup_db):
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_health(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_order_happy_path(client):
    client_resp = client.post(
        "/api/v1/clients",
        json={"name": "Test Client", "inn": "1234567890"},
    )
    assert client_resp.status_code == 201
    client_id = client_resp.json()["id"]

    carrier_resp = client.post(
        "/api/v1/carriers",
        json={"name": "Test Carrier", "inn": "9876543210"},
    )
    carrier_id = carrier_resp.json()["id"]

    today = date.today()
    order_resp = client.post(
        "/api/v1/orders",
        json={
            "client_id": client_id,
            "origin": "Moscow",
            "destination": "SPB",
            "load_date": today.isoformat(),
            "unload_date": (today + timedelta(days=1)).isoformat(),
            "client_rate": "50000.00",
            "carrier_rate": "40000.00",
        },
    )
    assert order_resp.status_code == 201
    order = order_resp.json()
    assert order["number"].startswith("TT-")
    assert order["margin"] == "10000.00"

    status_resp = client.patch(
        f"/api/v1/orders/{order['id']}/status",
        json={"status": "confirmed"},
    )
    assert status_resp.status_code == 200
    assert status_resp.json()["status"] == "confirmed"


def test_invalid_status_transition(client):
    client_id = client.post("/api/v1/clients", json={"name": "C"}).json()["id"]
    today = date.today()
    order_id = client.post(
        "/api/v1/orders",
        json={
            "client_id": client_id,
            "origin": "A",
            "destination": "B",
            "load_date": today.isoformat(),
            "unload_date": today.isoformat(),
        },
    ).json()["id"]

    response = client.patch(
        f"/api/v1/orders/{order_id}/status",
        json={"status": "in_transit"},
    )
    assert response.status_code == 422
