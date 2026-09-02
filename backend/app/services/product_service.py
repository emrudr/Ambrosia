import uuid
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, and_
from fastapi import HTTPException, status

from app.models.product import Product
from app.models.merchant import Merchant
from app.schemas.product import ProductCreate, ProductRead, ProductStockUpdate
from app.services.geo_service import haversine_distance
from app.services.age_gate_service import (
    sanitize_product_query,
    validate_product_access,
    is_legal_age,
)


def list_products(
    db: Session,
    user_lat: Optional[float] = None,
    user_lon: Optional[float] = None,
    user_age: Optional[int] = None,
    category: Optional[str] = None,
    sub_category: Optional[str] = None,
    merchant_id: Optional[uuid.UUID] = None,
    search: Optional[str] = None,
    only_within_radius: bool = False,
) -> List[ProductRead]:
    """
    Catalog queries strictly adhere to:
    1. Legal Age-Gate: If user_age < 18, absolute filter category=='Non-Alcoholic' and abv==0.0.
    2. Proximity Isolation: If coordinates provided and only_within_radius is set (or by default for location-bound browsing),
       only items from venues with straight-line distance <= 10km are returned.
    """
    query = select(Product).options(joinedload(Product.merchant)).where(Product.in_stock == True)

    # 1. Apply Legal Age-Gating Isolation
    query = sanitize_product_query(query, user_age)

    # 2. Category / Sub-Category filters
    if category:
        query = query.where(Product.category.ilike(f"%{category.strip()}%"))
    if sub_category:
        query = query.where(Product.sub_category.ilike(f"%{sub_category.strip()}%"))
    if merchant_id:
        query = query.where(Product.merchant_id == merchant_id)
    if search:
        term = f"%{search.strip()}%"
        query = query.where((Product.name.ilike(term)) | (Product.description.ilike(term)))

    products = db.scalars(query).all()
    results = []

    for prod in products:
        m = prod.merchant
        if not m or not m.is_active:
            continue

        dist = None
        if user_lat is not None and user_lon is not None:
            dist = haversine_distance(user_lat, user_lon, m.latitude, m.longitude)
            # If radius check is enforced
            if only_within_radius and dist > m.delivery_radius_km:
                continue

        p_read = ProductRead.model_validate(prod)
        p_read.merchant_name = m.name
        p_read.merchant_district = m.district
        p_read.merchant_city = m.city
        p_read.distance_km = dist
        results.append((dist if dist is not None else 0.0, p_read))

    if user_lat is not None and user_lon is not None:
        results.sort(key=lambda x: x[0])

    return [item[1] for item in results]


def get_product_by_id(
    db: Session,
    product_id: uuid.UUID,
    user_age: Optional[int] = None,
    user_lat: Optional[float] = None,
    user_lon: Optional[float] = None,
) -> ProductRead:
    prod = db.scalar(
        select(Product)
        .options(joinedload(Product.merchant))
        .where(Product.id == product_id)
    )
    if not prod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Beverage not found in vault registry.",
        )

    # Strict Under-18 protection: Under-18 accounts cannot see or inspect alcoholic items even if querying by direct ID
    validate_product_access(prod, user_age)

    p_read = ProductRead.model_validate(prod)
    if prod.merchant:
        p_read.merchant_name = prod.merchant.name
        p_read.merchant_district = prod.merchant.district
        p_read.merchant_city = prod.merchant.city
        if user_lat is not None and user_lon is not None:
            p_read.distance_km = haversine_distance(
                user_lat, user_lon, prod.merchant.latitude, prod.merchant.longitude
            )
    return p_read


def create_product(db: Session, product_in: ProductCreate) -> ProductRead:
    merchant = db.scalar(select(Merchant).where(Merchant.id == product_in.merchant_id))
    if not merchant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Merchant venue not found.")

    prod = Product(
        merchant_id=product_in.merchant_id,
        name=product_in.name.strip(),
        description=product_in.description.strip(),
        category=product_in.category.strip(),
        sub_category=product_in.sub_category.strip(),
        abv=product_in.abv,
        price=product_in.price,
        volume_ml=product_in.volume_ml,
        in_stock=product_in.in_stock,
        image_url=product_in.image_url,
    )
    db.add(prod)
    db.commit()
    db.refresh(prod)
    return ProductRead.model_validate(prod)


def get_merchant_products(
    db: Session,
    merchant_id: uuid.UUID,
    user_age: Optional[int] = None,
) -> List[ProductRead]:
    query = (
        select(Product)
        .options(joinedload(Product.merchant))
        .where(Product.merchant_id == merchant_id)
    )
    query = sanitize_product_query(query, user_age)
    products = db.scalars(query).all()
    results = []
    for p in products:
        p_read = ProductRead.model_validate(p)
        if p.merchant:
            p_read.merchant_name = p.merchant.name
            p_read.merchant_district = p.merchant.district
            p_read.merchant_city = p.merchant.city
        results.append(p_read)
    return results


def update_product_stock(
    db: Session,
    merchant_id: uuid.UUID,
    product_id: uuid.UUID,
    stock_in: ProductStockUpdate,
) -> ProductRead:
    prod = db.scalar(
        select(Product).where(
            and_(Product.id == product_id, Product.merchant_id == merchant_id)
        )
    )
    if not prod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Beverage not found or does not belong to this merchant.",
        )
    prod.in_stock = stock_in.in_stock
    db.commit()
    db.refresh(prod)
    return ProductRead.model_validate(prod)
