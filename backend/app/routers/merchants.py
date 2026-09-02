import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.merchant import (
    MerchantCreate,
    MerchantLogin,
    MerchantRead,
    MerchantCoordinatesUpdate,
)
from app.schemas.user import TokenResponse
from app.services.merchant_service import (
    onboard_merchant,
    get_nearby_merchants,
    get_all_merchants,
    get_merchant_by_id,
    update_merchant_coordinates,
)
from app.services.auth_service import authenticate_merchant

router = APIRouter(prefix="/merchants", tags=["Merchants"])


@router.post(
    "/onboard",
    response_model=MerchantRead,
    status_code=status.HTTP_201_CREATED,
    summary="Onboard a licensed partner venue",
)
def onboard(merchant_in: MerchantCreate, db: Session = Depends(get_db)) -> MerchantRead:
    return onboard_merchant(db, merchant_in)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate merchant partner",
)
def login(login_in: MerchantLogin, db: Session = Depends(get_db)) -> TokenResponse:
    return authenticate_merchant(db, login_in.email, login_in.password)


@router.get(
    "/nearby",
    response_model=List[MerchantRead],
    summary="Discover merchants strictly within 10 km delivery radius using Haversine formula",
)
def nearby_merchants(
    lat: float = Query(..., description="Customer latitude coordinate"),
    lng: float = Query(..., description="Customer longitude coordinate"),
    radius: Optional[float] = Query(None, description="Delivery radius in km (default 10 km)"),
    db: Session = Depends(get_db),
) -> List[MerchantRead]:
    return get_nearby_merchants(db, user_lat=lat, user_lon=lng, radius_km=radius)


@router.get(
    "",
    response_model=List[MerchantRead],
    summary="List all partner merchant venues with distance annotations",
)
def list_merchants(
    lat: Optional[float] = Query(None, description="Customer latitude coordinate"),
    lng: Optional[float] = Query(None, description="Customer longitude coordinate"),
    city: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    only_within_radius: bool = Query(False),
    db: Session = Depends(get_db),
) -> List[MerchantRead]:
    return get_all_merchants(
        db,
        user_lat=lat,
        user_lon=lng,
        city=city,
        district=district,
        only_within_radius=only_within_radius,
    )


@router.get(
    "/{merchant_id}",
    response_model=MerchantRead,
    summary="Get merchant venue profile by ID",
)
def get_merchant(
    merchant_id: uuid.UUID,
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    db: Session = Depends(get_db),
) -> MerchantRead:
    return get_merchant_by_id(db, merchant_id, user_lat=lat, user_lon=lng)


@router.patch(
    "/{merchant_id}/coordinates",
    response_model=MerchantRead,
    summary="Update merchant venue GPS coordinates",
)
def update_coordinates(
    merchant_id: uuid.UUID,
    coords: MerchantCoordinatesUpdate,
    db: Session = Depends(get_db),
) -> MerchantRead:
    return update_merchant_coordinates(db, merchant_id, coords)
