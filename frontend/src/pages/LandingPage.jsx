import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  ShieldCheck,
  Sparkles,
  Truck,
  Store,
  ArrowRight,
  Wine,
  Award,
  Clock,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import DrinkBadge from '../components/DrinkBadge';

export default function LandingPage({
  userLocation,
  onOpenLocationModal,
  ageMode,
  onToggleAgeMode,
}) {
  return (
    <div className="relative min-h-screen bg-[#070709] text-stone-100 overflow-hidden">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#d4af37]/15 via-amber-900/5 to-transparent rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute top-1/3 -left-48 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute top-2/3 -right-48 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 lg:px-8 pt-16 pb-24 text-center">
        {/* Editorial Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#d4af37]/30 bg-amber-950/20 backdrop-blur-md text-xs font-semibold text-amber-300 shadow-[0_0_15px_rgba(212,175,55,0.2)] mb-8 animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>Tier-1 Urban Clusters • Delhi & Noida Exclusive</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-serif-lux text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl mx-auto leading-[1.1] mb-6">
          Rare Single Malts &{' '}
          <span className="gold-gradient-text block mt-1">Artisanal Spirits</span>
          Delivered In Minutes.
        </h1>

        {/* Hero Subtitle */}
        <p className="text-stone-300 text-sm sm:text-lg max-w-2xl mx-auto font-light leading-relaxed mb-10">
          Ambrosia is the hyper-local on-demand cellar connecting discerning connoisseurs to licensed
          luxury venues within an uncompromising <span className="text-[#d4af37] font-medium">10 km radius</span>.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
          <Link
            to="/marketplace"
            className="w-full sm:w-auto px-8 py-4 rounded-xl gold-gradient-btn text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-2xl hover:shadow-amber-500/30 transition-all group"
          >
            <span>Explore Reserve Cellar</span>
            <ArrowRight className="w-4 h-4 text-stone-950 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            to="/merchant/onboard"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-[#d4af37]/30 hover:border-[#d4af37]/60 text-xs sm:text-sm font-semibold text-amber-200 flex items-center justify-center gap-2 transition-all backdrop-blur-md"
          >
            <Store className="w-4 h-4 text-[#d4af37]" />
            <span>Partner Venue Onboard</span>
          </Link>
        </div>

        {/* Live Zero-Image Illuminated Showcase */}
        <div className="p-6 rounded-3xl glass-panel border border-[#d4af37]/20 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-center shadow-2xl">
          <div className="flex flex-col items-center">
            <DrinkBadge category="Alcoholic" subCategory="Single Malt" abv={43.0} size="md" />
            <span className="text-xs font-serif-lux font-semibold text-white mt-2">Single Malt</span>
            <span className="text-[10px] text-amber-400/80">Aged 18 Years</span>
          </div>

          <div className="flex flex-col items-center">
            <DrinkBadge category="Alcoholic" subCategory="Artisanal Gin" abv={42.8} size="md" />
            <span className="text-xs font-serif-lux font-semibold text-white mt-2">Himalayan Gin</span>
            <span className="text-[10px] text-teal-400/80">Botanical Infusion</span>
          </div>

          <div className="flex flex-col items-center">
            <DrinkBadge category="Alcoholic" subCategory="Craft Beer" abv={5.2} size="md" />
            <span className="text-xs font-serif-lux font-semibold text-white mt-2">Imperial IPA</span>
            <span className="text-[10px] text-yellow-400/80">Microbrew Draft</span>
          </div>

          <div className="flex flex-col items-center">
            <DrinkBadge category="Non-Alcoholic" subCategory="Botanical Tonic" abv={0.0} size="md" />
            <span className="text-xs font-serif-lux font-semibold text-white mt-2">Zero-Proof Elixir</span>
            <span className="text-[10px] text-emerald-400/80">0.0% ABV Safe</span>
          </div>
        </div>
      </section>

      {/* The Four Core Pillars */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 lg:px-8 py-20 border-t border-stone-800/80">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-widest text-[#d4af37] font-semibold">
            Architectural Philosophy
          </span>
          <h2 className="font-serif-lux text-3xl sm:text-4xl font-bold text-white mt-2">
            The Four Pillars of Ambrosia
          </h2>
          <p className="text-stone-400 text-xs sm:text-sm mt-3">
            Engineered for uncompromising luxury, strict compliance, and instantaneous delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1 */}
          <div className="p-6 rounded-2xl glass-panel glass-panel-hover border border-[#d4af37]/20 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] mb-4 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                <Compass className="w-6 h-6" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#d4af37]">
                Pillar 01
              </span>
              <h3 className="font-serif-lux text-lg font-bold text-white mt-1 mb-2">
                10 km Haversine Boundaries
              </h3>
              <p className="text-stone-400 text-xs leading-relaxed font-light">
                Customers are strictly location-bound. Our geospatial engine enforces straight-line
                Haversine distance; venues beyond 10 km are strictly concealed.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-amber-200">
              <span>Delivery Radius</span>
              <span className="font-bold text-[#d4af37]">≤ 10.0 km</span>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-2xl glass-panel glass-panel-hover border border-[#d4af37]/20 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
                Pillar 02
              </span>
              <h3 className="font-serif-lux text-lg font-bold text-white mt-1 mb-2">
                Strict Legal Age-Gating
              </h3>
              <p className="text-stone-400 text-xs leading-relaxed font-light">
                Under-18 accounts are sanitized to zero alcoholic inventory (0.0% ABV only).
                Age 18+ accounts unlock the full reserve spirits cellar.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-emerald-300">
              <span>Catalog Isolation</span>
              <span className="font-bold text-emerald-400">18+ Verified</span>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-2xl glass-panel glass-panel-hover border border-[#d4af37]/20 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] mb-4 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#d4af37]">
                Pillar 03
              </span>
              <h3 className="font-serif-lux text-lg font-bold text-white mt-1 mb-2">
                Zero-Image Pure SVG Art
              </h3>
              <p className="text-stone-400 text-xs leading-relaxed font-light">
                No external image uploads or CDN image tags. Every bottle is an illuminated work of
                art rendered via Obsidian Black and Champagne Gold SVG frames.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-amber-200">
              <span>Aesthetic Standard</span>
              <span className="font-bold text-[#d4af37]">Obsidian & Gold</span>
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="p-6 rounded-2xl glass-panel glass-panel-hover border border-[#d4af37]/20 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] mb-4 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                <Truck className="w-6 h-6" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#d4af37]">
                Pillar 04
              </span>
              <h3 className="font-serif-lux text-lg font-bold text-white mt-1 mb-2">
                Pay-on-Delivery Stepper
              </h3>
              <p className="text-stone-400 text-xs leading-relaxed font-light">
                Pay directly upon door delivery. Venues manage dispatch tickets stepping orders
                through a real-time 4-stage visual progress tracker.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-amber-200">
              <span>Fulfillment Lifecycle</span>
              <span className="font-bold text-[#d4af37]">4-State Stepper</span>
            </div>
          </div>
        </div>
      </section>

      {/* Location Corridor Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 lg:px-8 py-16">
        <div className="p-8 sm:p-12 rounded-3xl glass-panel border border-[#d4af37]/25 relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <span className="text-xs uppercase tracking-widest text-[#d4af37] font-semibold">
                Geographic Coverage
              </span>
              <h3 className="font-serif-lux text-2xl sm:text-3xl font-bold text-white mt-1 mb-3">
                Serving 20 Licensed Districts Across Delhi & Noida
              </h3>
              <p className="text-stone-400 text-xs sm:text-sm font-light leading-relaxed mb-6">
                Current selected district:{' '}
                <span className="text-[#d4af37] font-semibold">
                  {userLocation.district || 'Connaught Place'}, {userLocation.city || 'Delhi'}
                </span>
                . Browse exclusive inventory within your live 10 km corridor.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={onOpenLocationModal}
                  className="px-5 py-2.5 rounded-xl gold-gradient-btn text-xs font-bold uppercase tracking-wider shadow-lg"
                >
                  Change Delivery District
                </button>
                <Link
                  to="/marketplace"
                  className="px-5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-stone-300 transition-all"
                >
                  Browse Nearby Venues
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
              {['Connaught Place', 'Hauz Khas', 'Saket', 'Aerocity', 'Sector 18 Noida', 'Sector 62 Noida'].map(
                (district) => (
                  <div
                    key={district}
                    className="p-3 rounded-xl bg-black/40 border border-white/[0.08] flex items-center gap-2 text-xs text-amber-200/90"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>{district}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-stone-800/80 py-10 px-4 text-center text-xs text-stone-500">
        <p className="font-serif-lux text-sm text-stone-400 mb-2">
          Ambrosia • The Luxury Artisanal Spirits & Rare Elixirs Marketplace
        </p>
        <p className="max-w-md mx-auto text-[11px] text-stone-500 mb-4">
          Strictly compliant with Delhi & Uttar Pradesh Excise Acts. Only individuals 18 years and older may access alcoholic spirits.
        </p>
        <p>© 2026 Ambrosia Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
