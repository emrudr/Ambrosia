from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.user import UserRead, UserLocationUpdate
from app.services.auth_service import update_user_location

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me",
    response_model=UserRead,
    summary="Get authenticated member profile",
)
def get_me(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)


@router.patch(
    "/me/location",
    response_model=UserRead,
    summary="Update customer delivery coordinates and address",
)
def update_location(
    loc_in: UserLocationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserRead:
    updated = update_user_location(db, current_user, loc_in)
    return UserRead.model_validate(updated)
