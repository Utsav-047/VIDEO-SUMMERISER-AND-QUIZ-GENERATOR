import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { X, Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle, KeyRound, Loader2, Clock, RotateCcw } from 'lucide-react';

export default function AuthModal() {
  const { authModalOpen, authModalTab, setAuthModalTab, closeAuth, login, register } = useAuth();

  // Login & Register state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Forgot password flow state
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1 = request OTP, 2 = verify & reset
  const [timerSeconds, setTimerSeconds] = useState(600); // 10 minutes = 600s
  const [resending, setResending] = useState(false);

  // UI status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');


  if (!authModalOpen) return null;

  const handleResetState = () => {
    setError('');
    setSuccessMsg('');
    setLoading(false);
  };

  const handleTabSwitch = (tab) => {
    handleResetState();
    setAuthModalTab(tab);
    if (tab === 'forgot') setForgotStep(1);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

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

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const pwdErr = validatePasswordStrength(password);
    if (pwdErr) {
      setError(pwdErr);
      return;
    }
    setLoading(true);
    try {
      await register(fullName, email, password);
    } catch (err) {
      setError(err.message || 'Registration failed. Try a different email.');
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer effect for OTP validity (10:00 -> 00:00)
  useEffect(() => {
    let interval = null;
    if (authModalTab === 'forgot' && forgotStep === 2 && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [authModalTab, forgotStep, timerSeconds]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleForgotRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await api.forgotPassword(resetEmail);
      setSuccessMsg(res.message || `A 6-digit verification code has been dispatched to ${resetEmail}`);
      setTimerSeconds(600); // Reset timer to 10 minutes
      setForgotStep(2);
    } catch (err) {
      setError(err.message || 'This email is not registered in our app. Please check your email or sign up.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotResendOtp = async () => {
    setError('');
    setResending(true);
    try {
      const res = await api.forgotPassword(resetEmail);
      setSuccessMsg(res.message || `A fresh 6-digit code has been dispatched to ${resetEmail}`);
      setTimerSeconds(600); // Reset timer to 10 minutes
      setOtpCode('');
    } catch (err) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleForgotResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (timerSeconds === 0) {
      setError('Verification code has expired. Please request a new code.');
      return;
    }
    const pwdErr = validatePasswordStrength(newPassword);
    if (pwdErr) {
      setError(pwdErr);
      return;
    }
    setLoading(true);
    try {
      const res = await api.resetPassword(resetEmail, otpCode, newPassword);
      setSuccessMsg(res.message || 'Password reset successfully!');
      setTimeout(() => {
        handleTabSwitch('login');
        setEmail(resetEmail);
      }, 1800);
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div
      id="auth-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        background: 'rgba(5, 8, 16, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target.id === 'auth-modal-backdrop') closeAuth();
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-glow)',
          borderRadius: '24px',
          padding: '32px',
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* Close Button */}
        <button
          id="auth-close-btn"
          onClick={closeAuth}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '8px',
          }}
        >
          <X size={20} />
        </button>

        {/* Tab Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
              color: 'var(--accent-primary)',
              marginBottom: '12px',
            }}
          >
            <KeyRound size={24} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            {authModalTab === 'login' && 'Welcome Back'}
            {authModalTab === 'register' && 'Create Your Account'}
            {authModalTab === 'forgot' && 'Reset Password'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            {authModalTab === 'login' && 'Log in to access your video summaries & quizzes'}
            {authModalTab === 'register' && 'Join Synapse AI to turn any video into interactive mastery'}
            {authModalTab === 'forgot' && 'Enter your email to receive a 6-digit recovery code'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fb7185',
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '18px',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '18px',
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: LOGIN */}
        {authModalTab === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="login-email-input"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input"
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <button
                  type="button"
                  id="to-forgot-btn"
                  onClick={() => handleTabSwitch('forgot')}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 500 }}
                >
                  Forgot?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="login-password-input"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input"
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', marginTop: '8px' }}
            >
              {loading ? <Loader2 size={18} className="animate-spin-slow" /> : <ArrowRight size={18} />}
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>

            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Don't have an account?{' '}
              <button
                type="button"
                id="to-register-btn"
                onClick={() => handleTabSwitch('register')}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: 700, cursor: 'pointer' }}
              >
                Create one free
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: REGISTER */}
        {authModalTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="register-name-input"
                  type="text"
                  required
                  placeholder="Alex Mercer"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="glass-input"
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="register-email-input"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input"
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Password (min 8 characters)
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="register-password-input"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input"
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>

            <button
              id="register-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', marginTop: '8px' }}
            >
              {loading ? <Loader2 size={18} className="animate-spin-slow" /> : <ArrowRight size={18} />}
              <span>{loading ? 'Creating account...' : 'Create Account'}</span>
            </button>

            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Already registered?{' '}
              <button
                type="button"
                id="to-login-btn"
                onClick={() => handleTabSwitch('login')}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: 700, cursor: 'pointer' }}
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: FORGOT PASSWORD */}
        {authModalTab === 'forgot' && (
          <div>
            {forgotStep === 1 ? (
              <form onSubmit={handleForgotRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Registered Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="forgot-email-input"
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="glass-input"
                      style={{ paddingLeft: '42px' }}
                    />
                  </div>
                </div>

                <button
                  id="forgot-send-otp-btn"
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  {loading ? <Loader2 size={18} className="animate-spin-slow" /> : <ArrowRight size={18} />}
                  <span>{loading ? 'Sending OTP...' : 'Send Verification OTP'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleForgotResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Live 10-Minute Expiration Countdown Badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: timerSeconds === 0 ? 'rgba(239, 68, 68, 0.1)' : timerSeconds <= 120 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    border: `1px solid ${timerSeconds === 0 ? 'rgba(239, 68, 68, 0.3)' : timerSeconds <= 120 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                    borderRadius: '8px',
                    padding: '10px 14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} color={timerSeconds === 0 ? '#ef4444' : timerSeconds <= 120 ? '#f59e0b' : '#10b981'} />
                    <span
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: timerSeconds === 0 ? '#ef4444' : timerSeconds <= 120 ? '#f59e0b' : '#10b981',
                      }}
                    >
                      {timerSeconds === 0 ? 'Verification code expired' : 'Code valid for'}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      letterSpacing: '0.05em',
                      color: timerSeconds === 0 ? '#ef4444' : timerSeconds <= 120 ? '#f59e0b' : '#10b981',
                    }}
                  >
                    {formatTimer(timerSeconds)}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    6-Digit Verification Code
                  </label>
                  <input
                    id="forgot-otp-input"
                    type="text"
                    required
                    maxLength={6}
                    disabled={timerSeconds === 0}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="glass-input"
                    style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    New Password (min 8 characters)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="forgot-new-password-input"
                      type="password"
                      required
                      disabled={timerSeconds === 0}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="glass-input"
                      style={{ paddingLeft: '42px' }}
                    />
                  </div>
                </div>

                <button
                  id="forgot-submit-new-pass-btn"
                  type="submit"
                  disabled={loading || timerSeconds === 0}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    opacity: timerSeconds === 0 ? 0.6 : 1,
                    cursor: timerSeconds === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin-slow" />
                  ) : (
                    <CheckCircle2 size={18} />
                  )}
                  <span>{timerSeconds === 0 ? 'Code Expired (00:00)' : 'Update Password'}</span>
                </button>

                {/* Resend Code Section */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '0.84rem',
                    color: 'var(--text-muted)',
                    marginTop: '2px',
                  }}
                >
                  <span>Didn't receive or code expired?</span>
                  <button
                    type="button"
                    onClick={handleForgotResendOtp}
                    disabled={resending || loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 6px',
                    }}
                  >
                    {resending ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                    <span>Resend Code</span>
                  </button>
                </div>
              </form>
            )}


            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.875rem' }}>
              <button
                type="button"
                onClick={() => handleTabSwitch('login')}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
