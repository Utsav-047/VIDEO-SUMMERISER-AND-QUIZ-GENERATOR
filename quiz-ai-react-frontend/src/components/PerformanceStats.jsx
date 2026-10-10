import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BarChart2, Trophy, Flame, Target, Loader2, Award, Layers } from 'lucide-react';

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
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '48px 32px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>Log In to View Analytics</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px', maxWidth: '420px', margin: '0 auto 20px' }}>
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
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '48px', textAlign: 'center' }}>
        <Loader2 size={24} className="animate-spin" color="var(--primary)" style={{ margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading analytics telemetry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '32px', textAlign: 'center', color: '#ef4444' }}>
        <p>{error}</p>
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

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
      {/* Title */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '28px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>Learning Analytics &amp; Telemetry</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Comprehensive overview of your study velocity and quiz accuracy.
          </p>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{ background: 'var(--bg-subtle)', padding: '18px', borderRadius: '6px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: '6px' }}>Quizzes Taken</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>{total_quizzes}</div>
        </div>

        <div style={{ background: 'var(--bg-subtle)', padding: '18px', borderRadius: '6px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: '6px' }}>Average Accuracy</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>{avg_accuracy}%</div>
        </div>

        <div style={{ background: 'var(--bg-subtle)', padding: '18px', borderRadius: '6px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: '6px' }}>Best Score</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b' }}>{best_score !== null ? `${best_score}%` : '—'}</div>
        </div>

        <div style={{ background: 'var(--bg-subtle)', padding: '18px', borderRadius: '6px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: '6px' }}>Study Streak</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f43f5e' }}>{streak_days} Days</div>
        </div>
      </div>

      {/* Difficulty Breakdown */}
      <div style={{ background: 'var(--bg-subtle)', padding: '20px', borderRadius: '6px', border: '1px solid var(--border)', marginBottom: '28px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '14px' }}>Accuracy by Difficulty Tier</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {[
            { level: 'Easy', val: accuracy_by_difficulty.easy, color: '#10b981' },
            { level: 'Medium', val: accuracy_by_difficulty.medium, color: 'var(--primary)' },
            { level: 'Hard', val: accuracy_by_difficulty.hard, color: '#f43f5e' },
          ].map((tier) => (
            <div key={tier.level}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{tier.level}</span>
                <span style={{ fontWeight: 800, color: tier.color }}>{tier.val !== null ? `${tier.val}%` : 'Not attempted'}</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: tier.val !== null ? `${tier.val}%` : '0%', background: tier.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Attempts */}
      {recent_attempts && recent_attempts.length > 0 && (
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>Recent Quiz Attempts</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 14px' }}>Video Source</th>
                  <th style={{ padding: '10px 14px' }}>Difficulty</th>
                  <th style={{ padding: '10px 14px' }}>Score</th>
                  <th style={{ padding: '10px 14px' }}>Accuracy</th>
                  <th style={{ padding: '10px 14px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recent_attempts.map((att, idx) => {
                  const pct = Math.round((att.score / att.total_questions) * 100);
                  return (
                    <tr key={att.attempt_id || idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>{att.video_title || 'Video Quiz'}</td>
                      <td style={{ padding: '10px 14px', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{att.difficulty || 'Medium'}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700 }}>{att.score} / {att.total_questions}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '2px 6px', borderRadius: 4, fontWeight: 700, background: pct >= 70 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: pct >= 70 ? '#10b981' : '#ef4444' }}>
                          {pct}%
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{att.created_at ? new Date(att.created_at).toLocaleDateString() : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
