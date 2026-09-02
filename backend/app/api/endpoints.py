from typing import List, Optional
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func, text, desc
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.core.config import settings
from app.core.geospatial import (
    haversine_distance,
    is_within_delivery_radius,
    VERIFIED_DISTRICTS,
)
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
    get_current_merchant,
    get_optional_user,
)
from app.models.ambrosia import (
    User,
    Merchant,
    AssetRegistry,
    Product,
    Order,
    OrderItem,
)
from app.schemas.ambrosia import (
    UserCreate,
    UserLogin,
    UserRead,
    MerchantCreate,
    MerchantLogin,
    MerchantRead,
    AssetRegistryCreate,
    AssetRegistryRead,
    ProductCreate,
    ProductRead,
    ProductStockUpdate,
    OrderCreate,
    OrderStatusUpdate,
    OrderRead,
    OrderItemRead,
    TokenResponse,
    DistrictInfo,
)

router = APIRouter()


# =====================================================================
# 1. AUTHENTICATION & IDENTITY ENDPOINTS
# =====================================================================
@router.post(
    "/auth/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new Ambrosia user",
)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)) -> TokenResponse:
    # Check existing email or phone
    existing_email = db.scalar(select(User).where(User.email == user_in.email.lower()))
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A member account with this email already exists.",
        )
    existing_phone = db.scalar(select(User).where(User.phone_number == user_in.phone_number.strip()))
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A member account with this phone number already exists.",
        )

    hashed_pw = get_password_hash(user_in.password)
    user = User(
        full_name=user_in.full_name.strip(),
        email=user_in.email.lower().strip(),
        phone_number=user_in.phone_number.strip(),
        age=user_in.age,
        hashed_password=hashed_pw,
        address_line=user_in.address_line.strip(),
        city=user_in.city.strip(),
        district=user_in.district.strip(),
        state=user_in.state.strip(),
        pincode=user_in.pincode.strip(),
        latitude=user_in.latitude,
        longitude=user_in.longitude,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=str(user.id), role="user", extra_claims={"age": user.age})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role="user",
        user=UserRead.model_validate(user),
    )


@router.post(
    "/auth/login",
    response_model=TokenResponse,
    summary="User member login",
)
def login_user(login_in: UserLogin, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == login_in.email.lower().strip()))
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please check your email and password.",
        )
    token = create_access_token(subject=str(user.id), role="user", extra_claims={"age": user.age})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role="user",
        user=UserRead.model_validate(user),
    )


@router.get(
    "/auth/me",
    response_model=UserRead,
    summary="Get current user profile",
)
def get_me(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)


@router.post(
    "/auth/merchant/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Onboard & register a merchant partner",
)
def register_merchant(merchant_in: MerchantCreate, db: Session = Depends(get_db)) -> TokenResponse:
    existing = db.scalar(
        select(Merchant).where(
            (Merchant.email == merchant_in.email.lower().strip())
            | (Merchant.license_number == merchant_in.license_number.strip())
        )
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Merchant with this email or license number already exists.",
        )

    hashed_pw = get_password_hash(merchant_in.password) if merchant_in.password else get_password_hash("AmbrosiaMerchant2026!")
    merchant = Merchant(
        name=merchant_in.name.strip(),
        license_number=merchant_in.license_number.strip(),
        type=merchant_in.type.strip(),
        phone_number=merchant_in.phone_number.strip(),
        email=merchant_in.email.lower().strip(),
        address_line=merchant_in.address_line.strip(),
        city=merchant_in.city.strip(),
        district=merchant_in.district.strip(),
        state=merchant_in.state.strip(),
        pincode=merchant_in.pincode.strip(),
        latitude=merchant_in.latitude,
        longitude=merchant_in.longitude,
        delivery_radius_km=merchant_in.delivery_radius_km or 10.0,
        banner_image_url=merchant_in.banner_image_url,
        hashed_password=hashed_pw,
        is_active=True,
    )
    db.add(merchant)
    db.commit()
    db.refresh(merchant)

    token = create_access_token(subject=str(merchant.id), role="merchant")
    m_read = MerchantRead.model_validate(merchant)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role="merchant",
        merchant=m_read,
    )


@router.post(
    "/auth/merchant/login",
    response_model=TokenResponse,
    summary="Merchant partner login",
)
def login_merchant(login_in: MerchantLogin, db: Session = Depends(get_db)) -> TokenResponse:
    merchant = db.scalar(select(Merchant).where(Merchant.email == login_in.email.lower().strip()))
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Merchant partner not found.",
        )
    if merchant.hashed_password and not verify_password(login_in.password, merchant.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid merchant partner password.",
        )
    token = create_access_token(subject=str(merchant.id), role="merchant")
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role="merchant",
        merchant=MerchantRead.model_validate(merchant),
    )


