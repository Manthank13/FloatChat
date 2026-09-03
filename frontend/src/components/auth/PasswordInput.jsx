import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

export default function PasswordInput({
  id = 'password',
  name = 'password',
  value,
  onChange,
  placeholder = 'Enter your password',
  disabled = false,
  required = true,
  autoComplete = 'current-password',
  hasError = false
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`password-input-wrapper ${hasError ? 'error' : ''}`}>
      <div className="input-icon-left">
        <Lock size={15} />
      </div>

      <input
        id={id}
        name={name}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
        className="auth-text-input"
        aria-invalid={hasError}
      />

      <button
        type="button"
        className="btn-toggle-password"
        onClick={() => setShowPassword(!showPassword)}
        tabIndex={0}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>

      <style>{`
        .password-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .password-input-wrapper:focus-within {
          border-color: var(--input-focus-border);
          box-shadow: 0 0 0 3px var(--input-focus-glow);
        }

        .password-input-wrapper.error {
          border-color: var(--red-critical);
        }

        .password-input-wrapper.error:focus-within {
          box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.2);
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

        .btn-toggle-password {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px 14px;
          color: var(--text-muted);
          cursor: pointer;
          transition: color var(--transition-fast);
        }

        .btn-toggle-password:hover {
          color: var(--text-primary);
        }

        .btn-toggle-password:focus-visible {
          outline: 2px solid var(--cyan-primary);
          border-radius: var(--radius-sm);
        }
      `}</style>
    </div>
  );
}
