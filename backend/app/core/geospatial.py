import math
from typing import Dict, List, Any, Optional

EARTH_RADIUS_KM: float = 6371.0

# Verified Districts across Delhi & Noida with central coordinates
VERIFIED_DISTRICTS: List[Dict[str, Any]] = [
    # Delhi Districts
    {"city": "Delhi", "district": "Connaught Place", "latitude": 28.6289, "longitude": 77.2195, "pincode": "110001"},
    {"city": "Delhi", "district": "Hauz Khas", "latitude": 28.5494, "longitude": 77.2001, "pincode": "110016"},
    {"city": "Delhi", "district": "Saket", "latitude": 28.5244, "longitude": 77.2185, "pincode": "110017"},
    {"city": "Delhi", "district": "Vasant Kunj", "latitude": 28.5293, "longitude": 77.1517, "pincode": "110070"},
    {"city": "Delhi", "district": "Aerocity", "latitude": 28.5510, "longitude": 77.1219, "pincode": "110037"},
    {"city": "Delhi", "district": "Dwarka", "latitude": 28.5921, "longitude": 77.0460, "pincode": "110075"},
    {"city": "Delhi", "district": "Khan Market", "latitude": 28.6002, "longitude": 77.2270, "pincode": "110003"},
    {"city": "Delhi", "district": "Greater Kailash", "latitude": 28.5332, "longitude": 77.2425, "pincode": "110048"},
    {"city": "Delhi", "district": "Rajouri Garden", "latitude": 28.6415, "longitude": 77.1211, "pincode": "110027"},
    {"city": "Delhi", "district": "Defence Colony", "latitude": 28.5727, "longitude": 77.2348, "pincode": "110024"},

    # Noida Districts
    {"city": "Noida", "district": "Sector 18", "latitude": 28.5708, "longitude": 77.3219, "pincode": "201301"},
    {"city": "Noida", "district": "Sector 62", "latitude": 28.6256, "longitude": 77.3653, "pincode": "201309"},
    {"city": "Noida", "district": "Sector 137", "latitude": 28.5132, "longitude": 77.4085, "pincode": "201305"},
    {"city": "Noida", "district": "Sector 104", "latitude": 28.5355, "longitude": 77.3670, "pincode": "201304"},
    {"city": "Noida", "district": "Sector 76", "latitude": 28.5742, "longitude": 77.3887, "pincode": "201307"},
    {"city": "Noida", "district": "Sector 50", "latitude": 28.5804, "longitude": 77.3688, "pincode": "201301"},
    {"city": "Noida", "district": "Sector 150", "latitude": 28.4601, "longitude": 77.4789, "pincode": "201310"},
    {"city": "Noida", "district": "Greater Noida West", "latitude": 28.6012, "longitude": 77.4410, "pincode": "201009"},
    {"city": "Noida", "district": "Knowledge Park", "latitude": 28.4650, "longitude": 77.5110, "pincode": "201310"},
    {"city": "Noida", "district": "Wave City", "latitude": 28.5910, "longitude": 77.3480, "pincode": "201301"},
]


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates great-circle distance between two geographic coordinates on Earth using the Haversine formula:
    d = 2 * r * arcsin(sqrt(sin^2(Δφ/2) + cos(φ1) * cos(φ2) * sin^2(Δλ/2)))
    """
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
    )
    # Clip for floating point precision issues
    a = min(1.0, max(0.0, a))
    c = 2.0 * math.asin(math.sqrt(a))
    return round(EARTH_RADIUS_KM * c, 2)


def is_within_delivery_radius(
    user_lat: float,
    user_lon: float,
    merchant_lat: float,
    merchant_lon: float,
    radius_km: float = 10.0,
) -> bool:
    """Returns True if user location is within the merchant's delivery radius."""
    dist = haversine_distance(user_lat, user_lon, merchant_lat, merchant_lon)
    return dist <= radius_km


def find_district_by_name(district_name: str, city: Optional[str] = None) -> Optional[Dict[str, Any]]:
    for d in VERIFIED_DISTRICTS:
        if d["district"].lower() == district_name.strip().lower():
            if city is None or d["city"].lower() == city.strip().lower():
                return d
    return None
