import React from 'react';
import {
  Wine,
  Beer,
  GlassWater,
  Sparkles,
  Coffee,
  Flame,
  Droplets,
  ShieldCheck,
  Award,
} from 'lucide-react';

/**
 * DrinkBadge: Pure SVG Illuminated Aesthetic Architecture
 * Replaces external images entirely with custom radial gradients, glassmorphic obsidian backing,
 * and illuminated Champagne Gold / Gemstone SVG iconography from lucide-react.
 */
export default function DrinkBadge({
  category = 'Alcoholic',
  subCategory = '',
  abv = 0.0,
  size = 'md', // 'sm' | 'md' | 'lg' | 'hero'
  className = '',
}) {
  const isNonAlcoholic = abv === 0.0 || category.toLowerCase().includes('non-alcoholic');
  const subLower = (subCategory || '').toLowerCase();

  // Style Profiles based on beverage type
  let iconComponent = <GlassWater className="text-amber-300" />;
  let gradientBg = 'from-amber-950/40 via-yellow-950/20 to-transparent';
  let glowColor = 'rgba(212, 175, 55, 0.25)';
  let borderColor = 'rgba(212, 175, 55, 0.35)';
  let accentTag = 'Reserve Spirit';
  let accentTagColor = 'text-amber-300 bg-amber-950/50 border-amber-500/30';

  if (isNonAlcoholic) {
    if (subLower.includes('coffee') || subLower.includes('brew')) {
      iconComponent = <Coffee className="text-amber-200" />;
      gradientBg = 'from-stone-900 via-amber-950/30 to-transparent';
      glowColor = 'rgba(180, 120, 50, 0.25)';
      borderColor = 'rgba(180, 120, 50, 0.4)';
      accentTag = 'Artisan Cold Brew';
      accentTagColor = 'text-amber-200 bg-stone-900/80 border-amber-800/40';
    } else if (subLower.includes('tonic') || subLower.includes('soda')) {
      iconComponent = <Sparkles className="text-cyan-300" />;
      gradientBg = 'from-cyan-950/40 via-blue-950/20 to-transparent';
      glowColor = 'rgba(56, 189, 248, 0.25)';
      borderColor = 'rgba(56, 189, 248, 0.35)';
      accentTag = 'Botanical Tonic';
      accentTagColor = 'text-cyan-300 bg-cyan-950/50 border-cyan-500/30';
    } else {
      iconComponent = <Droplets className="text-emerald-300" />;
      gradientBg = 'from-emerald-950/40 via-teal-950/20 to-transparent';
      glowColor = 'rgba(16, 185, 129, 0.25)';
      borderColor = 'rgba(16, 185, 129, 0.35)';
      accentTag = 'Zero-Proof Elixir';
      accentTagColor = 'text-emerald-300 bg-emerald-950/50 border-emerald-500/30';
    }
  } else {
    // Alcoholic Spirits
    if (subLower.includes('malt') || subLower.includes('whisky')) {
      iconComponent = <Award className="text-amber-400" />;
      gradientBg = 'from-amber-900/40 via-orange-950/30 to-transparent';
      glowColor = 'rgba(212, 175, 55, 0.35)';
      borderColor = 'rgba(212, 175, 55, 0.5)';
      accentTag = 'Single Malt Reserve';
      accentTagColor = 'text-amber-300 bg-amber-950/60 border-amber-500/40';
    } else if (subLower.includes('gin')) {
      iconComponent = <Sparkles className="text-teal-300" />;
      gradientBg = 'from-teal-950/40 via-emerald-950/30 to-transparent';
      glowColor = 'rgba(20, 184, 166, 0.3)';
      borderColor = 'rgba(20, 184, 166, 0.4)';
      accentTag = 'Artisanal Gin';
      accentTagColor = 'text-teal-300 bg-teal-950/60 border-teal-500/40';
    } else if (subLower.includes('beer') || subLower.includes('ale')) {
      iconComponent = <Beer className="text-yellow-400" />;
      gradientBg = 'from-yellow-950/40 via-amber-950/30 to-transparent';
      glowColor = 'rgba(234, 179, 8, 0.3)';
      borderColor = 'rgba(234, 179, 8, 0.4)';
      accentTag = 'Craft Microbrew';
      accentTagColor = 'text-yellow-300 bg-yellow-950/60 border-yellow-500/40';
    } else if (subLower.includes('wine')) {
      iconComponent = <Wine className="text-rose-400" />;
      gradientBg = 'from-rose-950/40 via-purple-950/30 to-transparent';
      glowColor = 'rgba(244, 63, 94, 0.3)';
      borderColor = 'rgba(244, 63, 94, 0.4)';
      accentTag = 'Vintage Cellar';
      accentTagColor = 'text-rose-300 bg-rose-950/60 border-rose-500/40';
    } else if (subLower.includes('tequila') || subLower.includes('vodka')) {
      iconComponent = <Flame className="text-amber-300" />;
      gradientBg = 'from-orange-950/40 via-amber-950/20 to-transparent';
      glowColor = 'rgba(245, 158, 11, 0.3)';
      borderColor = 'rgba(245, 158, 11, 0.4)';
      accentTag = 'Ultra-Premium Spirit';
      accentTagColor = 'text-amber-300 bg-amber-950/60 border-amber-500/40';
    }
  }

  // Dimension scaling
  const sizeMap = {
    sm: {
      box: 'w-12 h-12',
      iconSize: 'w-6 h-6',
      ring: 'p-2',
    },
    md: {
      box: 'w-24 h-24',
      iconSize: 'w-10 h-10',
      ring: 'p-3',
    },
    lg: {
      box: 'w-36 h-36',
      iconSize: 'w-16 h-16',
      ring: 'p-4',
    },
    hero: {
      box: 'w-48 h-48',
      iconSize: 'w-20 h-20',
      ring: 'p-6',
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {/* Outer Illuminated Geometric Container */}
      <div
        className={`relative ${currentSize.box} rounded-2xl flex items-center justify-center backdrop-blur-md overflow-hidden transition-transform duration-500 hover:scale-105`}
        style={{
          backgroundColor: '#090A0F',
          border: `1px solid ${borderColor}`,
          boxShadow: `0 0 25px ${glowColor}, inset 0 0 15px rgba(0,0,0,0.8)`,
        }}
      >
        {/* Ambient Radial Gradient Backing */}
        <div
          className={`absolute inset-0 bg-gradient-to-b ${gradientBg} opacity-80`}
        />

        {/* Diagonal Light Beam Effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-40 pointer-events-none" />

        {/* Concentric Geometric Golden Rings */}
        <div
          className="absolute w-[80%] h-[80%] rounded-xl border border-dashed opacity-30 pointer-events-none"
          style={{ borderColor: borderColor }}
        />

        {/* Centered SVG Icon with Glow */}
        <div className={`relative z-10 ${currentSize.iconSize} flex items-center justify-center drop-shadow-[0_0_12px_rgba(212,175,55,0.6)]`}>
          {React.cloneElement(iconComponent, {
            className: `${currentSize.iconSize} transition-transform duration-300 group-hover:scale-110`,
          })}
        </div>

        {/* Subtle Corner Accents */}
        <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 border-t border-l border-amber-400/60" />
        <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 border-t border-r border-amber-400/60" />
        <div className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 border-b border-l border-amber-400/60" />
        <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 border-b border-r border-amber-400/60" />
      </div>

      {/* Tiny Sub-Type Label Pill */}
      {size !== 'sm' && (
        <span
          className={`mt-2 px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded-full border ${accentTagColor}`}
        >
          {accentTag}
        </span>
      )}
    </div>
  );
}
