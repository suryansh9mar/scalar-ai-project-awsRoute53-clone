"""SQLAlchemy ORM models mirroring the core Route53 domain objects."""
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    """A mocked application user."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    # Stored in plaintext on purpose — this is a mocked auth system only.
    password: Mapped[str] = mapped_column(String, nullable=False)
    account_id: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)

    sessions: Mapped[list["Session"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class Session(Base):
    """An opaque bearer token mapping to a user, enabling session persistence."""

    __tablename__ = "sessions"

    token: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)

    user: Mapped["User"] = relationship(back_populates="sessions")


class HostedZone(Base):
    """A Route53 hosted zone (a container of DNS records for a domain)."""

    __tablename__ = "hosted_zones"

    # Route53-style zone id, e.g. "Z0A1B2C3D4E5F6G7H8I9".
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    # "Public" or "Private".
    type: Mapped[str] = mapped_column(String, nullable=False, default="Public")
    comment: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)

    records: Mapped[list["DnsRecord"]] = relationship(
        back_populates="zone",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    @property
    def record_count(self) -> int:
        return len(self.records)


class DnsRecord(Base):
    """A single DNS record belonging to a hosted zone."""

    __tablename__ = "dns_records"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    zone_id: Mapped[str] = mapped_column(
        ForeignKey("hosted_zones.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    type: Mapped[str] = mapped_column(String, nullable=False)
    # Record value(s). Multi-value records are stored newline-separated.
    value: Mapped[str] = mapped_column(Text, nullable=False, default="")
    ttl: Mapped[int] = mapped_column(Integer, nullable=False, default=300)
    routing_policy: Mapped[str] = mapped_column(String, nullable=False, default="Simple")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=_utcnow, onupdate=_utcnow
    )

    zone: Mapped["HostedZone"] = relationship(back_populates="records")