# =====================================================================
# 2. MERCHANT DIRECTORY & MANAGEMENT ENDPOINTS
# =====================================================================
@router.get(
    "/merchants",
    response_model=List[MerchantRead],
    summary="List merchants with dynamic Haversine distance and delivery radius check",
)
def list_merchants(
    lat: Optional[float] = Query(None, description="User latitude for distance calculation"),
    lng: Optional[float] = Query(None, description="User longitude for distance calculation"),
    city: Optional[str] = Query(None, description="Filter by city (e.g. Delhi, Noida)"),
    district: Optional[str] = Query(None, description="Filter by district"),
    only_within_radius: bool = Query(False, description="Only return merchants within delivery radius (<= 10km)"),
    db: Session = Depends(get_db),
) -> List[MerchantRead]:
    stmt = select(Merchant).where(Merchant.is_active == True)
    if city:
        stmt = stmt.where(func.lower(Merchant.city) == city.lower().strip())
    if district:
        stmt = stmt.where(func.lower(Merchant.district) == district.lower().strip())

    merchants = db.scalars(stmt).all()
    results = []

    for m in merchants:
        m_read = MerchantRead.model_validate(m)
        if lat is not None and lng is not None:
            dist = haversine_distance(lat, lng, m.latitude, m.longitude)
            m_read.distance_km = dist
            m_read.is_delivering = dist <= m.delivery_radius_km
            if only_within_radius and not m_read.is_delivering:
                continue
        else:
            m_read.is_delivering = True
        results.append(m_read)

    if lat is not None and lng is not None:
        results.sort(key=lambda x: x.distance_km if x.distance_km is not None else 9999)

    return results


@router.get(
    "/merchants/{merchant_id}",
    response_model=MerchantRead,
    summary="Get single merchant profile",
)
def get_merchant(
    merchant_id: uuid.UUID,
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    db: Session = Depends(get_db),
) -> MerchantRead:
    m = db.scalar(select(Merchant).where(Merchant.id == merchant_id))
    if not m:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Merchant not found")
    m_read = MerchantRead.model_validate(m)
    if lat is not None and lng is not None:
        dist = haversine_distance(lat, lng, m.latitude, m.longitude)
        m_read.distance_km = dist
        m_read.is_delivering = dist <= m.delivery_radius_km
    return m_read


@router.get(
    "/merchants/{merchant_id}/orders",
    response_model=List[OrderRead],
    summary="Get live incoming order queue for a merchant venue",
)
def get_merchant_orders(
    merchant_id: uuid.UUID,
    status_filter: Optional[str] = Query(None, description="Optional filter by status"),
    db: Session = Depends(get_db),
) -> List[OrderRead]:
    stmt = (
        select(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product), joinedload(Order.merchant))
        .where(Order.merchant_id == merchant_id)
        .order_by(desc(Order.created_at))
    )
    if status_filter:
        stmt = stmt.where(Order.status == status_filter.upper().strip())

    orders = db.scalars(stmt).unique().all()
    results = []
    for order in orders:
        items_read = []
        for it in order.items:
            items_read.append(
                OrderItemRead(
                    id=it.id,
                    product_id=it.product_id,
                    quantity=it.quantity,
                    unit_price=float(it.unit_price),
                    product_name=it.product.name if it.product else "Beverage",
                    product_image=it.product.image_url if it.product else "",
                    sub_total=float(it.unit_price) * it.quantity,
                )
            )
        order_read = OrderRead(
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
            merchant_name=order.merchant.name if order.merchant else None,
            merchant_district=order.merchant.district if order.merchant else None,
            merchant_phone=order.merchant.phone_number if order.merchant else None,
            distance_km=haversine_distance(
                order.user_latitude, order.user_longitude, order.merchant.latitude, order.merchant.longitude
            )
            if order.merchant
            else None,
        )
        results.append(order_read)
    return results


