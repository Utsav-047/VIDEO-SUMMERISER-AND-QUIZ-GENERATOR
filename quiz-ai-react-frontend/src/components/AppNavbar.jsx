import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, LogOut, ChevronDown, User } from 'lucide-react';

export default function AppNavbar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', height: 70, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ width: 32, height: 32, borderRadius: 6, background: '#0b326f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={18} color="#ffffff" />
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0b326f', letterSpacing: '-0.02em' }}>
            Synapse AI
          </span>
        </div>

        {/* Center Navigation Links with Reference Underline */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <button
            id="tab-btn-home"
            className="nav-link"
            onClick={() => navigate('/')}
          >
            Home
          </button>
          
          <button
            id="tab-btn-dashboard"
            className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Studio
          </button>

          <button
            id="tab-btn-history"
            className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Library
          </button>

          <button
            id="tab-btn-analytics"
            className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
        </nav>

        {/* Right Side: User Dropdown or Sign In */}
        <div style={{ position: 'relative' }}>
          {user ? (
            <div>
              <button
                id="user-profile-menu-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0b326f', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                  {(user.full_name || user.email || 'U')[0].toUpperCase()}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.full_name || user.email}
                </span>
                <ChevronDown size={14} color="#64748b" />
              </button>

              {dropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    width: 200,
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    zIndex: 200,
                    padding: '8px 0',
                  }}
                  onMouseLeave={() => setDropdownOpen(false)}
                >
                  <div style={{ padding: '8px 16px', borderBottom: '1px solid #f1f5f9', marginBottom: 4 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{user.full_name || 'Account'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.email}</div>
                  </div>
                  <button
                    id="logout-action-btn"
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 16px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#ef4444',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <button id="navbar-login-btn" className="btn-secondary" onClick={() => navigate('/login')} style={{ fontSize: '0.85rem', padding: '7px 14px' }}>
                Sign In
              </button>
              <button id="navbar-register-btn" className="btn-primary" onClick={() => navigate('/register')} style={{ fontSize: '0.85rem', padding: '7px 16px' }}>
                Get Started
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
