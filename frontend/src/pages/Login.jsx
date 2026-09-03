import { useState } from 'react';
import { Mail, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { getRememberedEmail } from '../api/auth';
import AuthBackground from '../components/auth/AuthBackground';
import PasswordInput from '../components/auth/PasswordInput';
import GoogleAuthButton from '../components/auth/GoogleAuthButton';

export default function Login({ onNavigateToSignup, onNavigateToForgotPassword, onLoginSuccess }) {
  const { login, loginWithGoogle, loading } = useAuth();
  
  const [email, setEmail] = useState(() => getRememberedEmail());
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => Boolean(getRememberedEmail()));
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password, rememberMe });
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Google authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page-viewport">
      {/* Earth System Ambient Canvas */}
      <AuthBackground />

      {/* Main Glassmorphism Authentication Card */}
      <div className="auth-card-wrapper">
        <div className="auth-glass-card glass-panel-elevated">
          {/* Brand Header */}
          <div className="auth-card-header">
            <div className="auth-logo-badge">
              <img src="/ocean-logo.svg" alt="FloatChat Logo" className="auth-logo-img" />
              <span className="auth-radar-ring" />
            </div>
            <div className="auth-brand-info">
              <div className="auth-brand-name-row">
                <span className="brand-name">Float<span className="brand-accent">Chat</span></span>
                <span className="badge badge-cyan font-mono">CLIMATE AI</span>
              </div>
              <span className="auth-tagline font-mono">Climate Intelligence & Disaster Resilience</span>
            </div>
          </div>

          {/* Heading */}
          <div className="auth-title-section">
            <h1 className="auth-title">Welcome back.</h1>
            <p className="auth-subtitle">Continue your climate intelligence mission.</p>
          </div>

          {/* Error Alert Box */}
          {errorMessage && (
            <div className="auth-error-alert" role="alert">
              <AlertCircle size={15} className="error-icon text-rose" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Email Field */}
            <div className="form-field-group">
              <label htmlFor="login-email" className="field-label font-mono">
                WORK EMAIL
              </label>
              <div className="text-input-wrapper">
                <div className="input-icon-left">
                  <Mail size={15} />
                </div>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@floatchat.ai"
                  required
                  autoComplete="email"
                  disabled={isSubmitting || loading}
                  className="auth-text-input"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-field-group">
              <div className="field-label-row">
                <label htmlFor="login-password" className="field-label font-mono">
                  PASSWORD
                </label>
                <button
                  type="button"
                  className="btn-link-forgot font-mono"
                  onClick={onNavigateToForgotPassword}
                >
                  Forgot password?
                </button>
              </div>
              <PasswordInput
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={isSubmitting || loading}
                required
                autoComplete="current-password"
                hasError={Boolean(errorMessage)}
              />
            </div>

            {/* Remember Me Checkbox */}
            <div className="form-options-row">
              <label className="checkbox-container font-mono">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isSubmitting || loading}
                />
                <span className="checkbox-custom" />
                <span className="checkbox-label">Remember email</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="btn-auth-primary font-mono"
            >
              {isSubmitting ? (
                <>
                  <Sparkles size={15} className="animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider">
            <span className="divider-line" />
            <span className="divider-text font-mono">OR</span>
            <span className="divider-line" />
          </div>

          {/* Google OAuth Option */}
          <GoogleAuthButton
            onClick={handleGoogleLogin}
            isLoading={isSubmitting || loading}
            text="Continue with Google"
          />

          {/* Footer Switcher */}
          <div className="auth-footer-link font-mono">
            <span>Don't have an account?</span>{' '}
            <button
              type="button"
              className="btn-switch-auth"
              onClick={onNavigateToSignup}
            >
              Create Account
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .auth-page-viewport {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          position: relative;
          width: 100%;
          box-sizing: border-box;
        }

        .auth-card-wrapper {
          width: 100%;
          max-width: 440px;
          position: relative;
          z-index: 10;
          animation: revealDepth 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .auth-glass-card {
          background: var(--glass-panel-elevated);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid var(--data-border-active);
          border-radius: var(--radius-xl);
          padding: 32px 28px;
          box-shadow: var(--shadow-hud), 0 20px 50px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .auth-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .auth-logo-badge {
          position: relative;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .auth-logo-img {
          width: 30px;
          height: 30px;
          filter: drop-shadow(0 0 8px rgba(0, 229, 255, 0.5));
          position: relative;
          z-index: 2;
        }

        .auth-radar-ring {
          position: absolute;
          inset: -2px;
          border-radius: 50%;
          border: 1px solid var(--cyan-primary);
          animation: sonarPulse 3s infinite;
          opacity: 0.6;
        }

        .auth-brand-info {
          display: flex;
          flex-direction: column;
        }

        .auth-brand-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .brand-name {
          font-size: 19px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.03em;
        }

        .brand-accent {
          color: var(--cyan-primary);
        }

        .auth-tagline {
          font-size: 9.5px;
          color: var(--text-muted);
          letter-spacing: 0.02em;
        }

        .auth-title-section {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .auth-title {
          font-size: 24px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .auth-subtitle {
          font-size: 13.5px;
          color: var(--text-secondary);
        }

        .auth-error-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(244, 63, 94, 0.12);
          border: 1px solid rgba(244, 63, 94, 0.3);
          border-radius: var(--radius-md);
          padding: 10px 12px;
          font-size: 12.5px;
          color: var(--text-primary);
          animation: fadeIn 0.2s ease-out;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .field-label {
          font-size: 10px;
          font-weight: 700;
          color: var(--text-secondary);
          letter-spacing: 0.08em;
        }

        .btn-link-forgot {
          font-size: 11px;
          color: var(--cyan-primary);
          background: none;
          border: none;
          cursor: pointer;
          transition: color var(--transition-fast);
        }

        .btn-link-forgot:hover {
          text-decoration: underline;
        }

        .text-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .text-input-wrapper:focus-within {
          border-color: var(--input-focus-border);
          box-shadow: 0 0 0 3px var(--input-focus-glow);
        }

        .input-icon-left {
          display: flex;
          align-items: center;
          justify-content: center;
          padding-left: 14px;
          color: var(--text-muted);
          pointer-events: none;
        }

        .auth-text-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          padding: 12px 10px;
          font-size: 14px;
          color: var(--text-primary);
          width: 100%;
          min-width: 0;
        }

        .auth-text-input::placeholder {
          color: var(--text-muted);
          font-size: 13.5px;
        }

        .form-options-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .checkbox-container {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11.5px;
          color: var(--text-secondary);
          cursor: pointer;
          user-select: none;
        }

        .checkbox-container input {
          display: none;
        }

        .checkbox-custom {
          width: 16px;
          height: 16px;
          border: 1px solid var(--input-border);
          border-radius: var(--radius-sm);
          background: var(--input-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }

        .checkbox-container input:checked + .checkbox-custom {
          background: var(--cyan-primary);
          border-color: var(--cyan-primary);
        }

        .checkbox-container input:checked + .checkbox-custom::after {
          content: '✓';
          color: var(--text-dark);
          font-size: 11px;
          font-weight: 900;
        }

        .btn-auth-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px 18px;
          background: linear-gradient(135deg, var(--cyan-primary) 0%, var(--electric-blue) 100%);
          color: var(--text-dark);
          font-size: 14px;
          font-weight: 800;
          border-radius: var(--radius-md);
          border: none;
          cursor: pointer;
          transition: all var(--transition-fast);
          box-shadow: 0 0 16px rgba(0, 229, 255, 0.35);
          margin-top: 4px;
        }

        .btn-auth-primary:hover:not(:disabled) {
          background: #FFFFFF;
          color: #020611;
          box-shadow: 0 0 24px rgba(0, 229, 255, 0.6);
          transform: translateY(-1px);
        }

        .btn-auth-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 4px 0;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: var(--border-light);
        }

        .divider-text {
          font-size: 10px;
          color: var(--text-muted);
          letter-spacing: 0.08em;
          font-weight: 700;
        }

        .auth-footer-link {
          text-align: center;
          font-size: 12px;
          color: var(--text-secondary);
        }

        .btn-switch-auth {
          color: var(--cyan-primary);
          background: none;
          border: none;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
          margin-left: 4px;
        }

        .btn-switch-auth:hover {
          text-decoration: underline;
        }

        .text-rose { color: var(--red-critical); }
      `}</style>
    </div>
  );
}
