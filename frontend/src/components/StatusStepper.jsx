import React from 'react';
import { CheckCircle2, Clock, PackageCheck, Truck, Sparkles } from 'lucide-react';

const STAGES = [
  {
    key: 'RECEIVED',
    label: 'Ticket Received',
    desc: 'Order registered & cellar inventory reserved',
    icon: Clock,
  },
  {
    key: 'PREPARING',
    label: 'Cellar Allocation',
    desc: 'Sommelier preparation & temperature validation',
    icon: Sparkles,
  },
  {
    key: 'OUT_FOR_DELIVERY',
    label: 'Out for Delivery',
    desc: 'Chilled courier en-route within 10 km corridor',
    icon: Truck,
  },
  {
    key: 'DELIVERED',
    label: 'Delivered',
    desc: 'Delivered to address • Pay-on-Delivery collected',
    icon: PackageCheck,
  },
];

export default function StatusStepper({
  currentStatus = 'RECEIVED',
  onAdvance = null,
  isMerchant = false,
  className = '',
}) {
  const currentIdx = STAGES.findIndex(
    (s) => s.key.toUpperCase() === currentStatus.toUpperCase()
  );
  const activeIndex = currentIdx === -1 ? 0 : currentIdx;

  const nextStage = activeIndex < STAGES.length - 1 ? STAGES[activeIndex + 1] : null;

  return (
    <div className={`p-5 rounded-2xl glass-panel border border-[#d4af37]/20 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#d4af37] font-medium">
            Fulfillment Lifecycle
          </span>
          <h4 className="text-lg font-bold text-white font-serif-lux mt-0.5">
            {STAGES[activeIndex]?.label}
          </h4>
        </div>
        <div className="flex items-center space-x-2">
          <span className="relative flex h-3 w-3">
            {activeIndex < 3 && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            )}
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          <span className="text-xs font-mono text-amber-200/80 uppercase">
            {currentStatus}
          </span>
        </div>
      </div>

      {/* 4-Stage Visual Progress Tracker */}
      <div className="relative">
        {/* Background Track */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-stone-800 -z-0" />
        
        {/* Active Progress Fill */}
        <div
          className="absolute top-5 left-5 h-0.5 bg-gradient-to-r from-amber-500 via-[#d4af37] to-amber-200 transition-all duration-700 -z-0"
          style={{
            width: `${(activeIndex / (STAGES.length - 1)) * 100}%`,
            maxWidth: 'calc(100% - 2.5rem)',
          }}
        />

        <div className="grid grid-cols-4 gap-2 relative z-10">
          {STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;

            return (
              <div key={stage.key} className="flex flex-col items-center text-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isCompleted
                      ? 'bg-[#d4af37] text-stone-950 ring-4 ring-[#d4af37]/20'
                      : isCurrent
                      ? 'bg-stone-900 border-2 border-[#d4af37] text-amber-300 shadow-[0_0_15px_rgba(212,175,55,0.5)] ring-4 ring-amber-500/20'
                      : 'bg-stone-900/90 border border-stone-800 text-stone-600'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>

                <p
                  className={`mt-2.5 text-xs font-semibold tracking-wide ${
                    isCurrent
                      ? 'text-amber-300'
                      : isCompleted
                      ? 'text-stone-300'
                      : 'text-stone-600'
                  }`}
                >
                  {stage.label}
                </p>
                <p className="mt-0.5 text-[10px] text-stone-400 max-w-[120px] hidden md:block leading-tight">
                  {stage.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Merchant / Simulation Advance Action Trigger */}
      {onAdvance && nextStage && (
        <div className="mt-6 pt-4 border-t border-stone-800 flex items-center justify-between">
          <p className="text-xs text-stone-400">
            Next milestone:{' '}
            <span className="text-amber-300 font-semibold">{nextStage.label}</span>
          </p>
          <button
            onClick={() => onAdvance(nextStage.key)}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-amber-600 to-[#d4af37] text-stone-950 hover:brightness-110 transition-all flex items-center space-x-1.5 shadow-md shadow-amber-900/20"
          >
            <span>{isMerchant ? 'Advance to ' + nextStage.label : 'Simulate Next Stage'}</span>
            <span className="text-sm">→</span>
          </button>
        </div>
      )}
    </div>
  );
}
