import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import DistrictModal from './components/DistrictModal';
import LandingPage from './pages/LandingPage';
import MarketplacePage from './pages/MarketplacePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import MerchantOnboard from './pages/MerchantOnboard';
import MerchantDashboard from './pages/MerchantDashboard';
import { systemService, orderService } from './services/api';
import confetti from 'canvas-confetti';

function AppContent() {
  // User & Location State
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ambrosia_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [userLocation, setUserLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('ambrosia_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u.latitude && u.longitude) {
          return {
            city: u.city || 'Delhi',
            district: u.district || 'Connaught Place',
            latitude: u.latitude,
            longitude: u.longitude,
            pincode: u.pincode || '110001',
          };
        }
      }
    } catch (e) {}
    return {
      city: 'Delhi',
      district: 'Connaught Place',
      latitude: 28.6289,
      longitude: 77.2195,
      pincode: '110001',
    };
  });

  // Age Mode: Defaults to 28 (adult), can toggle to 17 (underage zero-proof)
  const [ageMode, setAgeMode] = useState(() => {
    if (user && user.age) return user.age;
    return 28;
  });

  // Cart State (Persisted in localStorage)
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('ambrosia_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem('ambrosia_cart', JSON.stringify(cart));
  }, [cart]);

  // Load districts
  useEffect(() => {
    async function loadDistricts() {
      try {
        const res = await systemService.getDistricts();
        setDistricts(res.data || []);
      } catch (err) {
        console.error('Failed to load districts:', err);
      }
    }
    loadDistricts();
  }, []);

  // Poll or check active orders count if user logged in
  useEffect(() => {
    async function checkOrders() {
      if (localStorage.getItem('ambrosia_token')) {
        try {
          const res = await orderService.getMyOrders();
          const active = (res.data || []).filter(
            (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
          );
          setActiveOrdersCount(active.length);
        } catch (e) {}
      }
    }
    checkOrders();
  }, [user]);

  // Geolocation Auto-Detection with Backend Fallback
  const handleDetectGPS = async () => {
    setIsDetectingGPS(true);

    const fallbackBackend = async () => {
      try {
        const res = await systemService.autoDetectGps(userLocation.district);
        if (res.data && res.data.latitude && res.data.longitude) {
          setUserLocation((prev) => ({
            ...prev,
            district: res.data.district || 'Connaught Place',
            city: res.data.city || 'Delhi',
            latitude: parseFloat(res.data.latitude),
            longitude: parseFloat(res.data.longitude),
            pincode: res.data.pincode || '110001',
          }));
        }
      } catch (e) {
        console.error('Backend GPS auto-detect fallback failed:', e);
      } finally {
        setIsDetectingGPS(false);
      }
    };

    if (navigator.geolocation && (window.isSecureContext || window.location.hostname === 'localhost')) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          setIsDetectingGPS(false);
          const lat = parseFloat(pos.coords.latitude.toFixed(4));
          const lng = parseFloat(pos.coords.longitude.toFixed(4));
          try {
            const cRes = await systemService.getClosestDistrict(lat, lng);
            const d = cRes.data;
            setUserLocation((prev) => ({
              ...prev,
              district: d?.district || 'Live GPS Pin',
              city: d?.city || 'Delhi NCR',
              latitude: lat,
              longitude: lng,
              pincode: d?.pincode || prev.pincode,
            }));
          } catch (e) {
            setUserLocation((prev) => ({
              ...prev,
              district: 'Live GPS Pin',
              city: 'Delhi NCR',
              latitude: lat,
              longitude: lng,
            }));
          }
        },
        async () => {
          await fallbackBackend();
        },
        { timeout: 6000 }
      );
    } else {
      await fallbackBackend();
    }
  };

  // Toggle Age Mode
  const handleToggleAgeMode = () => {
    if (user) {
      alert(`Authenticated as ${user.full_name}, age verified as ${user.age}. To explore underage mode, sign out.`);
      return;
    }
    setAgeMode((prev) => (prev >= 18 ? 17 : 28));
  };

  // Cart Operations
  const handleAddToCart = (product) => {
    setCart((prev) => {
      // Check if product belongs to same merchant
      if (prev.length > 0 && prev[0].merchant_id !== product.merchant_id) {
        const confirmClear = window.confirm(
          `Your cart contains allocations from "${prev[0].merchant_name || 'another venue'}". Ambrosia hyper-local policy delivers from one venue per order. Replace cart items with this selection?`
        );
        if (!confirmClear) return prev;
        return [{ ...product, quantity: 1 }];
      }

      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        return [...prev, { ...product, quantity: 1 }];
      }
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.id === productId ? { ...i, quantity: newQty } : i))
    );
  };

  const handleRemoveItem = (productId) => {
    setCart((prev) => prev.filter((i) => i.id !== productId));
  };

  // Checkout execution
  const handleCheckout = async (orderPayload) => {
    const res = await orderService.createOrder(orderPayload);
    setCart([]);
    setIsCartOpen(false);
    setActiveOrdersCount((prev) => prev + 1);

    // Luxury Champagne Gold Confetti Celebration
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#d4af37', '#f3e5ab', '#e09f3e', '#ffffff'],
    });

    alert(`🍾 Order Confirmed! Ticket #${res.data.id.slice(0, 8)} dispatched for Pay-on-Delivery.`);
  };

  // Auth callbacks
  const handleAuthSuccess = (data) => {
    if (data.user) {
      setUser(data.user);
      setAgeMode(data.user.age);
      if (data.user.latitude && data.user.longitude) {
        setUserLocation({
          city: data.user.city || 'Delhi',
          district: data.user.district || 'Connaught Place',
          latitude: data.user.latitude,
          longitude: data.user.longitude,
          pincode: data.user.pincode || '110001',
        });
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ambrosia_token');
    localStorage.removeItem('ambrosia_user');
    localStorage.removeItem('ambrosia_merchant');
    setUser(null);
    setAgeMode(28);
    setActiveOrdersCount(0);
  };

  return (
    <div className="min-h-screen bg-[#070709] text-stone-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Universal Top Navigation */}
      <Navbar
        location={userLocation}
        onOpenLocationModal={() => setIsLocationOpen(true)}
        ageMode={user ? user.age : ageMode}
        onToggleAgeMode={handleToggleAgeMode}
        cart={cart}
        onOpenCart={() => setIsCartOpen(true)}
        user={user}
        onLogout={handleLogout}
        activeOrdersCount={activeOrdersCount}
      />

      {/* Primary Routing Engine */}
      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <LandingPage
                userLocation={userLocation}
                onOpenLocationModal={() => setIsLocationOpen(true)}
                ageMode={user ? user.age : ageMode}
                onToggleAgeMode={handleToggleAgeMode}
              />
            }
          />
          <Route
            path="/marketplace"
            element={
              <MarketplacePage
                userLocation={userLocation}
                onOpenLocationModal={() => setIsLocationOpen(true)}
                ageMode={user ? user.age : ageMode}
                onAddToCart={handleAddToCart}
                cart={cart}
              />
            }
          />
          <Route
            path="/login"
            element={<LoginPage onLoginSuccess={handleAuthSuccess} />}
          />
          <Route
            path="/register"
            element={<RegisterPage onRegisterSuccess={handleAuthSuccess} />}
          />
          <Route
            path="/orders"
            element={<OrderHistoryPage user={user} />}
          />
          <Route
            path="/merchant/onboard"
            element={<MerchantOnboard />}
          />
          <Route
            path="/merchant/dashboard"
            element={<MerchantDashboard />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global Slide-Over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        userLocation={userLocation}
        user={user}
        onCheckout={handleCheckout}
      />

      {/* Global District / Location Modal */}
      <DistrictModal
        isOpen={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
        districts={districts}
        currentLocation={userLocation}
        onSelectDistrict={(d) => {
          setUserLocation({
            city: d.city,
            district: d.district,
            latitude: d.latitude,
            longitude: d.longitude,
            pincode: d.pincode,
          });
        }}
        onDetectGPS={handleDetectGPS}
        isDetectingGPS={isDetectingGPS}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
