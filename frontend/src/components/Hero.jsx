import React from 'react';
import { Search, Compass, ShieldCheck, Sparkles, Navigation, SlidersHorizontal, Wine } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Curations' },
  { id: 'Single Malt', label: 'Single Malts' },
  { id: 'Gin', label: 'Artisanal Gins' },
  { id: 'Tequila', label: 'Agave & Tequilas' },
  { id: 'Craft Beer', label: 'Craft Microbrews' },
  { id: 'Non-Alcoholic', label: '0.0% Botanical Spirits' },
  { id: 'Mocktail', label: 'Artisan Mocktails' },
  { id: 'Tonic', label: 'Botanical Tonics' },
  { id: 'Cold Brew', label: 'Nitro Cold Brews' },
];

export default function Hero({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  onlyWithinRadius,
  onToggleRadius,
  location,
  onDetectGPS,
  isDetectingGPS,
  ageMode,
}) {
  return (
    <section className="relative overflow-hidden pt-8 pb-12 px-4 lg:px-8 border-b border-amber-500/10 bg-gradient-to-b from-amber-950/20 via-black to-[#070709]">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute -top-10 right-10 w-[300px] h-[300px] bg-yellow-600/10 blur-[90px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto text-center relative z-10">
        
        {/* Luxury Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border border-amber-400/30 text-xs font-semibold text-amber-300 tracking-wider uppercase mb-6 animate-shimmer shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Location-Bound Artisanal Spirits Vault • Delhi & Noida</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-serif-lux text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4 leading-[1.15]">
          The Artisanal Spirits & <br className="hidden sm:block" />
          <span className="gold-gradient-text">Rare Elixirs Vault</span>
        </h1>

        {/* Hero Subtitle */}
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-stone-300/90 font-light mb-8 leading-relaxed">
          Exclusively curated from master distilleries, boutique cellars, and botanical alchemists. 
          Promptly fulfilled to your doorstep within a strictly verified <span className="text-amber-300 font-medium">10 km radius</span> with Pay-on-Delivery assurance.
        </p>

        {/* Search & Location Bar */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="glass-panel p-2 rounded-2xl border border-amber-500/30 shadow-2xl flex flex-col sm:flex-row items-center gap-2">
            
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400/70" />
              <input
                type="text"
                placeholder="Search Single Malts, Botanical Gins, Tonics, or Mocktails..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/40 border border-white/5 focus:border-amber-400/50 text-sm text-amber-100 placeholder:text-stone-500 focus:outline-none transition-all"
              />
            </div>

            {/* GPS Auto-Detect Button */}
            <button
              onClick={onDetectGPS}
              disabled={isDetectingGPS}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/[0.06] hover:bg-amber-500/20 border border-amber-500/20 text-xs font-semibold text-amber-200 transition-all whitespace-nowrap"
              title="Detect precise GPS location for distance filtering"
            >
              <Navigation className={`w-3.5 h-3.5 text-amber-400 ${isDetectingGPS ? 'animate-spin' : ''}`} />
              <span>{isDetectingGPS ? 'Detecting GPS...' : 'Auto-Detect GPS'}</span>
            </button>

            {/* 10km Delivery Radius Toggle */}
            <button
              onClick={onToggleRadius}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold transition-all border whitespace-nowrap ${
                onlyWithinRadius
                  ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20'
                  : 'bg-white/[0.04] text-stone-300 border-white/10 hover:border-amber-500/30 hover:text-amber-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>&le; 10 km Radius Only</span>
            </button>

          </div>

          {/* Current Proximity Subtitle */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-3 text-xs text-stone-400">
            <span>Delivering to: <strong className="text-amber-300">{location.district}, {location.city}</strong></span>
            <span>•</span>
            <span>Coordinates: <span className="font-mono text-stone-300">{location.latitude?.toFixed(4)}, {location.longitude?.toFixed(4)}</span></span>
            <span>•</span>
            <span className="text-amber-400 font-medium">⚡ Pay on Delivery Active</span>
          </div>

        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none max-w-5xl mx-auto">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all whitespace-nowrap border ${
                  isSelected
                    ? 'gold-gradient-btn shadow-md shadow-amber-950/60 font-semibold'
                    : 'bg-white/[0.03] text-stone-300 border-white/10 hover:border-amber-500/30 hover:bg-white/[0.06] hover:text-amber-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Under-18 Banner Notice */}
        {ageMode < 18 && (
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              <strong>Zero-Proof Mode Active:</strong> Showing 0.0% ABV Distilled Non-Alcoholic Spirits, Artisan Mocktails, and Botanical Craft Mixers.
            </span>
          </div>
        )}

      </div>
    </section>
  );
}
