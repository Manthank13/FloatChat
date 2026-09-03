import QueryInput from '../components/QueryInput';
import ExampleQueries from '../components/ExampleQueries';
import ChatWindow from '../components/ChatWindow';
import FloatDetails from '../components/FloatDetails';

export default function Home({ 
  messages, 
  isLoading, 
  currentQuery, 
  onSendMessage, 
  onRetryQuery,
  selectedFloat, 
  setSelectedFloat,
  onNavigate,
  onInspectSignal
}) {
  const isFreshSession = messages.length === 0 && !isLoading;

  const handleSelectExample = (text) => {
    onSendMessage(text);
  };

  const handleAskAboutFloat = (float) => {
    setSelectedFloat(null);
    onSendMessage(`Provide an in-depth climate risk and environmental indicator assessment for Float ${float.id} (${float.name}) in the ${float.region}.`);
  };

  return (
    <div className="home-observatory-container">
      {/* If fresh session, render the clean, spacious Climate Intelligence Command Center hero */}
      {isFreshSession ? (
        <div className="fresh-observatory-hero">
          <div className="observatory-hero-content">
            {/* Mission Identity Badge */}
            <div className="observatory-status-pill font-mono">
              <span className="pill-dot animate-pulse"></span>
              <span>GLOBAL CLIMATE OBSERVING ARRAY ACTIVE</span>
            </div>

            {/* Main Hero Title */}
            <h1 className="observatory-headline">
              <span className="brand-navy">ASK THE</span> <span className="brand-gradient">CLIMATE.</span>
            </h1>

            <p className="observatory-lead">
              Assess emerging coastal vulnerabilities, ocean thermal energy, marine heatwaves, and extreme hazard indicators grounded in verified in-situ sensor telemetry.
            </p>

            {/* Primary Command Query Interface */}
            <div className="observatory-query-box">
              <QueryInput 
                onSend={onSendMessage} 
                isLoading={isLoading} 
              />
              <ExampleQueries onSelectQuery={handleSelectExample} />
            </div>
          </div>
        </div>
      ) : (
        /* Dynamic Investigation Workspace View */
        <div className="active-observatory-chat-view">
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            currentQuery={currentQuery}
            onSelectFloat={(float) => setSelectedFloat(float)}
            onSendFollowUp={(fu) => onSendMessage(fu)}
            onNavigate={onNavigate}
            onRetryQuery={onRetryQuery}
            onInspectSignal={onInspectSignal}
          />

          {/* Sticky Query Console at Bottom */}
          <div className="sticky-observatory-console">
            <div className="console-inner">
              <QueryInput
                onSend={onSendMessage}
                isLoading={isLoading}
              />
              <div className="console-telemetry-tag font-mono">
                <span>FloatChat Climate Intelligence • Grounded in Verified Environmental Observations</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Float Telemetry Inspection Modal Drawer */}
      {selectedFloat && (
        <div className="modal-overlay" onClick={() => setSelectedFloat(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <FloatDetails
              float={selectedFloat}
              onClose={() => setSelectedFloat(null)}
              onAskAboutFloat={handleAskAboutFloat}
            />
          </div>
        </div>
      )}

      <style>{`
        .home-observatory-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          position: relative;
          min-height: 100%;
          width: 100%;
        }

        .observatory-landing-wrapper {
          max-width: 980px;
          margin: 0 auto;
          width: 100%;
          padding: 70px 24px 90px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 120px);
          animation: revealDepth 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .observatory-hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 18px;
          width: 100%;
          max-width: 860px;
        }

        .status-pill-observatory {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--glass-panel);
          border: 1px solid var(--border-light);
          padding: 6px 16px;
          border-radius: var(--radius-full);
          backdrop-filter: blur(14px);
          box-shadow: var(--shadow-subtle);
        }

        .live-dot-green {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--emerald-nominal);
          box-shadow: 0 0 10px var(--emerald-nominal);
          animation: pulseGlow 2s infinite;
        }

        .pill-text {
          font-size: 11px;
          color: var(--text-secondary);
          font-weight: 700;
          letter-spacing: 0.06em;
        }

        .observatory-title {
          font-size: clamp(40px, 6vw, 64px);
          font-weight: 900;
          letter-spacing: -0.03em;
          color: var(--text-primary);
          line-height: 1.08;
          margin-top: 6px;
        }

        .text-cyan-accent {
          background: linear-gradient(135deg, #00E5FF 0%, #38BDF8 60%, #818CF8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        [data-theme="light"] .text-cyan-accent {
          background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .observatory-subhead {
          font-size: clamp(17px, 2.2vw, 21px);
          font-weight: 600;
          color: var(--text-secondary);
          line-height: 1.4;
          max-width: 740px;
        }

        .observatory-lead {
          font-size: 14.5px;
          color: var(--text-muted);
          line-height: 1.6;
          max-width: 660px;
        }

        .observatory-query-box {
          width: 100%;
          max-width: 860px;
          margin-top: 14px;
        }

        /* Active Chat Exploration View */
        .active-observatory-chat-view {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
          position: relative;
        }

        .sticky-observatory-console {
          position: sticky;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(180deg, transparent 0%, rgba(2, 6, 17, 0.92) 20%, rgba(2, 6, 17, 0.98) 100%);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          padding: 16px 20px 20px;
          border-top: 1px solid var(--border-light);
          z-index: 100;
        }

        [data-theme="light"] .sticky-observatory-console {
          background: linear-gradient(180deg, transparent 0%, rgba(244, 247, 251, 0.88) 25%, rgba(244, 247, 251, 0.98) 100%);
        }

        .console-inner {
          max-width: 960px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .console-telemetry-tag {
          font-size: 10px;
          color: var(--text-muted);
          text-align: center;
          letter-spacing: 0.04em;
        }

        /* Modal Overlay */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(1, 4, 10, 0.82);
          backdrop-filter: blur(12px);
          z-index: 1500;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.2s ease-out;
        }

        .modal-card {
          width: 100%;
          max-width: 960px;
          max-height: 90vh;
          overflow-y: auto;
          background: rgba(4, 13, 26, 0.95);
          border: 1px solid var(--cyan-primary);
          border-radius: var(--radius-xl);
          box-shadow: 0 0 35px rgba(0, 229, 255, 0.2);
          animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleUp {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
