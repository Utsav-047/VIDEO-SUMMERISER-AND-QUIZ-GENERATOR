import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  Upload, FileVideo, CheckCircle2, Loader2, AlertCircle,
  FileText, Sliders, HelpCircle, X, ArrowRight,
  Clipboard, Play
} from 'lucide-react';

function YoutubeIcon({ size = 18, color = '#ef4444' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ color, flexShrink: 0 }}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

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
      return `Unsupported format '${ext}'. Allowed: MP4, MKV, MOV, WEBM, AVI, MP3, WAV.`;
    }
    if (selectedFile.size === 0) return 'The selected file is empty.';
    if (selectedFile.size > MAX_FILE_SIZE) {
      return `File exceeds maximum upload limit of 500 MB (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB).`;
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

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setYoutubeUrl(text.trim());
        setError('');
      }
    } catch {
      // Browser blocked clipboard reading
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
      setError('Please enter a valid YouTube video URL');
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
      setError(err.message || 'Processing failed. Please check the video link or file.');
    } finally {
      setProcessing(false);
      setCurrentStep(0);
    }
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      
      {/* ── CLEAN STUDIO HEADER ── */}
      <div style={{ marginBottom: 24, textAlign: 'left' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>
          Video Intelligence Studio
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Extract audio transcripts, synthesize executive takeaways, and generate adaptive MCQ quizzes.
        </p>
      </div>

      {/* ── MAIN STUDIO CARD (Clean, Minimal, Professional) ── */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '28px',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
        }}
      >
        {/* Mode Toggle Pills */}
        <div
          style={{
            display: 'inline-flex',
            background: 'var(--bg-subtle)',
            padding: 4,
            borderRadius: 8,
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
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              background: mode === 'youtube' ? 'var(--bg-surface)' : 'transparent',
              color: mode === 'youtube' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              boxShadow: mode === 'youtube' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <YoutubeIcon size={16} />
            <span>YouTube URL</span>
          </button>

          <button
            id="mode-upload-btn"
            type="button"
            onClick={() => setMode('upload')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              background: mode === 'upload' ? 'var(--bg-surface)' : 'transparent',
              color: mode === 'upload' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              boxShadow: mode === 'upload' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Upload size={15} color={mode === 'upload' ? 'var(--primary)' : 'var(--text-muted)'} />
            <span>Upload File (MP4, MKV)</span>
          </button>
        </div>

        {/* Error Alert */}
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
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 600 }}>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {mode === 'youtube' ? (
            <div style={{ marginBottom: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                  YOUTUBE VIDEO LINK
                </label>
                {isYoutubeValid(youtubeUrl) && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.74rem', fontWeight: 700, color: '#10b981' }}>
                    <CheckCircle2 size={13} color="#10b981" />
                    Valid Link
                  </span>
                )}
              </div>

              {/* Input Box */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <div style={{ position: 'absolute', left: 14, display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                  <YoutubeIcon size={18} />
                </div>

                <input
                  id="youtube-url-input"
                  type="url"
                  placeholder="Paste YouTube link here..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  disabled={processing}
                  className="clean-input"
                  style={{
                    paddingLeft: 42,
                    paddingRight: youtubeUrl ? 100 : 76,
                    height: 48,
                    fontSize: '0.92rem',
                    borderRadius: 8,
                  }}
                />

                <div style={{ position: 'absolute', right: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {!youtubeUrl && (
                    <button
                      type="button"
                      onClick={handlePaste}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '5px 10px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        color: 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
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
                      style={{ padding: '6px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 22 }}>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 8 }}>
                UPLOAD VIDEO FILE (MAX 500 MB)
              </label>
              
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${dragActive ? 'var(--primary)' : 'var(--border-strong)'}`,
                  borderRadius: 10,
                  padding: '32px 20px',
                  textAlign: 'center',
                  background: dragActive ? 'var(--primary-light)' : 'var(--bg-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
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
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <FileVideo size={32} color="var(--primary)" />
                    <span style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--text-primary)' }}>{file.name}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {(file.size / (1024 * 1024)).toFixed(2)} MB &bull; Click to change
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <Upload size={28} color="var(--text-muted)" />
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                      Drop your video file here or click to browse
                    </span>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      Supported formats: MP4, MKV, MOV, WEBM (up to 500 MB)
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── OPTIONS GRID ── */}
          <div
            style={{
              background: 'var(--bg-subtle)',
              borderRadius: 10,
              border: '1px solid var(--border)',
              padding: '18px 20px',
              marginBottom: 22,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 18,
            }}
          >
            {/* Format */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <FileText size={13} color="var(--primary)" />
                <label style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                  SUMMARY FORMAT
                </label>
              </div>
              <select
                id="summary-format-select"
                value={summaryFormat}
                onChange={(e) => setSummaryFormat(e.target.value)}
                disabled={processing}
                className="clean-input"
                style={{ height: 40, padding: '6px 10px', fontSize: '0.84rem', fontWeight: 600, borderRadius: 6 }}
              >
                <option value="executive">Executive Brief (Takeaways)</option>
                <option value="bullet">Rapid Bullet Points</option>
                <option value="deep-dive">Deep Dive Study Notes</option>
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Sliders size={13} color="var(--primary)" />
                <label style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                  QUIZ DIFFICULTY
                </label>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { lvl: 'easy', label: 'Easy' },
                  { lvl: 'medium', label: 'Medium' },
                  { lvl: 'hard', label: 'Hard' },
                ].map(({ lvl, label }) => {
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
                        padding: '9px 0',
                        borderRadius: 6,
                        border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-strong)'}`,
                        background: isSelected ? 'var(--primary)' : 'var(--bg-surface)',
                        color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Questions */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <HelpCircle size={13} color="var(--primary)" />
                <label style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                  QUESTIONS
                </label>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
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
                        padding: '9px 0',
                        borderRadius: 6,
                        border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-strong)'}`,
                        background: isSelected ? 'var(--primary)' : 'var(--bg-surface)',
                        color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {count}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── PROCESSING PIPELINE ── */}
          {processing && (
            <div
              style={{
                background: 'var(--primary-light)',
                border: '1px solid var(--primary-border)',
                borderRadius: 10,
                padding: '20px',
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Loader2 size={16} className="animate-spin" color="var(--primary)" />
                  <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--primary)' }}>
                    Synthesizing Video...
                  </span>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 800 }}>
                  Step {currentStep} of 4
                </span>
              </div>

              {/* Progress Line */}
              <div style={{ height: 5, background: 'var(--bg-surface)', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(currentStep / 4) * 100}%`,
                    background: 'var(--primary)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                {[
                  { step: 1, title: 'Acquiring Video' },
                  { step: 2, title: '16kHz Audio Track' },
                  { step: 3, title: 'Speech-to-Text' },
                  { step: 4, title: 'Summary & Quiz' },
                ].map((stage) => {
                  const isCurrent = currentStep === stage.step;
                  const isDone = currentStep > stage.step;
                  return (
                    <div
                      key={stage.step}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 6,
                        background: 'var(--bg-surface)',
                        border: `1px solid ${isCurrent ? 'var(--primary)' : isDone ? '#10b981' : 'var(--border)'}`,
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        color: isCurrent ? 'var(--primary)' : isDone ? '#10b981' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {isDone ? <CheckCircle2 size={12} color="#10b981" /> : isCurrent ? <Loader2 size={12} className="animate-spin" color="var(--primary)" /> : null}
                      <span>{stage.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            id="synthesize-video-submit-btn"
            type="submit"
            disabled={processing}
            className="btn-primary"
            style={{
              width: '100%',
              height: 48,
              fontSize: '0.96rem',
              fontWeight: 800,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: processing ? 'not-allowed' : 'pointer',
            }}
          >
            {processing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Processing Video...</span>
              </>
            ) : (
              <>
                <FileText size={18} />
                <span>Synthesize Video &amp; Generate Quiz</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>

    </div>
  );
}
