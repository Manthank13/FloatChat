import { User, AlertTriangle, RotateCcw } from 'lucide-react';
import AIAnalysis from './AIAnalysis';

export default function ChatMessage({ 
  message, 
  onSelectFloat, 
  onSendFollowUp,
  onNavigate,
  onRetryQuery,
  onInspectSignal
}) {
  const isUser = message.sender === 'user';

  if (message.isError) {
    return (
      <div className="error-message-row">
        <div className="error-card glass-panel">
          <div className="error-header">
            <div className="error-badge font-mono">
              <AlertTriangle size={14} className="text-amber" />
              <span>OCEAN INTELLIGENCE LINK INTERRUPTION</span>
            </div>
            <span className="error-timestamp font-mono">{message.timestamp || 'Just now'}</span>
          </div>

          <p className="error-text">{message.text}</p>

          <div className="error-actions font-mono">
            {message.failedQuery && onRetryQuery && (
              <button 
                type="button"
                className="btn-retry-query"
                onClick={() => onRetryQuery(message.failedQuery)}
              >
                <RotateCcw size={13} />
                <span>Retry Inquiry</span>
              </button>
            )}
            <span className="error-hint">Auto-fallback simulation is active.</span>
          </div>
        </div>

        <style>{`
          .error-message-row {
            display: flex;
            justify-content: flex-start;
            margin-bottom: 20px;
            animation: fadeIn 0.25s ease-out;
          }

          .error-card {
            background: rgba(30, 15, 20, 0.7);
            border: 1px solid rgba(244, 63, 94, 0.35);
            border-radius: var(--radius-lg);
            padding: 18px 22px;
            max-width: 720px;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .error-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }

          .error-badge {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            color: var(--amber-warning);
            font-weight: 700;
          }

          .error-timestamp {
            font-size: 10px;
            color: var(--text-muted);
          }

          .error-text {
            font-size: 14px;
            color: #F8FAFC;
            line-height: 1.5;
          }

          .error-actions {
            display: flex;
            align-items: center;
            gap: 14px;
            padding-top: 6px;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
          }

          .btn-retry-query {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(244, 63, 94, 0.2) 100%);
            border: 1px solid rgba(245, 158, 11, 0.4);
            border-radius: var(--radius-sm);
            color: #FFFFFF;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all var(--transition-fast);
          }

          .btn-retry-query:hover {
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.35) 0%, rgba(244, 63, 94, 0.35) 100%);
            border-color: var(--amber-warning);
            transform: translateY(-1px);
          }

          .error-hint {
            font-size: 11px;
            color: var(--text-muted);
          }

          .text-amber { color: var(--amber-warning); }
        `}</style>
      </div>
    );
  }

  if (!isUser) {
    return (
      <AIAnalysis
        message={message}
        onSelectFloat={onSelectFloat}
        onSendFollowUp={onSendFollowUp}
        onNavigate={onNavigate}
        onInspectSignal={onInspectSignal}
      />
    );
  }

  return (
    <div className="user-query-bubble-row">
      <div className="user-query-container">
        <div className="user-query-meta">
          <div className="user-avatar-tag font-mono">
            <User size={13} />
            <span>Climate Inquiry</span>
          </div>
          <span className="user-query-time font-mono">{message.timestamp || 'Just now'}</span>
        </div>
        <div className="user-query-body">
          <p className="user-query-text">"{message.text}"</p>
        </div>
      </div>

      <style>{`
        .user-query-bubble-row {
          display: flex;
          justify-content: flex-end;
          width: 100%;
          max-width: 1080px;
          margin-bottom: 20px;
          animation: revealDepth 0.3s ease-out;
        }

        .user-query-container {
          background: linear-gradient(135deg, rgba(2, 132, 199, 0.25) 0%, rgba(3, 105, 161, 0.4) 100%);
          border: 1px solid rgba(56, 189, 248, 0.3);
          border-radius: var(--radius-lg);
          border-top-right-radius: 4px;
          padding: 14px 18px;
          max-width: 720px;
          box-shadow: var(--shadow-subtle);
          backdrop-filter: blur(12px);
        }

        .user-query-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 6px;
        }

        .user-avatar-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--cyan-primary);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .user-query-time {
          font-size: 10px;
          color: var(--text-muted);
        }

        .user-query-text {
          font-size: 16px;
          font-weight: 600;
          color: #FFFFFF;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}
