from datetime import datetime
from typing import List, Optional
import uuid
from pydantic import BaseModel, Field


class OrderItemCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(..., ge=1)


class OrderItemRead(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    unit_price: float
    product_name: Optional[str] = None
    product_image: Optional[str] = None
    sub_total: Optional[float] = None

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    merchant_id: uuid.UUID
    items: List[OrderItemCreate]
    delivery_address: str
    user_latitude: Optional[float] = None
    user_longitude: Optional[float] = None
    delivery_latitude: Optional[float] = None
    delivery_longitude: Optional[float] = None
    payment_method: str = "PAY_ON_DELIVERY"
    user_age: Optional[int] = None
    guest_name: Optional[str] = None
    guest_phone: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: str  # RECEIVED, PREPARING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED


class OrderRead(BaseModel):
    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    merchant_id: uuid.UUID
    total_amount: float
    delivery_address: str
    user_latitude: float
    user_longitude: float
    payment_method: str
    status: str
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemRead] = []
    merchant_name: Optional[str] = None
    merchant_district: Optional[str] = None
    merchant_phone: Optional[str] = None
    distance_km: Optional[float] = None

    class Config:
        from_attributes = True
