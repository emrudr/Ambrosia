import React, { useState } from 'react';
import { Plus, Check, Info, ShieldCheck, MapPin, Sparkles, Navigation, X } from 'lucide-react';

export default function ProductCard({
  product,
  onAddToCart,
  cartItem,
  onOpenDetails,
  ageMode,
}) {
  const isAlcoholic = product.abv > 0.0 || product.category === 'Alcoholic';
  const isUnderage = ageMode < 18;
  const isBlockedByAge = isAlcoholic && isUnderage;

  return (
    <div className="group relative rounded-2xl p-4 glass-panel glass-panel-hover flex flex-col justify-between transition-all duration-300 border border-amber-500/15 hover:border-amber-400/40 shadow-lg hover:shadow-2xl hover:shadow-amber-950/30">
      
      <div>
        {/* Top Badges: Category & ABV Meter */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-[10px] uppercase tracking-wider font-semibold text-stone-300">
            {product.sub_category || product.category}
          </span>

          {/* ABV Pill */}
          <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold flex items-center gap-1 ${
            product.abv > 0
              ? 'bg-amber-500/15 border-amber-400/40 text-amber-300 shadow-sm'
              : 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300 shadow-sm'
          }`}>
            <Sparkles className="w-2.5 h-2.5" />
            <span>{product.abv > 0 ? `${product.abv}% ABV` : '0.0% ABV'}</span>
          </span>
        </div>

        {/* Product Image Stage */}
        <div 
          onClick={() => onOpenDetails(product)}
          className="relative h-48 sm:h-52 w-full rounded-xl overflow-hidden mb-4 bg-gradient-to-b from-stone-900/60 to-black/90 flex items-center justify-center cursor-pointer p-2 group-hover:scale-[1.02] transition-transform duration-500"
        >
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover rounded-lg group-hover:scale-110 transition-transform duration-700 ease-out"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

          {/* Volume Badge */}
          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[10px] font-mono text-amber-200 border border-white/10 shadow">
            {product.volume_ml} ml
          </div>

          {/* Quick Info Trigger */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(product);
            }}
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/70 hover:bg-amber-500 hover:text-black text-stone-300 border border-white/10 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
            title="View Sommelier Tasting Notes"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Product Title */}
        <h3 
          onClick={() => onOpenDetails(product)}
          className="font-serif-lux font-bold text-base sm:text-lg text-white group-hover:text-amber-200 transition-colors line-clamp-1 mb-1.5 cursor-pointer"
        >
          {product.name}
        </h3>

        {/* Merchant Venue & Distance Snippet */}
        <div className="flex items-center justify-between text-xs text-stone-400 mb-3">
          <span className="truncate flex items-center gap-1">
            <MapPin className="w-3 h-3 text-amber-400/80 flex-shrink-0" />
            <span className="truncate">{product.merchant_name || 'Artisanal Vault'}</span>
          </span>
          {product.distance_km !== null && product.distance_km !== undefined && (
            <span className="text-[11px] font-semibold text-amber-300/90 whitespace-nowrap ml-1">
              {product.distance_km} km
            </span>
          )}
        </div>

        {/* Short Description */}
        <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed mb-4 font-light">
          {product.description}
        </p>

      </div>

      {/* Bottom Row: Price & Action */}
      <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-stone-400 block uppercase tracking-wider">Allocation</span>
          <span className="font-serif-lux text-lg sm:text-xl font-bold text-amber-200">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
        </div>

        {isBlockedByAge ? (
          <div className="px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-500/30 text-[11px] font-semibold text-red-300">
            18+ Restricted
          </div>
        ) : (
          <button
            onClick={() => onAddToCart(product)}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-md ${
              cartItem
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50 hover:bg-amber-400/30'
                : 'gold-gradient-btn hover:shadow-amber-500/30'
            }`}
          >
            {cartItem ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added ({cartItem.quantity})</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 text-black" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        )}
      </div>

    </div>
  );
}
