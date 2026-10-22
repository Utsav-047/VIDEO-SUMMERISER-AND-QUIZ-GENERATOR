import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  BarChart2, Trophy, Flame, Target, Loader2, Award,
  CheckCircle2, Clock, Calendar, ArrowRight, Video,
  TrendingUp, AlertCircle, ShieldCheck, Check, Lightbulb
} from 'lucide-react';

export default function PerformanceStats() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attemptSearch, setAttemptSearch] = useState('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.getPerformance();
        setStats(data);
      } catch (err) {
        setError(err.message || 'Failed to load performance metrics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  if (!user) {
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '48px 32px', textAlign: 'center', boxShadow: 'var(--shadow-md)', maxWidth: 600, margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>Log In to View Analytics</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
          Track your overall comprehension scores, completed quizzes, and retention across difficulty levels.
        </p>
        <button id="perf-login-btn" onClick={() => navigate('/login')} className="btn-primary">
          Sign In Now
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '60px 20px', textAlign: 'center', maxWidth: 980, margin: '0 auto' }}>
        <Loader2 size={24} className="animate-spin" color="var(--primary)" style={{ margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Loading learning telemetry &amp; quiz analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: 'rgba(239, 68, 68, 0.10)', border: '1px solid rgba(239, 68, 68, 0.35)', color: 'var(--accent-red)', padding: '24px', borderRadius: 12, textAlign: 'center', maxWidth: 980, margin: '0 auto' }}>
        <p style={{ fontWeight: 600 }}>{error}</p>
      </div>
    );
  }

  const {
    total_quizzes = 0,
    avg_accuracy = 0,
    best_score = 0,
    streak_days = 0,
    accuracy_by_difficulty = { easy: null, medium: null, hard: null },
    difficulty_details = {},
    recent_attempts = [],
  } = stats || {};

  const formatAttemptDate = (rawDate) => {
    if (!rawDate || rawDate === 'Today' || rawDate === '—') return 'Today';
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return 'Recently';
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recently';
    }
  };

  const getTierStatus = (acc) => {
    if (acc === null || acc === undefined) return { label: 'Unattempted', color: 'var(--text-muted)', bg: 'var(--bg-subtle)' };
    if (acc >= 75) return { label: 'Proficient', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' };
    if (acc >= 50) return { label: 'Developing', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' };
    return { label: 'Needs Practice', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' };
  };

  // Filter recent attempts if user types query
  const filteredAttempts = recent_attempts.filter((att) =>
    (att.video_title || '').toLowerCase().includes(attemptSearch.trim().toLowerCase())
  );

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', width: '100%' }}>
      
      {/* ── TOP HEADER ── */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.75rem)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Learning Analytics &amp; Telemetry
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Real-time tracking of study velocity, question retention, and comprehension milestones.
          </p>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#10b981', letterSpacing: '0.04em' }}>
            ACCOUNT TELEMETRY ACTIVE
          </span>
        </div>
      </div>

      {/* ── 4 KPI STAT METRICS STRIP ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 22 }}>
        {/* KPI 1 */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              Quizzes Taken
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target size={14} color="var(--primary)" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {total_quizzes}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
            Completed assessments
          </div>
        </div>

        {/* KPI 2 */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              Avg Accuracy
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={14} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: avg_accuracy >= 70 ? '#10b981' : avg_accuracy >= 50 ? '#f59e0b' : '#ef4444', lineHeight: 1 }}>
            {avg_accuracy}%
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
            Across all attempts
          </div>
        </div>

        {/* KPI 3 */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              Best Score
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trophy size={14} color="#f59e0b" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>
            {best_score !== null ? `${best_score}%` : '—'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
            Highest single quiz
          </div>
        </div>

        {/* KPI 4 */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              Study Streak
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(244, 63, 94, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={14} color="#f43f5e" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f43f5e', lineHeight: 1 }}>
            {streak_days} <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Days</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
            Consecutive activity
          </div>
        </div>
      </div>

      {/* ── 2-COLUMN EXECUTIVE DASHBOARD GRID (Responsive on Mobile & Desktop) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
          gap: 20,
          alignItems: 'start',
        }}
      >
        
        {/* ── LEFT COLUMN: DIFFICULTY & COMPREHENSION MATRIX ── */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '22px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          {/* Section Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Accuracy by Difficulty Tier
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Quantified recall performance per question tier
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '2px 8px', borderRadius: 4 }}>
              70% Benchmark
            </span>
          </div>

          {/* 3 Difficulty Tiers Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              {
                tierKey: 'easy',
                label: 'EASY',
                badgeColor: '#10b981',
                val: accuracy_by_difficulty.easy,
                details: difficulty_details.easy || {},
              },
              {
                tierKey: 'medium',
                label: 'MEDIUM',
                badgeColor: 'var(--primary)',
                val: accuracy_by_difficulty.medium,
                details: difficulty_details.medium || {},
              },
              {
                tierKey: 'hard',
                label: 'HARD',
                badgeColor: '#f43f5e',
                val: accuracy_by_difficulty.hard,
                details: difficulty_details.hard || {},
              },
            ].map(({ tierKey, label, badgeColor, val, details }) => {
              const hasData = val !== null && val !== undefined;
              const status = getTierStatus(val);
              const correctCount = details.correct || 0;
              const totalCount = details.total || 0;
              const attemptsCount = details.attempts || 0;

              return (
                <div
                  key={tierKey}
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: `${badgeColor}18`,
                          color: badgeColor,
                          border: `1px solid ${badgeColor}33`,
                          letterSpacing: '0.04em',
                        }}
                      >
                        {label}
                      </span>
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        {attemptsCount > 0 ? `${attemptsCount} session${attemptsCount === 1 ? '' : 's'}` : 'No sessions'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: hasData ? badgeColor : 'var(--text-muted)' }}>
                        {hasData ? `${val}%` : '—'}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: 4,
                          color: status.color,
                          background: status.bg,
                        }}
                      >
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div style={{ width: '100%', height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                    <div
                      style={{
                        height: '100%',
                        width: hasData ? `${Math.min(val, 100)}%` : '0%',
                        background: badgeColor,
                        borderRadius: 3,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>

                  {/* Sub Info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    <span>{totalCount > 0 ? `${correctCount} of ${totalCount} questions correct` : 'Pending questions'}</span>
                    <span>{hasData ? (val >= 70 ? '✓ Meeting target' : 'Needs reinforcement') : '—'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Diagnostic Takeaway Callout */}
          <div
            style={{
              background: 'var(--primary-light)',
              border: '1px solid var(--primary-border)',
              borderRadius: 8,
              padding: '14px 16px',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <Lightbulb size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              <strong>Mastery Recommendation:</strong>{' '}
              {accuracy_by_difficulty.easy && accuracy_by_difficulty.easy >= 60
                ? 'Your foundation on Easy tier questions is solid. Focus future quizzes on Medium and Hard complexity to elevate your overall comprehension above 70%.'
                : 'Complete more quizzes across varied subjects to establish a high-accuracy baseline above the 70% proficiency threshold.'}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: RECENT ASSESSMENT AUDIT TRAIL ── */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '22px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {/* Header & Mini Search */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Recent Quiz Attempts
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Audit log of completed evaluations
              </span>
            </div>

            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '2px 8px', borderRadius: 4 }}>
              {recent_attempts.length} Recorded
            </span>
          </div>

          {/* Table Container */}
          {recent_attempts && recent_attempts.length > 0 ? (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxHeight: 460, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.04em', position: 'sticky', top: 0, background: 'var(--bg-surface)' }}>
                    <th style={{ padding: '8px 10px', fontWeight: 800 }}>Video Title</th>
                    <th style={{ padding: '8px 10px', fontWeight: 800 }}>Tier</th>
                    <th style={{ padding: '8px 10px', fontWeight: 800 }}>Score</th>
                    <th style={{ padding: '8px 10px', fontWeight: 800 }}>Accuracy</th>
                    <th style={{ padding: '8px 10px', fontWeight: 800 }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttempts.map((att, idx) => {
                    const pct = att.total_questions > 0 ? Math.round((att.score / att.total_questions) * 100) : 0;
                    const formattedDate = formatAttemptDate(att.created_at || att.date);
                    const diffColor = att.difficulty === 'easy' ? '#10b981' : att.difficulty === 'hard' ? '#f43f5e' : 'var(--primary)';

                    return (
                      <tr
                        key={att.attempt_id || idx}
                        style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.1s ease' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '10px 10px', fontWeight: 600, color: 'var(--text-primary)', maxWidth: 220 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Video size={13} color="var(--primary)" style={{ flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={att.video_title}>
                              {att.video_title || 'Video Quiz'}
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: '10px 10px' }}>
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              background: `${diffColor}18`,
                              color: diffColor,
                              border: `1px solid ${diffColor}33`,
                            }}
                          >
                            {att.difficulty || 'Medium'}
                          </span>
                        </td>

                        <td style={{ padding: '10px 10px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                          {att.score} / {att.total_questions}
                        </td>

                        <td style={{ padding: '10px 10px' }}>
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontWeight: 800,
                              fontSize: '0.74rem',
                              background: pct >= 70 ? 'rgba(16, 185, 129, 0.12)' : pct >= 50 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: pct >= 70 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444',
                            }}
                          >
                            {pct}%
                          </span>
                        </td>

                        <td style={{ padding: '10px 10px', color: 'var(--text-muted)', fontSize: '0.76rem', whiteSpace: 'nowrap' }}>
                          {formattedDate}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
              <Award size={32} color="var(--border-strong)" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                No Quiz Attempts Recorded
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                Take your first quiz in the Studio to generate telemetry.
              </p>
              <button type="button" onClick={() => navigate('/app')} className="btn-primary" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
                <span>Studio</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
