import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Wine, 
  Truck, 
  CheckCircle2, 
  MapPin, 
  Clock, 
  Phone, 
  ArrowRight, 
  RefreshCw, 
  Sparkles, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

const STEPS = [
  {
    key: 'RECEIVED',
    label: 'Order Vault Confirmed',
    description: 'Cellar reserve reserved & allocated',
    icon: Package,
  },
  {
    key: 'PREPARING',
    label: 'Sommelier Preparation',
    description: 'Chilled bottle selection & tamper sealing',
    icon: Wine,
  },
  {
    key: 'OUT_FOR_DELIVERY',
    label: 'Chilled Courier In Transit',
    description: 'Temperature-controlled courier within 10 km',
    icon: Truck,
  },
  {
    key: 'DELIVERED',
    label: 'Delivered & Settled',
    description: 'Pay on Delivery completed at door',
    icon: CheckCircle2,
  },
];

export default function LiveOrderTracker({
  activeOrders,
  onRefreshOrders,
  onAdvanceOrderStatus,
  onSelectOrder,
  selectedOrderId,
}) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    if (activeOrders && activeOrders.length > 0) {
      if (selectedOrderId) {
        const found = activeOrders.find(o => o.id === selectedOrderId);
        setSelectedOrder(found || activeOrders[0]);
      } else {
        setSelectedOrder(activeOrders[0]);
      }
    } else {
      setSelectedOrder(null);
    }
  }, [activeOrders, selectedOrderId]);

  // Determine current step index
  const getStepIndex = (status) => {
    switch (status) {
      case 'RECEIVED': return 0;
      case 'PREPARING': return 1;
      case 'OUT_FOR_DELIVERY': return 2;
      case 'DELIVERED': return 3;
      default: return 0;
    }
  };

  const currentStepIdx = selectedOrder ? getStepIndex(selectedOrder.status) : 0;

  // Simulate advancing the order through stages
  const handleSimulateNext = async () => {
    if (!selectedOrder) return;
    setIsSimulating(true);
    const nextStatusMap = {
      'RECEIVED': 'PREPARING',
      'PREPARING': 'OUT_FOR_DELIVERY',
      'OUT_FOR_DELIVERY': 'DELIVERED',
      'DELIVERED': 'RECEIVED',
    };
    const nextStatus = nextStatusMap[selectedOrder.status] || 'PREPARING';
    
    try {
      await onAdvanceOrderStatus(selectedOrder.id, nextStatus);
      if (nextStatus === 'DELIVERED') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#d4af37', '#f3e5ab', '#ffffff']
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  if (!activeOrders || activeOrders.length === 0) {
    return (
      <section className="py-16 px-4 lg:px-8 max-w-4xl mx-auto text-center">
        <div className="glass-panel p-10 rounded-3xl border border-amber-500/20 max-w-lg mx-auto shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300 mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="font-serif-lux text-2xl font-bold text-white mb-2">
            No Active Orders
          </h2>
          <p className="text-xs text-stone-400 font-light mb-6">
            You currently have no active orders in transit. Explore our catalog and place a Pay-on-Delivery order within 10 km.
          </p>
          <button
            onClick={onRefreshOrders}
            className="px-5 py-2.5 rounded-xl gold-gradient-btn text-xs font-bold"
          >
            Refresh Status
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 px-4 lg:px-8 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
              Live Fulfillment Radar
            </span>
          </div>
          <h2 className="font-serif-lux text-2xl sm:text-3xl font-bold text-white">
            Active Order Tracking
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefreshOrders}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs text-stone-300 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Refresh Live Feeds</span>
          </button>

          <button
            onClick={handleSimulateNext}
            disabled={isSimulating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl gold-gradient-btn text-xs font-bold shadow-lg shadow-amber-950/40"
            title="Advance the order stage to test live transitions"
          >
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span>Advance Next Stage (Demo)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Main Live Stepper Card */}
        <div className="lg:col-span-2 space-y-6">
          {selectedOrder && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/30 shadow-2xl relative overflow-hidden">
              
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-white/10">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 block mb-0.5">
                    Order Ref: #{selectedOrder.id.slice(0, 8)}
                  </span>
                  <h3 className="font-serif-lux text-xl font-bold text-white">
                    {selectedOrder.merchant_name || 'Artisanal Cellar'}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-xs font-bold text-amber-300 uppercase tracking-wider">
                    {selectedOrder.status.replace('_', ' ')}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300">
                    Pay on Delivery
                  </span>
                </div>
              </div>

              {/* 4-STAGE LIVE STEPPER */}
              <div className="py-8">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
                  
                  {/* Connecting Line (Desktop) */}
                  <div className="hidden sm:block absolute top-6 left-10 right-10 h-0.5 bg-stone-800 -z-0">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-700 ease-out"
                      style={{ width: `${(currentStepIdx / (STEPS.length - 1)) * 100}%` }}
                    />
                  </div>

                  {STEPS.map((step, idx) => {
                    const StepIcon = step.icon;
                    const isCompleted = currentStepIdx >= idx;
                    const isCurrent = currentStepIdx === idx;

                    return (
                      <div key={step.key} className="flex flex-row sm:flex-col items-center gap-3 sm:text-center relative z-10">
                        {/* Step Circle */}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl flex-shrink-0 ${
                          isCurrent
                            ? 'bg-amber-400 text-black border-2 border-amber-200 shadow-amber-400/50 scale-110 animate-bounce'
                            : isCompleted
                            ? 'bg-amber-950 border border-amber-500 text-amber-300'
                            : 'bg-stone-900 border border-stone-800 text-stone-600'
                        }`}>
                          <StepIcon className="w-5 h-5" />
                        </div>

                        {/* Step Label */}
                        <div className="min-w-0">
                          <h4 className={`text-xs font-bold leading-tight ${
                            isCompleted ? 'text-amber-200' : 'text-stone-500'
                          }`}>
                            {step.label}
                          </h4>
                          <p className="text-[10px] text-stone-400 line-clamp-2 mt-0.5 font-light">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                </div>
              </div>

              {/* Route & Distance Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-black/40 border border-white/5 text-xs mb-6">
                <div>
                  <span className="text-[10px] text-stone-500 uppercase tracking-wider block mb-1">
                    Merchant Cellar Origin
                  </span>
                  <div className="flex items-center gap-1.5 text-stone-200 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>{selectedOrder.merchant_district}, Delhi NCR</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-stone-500 uppercase tracking-wider block mb-1">
                    Fulfillment Destination
                  </span>
                  <div className="flex items-center gap-1.5 text-amber-200 font-medium truncate">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span className="truncate">{selectedOrder.delivery_address}</span>
                  </div>
                </div>
              </div>

              {/* Order Items Table */}
              <div>
                <h4 className="font-serif-lux text-sm font-bold text-white mb-3">
                  Allocated Items in this Order
                </h4>
                <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 truncate">
                        {item.product_image && (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-8 h-8 rounded object-cover bg-stone-900 border border-white/10 flex-shrink-0"
                          />
                        )}
                        <span className="text-white font-medium truncate">{item.product_name}</span>
                        <span className="text-stone-400 font-mono text-[11px]">x{item.quantity}</span>
                      </div>
                      <span className="font-mono text-amber-300 font-bold">
                        ₹{(item.sub_total || item.unit_price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total Row */}
                <div className="pt-4 flex items-center justify-between text-sm">
                  <span className="font-semibold text-stone-300">Amount Payable Upon Delivery</span>
                  <span className="font-serif-lux text-xl font-bold text-amber-300">
                    ₹{selectedOrder.total_amount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Right Col: Active Orders Queue List */}
        <div className="space-y-4">
          <h3 className="font-serif-lux text-lg font-bold text-white">
            Active Orders ({activeOrders.length})
          </h3>

          <div className="space-y-3">
            {activeOrders.map((order) => {
              const isSelected = selectedOrder?.id === order.id;
              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`p-4 rounded-2xl glass-panel glass-panel-hover cursor-pointer border transition-all ${
                    isSelected
                      ? 'border-amber-400 bg-amber-950/20 shadow-lg'
                      : 'border-white/10 hover:border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-serif-lux font-bold text-sm text-white truncate">
                      {order.merchant_name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      {order.status}
                    </span>
                  </div>

                  <p className="text-xs text-stone-400 truncate mb-2">
                    {order.delivery_address}
                  </p>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-white/[0.06]">
                    <span className="font-mono text-amber-300 font-bold">
                      ₹{order.total_amount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

    </section>
  );
}
