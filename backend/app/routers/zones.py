"""Hosted zone CRUD endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from fastapi.responses import PlainTextResponse, JSONResponse
import io
import json
import dns.zone
from dns.exception import DNSException
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


@router.post("/{zone_id}/import")
def import_zone(
    zone_id: str,
    file: UploadFile = File(...),
    db: DbSession = Depends(get_db)
):
    """Import DNS records from a BIND zone file."""
    zone = _get_zone_or_404(db, zone_id)
    content = file.file.read().decode("utf-8")
    
    try:
        origin = zone.name if zone.name.endswith('.') else zone.name + '.'
        dns_zone = dns.zone.from_text(content, origin=origin, relativize=False)
    except DNSException as e:
        raise HTTPException(status_code=400, detail=f"Invalid BIND zone file: {str(e)}")

    from ..ids import new_record_id
    
    added = 0
    for name, node in dns_zone.nodes.items():
        record_name = str(name).strip('.')
        if record_name == zone.name:
            # If the name is exactly the zone name (apex), we can keep it as is
            pass
            
        for rdataset in node.rdatasets:
            rtype = dns.rdatatype.to_text(rdataset.rdtype)
            if rtype not in schemas.RECORD_TYPES:
                continue
                
            for rdata in rdataset:
                val = str(rdata)
                record = models.DnsRecord(
                    id=new_record_id(),
                    zone_id=zone_id,
                    name=record_name,
                    type=rtype,
                    value=val,
                    ttl=rdataset.ttl,
                )
                db.add(record)
                added += 1
                
    db.commit()
    return {"message": f"Successfully imported {added} records"}


@router.get("/{zone_id}/export")
def export_zone(
    zone_id: str,
    format: str = Query(default="bind", description="Format: 'json' or 'bind'"),
    db: DbSession = Depends(get_db)
):
    """Export the hosted zone records as JSON or BIND format."""
    zone = _get_zone_or_404(db, zone_id)
    records = db.query(models.DnsRecord).filter(models.DnsRecord.zone_id == zone_id).all()
    
    if format == "json":
        items = [schemas.DnsRecordOut.model_validate(r).model_dump(mode='json') for r in records]
        return JSONResponse(content={"zone": schemas.HostedZoneOut.model_validate(zone).model_dump(mode='json'), "records": items})
    
    elif format == "bind":
        origin = zone.name if zone.name.endswith('.') else zone.name + '.'
        dns_zone = dns.zone.Zone(origin=origin)
        
        for r in records:
            r_name = r.name + '.' if r.name else origin
            try:
                rdataset = dns_zone.find_rdataset(r_name, r.type, create=True)
                rdata = dns.rdata.from_text(dns.rdataclass.IN, dns.rdatatype.from_text(r.type), r.value, origin=dns.name.from_text(origin))
                rdataset.add(rdata, ttl=r.ttl)
            except Exception:
                pass
                
        bind_text = dns_zone.to_text(relativize=False).decode("utf-8")
        return PlainTextResponse(content=bind_text)
        
    else:
        raise HTTPException(status_code=400, detail="Invalid format specified. Must be 'json' or 'bind'")
