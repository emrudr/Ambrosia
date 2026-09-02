import os
import sys
import uuid
from datetime import datetime, timezone
from sqlalchemy import select, delete
from sqlalchemy.orm import Session

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.core.security import get_password_hash
from app.models.ambrosia import (
    User,
    Merchant,
    AssetRegistry,
    Product,
    Order,
    OrderItem,
)


ASSETS_DATA = [
    {
        "asset_key": "hero_banner",
        "url": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1600&auto=format&fit=crop",
        "description": "Atmospheric luxury wine cellar and tasting vault with warm ambient lighting",
    },
    {
        "asset_key": "brand_logo",
        "url": "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?q=80&w=800&auto=format&fit=crop",
        "description": "Ambrosia Golden Chalice Emblem",
    },
    {
        "asset_key": "whiskey_macallan",
        "url": "https://images.unsplash.com/photo-1527281400683-1aae777175f8?q=80&w=800&auto=format&fit=crop",
        "description": "Macallan Double Cask Single Malt in crystal tumbler",
    },
    {
        "asset_key": "whiskey_glenfiddich",
        "url": "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?q=80&w=800&auto=format&fit=crop",
        "description": "Glenfiddich 18 Reserve Scotch Whisky",
    },
    {
        "asset_key": "whiskey_yamazaki",
        "url": "https://images.unsplash.com/photo-1582819509235-c75c87a95267?q=80&w=800&auto=format&fit=crop",
        "description": "Yamazaki 12 Single Malt Japanese Whisky",
    },
    {
        "asset_key": "whiskey_lagavulin",
        "url": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=800&auto=format&fit=crop",
        "description": "Lagavulin 16 Islay Peated Single Malt",
    },
    {
        "asset_key": "gin_monkey47",
        "url": "https://images.unsplash.com/photo-1608885898957-a559228e8749?q=80&w=800&auto=format&fit=crop",
        "description": "Monkey 47 Schwarzwald Dry Gin bottle",
    },
    {
        "asset_key": "gin_hendricks",
        "url": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=800&auto=format&fit=crop",
        "description": "Hendrick's Botanical Flora Adora Gin",
    },
    {
        "asset_key": "tequila_donjulio",
        "url": "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?q=80&w=800&auto=format&fit=crop",
        "description": "Don Julio 1942 Luxury Anejo Tequila",
    },
    {
        "asset_key": "vodka_greygoose",
        "url": "https://images.unsplash.com/photo-1582819509235-c75c87a95267?q=80&w=800&auto=format&fit=crop",
        "description": "Grey Goose VX Exceptionnelle French Vodka",
    },
    {
        "asset_key": "beer_craft",
        "url": "https://images.unsplash.com/photo-1608270586620-248524c67de9?q=80&w=800&auto=format&fit=crop",
        "description": "Artisanal Craft Microbrew Belgian Ale",
    },
    {
        "asset_key": "non_alcoholic_seedlip",
        "url": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=800&auto=format&fit=crop",
        "description": "Seedlip Spice 94 Distilled Non-Alcoholic Botanical Spirit",
    },
    {
        "asset_key": "mocktail_rose",
        "url": "https://images.unsplash.com/photo-1536935338788-846bb9981813?q=80&w=800&auto=format&fit=crop",
        "description": "Hibiscus Rose Botanical Sparkling Mocktail",
    },
    {
        "asset_key": "tonic_fevertree",
        "url": "https://images.unsplash.com/photo-1621263764928-df1444c5e859?q=80&w=800&auto=format&fit=crop",
        "description": "Fever-Tree Mediterranean Artisan Tonic Water",
    },
    {
        "asset_key": "coldbrew_tokai",
        "url": "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?q=80&w=800&auto=format&fit=crop",
        "description": "Nitro Cascara Cold Brew Coffee Elixir",
    },
    {
        "asset_key": "venue_imperial",
        "url": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1200&auto=format&fit=crop",
        "description": "The Imperial Cellar & Bar Connaught Place",
    },
    {
        "asset_key": "venue_sidecar",
        "url": "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?q=80&w=1200&auto=format&fit=crop",
        "description": "Sidecar Artisanal Speakeasy Greater Kailash",
    },
    {
        "asset_key": "venue_noida_barrel",
        "url": "https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=1200&auto=format&fit=crop",
        "description": "The Gilded Barrel Sector 18 Noida",
    },
]


