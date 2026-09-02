from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.user import UserCreate, UserLogin, TokenResponse
from app.services.auth_service import register_user, authenticate_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new Ambrosia member account",
)
def register(user_in: UserCreate, db: Session = Depends(get_db)) -> TokenResponse:
    return register_user(db, user_in)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate member and retrieve access token",
)
def login(login_in: UserLogin, db: Session = Depends(get_db)) -> TokenResponse:
    return authenticate_user(db, login_in.email, login_in.password)
