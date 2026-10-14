import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  Upload, FileVideo, CheckCircle2, Loader2, AlertCircle,
  FileText, Sliders, HelpCircle, X, Volume2, Bot, ArrowRight
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

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
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

    if (mode === 'upload' && !file) {
      setError('Please select or drop a video file');
      return;
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
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '32px', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
      
      {/* Mode Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
        <button
          id="mode-youtube-btn"
          type="button"
          onClick={() => setMode('youtube')}
          className="btn-secondary"
          style={{
            background: mode === 'youtube' ? 'var(--primary-light)' : 'transparent',
            borderColor: mode === 'youtube' ? 'var(--primary)' : 'var(--border-strong)',
            color: mode === 'youtube' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: 700,
          }}
        >
          <YoutubeIcon size={18} />
          <span>YouTube Video URL</span>
        </button>

        <button
          id="mode-upload-btn"
          type="button"
          onClick={() => setMode('upload')}
          className="btn-secondary"
          style={{
            background: mode === 'upload' ? 'var(--primary-light)' : 'transparent',
            borderColor: mode === 'upload' ? 'var(--primary)' : 'var(--border-strong)',
            color: mode === 'upload' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: 700,
          }}
        >
          <Upload size={18} />
          <span>Upload Video File (MP4, MKV)</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: '6px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Form Input */}
      <form onSubmit={handleSubmit}>
        {mode === 'youtube' ? (
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              ENTER YOUTUBE URL
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', left: '14px', display: 'flex', alignItems: 'center' }}>
                <YoutubeIcon size={20} />
              </div>
              <input
                id="youtube-url-input"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                disabled={processing}
                className="clean-input"
                style={{ paddingLeft: '44px', paddingRight: youtubeUrl ? '40px' : '14px', height: '48px', fontSize: '0.95rem' }}
              />
              {youtubeUrl && !processing && (
                <button
                  type="button"
                  onClick={() => setYoutubeUrl('')}
                  style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              Supported: YouTube tutorials, lectures, conference talks, and educational videos.
            </p>
          </div>
        ) : (
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              UPLOAD RECORDED LECTURE OR VIDEO FILE
            </label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragActive ? 'var(--primary)' : 'var(--border-strong)'}`,
                borderRadius: '8px',
                padding: '36px 20px',
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
                accept="video/*"
                onChange={(e) => e.target.files && setFile(e.target.files[0])}
                style={{ display: 'none' }}
              />
              {file ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <FileVideo size={36} color="var(--primary)" />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{file.name}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {(file.size / (1024 * 1024)).toFixed(2)} MB &bull; Click to replace file
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <Upload size={32} color="var(--text-muted)" />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Click to browse or drop your video file here</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Supported formats: MP4, MKV, MOV, WEBM</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Options Bar */}
        <div
          style={{
            background: 'var(--bg-subtle)',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            padding: '20px',
            marginBottom: '24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              SUMMARY FORMAT
            </label>
            <select
              id="summary-format-select"
              value={summaryFormat}
              onChange={(e) => setSummaryFormat(e.target.value)}
              disabled={processing}
              className="clean-input"
              style={{ height: '40px', padding: '6px 12px', fontSize: '0.85rem' }}
            >
              <option value="executive">Executive Brief (Takeaways)</option>
              <option value="bullet">Rapid Bullet Points</option>
              <option value="deep-dive">Deep Dive Study Notes</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              QUIZ DIFFICULTY
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['easy', 'medium', 'hard'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  id={`diff-btn-${lvl}`}
                  onClick={() => setDifficulty(lvl)}
                  disabled={processing}
                  className="btn-secondary"
                  style={{
                    flex: 1,
                    textTransform: 'capitalize',
                    fontSize: '0.82rem',
                    padding: '8px 0',
                    borderColor: difficulty === lvl ? '#0b326f' : 'var(--border-strong)',
                    background: difficulty === lvl ? '#0b326f' : 'var(--bg-surface)',
                    color: difficulty === lvl ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: 700,
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              NUMBER OF QUESTIONS
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[3, 5, 10, 15, 20].map((count) => (
                <button
                  key={count}
                  type="button"
                  id={`count-btn-${count}`}
                  onClick={() => setNumQuestions(count)}
                  disabled={processing}
                  className="btn-secondary"
                  style={{
                    flex: 1,
                    minWidth: '42px',
                    fontSize: '0.8rem',
                    padding: '8px 4px',
                    borderColor: numQuestions === count ? '#0b326f' : 'var(--border-strong)',
                    background: numQuestions === count ? '#0b326f' : 'var(--bg-surface)',
                    color: numQuestions === count ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {count} Qs
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Processing Indicator Pipeline */}
        {processing && (
          <div
            style={{
              background: 'var(--primary-light)',
              border: '1px solid var(--primary-border)',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader2 size={18} className="animate-spin" color="var(--primary)" />
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)' }}>Processing Video &amp; Generating Quiz...</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>Step {currentStep} of 4</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
              {[
                { step: 1, title: 'Acquiring Video', desc: 'Fetching stream' },
                { step: 2, title: 'Audio Extraction', desc: '16kHz isolation' },
                { step: 3, title: 'Whisper Speech-to-Text', desc: 'Transcription' },
                { step: 4, title: 'Synthesis', desc: 'Summary & Quiz' },
              ].map((stage) => {
                const isCurrent = currentStep === stage.step;
                const isDone = currentStep > stage.step;
                return (
                  <div
                    key={stage.step}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      background: isCurrent ? 'var(--bg-surface)' : isDone ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-surface)',
                      border: `1px solid ${isCurrent ? 'var(--primary)' : isDone ? '#10b981' : 'var(--border)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      {isDone ? <CheckCircle2 size={14} color="#10b981" /> : isCurrent ? <Loader2 size={14} className="animate-spin" color="var(--primary)" /> : null}
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isCurrent ? 'var(--primary)' : isDone ? '#10b981' : 'var(--text-muted)' }}>
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

        {/* Submit CTA */}
        <button
          id="synthesize-video-submit-btn"
          type="submit"
          disabled={processing}
          className="btn-primary"
          style={{ width: '100%', height: '48px', fontSize: '1rem', borderRadius: '6px' }}
        >
          {processing ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Synthesizing Video...</span>
            </>
          ) : (
            <>
              <FileText size={18} />
              <span>Synthesize Video &amp; Generate Quiz</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