DELHI_MERCHANTS = [
    {
        "name": "The Imperial Cellar & Bar",
        "license_number": "DL-EXC-2024-00101",
        "type": "Wine Cellar & Bar",
        "phone_number": "+91 11 4150 1111",
        "email": "sommelier@imperialcellar.in",
        "address_line": "Janpath Lane, Connaught Place",
        "city": "Delhi",
        "district": "Connaught Place",
        "state": "Delhi",
        "pincode": "110001",
        "latitude": 28.6289,
        "longitude": 77.2195,
        "delivery_radius_km": 10.0,
        "banner_image_url": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1200&auto=format&fit=crop",
    },
    {
        "name": "Hauz Khas Reserve Vault",
        "license_number": "DL-EXC-2024-00102",
        "type": "Microbrewery & Spirits",
        "phone_number": "+91 11 4150 1112",
        "email": "cellar@hkreserve.in",
        "address_line": "12 Hauz Khas Village Main Road",
        "city": "Delhi",
        "district": "Hauz Khas",
        "state": "Delhi",
        "pincode": "110016",
        "latitude": 28.5494,
        "longitude": 77.2001,
        "delivery_radius_km": 10.0,
        "banner_image_url": "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?q=80&w=1200&auto=format&fit=crop",
    },
    {
        "name": "Saket Sovereign Spirits",
        "license_number": "DL-EXC-2024-00103",
        "type": "Bar & Lounge",
        "phone_number": "+91 11 4150 1113",
        "email": "orders@saketsovereign.in",
        "address_line": "Select Citywalk Arcade, Saket",
        "city": "Delhi",
        "district": "Saket",
        "state": "Delhi",
        "pincode": "110017",
        "latitude": 28.5244,
        "longitude": 77.2185,
        "delivery_radius_km": 10.0,
        "banner_image_url": "https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=1200&auto=format&fit=crop",
    },
    {
        "name": "PCO Speakeasy Vault",
        "license_number": "DL-EXC-2024-00104",
        "type": "Bar",
        "phone_number": "+91 11 4150 1114",
        "email": "passcode@pcovault.in",
        "address_line": "D-Block Market, Vasant Vihar / Vasant Kunj",
        "city": "Delhi",
        "district": "Vasant Kunj",
        "state": "Delhi",
        "pincode": "110070",
        "latitude": 28.5293,
        "longitude": 77.1517,
        "delivery_radius_km": 10.0,
        "banner_image_url": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200&auto=format&fit=crop",
    },
    {
        "name": "Aerocity Aviator Lounge & Cellar",
        "license_number": "DL-EXC-2024-00105",
        "type": "Wine Cellar",
        "phone_number": "+91 11 4150 1115",
        "email": "concierge@aviatorlounge.in",
        "address_line": "Worldmark 2, Hospitality District, Aerocity",
        "city": "Delhi",
        "district": "Aerocity",
        "state": "Delhi",
        "pincode": "110037",
        "latitude": 28.5510,
        "longitude": 77.1219,
        "delivery_radius_km": 10.0,
        "banner_image_url": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1200&auto=format&fit=crop",
    },
    {
        "name": "Dwarka Monarch Cellar",
        "license_number": "DL-EXC-2024-00106",
        "type": "Soft Beverage Lounge & Spirits",
        "phone_number": "+91 11 4150 1116",
        "email": "orders@dwarkamonarch.in",
        "address_line": "Sector 10 Main Boulevard, Dwarka",
        "city": "Delhi",
        "district": "Dwarka",
        "state": "Delhi",
        "pincode": "110075",
        "latitude": 28.5921,
        "longitude": 77.0460,
        "delivery_radius_km": 10.0,
        "banner_image_url": "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?q=80&w=1200&auto=format&fit=crop",
    },
    {
        "name": "Khan Market Grand Sommelier",
        "license_number": "DL-EXC-2024-00107",
        "type": "Wine Cellar",
        "phone_number": "+91 11 4150 1117",
        "email": "sommelier@grandsommelier.in",
        "address_line": "Middle Lane, Khan Market",
        "city": "Delhi",
        "district": "Khan Market",
        "state": "Delhi",
        "pincode": "110003",
        "latitude": 28.6002,
        "longitude": 77.2270,
        "delivery_radius_km": 10.0,
        "banner_image_url": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200&auto=format&fit=crop",
    },
    {
        "name": "Sidecar Artisanal Bar",
        "license_number": "DL-EXC-2024-00108",
        "type": "Bar & Microbrewery",
        "phone_number": "+91 11 4150 1118",
        "email": "mixology@sidecardelhi.in",
        "address_line": "M-Block Market, Greater Kailash II",
        "city": "Delhi",
        "district": "Greater Kailash",
        "state": "Delhi",
        "pincode": "110048",
        "latitude": 28.5332,
        "longitude": 77.2425,
        "delivery_radius_km": 10.0,
        "banner_image_url": "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?q=80&w=1200&auto=format&fit=crop",
    },
    {
        "name": "Rajouri Heritage Brewer & Spirits",
        "license_number": "DL-EXC-2024-00109",
        "type": "Microbrewery",
        "phone_number": "+91 11 4150 1119",
        "email": "craft@rajouriheritage.in",
        "address_line": "Ring Road Hub, Rajouri Garden",
        "city": "Delhi",
        "district": "Rajouri Garden",
        "state": "Delhi",
        "pincode": "110027",
        "latitude": 28.6415,
        "longitude": 77.1211,
        "delivery_radius_km": 10.0,
        "banner_image_url": "https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=1200&auto=format&fit=crop",
    },
    {
        "name": "The Manor Spirits & Botanicals",
        "license_number": "DL-EXC-2024-00110",
        "type": "Soft Beverage Lounge & Bar",
        "phone_number": "+91 11 4150 1120",
        "email": "botanicals@manordefcol.in",
        "address_line": "Flyover Market, Defence Colony",
        "city": "Delhi",
        "district": "Defence Colony",
        "state": "Delhi",
        "pincode": "110024",
        "latitude": 28.5727,
        "longitude": 77.2348,
        "delivery_radius_km": 10.0,
        "banner_image_url": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1200&auto=format&fit=crop",
    },
]

