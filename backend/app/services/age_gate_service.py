from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Query
from app.models.product import Product

LEGAL_DRINKING_AGE = 18


def is_legal_age(age: Optional[int]) -> bool:
    """Returns True if user age is 18 or above."""
    if age is None:
        return False
    return age >= LEGAL_DRINKING_AGE


def sanitize_product_query(query: Query, user_age: Optional[int]) -> Query:
    """
    Applies strict legal age-gating isolation to product query:
    If user_age < 18:
        Zero alcoholic beverages are displayed:
        Product.category == 'Non-Alcoholic' AND Product.abv == 0.0.
    If user_age >= 18:
        Full reserve cellar is unlocked.
    """
    if user_age is None or user_age < LEGAL_DRINKING_AGE:
        return query.filter(
            Product.category == "Non-Alcoholic",
            Product.abv == 0.0,
        )
    return query


def can_view_product(product: Product, user_age: Optional[int]) -> bool:
    """
    Validates if an individual product can be viewed/inspected by the user.
    Under-18 accounts cannot see or inspect alcoholic items even if querying by direct ID.
    """
    is_alcoholic = product.abv > 0.0 or product.category == "Alcoholic"
    if is_alcoholic:
        if user_age is None or user_age < LEGAL_DRINKING_AGE:
            return False
    return True


def validate_product_access(product: Product, user_age: Optional[int]) -> None:
    """Raises 403 Forbidden if under-18 user attempts to view an alcoholic product."""
    if not can_view_product(product, user_age):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Under-18 legal age restriction: Alcoholic items cannot be viewed or inspected.",
        )


def validate_order_age(products: List[Product], user_age: Optional[int]) -> None:
    """Validates that cart containing alcoholic items is not purchased by an under-18 user."""
    has_alcohol = any(p.abv > 0.0 or p.category == "Alcoholic" for p in products)
    if has_alcohol:
        if user_age is None or user_age < LEGAL_DRINKING_AGE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Legal Age Restriction: Alcoholic beverages cannot be ordered by users under 18.",
            )
