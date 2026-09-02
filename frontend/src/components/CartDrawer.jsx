import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ShieldCheck, 
  MapPin, 
  Truck, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import DrinkBadge from './DrinkBadge';

export default function CartDrawer({
  isOpen,
  onClose,
  cart = [],
  onUpdateQuantity,
  onRemoveItem,
  userLocation = { district: 'Connaught Place', city: 'Delhi', latitude: 28.6289, longitude: 77.2195 },
  user = null,
  onCheckout,
  isSubmitting = false,
}) {
  const [deliveryAddress, setDeliveryAddress] = useState(
    user?.address_line || `${userLocation.district || 'Connaught Place'}, ${userLocation.city || 'Delhi'}`
  );
  const [guestName, setGuestName] = useState(user?.full_name || '');
  const [guestPhone, setGuestPhone] = useState(user?.phone_number || '');
  const [guestAge, setGuestAge] = useState(user?.age || 21);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Derive dominant merchant
  const primaryMerchantId = cart[0]?.merchant_id;
  const primaryMerchantName = cart[0]?.merchant_name;
  const primaryMerchantDistance = cart[0]?.distance_km;

  const handleCheckoutSubmit = async (e) => {
    e?.preventDefault?.();
    setErrorMsg('');

    if (cart.length === 0) {
      setErrorMsg('Cart is empty.');
      return;
    }

    if (!deliveryAddress.trim()) {
      setErrorMsg('Please provide a complete delivery address.');
      return;
    }

    // Verify all items belong to single merchant
    const hasDifferentMerchant = cart.some(item => item.merchant_id !== primaryMerchantId);
    if (hasDifferentMerchant) {
      setErrorMsg('Hyper-local order policy: All items must be ordered from a single licensed venue.');
      return;
    }

    // Prepare payload
    const orderPayload = {
      merchant_id: primaryMerchantId,
      items: cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
      })),
      delivery_address: deliveryAddress.trim(),
      user_latitude: userLocation.latitude,
      user_longitude: userLocation.longitude,
      payment_method: 'PAY_ON_DELIVERY',
      user_age: user ? user.age : parseInt(guestAge, 10),
      guest_name: guestName.trim() || undefined,
      guest_phone: guestPhone.trim() || undefined,
    };

    try {
      await onCheckout(orderPayload);
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Checkout failed. Please check radius or legal age.';
      setErrorMsg(detail);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm transition-opacity">
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md glass-panel border-l border-[#d4af37]/30 flex flex-col justify-between shadow-2xl animate-slideIn">
          
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-[#d4af37]/40 flex items-center justify-center text-amber-300">
                <ShoppingBag className="w-4 h-4 text-[#d4af37]" />
              </div>
              <div>
                <h2 className="font-serif-lux text-lg font-bold text-white tracking-wide">
                  Cellar Allocation Cart
                </h2>
                <span className="text-[11px] text-stone-400">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'} selected
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-stone-300 hover:text-white flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-stone-500 mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-serif-lux text-base font-bold text-stone-300 mb-1">
                  Your Vault is Empty
                </h3>
                <p className="text-xs text-stone-400 max-w-xs mb-6 font-light">
                  Explore our curated single malts, boutique gins, and zero-proof botanical elixirs.
                </p>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl gold-gradient-btn text-xs font-bold"
                >
                  Explore Catalog
                </button>
              </div>
            ) : (
              <>
                {/* Merchant Venue Badge */}
                {primaryMerchantName && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-[#d4af37]/25 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span className="font-medium text-amber-200 truncate">{primaryMerchantName}</span>
                    </div>
                    {primaryMerchantDistance !== null && primaryMerchantDistance !== undefined && (
                      <span className="px-2 py-0.5 rounded bg-black/60 font-bold text-[10px] text-[#d4af37] border border-[#d4af37]/30">
                        {primaryMerchantDistance} km away (&le; 10 km bound)
                      </span>
                    )}
                  </div>
                )}

                {/* Items - Pure SVG DrinkBadge, ZERO <img> tags */}
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3"
                    >
                      {/* Pure SVG Illuminated Miniature Badge (NO <img>) */}
                      <DrinkBadge
                        category={item.category}
                        subCategory={item.sub_category}
                        abv={item.abv}
                        size="sm"
                        className="flex-shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif-lux font-bold text-xs text-white truncate">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-stone-400 mb-1">
                          <span className="text-amber-300 font-bold">₹{Number(item.price).toLocaleString('en-IN')}</span>
                          <span>•</span>
                          <span>{item.volume_ml} ml</span>
                          <span>•</span>
                          <span className={item.abv > 0 ? 'text-amber-400 font-medium' : 'text-emerald-400 font-medium'}>
                            {item.abv > 0 ? `${item.abv}% ABV` : '0.0%'}
                          </span>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="w-5 h-5 rounded bg-white/[0.08] hover:bg-white/[0.15] text-stone-300 flex items-center justify-center text-xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-mono font-bold text-white px-1.5">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="w-5 h-5 rounded bg-white/[0.08] hover:bg-white/[0.15] text-stone-300 flex items-center justify-center text-xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Remove item */}
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1.5 text-stone-500 hover:text-red-400 transition-colors"
                        title="Remove allocation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Delivery Form */}
                <form onSubmit={handleCheckoutSubmit} className="pt-3 border-t border-white/10 space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-300 mb-1 flex items-center gap-1">
                      <Truck className="w-3 h-3 text-[#d4af37]" />
                      <span>Delivery Address (Within 10 km Radius)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Enter flat / house number, street, landmark, district..."
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 focus:border-[#d4af37]/50 text-xs text-amber-100 placeholder:text-stone-600 focus:outline-none resize-none"
                      required
                    />
                  </div>

                  {!user && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-stone-400 mb-0.5">Contact Name</label>
                        <input
                          type="text"
                          placeholder="Your Name"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-amber-100 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone-400 mb-0.5">Phone Number</label>
                        <input
                          type="tel"
                          placeholder="+91 98..."
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-amber-100 focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-start gap-1.5">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}
                </form>
              </>
            )}
          </div>

          {/* Footer & Checkout Action */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-white/10 bg-black/60 space-y-3">
              
              {/* Price Breakdown */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-stone-400">
                  <span>Subtotal</span>
                  <span className="font-mono text-stone-200">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span className="flex items-center gap-1">
                    <span>Chilled White-Glove Transit</span>
                    <span className="text-[10px] text-[#d4af37]/80">(Within 10 km)</span>
                  </span>
                  <span className="text-emerald-400 font-bold uppercase tracking-wider text-[11px]">Complimentary</span>
                </div>
                <div className="flex justify-between text-white font-bold pt-2 border-t border-white/[0.08] text-sm">
                  <span className="font-serif-lux">Pay on Arrival Total</span>
                  <span className="font-serif-lux text-amber-300 text-base">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Pay on Delivery Badge */}
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-[#d4af37]/25 flex items-center justify-between text-xs text-amber-200">
                <span className="flex items-center gap-1.5 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
                  <span>Payment Method:</span>
                </span>
                <span className="font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/60 text-[10px] text-[#d4af37] border border-[#d4af37]/40">
                  Pay on Delivery
                </span>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckoutSubmit}
                disabled={isSubmitting}
                className="w-full gold-gradient-btn py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl hover:shadow-amber-500/25 disabled:opacity-50 transition-all"
              >
                <Sparkles className="w-4 h-4 text-black" />
                <span>{isSubmitting ? 'Confirming Vault Allocation...' : 'Place Pay-on-Delivery Order'}</span>
              </button>

              <p className="text-[10px] text-stone-500 text-center">
                Strict age verification conducted upon door delivery.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
