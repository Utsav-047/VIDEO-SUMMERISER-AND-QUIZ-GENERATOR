import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  FileText, Mail, Lock, User, Eye, EyeOff, ArrowRight,
  CheckCircle2, AlertCircle, Loader2, ArrowLeft, Upload,
  HelpCircle, KeyRound
} from 'lucide-react';

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, login, register } = useAuth();

  const isRegister = location.pathname === '/register';
  const isForgot = location.pathname === '/forgot-password';

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot password flow
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState(1);

  // UI status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect if logged in
  useEffect(() => {
    if (user) navigate('/app');
  }, [user, navigate]);

  // Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/app');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please verify and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Validate password strength consistently with backend
  const validatePasswordStrength = (pwd) => {
    if (!pwd || pwd.length < 8) {
      return 'Password must be at least 8 characters long.';
    }
    if (!/[a-zA-Z]/.test(pwd)) {
      return 'Password must contain at least one letter.';
    }
    if (!/\d/.test(pwd)) {
      return 'Password must contain at least one number.';
    }
    return null;
  };

  // Handle Register
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const pwdErr = validatePasswordStrength(password);
    if (pwdErr) {
      setError(pwdErr);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await register(fullName, email, password);
      navigate('/app');
    } catch (err) {
      setError(err.message || 'Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password - Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.forgotPassword(email);
      setSuccess(res.message || `A 6-digit verification code has been sent to ${email}`);
      setForgotStep(2);
    } catch (err) {
      setError(err.message || 'This email is not registered in our app. Please check your email or sign up.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password - Reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    const pwdErr = validatePasswordStrength(newPassword);
    if (pwdErr) {
      setError(pwdErr);
      return;
    }
    setLoading(true);
    try {
      const res = await api.resetPassword(email, otp, newPassword);
      setSuccess(res.message || 'Password updated successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message || 'Invalid OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'row', background: 'var(--bg-surface)' }}>
      
      {/* ── LEFT PANE (Dark Navy Panel matching Screenshots 4 & 5) ── */}
      <div
        style={{
          width: '42%',
          minWidth: '380px',
          background: '#0c1e35',
          color: '#ffffff',
          padding: '60px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
        className="auth-left-panel"
      >
        <div>
          {/* Top Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 48 }} onClick={() => navigate('/')}>
            <div style={{ width: 34, height: 34, borderRadius: 6, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={20} color="#ffffff" />
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Synapse AI
            </span>
          </div>

          {/* Heading with Gold Highlight */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>Your AI-Powered</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24', lineHeight: 1.3 }}>
              Video Summarizer &amp;
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
              Quiz Generator
            </div>
          </div>

          <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: 36 }}>
            Convert any video lecture or tutorial into structured executive briefs and adaptive knowledge assessments.
          </p>

          {/* 3 Dark Feature Cards matching Screenshot 4/5 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 8, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(37, 99, 235, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Upload size={16} color="#60a5fa" />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>UPLOAD ANY VIDEO</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>YouTube links &amp; local video file uploads</div>
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 8, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(37, 99, 235, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileText size={16} color="#60a5fa" />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>EXECUTIVE SUMMARIES</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Multi-style AI note distillation</div>
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 8, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(37, 99, 235, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <HelpCircle size={16} color="#60a5fa" />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>ADAPTIVE QUIZZES</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Auto-generated MCQs with instant scoring</div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Engine Badge */}
        <div style={{ paddingTop: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '6px 12px', borderRadius: 9999 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#34d399', letterSpacing: '0.05em' }}>
              WHISPER + AI GENERATION ENGINE
            </span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANE (Clean Auth Form matching Screenshots 4 & 5) ── */}
      <div
        style={{
          flex: 1,
          background: 'var(--bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '48px 24px',
          overflowY: 'auto',
        }}
      >
        <div style={{ width: '100%', maxWidth: '440px' }}>
          
          {/* Title Header */}
          <div style={{ textAlign: 'left', marginBottom: 28 }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
              {isForgot ? 'Reset Password' : isRegister ? 'Create Account' : 'Welcome back'}
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {isForgot
                ? 'Enter your registered email to receive a recovery code.'
                : 'Sign in to your account or create a new one.'}
            </p>
          </div>

          {/* Segmented Switch Buttons (Login vs Register) */}
          {!isForgot && (
            <div
              style={{
                display: 'flex',
                background: 'var(--bg-subtle)',
                padding: '4px',
                borderRadius: '8px',
                marginBottom: '28px',
                gap: '4px',
              }}
            >
              <button
                id="auth-tab-login"
                type="button"
                onClick={() => { setError(''); navigate('/login'); }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: !isRegister ? '#0b326f' : 'transparent',
                  color: !isRegister ? '#ffffff' : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                  boxShadow: !isRegister ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <span>Login</span>
              </button>

              <button
                id="auth-tab-register"
                type="button"
                onClick={() => { setError(''); navigate('/register'); }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: isRegister ? '#0b326f' : 'transparent',
                  color: isRegister ? '#ffffff' : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                  boxShadow: isRegister ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <span>Register</span>
              </button>
            </div>
          )}

          {/* Error / Success Alerts */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '12px 16px', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>{success}</span>
            </div>
          )}

          {/* ── 1. LOGIN FORM ── */}
          {!isRegister && !isForgot && (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              
              <div className="form-group">
                <label className="form-label">EMAIL ADDRESS</label>
                <div className="input-wrapper">
                  <div className="input-icon"><Mail size={16} /></div>
                  <input
                    id="login-email-input"
                    type="email"
                    required
                    placeholder="you@team.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="clean-input"
                    style={{ paddingLeft: 42 }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">PASSWORD</label>
                <div className="input-wrapper">
                  <div className="input-icon"><Lock size={16} /></div>
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="clean-input"
                    style={{ paddingLeft: 42, paddingRight: 42 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', height: 46, fontSize: '0.95rem', marginTop: 6 }}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <span>Sign In &rarr;</span>}
              </button>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>OR</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                  Don't have an account?{' '}
                  <span
                    id="link-to-register"
                    style={{ color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
                    onClick={() => navigate('/register')}
                  >
                    Register here
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Forgot password?{' '}
                  <span
                    id="link-to-forgot"
                    style={{ color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
                    onClick={() => navigate('/forgot-password')}
                  >
                    Reset here
                  </span>
                </div>
              </div>
            </form>
          )}

          {/* ── 2. REGISTER FORM ── */}
          {isRegister && !isForgot && (
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div className="form-group">
                <label className="form-label">FULL NAME</label>
                <div className="input-wrapper">
                  <div className="input-icon"><User size={16} /></div>
                  <input
                    id="reg-fullname-input"
                    type="text"
                    required
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="clean-input"
                    style={{ paddingLeft: 42 }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">EMAIL ADDRESS</label>
                <div className="input-wrapper">
                  <div className="input-icon"><Mail size={16} /></div>
                  <input
                    id="reg-email-input"
                    type="email"
                    required
                    placeholder="you@team.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="clean-input"
                    style={{ paddingLeft: 42 }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">PASSWORD</label>
                <div className="input-wrapper">
                  <div className="input-icon"><Lock size={16} /></div>
                  <input
                    id="reg-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="clean-input"
                    style={{ paddingLeft: 42, paddingRight: 42 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">CONFIRM PASSWORD</label>
                <div className="input-wrapper">
                  <div className="input-icon"><Lock size={16} /></div>
                  <input
                    id="reg-confirm-password-input"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="clean-input"
                    style={{ paddingLeft: 42, paddingRight: 42 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: 12, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                id="register-submit-btn"
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', height: 46, fontSize: '0.95rem', marginTop: 8 }}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <span>Create Account &rarr;</span>}
              </button>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Already have an account?{' '}
                  <span
                    id="link-to-signin"
                    style={{ color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
                    onClick={() => navigate('/login')}
                  >
                    Sign in here
                  </span>
                </div>
              </div>
            </form>
          )}

          {/* ── 3. FORGOT PASSWORD FORM (2 Steps) ── */}
          {isForgot && (
            <div>
              {forgotStep === 1 ? (
                <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div className="form-group">
                    <label className="form-label">REGISTERED EMAIL</label>
                    <div className="input-wrapper">
                      <div className="input-icon"><Mail size={16} /></div>
                      <input
                        id="forgot-email-input"
                        type="email"
                        required
                        placeholder="you@team.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="clean-input"
                        style={{ paddingLeft: 42 }}
                      />
                    </div>
                  </div>

                  <button
                    id="send-otp-btn"
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                    style={{ width: '100%', height: 46, fontSize: '0.95rem' }}
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <span>Send OTP Code &rarr;</span>}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div className="form-group">
                    <label className="form-label">ENTER 6-DIGIT OTP</label>
                    <div className="input-wrapper">
                      <div className="input-icon"><KeyRound size={16} /></div>
                      <input
                        id="otp-input"
                        type="text"
                        required
                        maxLength={6}
                        placeholder="123456"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="clean-input"
                        style={{ paddingLeft: 42, letterSpacing: '0.2em', fontWeight: 700 }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">NEW PASSWORD</label>
                    <div className="input-wrapper">
                      <div className="input-icon"><Lock size={16} /></div>
                      <input
                        id="new-password-input"
                        type="password"
                        required
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="clean-input"
                        style={{ paddingLeft: 42 }}
                      />
                    </div>
                  </div>

                  <button
                    id="reset-pass-btn"
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                    style={{ width: '100%', height: 46, fontSize: '0.95rem' }}
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <span>Update Password</span>}
                  </button>
                </form>
              )}

              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="btn-ghost"
                  style={{ fontSize: '0.85rem' }}
                >
                  <ArrowLeft size={16} /> Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* Bottom Copyright */}
          <div style={{ marginTop: 40, textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-light-muted)' }}>
            &copy; {new Date().getFullYear()} Synapse AI. All Rights Reserved.
          </div>

        </div>
      </div>

    </div>
  );
}
