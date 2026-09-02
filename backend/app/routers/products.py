import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_optional_user
from app.models.user import User
from app.schemas.product import (
    ProductCreate,
    ProductRead,
    ProductStockUpdate,
)
from app.services.product_service import (
    list_products,
    get_product_by_id,
    create_product,
    get_merchant_products,
    update_product_stock,
)

router = APIRouter(tags=["Products"])


@router.get(
    "/products",
    response_model=List[ProductRead],
    summary="List curated beverages with 10 km proximity and strict legal age-gating",
)
def get_products(
    lat: Optional[float] = Query(None, description="Customer latitude coordinate"),
    lng: Optional[float] = Query(None, description="Customer longitude coordinate"),
    category: Optional[str] = Query(None, description="Category filter"),
    sub_category: Optional[str] = Query(None, description="Sub-category filter"),
    merchant_id: Optional[uuid.UUID] = Query(None, description="Filter by venue"),
    user_age: Optional[int] = Query(None, description="Client age declaration"),
    search: Optional[str] = Query(None, description="Keyword search query"),
    only_within_radius: bool = Query(False, description="Strict <= 10 km proximity filter"),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
) -> List[ProductRead]:
    # Age priority: Authenticated JWT user age takes precedence, else query param
    effective_age = current_user.age if current_user else user_age

    return list_products(
        db,
        user_lat=lat,
        user_lon=lng,
        user_age=effective_age,
        category=category,
        sub_category=sub_category,
        merchant_id=merchant_id,
        search=search,
        only_within_radius=only_within_radius,
    )


@router.get(
    "/products/{product_id}",
    response_model=ProductRead,
    summary="Get single beverage details with direct ID age-gate enforcement",
)
def get_single_product(
    product_id: uuid.UUID,
    user_age: Optional[int] = Query(None),
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
) -> ProductRead:
    effective_age = current_user.age if current_user else user_age
    return get_product_by_id(
        db,
        product_id=product_id,
        user_age=effective_age,
        user_lat=lat,
        user_lon=lng,
    )


@router.get(
    "/merchants/{merchant_id}/products",
    response_model=List[ProductRead],
    summary="List all inventory items allocated to a specific venue",
)
def get_products_by_merchant(
    merchant_id: uuid.UUID,
    user_age: Optional[int] = Query(None),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
) -> List[ProductRead]:
    effective_age = current_user.age if current_user else user_age
    return get_merchant_products(db, merchant_id=merchant_id, user_age=effective_age)


@router.post(
    "/merchants/{merchant_id}/products",
    response_model=ProductRead,
    status_code=status.HTTP_201_CREATED,
    summary="Allocate a new beverage to merchant catalog",
)
def add_product(
    merchant_id: uuid.UUID,
    product_in: ProductCreate,
    db: Session = Depends(get_db),
) -> ProductRead:
    product_in.merchant_id = merchant_id
    return create_product(db, product_in)


@router.patch(
    "/merchants/{merchant_id}/products/{product_id}/stock",
    response_model=ProductRead,
    summary="Update product stock status",
)
def update_stock(
    merchant_id: uuid.UUID,
    product_id: uuid.UUID,
    stock_in: ProductStockUpdate,
    db: Session = Depends(get_db),
) -> ProductRead:
    return update_product_stock(db, merchant_id, product_id, stock_in)
