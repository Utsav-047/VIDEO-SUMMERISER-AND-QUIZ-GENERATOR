import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  RotateCcw, ArrowRight, ArrowLeft, Check, Sparkles,
  Shuffle, BookOpen, Layers, Loader2, Award, Lightbulb
} from 'lucide-react';

export default function FlashcardPlayer({ videoId, transcript = '', summary = '' }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState(new Set());
  const [needsReviewIds, setNeedsReviewIds] = useState(new Set());

  // Helper to fallback-extract flashcards from summary table if needed
  const extractCardsFromSummary = (summaryText) => {
    const list = [];
    if (!summaryText) return list;

    const isMeta = (text) => {
      const lower = (text || '').toLowerCase();
      return (
        lower.includes('presenter') ||
        lower.includes('author') ||
        lower.includes('speaker') ||
        lower.includes('host') ||
        lower.includes('youtube') ||
        lower.includes('channel') ||
        lower.includes('subscribe') ||
        lower.includes('welcome')
      );
    };

    // Extract table rows if available
    const lines = summaryText.split('\n');
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('|') && trimmed.endsWith('|') && !trimmed.includes('---') && !trimmed.toLowerCase().includes('term / acronym')) {
        const parts = trimmed.slice(1, -1).split('|').map((s) => s.trim());
        if (parts.length >= 2 && parts[0] && parts[1]) {
          const front = parts[0].replace(/\*\*/g, '');
          const back = parts[1].replace(/\*\*/g, '');
          if (!isMeta(front) && !isMeta(back)) {
            list.push({
              front,
              back,
              category: parts[2] ? parts[2].replace(/\*\*/g, '') : 'Core Concept',
            });
          }
        }
      }
    });

    // If table didn't yield enough, extract bullet points
    if (list.length < 4) {
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('- **') || trimmed.startsWith('* **')) {
          const match = trimmed.match(/^[-*]\s+\*\*([^*]+)\*\*:\s*(.+)$/);
          if (match) {
            const front = match[1];
            const back = match[2];
            if (!isMeta(front) && !isMeta(back)) {
              list.push({
                front,
                back,
                category: 'Key Principle',
              });
            }
          }
        }
      });
    }

    return list;
  };

  useEffect(() => {
    let isMounted = true;
    async function loadCards() {
      setLoading(true);
      try {
        if (videoId) {
          const data = await api.getFlashcards(videoId, transcript);
          if (isMounted && data?.flashcards && data.flashcards.length > 0) {
            setCards(data.flashcards);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('API flashcards generation error, falling back to local extraction:', err);
      }

      // Fallback extraction
      const fallback = extractCardsFromSummary(summary);
      if (isMounted) {
        setCards(
          fallback.length > 0
            ? fallback
            : [
                {
                  front: 'Executive Thesis',
                  back: 'Master the central premise and mechanisms synthesized from this lecture.',
                  category: 'Overview',
                },
                {
                  front: 'Key Application',
                  back: 'Apply practical takeaways directly into real-world projects or research.',
                  category: 'Practice',
                },
              ]
        );
        setLoading(false);
      }
    }

    loadCards();
    return () => {
      isMounted = false;
    };
  }, [videoId, transcript, summary]);

  const handleFlip = () => setIsFlipped((prev) => !prev);

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const markMastered = () => {
    setMasteredIds((prev) => {
      const next = new Set(prev);
      next.add(currentIndex);
      return next;
    });
    setNeedsReviewIds((prev) => {
      const next = new Set(prev);
      next.delete(currentIndex);
      return next;
    });
    handleNext();
  };

  const markNeedsReview = () => {
    setNeedsReviewIds((prev) => {
      const next = new Set(prev);
      next.add(currentIndex);
      return next;
    });
    setMasteredIds((prev) => {
      const next = new Set(prev);
      next.delete(currentIndex);
      return next;
    });
    handleNext();
  };

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleReset = () => {
    setMasteredIds(new Set());
    setNeedsReviewIds(new Set());
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  if (loading) {
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '48px', textAlign: 'center' }}>
        <Loader2 size={32} className="animate-spin" color="var(--primary)" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Generating 3D Flashcards...</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Synthesizing high-yield concepts from the video transcript for spaced repetition.</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '32px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>No flashcards available for this video.</p>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progressPct = Math.round(((currentIndex + 1) / cards.length) * 100);
  const isMastered = masteredIds.has(currentIndex);
  const isReview = needsReviewIds.has(currentIndex);

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border)', marginBottom: '20px', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={18} color="var(--primary)" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.04em' }}>
              Spaced Repetition Flashcards
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Card {currentIndex + 1} of {cards.length}
            </h3>
          </div>
        </div>

        {/* Action Controls (Shuffle, Reset) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, padding: '4px 10px', borderRadius: 6, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
            ✓ {masteredIds.size} Mastered
          </span>
          {needsReviewIds.size > 0 && (
            <span style={{ fontSize: '0.82rem', fontWeight: 700, padding: '4px 10px', borderRadius: 6, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              🔄 {needsReviewIds.size} Review
            </span>
          )}
          <button onClick={handleShuffle} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} title="Shuffle Cards">
            <Shuffle size={14} />
            <span>Shuffle</span>
          </button>
          <button onClick={handleReset} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} title="Reset Progress">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ width: '100%', height: '4px', background: 'var(--bg-subtle)', borderRadius: 2, overflow: 'hidden', marginBottom: '28px' }}>
        <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--primary)', transition: 'width 0.25s ease' }} />
      </div>

      {/* ── 3D FLIP CARD CONTAINER ── */}
      <div
        style={{
          perspective: '1200px',
          maxWidth: 680,
          margin: '0 auto 28px',
          cursor: 'pointer',
          minHeight: 280,
        }}
        onClick={handleFlip}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            minHeight: 280,
            borderRadius: 12,
            border: `1.5px solid ${isMastered ? '#10b981' : isReview ? '#f59e0b' : 'var(--border)'}`,
            background: isFlipped ? 'var(--bg-subtle)' : 'var(--bg-surface)',
            boxShadow: '0 8px 30px -6px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '32px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isFlipped ? 'scale(1.01)' : 'scale(1)',
          }}
        >
          {/* Card Top Label */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                padding: '4px 10px',
                borderRadius: 6,
                background: isFlipped ? 'rgba(99, 102, 241, 0.12)' : 'var(--primary-light)',
                color: isFlipped ? '#6366f1' : 'var(--primary)',
              }}
            >
              {currentCard.category || (isFlipped ? 'Answer / Insight' : 'Concept Question')}
            </span>

            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {isFlipped ? 'Click card to flip back' : 'Click card to reveal explanation'}
            </span>
          </div>

          {/* Card Center Content */}
          <div style={{ padding: '24px 0', textAlign: 'center' }}>
            {!isFlipped ? (
              <div>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 12 }}>
                  {currentCard.front}
                </h2>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 700 }}>
                  <Sparkles size={15} />
                  <span>Tap to see explanation</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'left', animation: 'fadeIn 0.2s ease-out' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                  Definition &amp; Analysis
                </div>
                <p style={{ fontSize: '1.05rem', lineHeight: 1.65, color: 'var(--text-primary)', fontWeight: 600 }}>
                  {currentCard.back}
                </p>
              </div>
            )}
          </div>

          {/* Card Footer status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Card {currentIndex + 1} of {cards.length}
            </span>
            {isMastered && (
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Check size={14} /> Mastered
              </span>
            )}
            {isReview && (
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                <RotateCcw size={14} /> Marked for Review
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── INTERACTION BUTTONS ── */}
      <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Study Verdict Buttons (Mastered vs Review) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button
            onClick={markNeedsReview}
            style={{
              padding: '12px 18px',
              borderRadius: 8,
              border: '1.5px solid #f59e0b',
              background: 'rgba(245, 158, 11, 0.08)',
              color: '#d97706',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.15s ease',
            }}
          >
            <RotateCcw size={16} />
            <span>Still Learning (Review)</span>
          </button>

          <button
            onClick={markMastered}
            style={{
              padding: '12px 18px',
              borderRadius: 8,
              border: '1.5px solid #10b981',
              background: 'rgba(16, 185, 129, 0.08)',
              color: '#059669',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.15s ease',
            }}
          >
            <Check size={16} />
            <span>Got It! (Mastered)</span>
          </button>
        </div>

        {/* Navigation Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 }}>
          <button onClick={handlePrev} disabled={currentIndex === 0} className="btn-secondary">
            <ArrowLeft size={16} />
            <span>Previous Card</span>
          </button>

          <button onClick={handleFlip} className="btn-secondary" style={{ fontWeight: 700 }}>
            <span>Flip Card</span>
          </button>

          <button onClick={handleNext} disabled={currentIndex === cards.length - 1} className="btn-primary">
            <span>Next Card</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
