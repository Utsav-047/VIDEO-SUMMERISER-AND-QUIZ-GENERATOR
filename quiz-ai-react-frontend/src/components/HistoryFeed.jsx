import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, FileVideo, ChevronRight, Loader2, Calendar, FileText, CheckCircle2, X, Copy, Check, ExternalLink } from 'lucide-react';
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
        setError(err.message || 'Failed to load video history');
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
            Review past analyzed video summaries, key takeaways, and generated quizzes.
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
          {filteredItems.map((item, idx) => {
            const isYoutube = item.source_type === 'youtube';
            const summaryContent = item.summary || item.summary_text;
            const hasQuiz = Boolean(item.quiz_id || (item.questions_json && item.questions_json.length > 0));

            // Clean excerpt for card display
            const cleanExcerpt = summaryContent
              ? summaryContent.replace(/^##\s+.*?$/gm, '').replace(/[#*_`]/g, '').trim().slice(0, 190) + '...'
              : 'Summary processed. Click to read full notes.';

            return (
              <div
                key={item.id || item.video_id || idx}
                id={`history-card-${idx}`}
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.18s ease',
                  boxShadow: 'var(--shadow-sm)',
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isYoutube ? <YoutubeIcon size={16} /> : <FileVideo size={16} color="var(--primary)" />}
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        {item.source_type || 'Video'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {hasQuiz && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                          <CheckCircle2 size={11} /> Quiz
                        </span>
                      )}
                      {item.created_at && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          <Calendar size={12} />
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.title || item.source_ref || 'Untitled Video'}
                  </h4>

                  {summaryContent && (
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '16px' }}>
                      {cleanExcerpt}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
                  {summaryContent && (
                    <button
                      type="button"
                      id={`preview-summary-btn-${idx}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewItem(item);
                      }}
                      className="btn-secondary"
                      style={{ flex: 1, padding: '7px 10px', fontSize: '0.8rem', justifyContent: 'center' }}
                    >
                      <FileText size={14} color="var(--primary)" />
                      <span>View Summary</span>
                    </button>
                  )}

                  <button
                    type="button"
                    id={`open-studio-btn-${idx}`}
                    onClick={() => onSelectVideo(item)}
                    className="btn-primary"
                    style={{ flex: 1, padding: '7px 10px', fontSize: '0.8rem', justifyContent: 'center' }}
                  >
                    <span>Open in Studio</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Summary Modal for Instant Reading in History */}
      {previewItem && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            backdropFilter: 'blur(3px)',
          }}
          onClick={() => setPreviewItem(null)}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              width: '100%',
              maxWidth: '750px',
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
                <span className="tag-badge" style={{ marginBottom: '4px' }}>SAVED SUMMARY</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {previewItem.title || previewItem.source_ref || 'Video Summary'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '6px', borderRadius: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
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
