from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class WishCreate(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Name of the birthday person",
        examples=["Alice", "Bob"]
    )


class WishResponse(BaseModel):
    message: str = Field(..., description="Personalized birthday greeting")
    total_wishes: int = Field(..., description="Total count of wishes stored")


class WishRead(BaseModel):
    id: int
    name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WishCountResponse(BaseModel):
    total_wishes: int
    source: str = Field("cache", description="Source of the count (redis or db)")


class HealthResponse(BaseModel):
    status: str
    database: str
    redis: str
    version: str = "1.0.0"
