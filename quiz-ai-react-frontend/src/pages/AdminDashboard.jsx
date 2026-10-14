import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  ShieldCheck, ArrowLeft, Sun, Moon, Search, Award, Trophy,
  Users, Video, HelpCircle, BarChart3, TrendingUp, RefreshCw,
  ChevronRight, X, UserCheck, UserX, AlertTriangle
} from 'lucide-react';

export default function AdminDashboard({ isDark, toggleTheme }) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [overview, setOverview] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('rank'); // 'rank' | 'accuracy' | 'quizzes' | 'videos' | 'name'

  // Selected User for Deep-Dive Modal
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [roleActionLoading, setRoleActionLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const loadAdminData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [overviewData, rankingsData] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminRankings(),
      ]);
      setOverview(overviewData);
      setRankings(rankingsData);
    } catch (err) {
      setError(err.message || 'Failed to load admin analytics. Please make sure you have administrator privileges.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && user.role === 'admin') {
      loadAdminData();
    }
  }, [authLoading, user]);

  // Load individual user details when modal opens
  const openUserDetail = async (userId) => {
    setSelectedUserId(userId);
    setDetailLoading(true);
    setActionSuccessMsg('');
    try {
      const data = await api.getAdminUserDetail(userId);
      setUserDetail(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch user deep-dive telemetry');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeUserDetail = () => {
    setSelectedUserId(null);
    setUserDetail(null);
    setActionSuccessMsg('');
  };

  // Handle role change (promote/demote)
  const handleRoleToggle = async (targetUser) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    const confirmPrompt = `Are you sure you want to change ${targetUser.full_name}'s role to ${newRole.toUpperCase()}?`;
    if (!window.confirm(confirmPrompt)) return;

    setRoleActionLoading(true);
    try {
      await api.updateUserRole(targetUser.id, newRole);
      setActionSuccessMsg(`Role updated to ${newRole.toUpperCase()} successfully.`);

      // Update local state in rankings list
      setRankings((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
      );

      // If user detail modal is open for this user, update it too
      if (userDetail && userDetail.user && userDetail.user.id === targetUser.id) {
        setUserDetail((prev) => ({
          ...prev,
          user: { ...prev.user, role: newRole },
        }));
      }
    } catch (err) {
      alert(err.message || 'Failed to update user role');
    } finally {
      setRoleActionLoading(false);
    }
  };

  // Filter and sort rankings
  const filteredAndSortedRankings = useMemo(() => {
    return rankings
      .filter((u) => {
        const matchesSearch =
          (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTier = tierFilter === 'ALL' || u.tier.toUpperCase() === tierFilter.toUpperCase();
        return matchesSearch && matchesTier;
      })
      .sort((a, b) => {
        if (sortBy === 'rank') {
          if (a.rank && b.rank) return a.rank - b.rank;
          if (a.rank) return -1;
          if (b.rank) return 1;
          return a.id - b.id;
        }
        if (sortBy === 'accuracy') {
          return b.avg_accuracy - a.avg_accuracy || b.total_quizzes - a.total_quizzes;
        }
        if (sortBy === 'quizzes') {
          return b.total_quizzes - a.total_quizzes || b.avg_accuracy - a.avg_accuracy;
        }
        if (sortBy === 'videos') {
          return b.total_videos - a.total_videos;
        }
        if (sortBy === 'name') {
          return (a.full_name || '').localeCompare(b.full_name || '');
        }
        return 0;
      });
  }, [rankings, searchQuery, tierFilter, sortBy]);

  // Top 3 Podium Users
  const podiumUsers = useMemo(() => {
    return rankings.filter((u) => u.rank && u.rank <= 3).slice(0, 3);
  }, [rankings]);

  // Check auth state
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Verifying Administrator credentials...</p>
      </div>
    );
  }

  // Not logged in or not admin
  if (!user || user.role !== 'admin') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)', padding: 20 }}>
        <div style={{ maxWidth: 480, width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 36, textAlign: 'center', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <AlertTriangle size={28} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Access Restricted</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
            The Admin Console is reserved for system administrators. Your current account ({user?.email || 'Guest'}) does not have administrator privileges.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => navigate('/app')} className="btn-primary" style={{ padding: '10px 20px' }}>
              Return to User Dashboard
            </button>
            <button onClick={() => navigate('/login')} className="btn-secondary" style={{ padding: '10px 20px' }}>
              Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── TOP NAV HEADER ── */}
      <header style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backdropFilter: 'blur(8px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => navigate('/app')}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={16} />
            Back to App
          </button>
          <div style={{ height: 24, width: 1, background: 'var(--border)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#0b326f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  Synapse AI Admin Console
                </span>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', background: 'rgba(11, 50, 111, 0.12)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 9999, border: '1px solid var(--primary-border)' }}>
                  Enterprise
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                User Performance Telemetry &amp; System Rankings
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Refresh button */}
          <button
            onClick={() => loadAdminData(true)}
            disabled={refreshing}
            className="btn-secondary"
            title="Refresh Leaderboard Data"
            style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="btn-secondary"
            title="Toggle theme"
            style={{ width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Admin badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            borderRadius: 9999,
            fontSize: '0.8rem'
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontWeight: 600 }}>{user.full_name}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>(Admin)</span>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main style={{ maxWidth: 1300, width: '100%', margin: '0 auto', padding: '28px 24px', flex: 1 }}>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '14px 18px', borderRadius: 8, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={18} />
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{error}</span>
          </div>
        )}

        {/* ── KPI METRICS CARDS ── */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
          
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 22px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                Registered Users
              </span>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={18} />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {overview ? overview.total_users : '—'}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
              Active platform learner profiles
            </p>
          </div>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 22px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                Quizzes Attempted
              </span>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(234, 88, 12, 0.1)', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HelpCircle size={18} />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ea580c', lineHeight: 1 }}>
              {overview ? overview.total_quizzes_taken : '—'}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
              Cumulative assessment evaluations
            </p>
          </div>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 22px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                Platform Avg Accuracy
              </span>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={18} />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', lineHeight: 1 }}>
              {overview ? `${overview.platform_avg_accuracy}%` : '—'}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
              Benchmark across all questions
            </p>
          </div>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 22px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                Videos Ingested
              </span>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Video size={18} />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
              {overview ? overview.total_videos : '—'}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
              YouTube &amp; local media transcribed
            </p>
          </div>

        </section>

        {/* ── TOP 3 PODIUM / LEADERBOARD SPOTLIGHT ── */}
        {podiumUsers.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Trophy size={20} color="#f59e0b" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Top Ranked Performers
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              {podiumUsers.map((item) => {
                const isFirst = item.rank === 1;
                const isSecond = item.rank === 2;

                const medalColor = isFirst ? '#f59e0b' : isSecond ? '#94a3b8' : '#d97706';
                const medalTitle = isFirst ? '1st Place 🥇' : isSecond ? '2nd Place 🥈' : '3rd Place 🥉';

                return (
                  <div
                    key={item.id}
                    onClick={() => openUserDetail(item.id)}
                    style={{
                      background: 'var(--bg-surface)',
                      border: isFirst ? '2px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border)',
                      borderRadius: 12,
                      padding: 22,
                      boxShadow: isFirst ? '0 10px 25px -5px rgba(245, 158, 11, 0.12)' : 'var(--shadow-sm)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    {/* Top Ribbon */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '4px 10px',
                        borderRadius: 9999,
                        background: `${medalColor}1a`,
                        color: medalColor,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}>
                        <Award size={13} />
                        {medalTitle}
                      </span>

                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: item.tier_color,
                        background: 'var(--bg-subtle)',
                        padding: '3px 8px',
                        borderRadius: 6
                      }}>
                        {item.tier} Tier
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: medalColor,
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {(item.full_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.full_name}
                        </h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.email}
                        </p>
                      </div>
                    </div>

                    {/* Stats mini grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: 'var(--bg-subtle)', padding: 12, borderRadius: 8 }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Avg Accuracy</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>{item.avg_accuracy}%</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Quizzes Taken</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>{item.total_quizzes}</div>
                      </div>
                    </div>

                    <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Correct: <strong style={{ color: 'var(--text-primary)' }}>{item.total_score}/{item.total_questions}</strong></span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontWeight: 700 }}>
                        Drill Down <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── ALL USERS PERFORMANCE & RANKING TABLE ── */}
        <section style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          
          {/* Table Toolbar */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16
          }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Users Performance &amp; Leaderboard
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Full ranking sorted by average accuracy, completed evaluations, and retention metrics.
              </p>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
              
              {/* Search bar */}
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search user or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '8px 12px 8px 34px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    minWidth: 220,
                    outline: 'none'
                  }}
                />
              </div>

              {/* Tier Filter */}
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">All Tiers</option>
                <option value="DIAMOND">Diamond (85%+)</option>
                <option value="GOLD">Gold (70%+)</option>
                <option value="SILVER">Silver (50%+)</option>
                <option value="BRONZE">Bronze</option>
                <option value="UNRANKED">Unranked</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="rank">Sort: Overall Rank</option>
                <option value="accuracy">Sort: Highest Accuracy</option>
                <option value="quizzes">Sort: Most Quizzes</option>
                <option value="videos">Sort: Most Videos</option>
                <option value="name">Sort: Name (A-Z)</option>
              </select>

            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 20px', width: 80 }}>Rank</th>
                  <th style={{ padding: '12px 20px' }}>User Details</th>
                  <th style={{ padding: '12px 16px' }}>Tier</th>
                  <th style={{ padding: '12px 16px' }}>Avg Accuracy</th>
                  <th style={{ padding: '12px 16px' }}>Quizzes Taken</th>
                  <th style={{ padding: '12px 16px' }}>Correct / Total</th>
                  <th style={{ padding: '12px 16px' }}>Best Score</th>
                  <th style={{ padding: '12px 16px' }}>Role</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                      Loading performance records...
                    </td>
                  </tr>
                ) : filteredAndSortedRankings.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                      No users match your search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedRankings.map((userItem) => {
                    const isTop1 = userItem.rank === 1;
                    const isTop2 = userItem.rank === 2;
                    const isTop3 = userItem.rank === 3;

                    return (
                      <tr
                        key={userItem.id}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Rank Badge */}
                        <td style={{ padding: '16px 20px', fontWeight: 800 }}>
                          {isTop1 ? (
                            <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '4px 8px', borderRadius: 6, fontSize: '0.8rem' }}>🥇 #1</span>
                          ) : isTop2 ? (
                            <span style={{ background: 'rgba(148, 163, 184, 0.2)', color: '#64748b', padding: '4px 8px', borderRadius: 6, fontSize: '0.8rem' }}>🥈 #2</span>
                          ) : isTop3 ? (
                            <span style={{ background: 'rgba(217, 119, 6, 0.15)', color: '#d97706', padding: '4px 8px', borderRadius: 6, fontSize: '0.8rem' }}>🥉 #3</span>
                          ) : userItem.rank ? (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>#{userItem.rank}</span>
                          ) : (
                            <span style={{ color: 'var(--text-light-muted)', fontSize: '0.78rem' }}>—</span>
                          )}
                        </td>

                        {/* User Details */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              background: '#0b326f',
                              color: '#ffffff',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              {(userItem.full_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                {userItem.full_name}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {userItem.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Tier */}
                        <td style={{ padding: '16px 16px' }}>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: `${userItem.tier_color}18`,
                            color: userItem.tier_color,
                            border: `1px solid ${userItem.tier_color}30`
                          }}>
                            {userItem.tier}
                          </span>
                        </td>

                        {/* Avg Accuracy */}
                        <td style={{ padding: '16px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 60, height: 6, background: 'var(--bg-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{
                                width: `${userItem.avg_accuracy}%`,
                                height: '100%',
                                background: userItem.avg_accuracy >= 70 ? '#10b981' : userItem.avg_accuracy >= 50 ? '#f59e0b' : '#ef4444'
                              }} />
                            </div>
                            <span style={{
                              fontWeight: 800,
                              color: userItem.avg_accuracy >= 70 ? '#10b981' : userItem.avg_accuracy >= 50 ? '#f59e0b' : userItem.avg_accuracy > 0 ? '#ef4444' : 'var(--text-muted)'
                            }}>
                              {userItem.avg_accuracy > 0 ? `${userItem.avg_accuracy}%` : '—'}
                            </span>
                          </div>
                        </td>

                        {/* Quizzes Taken */}
                        <td style={{ padding: '16px 16px', fontWeight: 700 }}>
                          {userItem.total_quizzes}
                        </td>

                        {/* Questions Correct */}
                        <td style={{ padding: '16px 16px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          {userItem.total_questions > 0 ? (
                            <span><strong style={{ color: 'var(--text-primary)' }}>{userItem.total_score}</strong> / {userItem.total_questions}</span>
                          ) : '—'}
                        </td>

                        {/* Best Score */}
                        <td style={{ padding: '16px 16px', fontWeight: 700, color: '#f59e0b' }}>
                          {userItem.best_score > 0 ? `${userItem.best_score}%` : '—'}
                        </td>

                        {/* Role */}
                        <td style={{ padding: '16px 16px' }}>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            padding: '3px 8px',
                            borderRadius: 4,
                            background: userItem.role === 'admin' ? 'rgba(11, 50, 111, 0.12)' : 'var(--bg-subtle)',
                            color: userItem.role === 'admin' ? 'var(--primary)' : 'var(--text-muted)',
                            border: `1px solid ${userItem.role === 'admin' ? 'var(--primary-border)' : 'var(--border)'}`
                          }}>
                            {userItem.role}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                            <button
                              onClick={() => openUserDetail(userItem.id)}
                              className="btn-secondary"
                              style={{ padding: '5px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <BarChart3 size={13} />
                              Telemetry
                            </button>

                            {/* Role management button */}
                            {userItem.id !== user.id && (
                              <button
                                onClick={() => handleRoleToggle(userItem)}
                                disabled={roleActionLoading}
                                className="btn-secondary"
                                title={userItem.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                                style={{ padding: '5px 8px', fontSize: '0.78rem' }}
                              >
                                {userItem.role === 'admin' ? <UserX size={13} color="#ef4444" /> : <UserCheck size={13} color="#10b981" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Showing {filteredAndSortedRankings.length} registered learner profiles</span>
            <span>Synapse AI Performance Engine v2.0</span>
          </div>

        </section>

      </main>

      {/* ── USER DEEP-DIVE MODAL ── */}
      {selectedUserId && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: 20
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            maxWidth: 720,
            width: '100%',
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#0b326f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart3 size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Learner Performance Audit
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Detailed attempts log &amp; comprehension metrics
                  </p>
                </div>
              </div>

              <button
                onClick={closeUserDetail}
                className="btn-secondary"
                style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
              {detailLoading || !userDetail ? (
                <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading learner metrics...
                </div>
              ) : (
                <>
                  {actionSuccessMsg && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', padding: '10px 14px', borderRadius: 6, marginBottom: 16, fontSize: '0.82rem', fontWeight: 600 }}>
                      {actionSuccessMsg}
                    </div>
                  )}

                  {/* User Profile Card */}
                  <div style={{ background: 'var(--bg-subtle)', padding: 18, borderRadius: 10, border: '1px solid var(--border)', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#0b326f', color: '#fff', fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {(userDetail.user.full_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {userDetail.user.full_name}
                        </h4>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {userDetail.user.email}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-light-muted)', marginTop: 2 }}>
                          Member since {userDetail.user.created_at ? new Date(userDetail.user.created_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: userDetail.user.role === 'admin' ? 'rgba(11, 50, 111, 0.15)' : 'var(--bg-surface)',
                        color: userDetail.user.role === 'admin' ? 'var(--primary)' : 'var(--text-muted)',
                        border: '1px solid var(--border)'
                      }}>
                        {userDetail.user.role}
                      </span>

                      {userDetail.user.id !== user.id && (
                        <button
                          onClick={() => handleRoleToggle(userDetail.user)}
                          disabled={roleActionLoading}
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        >
                          {userDetail.user.role === 'admin' ? 'Demote to User' : 'Make Admin'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 4 Stats Chips */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
                    <div style={{ background: 'var(--bg-subtle)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Quizzes Taken</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>{userDetail.stats.total_quizzes}</div>
                    </div>
                    <div style={{ background: 'var(--bg-subtle)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Avg Accuracy</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981' }}>{userDetail.stats.avg_accuracy}%</div>
                    </div>
                    <div style={{ background: 'var(--bg-subtle)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Best Score</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f59e0b' }}>
                        {userDetail.stats.best_score !== null ? `${userDetail.stats.best_score}%` : '—'}
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-subtle)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Active Streak</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ea580c' }}>{userDetail.stats.streak_days}d</div>
                    </div>
                  </div>

                  {/* Accuracy by Difficulty */}
                  <div style={{ marginBottom: 24 }}>
                    <h5 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' }}>
                      Accuracy by Difficulty Level
                    </h5>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                      {['easy', 'medium', 'hard'].map((diff) => {
                        const score = userDetail.stats.accuracy_by_difficulty[diff];
                        const color = diff === 'easy' ? '#10b981' : diff === 'medium' ? '#f59e0b' : '#ef4444';
                        return (
                          <div key={diff} style={{ background: 'var(--bg-subtle)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'capitalize', color: 'var(--text-muted)', marginBottom: 4 }}>
                              {diff}
                            </div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 800, color }}>
                              {score !== null ? `${score}%` : 'No attempts'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent Quiz Attempts */}
                  <div>
                    <h5 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' }}>
                      Recent Evaluation Attempts ({userDetail.stats.recent_attempts.length})
                    </h5>

                    {userDetail.stats.recent_attempts.length === 0 ? (
                      <div style={{ background: 'var(--bg-subtle)', padding: 20, borderRadius: 8, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        This user has not yet completed any interactive quizzes.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {userDetail.stats.recent_attempts.map((att, idx) => {
                          const pct = att.total_questions > 0 ? Math.round((att.score / att.total_questions) * 100) : 0;
                          return (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'var(--bg-subtle)',
                                padding: '10px 14px',
                                borderRadius: 6,
                                border: '1px solid var(--border)',
                                fontSize: '0.82rem'
                              }}
                            >
                              <div style={{ minWidth: 0, flex: 1, paddingRight: 12 }}>
                                <div style={{ fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {att.video_title}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  {att.date ? new Date(att.date).toLocaleString() : 'N/A'} • Difficulty: <strong style={{ textTransform: 'capitalize' }}>{att.difficulty}</strong>
                                </div>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontWeight: 800, color: pct >= 70 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444' }}>
                                  {att.score} / {att.total_questions} ({pct}%)
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={closeUserDetail} className="btn-secondary" style={{ padding: '8px 18px' }}>
                Close Telemetry Audit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
