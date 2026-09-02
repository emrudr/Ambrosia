from datetime import datetime
from typing import Optional
import uuid
from pydantic import BaseModel


class ProductBase(BaseModel):
    name: str
    description: str
    category: str  # Alcoholic / Non-Alcoholic / Mixer / Gourmet Soda
    sub_category: str  # Single Malt, Gin, Craft Beer, Tonic, Cold Brew
    abv: float = 0.0
    price: float
    volume_ml: int = 750
    image_url: str = ""
    in_stock: bool = True


class ProductCreate(ProductBase):
    merchant_id: uuid.UUID


class ProductRead(ProductBase):
    id: uuid.UUID
    merchant_id: uuid.UUID
    created_at: datetime
    merchant_name: Optional[str] = None
    merchant_district: Optional[str] = None
    merchant_city: Optional[str] = None
    distance_km: Optional[float] = None

    class Config:
        from_attributes = True


class ProductStockUpdate(BaseModel):
    in_stock: bool
