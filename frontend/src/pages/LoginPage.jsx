import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  User,
  Store,
  Lock,
  Mail,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { authService } from '../services/api';

export default function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [role, setRole] = useState('user'); // 'user' | 'merchant'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setErrorMsg('');
    setIsLoading(true);

    try {
      let res;
      if (role === 'user') {
        res = await authService.login({ email, password });
      } else {
        res = await authService.merchantLogin({ email, password });
      }

      const data = res.data;
      localStorage.setItem('ambrosia_token', data.access_token);
      localStorage.setItem('ambrosia_role', data.role);
      if (data.user) {
        localStorage.setItem('ambrosia_user', JSON.stringify(data.user));
      } else if (data.merchant) {
        localStorage.setItem('ambrosia_merchant', JSON.stringify(data.merchant));
      }

      if (onLoginSuccess) {
        onLoginSuccess(data);
      }

      if (data.role === 'merchant') {
        navigate('/merchant/dashboard');
      } else {
        navigate('/marketplace');
      }
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Authentication failed.';
      setErrorMsg(detail);
    } finally {
      setIsLoading(false);
    }
  };

  // Demo 1-Click Fast Fill Helpers
  const fillAdultUser = () => {
    setRole('user');
    setEmail('rajesh.khanna@luxury.in');
    setPassword('AmbrosiaElite2026!');
    setErrorMsg('');
  };

  const fillUnderageUser = () => {
    setRole('user');
    setEmail('aarav.sharma@younggen.in');
    setPassword('AmbrosiaYoung2026!');
    setErrorMsg('');
  };

  const fillMerchant = () => {
    setRole('merchant');
    setEmail('sommelier@imperialcellar.in');
    setPassword('AmbrosiaPartner2024!');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-[#070709] text-stone-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-[#d4af37]/15 via-amber-900/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
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
          <h2 className="font-serif-lux text-xl font-bold text-white">Vault Access Portal</h2>
          <p className="text-xs text-stone-400 mt-1 font-light">
            Authenticate to access your curated hyper-local cellar
          </p>
        </div>

        {/* Card Container */}
        <div className="p-8 rounded-3xl glass-panel border border-[#d4af37]/30 shadow-2xl relative">
          {/* Role Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-black/50 border border-white/10 mb-6">
            <button
              type="button"
              onClick={() => {
                setRole('user');
                setErrorMsg('');
              }}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                role === 'user'
                  ? 'bg-[#d4af37] text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Connoisseur</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole('merchant');
                setErrorMsg('');
              }}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                role === 'merchant'
                  ? 'bg-[#d4af37] text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Merchant Partner</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Corporate or Registered Email</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@luxury.in"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-[#d4af37]/60 text-xs text-amber-100 placeholder:text-stone-600 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Passcode</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-[#d4af37]/60 text-xs text-amber-100 placeholder:text-stone-600 focus:outline-none transition-colors"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl gold-gradient-btn text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl hover:shadow-amber-500/25 disabled:opacity-50 transition-all mt-6"
            >
              <ShieldCheck className="w-4 h-4 text-stone-950" />
              <span>{isLoading ? 'Verifying Credentials...' : 'Authenticate'}</span>
            </button>
          </form>

          {/* Quick 1-Click Demo Profiles */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#d4af37] block mb-2.5 text-center">
              Quick 1-Click Demo Profiles
            </span>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={fillAdultUser}
                className="w-full p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-[#d4af37]/30 text-left text-xs text-amber-200 transition-all flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-white">Adult Connoisseur (28yo)</span>
                  <span className="block text-[10px] text-amber-400/80">
                    Full Reserve Spirits & Single Malts Unlocked
                  </span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/50 border border-amber-500/30">
                  Select
                </span>
              </button>

              <button
                type="button"
                onClick={fillUnderageUser}
                className="w-full p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left text-xs text-emerald-200 transition-all flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-white">Underage Connoisseur (17yo)</span>
                  <span className="block text-[10px] text-emerald-400/80">
                    Strict Zero-Proof Non-Alcoholic Mode
                  </span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/50 border border-emerald-500/30">
                  Select
                </span>
              </button>

              <button
                type="button"
                onClick={fillMerchant}
                className="w-full p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-left text-xs text-purple-200 transition-all flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-white">Merchant Partner</span>
                  <span className="block text-[10px] text-purple-400/80">
                    The Imperial Cellar & Bar (Dispatch Portal)
                  </span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/50 border border-purple-500/30">
                  Select
                </span>
              </button>
            </div>
          </div>

          {/* Registration Redirect */}
          <div className="mt-6 text-center text-xs text-stone-400">
            <span>New to Ambrosia? </span>
            <Link to="/register" className="text-[#d4af37] font-semibold hover:underline">
              Register Legal Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
