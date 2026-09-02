from datetime import datetime
from typing import Optional
import uuid
from pydantic import BaseModel, EmailStr


class MerchantBase(BaseModel):
    name: str
    license_number: str
    type: str = "Bar"  # Bar / Microbrewery / Wine Cellar / Soft Beverage Lounge
    phone_number: str
    email: EmailStr
    address_line: str
    city: str
    district: str
    state: str
    pincode: str
    latitude: float
    longitude: float
    delivery_radius_km: float = 10.0
    banner_image_url: Optional[str] = None


class MerchantCreate(MerchantBase):
    password: Optional[str] = None


class MerchantLogin(BaseModel):
    email: EmailStr
    password: str


class MerchantRead(MerchantBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime
    distance_km: Optional[float] = None
    is_delivering: Optional[bool] = None

    class Config:
        from_attributes = True


class MerchantCoordinatesUpdate(BaseModel):
    latitude: float
    longitude: float
