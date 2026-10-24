import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import {
  Clock, ArrowRight, ArrowLeft, CheckCircle2, XCircle, RotateCcw,
  Loader2, Award, FileText, AlertTriangle, Timer, Play, Settings
} from 'lucide-react';

export default function QuizPlayer({ quizId, questions = [], onRetake, onNewVideo }) {
  // Timer settings: 0 (No limit), 180 (3 min), 300 (5 min), 600 (10 min), custom
  const [timerDuration, setTimerDuration] = useState(300); // 5 minutes default
  const [customMinutes, setCustomMinutes] = useState(5);
  const [showTimerSetup, setShowTimerSetup] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(new Array(questions.length).fill(null));
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  const answersRef = useRef(answers);
  answersRef.current = answers;

  // Handle live timer countdown
  useEffect(() => {
    if (!quizStarted || submitted) return;

    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);

      if (timerDuration > 0) {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [quizStarted, submitted, timerDuration]);

  const handleStartWithTimer = (duration) => {
    setTimerDuration(duration);
    setTimeLeft(duration);
    setSecondsElapsed(0);
    setQuizStarted(true);
    setShowTimerSetup(false);
  };

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

  const handleAutoSubmit = async () => {
    setAutoSubmitted(true);
    setSubmitting(true);
    try {
      const currentAns = answersRef.current.map((a) => (a === null ? -1 : a));
      const res = await api.submitQuiz(quizId, currentAns);
      setResults(res);
      setSubmitted(true);
    } catch (err) {
      console.error('Auto submit error:', err);
    } finally {
      setSubmitting(false);
    }
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
    return `${mins < 10 ? '0' : ''}${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  if (!questions || questions.length === 0) {
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '32px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>No quiz questions generated for this video.</p>
      </div>
    );
  }

  // PRE-QUIZ TIMER CONFIGURATION SCREEN
  if (!quizStarted && !submitted) {
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '36px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
          <div style={{ width: 54, height: 54, borderRadius: 12, background: 'var(--primary-light)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Timer size={28} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
            Interactive Assessment Ready
          </h2>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 28 }}>
            {questions.length} adaptive multiple-choice questions have been generated. Choose a time limit before beginning, or practice at your own pace.
          </p>

          <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px', marginBottom: 28, textAlign: 'left' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 12 }}>
              Select Quiz Timer
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginBottom: 16 }}>
              {[
                { label: '3 Minutes', sub: 'Speed Blitz', val: 180 },
                { label: '5 Minutes', sub: 'Recommended', val: 300 },
                { label: '10 Minutes', sub: 'Exam Mode', val: 600 },
                { label: 'No Timer', sub: 'Self-Paced', val: 0 },
              ].map((opt) => {
                const isSelected = timerDuration === opt.val;
                return (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setTimerDuration(opt.val)}
                    style={{
                      padding: '12px 10px',
                      borderRadius: 8,
                      border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                      background: isSelected ? 'var(--primary-light)' : 'var(--bg-surface)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {opt.sub}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Minutes Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Or set custom duration:</span>
              <input
                type="number"
                min="1"
                max="60"
                value={customMinutes}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(60, parseInt(e.target.value) || 1));
                  setCustomMinutes(val);
                  setTimerDuration(val * 60);
                }}
                style={{
                  width: '70px',
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                }}
              />
              <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>minutes</span>
            </div>
          </div>

          <button
            id="start-quiz-btn"
            onClick={() => handleStartWithTimer(timerDuration)}
            className="btn-primary"
            style={{ padding: '14px 36px', fontSize: '1rem', width: '100%', justifyContent: 'center' }}
          >
            <Play size={18} />
            <span>Begin Assessment {timerDuration > 0 ? `(${formatTime(timerDuration)})` : '(No Limit)'}</span>
          </button>
        </div>
      </div>
    );
  }

  // RESULTS VIEW AFTER SUBMISSION
  if (submitted && results) {
    const scorePct = Math.round((results.score / results.total_questions) * 100);

    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
        {/* Auto-submit notice if timer ran out */}
        {autoSubmitted && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, marginBottom: 24, color: '#ef4444' }}>
            <AlertTriangle size={20} style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>Time Expired! Quiz Auto-Submitted</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Your answers were automatically collected when the timer hit zero.</div>
            </div>
          </div>
        )}

        {/* Score Summary Banner */}
        <div style={{ textAlign: 'center', padding: '32px 20px', background: 'var(--bg-subtle)', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '32px' }}>
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

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              id="retake-quiz-btn"
              onClick={() => {
                setAnswers(new Array(questions.length).fill(null));
                setSubmitted(false);
                setResults(null);
                setCurrentIndex(0);
                setSecondsElapsed(0);
                setTimeLeft(timerDuration);
                setQuizStarted(false);
                setAutoSubmitted(false);
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
            const userAnswer = answers[idx];
            const isCorrect = userAnswer === q.correct_index;

            return (
              <div
                key={idx}
                style={{
                  border: `1px solid ${isCorrect ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                  background: isCorrect ? 'rgba(16, 185, 129, 0.04)' : 'rgba(239, 68, 68, 0.04)',
                  borderRadius: '8px',
                  padding: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{idx + 1}.</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.5 }}>{q.question}</span>
                  </div>
                  {isCorrect ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '0.8rem', fontWeight: 800, flexShrink: 0 }}>
                      <CheckCircle2 size={16} /> Correct
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '0.8rem', fontWeight: 800, flexShrink: 0 }}>
                      <XCircle size={16} /> Incorrect
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                  {q.options.map((opt, optIdx) => {
                    const isUserPick = userAnswer === optIdx;
                    const isRightOption = optIdx === q.correct_index;
                    let bg = 'var(--bg-surface)';
                    let border = 'var(--border)';
                    let color = 'var(--text-secondary)';

                    if (isRightOption) {
                      bg = 'rgba(16, 185, 129, 0.15)';
                      border = '#10b981';
                      color = '#065f46';
                    } else if (isUserPick && !isCorrect) {
                      bg = 'rgba(239, 68, 68, 0.15)';
                      border = '#ef4444';
                      color = '#991b1b';
                    }

                    return (
                      <div key={optIdx} style={{ padding: '8px 12px', borderRadius: '6px', background: bg, border: `1px solid ${border}`, fontSize: '0.85rem', color, fontWeight: isRightOption || isUserPick ? 700 : 500 }}>
                        <span style={{ marginRight: '6px', fontWeight: 800 }}>{String.fromCharCode(65 + optIdx)}.</span>
                        {opt}
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: '6px', borderLeft: '3px solid var(--primary)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Explanation: </strong>
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
  const isUrgent = timerDuration > 0 && timeLeft < 45;
  const currentQ = questions[currentIndex];
  const answeredCount = answers.filter((a) => a !== null).length;
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
      {/* Top Header with Timer & Progress */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border)', marginBottom: '20px', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <span style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--primary)' }}>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: 8 }}>
            ({answeredCount} of {questions.length} answered)
          </span>
        </div>

        {/* Live Timer Countdown Badge */}
        {timerDuration > 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: isUrgent ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-subtle)',
              border: `1.5px solid ${isUrgent ? '#ef4444' : 'var(--border)'}`,
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: '0.88rem',
              fontWeight: 800,
              color: isUrgent ? '#ef4444' : 'var(--text-primary)',
              transition: 'all 0.3s ease',
            }}
          >
            <Clock size={16} color={isUrgent ? '#ef4444' : 'var(--primary)'} />
            <span>Time Left: {formatTime(timeLeft)}</span>
            {isUrgent && <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>• Hurry</span>}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            <Clock size={14} color="var(--primary)" />
            <span>Elapsed: {formatTime(secondsElapsed)}</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div style={{ width: '100%', height: '4px', background: 'var(--bg-subtle)', borderRadius: 2, overflow: 'hidden', marginBottom: '28px' }}>
        <div style={{ height: '100%', width: `${progressPercent}%`, background: 'var(--primary)', transition: 'width 0.2s ease' }} />
      </div>

      {/* Question Text */}
      <div style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1.18rem', lineHeight: 1.45, fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>
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
                  padding: '14px 18px',
                  borderRadius: '8px',
                  border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border-strong)'}`,
                  background: isSelected ? 'var(--primary-light)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    background: isSelected ? 'var(--primary)' : 'var(--bg-subtle)',
                    color: isSelected ? '#ffffff' : 'var(--text-muted)',
                  }}
                >
                  {String.fromCharCode(65 + optIdx)}
                </div>
                <span style={{ fontSize: '0.94rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--primary)' : 'var(--text-secondary)' }}>
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
              width: dotIdx === currentIndex ? '26px' : '9px',
              height: '9px',
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
