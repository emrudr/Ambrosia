from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.services.geo_service import get_verified_districts
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.merchants import router as merchants_router
from app.routers.products import router as products_router
from app.routers.orders import router as orders_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "Ambrosia Luxury Artisanal Spirits & Beverage Marketplace API with "
        "Location-Bound Delivery (<=10km via Haversine), Strict Age-Gating (18+), "
        "Zero-Image Architecture, and Pay-on-Delivery fulfillment lifecycle."
    ),
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# Configure CORS for Frontend Integration
origins = settings.cors_origins
allow_all = "*" in origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all else origins,
    allow_credentials=not allow_all,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Modular Routers under API_V1_STR (/api/v1)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)
app.include_router(merchants_router, prefix=settings.API_V1_STR)
app.include_router(products_router, prefix=settings.API_V1_STR)
app.include_router(orders_router, prefix=settings.API_V1_STR)


@app.get(f"{settings.API_V1_STR}/districts", tags=["Geospatial"])
def list_districts():
    """Returns verified Tier-1 urban cluster delivery districts across Delhi and Noida."""
    return get_verified_districts()


@app.get(f"{settings.API_V1_STR}/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "geospatial": "active (Haversine 10km)",
        "age_gate": "active (18+)",
        "fulfillment": "active (Pay-on-Delivery)",
    }


@app.get("/", tags=["Root"])
def root():
    return {
        "service": settings.PROJECT_NAME,
        "tagline": "Curated Artisanal Spirits, Rare Single Malts, and Zero-Proof Botanical Elixirs",
        "status": "operational",
        "docs_url": f"{settings.API_V1_STR}/docs",
        "health_check": f"{settings.API_V1_STR}/health",
    }
