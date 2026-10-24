import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import VideoProcessor from './components/VideoProcessor';
import SummaryViewer from './components/SummaryViewer';
import QuizPlayer from './components/QuizPlayer';
import FlashcardPlayer from './components/FlashcardPlayer';
import MindmapViewer from './components/MindmapViewer';
import VideoChatDrawer from './components/VideoChatDrawer';
import HistoryFeed from './components/HistoryFeed';
import PerformanceStats from './components/PerformanceStats';
import AdminDashboard from './pages/AdminDashboard';
import {
  FileText, Video, History, BarChart2, PlusCircle,
  Home, LogOut, Sun, Moon, ArrowLeft, Layers, User,
  ShieldCheck, MessageSquare, Compass, Sparkles, Award
} from 'lucide-react';

function AppShell({ isDark, toggleTheme }) {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Tab: 'dashboard' | 'history' | 'analytics'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentResult, setCurrentResult] = useState(null);
  const [resultSubView, setResultSubView] = useState('summary');
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [initialVideoUrl, setInitialVideoUrl] = useState('');

  // Handle URL query parameters (e.g. /app?tab=history or /app?url=...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    const urlParam = params.get('url');
    if (tabParam === 'history' || tabParam === 'analytics') {
      setActiveTab(tabParam);
    }
    if (urlParam) {
      setInitialVideoUrl(urlParam);
      setActiveTab('dashboard');
    }
  }, [location.search]);

  const handleProcessingComplete = (data) => {
    setCurrentResult(data);
    setResultSubView('summary');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectFromHistory = (item) => {
    let parsedQuiz = [];
    if (item.questions_json) {
      if (Array.isArray(item.questions_json)) {
        parsedQuiz = item.questions_json;
      } else if (typeof item.questions_json === 'string') {
        try {
          parsedQuiz = JSON.parse(item.questions_json);
        } catch {
          parsedQuiz = [];
        }
      }
    }
    const summaryText = item.summary || item.summary_text || 'Summary unavailable.';
    setCurrentResult({
      videoId: item.id || item.video_id,
      title: item.title || item.source_ref || 'Video Summary',
      transcript: item.transcript || item.transcript_text || '',
      summary: summaryText,
      quiz: parsedQuiz,
      quizId: item.quiz_id || item.id || item.video_id,
    });
    setActiveTab('dashboard');
    setResultSubView('summary');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, background: 'var(--bg-page)' }}>
        <div style={{ width: 40, height: 40, borderRadius: 8, background: '#0b326f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText size={22} color="#ffffff" />
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Loading Synapse AI...</div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      
      {/* ── LEFT SIDEBAR (Matches User's Reference Screenshot 2 Exactly) ── */}
      <aside className="app-sidebar">
        <div>
          {/* Top Brand Box */}
          <div className="sidebar-brand" onClick={() => navigate('/')}>
            <div style={{ width: 34, height: 34, borderRadius: 6, background: '#0b326f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileText size={18} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>Synapse AI</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Video Intelligence</div>
            </div>
          </div>

          {/* Primary Sidebar Action Button: "+ New Video Summary" */}
          <button
            id="sidebar-new-check-btn"
            className="sidebar-cta-btn"
            onClick={() => {
              setCurrentResult(null);
              setInitialVideoUrl('');
              setActiveTab('dashboard');
            }}
          >
            <PlusCircle size={18} />
            <span>New Video Summary</span>
          </button>

          {/* Sidebar Menu Items */}
          <div className="sidebar-menu">
            <button
              id="sidebar-tab-studio"
              className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <Video size={17} />
              <span>Studio</span>
            </button>

            <button
              id="sidebar-tab-history"
              className={`sidebar-item ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <History size={17} />
              <span>History</span>
            </button>

            <button
              id="sidebar-tab-analytics"
              className={`sidebar-item ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart2 size={17} />
              <span>Analytics</span>
            </button>

            {user?.role === 'admin' && (
              <button
                id="sidebar-tab-admin"
                className="sidebar-item"
                onClick={() => navigate('/admin')}
                style={{ color: '#0b326f', fontWeight: 700 }}
              >
                <ShieldCheck size={17} color="#0b326f" />
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  Admin Portal
                  <span style={{ fontSize: '0.62rem', background: 'rgba(11, 50, 111, 0.12)', color: '#0b326f', padding: '1px 6px', borderRadius: 4, border: '1px solid #bfdbfe' }}>
                    ADMIN
                  </span>
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Bottom Pinned Items (Home, Theme Toggle, Logout) */}
        <div className="sidebar-footer">
          <button
            className="sidebar-item"
            onClick={() => navigate('/')}
            style={{ fontWeight: 600, color: 'var(--text-secondary)' }}
          >
            <Home size={17} />
            <span>Home</span>
          </button>

          <button
            className="sidebar-item"
            onClick={toggleTheme}
            style={{ fontWeight: 600, color: 'var(--text-secondary)' }}
          >
            {isDark ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="#0b326f" />}
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          {user && (
            <button
              id="sidebar-logout-btn"
              className="sidebar-item"
              onClick={handleLogout}
              style={{ color: '#ef4444', fontWeight: 600 }}
            >
              <LogOut size={17} />
              <span>Logout</span>
            </button>
          )}
        </div>
      </aside>

      {/* ── RIGHT MAIN VIEW ── */}
      <div className="app-main-view">
        
        {/* Top Status Bar (Matching Reference Screenshot 2) */}
        <header className="app-top-status-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Synapse Video Intelligence
            </h2>
            <div className="status-pill-green">
              <span>&bull;</span>
              <span>LIVE SYNTHESIS READY</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              id="topbar-theme-toggle-btn"
              onClick={toggleTheme}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: '1px solid var(--border-strong)',
                background: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="var(--primary)" />}
            </button>

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800 }}>
                  {(user.full_name || user.email || 'U')[0].toUpperCase()}
                </div>
                <span style={{ fontWeight: 700 }}>{user.full_name || user.email}</span>
                <span style={{ color: 'var(--text-muted)' }}>&bull; Role: Learner</span>
              </div>
            ) : (
              <button className="btn-secondary" onClick={() => navigate('/login')} style={{ fontSize: '0.82rem', padding: '6px 14px' }}>
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Content Body */}
        <div className="app-content-body animate-fade-in">
          {activeTab === 'dashboard' && (
            <div>
              {!currentResult ? (
                <VideoProcessor initialUrl={initialVideoUrl} onProcessingComplete={handleProcessingComplete} />
              ) : (
                <div className="animate-fade-in">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                    <button id="process-another-btn" onClick={() => setCurrentResult(null)} className="btn-secondary">
                      <ArrowLeft size={16} />
                      <span>Process Another Video</span>
                    </button>

                    <div style={{ display: 'flex', gap: 4, background: 'var(--bg-subtle)', padding: 3, borderRadius: 8, flexWrap: 'wrap' }}>
                      <button
                        id="view-summary-tab-btn"
                        onClick={() => setResultSubView('summary')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 14px',
                          borderRadius: 6,
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          background: resultSubView === 'summary' ? 'var(--primary)' : 'transparent',
                          color: resultSubView === 'summary' ? '#ffffff' : 'var(--text-muted)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <FileText size={14} />
                        <span>Executive Summary</span>
                      </button>

                      {currentResult.quiz && currentResult.quiz.length > 0 && (
                        <button
                          id="view-quiz-tab-btn"
                          onClick={() => setResultSubView('quiz')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 14px',
                            borderRadius: 6,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.84rem',
                            fontWeight: 700,
                            background: resultSubView === 'quiz' ? 'var(--primary)' : 'transparent',
                            color: resultSubView === 'quiz' ? '#ffffff' : 'var(--text-muted)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Award size={14} />
                          <span>Quiz &amp; Timer ({currentResult.quiz.length}Q)</span>
                        </button>
                      )}

                      <button
                        id="view-flashcards-tab-btn"
                        onClick={() => setResultSubView('flashcards')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 14px',
                          borderRadius: 6,
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          background: resultSubView === 'flashcards' ? 'var(--primary)' : 'transparent',
                          color: resultSubView === 'flashcards' ? '#ffffff' : 'var(--text-muted)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Layers size={14} />
                        <span>3D Flashcards</span>
                      </button>

                      <button
                        id="view-mindmap-tab-btn"
                        onClick={() => setResultSubView('mindmap')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 14px',
                          borderRadius: 6,
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          background: resultSubView === 'mindmap' ? 'var(--primary)' : 'transparent',
                          color: resultSubView === 'mindmap' ? '#ffffff' : 'var(--text-muted)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Compass size={14} />
                        <span>Concept Mindmap</span>
                      </button>

                      <button
                        id="view-chat-tab-btn"
                        onClick={() => setResultSubView('chat')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 14px',
                          borderRadius: 6,
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          background: resultSubView === 'chat' ? 'var(--primary)' : 'transparent',
                          color: resultSubView === 'chat' ? '#ffffff' : 'var(--text-muted)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <MessageSquare size={14} />
                        <span>Ask Video AI</span>
                      </button>
                    </div>
                  </div>

                  {resultSubView === 'summary' && (
                    <SummaryViewer
                      title={currentResult.title}
                      summary={currentResult.summary}
                      transcript={currentResult.transcript}
                      onStartQuiz={currentResult.quiz && currentResult.quiz.length > 0 ? () => setResultSubView('quiz') : undefined}
                    />
                  )}

                  {resultSubView === 'quiz' && (
                    <QuizPlayer
                      quizId={currentResult.quizId}
                      questions={currentResult.quiz}
                      onRetake={() => {}}
                      onNewVideo={() => setCurrentResult(null)}
                    />
                  )}

                  {resultSubView === 'flashcards' && (
                    <FlashcardPlayer
                      videoId={currentResult.videoId}
                      transcript={currentResult.transcript}
                      summary={currentResult.summary}
                    />
                  )}

                  {resultSubView === 'mindmap' && (
                    <MindmapViewer
                      videoId={currentResult.videoId}
                      transcript={currentResult.transcript}
                      summary={currentResult.summary}
                    />
                  )}

                  {resultSubView === 'chat' && (
                    <VideoChatDrawer
                      videoId={currentResult.videoId}
                      transcript={currentResult.transcript}
                      title={currentResult.title}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && <HistoryFeed onSelectVideo={handleSelectFromHistory} />}
          {activeTab === 'analytics' && <PerformanceStats />}
        </div>

        {/* Floating "Ask Video AI" drawer launcher button */}
        {currentResult && resultSubView !== 'chat' && (
          <button
            id="floating-ask-ai-btn"
            onClick={() => setChatDrawerOpen(true)}
            style={{
              position: 'fixed',
              bottom: 28,
              right: 28,
              background: 'linear-gradient(135deg, #0b326f, #2563eb)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 30,
              padding: '12px 22px',
              boxShadow: '0 8px 24px rgba(37, 99, 235, 0.45)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              zIndex: 900,
              fontWeight: 700,
              fontSize: '0.92rem',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
          >
            <MessageSquare size={17} />
            <span>Ask Video AI</span>
            <span style={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.22)', padding: '2px 7px', borderRadius: 10 }}>LIVE</span>
          </button>
        )}

        {/* Slide-over Ask Video AI Drawer */}
        {chatDrawerOpen && currentResult && (
          <VideoChatDrawer
            videoId={currentResult.videoId}
            transcript={currentResult.transcript}
            title={currentResult.title}
            isDrawer={true}
            onClose={() => setChatDrawerOpen(false)}
          />
        )}

      </div>

    </div>
  );
}

export default function App() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('synapse_theme') === 'dark');

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('synapse_theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('synapse_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage isDark={isDark} toggleTheme={toggleTheme} />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/forgot-password" element={<AuthPage />} />
          <Route path="/app" element={<AppShell isDark={isDark} toggleTheme={toggleTheme} />} />
          <Route path="/admin" element={<AdminDashboard isDark={isDark} toggleTheme={toggleTheme} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
