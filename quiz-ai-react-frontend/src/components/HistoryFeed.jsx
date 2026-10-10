import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, FileVideo, ChevronRight, Loader2, Calendar } from 'lucide-react';

function YoutubeIcon({ size = 16, color = '#ef4444' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ color, flexShrink: 0 }}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

export default function HistoryFeed({ onSelectVideo }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchHistory = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.getHistory();
        setHistoryItems(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Failed to load video history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  if (!user) {
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '48px 32px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>Log In to View Library</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px', maxWidth: '420px', margin: '0 auto 20px' }}>
          Your processed video summaries, transcripts, and quiz score history will automatically appear here once you sign in.
        </p>
        <button id="history-login-btn" onClick={() => navigate('/login')} className="btn-primary">
          Sign In Now
        </button>
      </div>
    );
  }

  const filteredItems = historyItems.filter((item) =>
    (item.title || item.source_ref || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
      {/* Title & Search bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>Video Library &amp; History</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Review past analyzed videos, summaries, and generated quizzes.
          </p>
        </div>

        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            id="history-search-input"
            type="text"
            placeholder="Search by video title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="clean-input"
            style={{ paddingLeft: '36px', height: '38px', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: '10px', color: 'var(--text-muted)' }}>
          <Loader2 size={20} className="animate-spin" color="var(--primary)" />
          <span style={{ fontSize: '0.9rem' }}>Loading library...</span>
        </div>
      ) : error ? (
        <div style={{ padding: '20px', background: '#fef2f2', borderRadius: '6px', color: '#b91c1c', textAlign: 'center', fontSize: '0.88rem' }}>
          {error}
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
          <FileVideo size={40} color="var(--border-strong)" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>No Videos in History Yet</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {searchTerm ? 'No results match your search term.' : 'Process your first YouTube video or upload a file in the Studio!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {filteredItems.map((item, idx) => {
            const isYoutube = item.source_type === 'youtube';
            return (
              <div
                key={item.id || idx}
                id={`history-card-${idx}`}
                onClick={() => onSelectVideo(item)}
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.background = 'var(--bg-surface)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'var(--bg-subtle)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isYoutube ? <YoutubeIcon size={16} /> : <FileVideo size={16} color="var(--primary)" />}
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        {item.source_type || 'Video'}
                      </span>
                    </div>

                    {item.created_at && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <Calendar size={12} />
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.title || item.source_ref || 'Untitled Video'}
                  </h4>

                  {item.summary && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '14px' }}>
                      {item.summary.replace(/[#*_-]/g, '')}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>Open Summary &amp; Quiz</span>
                  <ChevronRight size={15} color="var(--primary)" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
