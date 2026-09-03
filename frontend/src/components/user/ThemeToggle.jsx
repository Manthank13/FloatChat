import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../../context/useTheme';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options = [
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="theme-toggle-segmented" role="radiogroup" aria-label="Theme Selection">
      {options.map((opt) => {
        const Icon = opt.icon;
        const isSelected = theme === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            className={`theme-segment-btn ${isSelected ? 'active' : ''}`}
            onClick={() => setTheme(opt.id)}
            role="radio"
            aria-checked={isSelected}
            title={`${opt.label} Theme`}
          >
            <Icon size={13} className="theme-opt-icon" />
            <span className="theme-opt-label font-mono">{opt.label}</span>
          </button>
        );
      })}

      <style>{`
        .theme-toggle-segmented {
          display: flex;
          align-items: center;
          gap: 2px;
          background: rgba(4, 13, 26, 0.4);
          border: 1px solid var(--border-light);
          padding: 3px;
          border-radius: var(--radius-md);
          width: 100%;
        }

        .theme-segment-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 6px 8px;
          border-radius: var(--radius-sm);
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .theme-segment-btn:hover {
          color: var(--text-primary);
        }

        .theme-segment-btn.active {
          background: rgba(0, 229, 255, 0.15);
          color: var(--text-primary);
          border: 1px solid rgba(0, 229, 255, 0.35);
          box-shadow: 0 0 10px rgba(0, 229, 255, 0.15);
        }

        .theme-opt-icon {
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