@router.patch(
    "/merchants/orders/{order_id}/status",
    response_model=OrderRead,
    summary="Update seller order fulfillment status",
)
def update_order_status(
    order_id: uuid.UUID,
    update_in: OrderStatusUpdate,
    db: Session = Depends(get_db),
) -> OrderRead:
    stmt = (
        select(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product), joinedload(Order.merchant))
        .where(Order.id == order_id)
    )
    order = db.scalar(stmt)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    valid_statuses = ["RECEIVED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]
    new_status = update_in.status.upper().strip()
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{new_status}'. Allowed: {valid_statuses}",
        )

    order.status = new_status
    order.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(order)

    items_read = [
        OrderItemRead(
            id=it.id,
            product_id=it.product_id,
            quantity=it.quantity,
            unit_price=float(it.unit_price),
            product_name=it.product.name if it.product else "Beverage",
            product_image=it.product.image_url if it.product else "",
            sub_total=float(it.unit_price) * it.quantity,
        )
        for it in order.items
    ]

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
        merchant_name=order.merchant.name if order.merchant else None,
        merchant_district=order.merchant.district if order.merchant else None,
        merchant_phone=order.merchant.phone_number if order.merchant else None,
    )


@router.post(
    "/merchants/{merchant_id}/products",
    response_model=ProductRead,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new beverage to a merchant catalog",
)
def add_merchant_product(
    merchant_id: uuid.UUID,
    product_in: ProductCreate,
    db: Session = Depends(get_db),
) -> ProductRead:
    m = db.scalar(select(Merchant).where(Merchant.id == merchant_id))
    if not m:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Merchant not found")

    product = Product(
        merchant_id=merchant_id,
        name=product_in.name.strip(),
        description=product_in.description.strip(),
        category=product_in.category.strip(),
        sub_category=product_in.sub_category.strip(),
        abv=product_in.abv,
        price=product_in.price,
        volume_ml=product_in.volume_ml,
        image_url=product_in.image_url.strip(),
        in_stock=product_in.in_stock,
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    p_read = ProductRead.model_validate(product)
    p_read.merchant_name = m.name
    p_read.merchant_district = m.district
    p_read.merchant_city = m.city
    return p_read


@router.patch(
    "/merchants/{merchant_id}/products/{product_id}/stock",
    response_model=ProductRead,
    summary="Toggle product stock availability",
)
def update_product_stock(
    merchant_id: uuid.UUID,
    product_id: uuid.UUID,
    stock_in: ProductStockUpdate,
    db: Session = Depends(get_db),
) -> ProductRead:
    product = db.scalar(
        select(Product)
        .options(joinedload(Product.merchant))
        .where((Product.id == product_id) & (Product.merchant_id == merchant_id))
    )
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found for this venue")

    product.in_stock = stock_in.in_stock
    db.commit()
    db.refresh(product)

    p_read = ProductRead.model_validate(product)
    if product.merchant:
        p_read.merchant_name = product.merchant.name
        p_read.merchant_district = product.merchant.district
        p_read.merchant_city = product.merchant.city
    return p_read


# =====================================================================
# 3. PRODUCT CATALOG WITH AGE-GATE & RADIUS FILTERING
# =====================================================================
@router.get(
    "/products",
    response_model=List[ProductRead],
    summary="Curated drinks catalog with strict Age-Gate and Proximity filtering",
)
def list_products(
    lat: Optional[float] = Query(None, description="User latitude"),
    lng: Optional[float] = Query(None, description="User longitude"),
    category: Optional[str] = Query(None, description="Category filter (Alcoholic, Non-Alcoholic, Mixer, Gourmet Soda)"),
    sub_category: Optional[str] = Query(None, description="Sub-category (Single Malt, Gin, Tonic, Cold Brew)"),
    merchant_id: Optional[uuid.UUID] = Query(None, description="Filter by merchant ID"),
    user_age: Optional[int] = Query(None, description="Explicit user age for guest filtering"),
    search: Optional[str] = Query(None, description="Search query by name/description"),
    only_within_radius: bool = Query(False, description="Filter strictly within merchant delivery radius (<= 10km)"),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
) -> List[ProductRead]:
    # Determine effective age for age-gating
    effective_age: Optional[int] = None
    if current_user is not None:
        effective_age = current_user.age
    elif user_age is not None:
        effective_age = user_age

    stmt = select(Product).options(joinedload(Product.merchant)).where(Product.in_stock == True)

    # 1. AGE-GATE FILTERING
    # If user is under 18 (e.g. age < 18), strictly exclude all alcoholic items
    if effective_age is not None and effective_age < 18:
        stmt = stmt.where((Product.abv == 0.0) | (func.lower(Product.category) == "non-alcoholic"))

    # 2. CATEGORY & SUB-CATEGORY FILTERS
    if category:
        stmt = stmt.where(func.lower(Product.category) == category.lower().strip())
    if sub_category:
        stmt = stmt.where(func.lower(Product.sub_category) == sub_category.lower().strip())
    if merchant_id:
        stmt = stmt.where(Product.merchant_id == merchant_id)
    if search:
        search_pattern = f"%{search.strip()}%"
        stmt = stmt.where(
            Product.name.ilike(search_pattern) | Product.description.ilike(search_pattern)
        )

    products = db.scalars(stmt).unique().all()
    results = []

    for p in products:
        p_read = ProductRead.model_validate(p)
        if p.merchant:
            p_read.merchant_name = p.merchant.name
            p_read.merchant_district = p.merchant.district
            p_read.merchant_city = p.merchant.city

            if lat is not None and lng is not None:
                dist = haversine_distance(lat, lng, p.merchant.latitude, p.merchant.longitude)
                p_read.distance_km = dist
                if only_within_radius and dist > p.merchant.delivery_radius_km:
                    continue
        results.append(p_read)

    # Sort by distance if location provided
    if lat is not None and lng is not None:
        results.sort(key=lambda x: x.distance_km if x.distance_km is not None else 9999)

    return results


@router.get(
    "/products/{product_id}",
    response_model=ProductRead,
    summary="Get detailed beverage information",
)
def get_product(
    product_id: uuid.UUID,
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    db: Session = Depends(get_db),
) -> ProductRead:
    product = db.scalar(
        select(Product).options(joinedload(Product.merchant)).where(Product.id == product_id)
    )
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    p_read = ProductRead.model_validate(product)
    if product.merchant:
        p_read.merchant_name = product.merchant.name
        p_read.merchant_district = product.merchant.district
        p_read.merchant_city = product.merchant.city
        if lat is not None and lng is not None:
            p_read.distance_km = haversine_distance(
                lat, lng, product.merchant.latitude, product.merchant.longitude
            )
    return p_read


# =====================================================================
# 4. ORDER FULFILLMENT & PAY-ON-DELIVERY LIFECYCLE
# =====================================================================
@router.post(
    "/orders/checkout",
    response_model=OrderRead,
    status_code=status.HTTP_201_CREATED,
    summary="Place a Pay-on-Delivery order with geospatial radius & age validation",
)
def checkout_order(
    order_in: OrderCreate,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
) -> OrderRead:
    # 1. Fetch Merchant
    merchant = db.scalar(select(Merchant).where(Merchant.id == order_in.merchant_id))
    if not merchant or not merchant.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Merchant venue is currently unavailable or inactive.",
        )

    # 2. Geospatial Haversine validation
    dist = haversine_distance(
        order_in.user_latitude,
        order_in.user_longitude,
        merchant.latitude,
        merchant.longitude,
    )
    if dist > merchant.delivery_radius_km:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Delivery address is {dist} km away, which exceeds the merchant's {merchant.delivery_radius_km} km delivery radius.",
        )

    # 3. Validate Cart Items
    if not order_in.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order cart cannot be empty.",
        )

    # 4. Age-gate validation for cart
    effective_age = current_user.age if current_user else order_in.user_age
    total_amount = 0.0
    created_order_items = []

    # Create Order object
    user_id = current_user.id if current_user else None
    new_order = Order(
        user_id=user_id,
        merchant_id=merchant.id,
        total_amount=0.0,  # Updated after items
        delivery_address=order_in.delivery_address.strip(),
        user_latitude=order_in.user_latitude,
        user_longitude=order_in.user_longitude,
        payment_method="PAY_ON_DELIVERY",
        status="RECEIVED",
    )
    db.add(new_order)
    db.flush()  # Generate new_order.id

    for item_in in order_in.items:
        prod = db.scalar(select(Product).where(Product.id == item_in.product_id))
        if not prod:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item_in.product_id} not found.",
            )
        if not prod.in_stock:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Item '{prod.name}' is currently out of stock.",
            )
        # Age check
        if effective_age is not None and effective_age < 18 and (prod.abv > 0.0 or prod.category == "Alcoholic"):
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Age verification failed: '{prod.name}' contains alcohol ({prod.abv}% ABV) and cannot be ordered by users under 18.",
            )

        item_unit_price = float(prod.price)
        sub_total = item_unit_price * item_in.quantity
        total_amount += sub_total

        order_item = OrderItem(
            order_id=new_order.id,
            product_id=prod.id,
            quantity=item_in.quantity,
            unit_price=prod.price,
        )
        db.add(order_item)
        created_order_items.append(
            OrderItemRead(
                id=uuid.uuid4(),
                product_id=prod.id,
                quantity=item_in.quantity,
                unit_price=item_unit_price,
                product_name=prod.name,
                product_image=prod.image_url,
                sub_total=sub_total,
            )
        )

    new_order.total_amount = total_amount
    db.commit()
    db.refresh(new_order)

    return OrderRead(
        id=new_order.id,
        user_id=new_order.user_id,
        merchant_id=new_order.merchant_id,
        total_amount=float(new_order.total_amount),
        delivery_address=new_order.delivery_address,
        user_latitude=new_order.user_latitude,
        user_longitude=new_order.user_longitude,
        payment_method=new_order.payment_method,
        status=new_order.status,
        created_at=new_order.created_at,
        updated_at=new_order.updated_at,
        items=created_order_items,
        merchant_name=merchant.name,
        merchant_district=merchant.district,
        merchant_phone=merchant.phone_number,
        distance_km=dist,
    )


