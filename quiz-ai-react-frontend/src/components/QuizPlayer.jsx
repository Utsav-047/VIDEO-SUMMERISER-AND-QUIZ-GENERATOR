import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Clock, ArrowRight, ArrowLeft, CheckCircle2, XCircle, RotateCcw, Loader2, Award, FileText } from 'lucide-react';

export default function QuizPlayer({ quizId, questions = [], onRetake, onNewVideo }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(new Array(questions.length).fill(null));
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    if (submitted) return;
    const interval = setInterval(() => setSecondsElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [submitted]);

  const currentQ = questions[currentIndex];
  const answeredCount = answers.filter((a) => a !== null).length;
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  const handleSelectOption = (optIndex) => {
    if (submitted) return;
    const updated = [...answers];
    updated[currentIndex] = optIndex;
    setAnswers(updated);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const cleanAnswers = answers.map((a) => (a === null ? -1 : a));
      const res = await api.submitQuiz(quizId, cleanAnswers);
      setResults(res);
      setSubmitted(true);
    } catch (err) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  if (!questions || questions.length === 0) {
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '32px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>No quiz questions generated for this video.</p>
      </div>
    );
  }

  // RESULTS VIEW AFTER SUBMISSION
  if (submitted && results) {
    const scorePct = Math.round((results.score / results.total_questions) * 100);

    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
        
        {/* Score Summary Banner */}
        <div style={{ textAlign: 'center', padding: '32px 20px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '32px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em', marginBottom: 6 }}>
            Assessment Result
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
            Quiz Completed
          </h2>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '6px', marginBottom: 8 }}>
            <span style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--primary)' }}>{results.score}</span>
            <span style={{ fontSize: '1.5rem', color: 'var(--text-muted)', fontWeight: 700 }}>/ {results.total_questions}</span>
            <span style={{ fontSize: '1.2rem', color: scorePct >= 70 ? '#10b981' : '#ef4444', fontWeight: 800, marginLeft: 8 }}>({scorePct}%)</span>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 20 }}>
            Time spent: {formatTime(secondsElapsed)} &bull; {results.score} correct out of {results.total_questions} questions
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button
              id="retake-quiz-btn"
              onClick={() => {
                setAnswers(new Array(questions.length).fill(null));
                setSubmitted(false);
                setResults(null);
                setCurrentIndex(0);
                setSecondsElapsed(0);
                if (onRetake) onRetake();
              }}
              className="btn-secondary"
            >
              <RotateCcw size={15} />
              <span>Retake Quiz</span>
            </button>

            {onNewVideo && (
              <button id="new-video-btn" onClick={onNewVideo} className="btn-primary">
                <FileText size={15} />
                <span>Process Another Video</span>
              </button>
            )}
          </div>
        </div>

        {/* Detailed Question Review Breakdown */}
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
          Answer Review &amp; Explanations
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {questions.map((q, idx) => {
            const userChoice = answers[idx];
            const isCorrect = userChoice === q.correct_index;

            return (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-surface)',
                  border: `1px solid ${isCorrect ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                  borderRadius: '6px',
                  padding: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {idx + 1}. {q.question}
                  </span>
                  <div>
                    {isCorrect ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#10b981', fontSize: '0.8rem', fontWeight: 700 }}>
                        <CheckCircle2 size={16} /> Correct
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#ef4444', fontSize: '0.8rem', fontWeight: 700 }}>
                        <XCircle size={16} /> Incorrect
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                  {q.options.map((opt, optIdx) => {
                    const isSelected = userChoice === optIdx;
                    const isCorrectOpt = q.correct_index === optIdx;

                    let bg = 'var(--bg-subtle)';
                    let border = 'var(--border)';
                    let textCol = 'var(--text-secondary)';

                    if (isCorrectOpt) {
                      bg = 'rgba(16, 185, 129, 0.12)';
                      border = '#10b981';
                      textCol = '#10b981';
                    } else if (isSelected && !isCorrect) {
                      bg = 'rgba(239, 68, 68, 0.12)';
                      border = '#ef4444';
                      textCol = '#ef4444';
                    }

                    return (
                      <div
                        key={optIdx}
                        style={{
                          background: bg,
                          border: `1px solid ${border}`,
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: textCol,
                          fontWeight: isCorrectOpt || isSelected ? 700 : 500,
                        }}
                      >
                        <span>{String.fromCharCode(65 + optIdx)}.</span>
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <div style={{ background: 'var(--bg-subtle)', borderRadius: '6px', padding: '10px 12px', fontSize: '0.82rem', color: 'var(--text-secondary)', borderLeft: '3px solid var(--primary)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Explanation: </span>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ACTIVE QUIZ RUNNER
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
        <div>
          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary)' }}>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 8 }}>
            ({answeredCount} of {questions.length} answered)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 6, fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          <Clock size={14} color="var(--primary)" />
          <span>{formatTime(secondsElapsed)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ width: '100%', height: '4px', background: 'var(--bg-subtle)', borderRadius: 2, overflow: 'hidden', marginBottom: '28px' }}>
        <div style={{ height: '100%', width: `${progressPercent}%`, background: 'var(--primary)', transition: 'width 0.2s ease' }} />
      </div>

      {/* Question */}
      <div style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1.15rem', lineHeight: 1.4, fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>
          {currentQ.question}
        </h3>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {currentQ.options.map((option, optIdx) => {
            const isSelected = answers[currentIndex] === optIdx;
            return (
              <div
                key={optIdx}
                id={`quiz-opt-${currentIndex}-${optIdx}`}
                onClick={() => handleSelectOption(optIdx)}
                style={{
                  padding: '12px 16px',
                  borderRadius: '6px',
                  border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-strong)'}`,
                  background: isSelected ? 'var(--primary-light)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    background: isSelected ? 'var(--primary)' : 'var(--bg-subtle)',
                    color: isSelected ? '#ffffff' : 'var(--text-muted)',
                  }}
                >
                  {String.fromCharCode(65 + optIdx)}
                </div>
                <span style={{ fontSize: '0.92rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--primary)' : 'var(--text-secondary)' }}>
                  {option}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigator Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '24px' }}>
        {questions.map((_, dotIdx) => (
          <button
            key={dotIdx}
            id={`quiz-dot-${dotIdx}`}
            onClick={() => setCurrentIndex(dotIdx)}
            style={{
              width: dotIdx === currentIndex ? '24px' : '8px',
              height: '8px',
              borderRadius: '4px',
              background: dotIdx === currentIndex ? 'var(--primary)' : answers[dotIdx] !== null ? 'var(--primary-border)' : 'var(--border)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          />
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button id="quiz-prev-btn" onClick={handlePrev} disabled={currentIndex === 0} className="btn-secondary">
          <ArrowLeft size={16} />
          <span>Previous</span>
        </button>

        {currentIndex === questions.length - 1 ? (
          <button id="quiz-submit-btn" onClick={handleSubmit} disabled={submitting} className="btn-primary" style={{ background: '#10b981', borderColor: '#10b981' }}>
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Award size={16} />}
            <span>{submitting ? 'Submitting...' : 'Submit Final Answers'}</span>
          </button>
        ) : (
          <button id="quiz-next-btn" onClick={handleNext} className="btn-primary">
            <span>Next Question</span>
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
