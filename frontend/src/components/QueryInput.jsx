import { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowUp, CornerDownLeft, Wind, Thermometer, Scale, ShieldAlert } from 'lucide-react';

export default function QueryInput({ onSend, isLoading }) {
  const [query, setQuery] = useState('');
  const textareaRef = useRef(null);

  // Auto resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [query]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!query.trim() || isLoading) return;
    onSend(query.trim());
    setQuery('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickIntent = (prefix) => {
    setQuery(prefix);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <form className="query-input-observatory-form" onSubmit={handleSubmit}>
      {/* Quick Intent Mode Pills */}
      <div className="query-intent-pills font-mono">
        <button 
          type="button" 
          className="intent-pill"
          onClick={() => handleQuickIntent("Is Chennai at increased cyclone risk?")}
        >
          <Wind size={11} className="text-red" />
          <span>Cyclone Risk</span>
        </button>
        <button 
          type="button" 
          className="intent-pill"
          onClick={() => handleQuickIntent("Show temperature and salinity changes near Chennai")}
        >
          <Thermometer size={11} className="text-cyan" />
          <span>Thermal & Salinity</span>
        </button>
        <button 
          type="button" 
          className="intent-pill"
          onClick={() => handleQuickIntent("Compare cyclone risk between Chennai and Mumbai")}
        >
          <Scale size={11} className="text-violet" />
          <span>Basin Comparison</span>
        </button>
        <button 
          type="button" 
          className="intent-pill"
          onClick={() => handleQuickIntent("What are the major climate risks in the Bay of Bengal?")}
        >
          <ShieldAlert size={11} className="text-amber" />
          <span>Coastal Vulnerability</span>
        </button>
      </div>

      <div className="query-input-glass-container">
        {/* Left AI Spark Icon */}
        <div className="query-spark-icon">
          <Sparkles size={18} className="text-cyan" />
        </div>

        {/* Dynamic Textarea */}
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about a climate risk, region, environmental change, or disaster signal..."
          rows={1}
          disabled={isLoading}
          className="query-textarea"
        />

        {/* Right Controls */}
        <div className="query-actions-right">
          <span className="desktop-only keyboard-hint font-mono">
            Enter <CornerDownLeft size={10} />
          </span>

          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className={`btn-send-query ${query.trim() && !isLoading ? 'active' : ''}`}
            aria-label="Send Climate Intelligence Inquiry"
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>

      <style>{`
        .query-input-observatory-form {
          width: 100%;
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .query-intent-pills {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .intent-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          padding: 4px 10px;
          border-radius: var(--radius-full);
          font-size: 11px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
          box-shadow: var(--shadow-subtle);
        }

        .intent-pill:hover {
          background: var(--data-surface-hover);
          border-color: var(--cyan-primary);
          color: var(--text-primary);
        }

        .query-input-glass-container {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--glass-panel-elevated);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: 10px 14px 10px 20px;
          box-shadow: var(--shadow-elevated);
          transition: all var(--transition-normal);
        }

        .query-input-glass-container:focus-within {
          border-color: var(--glass-border-focus);
          box-shadow: 0 0 0 3px var(--cyan-subtle), var(--shadow-hud);
        }

        .query-spark-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--cyan-primary);
          flex-shrink: 0;
        }

        .query-textarea {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 15px;
          font-family: inherit;
          line-height: 1.5;
          resize: none;
          outline: none;
          padding: 4px 0;
          max-height: 140px;
          overflow-y: auto;
        }

        .query-textarea::placeholder {
          color: var(--text-muted);
          font-size: 14.5px;
        }

        .query-actions-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .keyboard-hint {
          font-size: 11px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 3px;
          background: var(--data-surface-hover);
          padding: 2px 7px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-light);
        }

        .btn-send-query {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-full);
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: not-allowed;
          transition: all var(--transition-fast);
        }

        .btn-send-query.active {
          background: linear-gradient(135deg, var(--cyan-primary) 0%, var(--electric-blue) 100%);
          border-color: var(--cyan-primary);
          color: #FFFFFF;
          cursor: pointer;
          box-shadow: 0 0 14px var(--cyan-glow);
        }

        .btn-send-query.active:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 20px var(--cyan-glow);
        }

        .text-red { color: var(--red-critical); }
        .text-violet { color: var(--violet-secondary); }
        .text-amber { color: var(--amber-warning); }
      `}</style>
    </form>
  );
}
