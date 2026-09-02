import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  ShoppingBag,
  Store,
  ChevronRight,
  Compass,
  Check,
  AlertCircle,
} from 'lucide-react';
import DrinkBadge from '../components/DrinkBadge';
import { productService, merchantService } from '../services/api';

const CATEGORIES = [
  { id: 'all', label: 'All Cellar Reserves' },
  { id: 'Single Malt', label: 'Single Malts' },
  { id: 'Gin', label: 'Artisanal Gins' },
  { id: 'Tequila', label: 'Tequila & Agave' },
  { id: 'Craft Beer', label: 'Craft Beers' },
  { id: 'Non-Alcoholic', label: 'Zero-Proof Elixirs' },
];

export default function MarketplacePage({
  userLocation,
  onOpenLocationModal,
  ageMode,
  onAddToCart,
  cart,
}) {
  const [products, setProducts] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMerchantId, setSelectedMerchantId] = useState('');
  const [onlyNearby, setOnlyNearby] = useState(true);
  const [addedPopup, setAddedPopup] = useState(null);

  // Load nearby merchants and products
  useEffect(() => {
    async function loadFeed() {
      setIsLoading(true);
      try {
        // 1. Fetch nearby merchants (<=10km)
        const mRes = await merchantService.getNearby(
          userLocation.latitude,
          userLocation.longitude,
          10.0
        );
        setMerchants(mRes.data || []);

        // 2. Fetch products for user's age and proximity
        const pParams = {
          lat: userLocation.latitude,
          lng: userLocation.longitude,
          user_age: ageMode,
          only_within_radius: onlyNearby,
        };
        if (selectedCategory !== 'all') {
          if (selectedCategory === 'Non-Alcoholic') {
            pParams.category = 'Non-Alcoholic';
          } else {
            pParams.sub_category = selectedCategory;
          }
        }
        if (selectedMerchantId) {
          pParams.merchant_id = selectedMerchantId;
        }
        if (searchQuery.trim()) {
          pParams.search = searchQuery.trim();
        }

        const pRes = await productService.getProducts(pParams);
        setProducts(pRes.data || []);
      } catch (err) {
        console.error('Failed to load marketplace catalog:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadFeed();
  }, [userLocation, ageMode, selectedCategory, selectedMerchantId, onlyNearby, searchQuery]);

  const handleAdd = (product) => {
    onAddToCart(product);
    setAddedPopup(product.id);
    setTimeout(() => setAddedPopup(null), 1500);
  };

  return (
    <div className="min-h-screen bg-[#070709] text-stone-100 pb-24">
      {/* Top Banner: Geospatial Corridor & Age Isolation */}
      <div className="border-b border-[#d4af37]/20 bg-stone-950/80 backdrop-blur-md px-4 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* Location corridor info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white font-serif-lux">
                  {userLocation.district || 'Connaught Place'} Corridor
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[#d4af37] text-[10px] font-bold border border-[#d4af37]/30">
                  ≤ 10 km Radius
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                {merchants.length} licensed luxury venues servicing this coordinate
              </p>
            </div>
          </div>

          {/* Age-gate state notification pill */}
          <div className="flex items-center gap-2.5">
            {ageMode >= 18 ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-[#d4af37]/40 text-xs text-amber-200">
                <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
                <span>
                  <strong className="text-[#d4af37]">18+ Reserve Cellar:</strong> Vintage Single Malts, Gins & Microbrews Unlocked
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-xs text-emerald-300">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                <span>
                  <strong className="text-emerald-400">Under-18 Safe Mode:</strong> Sanitized to 0.0% ABV Botanical Elixirs
                </span>
              </div>
            )}
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-8">
        
        {/* Nearby Venues Quick Carousel */}
        {merchants.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-widest text-[#d4af37] font-semibold flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5" />
                <span>Serviceable Licensed Venues Within 10 km</span>
              </span>
              <span className="text-xs text-stone-400">
                Sorted by proximity (Haversine)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedMerchantId('')}
                className={`p-3 rounded-2xl text-left border transition-all ${
                  selectedMerchantId === ''
                    ? 'bg-[#d4af37]/20 border-[#d4af37] text-white shadow-lg'
                    : 'glass-panel border-white/10 text-stone-400 hover:text-white'
                }`}
              >
                <span className="text-xs font-bold block truncate">All Venues</span>
                <span className="text-[10px] text-amber-300/80">Aggregated Feed</span>
              </button>

              {merchants.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMerchantId(m.id)}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    selectedMerchantId === m.id
                      ? 'bg-[#d4af37]/20 border-[#d4af37] text-white shadow-lg'
                      : 'glass-panel border-white/10 text-stone-300 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-bold block truncate">{m.name}</span>
                  <div className="flex items-center justify-between mt-1 text-[10px]">
                    <span className="text-stone-400 truncate">{m.district}</span>
                    <span className="text-[#d4af37] font-bold font-mono">
                      {m.distance_km} km
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Controls Bar: Search & Category Chips */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search single malts, botanical gins, craft brews, cold brews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-[#d4af37]/60 text-xs text-amber-100 placeholder:text-stone-600 focus:outline-none"
              />
            </div>

            {/* Radius Enforcement Toggle */}
            <button
              onClick={() => setOnlyNearby(!onlyNearby)}
              className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                onlyNearby
                  ? 'bg-amber-500/15 border-[#d4af37]/50 text-amber-300'
                  : 'bg-black/40 border-white/10 text-stone-400'
              }`}
            >
              <Compass className="w-4 h-4 text-[#d4af37]" />
              <span>{onlyNearby ? 'Strict ≤10 km Filter: ON' : 'All NCR Venues'}</span>
            </button>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => {
              // If underage, disable or warn on alcoholic categories
              const isCatDisabled = ageMode < 18 && cat.id !== 'all' && cat.id !== 'Non-Alcoholic';

              return (
                <button
                  key={cat.id}
                  disabled={isCatDisabled}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                    isCatDisabled
                      ? 'opacity-30 cursor-not-allowed bg-stone-900 border-stone-800 text-stone-600'
                      : selectedCategory === cat.id
                      ? 'bg-gradient-to-r from-amber-600 to-[#d4af37] text-stone-950 font-bold border-transparent shadow-md'
                      : 'glass-panel border-white/10 text-stone-300 hover:text-white hover:border-[#d4af37]/40'
                  }`}
                >
                  {cat.label}
                  {isCatDisabled && ' (18+)'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid - Pure SVG Illuminated Architecture, ZERO <img> tags */}
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 rounded-full border-2 border-[#d4af37] border-t-transparent animate-spin mx-auto mb-4" />
            <p className="font-serif-lux text-base text-stone-300">
              Querying hyper-local cellars within 10 km...
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 rounded-3xl glass-panel border border-[#d4af37]/20 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] mx-auto mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="font-serif-lux text-xl font-bold text-white mb-2">
              No Allocations Matching Filter
            </h3>
            <p className="text-xs text-stone-400 font-light leading-relaxed mb-6">
              {ageMode < 18
                ? 'Under-18 accounts are isolated to 0.0% ABV non-alcoholic beverages. No items matched in this subcategory.'
                : 'No beverages currently in stock within the 10 km corridor of your current coordinates.'}
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedMerchantId('');
                setSearchQuery('');
              }}
              className="px-5 py-2.5 rounded-xl gold-gradient-btn text-xs font-bold uppercase tracking-wider"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const isAdded = addedPopup === product.id;

              return (
                <div
                  key={product.id}
                  className="p-5 rounded-3xl glass-panel glass-panel-hover border border-[#d4af37]/20 flex flex-col justify-between group shadow-xl"
                >
                  {/* Top Area: Pure SVG Illuminated DrinkBadge (NO <img>) */}
                  <div>
                    <div className="relative mb-4 flex justify-center py-4 bg-black/40 rounded-2xl border border-white/[0.04]">
                      <DrinkBadge
                        category={product.category}
                        subCategory={product.sub_category}
                        abv={product.abv}
                        size="lg"
                      />

                      {/* Distance Pill */}
                      {product.distance_km !== null && product.distance_km !== undefined && (
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/80 border border-[#d4af37]/40 text-[10px] font-mono font-bold text-amber-300">
                          {product.distance_km} km
                        </span>
                      )}

                      {/* ABV Pill */}
                      <span
                        className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          product.abv > 0
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        }`}
                      >
                        {product.abv > 0 ? `${product.abv}% ABV` : '0.0% ABV'}
                      </span>
                    </div>

                    {/* Venue tag */}
                    <div className="flex items-center gap-1.5 text-[11px] text-[#d4af37] font-medium mb-1">
                      <Store className="w-3 h-3" />
                      <span className="truncate">{product.merchant_name || 'Licensed Venue'}</span>
                      <span className="text-stone-500">•</span>
                      <span className="text-stone-400">{product.merchant_district}</span>
                    </div>

                    {/* Title */}
                    <h3 className="font-serif-lux text-base font-bold text-white group-hover:text-amber-200 transition-colors line-clamp-1">
                      {product.name}
                    </h3>

                    {/* Description */}
                    <p className="text-[11px] text-stone-400 font-light mt-1.5 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* Bottom Area: Price & Action */}
                  <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-stone-500 block uppercase font-medium">
                        Volume: {product.volume_ml} ml
                      </span>
                      <span className="font-serif-lux text-base font-bold text-white">
                        ₹{Number(product.price).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAdd(product)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isAdded
                          ? 'bg-emerald-500 text-stone-950 scale-105'
                          : 'gold-gradient-btn hover:shadow-lg hover:shadow-amber-500/30'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Reserve</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
