import React from 'react';
import { X, MapPin, Navigation, Compass, Check } from 'lucide-react';

export default function DistrictModal({
  isOpen,
  onClose,
  districts,
  currentLocation,
  onSelectDistrict,
  onDetectGPS,
  isDetectingGPS,
}) {
  if (!isOpen) return null;

  const delhiDistricts = districts.filter(d => d.city === 'Delhi');
  const noidaDistricts = districts.filter(d => d.city === 'Noida');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-xl rounded-3xl glass-panel border border-amber-500/30 overflow-hidden shadow-2xl animate-scaleUp max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif-lux text-lg font-bold text-white tracking-wide">
                Select Delivery District
              </h2>
              <p className="text-[11px] text-stone-400">
                10 km proximity radius is calculated relative to your selected hub
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-stone-300 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          
          {/* GPS Auto-Detect Banner */}
          <button
            onClick={() => {
              onDetectGPS();
              onClose();
            }}
            disabled={isDetectingGPS}
            className="w-full p-3.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-200 flex items-center justify-between transition-all group shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-black flex items-center justify-center">
                <Navigation className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-white">Auto-Detect My Current GPS Location</h4>
                <p className="text-[10px] text-stone-400">Uses browser geolocation coordinates</p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-black/50 text-amber-300 border border-amber-500/30">
              Live GPS
            </span>
          </button>

          {/* Delhi Hubs */}
          <div>
            <h3 className="font-serif-lux text-xs font-bold text-amber-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Delhi Curated Districts (10 Hubs)</span>
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
              {delhiDistricts.map((d) => {
                const isSelected = currentLocation.district === d.district;
                return (
                  <button
                    key={d.district}
                    onClick={() => {
                      onSelectDistrict(d);
                      onClose();
                    }}
                    className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/20 text-amber-200 font-bold shadow-md'
                        : 'border-white/10 hover:border-amber-500/30 bg-white/[0.02] text-stone-300 hover:text-white'
                    }`}
                  >
                    <div>
                      <span className="block truncate">{d.district}</span>
                      <span className="text-[10px] font-mono text-stone-500">PIN: {d.pincode}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Noida Hubs */}
          <div>
            <h3 className="font-serif-lux text-xs font-bold text-amber-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Noida Curated Districts (10 Hubs)</span>
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
              {noidaDistricts.map((d) => {
                const isSelected = currentLocation.district === d.district;
                return (
                  <button
                    key={d.district}
                    onClick={() => {
                      onSelectDistrict(d);
                      onClose();
                    }}
                    className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/20 text-amber-200 font-bold shadow-md'
                        : 'border-white/10 hover:border-amber-500/30 bg-white/[0.02] text-stone-300 hover:text-white'
                    }`}
                  >
                    <div>
                      <span className="block truncate">{d.district}</span>
                      <span className="text-[10px] font-mono text-stone-500">PIN: {d.pincode}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
