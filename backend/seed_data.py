#!/usr/bin/env python3
"""
Ambrosia Luxury Spirits & Beverage Marketplace Seeder
Populates 10 Delhi + 10 Noida premium licensed venues, 45+ curated artisanal beverages,
and demo user accounts (Adult 28yo & Underage 17yo).
"""

import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User
from app.models.merchant import Merchant
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.asset_registry import AssetRegistry

from seed_ambrosia import (
    ASSETS_DATA,
    DELHI_MERCHANTS,
    NOIDA_MERCHANTS,
    BEVERAGES_CATALOG,
)


def seed_database():
    print("✨ Connecting to Ambrosia database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("🧹 Cleaning existing Ambrosia data...")
        db.query(OrderItem).delete()
        db.query(Order).delete()
        db.query(Product).delete()
        db.query(Merchant).delete()
        db.query(User).delete()
        db.query(AssetRegistry).delete()
        db.commit()

        print("🖼️  Seeding Asset Registry...")
        for asset in ASSETS_DATA:
            db.add(
                AssetRegistry(
                    asset_key=asset["asset_key"],
                    url=asset["url"],
                    description=asset["description"],
                )
            )
        db.commit()
        print(f"   ✓ Seeded {len(ASSETS_DATA)} Asset Registry entries.")

        print("👥 Seeding Demo Users...")
        adult_user = User(
            full_name="Rajesh Khanna",
            email="rajesh.khanna@luxury.in",
            phone_number="+91 98111 22334",
            age=28,
            hashed_password=get_password_hash("AmbrosiaElite2026!"),
            address_line="Flat 4B, Barakhamba Court, Connaught Place",
            city="Delhi",
            district="Connaught Place",
            state="Delhi",
            pincode="110001",
            latitude=28.6289,
            longitude=77.2195,
        )
        underage_user = User(
            full_name="Aarav Sharma",
            email="aarav.sharma@younggen.in",
            phone_number="+91 98222 33445",
            age=17,
            hashed_password=get_password_hash("AmbrosiaYoung2026!"),
            address_line="Tower 3, Sector 18 Promenade",
            city="Noida",
            district="Sector 18",
            state="Uttar Pradesh",
            pincode="201301",
            latitude=28.5708,
            longitude=77.3219,
        )
        db.add(adult_user)
        db.add(underage_user)
        db.commit()
        db.refresh(adult_user)
        db.refresh(underage_user)
        print("   ✓ Seeded 2 demo users (Adult 28yo & Underage 17yo).")

        print("🏛️  Seeding 20 Luxury Merchants (10 Delhi + 10 Noida)...")
        created_merchants = []
        for m_data in DELHI_MERCHANTS + NOIDA_MERCHANTS:
            merchant = Merchant(
                name=m_data["name"],
                license_number=m_data["license_number"],
                type=m_data["type"],
                phone_number=m_data["phone_number"],
                email=m_data["email"],
                address_line=m_data["address_line"],
                city=m_data["city"],
                district=m_data["district"],
                state=m_data["state"],
                pincode=m_data["pincode"],
                latitude=m_data["latitude"],
                longitude=m_data["longitude"],
                delivery_radius_km=m_data["delivery_radius_km"],
                banner_image_url=m_data.get("banner_image_url"),
                hashed_password=get_password_hash("AmbrosiaPartner2024!"),
                is_active=True,
            )
            db.add(merchant)
            db.flush()
            created_merchants.append(merchant)
        db.commit()
        print(f"   ✓ Seeded {len(created_merchants)} luxury venues.")

        print("🍾 Seeding 45+ Curated Artisanal Beverages across Venues...")
        created_products = []
        for idx, bev in enumerate(BEVERAGES_CATALOG):
            # Distribute items across multiple merchants based on index
            m_indices = [idx % len(created_merchants), (idx + 4) % len(created_merchants), (idx + 10) % len(created_merchants)]
            for m_idx in set(m_indices):
                merchant = created_merchants[m_idx]
                # Soft beverage lounges only carry Non-Alcoholic
                if "Soft" in merchant.type and bev["category"] != "Non-Alcoholic":
                    continue

                prod = Product(
                    merchant_id=merchant.id,
                    name=bev["name"],
                    description=bev["description"],
                    category=bev["category"],
                    sub_category=bev["sub_category"],
                    abv=bev["abv"],
                    price=bev["price"],
                    volume_ml=bev["volume_ml"],
                    in_stock=True,
                    image_url=bev.get("image_url", ""),
                )
                db.add(prod)
                created_products.append(prod)

        db.commit()
        print(f"   ✓ Seeded {len(created_products)} product catalog allocations.")

        # Seed 2 live demonstration orders
        imperial_merchant = next((m for m in created_merchants if "Imperial" in m.name), created_merchants[0])
        gilded_merchant = next((m for m in created_merchants if "Gilded" in m.name), created_merchants[1])

        imperial_prods = [p for p in created_products if p.merchant_id == imperial_merchant.id]
        if imperial_prods:
            p1 = imperial_prods[0]
            p2 = imperial_prods[1] if len(imperial_prods) > 1 else imperial_prods[0]
            order1 = Order(
                user_id=adult_user.id,
                merchant_id=imperial_merchant.id,
                total_amount=float(p1.price + p2.price),
                delivery_address="Flat 4B, Barakhamba Court, Connaught Place",
                user_latitude=28.6289,
                user_longitude=77.2195,
                payment_method="PAY_ON_DELIVERY",
                status="PREPARING",
            )
            db.add(order1)
            db.flush()
            db.add(OrderItem(order_id=order1.id, product_id=p1.id, quantity=1, unit_price=p1.price))
            db.add(OrderItem(order_id=order1.id, product_id=p2.id, quantity=1, unit_price=p2.price))

        gilded_prods = [p for p in created_products if p.merchant_id == gilded_merchant.id]
        na_prods = [p for p in gilded_prods if p.abv == 0.0]
        if na_prods:
            p_na = na_prods[0]
            order2 = Order(
                user_id=underage_user.id,
                merchant_id=gilded_merchant.id,
                total_amount=float(p_na.price * 2),
                delivery_address="Tower 3, Sector 18 Promenade, Noida",
                user_latitude=28.5708,
                user_longitude=77.3219,
                payment_method="PAY_ON_DELIVERY",
                status="OUT_FOR_DELIVERY",
            )
            db.add(order2)
            db.flush()
            db.add(OrderItem(order_id=order2.id, product_id=p_na.id, quantity=2, unit_price=p_na.price))

        db.commit()
        print("📦 Seeded 2 active demonstration orders (PREPARING & OUT_FOR_DELIVERY).")
        print("🏆 Ambrosia seed_data.py execution complete!")

    except Exception as e:
        db.rollback()
        print(f"❌ Seeding error: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
