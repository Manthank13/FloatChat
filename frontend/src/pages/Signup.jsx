import { useState } from 'react';
import { Mail, User, Building2, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import AuthBackground from '../components/auth/AuthBackground';
import PasswordInput from '../components/auth/PasswordInput';
import GoogleAuthButton from '../components/auth/GoogleAuthButton';

export default function Signup({ onNavigateToLogin, onSignupSuccess }) {
  const { signup, loginWithGoogle, loading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (val) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!email.trim() || !validateEmail(email.trim())) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must contain at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signup({
        name: name.trim(),
        email: email.trim(),
        password,
        organization: organization.trim()
      });
      if (onSignupSuccess) {
        onSignupSuccess();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      if (onSignupSuccess) {
        onSignupSuccess();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Google account creation failed.');
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
            <h1 className="auth-title">Create your FloatChat account.</h1>
            <p className="auth-subtitle">Start turning environmental observations into climate-risk intelligence.</p>
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
            {/* Full Name Field */}
            <div className="form-field-group">
              <label htmlFor="signup-name" className="field-label font-mono">
                FULL NAME
              </label>
              <div className="text-input-wrapper">
                <div className="input-icon-left">
                  <User size={15} />
                </div>
                <input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. Sarah Mitchell"
                  required
                  autoComplete="name"
                  disabled={isSubmitting || loading}
                  className="auth-text-input"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="form-field-group">
              <label htmlFor="signup-email" className="field-label font-mono">
                WORK EMAIL
              </label>
              <div className="text-input-wrapper">
                <div className="input-icon-left">
                  <Mail size={15} />
                </div>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="s.mitchell@ocean-climate.org"
                  required
                  autoComplete="email"
                  disabled={isSubmitting || loading}
                  className="auth-text-input"
                />
              </div>
            </div>

            {/* Organization (Optional) */}
            <div className="form-field-group">
              <div className="field-label-row">
                <label htmlFor="signup-org" className="field-label font-mono">
                  ORGANIZATION / INSTITUTION
                </label>
                <span className="optional-tag font-mono">OPTIONAL</span>
              </div>
              <div className="text-input-wrapper">
                <div className="input-icon-left">
                  <Building2 size={15} />
                </div>
                <input
                  id="signup-org"
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. INCOIS / NOAA / Coastal Authority"
                  disabled={isSubmitting || loading}
                  className="auth-text-input"
                />
              </div>
            </div>

            {/* Passwords Grid */}
            <div className="passwords-split-grid">
              <div className="form-field-group">
                <label htmlFor="signup-password" className="field-label font-mono">
                  PASSWORD
                </label>
                <PasswordInput
                  id="signup-password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 chars"
                  disabled={isSubmitting || loading}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="form-field-group">
                <label htmlFor="signup-confirm-password" className="field-label font-mono">
                  CONFIRM
                </label>
                <PasswordInput
                  id="signup-confirm-password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter"
                  disabled={isSubmitting || loading}
                  required
                  autoComplete="new-password"
                />
              </div>
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
                  <span>Creating Analyst Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
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
            onClick={handleGoogleSignup}
            isLoading={isSubmitting || loading}
            text="Continue with Google"
          />

          {/* Footer Switcher */}
          <div className="auth-footer-link font-mono">
            <span>Already have an account?</span>{' '}
            <button
              type="button"
              className="btn-switch-auth"
              onClick={onNavigateToLogin}
            >
              Sign In
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
          padding: 30px 16px;
          position: relative;
          width: 100%;
          box-sizing: border-box;
        }

        .auth-card-wrapper {
          width: 100%;
          max-width: 480px;
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
          gap: 18px;
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
          font-size: 23px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .auth-subtitle {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.4;
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
          gap: 14px;
        }

        .form-field-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
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

        .optional-tag {
          font-size: 9px;
          color: var(--text-muted);
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
          padding: 11px 10px;
          font-size: 13.5px;
          color: var(--text-primary);
          width: 100%;
          min-width: 0;
        }

        .auth-text-input::placeholder {
          color: var(--text-muted);
          font-size: 13px;
        }

        .passwords-split-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        @media (max-width: 480px) {
          .passwords-split-grid {
            grid-template-columns: 1fr;
          }
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
          margin: 2px 0;
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
