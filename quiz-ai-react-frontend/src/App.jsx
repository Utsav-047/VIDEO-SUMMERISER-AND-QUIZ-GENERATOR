import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import VideoProcessor from './components/VideoProcessor';
import SummaryViewer from './components/SummaryViewer';
import QuizPlayer from './components/QuizPlayer';
import HistoryFeed from './components/HistoryFeed';
import PerformanceStats from './components/PerformanceStats';
import {
  FileText, Video, History, BarChart2, PlusCircle,
  Home, LogOut, Sun, Moon, ArrowLeft, Layers, User
} from 'lucide-react';

function AppShell({ isDark, toggleTheme }) {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Tab: 'dashboard' | 'history' | 'analytics'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentResult, setCurrentResult] = useState(null);
  const [resultSubView, setResultSubView] = useState('summary');
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
      try {
        parsedQuiz = typeof item.questions_json === 'string' ? JSON.parse(item.questions_json) : item.questions_json;
      } catch {
        parsedQuiz = [];
      }
    }
    setCurrentResult({
      videoId: item.id,
      title: item.title || item.source_ref,
      transcript: item.transcript || '',
      summary: item.summary || 'Summary unavailable.',
      quiz: parsedQuiz,
      quizId: item.quiz_id || item.id,
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#0b326f', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
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

                    <div style={{ display: 'flex', gap: 4, background: 'var(--bg-subtle)', padding: 3, borderRadius: 6 }}>
                      <button
                        id="view-summary-tab-btn"
                        onClick={() => setResultSubView('summary')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 4,
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          background: resultSubView === 'summary' ? '#0b326f' : 'transparent',
                          color: resultSubView === 'summary' ? '#ffffff' : 'var(--text-muted)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        Executive Summary
                      </button>
                      {currentResult.quiz && currentResult.quiz.length > 0 && (
                        <button
                          id="view-quiz-tab-btn"
                          onClick={() => setResultSubView('quiz')}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 4,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            background: resultSubView === 'quiz' ? '#0b326f' : 'transparent',
                            color: resultSubView === 'quiz' ? '#ffffff' : 'var(--text-muted)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          Interactive Quiz ({currentResult.quiz.length}Q)
                        </button>
                      )}
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
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && <HistoryFeed onSelectVideo={handleSelectFromHistory} />}
          {activeTab === 'analytics' && <PerformanceStats />}
        </div>

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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