NOIDA_MERCHANTS = [
    {
        "name": "The Gilded Barrel",
        "license_number": "UP-EXC-2024-00201",
        "type": "Bar & Wine Cellar",
        "phone_number": "+91 120 450 2001",
        "email": "concierge@gildedbarrel.in",
        "address_line": "Atta Market Promenade, Sector 18",
        "city": "Noida",
        "district": "Sector 18",
        "state": "Uttar Pradesh",
        "pincode": "201301",
        "latitude": 28.5708,
        "longitude": 77.3219,
        "delivery_radius_km": 10.0,
        "banner_image_url": "https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=1200&auto=format&fit=crop",
    },
    {
        "name": "The Cellar 62",
        "license_number": "UP-EXC-2024-00202",
        "type": "Wine Cellar",
        "phone_number": "+91 120 450 2002",
        "email": "cellar62@ambrosiavenues.in",
        "address_line": "Stellar IT Park Avenue, Sector 62",
        "city": "Noida",
        "district": "Sector 62",
        "state": "Uttar Pradesh",
        "pincode": "201309",
        "latitude": 28.6256,
        "longitude": 77.3653,
        "delivery_radius_km": 10.0,
        "banner_image_url": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200&auto=format&fit=crop",
    },
    {
        "name": "The Malt House 137",
        "license_number": "UP-EXC-2024-00203",
        "type": "Bar & Microbrewery",
        "phone_number": "+91 120 450 2003",
        "email": "malthouse137@ambrosiavenues.in",
        "address_line": "Expressway Plaza, Sector 137",
        "city": "Noida",
        "district": "Sector 137",
        "state": "Uttar Pradesh",
        "pincode": "201305",
        "latitude": 28.5132,
        "longitude": 77.4085,
        "delivery_radius_km": 10.0,
        "banner_image_url": "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?q=80&w=1200&auto=format&fit=crop",
    },
    {
        "name": "Botanica Botanical Lounge",
        "license_number": "UP-EXC-2024-00204",
        "type": "Soft Beverage Lounge & Bar",
        "phone_number": "+91 120 450 2004",
        "email": "botanica104@ambrosiavenues.in",
        "address_line": "Boutique High Street, Sector 104",
        "city": "Noida",
        "district": "Sector 104",
        "state": "Uttar Pradesh",
        "pincode": "201304",
        "latitude": 28.5355,
        "longitude": 77.3670,
        "delivery_radius_km": 10.0,
        "banner_image_url": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1200&auto=format&fit=crop",
    },
    {
        "name": "Nirvana Reserve 76",
        "license_number": "UP-EXC-2024-00205",
        "type": "Wine Cellar",
        "phone_number": "+91 120 450 2005",
        "email": "reserve76@ambrosiavenues.in",
        "address_line": "Silicon Galleria, Sector 76",
        "city": "Noida",
        "district": "Sector 76",
        "state": "Uttar Pradesh",
        "pincode": "201307",
        "latitude": 28.5742,
        "longitude": 77.3887,
        "delivery_radius_km": 10.0,
        "banner_image_url": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200&auto=format&fit=crop",
    },
    {
        "name": "Sovereign Spirits 50",
        "license_number": "UP-EXC-2024-00206",
        "type": "Bar & Lounge",
        "phone_number": "+91 120 450 2006",
        "email": "sovereign50@ambrosiavenues.in",
        "address_line": "Central Arcade, Sector 50",
        "city": "Noida",
        "district": "Sector 50",
        "state": "Uttar Pradesh",
        "pincode": "201301",
        "latitude": 28.5804,
        "longitude": 77.3688,
        "delivery_radius_km": 10.0,
        "banner_image_url": "https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=1200&auto=format&fit=crop",
    },
    {
        "name": "Crown & Hops 150",
        "license_number": "UP-EXC-2024-00207",
        "type": "Microbrewery",
        "phone_number": "+91 120 450 2007",
        "email": "hops150@ambrosiavenues.in",
        "address_line": "Sports City Hub, Sector 150",
        "city": "Noida",
        "district": "Sector 150",
        "state": "Uttar Pradesh",
        "pincode": "201310",
        "latitude": 28.4601,
        "longitude": 77.4789,
        "delivery_radius_km": 10.0,
        "banner_image_url": "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?q=80&w=1200&auto=format&fit=crop",
    },
    {
        "name": "West End Microbrewery",
        "license_number": "UP-EXC-2024-00208",
        "type": "Microbrewery",
        "phone_number": "+91 120 450 2008",
        "email": "brew@westendnoida.in",
        "address_line": "Gaur City Center Boulevard, Greater Noida West",
        "city": "Noida",
        "district": "Greater Noida West",
        "state": "Uttar Pradesh",
        "pincode": "201009",
        "latitude": 28.6012,
        "longitude": 77.4410,
        "delivery_radius_km": 10.0,
        "banner_image_url": "https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=1200&auto=format&fit=crop",
    },
    {
        "name": "Knowledge Park Elixirs",
        "license_number": "UP-EXC-2024-00209",
        "type": "Soft Beverage Lounge & Mocktails",
        "phone_number": "+91 120 450 2009",
        "email": "elixirs@knowledgepark.in",
        "address_line": "Campus Promenade, Knowledge Park III",
        "city": "Noida",
        "district": "Knowledge Park",
        "state": "Uttar Pradesh",
        "pincode": "201310",
        "latitude": 28.4650,
        "longitude": 77.5110,
        "delivery_radius_km": 10.0,
        "banner_image_url": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1200&auto=format&fit=crop",
    },
    {
        "name": "Wave City Highball & Wine Lounge",
        "license_number": "UP-EXC-2024-00210",
        "type": "Wine Cellar & Bar",
        "phone_number": "+91 120 450 2010",
        "email": "highball@wavecitylounge.in",
        "address_line": "Wave Center Galleria, Sector 32 / Wave City",
        "city": "Noida",
        "district": "Wave City",
        "state": "Uttar Pradesh",
        "pincode": "201301",
        "latitude": 28.5910,
        "longitude": 77.3480,
        "delivery_radius_km": 10.0,
        "banner_image_url": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200&auto=format&fit=crop",
    },
]


