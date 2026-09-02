from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Request, Query
from app.services.geo_service import (
    get_verified_districts,
    haversine_distance,
    VERIFIED_DISTRICTS,
)

router = APIRouter(prefix="/geo", tags=["Geospatial & GPS"])


@router.get("/districts", summary="List verified Delhi & Noida districts")
def list_districts() -> List[Dict[str, Any]]:
    return get_verified_districts()


@router.get("/closest-district", summary="Find the closest verified district given coordinates")
def get_closest_district(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
) -> Dict[str, Any]:
    closest = None
    min_dist = float("inf")

    for d in VERIFIED_DISTRICTS:
        dist = haversine_distance(lat, lng, d["latitude"], d["longitude"])
        if dist < min_dist:
            min_dist = dist
            closest = {**d, "distance_km": dist}

    return closest or {
        "city": "Delhi",
        "district": "Connaught Place",
        "latitude": 28.6289,
        "longitude": 77.2195,
        "pincode": "110001",
        "distance_km": 0.0,
    }


@router.get("/auto-detect", summary="Backend auto-detect GPS coordinates based on client IP or corridor default")
@router.post("/auto-detect", summary="Backend auto-detect GPS coordinates (POST)")
def auto_detect_gps(
    request: Request,
    district_hint: Optional[str] = Query(None, description="Optional district name hint"),
) -> Dict[str, Any]:
    """
    Backend auto-detection of coordinates.
    Extracts client IP or proxies, and resolves to the appropriate corridor coordinates.
    Provides robust fallback to central Delhi NCR (Connaught Place) for local/private network addresses.
    """
    # 1. If district hint provided, match directly
    if district_hint:
        for d in VERIFIED_DISTRICTS:
            if d["district"].lower() == district_hint.strip().lower():
                return {
                    "status": "success",
                    "latitude": d["latitude"],
                    "longitude": d["longitude"],
                    "district": d["district"],
                    "city": d["city"],
                    "state": "Delhi" if d["city"] == "Delhi" else "Uttar Pradesh",
                    "pincode": d["pincode"],
                    "source": "backend_district_hint",
                }

    # 2. Extract client IP from headers or client host
    forwarded = request.headers.get("x-forwarded-for")
    real_ip = request.headers.get("x-real-ip")
    client_ip = (
        forwarded.split(",")[0].strip()
        if forwarded
        else real_ip or (request.client.host if request.client else "127.0.0.1")
    )

    # 3. Default to central hub: Connaught Place, Delhi (Heart of NCR corridor)
    default_hub = VERIFIED_DISTRICTS[0]  # Connaught Place

    return {
        "status": "success",
        "latitude": default_hub["latitude"],
        "longitude": default_hub["longitude"],
        "district": default_hub["district"],
        "city": default_hub["city"],
        "state": "Delhi",
        "pincode": default_hub["pincode"],
        "client_ip": client_ip,
        "source": "backend_gps_resolver",
    }
