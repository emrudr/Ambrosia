import os
import sys
import unittest
import uuid
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.core.geospatial import haversine_distance, is_within_delivery_radius
from app.core.security import create_access_token
from app.db.session import SessionLocal
from app.models.ambrosia import User, Merchant, Product, Order

client = TestClient(app)


class AmbrosiaBackendTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()
        # Find sample adult and underage users
        cls.adult_user = cls.db.query(User).filter(User.age >= 18).first()
        cls.underage_user = cls.db.query(User).filter(User.age < 18).first()
        cls.merchants = cls.db.query(Merchant).all()
        cls.imperial_merchant = cls.db.query(Merchant).filter(Merchant.name.like("%Imperial%")).first()
        cls.gilded_merchant = cls.db.query(Merchant).filter(Merchant.name.like("%Gilded%")).first()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_haversine_distance_accuracy(self):
        """Test the Haversine formula against known benchmark coordinates."""
        # Connaught Place (28.6289, 77.2195) to Hauz Khas (28.5494, 77.2001) ~ 9.04 km
        dist_delhi = haversine_distance(28.6289, 77.2195, 28.5494, 77.2001)
        self.assertAlmostEqual(dist_delhi, 9.04, delta=0.5)
        self.assertTrue(is_within_delivery_radius(28.6289, 77.2195, 28.5494, 77.2001, radius_km=10.0))

        # Connaught Place (28.6289, 77.2195) to Noida Sector 18 (28.5708, 77.3219) ~ 12.0 km (> 10 km)
        dist_noida_cp = haversine_distance(28.6289, 77.2195, 28.5708, 77.3219)
        self.assertGreater(dist_noida_cp, 10.0)
        self.assertFalse(is_within_delivery_radius(28.6289, 77.2195, 28.5708, 77.3219, radius_km=10.0))

    def test_age_gate_underage_filter(self):
        """Test that user_age < 18 or underage auth token strictly hides all alcoholic drinks."""
        # Underage query
        res = client.get("/api/v1/products?user_age=17")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreater(len(data), 0)
        for item in data:
            self.assertEqual(item["abv"], 0.0, f"Found alcoholic item '{item['name']}' in under-18 catalog")
            self.assertNotEqual(item["category"], "Alcoholic")

    def test_age_gate_adult_unlocked(self):
        """Test that user_age >= 18 has full access to Single Malts, Gins, and Craft Beers."""
        res = client.get("/api/v1/products?user_age=28")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        has_alcoholic = any(item["abv"] > 0 for item in data)
        self.assertTrue(has_alcoholic, "Adult catalog should include alcoholic spirits")

    def test_merchant_proximity_listing(self):
        """Test listing merchants with location calculates distance and radius."""
        # Query from Connaught Place
        res = client.get("/api/v1/merchants?lat=28.6289&lng=77.2195")
        self.assertEqual(res.status_code, 200)
        merchants = res.json()
        self.assertGreater(len(merchants), 0)
        first_m = merchants[0]
        self.assertIsNotNone(first_m["distance_km"])
        self.assertLessEqual(first_m["distance_km"], 2.0)  # Closest should be nearby CP

    def test_checkout_within_and_outside_radius(self):
        """Test that checkout succeeds within 10km and fails beyond 10km."""
        m = self.imperial_merchant
        prod = self.db.query(Product).filter(Product.merchant_id == m.id).first()
        self.assertIsNotNone(prod)

        # 1. Checkout from 20 km away (Greater Noida / Sector 150 coords) -> Should fail
        payload_far = {
            "merchant_id": str(m.id),
            "items": [{"product_id": str(prod.id), "quantity": 1}],
            "delivery_address": "Far away location",
            "user_latitude": 28.4601,
            "user_longitude": 77.4789,
            "payment_method": "PAY_ON_DELIVERY",
            "user_age": 28,
        }
        res_far = client.post("/api/v1/orders/checkout", json=payload_far)
        self.assertEqual(res_far.status_code, 400)
        self.assertIn("exceeds the merchant's 10.0 km delivery radius", res_far.json()["detail"])

        # 2. Checkout within 2 km (Connaught Place) -> Should succeed
        payload_near = {
            "merchant_id": str(m.id),
            "items": [{"product_id": str(prod.id), "quantity": 1}],
            "delivery_address": "Near Janpath Lane, Connaught Place",
            "user_latitude": 28.6289,
            "user_longitude": 77.2195,
            "payment_method": "PAY_ON_DELIVERY",
            "user_age": 28,
        }
        res_near = client.post("/api/v1/orders/checkout", json=payload_near)
        self.assertEqual(res_near.status_code, 201)
        order_data = res_near.json()
        self.assertEqual(order_data["status"], "RECEIVED")
        self.assertEqual(order_data["payment_method"], "PAY_ON_DELIVERY")

        # 3. Seller status transition
        order_id = order_data["id"]
        # Advance to PREPARING
        res_prep = client.patch(
            f"/api/v1/merchants/orders/{order_id}/status",
            json={"status": "PREPARING"},
        )
        self.assertEqual(res_prep.status_code, 200)
        self.assertEqual(res_prep.json()["status"], "PREPARING")

        # Advance to OUT_FOR_DELIVERY
        res_out = client.patch(
            f"/api/v1/merchants/orders/{order_id}/status",
            json={"status": "OUT_FOR_DELIVERY"},
        )
        self.assertEqual(res_out.status_code, 200)
        self.assertEqual(res_out.json()["status"], "OUT_FOR_DELIVERY")

        # Advance to DELIVERED
        res_del = client.patch(
            f"/api/v1/merchants/orders/{order_id}/status",
            json={"status": "DELIVERED"},
        )
        self.assertEqual(res_del.status_code, 200)
        self.assertEqual(res_del.json()["status"], "DELIVERED")

    def test_underage_cannot_order_alcohol(self):
        """Test that checkout rejects alcoholic items for underage users."""
        m = self.imperial_merchant
        alc_prod = (
            self.db.query(Product)
            .filter(Product.merchant_id == m.id, Product.abv > 0.0)
            .first()
        )
        self.assertIsNotNone(alc_prod)

        payload = {
            "merchant_id": str(m.id),
            "items": [{"product_id": str(alc_prod.id), "quantity": 1}],
            "delivery_address": "Connaught Place",
            "user_latitude": 28.6289,
            "user_longitude": 77.2195,
            "payment_method": "PAY_ON_DELIVERY",
            "user_age": 16,  # Under 18
        }
        res = client.post("/api/v1/orders/checkout", json=payload)
        self.assertEqual(res.status_code, 403)
        self.assertIn("cannot be ordered by users under 18", res.json()["detail"])


if __name__ == "__main__":
    unittest.main()
