import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FileText, ArrowRight, Play, CheckCircle2,
  Upload, HelpCircle, BarChart2, Shield, Video, Layers,
  ChevronRight, Clock, Award, Sun, Moon, Plus, Minus,
  ShieldCheck
} from 'lucide-react';

function YoutubeIcon({ size = 18, color = '#ef4444' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ color, flexShrink: 0 }}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

export default function LandingPage({ isDark, toggleTheme }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: 'How does Synapse AI transcribe and summarize videos?',
      a: 'The engine isolates audio tracks and processes them through the Whisper speech-to-text model with 98%+ precision, followed by structured synthesis into Executive Briefs or Deep Dive study notes.'
    },
    {
      q: 'Can I upload my own local MP4 or MKV files?',
      a: 'Yes! You can paste any public YouTube link or upload recorded lectures, meetings, or offline video files directly from your computer.'
    },
    {
      q: 'How are the quiz questions generated?',
      a: 'The AI analyzes key technical definitions, core arguments, and factual statements to generate multiple-choice questions categorized by difficulty (Easy, Medium, Hard).'
    },
    {
      q: 'Is my video data saved in my account history?',
      a: 'Yes, all synthesized summaries, transcripts, and quiz score analytics are automatically synced to your private library once you are signed in.'
    }
  ];

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      
      {/* ── TOP HEADER (Clean White Header + Underline Active Tab + Dark Toggle) ── */}
      <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 72, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{ width: 34, height: 34, borderRadius: 6, background: '#0b326f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={18} color="#ffffff" />
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Synapse AI
            </span>
          </div>

          {/* Nav Links with Clean Underline */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <button className="nav-link active" onClick={() => navigate('/')}>Home</button>
            <button className="nav-link" onClick={() => navigate('/app')}>Studio</button>
            <button className="nav-link" onClick={() => navigate('/app?tab=history')}>Library</button>
            <button className="nav-link" onClick={() => navigate('/app?tab=analytics')}>Analytics</button>
            {user?.role === 'admin' && (
              <button
                className="nav-link"
                onClick={() => navigate('/admin')}
                style={{ color: 'var(--primary)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <ShieldCheck size={14} />
                Admin
              </button>
            )}
          </nav>

          {/* Right Controls: Theme Switcher & Auth */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              style={{
                width: 36,
                height: 36,
                borderRadius: 6,
                border: '1px solid var(--border-strong)',
                background: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="#0b326f" />}
            </button>

            {user ? (
              <button
                id="nav-app-btn"
                className="btn-primary"
                onClick={() => navigate('/app')}
                style={{ fontSize: '0.85rem', padding: '8px 18px' }}
              >
                Go to Studio
              </button>
            ) : (
              <>
                <button id="nav-login-btn" className="btn-secondary" onClick={() => navigate('/login')} style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
                  Sign In
                </button>
                <button id="nav-register-btn" className="btn-primary" onClick={() => navigate('/register')} style={{ fontSize: '0.85rem', padding: '8px 18px' }}>
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO SECTION WITH 3D AI VIDEO INTELLIGENCE BACKGROUND ── */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid var(--border)',
          backgroundImage: isDark
            ? 'linear-gradient(to right, rgba(11, 20, 38, 0.95) 0%, rgba(11, 20, 38, 0.90) 38%, rgba(11, 20, 38, 0.50) 65%, rgba(11, 20, 38, 0.25) 100%), url("/landing-hero-bg.png")'
            : 'linear-gradient(to right, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.90) 38%, rgba(255, 255, 255, 0.45) 65%, rgba(255, 255, 255, 0.15) 100%), url("/landing-hero-bg.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'right center',
          backgroundRepeat: 'no-repeat',
          padding: '80px 24px 90px',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 48, alignItems: 'center' }}>
            
            {/* Left Column: Headlines, Highlights, and CTAs */}
            <div>
              <div style={{ marginBottom: 20 }}>
                <span
                  className="tag-badge"
                  style={{
                    backdropFilter: 'blur(8px)',
                    background: isDark ? 'rgba(30, 58, 138, 0.4)' : 'rgba(239, 246, 255, 0.9)',
                  }}
                >
                  AI-POWERED VIDEO INTELLIGENCE
                </span>
              </div>

              <h1 style={{ fontSize: 'clamp(2.3rem, 4vw, 3.2rem)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.15, marginBottom: 20, letterSpacing: '-0.03em' }}>
                Instant Answers to <span style={{ color: 'var(--primary)' }}>Video Lectures</span>
              </h1>

              <p style={{ fontSize: '1.02rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 32, maxWidth: 520 }}>
                Navigate complex video content with precision. Our AI engine parses audio, extracts verified reference-backed summaries, and generates adaptive quizzes in seconds.
              </p>

              {/* Stats Row with glassmorphic backdrop */}
              <div
                style={{
                  display: 'flex',
                  gap: 28,
                  marginBottom: 36,
                  padding: '16px 20px',
                  borderRadius: 10,
                  background: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.75)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid var(--border)',
                  width: 'fit-content',
                }}
              >
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>100%</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Whisper Coverage</div>
                </div>
                <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 24 }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>AI</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Powered Precision</div>
                </div>
                <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 24 }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>3+</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Summary Formats</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <button
                  id="hero-start-btn"
                  className="btn-primary"
                  onClick={() => navigate('/app')}
                  style={{
                    padding: '13px 28px',
                    fontSize: '0.95rem',
                    boxShadow: '0 8px 20px -4px rgba(37, 99, 235, 0.4)',
                  }}
                >
                  <span>Start Synthesizing</span>
                  <ArrowRight size={17} />
                </button>
                <button
                  id="hero-upload-btn"
                  className="btn-secondary"
                  onClick={() => navigate('/app')}
                  style={{
                    padding: '13px 24px',
                    fontSize: '0.95rem',
                    backdropFilter: 'blur(8px)',
                    background: isDark ? 'rgba(30, 41, 59, 0.65)' : 'rgba(255, 255, 255, 0.85)',
                  }}
                >
                  <Upload size={17} />
                  <span>Upload Video</span>
                </button>
              </div>
            </div>

            {/* Right Column: Floating Frosted-Glass Accent Cards that showcase features alongside the 3D artwork */}
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-end', justifyContent: 'center' }}>
              
              {/* Floating Pill 1: Key Takeaways */}
              <div
                style={{
                  background: isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '16px 20px',
                  boxShadow: '0 12px 32px -8px rgba(0, 0, 0, 0.15)',
                  maxWidth: 340,
                  transform: 'translateY(-10px)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={20} color="#ffffff" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>Executive Synthesis</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Automated chapter breakdowns &amp; takeaways</div>
                  </div>
                </div>
              </div>

              {/* Floating Pill 2: Adaptive Quiz */}
              <div
                style={{
                  background: isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '16px 20px',
                  boxShadow: '0 12px 32px -8px rgba(0, 0, 0, 0.15)',
                  maxWidth: 340,
                  marginRight: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <HelpCircle size={20} color="#ffffff" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>Adaptive MCQ Quizzes</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Instant scoring, explanations &amp; analytics</div>
                  </div>
                </div>
              </div>

              {/* Floating Pill 3: Whisper Precision */}
              <div
                style={{
                  background: isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '12px 18px',
                  boxShadow: '0 12px 32px -8px rgba(0, 0, 0, 0.15)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  transform: 'translateY(10px)',
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Synapse Engine v1.0 &bull; Whisper Isolated
                </span>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION (Matches Screenshot 2 Exactly: 3 Clean Cards) ── */}
      <section style={{ padding: '80px 24px', background: 'var(--bg-subtle)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          
          <div style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>
              Engineering-Grade Intelligence
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: 650 }}>
              Engineered specifically for students, researchers, and professionals to eliminate manual note-taking and verify comprehension with interactive assessments.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            
            {/* Card 1: Upload Any Video */}
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 14px 30px -10px rgba(0, 0, 0, 0.12)';
                e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <div style={{ position: 'relative', height: 190, overflow: 'hidden', background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                <img
                  src="/feature-upload.svg"
                  alt="Upload Any Video Interface"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    background: 'rgba(255, 255, 255, 0.94)',
                    backdropFilter: 'blur(8px)',
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid rgba(226, 232, 240, 0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  <Upload size={13} color="var(--primary)" />
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.04em' }}>YOUTUBE &amp; LOCAL FILES</span>
                </div>
              </div>
              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                    Upload Any Video
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Upload any MP4/MKV video recording or paste YouTube links. The engine adapts instantly to process speeches, lectures, and podcasts.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>MP4 &bull; MKV</span>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>YouTube URL</span>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>Up to 500 MB</span>
                </div>
              </div>
            </div>

            {/* Card 2: AI Summaries */}
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 14px 30px -10px rgba(0, 0, 0, 0.12)';
                e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <div style={{ position: 'relative', height: 190, overflow: 'hidden', background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                <img
                  src="/feature-summary.svg"
                  alt="Executive Briefs & Study Notes"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    background: 'rgba(255, 255, 255, 0.94)',
                    backdropFilter: 'blur(8px)',
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid rgba(226, 232, 240, 0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  <FileText size={13} color="var(--primary)" />
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.04em' }}>STRUCTURED AI NOTES</span>
                </div>
              </div>
              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                    Executive Briefs &amp; Notes
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    No more scrubbing through hours of video timelines. Receive structured executive takeaways, bullet lists, or deep-dive study summaries.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>Executive Brief</span>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>Bullet Points</span>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>Deep Dive</span>
                </div>
              </div>
            </div>

            {/* Card 3: Interactive Quizzes */}
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 14px 30px -10px rgba(0, 0, 0, 0.12)';
                e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <div style={{ position: 'relative', height: 190, overflow: 'hidden', background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                <img
                  src="/feature-quiz.svg"
                  alt="Generate Interactive Quizzes"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    background: 'rgba(255, 255, 255, 0.94)',
                    backdropFilter: 'blur(8px)',
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid rgba(226, 232, 240, 0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  <HelpCircle size={13} color="#16a34a" />
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#16a34a', letterSpacing: '0.04em' }}>COMPLIANCE &amp; MASTERY</span>
                </div>
              </div>
              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                    Generate Interactive Quizzes
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Generate custom MCQ quizzes with chosen difficulty tiers (Easy, Medium, Hard) to test recall with instant scoring and explanations.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>Easy / Med / Hard</span>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>Instant Feedback</span>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>Score Analytics</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FAQ ACCORDION SECTION ── */}
      <section style={{ padding: '80px 24px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em', marginBottom: 6 }}>Common Questions</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>Frequently Asked Questions</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}
                >
                  <span>{faq.q}</span>
                  {isOpen ? <Minus size={16} color="var(--primary)" /> : <Plus size={16} color="var(--text-muted)" />}
                </button>
                {isOpen && (
                  <div style={{ padding: '0 20px 18px', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CTA BANNER (Matches Screenshot 3: Dark Blue Banner with Orange CTA) ── */}
      <section style={{ background: '#0c1e35', color: '#ffffff', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.3rem', fontWeight: 800, marginBottom: 14, letterSpacing: '-0.02em', color: '#ffffff' }}>
            Ready for Video Intelligence?
          </h2>
          <p style={{ fontSize: '1rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: 36 }}>
            Stop wasting hours scrubbing through long video timelines. Let Synapse AI extract the key knowledge and generate instant quizzes.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button id="cta-start-btn" className="btn-accent-orange" onClick={() => navigate('/register')}>
              <span>Start Learning Now</span>
            </button>
            <button
              id="cta-upload-btn"
              onClick={() => navigate('/app')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
              }}
            >
              <Upload size={17} />
              <span>Upload Video</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER (Matches Screenshot 3 Multi-Column Clean Footer) ── */}
      <footer style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', padding: '60px 24px 30px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 50 }}>
            <div style={{ gridColumn: 'span 1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: '#0b326f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={16} color="#ffffff" />
                </div>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Synapse AI</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 260 }}>
                The precision video intelligence platform built to automate note-taking and knowledge verification.
              </p>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Pages</div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <li><span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>Home</span></li>
                <li><span style={{ cursor: 'pointer' }} onClick={() => navigate('/app')}>Upload Video</span></li>
                <li><span style={{ cursor: 'pointer' }} onClick={() => navigate('/app?tab=history')}>Library</span></li>
                <li><span style={{ cursor: 'pointer' }} onClick={() => navigate('/app?tab=analytics')}>Performance Stats</span></li>
              </ul>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Account</div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <li><span style={{ cursor: 'pointer' }} onClick={() => navigate('/login')}>Login</span></li>
                <li><span style={{ cursor: 'pointer' }} onClick={() => navigate('/register')}>Register</span></li>
                <li><span style={{ cursor: 'pointer' }} onClick={() => navigate('/forgot-password')}>Forgot Password</span></li>
              </ul>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Technology</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Powered by OpenAI Whisper speech-to-text model and adaptive LLM reasoning engines.
              </p>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div>&copy; {new Date().getFullYear()} Synapse AI. All Rights Reserved.</div>
            <div style={{ display: 'flex', gap: 20 }}>
              <span style={{ cursor: 'pointer' }}>PRIVACY POLICY</span>
              <span style={{ cursor: 'pointer' }}>TERMS OF USE</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
