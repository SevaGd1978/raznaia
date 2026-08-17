import os
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["SECRET_KEY"] = "test-secret"

from app.services.auth import hash_password
from app.database import Base, get_db
from app.main import app
from app.models import User, UserRole

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
    admin = User(
        email="admin@test.local",
        password_hash=hash_password("testpass"),
        role=UserRole.ADMIN,
    )
    db.add(admin)
    db.commit()
    db.close()
    yield
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


@pytest.fixture
def auth_headers(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.local", "password": "testpass"},
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_health(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_login(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.local", "password": "testpass"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["access_token"]
    assert data["token_type"] == "bearer"


def test_login_invalid_credentials(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.local", "password": "wrong"},
    )
    assert response.status_code == 401


def test_auth_me(client, auth_headers):
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "admin@test.local"
    assert response.json()["role"] == "admin"


def test_auth_me_requires_auth(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_protected_route_requires_auth(client):
    response = client.get("/api/v1/clients")
    assert response.status_code == 401


def test_order_happy_path(client, auth_headers):
    client_resp = client.post(
        "/api/v1/clients",
        json={"name": "Test Client", "inn": "1234567890"},
        headers=auth_headers,
    )
    assert client_resp.status_code == 201
    client_id = client_resp.json()["id"]

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
        headers=auth_headers,
    )
    assert order_resp.status_code == 201
    order = order_resp.json()
    assert order["number"].startswith("TT-")
    assert order["margin"] == "10000.00"

    status_resp = client.patch(
        f"/api/v1/orders/{order['id']}/status",
        json={"status": "confirmed"},
        headers=auth_headers,
    )
    assert status_resp.status_code == 200
    assert status_resp.json()["status"] == "confirmed"


def test_invalid_status_transition(client, auth_headers):
    client_id = client.post(
        "/api/v1/clients",
        json={"name": "C"},
        headers=auth_headers,
    ).json()["id"]
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
        headers=auth_headers,
    ).json()["id"]

    response = client.patch(
        f"/api/v1/orders/{order_id}/status",
        json={"status": "in_transit"},
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_application_pdf(client, auth_headers):
    client_id = client.post(
        "/api/v1/clients",
        json={"name": "PDF Client"},
        headers=auth_headers,
    ).json()["id"]
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
        headers=auth_headers,
    ).json()["id"]

    response = client.get(f"/api/v1/orders/{order_id}/application.pdf", headers=auth_headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")


def test_orders_report_csv(client, auth_headers):
    today = date.today()
    response = client.get(
        f"/api/v1/reports/orders?from={today.isoformat()}&to={today.isoformat()}&format=csv",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert "number" in response.text
