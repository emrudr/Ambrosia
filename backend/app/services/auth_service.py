import uuid
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.user import User
from app.models.merchant import Merchant
from app.schemas.user import UserCreate, UserRead, TokenResponse, UserLocationUpdate
from app.schemas.merchant import MerchantRead
from app.core.security import get_password_hash, verify_password, create_access_token


def register_user(db: Session, user_in: UserCreate) -> TokenResponse:
    existing_email = db.scalar(select(User).where(User.email == user_in.email.lower().strip()))
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


def authenticate_user(db: Session, email: str, password: str) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == email.lower().strip()))
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email credentials or passcode.",
        )

    token = create_access_token(subject=str(user.id), role="user", extra_claims={"age": user.age})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role="user",
        user=UserRead.model_validate(user),
    )


def authenticate_merchant(db: Session, email: str, password: str) -> TokenResponse:
    merchant = db.scalar(select(Merchant).where(Merchant.email == email.lower().strip()))
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No partner merchant account registered with this corporate email.",
        )
    if merchant.hashed_password:
        if not verify_password(password, merchant.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials for merchant partner vault.",
            )

    token = create_access_token(
        subject=str(merchant.id),
        role="merchant",
        extra_claims={"name": merchant.name},
    )
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role="merchant",
        merchant=MerchantRead.model_validate(merchant).model_dump(),
    )


def update_user_location(db: Session, user: User, loc_in: UserLocationUpdate) -> User:
    user.latitude = loc_in.latitude
    user.longitude = loc_in.longitude
    if loc_in.address_line:
        user.address_line = loc_in.address_line
    if loc_in.district:
        user.district = loc_in.district
    if loc_in.city:
        user.city = loc_in.city
    if loc_in.state:
        user.state = loc_in.state
    if loc_in.pincode:
        user.pincode = loc_in.pincode

    db.commit()
    db.refresh(user)
    return user
