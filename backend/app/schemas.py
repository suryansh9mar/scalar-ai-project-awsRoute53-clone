"""Pydantic schemas for request validation and response serialization."""
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

# Record types supported by the clone (a subset of real Route53 types).
RECORD_TYPES = ("A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA")
RecordType = Literal["A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA"]
ZoneType = Literal["Public", "Private"]


# --- Auth ---------------------------------------------------------------


class LoginRequest(BaseModel):
    # Use a lightweight email check rather than pydantic's EmailStr: the demo
    # account (admin@route53.local) lives on a reserved-use TLD that the strict
    # email-validator deliberately rejects.
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        parts = v.split("@")
        if len(parts) != 2 or not parts[0] or "." not in parts[1] or parts[1].startswith(".") or parts[1].endswith("."):
            raise ValueError("value is not a valid email address")
        return v


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    name: str
    account_id: str


class LoginResponse(BaseModel):
    token: str
    user: UserOut


# --- Hosted Zones -------------------------------------------------------


class HostedZoneBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    type: ZoneType = "Public"
    comment: str = ""

    @field_validator("name")
    @classmethod
    def normalize_name(cls, v: str) -> str:
        # Domains are case-insensitive; store without a trailing dot.
        return v.strip().rstrip(".").lower()


class HostedZoneCreate(HostedZoneBase):
    pass


class HostedZoneUpdate(BaseModel):
    # Only the comment is editable on a real Route53 zone; name/type are fixed.
    comment: Optional[str] = None


class HostedZoneOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    type: str
    comment: str
    record_count: int
    created_at: datetime


# --- DNS Records --------------------------------------------------------


class DnsRecordBase(BaseModel):
    name: str = Field(default="", max_length=255)
    type: RecordType
    value: str = Field(min_length=1)
    ttl: int = Field(default=300, ge=0, le=2147483647)
    routing_policy: str = "Simple"

    @field_validator("name")
    @classmethod
    def normalize_name(cls, v: str) -> str:
        return v.strip().rstrip(".").lower()

    @field_validator("value")
    @classmethod
    def strip_value(cls, v: str) -> str:
        return v.strip()


class DnsRecordCreate(DnsRecordBase):
    pass


class DnsRecordUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[RecordType] = None
    value: Optional[str] = None
    ttl: Optional[int] = Field(default=None, ge=0, le=2147483647)
    routing_policy: Optional[str] = None


class DnsRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    zone_id: str
    name: str
    type: str
    value: str
    ttl: int
    routing_policy: str
    created_at: datetime
    updated_at: datetime


# --- Pagination ---------------------------------------------------------


class Page(BaseModel):
    """Generic paginated envelope."""

    items: list
    total: int
    page: int
    page_size: int
