import { useState } from 'react';
import { Mail, ArrowLeft, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import AuthBackground from '../components/auth/AuthBackground';

export default function ForgotPassword({ onNavigateToLogin }) {
  const { sendPasswordReset, loading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your work email.');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendPasswordReset(email.trim());
      setIsSuccess(true);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to send recovery link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page-viewport">
      <AuthBackground />

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
            <h1 className="auth-title">Reset password.</h1>
            <p className="auth-subtitle">
              Enter your registered work email to receive a secure recovery link.
            </p>
          </div>

          {/* Success Box */}
          {isSuccess ? (
            <div className="reset-success-box">
              <CheckCircle2 size={36} className="text-emerald" />
              <h3 className="success-heading">Recovery Link Dispatched</h3>
              <p className="success-body">
                We sent password recovery instructions to <strong>{email}</strong>. Please check your inbox and follow the link to reset your credentials.
              </p>
              <button
                type="button"
                className="btn-auth-primary font-mono"
                onClick={onNavigateToLogin}
              >
                <ArrowLeft size={15} />
                <span>Return to Sign In</span>
              </button>
            </div>
          ) : (
            <>
              {/* Error Box */}
              {errorMessage && (
                <div className="auth-error-alert" role="alert">
                  <AlertCircle size={15} className="error-icon text-rose" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Form */}
              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <div className="form-field-group">
                  <label htmlFor="reset-email" className="field-label font-mono">
                    WORK EMAIL
                  </label>
                  <div className="text-input-wrapper">
                    <div className="input-icon-left">
                      <Mail size={15} />
                    </div>
                    <input
                      id="reset-email"
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

                <button
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="btn-auth-primary font-mono"
                >
                  {isSubmitting ? (
                    <>
                      <Sparkles size={15} className="animate-spin" />
                      <span>Sending Recovery Link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Recovery Link</span>
                    </>
                  )}
                </button>
              </form>

              <div className="auth-footer-link font-mono">
                <button
                  type="button"
                  className="btn-back-link"
                  onClick={onNavigateToLogin}
                >
                  <ArrowLeft size={13} />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </>
          )}
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

        .field-label {
          font-size: 10px;
          font-weight: 700;
          color: var(--text-secondary);
          letter-spacing: 0.08em;
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

        .auth-footer-link {
          text-align: center;
          font-size: 12px;
        }

        .btn-back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--text-secondary);
          background: none;
          border: none;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: color var(--transition-fast);
        }

        .btn-back-link:hover {
          color: var(--cyan-primary);
        }

        .reset-success-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 14px;
          padding: 10px 0;
        }

        .success-heading {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .success-body {
          font-size: 13.5px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .text-rose { color: var(--red-critical); }
        .text-emerald { color: var(--emerald-nominal); }
      `}</style>
    </div>
  );
}
