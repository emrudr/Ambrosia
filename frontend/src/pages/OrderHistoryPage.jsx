import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  PackageCheck,
  ShoppingBag,
  MapPin,
  Truck,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import StatusStepper from '../components/StatusStepper';
import DrinkBadge from '../components/DrinkBadge';
import { orderService } from '../services/api';

export default function OrderHistoryPage({ user }) {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await orderService.getMyOrders();
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
      // Fallback: If not authenticated, inform user
      if (err.response?.status === 401) {
        setErrorMsg('Please sign in to view your live orders and historical tickets.');
      } else {
        setErrorMsg(err.response?.data?.detail || 'Failed to fetch order history.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleAdvanceStatus = async (orderId, nextStatus) => {
    try {
      await orderService.updateStatus(orderId, nextStatus);
      // Reload orders to reflect updated status
      loadOrders();
    } catch (err) {
      console.error('Failed to advance order status:', err);
      alert(err.response?.data?.detail || 'Failed to advance status.');
    }
  };

  const activeOrders = orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  const pastOrders = orders.filter((o) => o.status === 'DELIVERED' || o.status === 'CANCELLED');

  return (
    <div className="min-h-screen bg-[#070709] text-stone-100 pb-24">
      {/* Page Header */}
      <div className="border-b border-[#d4af37]/20 bg-stone-950/80 backdrop-blur-md px-4 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#d4af37] font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Chilled Transit Tracking</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-serif-lux mt-1">
              Order Vault & Dispatches
            </h1>
          </div>

          <Link
            to="/marketplace"
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl gold-gradient-btn text-xs font-bold uppercase tracking-wider shadow-lg"
          >
            <span>New Allocation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 lg:px-8 pt-8 space-y-10">
        
        {/* Error notification if unauthenticated */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-[#d4af37]/30 text-amber-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <Link
              to="/login"
              className="px-3 py-1 rounded-lg bg-[#d4af37] text-stone-950 font-bold text-xs"
            >
              Sign In
            </Link>
          </div>
        )}

        {/* Active Orders Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white font-serif-lux flex items-center gap-2">
              <span>Active Orders In-Transit</span>
              {activeOrders.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[#d4af37] text-xs font-mono font-bold border border-[#d4af37]/40">
                  {activeOrders.length}
                </span>
              )}
            </h2>
            <button
              onClick={loadOrders}
              className="text-xs text-stone-400 hover:text-amber-200 transition-colors"
            >
              Refresh Status
            </button>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-stone-400 text-xs">
              Synchronizing with venue dispatch queues...
            </div>
          ) : activeOrders.length === 0 ? (
            <div className="p-8 rounded-3xl glass-panel border border-white/10 text-center">
              <PackageCheck className="w-10 h-10 text-stone-600 mx-auto mb-3" />
              <p className="text-sm text-stone-300 font-serif-lux font-semibold">
                No active dispatches currently en-route
              </p>
              <p className="text-xs text-stone-500 mt-1 mb-4 font-light">
                Orders placed will display real-time cellar preparation and courier progress here.
              </p>
              <Link
                to="/marketplace"
                className="inline-flex px-4 py-2 rounded-xl gold-gradient-btn text-xs font-bold uppercase tracking-wider"
              >
                Browse Cellar
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {activeOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-6 rounded-3xl glass-panel border border-[#d4af37]/30 shadow-2xl space-y-6"
                >
                  {/* Order Top Meta */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
                    <div>
                      <span className="text-[10px] font-mono text-[#d4af37] uppercase tracking-wider">
                        Order #{order.id.slice(0, 8)}
                      </span>
                      <h3 className="font-serif-lux text-base font-bold text-white">
                        {order.merchant_name || 'Licensed Venue'}
                      </h3>
                      <p className="text-xs text-stone-400 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>{order.delivery_address}</span>
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-stone-400 uppercase block">
                        Payment on Arrival
                      </span>
                      <span className="font-serif-lux text-lg font-bold text-amber-300">
                        ₹{Number(order.total_amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* 4-Stage Visual Progress Stepper */}
                  <StatusStepper
                    currentStatus={order.status}
                    onAdvance={(next) => handleAdvanceStatus(order.id, next)}
                    isMerchant={false}
                  />

                  {/* Itemized breakdown (NO <img>) */}
                  <div className="pt-2">
                    <span className="text-xs font-semibold text-stone-300 block mb-3">
                      Allocated Items ({order.items?.length || 0})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {order.items?.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-2xl bg-black/40 border border-white/[0.06] flex items-center gap-3"
                        >
                          <DrinkBadge
                            category={item.product_category || 'Alcoholic'}
                            subCategory=""
                            abv={item.product_abv || 0}
                            size="sm"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">
                              {item.product_name}
                            </p>
                            <p className="text-[10px] text-stone-400">
                              Qty: {item.quantity} • ₹{Number(item.unit_price).toLocaleString('en-IN')} each
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Orders Archive */}
        {pastOrders.length > 0 && (
          <div className="pt-8 border-t border-stone-800">
            <h2 className="text-lg font-bold text-white font-serif-lux mb-4">
              Historical Allocations Archive
            </h2>

            <div className="space-y-4">
              {pastOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-5 rounded-2xl glass-panel border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-stone-400">
                        #{order.id.slice(0, 8)}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {order.status}
                      </span>
                    </div>
                    <h4 className="font-serif-lux font-bold text-sm text-white">
                      {order.merchant_name || 'Licensed Venue'}
                    </h4>
                    <p className="text-xs text-stone-400">
                      {order.delivery_address}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="font-serif-lux text-base font-bold text-stone-200 block">
                      ₹{Number(order.total_amount).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-stone-500">
                      Pay-on-Delivery Collected
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