BEVERAGES_CATALOG = [
    # ----------------- Single Malts & Rare Whiskies -----------------
    {
        "name": "Glenfiddich 18 Year Old Reserve Single Malt",
        "description": "Rich, luxurious single malt scotch matured in Spanish Oloroso and American oak. Notes of baked apple, cinnamon spice, and robust oak finish.",
        "category": "Alcoholic",
        "sub_category": "Single Malt",
        "abv": 40.0,
        "price": 11500.0,
        "volume_ml": 750,
        "image_url": "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Macallan Double Cask 15 Year Old",
        "description": "A harmonious balance of European and American sherry seasoned oak casks. Aromas of dried fruit, toffee, and candied citrus with lingering warm spice.",
        "category": "Alcoholic",
        "sub_category": "Single Malt",
        "abv": 43.0,
        "price": 14800.0,
        "volume_ml": 750,
        "image_url": "https://images.unsplash.com/photo-1527281400683-1aae777175f8?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Yamazaki 12 Year Japanese Whisky",
        "description": "Pioneering Japanese single malt with notes of peach, pineapple, candied orange, and Japanese Mizunara oak essence.",
        "category": "Alcoholic",
        "sub_category": "Single Malt",
        "abv": 43.0,
        "price": 22000.0,
        "volume_ml": 700,
        "image_url": "https://images.unsplash.com/photo-1582819509235-c75c87a95267?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Lagavulin 16 Year Islay Single Malt",
        "description": "Deep peaty smokiness with intense lapsang souchong tea, rich iodine notes, and sweet dried fruit complexity.",
        "category": "Alcoholic",
        "sub_category": "Single Malt",
        "abv": 43.0,
        "price": 12400.0,
        "volume_ml": 750,
        "image_url": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Hibiki Japanese Harmony Blend",
        "description": "Luminous amber blend of malt and grain whiskies. Delicate blossom notes, sandalwood, and subtle hints of Mizunara oak.",
        "category": "Alcoholic",
        "sub_category": "Single Malt",
        "abv": 43.0,
        "price": 16500.0,
        "volume_ml": 700,
        "image_url": "https://images.unsplash.com/photo-1527281400683-1aae777175f8?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Balvenie 14 Year Caribbean Cask",
        "description": "Matured in traditional oak casks and finished in West Indian rum casks. Rich toffee, sweet vanilla, and warm fruit notes.",
        "category": "Alcoholic",
        "sub_category": "Single Malt",
        "abv": 43.0,
        "price": 9800.0,
        "volume_ml": 750,
        "image_url": "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Talisker 10 Year Isle of Skye Malt",
        "description": "Maritime saltiness with warm peat smoke, cracked black pepper, and clean barley sweetness.",
        "category": "Alcoholic",
        "sub_category": "Single Malt",
        "abv": 45.8,
        "price": 7200.0,
        "volume_ml": 750,
        "image_url": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Johnnie Walker Blue Label Reserve",
        "description": "An exquisite blend of Scotland’s rarest and most exceptional whiskies. Velvety layers of honey, hazelnuts, and dark chocolate.",
        "category": "Alcoholic",
        "sub_category": "Single Malt",
        "abv": 40.0,
        "price": 19500.0,
        "volume_ml": 750,
        "image_url": "https://images.unsplash.com/photo-1527281400683-1aae777175f8?q=80&w=800&auto=format&fit=crop",
    },

    # ----------------- Artisanal Gins & Agave Spirits -----------------
    {
        "name": "Monkey 47 Schwarzwald Dry Gin",
        "description": "Crafted with 47 hand-picked botanicals from the Black Forest including lingonberries, spruce shoots, and exotic spices.",
        "category": "Alcoholic",
        "sub_category": "Gin",
        "abv": 47.0,
        "price": 6400.0,
        "volume_ml": 500,
        "image_url": "https://images.unsplash.com/photo-1608885898957-a559228e8749?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Hendrick's Flora Adora Botanical Gin",
        "description": "Infused with an enchanting floral bouquet of sweet roses, cucumber, and wild meadow blossoms.",
        "category": "Alcoholic",
        "sub_category": "Gin",
        "abv": 43.4,
        "price": 5200.0,
        "volume_ml": 700,
        "image_url": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Tanqueray No. TEN Small Batch Gin",
        "description": "Distilled in small batches with whole fresh citrus fruits (grapefruits, oranges, limes) and chamomile flowers.",
        "category": "Alcoholic",
        "sub_category": "Gin",
        "abv": 47.3,
        "price": 4100.0,
        "volume_ml": 750,
        "image_url": "https://images.unsplash.com/photo-1608885898957-a559228e8749?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "The Botanist Islay Dry Gin",
        "description": "22 hand-foraged local Islay botanicals distilled slowly in an authentic Lomond pot still. Complex, floral, and herbaceous.",
        "category": "Alcoholic",
        "sub_category": "Gin",
        "abv": 46.0,
        "price": 5800.0,
        "volume_ml": 700,
        "image_url": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Don Julio 1942 Añejo Tequila",
        "description": "Handcrafted tribute to the year Don Julio González began his tequila-making journey. Rich warm oak, vanilla, and roasted agave.",
        "category": "Alcoholic",
        "sub_category": "Tequila",
        "abv": 38.0,
        "price": 26000.0,
        "volume_ml": 750,
        "image_url": "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Clase Azul Reposado Artisan Tequila",
        "description": "Aged for 8 months in hand-selected bourbon barrels. Decadent notes of hazelnut, vanilla, and cinnamon in a cobalt ceramic decanter.",
        "category": "Alcoholic",
        "sub_category": "Tequila",
        "abv": 40.0,
        "price": 28500.0,
        "volume_ml": 750,
        "image_url": "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Grey Goose VX Exceptionnelle Vodka",
        "description": "Masterfully crafted French winter wheat vodka finished with a delicate hint of precious Grande Champagne Cognac.",
        "category": "Alcoholic",
        "sub_category": "Vodka",
        "abv": 40.0,
        "price": 8900.0,
        "volume_ml": 1000,
        "image_url": "https://images.unsplash.com/photo-1582819509235-c75c87a95267?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Beluga Gold Line Noble Russian Vodka",
        "description": "Ultra-premium malt spirit filtered five times through quartz sand and silver birch charcoal. Silky, crisp, and pure.",
        "category": "Alcoholic",
        "sub_category": "Vodka",
        "abv": 40.0,
        "price": 13200.0,
        "volume_ml": 700,
        "image_url": "https://images.unsplash.com/photo-1582819509235-c75c87a95267?q=80&w=800&auto=format&fit=crop",
    },

    # ----------------- Craft Beers & Microbrews -----------------
    {
        "name": "Toit Belgian Dubbel Reserve 4-Pack",
        "description": "Rich Belgian-style ale brewed with authentic candi sugar, coriander seeds, and Belgian abbey yeast.",
        "category": "Alcoholic",
        "sub_category": "Craft Beer",
        "abv": 7.5,
        "price": 1250.0,
        "volume_ml": 1320,
        "image_url": "https://images.unsplash.com/photo-1608270586620-248524c67de9?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Paulaner Hefe-Weißbier Naturtrüb",
        "description": "Classic Bavarian naturally cloudy wheat beer with refreshing notes of banana and mild clove.",
        "category": "Alcoholic",
        "sub_category": "Craft Beer",
        "abv": 5.5,
        "price": 390.0,
        "volume_ml": 500,
        "image_url": "https://images.unsplash.com/photo-1608270586620-248524c67de9?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Bira 91 White Pomelo Limited Cask",
        "description": "Low bitterness wheat beer brewed with Himalayan pomelo zest, orange peel, and toasted coriander.",
        "category": "Alcoholic",
        "sub_category": "Craft Beer",
        "abv": 4.7,
        "price": 280.0,
        "volume_ml": 330,
        "image_url": "https://images.unsplash.com/photo-1608270586620-248524c67de9?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Brooklyn Defender IPA Craft Pack",
        "description": "Heroically hopped golden IPA bursting with tropical fruit aroma, pine resin, and crisp malt backbone.",
        "category": "Alcoholic",
        "sub_category": "Craft Beer",
        "abv": 5.5,
        "price": 1100.0,
        "volume_ml": 1320,
        "image_url": "https://images.unsplash.com/photo-1608270586620-248524c67de9?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Hoegaarden Grand Cru Artisanal Wheat",
        "description": "Full-bodied golden ale with a peach-hued glow, spicy coriander finish, and velvety effervescence.",
        "category": "Alcoholic",
        "sub_category": "Craft Beer",
        "abv": 8.5,
        "price": 480.0,
        "volume_ml": 330,
        "image_url": "https://images.unsplash.com/photo-1608270586620-248524c67de9?q=80&w=800&auto=format&fit=crop",
    },

    # ----------------- 0.0% Non-Alcoholic Artisanal Spirits & Elixirs -----------------
    {
        "name": "Seedlip Spice 94 Distilled Non-Alcoholic Spirit",
        "description": "A sophisticated, warm zero-proof distilled elixir of allspice berries, cardamom, oak bark, and lemon peel. 100% calorie-free and sugar-free.",
        "category": "Non-Alcoholic",
        "sub_category": "Non-Alcoholic Spirit",
        "abv": 0.0,
        "price": 3800.0,
        "volume_ml": 700,
        "image_url": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Seedlip Garden 108 Herbal Elixir",
        "description": "Distilled non-alcoholic tribute to the English countryside featuring hand-picked garden peas, rosemary, thyme, and spearmint.",
        "category": "Non-Alcoholic",
        "sub_category": "Non-Alcoholic Spirit",
        "abv": 0.0,
        "price": 3800.0,
        "volume_ml": 700,
        "image_url": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Lyre's Italian Orange Spritz Reserve (0.0% ABV)",
        "description": "Exquisitely crafted non-alcoholic Italian aperitif. Blood orange sweetness balanced with gentle gentian root bitterness.",
        "category": "Non-Alcoholic",
        "sub_category": "Non-Alcoholic Spirit",
        "abv": 0.0,
        "price": 2950.0,
        "volume_ml": 700,
        "image_url": "https://images.unsplash.com/photo-1536935338788-846bb9981813?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Lyre's American Malt Bourbon Alternative",
        "description": "Captures the essence of Kentucky bourbon with mellow vanilla, toasted oak, and spiced caramel nuances without alcohol.",
        "category": "Non-Alcoholic",
        "sub_category": "Non-Alcoholic Spirit",
        "abv": 0.0,
        "price": 2950.0,
        "volume_ml": 700,
        "image_url": "https://images.unsplash.com/photo-1527281400683-1aae777175f8?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Ambrosia Gold Smoked Agave & Lime Elixir",
        "description": "Proprietary zero-proof elixir crafted from organic Mexican blue agave, chipotle smoke infusion, and fresh Persian lime.",
        "category": "Non-Alcoholic",
        "sub_category": "Non-Alcoholic Spirit",
        "abv": 0.0,
        "price": 1850.0,
        "volume_ml": 750,
        "image_url": "https://images.unsplash.com/photo-1536935338788-846bb9981813?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Hibiscus Rose Velvet Botanical Spritzer",
        "description": "Sparkling infusion of wild Kashmiri hibiscus calyces, damask rose water, and organic pomegranate nectar.",
        "category": "Non-Alcoholic",
        "sub_category": "Mocktail",
        "abv": 0.0,
        "price": 650.0,
        "volume_ml": 330,
        "image_url": "https://images.unsplash.com/photo-1536935338788-846bb9981813?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Yuzu Sparkling White Tea Infusion",
        "description": "Rare Darjeeling silver needle tea cold brewed with Japanese Yuzu zest and organic wild honey.",
        "category": "Non-Alcoholic",
        "sub_category": "Mocktail",
        "abv": 0.0,
        "price": 720.0,
        "volume_ml": 330,
        "image_url": "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Kyoto Ceremonial Matcha Cloud Fizz",
        "description": "Single-origin Uji ceremonial grade matcha whisked with sparkling alkaline mineral water and Madagascar vanilla.",
        "category": "Non-Alcoholic",
        "sub_category": "Mocktail",
        "abv": 0.0,
        "price": 780.0,
        "volume_ml": 330,
        "image_url": "https://images.unsplash.com/photo-1536935338788-846bb9981813?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Elderflower & Bergamot Zero-Proof Aperitif",
        "description": "Hand-harvested English elderflowers steeped with Calabrian bergamot essential oils and sparkling botanical extracts.",
        "category": "Non-Alcoholic",
        "sub_category": "Mocktail",
        "abv": 0.0,
        "price": 1450.0,
        "volume_ml": 750,
        "image_url": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=800&auto=format&fit=crop",
    },

    # ----------------- Craft Mixers & Gourmet Sodas -----------------
    {
        "name": "Fever-Tree Mediterranean Tonic Water 4-Pack",
        "description": "Blending natural quinine with essential oils from thyme, rosemary, and lemon verbena grown on Mediterranean shores.",
        "category": "Mixer",
        "sub_category": "Tonic",
        "abv": 0.0,
        "price": 580.0,
        "volume_ml": 800,
        "image_url": "https://images.unsplash.com/photo-1621263764928-df1444c5e859?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Fever-Tree Premium Indian Tonic Water",
        "description": "Signature tonic made with hand-pressed bitter orange oils and natural quinine from Rwanda's fever trees.",
        "category": "Mixer",
        "sub_category": "Tonic",
        "abv": 0.0,
        "price": 160.0,
        "volume_ml": 200,
        "image_url": "https://images.unsplash.com/photo-1621263764928-df1444c5e859?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Svami Grapefruit & Pink Peppercorn Tonic",
        "description": "Artisanal low-calorie Indian tonic water featuring real pink grapefruit juice and subtle crushed pink peppercorn spice.",
        "category": "Mixer",
        "sub_category": "Tonic",
        "abv": 0.0,
        "price": 120.0,
        "volume_ml": 250,
        "image_url": "https://images.unsplash.com/photo-1621263764928-df1444c5e859?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Svami Original Cucumber Botanical Soda",
        "description": "Ultra-crisp artisanal soda crafted with real English cucumber cold press and botanical citrus oils.",
        "category": "Gourmet Soda",
        "sub_category": "Gourmet Soda",
        "abv": 0.0,
        "price": 110.0,
        "volume_ml": 250,
        "image_url": "https://images.unsplash.com/photo-1621263764928-df1444c5e859?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "East Imperial Royal Botanic Tonic 4-Pack",
        "description": "Recreated from an 1827 family recipe with all-natural Javanese cinchona bark and organic New Zealand spring water.",
        "category": "Mixer",
        "sub_category": "Tonic",
        "abv": 0.0,
        "price": 720.0,
        "volume_ml": 600,
        "image_url": "https://images.unsplash.com/photo-1621263764928-df1444c5e859?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Thomas Henry Pink Grapefruit Gourmet Soda",
        "description": "The golden standard for Paloma cocktails and refreshing sipping, bursting with sea salt crystals and fresh ruby grapefruit.",
        "category": "Gourmet Soda",
        "sub_category": "Gourmet Soda",
        "abv": 0.0,
        "price": 190.0,
        "volume_ml": 200,
        "image_url": "https://images.unsplash.com/photo-1621263764928-df1444c5e859?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Fentimans Rose Lemonade Artisanal Soda",
        "description": "Botanically brewed with pure Otto rose oil from the famous Rose Valley in Kazanlak, Bulgaria, and Sicilian lemon juice.",
        "category": "Gourmet Soda",
        "sub_category": "Gourmet Soda",
        "abv": 0.0,
        "price": 240.0,
        "volume_ml": 275,
        "image_url": "https://images.unsplash.com/photo-1536935338788-846bb9981813?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Fentimans Curiosity Cola Fermented Botanical",
        "description": "Historically brewed dark cola made with fermented ginger root extract and natural herbal infusions.",
        "category": "Gourmet Soda",
        "sub_category": "Gourmet Soda",
        "abv": 0.0,
        "price": 240.0,
        "volume_ml": 275,
        "image_url": "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Blue Tokai Nitro Cold Brew Cascara Reserve",
        "description": "24-hour steeped single-estate Arabica coffee infused with nitrogen and dried coffee cherry husk (cascara) tea.",
        "category": "Non-Alcoholic",
        "sub_category": "Cold Brew",
        "abv": 0.0,
        "price": 290.0,
        "volume_ml": 250,
        "image_url": "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?q=80&w=800&auto=format&fit=crop",
    },
    {
        "name": "Sleepy Owl Vanilla Bean Nitro Cold Brew",
        "description": "Micro-roasted Grade-A Chikmagalur coffee beans cold brewed with real Madagascar Bourbon vanilla beans.",
        "category": "Non-Alcoholic",
        "sub_category": "Cold Brew",
        "abv": 0.0,
        "price": 220.0,
        "volume_ml": 200,
        "image_url": "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?q=80&w=800&auto=format&fit=crop",
    },
]


