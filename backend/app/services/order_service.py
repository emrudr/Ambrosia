import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, desc
from fastapi import HTTPException, status

from app.models.order import Order, OrderItem
from app.models.merchant import Merchant
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderCreate, OrderRead, OrderItemRead, OrderStatusUpdate
from app.services.geo_service import haversine_distance, is_within_delivery_radius
from app.services.age_gate_service import validate_order_age

VALID_STATUS_FLOW = ["RECEIVED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]


def create_order(
    db: Session,
    order_in: OrderCreate,
    user: Optional[User] = None,
    client_age: Optional[int] = None,
) -> OrderRead:
    # 1. Fetch and validate Merchant
    merchant = db.scalar(select(Merchant).where(Merchant.id == order_in.merchant_id))
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Merchant venue not found.",
        )
    if not merchant.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Merchant venue is currently offline.",
        )

    # 2. Hyper-Local 10km Delivery Boundary Enforcement
    dist = haversine_distance(
        order_in.user_latitude,
        order_in.user_longitude,
        merchant.latitude,
        merchant.longitude,
    )
    if dist > merchant.delivery_radius_km:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Delivery boundary exceeded: Your location is {dist} km away, which "
                f"exceeds the merchant's {merchant.delivery_radius_km} km delivery radius."
            ),
        )

    # 3. Payment Method: Pay-on-Delivery
    if order_in.payment_method != "PAY_ON_DELIVERY":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Currently, only 'PAY_ON_DELIVERY' is supported.",
        )

    # 4. Fetch Products & Verify Stock and Single Merchant
    if not order_in.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must contain at least one item.",
        )

    product_ids = [item.product_id for item in order_in.items]
    products = db.scalars(select(Product).where(Product.id.in_(product_ids))).all()
    prod_map = {p.id: p for p in products}

    for item in order_in.items:
        if item.product_id not in prod_map:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product ID {item.product_id} not found.",
            )
        p = prod_map[item.product_id]
        if p.merchant_id != merchant.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"All items must be ordered from the same venue ({merchant.name}).",
            )
        if not p.in_stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Item '{p.name}' is currently out of stock.",
            )

    # 5. Strict Legal Age-Gate Validation
    effective_age = user.age if user else (order_in.user_age or client_age)
    validate_order_age(list(prod_map.values()), effective_age)

    # 6. Compute Total & Build Order
    total_amount = sum(prod_map[item.product_id].price * item.quantity for item in order_in.items)

    order = Order(
        user_id=user.id if user else None,
        merchant_id=merchant.id,
        total_amount=total_amount,
        delivery_address=order_in.delivery_address.strip(),
        user_latitude=order_in.user_latitude,
        user_longitude=order_in.user_longitude,
        payment_method=order_in.payment_method,
        status="RECEIVED",
    )
    db.add(order)
    db.flush()

    for item in order_in.items:
        p = prod_map[item.product_id]
        order_item = OrderItem(
            order_id=order.id,
            product_id=p.id,
            quantity=item.quantity,
            unit_price=p.price,
        )
        db.add(order_item)

    db.commit()
    db.refresh(order)

    return _format_order_read(db, order, dist)


def get_user_orders(db: Session, user_id: uuid.UUID) -> List[OrderRead]:
    """Retrieves all orders placed by the user with items and merchant metadata."""
    orders = db.scalars(
        select(Order)
        .options(joinedload(Order.merchant), joinedload(Order.items).joinedload(OrderItem.product))
        .where(Order.user_id == user_id)
        .order_by(desc(Order.created_at))
    ).unique().all()

    return [_format_order_read(db, o) for o in orders]


def get_merchant_orders(db: Session, merchant_id: uuid.UUID) -> List[OrderRead]:
    """Retrieves live dispatch tickets queue for a merchant venue."""
    orders = db.scalars(
        select(Order)
        .options(joinedload(Order.merchant), joinedload(Order.items).joinedload(OrderItem.product), joinedload(Order.user))
        .where(Order.merchant_id == merchant_id)
        .order_by(desc(Order.created_at))
    ).unique().all()

    return [_format_order_read(db, o) for o in orders]


def get_order_by_id(db: Session, order_id: uuid.UUID) -> OrderRead:
    order = db.scalar(
        select(Order)
        .options(joinedload(Order.merchant), joinedload(Order.items).joinedload(OrderItem.product), joinedload(Order.user))
        .where(Order.id == order_id)
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
    return _format_order_read(db, order)


def update_order_status(db: Session, order_id: uuid.UUID, status_in: OrderStatusUpdate) -> OrderRead:
    """
    Steps an order through the fulfillment lifecycle:
    RECEIVED -> PREPARING -> OUT_FOR_DELIVERY -> DELIVERED (or CANCELLED)
    """
    new_status = status_in.status.upper().strip()
    if new_status not in VALID_STATUS_FLOW:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid order status: {new_status}. Allowed: {VALID_STATUS_FLOW}",
        )

    order = db.scalar(
        select(Order)
        .options(joinedload(Order.merchant), joinedload(Order.items).joinedload(OrderItem.product))
        .where(Order.id == order_id)
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    order.status = new_status
    order.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(order)

    return _format_order_read(db, order)


def _format_order_read(db: Session, order: Order, distance_km: Optional[float] = None) -> OrderRead:
    items_read = []
    for item in order.items:
        p_name = item.product.name if item.product else "Allocated Spirit"
        p_img = item.product.image_url if item.product else ""
        sub_total = float(item.unit_price * item.quantity)
        items_read.append(
            OrderItemRead(
                id=item.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=float(item.unit_price),
                product_name=p_name,
                product_image=p_img,
                sub_total=sub_total,
            )
        )

    merchant_name = order.merchant.name if order.merchant else None
    merchant_district = order.merchant.district if order.merchant else None
    merchant_phone = order.merchant.phone_number if order.merchant else None

    d = distance_km
    if d is None and order.merchant:
        d = haversine_distance(
            order.user_latitude,
            order.user_longitude,
            order.merchant.latitude,
            order.merchant.longitude,
        )

    return OrderRead(
        id=order.id,
        user_id=order.user_id,
        merchant_id=order.merchant_id,
        total_amount=float(order.total_amount),
        delivery_address=order.delivery_address,
        user_latitude=order.user_latitude,
        user_longitude=order.user_longitude,
        payment_method=order.payment_method,
        status=order.status,
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=items_read,
        merchant_name=merchant_name,
        merchant_district=merchant_district,
        merchant_phone=merchant_phone,
        distance_km=d,
    )
