import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  Upload, FileVideo, CheckCircle2, Loader2, AlertCircle,
  FileText, Sliders, HelpCircle, X, Volume2, Bot, ArrowRight,
  Sparkles, Clipboard, Play, Check, Zap, ShieldCheck, Layers
} from 'lucide-react';

function YoutubeIcon({ size = 18, color = '#ef4444' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ color, flexShrink: 0 }}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

const SAMPLE_VIDEOS = [
  { title: 'Quantum Computing 101', category: 'Science', url: 'https://www.youtube.com/watch?v=JhHMJCUmq28' },
  { title: 'Economic Principles & Cycles', category: 'Finance', url: 'https://www.youtube.com/watch?v=PHe0bXAIuk8' },
  { title: 'Neuroscience of Deep Focus', category: 'Productivity', url: 'https://www.youtube.com/watch?v=4bcfyv5eMog' },
];

export default function VideoProcessor({ initialUrl, onProcessingComplete }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState(initialUrl || '');
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Settings
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [summaryFormat, setSummaryFormat] = useState('executive');

  // Processing state
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (initialUrl) {
      setYoutubeUrl(initialUrl);
      setMode('youtube');
    }
  }, [initialUrl]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const ALLOWED_EXTENSIONS = ['.mp4', '.mkv', '.mov', '.webm', '.avi', '.flv', '.wmv', '.m4v', '.mp3', '.wav', '.m4a'];
  const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

  const validateFile = (selectedFile) => {
    if (!selectedFile) return 'Please select or drop a video file.';
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Unsupported file format '${ext}'. Allowed formats: MP4, MKV, MOV, WEBM, AVI, MP3, WAV.`;
    }
    if (selectedFile.size === 0) {
      return 'The selected file is empty (0 bytes).';
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      return `File exceeds maximum allowed upload size of 500 MB (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB).`;
    }
    return null;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const validationError = validateFile(droppedFile);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError('');
      setFile(droppedFile);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const validationError = validateFile(selected);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError('');
      setFile(selected);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setYoutubeUrl(text.trim());
        setError('');
      }
    } catch {
      // Clipboard read blocked by browser permissions
    }
  };

  const isYoutubeValid = (url) => {
    if (!url) return false;
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i.test(url.trim());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!user) {
      navigate('/login');
      return;
    }

    if (mode === 'youtube' && !youtubeUrl.trim()) {
      setError('Please provide a valid YouTube URL');
      return;
    }

    if (mode === 'upload') {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setProcessing(true);
    setCurrentStep(1);

    try {
      const stepTimer1 = setTimeout(() => setCurrentStep(2), 2000);
      const stepTimer2 = setTimeout(() => setCurrentStep(3), 5000);

      const processRes = await api.processVideo({
        youtubeUrl: mode === 'youtube' ? youtubeUrl : undefined,
        file: mode === 'upload' ? file : undefined,
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      setCurrentStep(4);
      const genRes = await api.generate(processRes.video_id, processRes.transcript, {
        difficulty,
        numQuestions,
        summaryFormat,
      });

      onProcessingComplete({
        videoId: processRes.video_id,
        title: processRes.title,
        transcript: processRes.transcript,
        summary: genRes.summary,
        quiz: genRes.quiz,
        quizId: genRes.quiz_id,
        difficulty,
        summaryFormat,
      });
    } catch (err) {
      setError(err.message || 'Processing failed. Please check the video source and try again.');
    } finally {
      setProcessing(false);
      setCurrentStep(0);
    }
  };

  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      
      {/* ── STUDIO HERO HEADER (Professional & Welcoming) ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 999, background: 'var(--primary-light)', border: '1px solid var(--primary-border)', marginBottom: 12 }}>
          <Sparkles size={13} color="var(--primary)" />
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.04em' }}>
            AI SYNTHESIS STUDIO &bull; WHISPER 16KHZ
          </span>
        </div>

        <h1 style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.2 }}>
          Transform Video Lectures into Verified Knowledge
        </h1>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', maxWidth: 720, lineHeight: 1.6 }}>
          Paste a YouTube link or upload recorded lectures to extract isolated audio transcripts, synthesize executive takeaways, and generate adaptive comprehension quizzes.
        </p>

        {/* Studio Highlights Bar */}
        <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            <CheckCircle2 size={14} color="#10b981" />
            98%+ Whisper Audio Accuracy
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            <CheckCircle2 size={14} color="#10b981" />
            3 Structured Synthesis Formats
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            <CheckCircle2 size={14} color="#10b981" />
            Adaptive Instant Quizzes &amp; Feedback
          </span>
        </div>
      </div>

      {/* ── MAIN STUDIO CARD (Modern, Sleek, Fully Theme-Aware) ── */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '28px 32px',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        {/* Subtle Top Accent Gradient Line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, var(--primary) 0%, #3b82f6 50%, #10b981 100%)',
          }}
        />

        {/* ── SEGMENTED MODE SWITCHER ── */}
        <div
          style={{
            display: 'inline-flex',
            background: 'var(--bg-subtle)',
            padding: 4,
            borderRadius: 10,
            border: '1px solid var(--border)',
            marginBottom: 24,
            gap: 4,
          }}
        >
          <button
            id="mode-youtube-btn"
            type="button"
            onClick={() => setMode('youtube')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 18px',
              borderRadius: 8,
              border: mode === 'youtube' ? '1px solid var(--border)' : '1px solid transparent',
              background: mode === 'youtube' ? 'var(--bg-surface)' : 'transparent',
              color: mode === 'youtube' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              boxShadow: mode === 'youtube' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <YoutubeIcon size={18} />
            <span>YouTube Video URL</span>
          </button>

          <button
            id="mode-upload-btn"
            type="button"
            onClick={() => setMode('upload')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 18px',
              borderRadius: 8,
              border: mode === 'upload' ? '1px solid var(--border)' : '1px solid transparent',
              background: mode === 'upload' ? 'var(--bg-surface)' : 'transparent',
              color: mode === 'upload' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              boxShadow: mode === 'upload' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Upload size={16} color={mode === 'upload' ? 'var(--primary)' : 'var(--text-muted)'} />
            <span>Upload Video File (MP4, MKV)</span>
          </button>
        </div>

        {/* ── ERROR ALERT BOX (Theme-Aware: Works in both light & dark mode) ── */}
        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.10)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: 'var(--accent-red)',
              padding: '12px 16px',
              borderRadius: 8,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 20,
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 600 }}>{error}</span>
          </div>
        )}

        {/* ── FORM ── */}
        <form onSubmit={handleSubmit}>
          {mode === 'youtube' ? (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                <label style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
                  ENTER YOUTUBE VIDEO URL
                </label>
                {isYoutubeValid(youtubeUrl) && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.74rem', fontWeight: 700, color: '#10b981' }}>
                    <CheckCircle2 size={13} color="#10b981" />
                    Valid YouTube Link Detected
                  </span>
                )}
              </div>

              {/* Enhanced Input Field with Left Icon & Right Quick Actions */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <div style={{ position: 'absolute', left: 14, display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                  <YoutubeIcon size={20} />
                </div>

                <input
                  id="youtube-url-input"
                  type="url"
                  placeholder="Paste YouTube link (e.g. https://www.youtube.com/watch?v=JhHMJCUmq28)"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  disabled={processing}
                  className="clean-input"
                  style={{
                    paddingLeft: 46,
                    paddingRight: youtubeUrl ? 110 : 86,
                    height: 50,
                    fontSize: '0.94rem',
                    borderRadius: 8,
                    fontWeight: 500,
                  }}
                />

                {/* Right Input Tools (Paste & Clear) */}
                <div style={{ position: 'absolute', right: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {!youtubeUrl && (
                    <button
                      type="button"
                      onClick={handlePasteFromClipboard}
                      title="Paste from Clipboard"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '5px 9px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        color: 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Clipboard size={12} />
                      <span>Paste</span>
                    </button>
                  )}

                  {youtubeUrl && !processing && (
                    <button
                      type="button"
                      onClick={() => setYoutubeUrl('')}
                      title="Clear URL"
                      style={{
                        padding: '6px 8px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        borderRadius: 4,
                      }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Sample Suggestions Pill Strip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  ⚡ Quick Try:
                </span>
                {SAMPLE_VIDEOS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setYoutubeUrl(s.url);
                      setError('');
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: youtubeUrl === s.url ? 'var(--primary-light)' : 'var(--bg-subtle)',
                      border: `1px solid ${youtubeUrl === s.url ? 'var(--primary)' : 'var(--border)'}`,
                      color: youtubeUrl === s.url ? 'var(--primary)' : 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Play size={10} color={youtubeUrl === s.url ? 'var(--primary)' : 'var(--text-muted)'} />
                    <span>{s.title}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: 8 }}>
                UPLOAD RECORDED LECTURE OR VIDEO FILE
              </label>
              
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${dragActive ? 'var(--primary)' : 'var(--border-strong)'}`,
                  borderRadius: 10,
                  padding: '38px 20px',
                  textAlign: 'center',
                  background: dragActive ? 'var(--primary-light)' : 'var(--bg-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => document.getElementById('video-file-picker').click()}
              >
                <input
                  id="video-file-picker"
                  type="file"
                  accept="video/*,audio/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />

                {file ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileVideo size={26} color="var(--primary)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-primary)' }}>{file.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {(file.size / (1024 * 1024)).toFixed(2)} MB &bull; Ready for Whisper extraction
                      </div>
                    </div>
                    <span style={{ fontSize: '0.76rem', color: 'var(--primary)', fontWeight: 700, padding: '4px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6 }}>
                      Click to replace file
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Upload size={24} color="var(--primary)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                        Click to browse or drop your video file here
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Maximum upload size: 500 MB &bull; Client-side security checked
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
                      {['MP4', 'MKV', 'MOV', 'WEBM', 'MP3', 'WAV'].map((fmt) => (
                        <span key={fmt} style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                          {fmt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── OPTIONS BAR (Summary Format, Difficulty, Question Count) ── */}
          <div
            style={{
              background: 'var(--bg-subtle)',
              borderRadius: 12,
              border: '1px solid var(--border)',
              padding: '20px 24px',
              marginBottom: 24,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: 20,
            }}
          >
            {/* 1. Summary Format */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <FileText size={14} color="var(--primary)" />
                <label style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
                  SUMMARY FORMAT
                </label>
              </div>
              <select
                id="summary-format-select"
                value={summaryFormat}
                onChange={(e) => setSummaryFormat(e.target.value)}
                disabled={processing}
                className="clean-input"
                style={{ height: 42, padding: '6px 12px', fontSize: '0.85rem', fontWeight: 600, borderRadius: 6 }}
              >
                <option value="executive">Executive Brief (Takeaways)</option>
                <option value="bullet">Rapid Bullet Points</option>
                <option value="deep-dive">Deep Dive Study Notes</option>
              </select>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 5 }}>
                {summaryFormat === 'executive' && 'High-level synthesis with core conclusions'}
                {summaryFormat === 'bullet' && 'Fast digestible bullets for rapid review'}
                {summaryFormat === 'deep-dive' && 'Exhaustive notes with definitions & formulas'}
              </div>
            </div>

            {/* 2. Quiz Difficulty */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Sliders size={14} color="var(--primary)" />
                <label style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
                  QUIZ DIFFICULTY
                </label>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { lvl: 'easy', label: 'Easy', emoji: '🌱' },
                  { lvl: 'medium', label: 'Medium', emoji: '⚡' },
                  { lvl: 'hard', label: 'Hard', emoji: '🔥' },
                ].map(({ lvl, label, emoji }) => {
                  const isSelected = difficulty === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      id={`diff-btn-${lvl}`}
                      onClick={() => setDifficulty(lvl)}
                      disabled={processing}
                      style={{
                        flex: 1,
                        fontSize: '0.82rem',
                        padding: '10px 0',
                        borderRadius: 6,
                        border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-strong)'}`,
                        background: isSelected ? 'var(--primary)' : 'var(--bg-surface)',
                        color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 2px 6px rgba(37, 99, 235, 0.25)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                      }}
                    >
                      <span>{emoji}</span>
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 5 }}>
                {difficulty === 'easy' && 'Tests foundational terminology & facts'}
                {difficulty === 'medium' && 'Balanced comprehension & core principles'}
                {difficulty === 'hard' && 'Advanced reasoning & critical deductions'}
              </div>
            </div>

            {/* 3. Number of Questions */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <HelpCircle size={14} color="var(--primary)" />
                <label style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
                  QUESTION COUNT
                </label>
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                {[3, 5, 10, 15, 20].map((count) => {
                  const isSelected = numQuestions === count;
                  return (
                    <button
                      key={count}
                      type="button"
                      id={`count-btn-${count}`}
                      onClick={() => setNumQuestions(count)}
                      disabled={processing}
                      style={{
                        flex: 1,
                        fontSize: '0.8rem',
                        padding: '10px 0',
                        borderRadius: 6,
                        border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-strong)'}`,
                        background: isSelected ? 'var(--primary)' : 'var(--bg-surface)',
                        color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 2px 6px rgba(37, 99, 235, 0.25)' : 'none',
                      }}
                    >
                      {count}
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 5 }}>
                Generates {numQuestions} verified multiple-choice questions
              </div>
            </div>
          </div>

          {/* ── PROCESSING PIPELINE INDICATOR (Animated & Theme-Aware) ── */}
          {processing && (
            <div
              style={{
                background: 'var(--primary-light)',
                border: '1px solid var(--primary-border)',
                borderRadius: 10,
                padding: '22px',
                marginBottom: 24,
                animation: 'fadeIn 0.3s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Loader2 size={18} className="animate-spin" color="var(--primary)" />
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary)' }}>
                    Synthesizing Video &amp; Generating Quiz...
                  </span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: 'var(--bg-surface)' }}>
                  Step {currentStep} of 4
                </span>
              </div>

              {/* Progress Track */}
              <div style={{ height: 6, background: 'var(--bg-surface)', borderRadius: 3, overflow: 'hidden', marginBottom: 16 }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(currentStep / 4) * 100}%`,
                    background: 'linear-gradient(90deg, var(--primary), #10b981)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>

              {/* 4 Pipeline Stages */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                {[
                  { step: 1, title: 'Acquiring Video', desc: 'Fetching stream source' },
                  { step: 2, title: 'Audio Extraction', desc: '16kHz Whisper isolation' },
                  { step: 3, title: 'Speech-to-Text', desc: 'Transcription & timestamps' },
                  { step: 4, title: 'AI Synthesis', desc: 'Summary & Quiz generation' },
                ].map((stage) => {
                  const isCurrent = currentStep === stage.step;
                  const isDone = currentStep > stage.step;
                  return (
                    <div
                      key={stage.step}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: isCurrent ? 'var(--bg-surface)' : isDone ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-surface)',
                        border: `1px solid ${isCurrent ? 'var(--primary)' : isDone ? '#10b981' : 'var(--border)'}`,
                        boxShadow: isCurrent ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        {isDone ? (
                          <CheckCircle2 size={14} color="#10b981" />
                        ) : isCurrent ? (
                          <Loader2 size={14} className="animate-spin" color="var(--primary)" />
                        ) : (
                          <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid var(--border-strong)' }} />
                        )}
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: isCurrent ? 'var(--primary)' : isDone ? '#10b981' : 'var(--text-muted)' }}>
                          {stage.title}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{stage.desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── SUBMIT CTA (Gradient, Dynamic, Premium) ── */}
          <button
            id="synthesize-video-submit-btn"
            type="submit"
            disabled={processing}
            className="btn-primary"
            style={{
              width: '100%',
              height: 50,
              fontSize: '1rem',
              fontWeight: 800,
              borderRadius: 8,
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              cursor: processing ? 'not-allowed' : 'pointer',
            }}
          >
            {processing ? (
              <>
                <Loader2 size={19} className="animate-spin" />
                <span>Synthesizing Video...</span>
              </>
            ) : (
              <>
                <FileText size={19} />
                <span>Synthesize Video &amp; Generate Quiz</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>
      </div>

      {/* ── BOTTOM CAPABILITIES STRIP (Clean & Professional) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 24 }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Volume2 size={16} color="var(--primary)" />
          </div>
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>Whisper Diarization</div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: 2 }}>
              Separates audio frequencies into high-clarity speech streams for accurate technical transcription.
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bot size={16} color="var(--primary)" />
          </div>
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>Structured Synthesis</div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: 2 }}>
              Parses key takeaways, formulas, definitions, and conclusions into customizable study formats.
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShieldCheck size={16} color="var(--primary)" />
          </div>
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>Private &amp; Verified</div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: 2 }}>
              Secure ownership verification on every video processing request and quiz evaluation attempt.
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
