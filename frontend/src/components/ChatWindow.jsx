import { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import LoadingState from './LoadingState';
import { Radio, Droplets, Layers } from 'lucide-react';

export default function ChatWindow({ 
  messages = [], 
  isLoading = false, 
  currentQuery = "",
  onSelectFloat = () => {},
  onSendFollowUp = () => {},
  onNavigate = () => {},
  onRetryQuery = () => {},
  onInspectSignal
}) {
  const scrollEndRef = useRef(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="chat-window-container">
      {messages.length === 0 && !isLoading ? (
        <div className="chat-empty-hero">
          <div className="empty-hero-icon-wrap">
            <img src="/ocean-logo.svg" alt="FloatChat" className="empty-hero-logo" />
            <span className="empty-hero-pulse"></span>
          </div>
          <h2 className="empty-hero-title">Living Ocean Observatory</h2>
          <p className="empty-hero-subtitle">
            Ask any question to synthesize real-time ARGO CTD profiling, vertical water column stratification, and deep-ocean insights.
          </p>

          <div className="empty-feature-pills">
            <div className="empty-feature-pill">
              <Radio size={14} className="text-cyan" />
              <span>3,840+ Active Floats</span>
            </div>
            <div className="empty-feature-pill">
              <Layers size={14} className="text-emerald" />
              <span>Depth Slicing to 2000m</span>
            </div>
            <div className="empty-feature-pill">
              <Droplets size={14} className="text-amber" />
              <span>Live Sensor Telemetry</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="messages-stream">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onSelectFloat={onSelectFloat}
              onSendFollowUp={onSendFollowUp}
              onNavigate={onNavigate}
              onRetryQuery={onRetryQuery}
              onInspectSignal={onInspectSignal}
            />
          ))}

          {isLoading && (
            <div className="loading-row">
              <LoadingState queryText={currentQuery} />
            </div>
          )}

          <div ref={scrollEndRef} style={{ height: 1 }} />
        </div>
      )}

      <style>{`
        .chat-window-container {
          flex: 1;
          width: 100%;
          overflow-y: auto;
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
        }

        .messages-stream {
          width: 100%;
          max-width: 1080px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
        }

        .loading-row {
          margin-bottom: 24px;
          display: flex;
          justify-content: flex-start;
          width: 100%;
          max-width: 1080px;
          margin: 0 auto 24px;
        }

        .chat-empty-hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          margin: auto;
          max-width: 680px;
          padding: 40px 20px;
          animation: floatBob 4s ease-in-out infinite;
        }

        .empty-hero-icon-wrap {
          position: relative;
          width: 76px;
          height: 76px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .empty-hero-logo {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          box-shadow: 0 0 30px rgba(0, 229, 255, 0.4);
        }

        .empty-hero-pulse {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 2px solid var(--cyan-primary);
          animation: sonarPulse 2.5s infinite;
        }

        .empty-hero-title {
          font-size: 28px;
          font-weight: 800;
          color: #FFFFFF;
          margin-bottom: 8px;
          letter-spacing: -0.03em;
        }

        .empty-hero-subtitle {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 24px;
        }

        .empty-feature-pills {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px;
        }

        .empty-feature-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(10, 25, 47, 0.7);
          border: 1px solid var(--border-subtle);
          padding: 8px 14px;
          border-radius: var(--radius-full);
          font-size: 12px;
          color: #E2E8F0;
          font-weight: 500;
        }

        .text-cyan { color: var(--cyan-primary); }
        .text-emerald { color: var(--emerald-nominal); }
        .text-sky { color: var(--sky-core); }
      `}</style>
    </div>
  );
}
