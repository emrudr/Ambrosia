import React from 'react';
import { X, Sparkles, MapPin, ShieldCheck, Plus, Check, Compass, Wine, Award } from 'lucide-react';

export default function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
  cartItem,
  ageMode,
}) {
  if (!product) return null;

  const isAlcoholic = product.abv > 0.0 || product.category === 'Alcoholic';
  const isUnderage = ageMode < 18;
  const isBlocked = isAlcoholic && isUnderage;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl rounded-3xl glass-panel border border-amber-500/30 overflow-hidden shadow-2xl animate-scaleUp max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-stone-300 hover:text-white border border-white/10 flex items-center justify-center transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="overflow-y-auto p-6 sm:p-8">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center mb-6">
            {/* Image Showcase */}
            <div className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden bg-stone-900 flex items-center justify-center border border-white/10 shadow-inner">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              
              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-black/80 backdrop-blur-md text-[11px] font-mono text-amber-300 border border-white/10">
                {product.volume_ml} ml Bottle
              </div>
            </div>

            {/* Header info */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-[10px] uppercase font-bold tracking-wider text-amber-200">
                  {product.category}
                </span>
                
                <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${
                  product.abv > 0
                    ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                    : 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                }`}>
                  {product.abv > 0 ? `${product.abv}% ABV` : '0.0% Non-Alcoholic'}
                </span>
              </div>

              <h2 className="font-serif-lux text-2xl font-bold text-white mb-2 leading-tight">
                {product.name}
              </h2>

              <p className="text-xs text-stone-400 flex items-center gap-1 mb-4">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{product.merchant_name} • {product.merchant_district}, {product.merchant_city}</span>
                {product.distance_km !== null && product.distance_km !== undefined && (
                  <span className="font-bold text-amber-300 ml-1">({product.distance_km} km away)</span>
                )}
              </p>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 block mb-0.5">Cellar Allocation</span>
                <span className="font-serif-lux text-2xl font-bold text-amber-200">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-stone-400 block mt-0.5">Inclusive of curated cellar reserve handling</span>
              </div>
            </div>
          </div>

          {/* Sommelier Notes */}
          <div className="mb-6">
            <h4 className="font-serif-lux text-sm font-bold text-amber-300 flex items-center gap-1.5 mb-2 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Sommelier Curation & Tasting Notes</span>
            </h4>
            <p className="text-sm text-stone-300 leading-relaxed font-light bg-black/30 p-4 rounded-xl border border-white/5">
              {product.description}
            </p>
          </div>

          {/* Fulfillment details */}
          <div className="grid grid-cols-2 gap-3 mb-6 text-xs text-stone-300">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-2.5">
              <Compass className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div>
                <strong className="block text-white">10 km Delivery</strong>
                <span className="text-[11px] text-stone-400">Guaranteed within radius</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-2.5">
              <Award className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div>
                <strong className="block text-white">Pay on Delivery</strong>
                <span className="text-[11px] text-stone-400">Inspect & settle at door</span>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-stone-300 hover:bg-white/[0.05]"
            >
              Back to Vault
            </button>

            {isBlocked ? (
              <div className="px-5 py-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs font-semibold text-red-300">
                18+ Restricted • Zero-Proof Only
              </div>
            ) : (
              <button
                onClick={() => {
                  onAddToCart(product);
                  onClose();
                }}
                className="flex-1 max-w-xs gold-gradient-btn py-3 px-6 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xl"
              >
                {cartItem ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4 text-black" />}
                <span>{cartItem ? `In Cart (${cartItem.quantity}) - Add More` : 'Add Allocation to Cart'}</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
