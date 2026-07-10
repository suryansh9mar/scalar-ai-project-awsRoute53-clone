"""Helpers for generating Route53-style identifiers."""
import uuid


def new_zone_id() -> str:
    """Generate a Route53-style hosted zone id, e.g. 'Z0A1B2C3D4E5F6G7H8I9'."""
    return "Z" + uuid.uuid4().hex[:19].upper()


def new_record_id() -> str:
    return "rec-" + uuid.uuid4().hex


def new_user_id() -> str:
    return "usr-" + uuid.uuid4().hex


def new_token() -> str:
    return uuid.uuid4().hex + uuid.uuid4().hex
