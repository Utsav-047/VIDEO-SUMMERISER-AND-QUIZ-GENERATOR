import React, { useState } from 'react';
import { Copy, Check, Download, BookOpen, ChevronDown, ChevronUp, FileText, Sparkles, Lightbulb } from 'lucide-react';

export function renderInlineFormatting(text) {
  if (!text) return text;
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={key++} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={key++}
          style={{
            background: 'var(--bg-surface)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '0.88em',
            fontFamily: 'monospace',
            border: '1px solid var(--border)',
            color: 'var(--primary)',
          }}
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={key++} style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export function FormattedSummaryContent({ summary, fontSize = '0.94rem' }) {
  if (!summary) return null;

  const lines = summary.split('\n');
  const elements = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={`sp-${idx}`} style={{ height: '8px' }} />);
      return;
    }

    // Check if it's an H2 (##)
    if (trimmed.startsWith('## ')) {
      const title = trimmed.replace(/^##\s+/, '');
      const isExample = /example|analogy|case study|walkthrough|practical/i.test(title);
      elements.push(
        <div
          key={`h2-${idx}`}
          style={{
            marginTop: idx === 0 ? '4px' : '26px',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: isExample ? '1px solid rgba(234, 179, 8, 0.35)' : '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isExample && <Lightbulb size={18} color="#eab308" />}
            <h3
              style={{
                fontSize: '1.18rem',
                fontWeight: 800,
                color: isExample ? '#d97706' : 'var(--primary)',
                letterSpacing: '-0.01em',
                margin: 0,
              }}
            >
              {renderInlineFormatting(title)}
            </h3>
          </div>
          {isExample && (
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                padding: '3px 10px',
                borderRadius: '12px',
                background: 'rgba(234, 179, 8, 0.15)',
                color: '#b45309',
                border: '1px solid rgba(234, 179, 8, 0.3)',
              }}
            >
              Real-World Application
            </span>
          )}
        </div>
      );
      return;
    }

    // Check if it's an H3 (###)
    if (trimmed.startsWith('### ')) {
      const title = trimmed.replace(/^###\s+/, '');
      elements.push(
        <h4
          key={`h3-${idx}`}
          style={{
            fontSize: '1.05rem',
            color: 'var(--text-primary)',
            marginTop: '16px',
            marginBottom: '8px',
            fontWeight: 700,
          }}
        >
          {renderInlineFormatting(title)}
        </h4>
      );
      return;
    }

    // Check if it's an H1 (#)
    if (trimmed.startsWith('# ')) {
      const title = trimmed.replace(/^#\s+/, '');
      elements.push(
        <h2
          key={`h1-${idx}`}
          style={{
            fontSize: '1.35rem',
            color: 'var(--text-primary)',
            marginTop: '20px',
            marginBottom: '12px',
            fontWeight: 800,
          }}
        >
          {renderInlineFormatting(title)}
        </h2>
      );
      return;
    }

    // Blockquote (> )
    if (trimmed.startsWith('> ')) {
      const quoteText = trimmed.replace(/^>\s+/, '');
      elements.push(
        <div
          key={`quote-${idx}`}
          style={{
            background: 'rgba(11, 50, 111, 0.04)',
            borderLeft: '4px solid var(--primary)',
            borderRadius: '4px',
            padding: '12px 16px',
            margin: '12px 0',
            color: 'var(--text-secondary)',
            fontSize,
            lineHeight: 1.7,
          }}
        >
          {renderInlineFormatting(quoteText)}
        </div>
      );
      return;
    }

    // Bullet points (- or * or 1.)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
      const isOrdered = /^\d+\.\s/.test(trimmed);
      const bulletNum = isOrdered ? trimmed.match(/^(\d+)\.\s/)[1] : null;
      const bulletText = trimmed.replace(/^[-*]\s+|\d+\.\s+/, '');
      return elements.push(
        <div
          key={`li-${idx}`}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            marginBottom: '8px',
            paddingLeft: '6px',
          }}
        >
          {isOrdered ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                fontSize: '0.72rem',
                fontWeight: 700,
                flexShrink: 0,
                marginTop: '3px',
              }}
            >
              {bulletNum}
            </span>
          ) : (
            <span
              style={{
                color: 'var(--primary)',
                fontSize: '1.2rem',
                lineHeight: 1,
                flexShrink: 0,
                marginTop: '3px',
              }}
            >
              &bull;
            </span>
          )}
          <div
            style={{
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              fontSize,
              flex: 1,
            }}
          >
            {renderInlineFormatting(bulletText)}
          </div>
        </div>
      );
    }

    // Standard paragraph
    elements.push(
      <p
        key={`p-${idx}`}
        style={{
          color: 'var(--text-secondary)',
          lineHeight: 1.75,
          marginBottom: '10px',
          fontSize,
        }}
      >
        {renderInlineFormatting(trimmed)}
      </p>
    );
  });

  return <div style={{ fontSize }}>{elements}</div>;
}

export default function SummaryViewer({ title, summary, transcript, onStartQuiz }) {
  const [copied, setCopied] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [fontSize, setFontSize] = useState('0.95rem');

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
    const blob = new Blob([`# ${title || 'Video Summary'}\n\n${summary}\n\n---\n\n## Full Transcript\n\n${transcript || ''}`], {
      type: 'text/markdown',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(title || 'video_summary').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '32px', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', paddingBottom: '20px', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="tag-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={12} />
              EXECUTIVE SUMMARY
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>~{readingTime} min read &bull; {wordCount} words</span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{title || 'Generated Summary'}</h2>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Font Size Toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-subtle)', borderRadius: '6px', border: '1px solid var(--border)', padding: '2px' }}>
            <button
              type="button"
              onClick={() => setFontSize('0.9rem')}
              style={{
                border: 'none',
                background: fontSize === '0.9rem' ? 'var(--bg-surface)' : 'transparent',
                color: fontSize === '0.9rem' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.78rem',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSize('1.02rem')}
              style={{
                border: 'none',
                background: fontSize === '1.02rem' ? 'var(--bg-surface)' : 'transparent',
                color: fontSize === '1.02rem' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.9rem',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              A+
            </button>
          </div>

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
        <FormattedSummaryContent summary={summary} fontSize={fontSize} />
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
