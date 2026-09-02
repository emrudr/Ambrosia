import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_optional_user, get_current_user
from app.models.user import User
from app.schemas.order import OrderCreate, OrderRead, OrderStatusUpdate
from app.services.order_service import (
    create_order,
    get_user_orders,
    get_merchant_orders,
    get_order_by_id,
    update_order_status,
)

router = APIRouter(tags=["Orders"])


@router.post(
    "/orders",
    response_model=OrderRead,
    status_code=status.HTTP_201_CREATED,
    summary="Checkout cart via Pay-on-Delivery with 10 km proximity and legal age validation",
)
def place_order(
    order_in: OrderCreate,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
) -> OrderRead:
    return create_order(db, order_in, user=current_user, client_age=order_in.user_age)


@router.post(
    "/orders/checkout",
    response_model=OrderRead,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
def checkout_alias(
    order_in: OrderCreate,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
) -> OrderRead:
    """Alias for /orders to support existing tests and client callers."""
    return create_order(db, order_in, user=current_user, client_age=order_in.user_age)


@router.get(
    "/orders/my-orders",
    response_model=List[OrderRead],
    summary="Retrieve customer order history with 4-stage visual stepper metadata",
)
def get_my_orders(
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
) -> List[OrderRead]:
    if not current_user:
        # If guest or demo mode, return recent orders or empty list
        return []
    return get_user_orders(db, current_user.id)


@router.get(
    "/orders/merchant/{merchant_id}",
    response_model=List[OrderRead],
    summary="Retrieve live incoming tickets dispatch queue for merchant venue",
)
def get_orders_for_merchant(
    merchant_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> List[OrderRead]:
    return get_merchant_orders(db, merchant_id)


@router.get(
    "/orders/{order_id}",
    response_model=OrderRead,
    summary="Retrieve single order status and fulfillment tracking",
)
def get_single_order(
    order_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> OrderRead:
    return get_order_by_id(db, order_id)


@router.patch(
    "/orders/{order_id}/status",
    response_model=OrderRead,
    summary="Advance order lifecycle status (RECEIVED -> PREPARING -> OUT_FOR_DELIVERY -> DELIVERED)",
)
def change_order_status(
    order_id: uuid.UUID,
    status_in: OrderStatusUpdate,
    db: Session = Depends(get_db),
) -> OrderRead:
    return update_order_status(db, order_id, status_in)


@router.patch(
    "/merchants/orders/{order_id}/status",
    response_model=OrderRead,
    include_in_schema=False,
)
def merchant_status_alias(
    order_id: uuid.UUID,
    status_in: OrderStatusUpdate,
    db: Session = Depends(get_db),
) -> OrderRead:
    """Alias for /orders/{id}/status to support legacy merchant callers and tests."""
    return update_order_status(db, order_id, status_in)
