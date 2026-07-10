"""Seed a demo user and sample hosted zones/records on first startup."""
from sqlalchemy.orm import Session as DbSession

from . import models
from .ids import new_record_id, new_user_id, new_zone_id

DEMO_EMAIL = "admin@route53.local"
DEMO_PASSWORD = "password"
DEMO_ACCOUNT_ID = "123456789012"


def seed(db: DbSession) -> None:
    """Populate the database with demo data if it is empty."""
    if db.query(models.User).count() == 0:
        db.add(
            models.User(
                id=new_user_id(),
                email=DEMO_EMAIL,
                name="Demo Admin",
                password=DEMO_PASSWORD,
                account_id=DEMO_ACCOUNT_ID,
            )
        )
        db.commit()

    if db.query(models.HostedZone).count() > 0:
        return

    _seed_zone(
        db,
        name="example.com",
        type="Public",
        comment="Primary corporate domain",
        records=[
            ("", "NS", "ns-1.awsdns-00.com.\nns-2.awsdns-01.net.", 172800),
            ("", "SOA", None, None),  # skipped — SOA not in supported set
            ("", "A", "192.0.2.44", 300),
            ("www", "CNAME", "example.com", 300),
            ("mail", "A", "192.0.2.30", 300),
            ("", "MX", "10 mail.example.com", 3600),
            ("", "TXT", '"v=spf1 include:_spf.example.com ~all"', 300),
            ("_dmarc", "TXT", '"v=DMARC1; p=none; rua=mailto:dmarc@example.com"', 300),
            ("api", "A", "192.0.2.80", 60),
            ("ipv6", "AAAA", "2001:db8::1", 300),
        ],
    )
    _seed_zone(
        db,
        name="internal.example.io",
        type="Private",
        comment="Private VPC zone",
        records=[
            ("", "A", "10.0.0.10", 300),
            ("db", "A", "10.0.1.20", 300),
            ("cache", "CNAME", "db.internal.example.io", 300),
        ],
    )
    db.commit()


def _seed_zone(db: DbSession, *, name, type, comment, records) -> None:
    zone = models.HostedZone(id=new_zone_id(), name=name, type=type, comment=comment)
    db.add(zone)
    db.flush()
    for rec_name, rec_type, value, ttl in records:
        if value is None:  # skip placeholder rows for unsupported types
            continue
        full_name = f"{rec_name}.{name}" if rec_name else name
        db.add(
            models.DnsRecord(
                id=new_record_id(),
                zone_id=zone.id,
                name=full_name,
                type=rec_type,
                value=value,
                ttl=ttl,
            )
        )
