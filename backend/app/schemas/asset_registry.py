from datetime import datetime
from typing import Optional
import uuid
from pydantic import BaseModel


class AssetRegistryCreate(BaseModel):
    asset_key: str
    url: str
    description: Optional[str] = None


class AssetRegistryRead(BaseModel):
    id: uuid.UUID
    asset_key: str
    url: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