@router.get(
    "/orders/user/active",
    response_model=List[OrderRead],
    summary="Get active real-time orders for current user or latest active orders",
)
def get_active_orders(
    user_id: Optional[uuid.UUID] = Query(None, description="Optional user ID"),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
) -> List[OrderRead]:
    effective_user_id = current_user.id if current_user else user_id

    stmt = (
        select(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product), joinedload(Order.merchant))
        .where(Order.status != "CANCELLED")
        .order_by(desc(Order.created_at))
    )
    if effective_user_id:
        stmt = stmt.where(Order.user_id == effective_user_id)
    else:
        # For demo/guest without user filter, return recent active orders (limit 5)
        stmt = stmt.limit(5)

    orders = db.scalars(stmt).unique().all()
    results = []
    for order in orders:
        items_read = [
            OrderItemRead(
                id=it.id,
                product_id=it.product_id,
                quantity=it.quantity,
                unit_price=float(it.unit_price),
                product_name=it.product.name if it.product else "Beverage",
                product_image=it.product.image_url if it.product else "",
                sub_total=float(it.unit_price) * it.quantity,
            )
            for it in order.items
        ]
        results.append(
            OrderRead(
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
                merchant_name=order.merchant.name if order.merchant else None,
                merchant_district=order.merchant.district if order.merchant else None,
                merchant_phone=order.merchant.phone_number if order.merchant else None,
                distance_km=haversine_distance(
                    order.user_latitude, order.user_longitude, order.merchant.latitude, order.merchant.longitude
                )
                if order.merchant
                else None,
            )
        )
    return results


