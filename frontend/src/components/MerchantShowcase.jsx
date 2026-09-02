import React from 'react';
import { Store, MapPin, Navigation, CheckCircle2, Clock, Phone, Sparkles } from 'lucide-react';

export default function MerchantShowcase({
  merchants,
  selectedMerchantId,
  onSelectMerchant,
  userLocation,
}) {
  if (!merchants || merchants.length === 0) return null;

  return (
    <section className="py-8 px-4 lg:px-8 border-b border-amber-500/10">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif-lux text-xl sm:text-2xl font-bold text-white tracking-wide">
                Proximity Cellars & Speakeasies
              </h2>
              <p className="text-xs text-stone-400">
                Verified luxury merchant venues delivering within 10 km
              </p>
            </div>
          </div>

          {selectedMerchantId && (
            <button
              onClick={() => onSelectMerchant(null)}
              className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-4"
            >
              Show All Venues
            </button>
          )}
        </div>

        {/* Merchants Horizontal Scrollable Carousel */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x">
          {merchants.map((m) => {
            const isSelected = selectedMerchantId === m.id;
            const isDelivering = m.is_delivering !== false;
            const distance = m.distance_km !== null && m.distance_km !== undefined ? m.distance_km : null;

            return (
              <div
                key={m.id}
                onClick={() => onSelectMerchant(isSelected ? null : m.id)}
                className={`flex-shrink-0 w-72 sm:w-80 rounded-2xl p-4 glass-panel glass-panel-hover cursor-pointer snap-start transition-all border ${
                  isSelected
                    ? 'border-amber-400 bg-amber-950/20 shadow-xl shadow-amber-950/40'
                    : isDelivering
                    ? 'border-amber-500/20 hover:border-amber-400/50'
                    : 'border-stone-800 opacity-60'
                }`}
              >
                {/* Merchant Banner Image */}
                <div className="relative h-28 w-full rounded-xl overflow-hidden mb-3 bg-stone-900">
                  <img
                    src={m.banner_image_url || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=800'}
                    alt={m.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Distance Pill */}
                  {distance !== null && (
                    <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-amber-400/40 text-[11px] font-bold text-amber-300 flex items-center gap-1 shadow">
                      <Navigation className="w-3 h-3 text-amber-400" />
                      <span>{distance} km</span>
                    </div>
                  )}

                  {/* Merchant Type Badge */}
                  <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] uppercase font-semibold text-amber-200 border border-white/10">
                    {m.type}
                  </div>
                </div>

                {/* Details */}
                <h3 className="font-serif-lux font-bold text-base text-stone-100 truncate mb-1">
                  {m.name}
                </h3>
                
                <p className="text-xs text-stone-400 flex items-center gap-1 mb-2 truncate">
                  <MapPin className="w-3 h-3 text-amber-400/80 flex-shrink-0" />
                  <span>{m.district}, {m.city}</span>
                </p>

                {/* Footer status pill */}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[11px]">
                  <span className={`font-semibold flex items-center gap-1 ${
                    isDelivering ? 'text-amber-300' : 'text-stone-500'
                  }`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isDelivering ? 'text-amber-400' : 'text-stone-600'}`} />
                    <span>{isDelivering ? '10 km Bound' : 'Outside 10 km'}</span>
                  </span>

                  <span className="text-stone-400 font-mono text-[10px]">
                    License: {m.license_number.slice(-5)}
                  </span>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
