from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, text
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.wish import Wish
from app.schemas.wish import (
    WishCreate,
    WishResponse,
    WishRead,
    WishCountResponse,
    HealthResponse,
)
from app.services.redis_service import redis_service

router = APIRouter()


@router.post(
    "/wish",
    response_model=WishResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a birthday wish",
    description="Stores the birthday wish in PostgreSQL and updates cached total wishes in Redis.",
)
def create_wish(
    wish_in: WishCreate,
    db: Session = Depends(get_db),
) -> WishResponse:
    clean_name = wish_in.name.strip()
    if not clean_name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Name cannot be empty or just whitespace."
        )

    # 1. Save wish record to PostgreSQL
    try:
        new_wish = Wish(name=clean_name)
        db.add(new_wish)
        db.commit()
        db.refresh(new_wish)
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while saving wish: {str(exc)}"
        )

    # 2. Helper function to query exact count from DB if Redis misses/fails
    def get_db_count() -> int:
        count_stmt = select(func.count(Wish.id))
        return db.scalar(count_stmt) or 0

    # 3. Update / fetch total count using Redis helper with DB fallback
    total_wishes = redis_service.increment_wishes(fallback_fn=get_db_count)

    return WishResponse(
        message=f"Happy Birthday, {clean_name}!",
        total_wishes=total_wishes,
    )


@router.get(
    "/wishes/count",
    response_model=WishCountResponse,
    summary="Get total wishes count",
    description="Retrieves the current cached count of wishes from Redis or PostgreSQL.",
)
def get_wishes_count(db: Session = Depends(get_db)) -> WishCountResponse:
    is_redis_up = redis_service.ping()
    
    def get_db_count() -> int:
        count_stmt = select(func.count(Wish.id))
        return db.scalar(count_stmt) or 0

    count = redis_service.get_total_wishes(fallback_fn=get_db_count)
    return WishCountResponse(
        total_wishes=count,
        source="redis" if is_redis_up else "database"
    )


@router.get(
    "/wishes",
    response_model=List[WishRead],
    summary="List recent wishes",
    description="Retrieves the 20 most recent wishes from PostgreSQL.",
)
def list_recent_wishes(
    limit: int = 20,
    db: Session = Depends(get_db),
) -> List[WishRead]:
    stmt = select(Wish).order_by(Wish.created_at.desc()).limit(min(limit, 100))
    results = db.scalars(stmt).all()
    return list(results)


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="System health check",
    description="Performs readiness and liveness checks against PostgreSQL and Redis.",
)
def health_check(db: Session = Depends(get_db)) -> HealthResponse:
    # Check Database
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:
        db_status = f"unhealthy: {str(exc)}"

    # Check Redis
    redis_status = "healthy" if redis_service.ping() else "offline / degraded"

    overall_status = "healthy" if db_status == "healthy" else "degraded"

    return HealthResponse(
        status=overall_status,
        database=db_status,
        redis=redis_status,
    )
