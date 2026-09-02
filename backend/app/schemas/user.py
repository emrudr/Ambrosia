from datetime import datetime
from typing import Optional
import uuid
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    phone_number: str
    age: int = Field(..., ge=1, le=120)
    address_line: str
    city: str = "Delhi"
    district: str = "Connaught Place"
    state: str = "Delhi"
    pincode: str = "110001"
    latitude: float = 28.6289
    longitude: float = 77.2195


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRead(UserBase):
    id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


class UserLocationUpdate(BaseModel):
    latitude: float
    longitude: float
    address_line: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None


class DistrictInfo(BaseModel):
    city: str
    district: str
    latitude: float
    longitude: float
    pincode: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user: Optional[UserRead] = None
    merchant: Optional[dict] = None
