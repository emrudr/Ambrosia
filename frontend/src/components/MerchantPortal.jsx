import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Package, 
  Plus, 
  Check, 
  Clock, 
  Truck, 
  CheckCircle2, 
  Sparkles, 
  MapPin, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Wine
} from 'lucide-react';
import { api } from '../api/client';

export default function MerchantPortal({
  merchants,
  selectedMerchant,
  onSelectMerchant,
  onRefreshMerchants,
  districts,
}) {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'inventory', 'onboard'
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [currentMerchantId, setCurrentMerchantId] = useState(
    selectedMerchant?.id || merchants[0]?.id || ''
  );

  // Onboarding form state
  const [onboardForm, setOnboardForm] = useState({
    name: '',
    license_number: '',
    type: 'Bar & Wine Cellar',
    phone_number: '+91 ',
    email: '',
    address_line: '',
    city: 'Delhi',
    district: 'Connaught Place',
    state: 'Delhi',
    pincode: '110001',
    latitude: 28.6289,
    longitude: 77.2195,
    delivery_radius_km: 10.0,
    banner_image_url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1200',
  });

  // Add product form state
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: 'Alcoholic',
    sub_category: 'Single Malt',
    abv: 42.8,
    price: 8500,
    volume_ml: 750,
    image_url: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?q=80&w=800',
    in_stock: true,
  });

  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch orders for current merchant
  const fetchMerchantOrders = async () => {
    if (!currentMerchantId) return;
    setIsLoadingOrders(true);
    try {
      const data = await api.getMerchantOrders(currentMerchantId);
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchMerchantOrders();
  }, [currentMerchantId]);

  // Handle status update
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      setMessage({ type: 'success', text: `Order updated to ${newStatus}` });
      fetchMerchantOrders();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update order status' });
    }
  };

  // Handle Onboard Venue Submit
  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    try {
      const res = await api.registerMerchant(onboardForm);
      setMessage({ type: 'success', text: `Venue "${onboardForm.name}" onboarded successfully!` });
      onRefreshMerchants();
      if (res.merchant) {
        setCurrentMerchantId(res.merchant.id);
        setActiveTab('orders');
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to onboard merchant' });
    }
  };

  // Handle Add Product Submit
  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.addMerchantProduct(currentMerchantId, productForm);
      setMessage({ type: 'success', text: `Added "${productForm.name}" to catalog!` });
      setShowAddProductModal(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to add product' });
    }
  };

  // Update district coordinates in onboard form
  const handleDistrictChange = (districtName) => {
    const matched = districts?.find(d => d.district === districtName);
    if (matched) {
      setOnboardForm(prev => ({
        ...prev,
        district: matched.district,
        city: matched.city,
        state: matched.city === 'Delhi' ? 'Delhi' : 'Uttar Pradesh',
        pincode: matched.pincode,
        latitude: matched.latitude,
        longitude: matched.longitude,
      }));
    } else {
      setOnboardForm(prev => ({ ...prev, district: districtName }));
    }
  };

  const selectedMerchantObj = merchants.find(m => m.id === currentMerchantId) || merchants[0];

  return (
    <section className="py-10 px-4 lg:px-8 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/30 mb-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Store className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
              Merchant Operations Suite
            </span>
          </div>
          <h1 className="font-serif-lux text-2xl sm:text-3xl font-bold text-white mb-2">
            Artisanal Partner Portal
          </h1>
          <p className="text-xs text-stone-400 font-light max-w-xl">
            Manage incoming live orders, configure 10 km delivery bounds, and allocate reserve spirits for on-demand Pay-on-Delivery fulfillment.
          </p>
        </div>

        {/* Venue Selector Dropdown */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-stone-400 block uppercase">Active Venue</span>
            <span className="text-xs font-bold text-amber-200">{selectedMerchantObj?.name}</span>
          </div>

          <select
            value={currentMerchantId}
            onChange={(e) => setCurrentMerchantId(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-black/60 border border-amber-500/30 text-xs font-semibold text-amber-100 focus:outline-none focus:border-amber-400"
          >
            {merchants.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.district})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'orders'
              ? 'gold-gradient-btn shadow-lg'
              : 'bg-white/[0.04] text-stone-300 hover:text-white hover:bg-white/[0.08]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Live Fulfillment Queue ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'inventory'
              ? 'gold-gradient-btn shadow-lg'
              : 'bg-white/[0.04] text-stone-300 hover:text-white hover:bg-white/[0.08]'
          }`}
        >
          <Wine className="w-4 h-4" />
          <span>Catalog & Stock Management</span>
        </button>

        <button
          onClick={() => setActiveTab('onboard')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'onboard'
              ? 'gold-gradient-btn shadow-lg'
              : 'bg-white/[0.04] text-stone-300 hover:text-white hover:bg-white/[0.08]'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Onboard New Venue</span>
        </button>
      </div>

      {/* Alerts */}
      {message.text && (
        <div className={`p-4 rounded-2xl mb-6 text-xs flex items-center justify-between border ${
          message.type === 'success'
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
            : 'bg-red-950/40 border-red-500/40 text-red-200'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ type: '', text: '' })}>✕</button>
        </div>
      )}

      {/* TAB 1: LIVE ORDER QUEUE */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif-lux text-lg font-bold text-white">
              Incoming Orders for {selectedMerchantObj?.name}
            </h3>
            <button
              onClick={fetchMerchantOrders}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs text-stone-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isLoadingOrders ? 'animate-spin' : ''}`} />
              <span>Refresh Queue</span>
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="glass-panel p-10 rounded-2xl text-center text-stone-400">
              <Package className="w-10 h-10 mx-auto mb-2 text-stone-500" />
              <p className="text-sm font-semibold text-white">No incoming orders in this queue</p>
              <p className="text-xs text-stone-400 mt-1">
                New buyer checkouts within 10 km will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="glass-panel p-5 rounded-2xl border border-amber-500/20 shadow-xl space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-amber-400 block">
                        Order #{order.id.slice(0, 8)}
                      </span>
                      <span className="text-xs text-stone-400">
                        {new Date(order.created_at).toLocaleString()}
                      </span>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      {order.status}
                    </span>
                  </div>

                  {/* Destination */}
                  <div className="text-xs text-stone-300">
                    <span className="text-stone-400 text-[10px] uppercase block">Delivery Address</span>
                    <p className="font-medium text-amber-100">{order.delivery_address}</p>
                  </div>

                  {/* Items */}
                  <div className="space-y-1.5 py-2 border-y border-white/[0.06]">
                    {order.items?.map((it) => (
                      <div key={it.id} className="flex justify-between text-xs">
                        <span className="text-stone-200">
                          {it.product_name} <strong className="text-amber-400">x{it.quantity}</strong>
                        </span>
                        <span className="font-mono text-amber-300">
                          ₹{(it.sub_total || it.unit_price * it.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total & Action Stepper Buttons */}
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <span className="text-[10px] text-stone-400 block">Pay on Delivery Total</span>
                      <span className="font-serif-lux text-base font-bold text-amber-300">
                        ₹{order.total_amount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.status === 'RECEIVED' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'PREPARING')}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-400/40 text-xs font-bold"
                        >
                          Start Preparing
                        </button>
                      )}

                      {order.status === 'PREPARING' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'OUT_FOR_DELIVERY')}
                          className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 border border-blue-400/40 text-xs font-bold flex items-center gap-1"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Dispatch Courier</span>
                        </button>
                      )}

                      {order.status === 'OUT_FOR_DELIVERY' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'DELIVERED')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-400/40 text-xs font-bold flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Delivered & Settled</span>
                        </button>
                      )}

                      {order.status === 'DELIVERED' && (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Completed
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INVENTORY & CATALOG MANAGEMENT */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif-lux text-lg font-bold text-white">
                Catalog for {selectedMerchantObj?.name}
              </h3>
              <p className="text-xs text-stone-400">Manage beverage allocations and stock status</p>
            </div>

            <button
              onClick={() => setShowAddProductModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient-btn text-xs font-bold shadow-lg"
            >
              <Plus className="w-4 h-4 text-black" />
              <span>Add New Beverage</span>
            </button>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <p className="text-xs text-stone-300 mb-4 font-light">
              All drinks added to this venue are dynamically filtered by the <strong className="text-amber-300">10 km Haversine Radius</strong> and <strong className="text-amber-300">18+ Age Gating</strong> policy.
            </p>

            <button
              onClick={() => setShowAddProductModal(true)}
              className="w-full py-8 border-2 border-dashed border-amber-500/30 rounded-xl hover:border-amber-400 hover:bg-amber-500/[0.03] text-amber-300 text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-6 h-6" />
              <span>Click to Add a New Single Malt, Artisanal Gin, or Botanical Elixir</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: ONBOARD NEW VENUE FORM */}
      {activeTab === 'onboard' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/30 shadow-2xl max-w-3xl mx-auto">
          <div className="mb-6 pb-4 border-b border-white/10">
            <h3 className="font-serif-lux text-xl font-bold text-white mb-1">
              Onboard a New Luxury Venue / Cellar
            </h3>
            <p className="text-xs text-stone-400 font-light">
              Register your Bar, Microbrewery, Wine Cellar, or Lounge in Delhi NCR for 10 km radius fulfillment.
            </p>
          </div>

          <form onSubmit={handleOnboardSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-stone-300 mb-1 font-semibold">Venue Name</label>
                <input
                  type="text"
                  placeholder="e.g. The Imperial Cellar & Bar"
                  value={onboardForm.name}
                  onChange={(e) => setOnboardForm({ ...onboardForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-amber-100 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-300 mb-1 font-semibold">Excise License Number</label>
                <input
                  type="text"
                  placeholder="e.g. DL-EXC-2026-9901"
                  value={onboardForm.license_number}
                  onChange={(e) => setOnboardForm({ ...onboardForm, license_number: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-amber-100 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-stone-300 mb-1 font-semibold">Venue Type</label>
                <select
                  value={onboardForm.type}
                  onChange={(e) => setOnboardForm({ ...onboardForm, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-amber-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="Bar & Wine Cellar">Bar & Wine Cellar</option>
                  <option value="Microbrewery & Spirits">Microbrewery & Spirits</option>
                  <option value="Wine Cellar">Wine Cellar</option>
                  <option value="Soft Beverage Lounge & Mocktails">Soft Beverage Lounge</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-300 mb-1 font-semibold">Contact Email</label>
                <input
                  type="email"
                  placeholder="sommelier@venue.in"
                  value={onboardForm.email}
                  onChange={(e) => setOnboardForm({ ...onboardForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-amber-100 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-300 mb-1 font-semibold">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 11 4150 ..."
                  value={onboardForm.phone_number}
                  onChange={(e) => setOnboardForm({ ...onboardForm, phone_number: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-amber-100 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
            </div>

            {/* Address & District Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-stone-300 mb-1 font-semibold">District</label>
                <select
                  value={onboardForm.district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-amber-100 focus:outline-none focus:border-amber-400"
                >
                  {districts?.map((d) => (
                    <option key={d.district} value={d.district}>
                      {d.district} ({d.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-300 mb-1 font-semibold">City</label>
                <input
                  type="text"
                  value={onboardForm.city}
                  onChange={(e) => setOnboardForm({ ...onboardForm, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-amber-100 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-300 mb-1 font-semibold">Delivery Radius (km)</label>
                <input
                  type="number"
                  step="0.5"
                  value={onboardForm.delivery_radius_km}
                  onChange={(e) => setOnboardForm({ ...onboardForm, delivery_radius_km: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-amber-100 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-stone-300 mb-1 font-semibold">Full Address</label>
              <textarea
                rows={2}
                placeholder="Janpath Lane, Connaught Place, New Delhi..."
                value={onboardForm.address_line}
                onChange={(e) => setOnboardForm({ ...onboardForm, address_line: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-amber-100 focus:outline-none resize-none"
                required
              />
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-stone-400 text-[11px] mb-0.5">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={onboardForm.latitude}
                  onChange={(e) => setOnboardForm({ ...onboardForm, latitude: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-amber-100 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-stone-400 text-[11px] mb-0.5">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={onboardForm.longitude}
                  onChange={(e) => setOnboardForm({ ...onboardForm, longitude: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-amber-100 font-mono"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full gold-gradient-btn py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs shadow-xl hover:shadow-amber-500/25 mt-4"
            >
              Complete Venue Onboarding
            </button>
          </form>
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg glass-panel p-6 rounded-3xl border border-amber-500/30">
            <h3 className="font-serif-lux text-xl font-bold text-white mb-4">
              Add New Beverage to Catalog
            </h3>

            <form onSubmit={handleAddProductSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-300 mb-1 font-semibold">Beverage Name</label>
                <input
                  type="text"
                  placeholder="e.g. Balvenie 21 PortWood Single Malt"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-amber-100 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 mb-1 font-semibold">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-amber-100 focus:outline-none"
                  >
                    <option value="Alcoholic">Alcoholic</option>
                    <option value="Non-Alcoholic">Non-Alcoholic</option>
                    <option value="Mixer">Mixer</option>
                    <option value="Gourmet Soda">Gourmet Soda</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-300 mb-1 font-semibold">Sub-Category</label>
                  <input
                    type="text"
                    placeholder="Single Malt, Gin, Tonic..."
                    value={productForm.sub_category}
                    onChange={(e) => setProductForm({ ...productForm, sub_category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-amber-100 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-300 mb-1 font-semibold">ABV (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={productForm.abv}
                    onChange={(e) => setProductForm({ ...productForm, abv: parseFloat(e.target.value) || 0.0 })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-amber-100 focus:outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-stone-300 mb-1 font-semibold">Price (₹)</label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-amber-100 focus:outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-stone-300 mb-1 font-semibold">Volume (ml)</label>
                  <input
                    type="number"
                    value={productForm.volume_ml}
                    onChange={(e) => setProductForm({ ...productForm, volume_ml: parseInt(e.target.value, 10) || 750 })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-amber-100 focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-300 mb-1 font-semibold">Image URL (Unsplash / AWS S3 Asset)</label>
                <input
                  type="url"
                  value={productForm.image_url}
                  onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-amber-100 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-300 mb-1 font-semibold">Sommelier Notes & Description</label>
                <textarea
                  rows={2}
                  placeholder="Notes of honey, toasted oak, citrus zest..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-amber-100 focus:outline-none resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-stone-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gold-gradient-btn px-5 py-2 rounded-xl font-bold"
                >
                  Save Drink Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
}
