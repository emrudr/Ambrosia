import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Cake,
  Heart,
  Send,
  RefreshCw,
  Server,
  Database,
  Layers,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import './App.css';

// Base API URL resolver (handles local dev proxy, direct backend url, or containerized relative path)
const API_BASE = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '') 
  : (window.location.port === '5173' ? 'http://localhost:8000/api/v1' : '/api/v1');

export default function App() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [totalWishes, setTotalWishes] = useState(0);
  const [recentWishes, setRecentWishes] = useState([]);
  const [health, setHealth] = useState({ status: 'checking', database: 'unknown', redis: 'unknown' });
  const [showArchModal, setShowArchModal] = useState(false);

  const inputRef = useRef(null);

  // Trigger high-velocity colorful confetti burst
  const triggerConfetti = () => {
    // Center cannon
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#10b981', '#ffffff'],
    });

    // Side cannons for extra celebration flair
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
      });
    }, 200);
  };

  // Fetch initial system state (health, count, recent wishes)
  const fetchSystemData = async () => {
    try {
      // 1. Fetch Health
      const healthRes = await fetch(`${API_BASE}/health`).catch(() => null);
      if (healthRes && healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData);
      } else {
        setHealth({ status: 'offline', database: 'unreachable', redis: 'unreachable' });
      }

      // 2. Fetch Total Wishes Count
      const countRes = await fetch(`${API_BASE}/wishes/count`).catch(() => null);
      if (countRes && countRes.ok) {
        const countData = await countRes.json();
        setTotalWishes(countData.total_wishes);
      }

      // 3. Fetch Recent Wishes
      const wishesRes = await fetch(`${API_BASE}/wishes?limit=8`).catch(() => null);
      if (wishesRes && wishesRes.ok) {
        const wishesData = await wishesRes.json();
        setRecentWishes(wishesData);
      }
    } catch (err) {
      console.warn("Error synchronizing with backend API:", err);
    }
  };

  useEffect(() => {
    fetchSystemData();
    const interval = setInterval(fetchSystemData, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter a name to wish!');
      if (inputRef.current) inputRef.current.focus();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/wish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: trimmedName }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Failed to submit wish' }));
        throw new Error(errorData.detail || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
      setTotalWishes(data.total_wishes);
      triggerConfetti();

      // Refresh recent list
      fetchSystemData();
      setName('');
    } catch (err) {
      setError(err.message || 'Could not connect to the backend server. Ensure Docker containers are running.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="app-container">
      {/* Background Decorative Glow Elements */}
      <div className="glow-orb orb-1" />
      <div className="glow-orb orb-2" />
      <div className="glow-orb orb-3" />

      {/* Header Navigation Bar */}
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-icon">
            <Cake className="w-6 h-6 text-pink-400" />
          </div>
          <div>
            <h1 className="brand-title">Birthday Wisher</h1>
            <span className="brand-subtitle">Cloud Native • Docker & Azure Stack</span>
          </div>
        </div>

        <div className="header-actions">
          <div className={`status-pill status-${health.status === 'healthy' ? 'online' : 'warn'}`}>
            <span className="pulse-dot" />
            <span className="status-label">
              {health.status === 'healthy' ? 'Cloud Services Online' : 'Connecting API...'}
            </span>
          </div>
          <button 
            className="btn-glass"
            onClick={() => setShowArchModal(true)}
            title="Inspect Architecture"
          >
            <Layers className="w-4 h-4 mr-1.5" />
            Architecture
          </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="main-content">
        {/* Left Column: Form & Interaction */}
        <section className="form-section">
          {/* Live Stat Banner */}
          <div className="stats-banner">
            <div className="stat-item">
              <span className="stat-label">Total Wishes Recorded</span>
              <div className="stat-counter">
                <Sparkles className="stat-icon" />
                <span className="stat-value">{totalWishes.toLocaleString()}</span>
              </div>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-label">Cache Acceleration</span>
              <div className="stat-counter">
                <Zap className="stat-icon zap" />
                <span className="stat-badge">
                  {health.redis === 'healthy' ? 'Redis Active' : 'DB Direct'}
                </span>
              </div>
            </div>
          </div>

          {/* Card: Send a Wish */}
          <div className="glass-card main-card">
            <div className="card-header">
              <h2 className="card-title">Send a Birthday Greeting 🎉</h2>
              <p className="card-description">
                Enter your name below. The request is processed by FastAPI, saved into PostgreSQL, and cached with Redis!
              </p>
            </div>

            <form onSubmit={handleSubmit} className="wish-form">
              <div className="input-group">
                <label htmlFor="name-input" className="input-label">
                  Birthday Person's Name
                </label>
                <div className="input-wrapper">
                  <input
                    id="name-input"
                    ref={inputRef}
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="e.g. Maya, Alex, or John"
                    maxLength={100}
                    disabled={loading}
                    className="name-input"
                    autoFocus
                  />
                  {name && (
                    <button
                      type="button"
                      className="clear-btn"
                      onClick={() => setName('')}
                      tabIndex={-1}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {error && (
                <div className="alert-box alert-error">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !name.trim()}
                className={`submit-btn ${loading ? 'loading' : ''}`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                    <span>Writing to Database & Cache...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    <span>Wish Me! 🎂</span>
                  </>
                )}
              </button>
            </form>

            {/* Response Card State */}
            {response && (
              <div className="response-card animate-fade-in">
                <div className="response-badge">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-1" />
                  <span>Record Committed to PostgreSQL</span>
                </div>
                <h3 className="greeting-text">{response.message}</h3>
                <p className="greeting-subtext">
                  You are wish <strong>#{response.total_wishes}</strong> in the database! ✨
                </p>
                <div className="celebration-actions">
                  <button
                    className="btn-replay"
                    onClick={triggerConfetti}
                  >
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    More Confetti!
                  </button>
                  <button
                    className="btn-new-wish"
                    onClick={() => {
                      setResponse(null);
                      if (inputRef.current) inputRef.current.focus();
                    }}
                  >
                    Wish Another Person
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Live Wish Stream & Service Health */}
        <aside className="sidebar-section">
          {/* Recent Wishes Feed */}
          <div className="glass-card side-card">
            <div className="side-card-header">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <h3 className="side-card-title">Recent Wishes Stream</h3>
              </div>
              <button 
                className="icon-btn-small" 
                onClick={fetchSystemData} 
                title="Refresh Live Data"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="wishes-list">
              {recentWishes.length === 0 ? (
                <div className="empty-state">
                  <Cake className="w-8 h-8 opacity-30 mx-auto mb-2" />
                  <p>No wishes yet today. Be the first one to wish!</p>
                </div>
              ) : (
                recentWishes.map((w) => (
                  <div key={w.id} className="wish-pill-item">
                    <div className="wish-avatar">
                      {w.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="wish-info">
                      <span className="wish-name">{w.name}</span>
                      <span className="wish-time">{formatTime(w.created_at)}</span>
                    </div>
                    <Heart className="w-4 h-4 text-pink-400/70" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Infrastructure Health Status */}
          <div className="glass-card side-card infra-card">
            <h3 className="side-card-title mb-3">Container Health Matrix</h3>
            <div className="infra-grid">
              <div className="infra-item">
                <div className="infra-icon-wrap">
                  <Server className="w-4 h-4 text-blue-400" />
                </div>
                <div className="infra-details">
                  <span className="infra-title">FastAPI Backend</span>
                  <span className="infra-status status-good">Port 8000 • Uvicorn</span>
                </div>
              </div>

              <div className="infra-item">
                <div className="infra-icon-wrap">
                  <Database className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="infra-details">
                  <span className="infra-title">PostgreSQL 16</span>
                  <span className={`infra-status ${health.database.startsWith('healthy') ? 'status-good' : 'status-bad'}`}>
                    {health.database}
                  </span>
                </div>
              </div>

              <div className="infra-item">
                <div className="infra-icon-wrap">
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div className="infra-details">
                  <span className="infra-title">Redis Cache</span>
                  <span className={`infra-status ${health.redis === 'healthy' ? 'status-good' : 'status-warn'}`}>
                    {health.redis}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Architecture Education Modal */}
      {showArchModal && (
        <div className="modal-backdrop" onClick={() => setShowArchModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                <h3 className="modal-title">Cloud Native Architecture</h3>
              </div>
              <button 
                className="close-modal-btn"
                onClick={() => setShowArchModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <p className="modal-intro">
                Here is how your request travels through the modern Dockerized stack deployed on Azure:
              </p>

              <div className="arch-flow">
                <div className="flow-step">
                  <div className="step-num">1</div>
                  <div>
                    <strong>React 18 + Vite (Nginx)</strong>
                    <p>Static bundle served via Alpine Nginx reverse-proxies requests to <code>/api/v1/wish</code>.</p>
                  </div>
                </div>

                <div className="flow-step">
                  <div className="step-num">2</div>
                  <div>
                    <strong>FastAPI + Python 3.11 Slim</strong>
                    <p>Validates request with Pydantic v2 schemas and handles business logic asynchronously.</p>
                  </div>
                </div>

                <div className="flow-step">
                  <div className="step-num">3</div>
                  <div>
                    <strong>PostgreSQL 16 (SQLAlchemy 2.0 & Alembic)</strong>
                    <p>Persists wish records with automatic database schema migrations.</p>
                  </div>
                </div>

                <div className="flow-step">
                  <div className="step-num">4</div>
                  <div>
                    <strong>Redis In-Memory Cache</strong>
                    <p>Provides atomic counter increments and sub-millisecond wish count retrieval.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-glass"
                onClick={() => setShowArchModal(false)}
              >
                Close Architecture View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* App Footer */}
      <footer className="app-footer">
        <p>Built for Modern Containerization & Azure Cloud Deployment</p>
      </footer>
    </div>
  );
}
