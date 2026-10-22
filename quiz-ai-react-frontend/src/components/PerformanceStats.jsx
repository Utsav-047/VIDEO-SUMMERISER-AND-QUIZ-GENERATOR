import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  BarChart2, Trophy, Flame, Target, Loader2, Award,
  CheckCircle2, Clock, Calendar, ArrowRight, Video, Sparkles
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

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto' }}>
      
      {/* ── HEADER ── */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
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

      {/* ── 4 STAT METRIC CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Card 1: Quizzes Taken */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '20px 22px',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.15s ease',
          }}
        >
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
            Total evaluated sessions
          </div>
        </div>

        {/* Card 2: Average Accuracy */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '20px 22px',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.15s ease',
          }}
        >
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
            Cumulative questions answered correctly
          </div>
        </div>

        {/* Card 3: Best Score */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '20px 22px',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.15s ease',
          }}
        >
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
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '20px 22px',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.15s ease',
          }}
        >
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
            Consecutive study activity
          </div>
        </div>
      </div>

      {/* ── DIFFICULTY BREAKDOWN SECTION ── */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '22px 26px',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Accuracy by Difficulty Tier
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Based on completed assessment sets
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {[
            { level: 'Easy', emoji: '🌱', val: accuracy_by_difficulty.easy, color: '#10b981', desc: 'Foundational concepts' },
            { level: 'Medium', emoji: '⚡', val: accuracy_by_difficulty.medium, color: 'var(--primary)', desc: 'Applied comprehension' },
            { level: 'Hard', emoji: '🔥', val: accuracy_by_difficulty.hard, color: '#f43f5e', desc: 'Complex reasoning' },
          ].map((tier) => (
            <div
              key={tier.level}
              style={{
                background: 'var(--bg-subtle)',
                borderRadius: 8,
                padding: '16px',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{tier.emoji}</span>
                  <span>{tier.level}</span>
                </span>
                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: tier.color, background: 'var(--bg-surface)', padding: '2px 8px', borderRadius: 6, border: '1px solid var(--border)' }}>
                  {tier.val !== null ? `${tier.val}%` : 'No attempts'}
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', height: 7, background: 'var(--border)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                <div
                  style={{
                    height: '100%',
                    width: tier.val !== null ? `${tier.val}%` : '0%',
                    background: tier.color,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>

              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {tier.desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RECENT QUIZ ATTEMPTS TABLE (With Correct Formatted Date) ── */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '24px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Recent Quiz Attempts
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Detailed audit trail of your recent comprehension tests.
            </p>
          </div>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '4px 10px', borderRadius: 6 }}>
            {recent_attempts.length} Recorded
          </span>
        </div>

        {recent_attempts && recent_attempts.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '12px 14px', fontWeight: 800 }}>Video Source</th>
                  <th style={{ padding: '12px 14px', fontWeight: 800 }}>Difficulty</th>
                  <th style={{ padding: '12px 14px', fontWeight: 800 }}>Score</th>
                  <th style={{ padding: '12px 14px', fontWeight: 800 }}>Accuracy</th>
                  <th style={{ padding: '12px 14px', fontWeight: 800 }}>Attempt Date</th>
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
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-primary)', maxWidth: 380 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Video size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                            textTransform: 'capitalize',
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
