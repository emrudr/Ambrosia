import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Store,
  Sparkles,
  ShieldCheck,
  MapPin,
  Compass,
  Phone,
  Mail,
  Lock,
  Award,
  AlertCircle,
} from 'lucide-react';
import { merchantService, systemService } from '../services/api';

const VENUE_TYPES = [
  'Wine Cellar & Bar',
  'Microbrewery & Spirits',
  'Bar & Lounge',
  'Artisanal Speakeasy',
  'Soft Beverage Lounge & Spirits',
  'Wine Cellar',
  'Microbrewery',
];

export default function MerchantOnboard() {
  const navigate = useNavigate();
  const [districts, setDistricts] = useState([]);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    license_number: '',
    type: 'Wine Cellar & Bar',
    phone_number: '',
    email: '',
    password: '',
    address_line: '',
    city: 'Delhi',
    district: 'Connaught Place',
    state: 'Delhi',
    pincode: '110001',
    latitude: 28.6289,
    longitude: 77.2195,
    delivery_radius_km: 10.0,
  });

  useEffect(() => {
    async function loadDistricts() {
      try {
        const res = await systemService.getDistricts();
        setDistricts(res.data);
      } catch (err) {
        console.error('Failed to load districts:', err);
      }
    }
    loadDistricts();
  }, []);

  const handleDistrictChange = (e) => {
    const selectedDistrict = e.target.value;
    const match = districts.find((d) => d.district === selectedDistrict);
    if (match) {
      setFormData((prev) => ({
        ...prev,
        district: match.district,
        city: match.city,
        state: match.city === 'Delhi' ? 'Delhi' : 'Uttar Pradesh',
        pincode: match.pincode,
        latitude: match.latitude,
        longitude: match.longitude,
      }));
    } else {
      setFormData((prev) => ({ ...prev, district: selectedDistrict }));
    }
  };

  const handleAutoDetectGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('Geolocation not supported by browser.');
      return;
    }
    setIsDetectingGps(true);
    setGpsStatus('Locating venue coordinates...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lng = parseFloat(pos.coords.longitude.toFixed(4));
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
        setIsDetectingGps(false);
        setGpsStatus(`Venue Geolocation Calibrated: [${lat}, ${lng}]`);
      },
      () => {
        setIsDetectingGps(false);
        setGpsStatus('Access denied. Retaining district defaults.');
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await merchantService.onboard(formData);
      const merchantData = res.data;
      localStorage.setItem('ambrosia_merchant', JSON.stringify(merchantData));
      alert(`Venue "${merchantData.name}" onboarded successfully with license ${merchantData.license_number}!`);
      navigate('/merchant/dashboard');
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Onboarding failed.';
      setErrorMsg(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] text-stone-100 flex items-center justify-center p-4 relative overflow-hidden py-12">
      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-[#d4af37]/15 via-amber-900/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl border border-[#d4af37]/40 bg-gradient-to-br from-amber-500/20 to-stone-950 flex items-center justify-center text-amber-300 shadow-lg shadow-amber-950/40">
              <Sparkles className="w-5 h-5 text-[#d4af37]" />
            </div>
            <span className="font-serif-lux text-2xl font-bold tracking-widest gold-gradient-text uppercase">
              Ambrosia
            </span>
          </Link>
          <h2 className="font-serif-lux text-xl sm:text-2xl font-bold text-white">
            Partner Venue Onboarding
          </h2>
          <p className="text-xs text-stone-400 mt-1 font-light">
            Enlist your licensed bar, wine cellar, or craft microbrewery onto our 10 km corridor
          </p>
        </div>

        {/* Card Container */}
        <div className="p-8 rounded-3xl glass-panel border border-[#d4af37]/30 shadow-2xl relative">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Venue Name & License Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Licensed Venue Name</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="The Grand Sommelier Vault"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-[#d4af37]/60 text-xs text-amber-100 placeholder:text-stone-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Excise License Number</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="DL-EXC-2026-9901"
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-[#d4af37]/60 text-xs text-amber-100 placeholder:text-stone-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Venue Type & Contact Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Establishment Classification
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/80 border border-white/10 focus:border-[#d4af37]/60 text-xs text-amber-100 focus:outline-none"
                >
                  {VENUE_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-stone-900 text-white">
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Contact Phone Number</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 11 4150 9999"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-[#d4af37]/60 text-xs text-amber-100 placeholder:text-stone-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Email & Passcode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Merchant Portal Email</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="manager@venue.in"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-[#d4af37]/60 text-xs text-amber-100 placeholder:text-stone-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Manager Passcode</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-[#d4af37]/60 text-xs text-amber-100 placeholder:text-stone-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Physical Venue Address</span>
              </label>
              <textarea
                rows={2}
                required
                placeholder="Unit 14, Luxury Promenade, Main Boulevard..."
                value={formData.address_line}
                onChange={(e) => setFormData({ ...formData, address_line: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-[#d4af37]/60 text-xs text-amber-100 placeholder:text-stone-600 focus:outline-none resize-none"
              />
            </div>

            {/* District & Region */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Cluster District
                </label>
                <select
                  value={formData.district}
                  onChange={handleDistrictChange}
                  className="w-full px-3 py-2 rounded-xl bg-black/80 border border-white/10 focus:border-[#d4af37]/60 text-xs text-amber-100 focus:outline-none"
                >
                  {districts.map((d) => (
                    <option key={d.district} value={d.district} className="bg-stone-900 text-white">
                      {d.district} ({d.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Delivery Radius
                </label>
                <input
                  type="text"
                  disabled
                  value="10.0 km (Fixed)"
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-[#d4af37] font-bold"
                />
              </div>
            </div>

            {/* Coordinates & Auto-Detect GPS */}
            <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-[#d4af37]/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-200 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-[#d4af37]" />
                  <span>Venue GPS Origin [Lat, Lng]</span>
                </span>
                <button
                  type="button"
                  onClick={handleAutoDetectGps}
                  disabled={isDetectingGps}
                  className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-[#d4af37]/40 text-[11px] font-bold text-amber-300 transition-all flex items-center gap-1"
                >
                  <Compass className={`w-3 h-3 ${isDetectingGps ? 'animate-spin' : ''}`} />
                  <span>{isDetectingGps ? 'Querying GPS...' : 'Auto-Detect Coordinates'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-stone-300">
                <div className="p-2 rounded bg-black/50 border border-white/5">
                  Lat: {formData.latitude}
                </div>
                <div className="p-2 rounded bg-black/50 border border-white/5">
                  Lng: {formData.longitude}
                </div>
              </div>

              {gpsStatus && (
                <p className="text-[10px] text-amber-300/90 font-mono">{gpsStatus}</p>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl gold-gradient-btn text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl hover:shadow-amber-500/25 disabled:opacity-50 transition-all mt-4"
            >
              <ShieldCheck className="w-4 h-4 text-stone-950" />
              <span>{isSubmitting ? 'Onboarding Establishment...' : 'Register Venue & Launch Corridor'}</span>
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-stone-400">
            <span>Already onboarded? </span>
            <Link to="/login" className="text-[#d4af37] font-semibold hover:underline">
              Sign In to Venue Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
