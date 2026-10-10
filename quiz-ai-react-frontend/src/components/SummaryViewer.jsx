import React, { useState } from 'react';
import { Copy, Check, Download, BookOpen, ChevronDown, ChevronUp, FileText, Clock } from 'lucide-react';

export default function SummaryViewer({ title, summary, transcript, onStartQuiz }) {
  const [copied, setCopied] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const wordCount = summary ? summary.split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!summary) return;
    const blob = new Blob([`# ${title}\n\n## AI Executive Summary\n\n${summary}\n\n---\n\n## Full Transcript\n\n${transcript || ''}`], {
      type: 'text/markdown',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(title || 'video_summary').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatSummaryText = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} style={{ height: '10px' }} />;

      if (trimmed.startsWith('### ')) {
        return <h4 key={idx} style={{ fontSize: '1.1rem', color: 'var(--primary)', marginTop: '18px', marginBottom: '8px', fontWeight: 700 }}>{trimmed.replace(/^###\s+/, '')}</h4>;
      }
      if (trimmed.startsWith('## ')) {
        return <h3 key={idx} style={{ fontSize: '1.25rem', color: 'var(--primary)', marginTop: '22px', marginBottom: '10px', fontWeight: 800 }}>{trimmed.replace(/^##\s+/, '')}</h3>;
      }
      if (trimmed.startsWith('# ')) {
        return <h2 key={idx} style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginTop: '24px', marginBottom: '12px', fontWeight: 800 }}>{trimmed.replace(/^#\s+/, '')}</h2>;
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
        const bulletText = trimmed.replace(/^[-*]\s+|\d+\.\s+/, '');
        return (
          <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '6px', paddingLeft: '6px' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>&bull;</span>
            <span style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.92rem' }}>{bulletText}</span>
          </div>
        );
      }
      return <p key={idx} style={{ color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '8px', fontSize: '0.92rem' }}>{trimmed}</p>;
    });
  };

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '32px', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', paddingBottom: '20px', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="tag-badge">EXECUTIVE SUMMARY</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>~{readingTime} min read &bull; {wordCount} words</span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{title || 'Generated Summary'}</h2>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button id="copy-summary-btn" onClick={handleCopy} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
            {copied ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button id="download-summary-btn" onClick={handleDownload} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
            <Download size={15} />
            <span>Export</span>
          </button>

          {onStartQuiz && (
            <button id="start-quiz-cta-btn" onClick={onStartQuiz} className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
              <FileText size={15} />
              <span>Launch Quiz</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Content Body */}
      <div style={{ background: 'var(--bg-subtle)', borderRadius: '8px', padding: '24px', border: '1px solid var(--border)' }}>
        {formatSummaryText(summary)}
      </div>

      {/* Expandable Transcript */}
      {transcript && (
        <div style={{ marginTop: '20px' }}>
          <button
            id="toggle-transcript-btn"
            onClick={() => setShowTranscript(!showTranscript)}
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'space-between', padding: '12px 16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={16} color="var(--primary)" />
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>Full Video Transcript ({transcript.split(/\s+/).length} words)</span>
            </div>
            {showTranscript ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showTranscript && (
            <div style={{ marginTop: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '16px', maxHeight: '300px', overflowY: 'auto', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {transcript}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
