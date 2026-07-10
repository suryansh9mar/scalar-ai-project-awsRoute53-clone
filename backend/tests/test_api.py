"""API test suite for the Route53 clone backend.

Uses a dedicated temporary SQLite file and overrides the ``get_db`` dependency
so the tests never touch the development ``route53.db``.
"""
import os
import tempfile

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker

from app import models  # noqa: F401 - ensure models are registered on Base
from app.database import Base, get_db
from app.main import app
from app.seed import DEMO_EMAIL, DEMO_PASSWORD, seed


@pytest.fixture()
def client():
    """A TestClient wired to an isolated, freshly-seeded SQLite database."""
    db_fd, db_path = tempfile.mkstemp(suffix=".db")
    os.close(db_fd)
    test_engine = create_engine(
        f"sqlite:///{db_path}",
        connect_args={"check_same_thread": False},
    )

    @event.listens_for(test_engine, "connect")
    def _fk_pragma(dbapi_connection, _):
        cur = dbapi_connection.cursor()
        cur.execute("PRAGMA foreign_keys=ON")
        cur.close()

    TestingSessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=test_engine
    )
    Base.metadata.create_all(bind=test_engine)

    seed_db = TestingSessionLocal()
    try:
        seed(seed_db)
    finally:
        seed_db.close()

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
    test_engine.dispose()
    os.unlink(db_path)


def auth_headers(client) -> dict:
    resp = client.post(
        "/api/auth/login",
        json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD},
    )
    assert resp.status_code == 200, resp.text
    return {"Authorization": f"Bearer {resp.json()['token']}"}


# --- Health ---------------------------------------------------------------