@router.get(
    "/orders/{order_id}",
    response_model=OrderRead,
    summary="Get single order details and live status",
)
def get_order_by_id(order_id: uuid.UUID, db: Session = Depends(get_db)) -> OrderRead:
    order = db.scalar(
        select(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product), joinedload(Order.merchant))
        .where(Order.id == order_id)
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    items_read = [
        OrderItemRead(
            id=it.id,
            product_id=it.product_id,
            quantity=it.quantity,
            unit_price=float(it.unit_price),
            product_name=it.product.name if it.product else "Beverage",
            product_image=it.product.image_url if it.product else "",
            sub_total=float(it.unit_price) * it.quantity,
        )
        for it in order.items
    ]

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
        merchant_name=order.merchant.name if order.merchant else None,
        merchant_district=order.merchant.district if order.merchant else None,
        merchant_phone=order.merchant.phone_number if order.merchant else None,
        distance_km=haversine_distance(
            order.user_latitude, order.user_longitude, order.merchant.latitude, order.merchant.longitude
        )
        if order.merchant
        else None,
    )


# =====================================================================
# 5. DISTRICTS & ASSET REGISTRY ENDPOINTS
# =====================================================================
@router.get(
    "/districts",
    response_model=List[DistrictInfo],
    summary="List verified Delhi & Noida districts with GPS coordinates",
)
def get_verified_districts() -> List[DistrictInfo]:
    return [DistrictInfo(**d) for d in VERIFIED_DISTRICTS]


@router.get(
    "/assets",
    response_model=List[AssetRegistryRead],
    summary="Get asset registry references for AWS S3 and remote media",
)
def list_assets(db: Session = Depends(get_db)) -> List[AssetRegistryRead]:
    assets = db.scalars(select(AssetRegistry).order_by(AssetRegistry.asset_key)).all()
    return [AssetRegistryRead.model_validate(a) for a in assets]


@router.get(
    "/health",
    summary="System health check",
)
def health_check(db: Session = Depends(get_db)):
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:
        db_status = f"unhealthy: {str(exc)}"

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "service": settings.PROJECT_NAME,
        "database": db_status,
        "version": "1.0.0",
    }
