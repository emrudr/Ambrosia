import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  User,
  Mail,
  Phone,
  Lock,
  MapPin,
  Compass,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { authService, systemService } from '../services/api';

export default function RegisterPage({ onRegisterSuccess }) {
  const navigate = useNavigate();
  const [districts, setDistricts] = useState([]);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(true);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    age: 25,
    password: '',
    address_line: '',
    city: 'Delhi',
    district: 'Connaught Place',
    state: 'Delhi',
    pincode: '110001',
    latitude: 28.6289,
    longitude: 77.2195,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch verified delivery districts
  useEffect(() => {
    async function loadDistricts() {
      try {
        const res = await systemService.getDistricts();
        setDistricts(res.data || []);
      } catch (err) {
        console.error('Failed to load districts:', err);
      } finally {
        setIsLoadingDistricts(false);
      }
    }
    loadDistricts();
  }, []);

  // When district changes, sync coordinates and pincode
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
      setGpsStatus(`Coordinates aligned to ${match.district} center: [${match.latitude}, ${match.longitude}]`);
    } else {
      setFormData((prev) => ({ ...prev, district: selectedDistrict }));
    }
  };

  // Fallback to Backend Geolocation Endpoint
  const fallbackToBackendGps = async () => {
    try {
      const res = await systemService.autoDetectGps(formData.district);
      if (res.data && res.data.latitude && res.data.longitude) {
        const lat = parseFloat(res.data.latitude);
        const lng = parseFloat(res.data.longitude);
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          district: res.data.district || prev.district,
          city: res.data.city || prev.city,
          pincode: res.data.pincode || prev.pincode,
        }));
        setGpsStatus(`Backend GPS Calibrated: [${lat}, ${lng}] • ${res.data.district || 'NCR Corridor'}`);
      }
    } catch (e) {
      setGpsStatus('GPS calibration complete. You can tweak coordinates manually.');
    } finally {
      setIsDetectingGps(false);
    }
  };

  // Hybrid Geolocation: Browser Satellite first, then Backend GPS resolver
  const handleAutoDetectGps = async () => {
    setIsDetectingGps(true);
    setGpsStatus('Resolving coordinates via GPS & backend corridor...');

    if (navigator.geolocation && (window.isSecureContext || window.location.hostname === 'localhost')) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(4));
          const lng = parseFloat(pos.coords.longitude.toFixed(4));
          setFormData((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lng,
          }));
          setIsDetectingGps(false);

          // Find closest district to populate city & district
          try {
            const cRes = await systemService.getClosestDistrict(lat, lng);
            if (cRes.data && cRes.data.district) {
              setFormData((prev) => ({
                ...prev,
                district: cRes.data.district,
                city: cRes.data.city,
                pincode: cRes.data.pincode,
              }));
              setGpsStatus(`Satellite GPS Calibrated: [${lat}, ${lng}] • Closest Hub: ${cRes.data.district}`);
            } else {
              setGpsStatus(`Satellite GPS Calibrated: [${lat}, ${lng}]`);
            }
          } catch (err) {
            setGpsStatus(`Satellite GPS Calibrated: [${lat}, ${lng}]`);
          }
        },
        async (err) => {
          // Fallback to Backend auto-detect
          await fallbackToBackendGps();
        },
        { timeout: 6000 }
      );
    } else {
      await fallbackToBackendGps();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        age: parseInt(formData.age, 10),
        latitude: parseFloat(formData.latitude) || 28.6289,
        longitude: parseFloat(formData.longitude) || 77.2195,
      };
      const res = await authService.register(payload);
      const data = res.data;

      localStorage.setItem('ambrosia_token', data.access_token);
      localStorage.setItem('ambrosia_role', data.role);
      localStorage.setItem('ambrosia_user', JSON.stringify(data.user));

      if (onRegisterSuccess) {
        onRegisterSuccess(data);
      }

      navigate('/marketplace');
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Registration failed.';
      setErrorMsg(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] text-stone-100 flex items-center justify-center p-4 relative overflow-hidden py-12">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-[#d4af37]/15 via-amber-900/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl relative z-10">
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
            Connoisseur Registry
          </h2>
          <p className="text-xs text-stone-400 mt-1 font-light">
            Enforce legal compliance & establish your live 10 km corridor
          </p>
        </div>

        {/* Card Container */}
        <div className="p-8 rounded-3xl glass-panel border border-[#d4af37]/30 shadow-2xl relative">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name & Age */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-stone-300 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Full Legal Name</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Vikramaditya Roy"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-[#d4af37]/60 text-xs text-amber-100 placeholder:text-stone-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Declared Age</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="110"
                  required
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-[#d4af37]/60 text-xs text-amber-100 placeholder:text-stone-600 focus:outline-none"
                />
                <span className="block text-[10px] text-stone-400 mt-1">
                  {parseInt(formData.age, 10) >= 18 ? (
                    <span className="text-amber-300">✓ 18+ Unlocked</span>
                  ) : (
                    <span className="text-emerald-400">✓ Zero-Proof Safe</span>
                  )}
                </span>
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="vikram@connoisseur.in"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-[#d4af37]/60 text-xs text-amber-100 placeholder:text-stone-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Phone Number</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98111 00000"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-[#d4af37]/60 text-xs text-amber-100 placeholder:text-stone-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Passcode */}
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Passcode (min 6 chars)</span>
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

            {/* Delivery Address Line */}
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Primary Delivery Address</span>
              </label>
              <textarea
                rows={2}
                required
                placeholder="Suite / Flat No, Tower, Estate Name, Street..."
                value={formData.address_line}
                onChange={(e) => setFormData({ ...formData, address_line: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-[#d4af37]/60 text-xs text-amber-100 placeholder:text-stone-600 focus:outline-none resize-none"
              />
            </div>

            {/* District & City Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  District (Tier-1 Cluster Hub)
                </label>
                <select
                  value={formData.district}
                  onChange={handleDistrictChange}
                  className="w-full px-3 py-2 rounded-xl bg-black/80 border border-white/10 focus:border-[#d4af37]/60 text-xs text-amber-100 focus:outline-none"
                >
                  {districts.length > 0 ? (
                    districts.map((d) => (
                      <option key={d.district} value={d.district} className="bg-stone-900 text-white">
                        {d.district} ({d.city})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Connaught Place">Connaught Place (Delhi)</option>
                      <option value="Hauz Khas">Hauz Khas (Delhi)</option>
                      <option value="Sector 18">Sector 18 (Noida)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">City / Region</label>
                <input
                  type="text"
                  disabled
                  value={`${formData.city} • ${formData.pincode}`}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-stone-400"
                />
              </div>
            </div>

            {/* Coordinates: Editable Manual Inputs & Backend Auto-Detect GPS */}
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-[#d4af37]/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-200 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-[#d4af37]" />
                  <span>Geospatial Coordinates [Manual or Auto]</span>
                </span>
                <button
                  type="button"
                  onClick={handleAutoDetectGps}
                  disabled={isDetectingGps}
                  className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-[#d4af37]/40 text-[11px] font-bold text-amber-300 transition-all flex items-center gap-1.5"
                >
                  <Compass className={`w-3.5 h-3.5 ${isDetectingGps ? 'animate-spin' : ''}`} />
                  <span>{isDetectingGps ? 'Calibrating...' : 'Auto-Detect GPS'}</span>
                </button>
              </div>

              <p className="text-[10px] text-stone-400">
                You can manually enter latitude & longitude below, select a district above, or click Auto-Detect:
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-mono text-stone-400 mb-1">
                    Latitude (°N)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.latitude}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                      setFormData((prev) => ({ ...prev, latitude: val }));
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-black/70 border border-white/10 focus:border-[#d4af37]/60 text-xs font-mono text-amber-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono text-stone-400 mb-1">
                    Longitude (°E)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.longitude}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                      setFormData((prev) => ({ ...prev, longitude: val }));
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-black/70 border border-white/10 focus:border-[#d4af37]/60 text-xs font-mono text-amber-100 focus:outline-none"
                  />
                </div>
              </div>

              {gpsStatus && (
                <p className="text-[10px] text-amber-300/90 font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{gpsStatus}</span>
                </p>
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
              <Sparkles className="w-4 h-4 text-stone-950" />
              <span>{isSubmitting ? 'Registering...' : 'Complete Registration'}</span>
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center text-xs text-stone-400">
            <span>Already registered? </span>
            <Link to="/login" className="text-[#d4af37] font-semibold hover:underline">
              Access Vault
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
