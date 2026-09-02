import React, { useState } from 'react';
import { X, User, Lock, Mail, Phone, MapPin, ShieldCheck, Sparkles, Navigation } from 'lucide-react';
import { api } from '../api/client';

export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  districts,
  userLocation,
}) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState(28);
  const [addressLine, setAddressLine] = useState('');
  const [district, setDistrict] = useState(userLocation?.district || 'Connaught Place');
  const [city, setCity] = useState(userLocation?.city || 'Delhi');
  const [state, setState] = useState(userLocation?.city === 'Delhi' ? 'Delhi' : 'Uttar Pradesh');
  const [pincode, setPincode] = useState('110001');
  const [latitude, setLatitude] = useState(userLocation?.latitude || 28.6289);
  const [longitude, setLongitude] = useState(userLocation?.longitude || 77.2195);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Handle District Change
  const handleDistrictSelect = (districtName) => {
    const matched = districts?.find(d => d.district === districtName);
    if (matched) {
      setDistrict(matched.district);
      setCity(matched.city);
      setState(matched.city === 'Delhi' ? 'Delhi' : 'Uttar Pradesh');
      setPincode(matched.pincode);
      setLatitude(matched.latitude);
      setLongitude(matched.longitude);
    } else {
      setDistrict(districtName);
    }
  };

  // One-click quick demo logins
  const handleQuickDemo = (demoType) => {
    if (demoType === 'adult') {
      setEmail('vikram.mehta@luxury.in');
      setPassword('AmbrosiaAdult2026!');
      setMode('login');
    } else if (demoType === 'underage') {
      setEmail('aarav.sharma@younggen.in');
      setPassword('AmbrosiaYoung2026!');
      setMode('login');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.loginUser({ email: email.trim(), password });
        onAuthSuccess(res);
        onClose();
      } else {
        const payload = {
          full_name: fullName.trim(),
          email: email.trim(),
          phone_number: phone.trim(),
          age: parseInt(age, 10),
          password,
          address_line: addressLine.trim(),
          city: city.trim(),
          district: district.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        };
        const res = await api.registerUser(payload);
        onAuthSuccess(res);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-md rounded-3xl glass-panel border border-amber-500/30 overflow-hidden shadow-2xl animate-scaleUp max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-stone-300 hover:text-white flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="overflow-y-auto p-6 sm:p-8">
          
          {/* Brand Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full border border-amber-400/40 bg-gradient-to-br from-amber-500/20 to-black flex items-center justify-center text-amber-300 shadow-lg mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <h2 className="font-serif-lux text-2xl font-bold text-white tracking-wide">
              {mode === 'login' ? 'Ambrosia Member Access' : 'Create Member Account'}
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              {mode === 'login' 
                ? 'Sign in to access your curated spirits vault & active orders' 
                : 'Join Ambrosia for location-bound artisanal spirits fulfillment'}
            </p>
          </div>

          {/* Demo Quick Logins */}
          <div className="mb-6 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
            <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block mb-2">
              ⚡ Quick 1-Click Demo Accounts:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('adult')}
                className="px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 text-[11px] font-semibold text-left truncate"
              >
                🍸 Adult (28yo • CP)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('underage')}
                className="px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[11px] font-semibold text-left truncate"
              >
                🌿 Underage (17yo • Noida)
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-stone-300 mb-1 font-semibold">Full Name</label>
                  <input
                    type="text"
                    placeholder="Vikram Mehta"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-amber-100 focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-300 mb-1 font-semibold">Age (Verification)</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-amber-100 focus:outline-none focus:border-amber-400 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-stone-300 mb-1 font-semibold">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 98111 ..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-amber-100 focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>
                </div>

                {/* District Selector */}
                <div>
                  <label className="block text-stone-300 mb-1 font-semibold">Delivery District</label>
                  <select
                    value={district}
                    onChange={(e) => handleDistrictSelect(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-amber-100 focus:outline-none focus:border-amber-400"
                  >
                    {districts?.map((d) => (
                      <option key={d.district} value={d.district}>
                        {d.district} ({d.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-300 mb-1 font-semibold">Full Address</label>
                  <textarea
                    rows={2}
                    placeholder="Apartment, Street, Landmark..."
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-amber-100 focus:outline-none focus:border-amber-400 resize-none"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-stone-300 mb-1 font-semibold">Email Address</label>
              <input
                type="email"
                placeholder="name@luxury.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-amber-100 focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="block text-stone-300 mb-1 font-semibold">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-amber-100 focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            {errorMsg && (
              <p className="text-red-400 text-xs bg-red-950/40 p-2.5 rounded-lg border border-red-500/30">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full gold-gradient-btn py-3 rounded-xl font-bold uppercase tracking-wider text-xs shadow-xl hover:shadow-amber-500/30 mt-2 disabled:opacity-50"
            >
              {isLoading 
                ? 'Validating Credentials...' 
                : mode === 'login' ? 'Sign In to Ambrosia' : 'Complete Registration'}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-6 text-center text-xs text-stone-400">
            {mode === 'login' ? (
              <p>
                Don't have a member account?{' '}
                <button
                  onClick={() => {
                    setMode('register');
                    setErrorMsg('');
                  }}
                  className="text-amber-300 font-semibold hover:underline"
                >
                  Register Now
                </button>
              </p>
            ) : (
              <p>
                Already have a member account?{' '}
                <button
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                  }}
                  className="text-amber-300 font-semibold hover:underline"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
