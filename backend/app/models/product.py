import uuid
from datetime import datetime
from typing import List, TYPE_CHECKING
from sqlalchemy import String, Integer, Float, Numeric, Boolean, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.merchant import Merchant
    from app.models.order import OrderItem


class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    merchant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True
    )  # Alcoholic / Non-Alcoholic / Mixer / Gourmet Soda
    sub_category: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True
    )  # Single Malt, Gin, Craft Beer, Tonic, Cold Brew
    abv: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)  # e.g. 42.8 or 0.0
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    volume_ml: Mapped[int] = mapped_column(Integer, nullable=False, default=750)
    in_stock: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    image_url: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    merchant: Mapped["Merchant"] = relationship("Merchant", back_populates="products")
    order_items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="product")

    def __repr__(self) -> str:
        return f"<Product id={self.id} name='{self.name}' abv={self.abv} price={self.price}>"
