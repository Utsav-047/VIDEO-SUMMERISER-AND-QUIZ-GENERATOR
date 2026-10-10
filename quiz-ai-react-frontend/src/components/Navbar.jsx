import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Sun, Moon, LogOut, User as UserIcon, LayoutDashboard, History, BarChart2 } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, isDark, toggleTheme }) {
  const { user, openAuth, logout } = useAuth();

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: isDark ? 'rgba(10, 14, 23, 0.8)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        transition: 'var(--transition)',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 24px',
          height: '74px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand Logo */}
        <div
          id="nav-brand-logo"
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          onClick={() => setActiveTab('dashboard')}
        >
          <img
            src="/logo.png"
            alt="Synapse AI"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              objectFit: 'cover',
              border: '1px solid var(--border-glow)',
              boxShadow: 'var(--glow-primary)',
            }}
            onError={(e) => {
              // fallback if logo missing
              e.target.style.display = 'none';
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Synapse</span>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '2px 7px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
                color: 'var(--accent-primary)',
                border: '1px solid var(--border-glow)',
              }}
            >
              PRO
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            id="nav-tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className="btn-secondary"
            style={{
              background: activeTab === 'dashboard' ? 'var(--bg-card-hover)' : 'transparent',
              borderColor: activeTab === 'dashboard' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'dashboard' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            }}
          >
            <LayoutDashboard size={18} />
            <span>Studio</span>
          </button>

          <button
            id="nav-tab-history"
            onClick={() => setActiveTab('history')}
            className="btn-secondary"
            style={{
              background: activeTab === 'history' ? 'var(--bg-card-hover)' : 'transparent',
              borderColor: activeTab === 'history' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'history' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            }}
          >
            <History size={18} />
            <span>Library</span>
          </button>

          <button
            id="nav-tab-analytics"
            onClick={() => setActiveTab('analytics')}
            className="btn-secondary"
            style={{
              background: activeTab === 'analytics' ? 'var(--bg-card-hover)' : 'transparent',
              borderColor: activeTab === 'analytics' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'analytics' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            }}
          >
            <BarChart2 size={18} />
            <span>Performance</span>
          </button>
        </nav>

        {/* Action Controls & User Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Theme Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="btn-secondary"
            style={{ padding: '8px', borderRadius: '12px' }}
          >
            {isDark ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
          </button>

          {/* User Profile or Auth Trigger */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#fff',
                  }}
                >
                  {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.full_name || user.email}</span>
              </div>

              <button
                id="logout-btn"
                onClick={logout}
                title="Log out"
                className="btn-secondary"
                style={{ padding: '8px 12px', color: '#f43f5e' }}
              >
                <LogOut size={16} />
                <span style={{ fontSize: '0.8rem' }}>Exit</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                id="header-login-btn"
                onClick={() => openAuth('login')}
                className="btn-secondary"
                style={{ fontSize: '0.85rem', padding: '8px 16px' }}
              >
                Sign In
              </button>
              <button
                id="header-register-btn"
                onClick={() => openAuth('register')}
                className="btn-primary"
                style={{ fontSize: '0.85rem', padding: '8px 18px' }}
              >
                <Sparkles size={16} />
                <span>Join Free</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
