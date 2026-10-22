import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  BarChart2, Trophy, Flame, Target, Loader2, Award,
  CheckCircle2, Clock, Calendar, ArrowRight, Video,
  TrendingUp, AlertCircle, ShieldCheck
} from 'lucide-react';

export default function PerformanceStats() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const getProficiencyStatus = (acc) => {
    if (acc === null || acc === undefined) return { label: 'No Attempts', color: 'var(--text-muted)', bg: 'var(--bg-subtle)' };
    if (acc >= 75) return { label: 'Proficient (75%+)', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' };
    if (acc >= 50) return { label: 'Developing (50-74%)', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' };
    return { label: 'Needs Review (<50%)', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' };
  };

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', width: '100%' }}>
      
      {/* ── HEADER (Responsive flex) ── */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.75rem)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Learning Analytics &amp; Telemetry
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Comprehensive overview of your study velocity, comprehension metrics, and quiz attempts.
          </p>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#10b981', letterSpacing: '0.04em' }}>
            ACCOUNT TELEMETRY ACTIVE
          </span>
        </div>
      </div>

      {/* ── 4 STAT METRIC CARDS (Responsive Grid) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Card 1: Quizzes Taken */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 22px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              Quizzes Taken
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target size={16} color="var(--primary)" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {total_quizzes}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
            Total completed quizzes
          </div>
        </div>

        {/* Card 2: Average Accuracy */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 22px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              Average Accuracy
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={16} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: avg_accuracy >= 70 ? '#10b981' : avg_accuracy >= 50 ? '#f59e0b' : '#ef4444', lineHeight: 1 }}>
            {avg_accuracy}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
            Cumulative correct answer rate
          </div>
        </div>

        {/* Card 3: Best Score */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 22px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              Best Score
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trophy size={16} color="#f59e0b" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>
            {best_score !== null ? `${best_score}%` : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
            Highest single quiz score
          </div>
        </div>

        {/* Card 4: Study Streak */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 22px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              Study Streak
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(244, 63, 94, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={16} color="#f43f5e" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f43f5e', lineHeight: 1 }}>
            {streak_days} <span style={{ fontSize: '1rem', fontWeight: 700 }}>Days</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
            Consecutive activity streak
          </div>
        </div>
      </div>

      {/* ── DIFFICULTY BREAKDOWN SECTION (Real Educational Telemetry, Fully Responsive) ── */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '24px',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Accuracy by Difficulty Tier
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Quantified recall performance across question complexity levels.
            </p>
          </div>

          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            Benchmark: 70% Target
          </span>
        </div>

        {/* Responsive 3-Card Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {[
            {
              tierKey: 'easy',
              title: 'Easy Tier',
              badgeColor: '#10b981',
              val: accuracy_by_difficulty.easy,
              details: difficulty_details.easy || {},
            },
            {
              tierKey: 'medium',
              title: 'Medium Tier',
              badgeColor: 'var(--primary)',
              val: accuracy_by_difficulty.medium,
              details: difficulty_details.medium || {},
            },
            {
              tierKey: 'hard',
              title: 'Hard Tier',
              badgeColor: '#f43f5e',
              val: accuracy_by_difficulty.hard,
              details: difficulty_details.hard || {},
            },
          ].map(({ tierKey, title, badgeColor, val, details }) => {
            const hasData = val !== null && val !== undefined;
            const status = getProficiencyStatus(val);
            const correctCount = details.correct || 0;
            const totalCount = details.total || 0;
            const attemptsCount = details.attempts || 0;

            return (
              <div
                key={tierKey}
                style={{
                  background: 'var(--bg-subtle)',
                  borderRadius: 10,
                  padding: '18px 20px',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                }}
              >
                <div>
                  {/* Card Header: Tier name & Status Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: badgeColor }} />
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {title}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 4,
                        color: status.color,
                        background: status.bg,
                        border: `1px solid ${status.color}33`,
                      }}
                    >
                      {status.label}
                    </span>
                  </div>

                  {/* Big Percentage + Ratio */}
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: hasData ? badgeColor : 'var(--text-muted)', lineHeight: 1 }}>
                      {hasData ? `${val}%` : '—'}
                    </div>

                    {totalCount > 0 ? (
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        {correctCount} / {totalCount} correct
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        No questions answered
                      </span>
                    )}
                  </div>

                  {/* Stepped Progress Bar */}
                  <div style={{ width: '100%', height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
                    <div
                      style={{
                        height: '100%',
                        width: hasData ? `${Math.min(val, 100)}%` : '0%',
                        background: badgeColor,
                        borderRadius: 4,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>

                {/* Subtext info footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 8 }}>
                  <span>
                    {attemptsCount > 0 ? `${attemptsCount} session${attemptsCount === 1 ? '' : 's'}` : 'Not attempted'}
                  </span>
                  <span>
                    {hasData ? (val >= 70 ? '✓ Meeting standard' : 'Needs reinforcement') : 'Pending first attempt'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RECENT QUIZ ATTEMPTS TABLE (Responsive with Formatted Dates) ── */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '24px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Recent Quiz Attempts
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Detailed audit trail of your verified comprehension assessments.
            </p>
          </div>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
            {recent_attempts.length} Recorded Attempts
          </span>
        </div>

        {recent_attempts && recent_attempts.length > 0 ? (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem', minWidth: 620 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '12px 14px', fontWeight: 800 }}>Video Source</th>
                  <th style={{ padding: '12px 14px', fontWeight: 800 }}>Difficulty</th>
                  <th style={{ padding: '12px 14px', fontWeight: 800 }}>Score</th>
                  <th style={{ padding: '12px 14px', fontWeight: 800 }}>Accuracy</th>
                  <th style={{ padding: '12px 14px', fontWeight: 800 }}>Date Attempted</th>
                </tr>
              </thead>
              <tbody>
                {recent_attempts.map((att, idx) => {
                  const pct = att.total_questions > 0 ? Math.round((att.score / att.total_questions) * 100) : 0;
                  const formattedDate = formatAttemptDate(att.created_at || att.date);
                  const diffColor = att.difficulty === 'easy' ? '#10b981' : att.difficulty === 'hard' ? '#f43f5e' : 'var(--primary)';

                  return (
                    <tr
                      key={att.attempt_id || idx}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-primary)', maxWidth: 360 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Video size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={att.video_title}>
                            {att.video_title || 'Video Quiz Attempt'}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 4,
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            background: `${diffColor}18`,
                            color: diffColor,
                            border: `1px solid ${diffColor}33`,
                          }}
                        >
                          {att.difficulty || 'Medium'}
                        </span>
                      </td>

                      <td style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {att.score} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>/ {att.total_questions}</span>
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 4,
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            background: pct >= 70 ? 'rgba(16, 185, 129, 0.12)' : pct >= 50 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: pct >= 70 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444',
                            border: `1px solid ${pct >= 70 ? 'rgba(16, 185, 129, 0.25)' : pct >= 50 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                          }}
                        >
                          {pct}%
                        </span>
                      </td>

                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.82rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={13} color="var(--text-muted)" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)' }}>
            <Award size={36} color="var(--border-strong)" style={{ margin: '0 auto 10px' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              No Quiz Attempts Yet
            </h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              Process a video in the Studio and complete your first comprehension quiz to populate your telemetry.
            </p>
            <button type="button" onClick={() => navigate('/app')} className="btn-primary" style={{ fontSize: '0.84rem' }}>
              <span>Go to Studio</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
