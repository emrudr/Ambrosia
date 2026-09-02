import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MapPin,
  ShieldCheck,
  ShieldAlert,
  ShoppingBag,
  User,
  Store,
  Clock,
  Sparkles,
  ChevronDown,
  Layers,
} from 'lucide-react';

export default function Navbar({
  location = { city: 'Delhi', district: 'Connaught Place', latitude: 28.6289, longitude: 77.2195 },
  onOpenLocationModal,
  ageMode = 28,
  onToggleAgeMode,
  cart = [],
  onOpenCart,
  user = null,
  onLogout,
  activeOrdersCount = 0,
}) {
  const currentPath = useLocation().pathname;
  const navigate = useNavigate();
  const totalCartItems = cart.reduce((sum, i) => sum + (i.quantity || 1), 0);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-[#d4af37]/20 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo & Tagline */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl border border-[#d4af37]/40 bg-gradient-to-br from-amber-500/20 to-stone-950 flex items-center justify-center text-amber-300 shadow-lg shadow-amber-950/40 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-[#d4af37] animate-pulse" />
          </div>
          <div>
            <span className="font-serif-lux text-xl lg:text-2xl font-bold tracking-widest gold-gradient-text uppercase">
              Ambrosia
            </span>
            <span className="hidden sm:block text-[10px] tracking-[0.25em] text-amber-200/60 uppercase font-medium">
              Artisanal Spirits & Rare Elixirs
            </span>
          </div>
        </Link>

        {/* Location & Age Gating Center Cluster */}
        <div className="hidden md:flex items-center gap-3">
          
          {/* Geolocation / District Selector */}
          <button
            onClick={onOpenLocationModal}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-amber-500/10 border border-[#d4af37]/25 hover:border-[#d4af37]/50 text-xs font-medium text-amber-100/90 transition-all shadow-sm"
            title="Change delivery location / district"
          >
            <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="font-semibold text-amber-200">{location.district || 'Connaught Place'}</span>
            <span className="text-stone-400">({location.city || 'Delhi'})</span>
            <ChevronDown className="w-3 h-3 text-[#d4af37]/70 ml-1" />
          </button>

          {/* Age Verification Badge & Toggle */}
          <button
            onClick={onToggleAgeMode}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all ${
              ageMode >= 18
                ? 'bg-amber-500/15 border-[#d4af37]/50 text-amber-300 shadow-[0_0_12px_rgba(212,175,55,0.25)]'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
            }`}
            title="Click to toggle between 18+ Reserve Cellar and Under-18 Zero-Proof Curations"
          >
            {ageMode >= 18 ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>18+ Cellar Unlocked</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                <span>&lt;18 Zero-Proof Safe Mode</span>
              </>
            )}
          </button>

        </div>

        {/* Right Navigation & Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          
          {/* Marketplace Feed */}
          <Link
            to="/marketplace"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentPath === '/marketplace'
                ? 'bg-amber-500/20 border border-[#d4af37]/50 text-amber-200'
                : 'text-stone-300 hover:text-amber-200 hover:bg-white/[0.04]'
            }`}
          >
            <Layers className="w-4 h-4 text-[#d4af37]" />
            <span className="hidden sm:inline">Cellar Feed</span>
          </Link>

          {/* Orders / Live Tracking */}
          <Link
            to="/orders"
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentPath === '/orders'
                ? 'bg-amber-500/20 border border-[#d4af37]/50 text-amber-200'
                : 'text-stone-300 hover:text-amber-200 hover:bg-white/[0.04]'
            }`}
          >
            <Clock className="w-4 h-4 text-[#d4af37]" />
            <span className="hidden sm:inline">Orders</span>
            {activeOrdersCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </Link>

          {/* Merchant Portal */}
          <Link
            to="/merchant/dashboard"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentPath.startsWith('/merchant')
                ? 'bg-amber-500/20 border border-[#d4af37]/50 text-amber-200'
                : 'text-stone-300 hover:text-amber-200 hover:bg-white/[0.04]'
            }`}
          >
            <Store className="w-4 h-4 text-[#d4af37]" />
            <span className="hidden sm:inline">Merchant</span>
          </Link>

          {/* Cart Drawer Trigger */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-[#d4af37]/40 hover:border-[#d4af37] text-xs font-medium text-amber-100 transition-all shadow-md group"
          >
            <ShoppingBag className="w-4 h-4 text-[#d4af37] group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline font-semibold">Cart</span>
            {totalCartItems > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#d4af37] text-stone-950 text-[11px] font-bold flex items-center justify-center shadow">
                {totalCartItems}
              </span>
            )}
          </button>

          {/* Member Authentication Menu */}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden lg:block text-right">
                <p className="text-xs font-semibold text-amber-200 leading-tight">{user.full_name}</p>
                <p className="text-[10px] text-stone-400">Age: {user.age} • {user.district}</p>
              </div>
              <button
                onClick={onLogout}
                className="px-2.5 py-1 text-[11px] rounded bg-white/[0.05] hover:bg-red-500/20 hover:text-red-300 border border-white/10 text-stone-300 transition-all"
                title="Sign out of Ambrosia"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-amber-500/20 border border-[#d4af37]/25 hover:border-[#d4af37] text-xs font-medium text-amber-100 transition-all"
              >
                <User className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Sign In</span>
              </Link>
            </div>
          )}

        </div>

      </div>

      {/* Mobile Location / Age Bar Subheader */}
      <div className="md:hidden flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/[0.06]">
        <button
          onClick={onOpenLocationModal}
          className="flex items-center gap-1.5 text-[11px] text-amber-200"
        >
          <MapPin className="w-3 h-3 text-[#d4af37]" />
          <span>{location.district}, {location.city}</span>
          <ChevronDown className="w-3 h-3 text-[#d4af37]" />
        </button>

        <button
          onClick={onToggleAgeMode}
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
            ageMode >= 18
              ? 'bg-amber-500/10 border-[#d4af37]/40 text-amber-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}
        >
          {ageMode >= 18 ? '18+ Spirits' : '<18 Zero-Proof'}
        </button>
      </div>
    </header>
  );
}
