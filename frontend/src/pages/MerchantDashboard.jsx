import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Store,
  Clock,
  PackageCheck,
  Truck,
  Sparkles,
  MapPin,
  Compass,
  DollarSign,
  Layers,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
} from 'lucide-react';
import StatusStepper from '../components/StatusStepper';
import DrinkBadge from '../components/DrinkBadge';
import { orderService, productService, merchantService } from '../services/api';

export default function MerchantDashboard() {
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'inventory' | 'settings'
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(null);

  // Load merchant session
  useEffect(() => {
    const raw = localStorage.getItem('ambrosia_merchant');
    if (raw) {
      try {
        setMerchant(JSON.parse(raw));
      } catch (e) {
        console.error('Failed to parse merchant:', e);
      }
    } else {
      // If no stored merchant, offer demo Imperial Cellar
      setMerchant({
        id: 'merchant-demo',
        name: 'The Imperial Cellar & Bar',
        district: 'Connaught Place',
        city: 'Delhi',
        license_number: 'DL-EXC-2024-00101',
        latitude: 28.6289,
        longitude: 77.2195,
      });
    }
  }, []);

  const loadData = async () => {
    if (!merchant) return;
    setIsLoading(true);
    setErrorMsg('');

    try {
      // 1. Load orders
      const oRes = await orderService.getMyOrders();
      setOrders(oRes.data || []);

      // 2. Load merchant inventory
      const pRes = await productService.getProducts({
        lat: merchant.latitude,
        lng: merchant.longitude,
        only_within_radius: false,
      });
      setProducts(pRes.data || []);
    } catch (err) {
      console.error('Merchant dashboard load error:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to refresh merchant telemetry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (merchant) {
      loadData();
    }
  }, [merchant]);

  // Advance Order Status Trigger
  const handleAdvanceStatus = async (orderId, nextStatus) => {
    setStatusUpdating(orderId);
    try {
      await orderService.updateStatus(orderId, nextStatus);
      await loadData();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert(err.response?.data?.detail || 'Status update failed.');
    } finally {
      setStatusUpdating(null);
    }
  };

  // Toggle Product In-Stock
  const handleToggleStock = async (productId, currentStock) => {
    if (!merchant || !merchant.id) return;
    try {
      await productService.updateStock(merchant.id, productId, !currentStock);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, in_stock: !currentStock } : p))
      );
    } catch (err) {
      console.error('Stock toggle failed:', err);
      alert('Could not update inventory state.');
    }
  };

  const activeOrders = orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  const completedOrders = orders.filter((o) => o.status === 'DELIVERED');
  const totalRevenue = orders
    .filter((o) => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  return (
    <div className="min-h-screen bg-[#070709] text-stone-100 pb-24">
      {/* Top Banner */}
      <div className="border-b border-[#d4af37]/20 bg-stone-950/90 backdrop-blur-md px-4 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.2)]">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif-lux text-xl sm:text-2xl font-bold text-white">
                  {merchant?.name || 'Licensed Venue Operations'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-[#d4af37] text-[10px] font-bold border border-[#d4af37]/30">
                  Active Partner
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5 flex items-center gap-2">
                <span>License: {merchant?.license_number || 'DL-EXC-VERIFIED'}</span>
                <span>•</span>
                <span>
                  {merchant?.district}, {merchant?.city}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-stone-300 flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Sync Queue</span>
            </button>
            <Link
              to="/marketplace"
              className="px-4 py-2 rounded-xl gold-gradient-btn text-xs font-bold uppercase tracking-wider shadow-lg"
            >
              Public Feed
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-8 space-y-8">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl glass-panel border border-[#d4af37]/20 flex items-center justify-between">
            <div>
              <span className="text-xs text-stone-400 uppercase tracking-wider block">
                Active Corridor Dispatches
              </span>
              <span className="font-serif-lux text-2xl sm:text-3xl font-bold text-white mt-1 block">
                {activeOrders.length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
              <Truck className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-[#d4af37]/20 flex items-center justify-between">
            <div>
              <span className="text-xs text-stone-400 uppercase tracking-wider block">
                Completed Deliveries
              </span>
              <span className="font-serif-lux text-2xl sm:text-3xl font-bold text-emerald-400 mt-1 block">
                {completedOrders.length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-[#d4af37]/20 flex items-center justify-between">
            <div>
              <span className="text-xs text-stone-400 uppercase tracking-wider block">
                Gross Collected (POD)
              </span>
              <span className="font-serif-lux text-2xl sm:text-3xl font-bold text-[#d4af37] mt-1 block">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'orders'
                ? 'bg-[#d4af37] text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Fulfillment Queue ({activeOrders.length})
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'inventory'
                ? 'bg-[#d4af37] text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Cellar Inventory ({products.length})
          </button>
        </div>

        {/* Tab 1: Orders Queue with Status Stepper Advance Trigger */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {activeOrders.length === 0 ? (
              <div className="p-12 rounded-3xl glass-panel border border-white/10 text-center max-w-lg mx-auto">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h3 className="font-serif-lux text-lg font-bold text-white">Queue Clear</h3>
                <p className="text-xs text-stone-400 mt-1">
                  All active orders within your 10 km corridor have been fulfilled.
                </p>
              </div>
            ) : (
              activeOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-6 rounded-3xl glass-panel border border-[#d4af37]/30 shadow-2xl space-y-6"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
                    <div>
                      <span className="text-[10px] font-mono text-[#d4af37] uppercase">
                        Ticket #{order.id.slice(0, 8)}
                      </span>
                      <h3 className="font-serif-lux text-base font-bold text-white">
                        Delivery to {order.delivery_address}
                      </h3>
                      <p className="text-xs text-stone-400 mt-0.5">
                        POD Collection: <span className="text-[#d4af37] font-bold">₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
                      </p>
                    </div>

                    <div className="px-3 py-1 rounded-full bg-amber-500/20 text-[#d4af37] text-xs font-mono font-bold border border-[#d4af37]/40">
                      Current State: {order.status}
                    </div>
                  </div>

                  {/* Status Stepper with Active Advance Handler */}
                  <StatusStepper
                    currentStatus={order.status}
                    onAdvance={(next) => handleAdvanceStatus(order.id, next)}
                    isMerchant={true}
                  />

                  {/* Items List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-black/40 border border-white/[0.06] flex items-center gap-2.5"
                      >
                        <DrinkBadge
                          category={item.product_category || 'Alcoholic'}
                          subCategory=""
                          abv={item.product_abv || 0}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">
                            {item.product_name}
                          </p>
                          <p className="text-[10px] text-stone-400">
                            Qty: {item.quantity} • ₹{Number(item.unit_price).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Cellar Inventory & Stock Control */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-400">
                Manage stock availability for hyper-local browsing
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="p-4 rounded-2xl glass-panel border border-white/10 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <DrinkBadge
                      category={prod.category}
                      subCategory={prod.sub_category}
                      abv={prod.abv}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate font-serif-lux">
                        {prod.name}
                      </h4>
                      <p className="text-[10px] text-stone-400">
                        ₹{Number(prod.price).toLocaleString('en-IN')} • {prod.volume_ml}ml • {prod.abv}% ABV
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleStock(prod.id, prod.in_stock)}
                    className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      prod.in_stock
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-red-500/20 text-red-300 border border-red-500/40'
                    }`}
                  >
                    {prod.in_stock ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-400" />
                        <span>In Stock</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-red-400" />
                        <span>Unavailable</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