def seed_database():
    print("✨ Connecting to database...")
    db: Session = SessionLocal()

    try:
        # Create all tables if not present
        Base.metadata.create_all(bind=engine)

        print("🧹 Cleaning existing Ambrosia data...")
        db.execute(delete(OrderItem))
        db.execute(delete(Order))
        db.execute(delete(Product))
        db.execute(delete(Merchant))
        db.execute(delete(User))
        db.execute(delete(AssetRegistry))
        db.commit()

        # 1. Seed Asset Registry
        print("🖼️  Seeding Asset Registry...")
        for asset in ASSETS_DATA:
            reg = AssetRegistry(
                asset_key=asset["asset_key"],
                url=asset["url"],
                description=asset["description"],
            )
            db.add(reg)
        db.commit()
        print(f"   ✓ Seeded {len(ASSETS_DATA)} Asset Registry entries.")

        # 2. Seed Users
        print("👥 Seeding Demo Users...")
        adult_user = User(
            full_name="Vikram Mehta",
            email="vikram.mehta@luxury.in",
            phone_number="+91 98111 22334",
            age=28,
            hashed_password=get_password_hash("AmbrosiaAdult2026!"),
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

        # 3. Seed Merchants (10 Delhi + 10 Noida = 20 Merchants)
        print("🏛️  Seeding 20 Luxury Merchants across Delhi & Noida...")
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
                banner_image_url=m_data["banner_image_url"],
                hashed_password=get_password_hash("AmbrosiaPartner2026!"),
                is_active=True,
            )
            db.add(merchant)
            created_merchants.append(merchant)

        db.commit()
        for m in created_merchants:
            db.refresh(m)
        print(f"   ✓ Seeded {len(created_merchants)} luxury merchants.")

        # 4. Seed Products (Distribute catalog across merchants)
        print("🍾 Seeding 45+ Curated Artisanal Beverages...")
        created_products = []
        # Assign products systematically across merchants
        for idx, bev in enumerate(BEVERAGES_CATALOG):
            # Select 3 distinct merchants per product for rich catalog coverage
            m_indices = [idx % len(created_merchants), (idx + 4) % len(created_merchants), (idx + 10) % len(created_merchants)]
            for m_idx in set(m_indices):
                m = created_merchants[m_idx]
                prod = Product(
                    merchant_id=m.id,
                    name=bev["name"],
                    description=bev["description"],
                    category=bev["category"],
                    sub_category=bev["sub_category"],
                    abv=bev["abv"],
                    price=bev["price"],
                    volume_ml=bev["volume_ml"],
                    image_url=bev["image_url"],
                    in_stock=True,
                )
                db.add(prod)
                created_products.append(prod)

        db.commit()
        for p in created_products:
            db.refresh(p)
        print(f"   ✓ Seeded {len(created_products)} product catalog allocations across all venues.")

        # 5. Seed Initial Live Demonstration Orders
        print("📦 Seeding Live Demonstration Orders...")
        imperial_merchant = next(m for m in created_merchants if "Imperial" in m.name)
        gilded_merchant = next(m for m in created_merchants if "Gilded" in m.name)

        imperial_products = [p for p in created_products if p.merchant_id == imperial_merchant.id]
        gilded_products = [p for p in created_products if p.merchant_id == gilded_merchant.id]

        if imperial_products:
            p1 = imperial_products[0]
            p2 = imperial_products[1] if len(imperial_products) > 1 else imperial_products[0]
            order1 = Order(
                user_id=adult_user.id,
                merchant_id=imperial_merchant.id,
                total_amount=float(p1.price) + float(p2.price) * 2,
                delivery_address="Flat 4B, Barakhamba Court, Connaught Place, Delhi",
                user_latitude=28.6289,
                user_longitude=77.2195,
                payment_method="PAY_ON_DELIVERY",
                status="PREPARING",
            )
            db.add(order1)
            db.flush()

            item1_a = OrderItem(order_id=order1.id, product_id=p1.id, quantity=1, unit_price=p1.price)
            item1_b = OrderItem(order_id=order1.id, product_id=p2.id, quantity=2, unit_price=p2.price)
            db.add(item1_a)
            db.add(item1_b)

        if gilded_products:
            # Pick non-alcoholic or mocktail for underage user order
            na_prods = [p for p in gilded_products if p.abv == 0.0]
            gp1 = na_prods[0] if na_prods else gilded_products[0]
            gp2 = na_prods[1] if len(na_prods) > 1 else gp1

            order2 = Order(
                user_id=underage_user.id,
                merchant_id=gilded_merchant.id,
                total_amount=float(gp1.price) + float(gp2.price),
                delivery_address="Tower 3, Sector 18 Promenade, Noida",
                user_latitude=28.5708,
                user_longitude=77.3219,
                payment_method="PAY_ON_DELIVERY",
                status="OUT_FOR_DELIVERY",
            )
            db.add(order2)
            db.flush()

            item2_a = OrderItem(order_id=order2.id, product_id=gp1.id, quantity=1, unit_price=gp1.price)
            item2_b = OrderItem(order_id=order2.id, product_id=gp2.id, quantity=1, unit_price=gp2.price)
            db.add(item2_a)
            db.add(item2_b)

        db.commit()
        print("   ✓ Seeded 2 active demonstration orders (PREPARING & OUT_FOR_DELIVERY).")
        print("🏆 Database seeding complete!")

    except Exception as exc:
        db.rollback()
        print(f"❌ Error during seeding: {exc}")
        raise exc
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
