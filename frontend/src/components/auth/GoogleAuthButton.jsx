export default function GoogleAuthButton({ onClick, isLoading = false, text = 'Continue with Google' }) {
  return (
    <button
      type="button"
      className="btn-google-auth font-mono"
      onClick={onClick}
      disabled={isLoading}
      aria-label={text}
    >
      <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
        <path
          fill="#4285F4"
          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
        />
      </svg>
      <span>{isLoading ? 'Connecting to Google...' : text}</span>

      <style>{`
        .btn-google-auth {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 11px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          backdrop-filter: blur(10px);
        }

        .btn-google-auth:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(56, 189, 248, 0.35);
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
        }

        .btn-google-auth:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-google-auth:focus-visible {
          outline: 2px solid var(--cyan-primary);
          outline-offset: 2px;
        }

        .google-icon {
          flex-shrink: 0;
        }
      `}</style>
    </button>
  );
}
