import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Search, FileVideo, ChevronRight, Loader2, Calendar, FileText,
  CheckCircle2, X, Copy, Check, ExternalLink, Filter, Sparkles
} from 'lucide-react';
import { FormattedSummaryContent } from './SummaryViewer';

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
  const [filterType, setFilterType] = useState('all'); // 'all' | 'youtube' | 'upload' | 'quiz'
  const [previewItem, setPreviewItem] = useState(null);
  const [copied, setCopied] = useState(false);

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
        setError(err.message || 'Failed to load video library');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  const handleCopySummary = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Robust Search & Filter Logic
  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return historyItems.filter((item) => {
      // 1. Type Filter
      if (filterType === 'youtube' && item.source_type !== 'youtube') return false;
      if (filterType === 'upload' && item.source_type !== 'upload') return false;
      if (filterType === 'quiz') {
        const hasQuiz = Boolean(item.quiz_id || (item.questions_json && item.questions_json.length > 0));
        if (!hasQuiz) return false;
      }

      // 2. Query Search (searches title primarily, then summary excerpt)
      if (!query) return true;

      const titleMatch = (item.title || '').toLowerCase().includes(query);
      const summaryMatch = (item.summary || item.summary_text || '').toLowerCase().includes(query);
      const formatMatch = (item.difficulty || '').toLowerCase().includes(query);

      return titleMatch || summaryMatch || formatMatch;
    });
  }, [historyItems, searchTerm, filterType]);

  if (!user) {
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '48px 32px', textAlign: 'center', boxShadow: 'var(--shadow-md)' }}>
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

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto' }}>
      
      {/* ── HEADER & SEARCH TOOLBAR ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
              Video Library &amp; History
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Review past analyzed video summaries, key takeaways, and generated quizzes.
            </p>
          </div>

          {/* Search Box with Clear Button */}
          <div style={{ position: 'relative', width: '100%', maxWidth: 320 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              id="history-search-input"
              type="text"
              placeholder="Search by title or topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="clean-input"
              style={{
                paddingLeft: 38,
                paddingRight: searchTerm ? 36 : 14,
                height: 42,
                fontSize: '0.88rem',
                borderRadius: 8,
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills Bar & Counter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, paddingTop: 4 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Videos', count: historyItems.length },
              { id: 'youtube', label: 'YouTube', count: historyItems.filter((i) => i.source_type === 'youtube').length },
              { id: 'upload', label: 'Uploaded Files', count: historyItems.filter((i) => i.source_type === 'upload').length },
              { id: 'quiz', label: 'With Quizzes', count: historyItems.filter((i) => Boolean(i.quiz_id || (i.questions_json && i.questions_json.length > 0))).length },
            ].map((f) => {
              const isActive = filterType === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterType(f.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 20,
                    border: `1px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`,
                    background: isActive ? 'var(--primary-light)' : 'var(--bg-surface)',
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{f.label}</span>
                  <span style={{ fontSize: '0.72rem', opacity: 0.75, background: 'var(--bg-subtle)', padding: '1px 6px', borderRadius: 10 }}>
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Search / Filter Indicator */}
          {searchTerm && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>
                Found <strong>{filteredItems.length}</strong> matching "{searchTerm}"
              </span>
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '0.8rem',
                }}
              >
                Clear filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      {loading ? (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '60px 20px', textAlign: 'center' }}>
          <Loader2 size={24} className="animate-spin" color="var(--primary)" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Loading video library...</p>
        </div>
      ) : error ? (
        <div style={{ background: 'rgba(239, 68, 68, 0.10)', border: '1px solid rgba(239, 68, 68, 0.35)', color: 'var(--accent-red)', padding: '24px', borderRadius: 12, textAlign: 'center', fontSize: '0.9rem' }}>
          {error}
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <FileVideo size={42} color="var(--border-strong)" style={{ margin: '0 auto 14px' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
            {searchTerm ? 'No Matching Videos Found' : 'No Videos in Library Yet'}
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: 420, margin: '0 auto 20px' }}>
            {searchTerm
              ? `We couldn't find any videos matching "${searchTerm}". Try a different title or clear your search.`
              : 'Synthesize your first lecture or upload a recording in the Studio to build your knowledge library.'}
          </p>
          {searchTerm ? (
            <button type="button" onClick={() => setSearchTerm('')} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
              Clear Search
            </button>
          ) : (
            <button type="button" onClick={() => navigate('/app')} className="btn-primary" style={{ fontSize: '0.85rem' }}>
              Go to Studio
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
          {filteredItems.map((item, idx) => {
            const isYoutube = item.source_type === 'youtube';
            const summaryContent = item.summary || item.summary_text;
            const hasQuiz = Boolean(item.quiz_id || (item.questions_json && item.questions_json.length > 0));

            // Clean excerpt
            const cleanExcerpt = summaryContent
              ? summaryContent.replace(/^##\s+.*?$/gm, '').replace(/[#*_`]/g, '').trim().slice(0, 160) + '...'
              : 'Summary notes ready for review in Studio.';

            // Format date cleanly
            const dateStr = item.created_at
              ? new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Recent';

            return (
              <div
                key={item.id || item.video_id || idx}
                id={`history-card-${idx}`}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                <div>
                  {/* Top Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isYoutube ? <YoutubeIcon size={16} /> : <FileVideo size={16} color="var(--primary)" />}
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                        {item.source_type || 'Video'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {hasQuiz && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: 4 }}>
                          <CheckCircle2 size={11} /> Quiz
                        </span>
                      )}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        <Calendar size={11} />
                        {dateStr}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontSize: '0.96rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      marginBottom: 8,
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                    title={item.title || item.source_ref}
                  >
                    {item.title || item.source_ref || 'Untitled Video'}
                  </h3>

                  {/* Excerpt */}
                  <p
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.55,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      marginBottom: 16,
                    }}
                  >
                    {cleanExcerpt}
                  </p>
                </div>

                {/* Bottom Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 14, borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
                  {summaryContent && (
                    <button
                      type="button"
                      id={`preview-summary-btn-${idx}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewItem(item);
                      }}
                      className="btn-secondary"
                      style={{ flex: 1, padding: '7px 10px', fontSize: '0.8rem', justifyContent: 'center', borderRadius: 6 }}
                    >
                      <FileText size={13} color="var(--primary)" />
                      <span>Summary</span>
                    </button>
                  )}

                  <button
                    type="button"
                    id={`open-studio-btn-${idx}`}
                    onClick={() => onSelectVideo(item)}
                    className="btn-primary"
                    style={{ flex: 1.2, padding: '7px 12px', fontSize: '0.8rem', justifyContent: 'center', borderRadius: 6 }}
                  >
                    <span>Open Studio</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── QUICK SUMMARY MODAL ── */}
      {previewItem && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setPreviewItem(null)}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 12,
              border: '1px solid var(--border)',
              width: '100%',
              maxWidth: 720,
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
              <div>
                <span className="tag-badge" style={{ marginBottom: 4 }}>SAVED SUMMARY</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {previewItem.title || previewItem.source_ref || 'Video Summary'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6, borderRadius: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
              <FormattedSummaryContent summary={previewItem.summary || previewItem.summary_text} fontSize="0.94rem" />
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
              <button
                type="button"
                onClick={() => handleCopySummary(previewItem.summary || previewItem.summary_text)}
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.84rem' }}
              >
                {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy Summary'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const target = previewItem;
                  setPreviewItem(null);
                  onSelectVideo(target);
                }}
                className="btn-primary"
                style={{ padding: '8px 18px', fontSize: '0.85rem' }}
              >
                <span>Launch in Studio &amp; Take Quiz</span>
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
