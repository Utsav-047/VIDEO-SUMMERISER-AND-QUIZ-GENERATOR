import React from 'react';
import { Sparkles, Play, Zap, Brain, FileText } from 'lucide-react';

export default function HeroBanner({ onSelectSample }) {
  const samples = [
    { title: 'Quantum Computers Explained', url: 'https://www.youtube.com/watch?v=JhHMJCUmq28', tag: 'Physics', color: '#06b6d4' },
    { title: 'How The Economic Machine Works', url: 'https://www.youtube.com/watch?v=PHe0bXAIuk8', tag: 'Finance', color: '#10b981' },
    { title: 'Neuroscience of Deep Focus', url: 'https://www.youtube.com/watch?v=4bcfyv5eMog', tag: 'Productivity', color: '#f59e0b' },
  ];

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '44px 40px', marginBottom: 32, background: 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.05) 50%,rgba(6,182,212,0.06))', borderColor: 'var(--border-glow)', position: 'relative', overflow: 'hidden' }}>
      <div className="orb orb-primary" style={{ width: 320, height: 320, top: '-100px', right: '-80px', opacity: .6 }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 840, position: 'relative', zIndex: 1 }}>
        <div className="badge badge-primary animate-fade-in" style={{ marginBottom: 20, gap: 8 }}>
          <Sparkles size={13} />
          Next-Gen Video Intelligence
        </div>

        <h1 className="animate-fade-in delay-100" style={{ fontSize: 'clamp(2rem,4vw,3rem)', lineHeight: 1.12, fontWeight: 900, marginBottom: 16, letterSpacing: '-0.03em' }}>
          Turn Any Video into{' '}
          <span className="gradient-text">Structured Summaries</span>
          {' '}& Interactive Quizzes
        </h1>

        <p className="animate-fade-in delay-200" style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.65, maxWidth: 680 }}>
          Paste a YouTube link or upload lecture recordings. Synapse extracts audio, transcribes with Whisper,
          distills key concepts into executive briefs, and generates adaptive quizzes to test your mastery.
        </p>

        <div className="animate-fade-in delay-300" style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginBottom: 28 }}>
          {[
            { icon: Zap, label: 'Automatic Whisper Transcription', color: '#f59e0b' },
            { icon: Brain, label: 'AI Quiz with Instant Feedback', color: '#8b5cf6' },
            { icon: FileText, label: 'Executive & Key-Takeaway Summaries', color: '#06b6d4' },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.875rem', color: 'var(--text-secondary)' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${f.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={14} color={f.color} />
                </div>
                {f.label}
              </div>
            );
          })}
        </div>

        <div className="animate-fade-in delay-400" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Try a sample:</span>
          {samples.map((s, i) => (
            <button key={i} id={`sample-pill-${i}`} onClick={() => onSelectSample(s.url)} className="btn-secondary"
              style={{ fontSize: '.8rem', padding: '7px 14px', borderRadius: 'var(--radius-full)', gap: 8 }}>
              <Play size={11} fill={s.color} color={s.color} />
              {s.title}
              <span style={{ fontSize: '.7rem', color: s.color, background: `${s.color}18`, padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>{s.tag}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
