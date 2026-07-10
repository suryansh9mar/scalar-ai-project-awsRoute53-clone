"""DNS record CRUD endpoints, scoped to a hosted zone."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session as DbSession

from .. import models, schemas
from ..auth import get_current_user
from ..database import get_db
from ..ids import new_record_id

router = APIRouter(
    prefix="/api/hosted-zones/{zone_id}/records",
    tags=["dns-records"],
    dependencies=[Depends(get_current_user)],
)


def _get_zone_or_404(db: DbSession, zone_id: str) -> models.HostedZone:
    zone = db.get(models.HostedZone, zone_id)
    if zone is None:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    return zone


def _get_record_or_404(db: DbSession, zone_id: str, record_id: str) -> models.DnsRecord:
    record = db.get(models.DnsRecord, record_id)
    if record is None or record.zone_id != zone_id:
        raise HTTPException(status_code=404, detail="Record not found")
    return record


@router.get("", response_model=schemas.Page)
def list_records(
    zone_id: str,
    db: DbSession = Depends(get_db),
    search: str = Query(default=""),
    type: str = Query(default="", description="Filter by record type"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
):
    """List records in a zone with search (name/value), type filter and pagination."""
    _get_zone_or_404(db, zone_id)
    query = db.query(models.DnsRecord).filter(models.DnsRecord.zone_id == zone_id)

    if search:
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                models.DnsRecord.name.ilike(term),
                models.DnsRecord.value.ilike(term),
            )
        )
    if type:
        query = query.filter(models.DnsRecord.type == type)

    total = query.count()
    records = (
        query.order_by(models.DnsRecord.name, models.DnsRecord.type)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return schemas.Page(
        items=[schemas.DnsRecordOut.model_validate(r).model_dump() for r in records],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=schemas.DnsRecordOut, status_code=status.HTTP_201_CREATED)
def create_record(
    zone_id: str, payload: schemas.DnsRecordCreate, db: DbSession = Depends(get_db)
):
    zone = _get_zone_or_404(db, zone_id)
    # Default an empty record name to the zone apex.
    name = payload.name or zone.name
    record = models.DnsRecord(
        id=new_record_id(),
        zone_id=zone_id,
        name=name,
        type=payload.type,
        value=payload.value,
        ttl=payload.ttl,
        routing_policy=payload.routing_policy,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/{record_id}", response_model=schemas.DnsRecordOut)
def get_record(zone_id: str, record_id: str, db: DbSession = Depends(get_db)):
    return _get_record_or_404(db, zone_id, record_id)


@router.patch("/{record_id}", response_model=schemas.DnsRecordOut)
def update_record(
    zone_id: str,
    record_id: str,
    payload: schemas.DnsRecordUpdate,
    db: DbSession = Depends(get_db),
):
    record = _get_record_or_404(db, zone_id, record_id)
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        if value is not None:
            setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_record(zone_id: str, record_id: str, db: DbSession = Depends(get_db)):
    record = _get_record_or_404(db, zone_id, record_id)
    db.delete(record)
    db.commit()
    return None
