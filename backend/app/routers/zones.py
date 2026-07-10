"""Hosted zone CRUD endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session as DbSession

from .. import models, schemas
from ..auth import get_current_user
from ..database import get_db
from ..ids import new_zone_id

router = APIRouter(
    prefix="/api/hosted-zones",
    tags=["hosted-zones"],
    dependencies=[Depends(get_current_user)],
)


def _get_zone_or_404(db: DbSession, zone_id: str) -> models.HostedZone:
    zone = db.get(models.HostedZone, zone_id)
    if zone is None:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    return zone


@router.get("", response_model=schemas.Page)
def list_zones(
    db: DbSession = Depends(get_db),
    search: str = Query(default="", description="Filter by domain name substring"),
    type: str = Query(default="", description="Filter by zone type"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
):
    """List hosted zones with search, type filter and pagination."""
    query = db.query(models.HostedZone)
    if search:
        query = query.filter(models.HostedZone.name.ilike(f"%{search.strip().lower()}%"))
    if type:
        query = query.filter(models.HostedZone.type == type)

    total = query.count()
    zones = (
        query.order_by(models.HostedZone.name)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return schemas.Page(
        items=[schemas.HostedZoneOut.model_validate(z).model_dump() for z in zones],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=schemas.HostedZoneOut, status_code=status.HTTP_201_CREATED)
def create_zone(payload: schemas.HostedZoneCreate, db: DbSession = Depends(get_db)):
    """Create a hosted zone. Names must be unique (as in Route53 per account)."""
    exists = (
        db.query(models.HostedZone)
        .filter(func.lower(models.HostedZone.name) == payload.name)
        .first()
    )
    if exists:
        raise HTTPException(status_code=409, detail="A hosted zone with this name already exists")

    zone = models.HostedZone(
        id=new_zone_id(),
        name=payload.name,
        type=payload.type,
        comment=payload.comment,
    )
    db.add(zone)
    db.flush()

    # Route53 automatically creates NS and SOA records; we add default NS records.
    _add_default_ns_records(db, zone)
    db.commit()
    db.refresh(zone)
    return zone


@router.get("/{zone_id}", response_model=schemas.HostedZoneOut)
def get_zone(zone_id: str, db: DbSession = Depends(get_db)):
    return _get_zone_or_404(db, zone_id)


@router.patch("/{zone_id}", response_model=schemas.HostedZoneOut)
def update_zone(
    zone_id: str,
    payload: schemas.HostedZoneUpdate,
    db: DbSession = Depends(get_db),
):
    """Update the editable fields of a hosted zone (comment only)."""
    zone = _get_zone_or_404(db, zone_id)
    if payload.comment is not None:
        zone.comment = payload.comment
    db.commit()
    db.refresh(zone)
    return zone


@router.delete("/{zone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_zone(zone_id: str, db: DbSession = Depends(get_db)):
    """Delete a hosted zone and all of its records."""
    zone = _get_zone_or_404(db, zone_id)
    db.delete(zone)
    db.commit()
    return None


def _add_default_ns_records(db: DbSession, zone: models.HostedZone) -> None:
    from ..ids import new_record_id

    suffix = zone.id[1:5].lower()
    ns_value = "\n".join(
        f"ns-{i}.awsdns-{suffix}.{tld}."
        for i, tld in zip((1, 2, 3, 4), ("com", "net", "org", "co.uk"))
    )
    db.add(
        models.DnsRecord(
            id=new_record_id(),
            zone_id=zone.id,
            name=zone.name,
            type="NS",
            value=ns_value,
            ttl=172800,
        )
    )