def test_health(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


# --- Auth -----------------------------------------------------------------


def test_login_success(client):
    resp = client.post(
        "/api/auth/login",
        json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["token"]
    assert body["user"]["email"] == DEMO_EMAIL
    assert body["user"]["account_id"] == "123456789012"


def test_login_wrong_password(client):
    resp = client.post(
        "/api/auth/login",
        json={"email": DEMO_EMAIL, "password": "wrong"},
    )
    assert resp.status_code == 401


def test_login_auto_provisions_unknown_email(client):
    resp = client.post(
        "/api/auth/login",
        json={"email": "brand.new@example.com", "password": "anything"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["token"]
    assert body["user"]["email"] == "brand.new@example.com"

    # A subsequent login with the wrong password for that (now-existing) account fails.
    again = client.post(
        "/api/auth/login",
        json={"email": "brand.new@example.com", "password": "different"},
    )
    assert again.status_code == 401


def test_me_requires_auth(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me_returns_user(client):
    resp = client.get("/api/auth/me", headers=auth_headers(client))
    assert resp.status_code == 200
    assert resp.json()["email"] == DEMO_EMAIL


# --- Auth enforcement -----------------------------------------------------


def test_zone_endpoints_require_auth(client):
    assert client.get("/api/hosted-zones").status_code == 401
    assert client.post("/api/hosted-zones", json={"name": "x.com"}).status_code == 401


def test_record_endpoints_require_auth(client):
    assert client.get("/api/hosted-zones/Zxxx/records").status_code == 401


# --- Hosted zones ---------------------------------------------------------


def test_list_seeded_zones(client):
    resp = client.get("/api/hosted-zones", headers=auth_headers(client))
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 2
    assert body["page"] == 1
    assert body["page_size"] == 10
    names = {z["name"] for z in body["items"]}
    assert names == {"example.com", "internal.example.io"}


def test_zone_search_and_type_filter(client):
    h = auth_headers(client)
    resp = client.get(
        "/api/hosted-zones", params={"search": "internal", "type": "Private"}, headers=h
    )
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["name"] == "internal.example.io"

    # Non-matching type yields nothing.
    resp = client.get(
        "/api/hosted-zones", params={"search": "internal", "type": "Public"}, headers=h
    )
    assert resp.json()["total"] == 0


def test_zone_pagination(client):
    h = auth_headers(client)
    resp = client.get("/api/hosted-zones", params={"page_size": 1, "page": 1}, headers=h)
    body = resp.json()
    assert body["total"] == 2
    assert len(body["items"]) == 1
    assert body["page_size"] == 1


def test_create_zone_normalizes_and_auto_ns(client):
    h = auth_headers(client)
    resp = client.post(
        "/api/hosted-zones",
        json={"name": "Test.COM", "type": "Public", "comment": "hi"},
        headers=h,
    )
    assert resp.status_code == 201
    zone = resp.json()
    assert zone["name"] == "test.com"  # normalized
    assert zone["comment"] == "hi"
    assert zone["record_count"] == 1  # auto NS record

    recs = client.get(f"/api/hosted-zones/{zone['id']}/records", headers=h).json()
    assert recs["total"] == 1
    assert recs["items"][0]["type"] == "NS"


def test_create_zone_duplicate_conflict(client):
    h = auth_headers(client)
    client.post("/api/hosted-zones", json={"name": "dup.com"}, headers=h)
    resp = client.post("/api/hosted-zones", json={"name": "DUP.com"}, headers=h)
    assert resp.status_code == 409


def test_get_patch_delete_zone_cascades(client):
    h = auth_headers(client)
    zone = client.post(
        "/api/hosted-zones", json={"name": "cascade.io"}, headers=h
    ).json()
    zid = zone["id"]

    # get
    assert client.get(f"/api/hosted-zones/{zid}", headers=h).status_code == 200

    # patch comment
    patched = client.patch(
        f"/api/hosted-zones/{zid}", json={"comment": "changed"}, headers=h
    )
    assert patched.status_code == 200
    assert patched.json()["comment"] == "changed"

    # add a record then delete the zone; the record must be gone too
    client.post(
        f"/api/hosted-zones/{zid}/records",
        json={"name": "a", "type": "A", "value": "1.1.1.1"},
        headers=h,
    )
    assert client.delete(f"/api/hosted-zones/{zid}", headers=h).status_code == 204
    assert client.get(f"/api/hosted-zones/{zid}", headers=h).status_code == 404
    # records endpoint for a deleted zone 404s
    assert client.get(f"/api/hosted-zones/{zid}/records", headers=h).status_code == 404


def test_get_missing_zone_404(client):
    resp = client.get("/api/hosted-zones/Zdoesnotexist", headers=auth_headers(client))
    assert resp.status_code == 404


# --- DNS records ----------------------------------------------------------


@pytest.fixture()
def zone(client):
    h = auth_headers(client)
    z = client.post("/api/hosted-zones", json={"name": "records.test"}, headers=h).json()
    return h, z["id"]


@pytest.mark.parametrize(
    "rtype,value",
    [
        ("A", "192.0.2.10"),
        ("AAAA", "2001:db8::10"),
        ("CNAME", "records.test"),
        ("TXT", '"v=spf1 ~all"'),
        ("MX", "10 mail.records.test"),
        ("NS", "ns1.records.test."),
        ("PTR", "host.records.test."),
        ("SRV", "10 60 5060 sip.records.test."),
        ("CAA", '0 issue "letsencrypt.org"'),
    ],
)
def test_create_each_record_type(client, zone, rtype, value):
    h, zid = zone
    resp = client.post(
        f"/api/hosted-zones/{zid}/records",
        json={"name": rtype.lower(), "type": rtype, "value": value},
        headers=h,
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["type"] == rtype
    assert body["value"] == value.strip()


def test_invalid_record_type_rejected(client, zone):
    h, zid = zone
    resp = client.post(
        f"/api/hosted-zones/{zid}/records",
        json={"name": "x", "type": "BOGUS", "value": "v"},
        headers=h,
    )
    assert resp.status_code == 422


def test_record_full_crud(client, zone):
    h, zid = zone
    created = client.post(
        f"/api/hosted-zones/{zid}/records",
        json={"name": "www", "type": "A", "value": "192.0.2.1", "ttl": 300},
        headers=h,
    ).json()
    rid = created["id"]

    # get
    assert client.get(f"/api/hosted-zones/{zid}/records/{rid}", headers=h).status_code == 200

    # patch
    patched = client.patch(
        f"/api/hosted-zones/{zid}/records/{rid}",
        json={"ttl": 600, "value": "192.0.2.99"},
        headers=h,
    ).json()
    assert patched["ttl"] == 600
    assert patched["value"] == "192.0.2.99"

    # delete
    assert client.delete(f"/api/hosted-zones/{zid}/records/{rid}", headers=h).status_code == 204
    assert client.get(f"/api/hosted-zones/{zid}/records/{rid}", headers=h).status_code == 404


def test_record_empty_name_defaults_to_apex(client, zone):
    h, zid = zone
    created = client.post(
        f"/api/hosted-zones/{zid}/records",
        json={"name": "", "type": "A", "value": "192.0.2.1"},
        headers=h,
    ).json()
    assert created["name"] == "records.test"


def test_record_search_and_filter(client, zone):
    h, zid = zone
    client.post(
        f"/api/hosted-zones/{zid}/records",
        json={"name": "www", "type": "CNAME", "value": "records.test"},
        headers=h,
    )
    client.post(
        f"/api/hosted-zones/{zid}/records",
        json={"name": "mail", "type": "A", "value": "192.0.2.55"},
        headers=h,
    )

    # search by name
    by_name = client.get(
        f"/api/hosted-zones/{zid}/records", params={"search": "www"}, headers=h
    ).json()
    assert by_name["total"] == 1
    assert by_name["items"][0]["name"] == "www"

    # search by value
    by_value = client.get(
        f"/api/hosted-zones/{zid}/records", params={"search": "192.0.2.55"}, headers=h
    ).json()
    assert by_value["total"] == 1
    assert by_value["items"][0]["name"] == "mail"

    # type filter (NS auto-record + explicit CNAME/A present)
    a_only = client.get(
        f"/api/hosted-zones/{zid}/records", params={"type": "A"}, headers=h
    ).json()
    assert a_only["total"] == 1
    assert a_only["items"][0]["type"] == "A"


def test_record_pagination(client, zone):
    h, zid = zone
    for i in range(5):
        client.post(
            f"/api/hosted-zones/{zid}/records",
            json={"name": f"h{i}", "type": "A", "value": f"192.0.2.{i}"},
            headers=h,
        )
    resp = client.get(
        f"/api/hosted-zones/{zid}/records",
        params={"page_size": 2, "page": 1},
        headers=h,
    ).json()
    assert resp["page_size"] == 2
    assert len(resp["items"]) == 2
    assert resp["total"] == 6  # 5 + auto NS
