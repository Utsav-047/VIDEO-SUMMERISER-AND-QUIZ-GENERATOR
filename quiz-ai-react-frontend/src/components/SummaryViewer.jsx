import React, { useState } from 'react';
import {
  Copy, Check, Download, BookOpen, ChevronDown, ChevronUp,
  FileText, Sparkles, Lightbulb, Printer, AlertTriangle,
  Target, Info, Code, Compass
} from 'lucide-react';

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
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
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

  const rawLines = summary.split('\n');
  const blocks = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // 1. Skip empty lines
    if (!trimmed) {
      blocks.push({ type: 'spacer', key: `sp-${i}` });
      i++;
      continue;
    }

    // 2. Fenced Code Blocks (```)
    if (trimmed.startsWith('```')) {
      const codeLines = [];
      const lang = trimmed.slice(3).trim();
      i++;
      while (i < rawLines.length && !rawLines[i].trim().startsWith('```')) {
        codeLines.push(rawLines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({
        type: 'code',
        lang,
        code: codeLines.join('\n'),
        key: `code-${i}`,
      });
      continue;
    }

    // 3. Markdown Tables (| Col 1 | Col 2 |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableRows = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('|') && rawLines[i].trim().endsWith('|')) {
        const rowText = rawLines[i].trim();
        // Skip separator row like | :--- | :--- | or | --- | --- |
        if (!/^\|[\s\-:]+(\|[\s\-:]+)+\|$/.test(rowText)) {
          const cells = rowText
            .slice(1, -1)
            .split('|')
            .map((c) => c.trim());
          tableRows.push(cells);
        }
        i++;
      }
      if (tableRows.length > 0) {
        blocks.push({
          type: 'table',
          headers: tableRows[0],
          rows: tableRows.slice(1),
          key: `tbl-${i}`,
        });
      }
      continue;
    }

    // 4. Headers (##, ###, #)
    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'h2', text: trimmed.replace(/^##\s+/, ''), key: `h2-${i}` });
      i++;
      continue;
    }
    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'h3', text: trimmed.replace(/^###\s+/, ''), key: `h3-${i}` });
      i++;
      continue;
    }
    if (trimmed.startsWith('# ')) {
      blocks.push({ type: 'h1', text: trimmed.replace(/^#\s+/, ''), key: `h1-${i}` });
      i++;
      continue;
    }

    // 5. Blockquote / Callouts (> )
    if (trimmed.startsWith('> ')) {
      const quoteLines = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('>')) {
        quoteLines.push(rawLines[i].trim().replace(/^>\s*/, ''));
        i++;
      }
      blocks.push({
        type: 'quote',
        text: quoteLines.join(' '),
        key: `q-${i}`,
      });
      continue;
    }

    // 6. Bullet lists or Numbered lists
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
      const isOrdered = /^\d+\.\s/.test(trimmed);
      const bulletNum = isOrdered ? trimmed.match(/^(\d+)\.\s/)[1] : null;
      const bulletText = trimmed.replace(/^[-*]\s+|\d+\.\s+/, '');
      blocks.push({
        type: 'list_item',
        isOrdered,
        bulletNum,
        text: bulletText,
        key: `li-${i}`,
      });
      i++;
      continue;
    }

    // 7. Regular paragraph
    blocks.push({
      type: 'paragraph',
      text: trimmed,
      key: `p-${i}`,
    });
    i++;
  }

  // Render parsed blocks
  return (
    <div style={{ fontSize, color: 'var(--text-secondary)' }}>
      {blocks.map((block) => {
        if (block.type === 'spacer') {
          return <div key={block.key} style={{ height: '8px' }} />;
        }

        if (block.type === 'h2') {
          const isExample = /example|analogy|case study|walkthrough|practical/i.test(block.text);
          const isPitfall = /pitfall|warning|common mistake|nuance|alert/i.test(block.text);
          const isTakeaway = /takeaway|action|checklist|review/i.test(block.text);
          const isGlossary = /glossary|terminology|matrix|definitions/i.test(block.text);

          return (
            <div
              key={block.key}
              style={{
                marginTop: '32px',
                marginBottom: '14px',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {isExample && <Lightbulb size={20} color="#eab308" />}
                {isPitfall && <AlertTriangle size={20} color="#f97316" />}
                {isTakeaway && <Target size={20} color="#10b981" />}
                {isGlossary && <Compass size={20} color="#6366f1" />}
                <h3
                  style={{
                    fontSize: '1.22rem',
                    fontWeight: 800,
                    color: isPitfall ? '#ea580c' : isExample ? '#d97706' : 'var(--primary)',
                    letterSpacing: '-0.01em',
                    margin: 0,
                  }}
                >
                  {renderInlineFormatting(block.text)}
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
                    background: 'rgba(234, 179, 8, 0.12)',
                    color: '#b45309',
                    border: '1px solid rgba(234, 179, 8, 0.28)',
                  }}
                >
                  Practical Application
                </span>
              )}
              {isPitfall && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    background: 'rgba(249, 115, 22, 0.12)',
                    color: '#c2410c',
                    border: '1px solid rgba(249, 115, 22, 0.28)',
                  }}
                >
                  Watch Out
                </span>
              )}
            </div>
          );
        }

        if (block.type === 'h3') {
          return (
            <h4
              key={block.key}
              style={{
                fontSize: '1.05rem',
                color: 'var(--text-primary)',
                marginTop: '20px',
                marginBottom: '8px',
                fontWeight: 700,
              }}
            >
              {renderInlineFormatting(block.text)}
            </h4>
          );
        }

        if (block.type === 'h1') {
          return (
            <h2
              key={block.key}
              style={{
                fontSize: '1.38rem',
                color: 'var(--text-primary)',
                marginTop: '24px',
                marginBottom: '12px',
                fontWeight: 800,
              }}
            >
              {renderInlineFormatting(block.text)}
            </h2>
          );
        }

        if (block.type === 'table') {
          return (
            <div key={block.key} className="summary-table-container">
              <table className="summary-table">
                <thead>
                  <tr>
                    {block.headers.map((h, hIdx) => (
                      <th key={`th-${hIdx}`}>{renderInlineFormatting(h)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rIdx) => (
                    <tr key={`tr-${rIdx}`}>
                      {row.map((cell, cIdx) => (
                        <td key={`td-${cIdx}`}>{renderInlineFormatting(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === 'code') {
          return (
            <div
              key={block.key}
              style={{
                background: '#090d16',
                color: '#e2e8f0',
                padding: '16px',
                borderRadius: '8px',
                margin: '14px 0',
                fontFamily: 'ui-monospace, monospace',
                fontSize: '0.86rem',
                overflowX: 'auto',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                lineHeight: 1.6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#94a3b8', fontSize: '0.74rem' }}>
                <Code size={13} />
                <span>{block.lang || 'Code Snippet'}</span>
              </div>
              <pre style={{ margin: 0 }}>{block.code}</pre>
            </div>
          );
        }

        if (block.type === 'quote') {
          const isWarning = /warning|caution|avoid|danger/i.test(block.text);
          const isTip = /tip|pro-tip|note|hint/i.test(block.text);

          const borderColor = isWarning ? '#f97316' : isTip ? '#eab308' : 'var(--primary)';
          const bgColor = isWarning
            ? 'rgba(249, 115, 22, 0.08)'
            : isTip
            ? 'rgba(234, 179, 8, 0.08)'
            : 'rgba(11, 50, 111, 0.05)';

          return (
            <div
              key={block.key}
              style={{
                background: bgColor,
                borderLeft: `4px solid ${borderColor}`,
                borderRadius: '6px',
                padding: '12px 18px',
                margin: '14px 0',
                color: 'var(--text-secondary)',
                fontSize,
                lineHeight: 1.7,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              {isWarning ? (
                <AlertTriangle size={18} color={borderColor} style={{ flexShrink: 0, marginTop: '2px' }} />
              ) : isTip ? (
                <Lightbulb size={18} color={borderColor} style={{ flexShrink: 0, marginTop: '2px' }} />
              ) : (
                <Info size={18} color={borderColor} style={{ flexShrink: 0, marginTop: '2px' }} />
              )}
              <div style={{ flex: 1 }}>{renderInlineFormatting(block.text)}</div>
            </div>
          );
        }

        if (block.type === 'list_item') {
          return (
            <div
              key={block.key}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                marginBottom: '10px',
                paddingLeft: '4px',
              }}
            >
              {block.isOrdered ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  {block.bulletNum}
                </span>
              ) : (
                <span
                  style={{
                    color: 'var(--primary)',
                    fontSize: '1.25rem',
                    lineHeight: 1,
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  &bull;
                </span>
              )}
              <div
                style={{
                  color: 'var(--text-secondary)',
                  lineHeight: 1.75,
                  fontSize,
                  flex: 1,
                }}
              >
                {renderInlineFormatting(block.text)}
              </div>
            </div>
          );
        }

        // Paragraph
        return (
          <p
            key={block.key}
            style={{
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              marginBottom: '14px',
              fontSize,
            }}
          >
            {renderInlineFormatting(block.text)}
          </p>
        );
      })}
    </div>
  );
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
    const blob = new Blob(
      [`# ${title || 'Video Summary'}\n\n${summary}\n\n---\n\n## Full Transcript\n\n${transcript || ''}`],
      { type: 'text/markdown' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(title || 'video_summary').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '32px',
        marginBottom: '32px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header bar */}
      <div
        className="summary-actions-bar"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          paddingBottom: '20px',
          borderBottom: '1px solid var(--border)',
          marginBottom: '24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="tag-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={12} />
              MASTER STUDY GUIDE
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              ~{readingTime} min read &bull; {wordCount} words
            </span>
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {title || 'Generated Summary'}
          </h2>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Font Size Toggle */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-subtle)',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              padding: '2px',
            }}
          >
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

          <button
            id="copy-summary-btn"
            onClick={handleCopy}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
          >
            {copied ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            id="print-summary-btn"
            onClick={handlePrint}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            title="Print or Save as PDF"
          >
            <Printer size={15} />
            <span>PDF / Print</span>
          </button>

          <button
            id="download-summary-btn"
            onClick={handleDownload}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
          >
            <Download size={15} />
            <span>Markdown</span>
          </button>

          {onStartQuiz && (
            <button
              id="start-quiz-cta-btn"
              onClick={onStartQuiz}
              className="btn-primary"
              style={{ padding: '8px 18px', fontSize: '0.85rem' }}
            >
              <FileText size={15} />
              <span>Launch Quiz</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Content Body */}
      <div
        style={{
          background: 'var(--bg-subtle)',
          borderRadius: '8px',
          padding: '28px',
          border: '1px solid var(--border)',
        }}
      >
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
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                Full Video Transcript ({transcript.split(/\s+/).length} words)
              </span>
            </div>
            {showTranscript ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showTranscript && (
            <div
              style={{
                marginTop: '8px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '16px',
                maxHeight: '300px',
                overflowY: 'auto',
                fontSize: '0.88rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
              }}
            >
              {transcript}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
