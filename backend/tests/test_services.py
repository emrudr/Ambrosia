import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.merchant import Merchant
from app.models.product import Product
from app.services.geo_service import (
    haversine_distance,
    is_within_delivery_radius,
    get_verified_districts,
)
from app.services.age_gate_service import (
    is_legal_age,
    can_view_product,
    validate_product_access,
)
from app.services.merchant_service import get_nearby_merchants
from app.services.product_service import list_products, get_product_by_id
from fastapi import HTTPException


class AmbrosiaServicesTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()
        cls.adult_user = cls.db.query(User).filter(User.age >= 18).first()
        cls.underage_user = cls.db.query(User).filter(User.age < 18).first()
        cls.imperial = cls.db.query(Merchant).filter(Merchant.name.like("%Imperial%")).first()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_geo_service_districts(self):
        districts = get_verified_districts()
        self.assertEqual(len(districts), 20)
        delhi_count = sum(1 for d in districts if d["city"] == "Delhi")
        noida_count = sum(1 for d in districts if d["city"] == "Noida")
        self.assertEqual(delhi_count, 10)
        self.assertEqual(noida_count, 10)

    def test_age_gate_logic(self):
        self.assertTrue(is_legal_age(18))
        self.assertTrue(is_legal_age(25))
        self.assertFalse(is_legal_age(17))
        self.assertFalse(is_legal_age(None))

        # Check product inspection restriction
        alc_prod = self.db.query(Product).filter(Product.abv > 0.0).first()
        self.assertIsNotNone(alc_prod)
        self.assertFalse(can_view_product(alc_prod, user_age=17))
        self.assertTrue(can_view_product(alc_prod, user_age=21))

        with self.assertRaises(HTTPException):
            validate_product_access(alc_prod, user_age=16)

    def test_nearby_merchants_service(self):
        # CP coordinates (28.6289, 77.2195)
        merchants = get_nearby_merchants(self.db, user_lat=28.6289, user_lon=77.2195, radius_km=10.0)
        self.assertGreater(len(merchants), 0)
        for m in merchants:
            self.assertLessEqual(m.distance_km, 10.0)
            self.assertTrue(m.is_delivering)

    def test_product_service_sanitization(self):
        # Underage list
        underage_prods = list_products(self.db, user_age=16)
        self.assertGreater(len(underage_prods), 0)
        for p in underage_prods:
            self.assertEqual(p.abv, 0.0)
            self.assertEqual(p.category, "Non-Alcoholic")

        # Adult list
        adult_prods = list_products(self.db, user_age=25)
        has_spirits = any(p.abv > 0.0 for p in adult_prods)
        self.assertTrue(has_spirits)


if __name__ == "__main__":
    unittest.main()
