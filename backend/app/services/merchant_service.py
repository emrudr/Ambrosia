import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.merchant import Merchant
from app.schemas.merchant import MerchantCreate, MerchantRead, MerchantCoordinatesUpdate
from app.services.geo_service import haversine_distance, is_within_delivery_radius
from app.core.security import get_password_hash


def onboard_merchant(db: Session, merchant_in: MerchantCreate) -> MerchantRead:
    # Check license number uniqueness
    existing_license = db.scalar(
        select(Merchant).where(Merchant.license_number == merchant_in.license_number.strip())
    )
    if existing_license:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A merchant venue with this excise license number is already registered.",
        )

    existing_email = db.scalar(
        select(Merchant).where(Merchant.email == merchant_in.email.lower().strip())
    )
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A merchant venue with this email address already exists.",
        )

    hashed_pw = get_password_hash(merchant_in.password) if merchant_in.password else None

    merchant = Merchant(
        name=merchant_in.name.strip(),
        license_number=merchant_in.license_number.strip(),
        type=merchant_in.type.strip(),
        phone_number=merchant_in.phone_number.strip(),
        email=merchant_in.email.lower().strip(),
        address_line=merchant_in.address_line.strip(),
        city=merchant_in.city.strip(),
        district=merchant_in.district.strip(),
        state=merchant_in.state.strip(),
        pincode=merchant_in.pincode.strip(),
        latitude=merchant_in.latitude,
        longitude=merchant_in.longitude,
        delivery_radius_km=merchant_in.delivery_radius_km,
        banner_image_url=merchant_in.banner_image_url,
        hashed_password=hashed_pw,
        is_active=True,
    )
    db.add(merchant)
    db.commit()
    db.refresh(merchant)
    return MerchantRead.model_validate(merchant)


def get_nearby_merchants(
    db: Session,
    user_lat: float,
    user_lon: float,
    radius_km: Optional[float] = None,
) -> List[MerchantRead]:
    """
    Evaluates straight-line Haversine distance from customer GPS to each active merchant.
    A merchant is returned IF AND ONLY IF d <= merchant.delivery_radius_km (default 10.0 km).
    The distance d (rounded to 1 decimal place, e.g. 3.2) is injected into the response.
    """
    merchants = db.scalars(select(Merchant).where(Merchant.is_active == True)).all()
    results = []

    for m in merchants:
        max_r = radius_km if radius_km is not None else m.delivery_radius_km
        d = haversine_distance(user_lat, user_lon, m.latitude, m.longitude)
        if d <= max_r:
            m_read = MerchantRead.model_validate(m)
            m_read.distance_km = d
            m_read.is_delivering = True
            results.append((d, m_read))

    # Sort ascending by proximity
    results.sort(key=lambda x: x[0])
    return [item[1] for item in results]


def get_all_merchants(
    db: Session,
    user_lat: Optional[float] = None,
    user_lon: Optional[float] = None,
    city: Optional[str] = None,
    district: Optional[str] = None,
    only_within_radius: bool = False,
) -> List[MerchantRead]:
    query = select(Merchant).where(Merchant.is_active == True)
    if city:
        query = query.where(Merchant.city.ilike(f"%{city}%"))
    if district:
        query = query.where(Merchant.district.ilike(f"%{district}%"))

    merchants = db.scalars(query).all()
    results = []

    for m in merchants:
        m_read = MerchantRead.model_validate(m)
        if user_lat is not None and user_lon is not None:
            d = haversine_distance(user_lat, user_lon, m.latitude, m.longitude)
            m_read.distance_km = d
            m_read.is_delivering = d <= m.delivery_radius_km
            if only_within_radius and not m_read.is_delivering:
                continue
            results.append((d, m_read))
        else:
            results.append((0.0, m_read))

    if user_lat is not None and user_lon is not None:
        results.sort(key=lambda x: x[0])

    return [item[1] for item in results]


def get_merchant_by_id(
    db: Session,
    merchant_id: uuid.UUID,
    user_lat: Optional[float] = None,
    user_lon: Optional[float] = None,
) -> MerchantRead:
    m = db.scalar(select(Merchant).where(Merchant.id == merchant_id))
    if not m:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Merchant venue not found in registry.",
        )
    m_read = MerchantRead.model_validate(m)
    if user_lat is not None and user_lon is not None:
        d = haversine_distance(user_lat, user_lon, m.latitude, m.longitude)
        m_read.distance_km = d
        m_read.is_delivering = d <= m.delivery_radius_km
    return m_read


def update_merchant_coordinates(
    db: Session,
    merchant_id: uuid.UUID,
    coords: MerchantCoordinatesUpdate,
) -> MerchantRead:
    m = db.scalar(select(Merchant).where(Merchant.id == merchant_id))
    if not m:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Merchant not found.")
    m.latitude = coords.latitude
    m.longitude = coords.longitude
    db.commit()
    db.refresh(m)
    return MerchantRead.model_validate(m)
