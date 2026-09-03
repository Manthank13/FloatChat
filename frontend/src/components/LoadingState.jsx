import { useEffect, useState } from 'react';
import { 
  Sparkles, 
  Radio, 
  Compass, 
  Layers, 
  Activity, 
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';

export default function LoadingState({ queryText = "" }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const investigationSteps = [
    {
      step: "01/05",
      id: "query-rcv",
      title: "CLIMATE INQUIRY RECEIVED",
      detail: "Parsing geographical sector, climate variables, and hazard context",
      icon: Sparkles,
      telemetry: "Spatial Indexing • 30-Year Climatology Baseline",
      color: "var(--cyan-primary)"
    },
    {
      step: "02/05",
      id: "locating-floats",
      title: "SCANNING ENVIRONMENTAL SENSORS",
      detail: "Querying in-situ ARGO profiling floats and ground-truth arrays",
      icon: Compass,
      telemetry: "Bounding Box: 10°N–16°N, 80°E–86°E Sector",
      color: "var(--sky-core)"
    },
    {
      step: "03/05",
      id: "telemetry-found",
      title: "OBSERVATIONAL EVIDENCE LOCKED",
      detail: "Ingesting high-resolution in-situ CTD temperature & salinity packets",
      icon: Radio,
      telemetry: "WMO #2902741 • Sensor Calibration: RTQC PASS",
      color: "var(--emerald-nominal)"
    },
    {
      step: "04/05",
      id: "analyzing-column",
      title: "ANALYZING WATER COLUMN & HEAT",
      detail: "Computing Ocean Heat Content (OHC), barrier layers & thermocline slope",
      icon: Layers,
      telemetry: "0–2,000m Depth Cast • Heat Trapping Check",
      color: "var(--amber-warning)"
    },
    {
      step: "05/05",
      id: "generating-insight",
      title: "SYNTHESIZING RESILIENCE INSIGHT",
      detail: "Evaluating risk relevance, anomaly signals & disaster resilience context",
      icon: ShieldAlert,
      telemetry: "Environmental AI Reasoning • Multi-Modal Report",
      color: "var(--cyan-primary)"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < investigationSteps.length - 1 ? prev + 1 : prev));
    }, 650);
    return () => clearInterval(interval);
  }, [investigationSteps.length]);

  const activeStep = investigationSteps[currentStepIndex];
  const Icon = activeStep.icon;

  return (
    <div className="ocean-investigation-card">
      {/* Top Header Bar */}
      <div className="investigation-top">
        <div className="investigation-badge font-mono">
          <span className="pulsing-beacon-dot"></span>
          <span>CLIMATE INTELLIGENCE ASSESSMENT IN PROGRESS</span>
        </div>
        <span className="investigation-step-counter font-mono">{activeStep.step}</span>
      </div>

      {/* Query Banner */}
      {queryText && (
        <div className="investigation-query-banner font-mono">
          <span className="query-label">TARGET INQUIRY:</span>
          <span className="query-body">"{queryText}"</span>
        </div>
      )}

      {/* Main Telemetry Focus */}
      <div className="investigation-center">
        {/* Radar Sonar Scanner */}
        <div className="investigation-sonar">
          <div className="sonar-ring-outer">
            <div className="sonar-sweep-blade"></div>
            <div className="sonar-center-node">
              <Icon size={18} style={{ color: activeStep.color }} />
            </div>
          </div>
        </div>

        {/* Text Telemetry Details */}
        <div className="investigation-text-block">
          <div className="telemetry-step-id font-mono">STEP {activeStep.step} • {activeStep.id.toUpperCase()}</div>
          <h3 className="telemetry-step-title font-mono">{activeStep.title}</h3>
          <p className="telemetry-step-desc">{activeStep.detail}</p>
          <div className="telemetry-terminal-line font-mono">
            <Activity size={12} className="text-cyan animate-pulse" />
            <span>{activeStep.telemetry}</span>
          </div>
        </div>
      </div>

      {/* Linear Investigation Progress Bar */}
      <div className="investigation-step-bar">
        {investigationSteps.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          return (
            <div key={step.id} className={`step-segment ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
              <div className="segment-track">
                {isDone && <CheckCircle2 size={12} className="segment-icon done" />}
                {isCurrent && <span className="segment-beacon" />}
              </div>
              <span className="segment-title font-mono desktop-only">{step.title}</span>
            </div>
          );
        })}
      </div>

      <style>{`
        .ocean-investigation-card {
          background: rgba(4, 13, 26, 0.85);
          border: 1px solid rgba(0, 229, 255, 0.35);
          border-radius: var(--radius-xl);
          padding: 24px 28px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(0, 229, 255, 0.12);
          display: flex;
          flex-direction: column;
          gap: 18px;
          width: 100%;
          max-width: 1080px;
          margin-bottom: 24px;
          animation: revealDepth 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .investigation-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 12px;
        }

        .investigation-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: var(--cyan-primary);
          font-weight: 700;
          letter-spacing: 0.06em;
        }

        .pulsing-beacon-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--cyan-primary);
          box-shadow: 0 0 10px var(--cyan-primary);
          animation: pulseGlow 1.5s infinite;
        }

        .investigation-step-counter {
          font-size: 12px;
          color: var(--text-muted);
        }

        .investigation-query-banner {
          background: rgba(10, 25, 47, 0.6);
          border: 1px solid var(--border-subtle);
          padding: 8px 14px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          overflow: hidden;
        }

        .query-label {
          color: var(--cyan-primary);
          font-weight: 700;
          flex-shrink: 0;
        }

        .query-body {
          color: #E2E8F0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .investigation-center {
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 8px 0;
        }

        .investigation-sonar {
          flex-shrink: 0;
          width: 64px;
          height: 64px;
          position: relative;
        }

        .sonar-ring-outer {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 1.5px solid rgba(0, 229, 255, 0.4);
          background: rgba(0, 229, 255, 0.05);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .sonar-sweep-blade {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(0, 229, 255, 0.4) 360deg);
          animation: radarSpin 2s linear infinite;
        }

        .sonar-center-node {
          position: relative;
          z-index: 2;
        }

        .investigation-text-block {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .telemetry-step-id {
          font-size: 10px;
          color: var(--text-muted);
          letter-spacing: 0.06em;
        }

        .telemetry-step-title {
          font-size: 16px;
          font-weight: 800;
          color: #FFFFFF;
          letter-spacing: 0.02em;
        }

        .telemetry-step-desc {
          font-size: 13.5px;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .telemetry-terminal-line {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--cyan-primary);
          margin-top: 4px;
        }

        /* Step Progress Bar */
        .investigation-step-bar {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
          padding-top: 10px;
          border-top: 1px solid var(--border-light);
        }

        .step-segment {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .segment-track {
          height: 4px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 2px;
          position: relative;
          overflow: hidden;
        }

        .step-segment.done .segment-track {
          background: var(--emerald-nominal);
        }

        .step-segment.current .segment-track {
          background: var(--cyan-primary);
          box-shadow: 0 0 8px var(--cyan-primary);
        }

        .segment-beacon {
          position: absolute;
          inset: 0;
          background: #FFFFFF;
          animation: pulseGlow 1s infinite;
        }

        .segment-title {
          font-size: 9.5px;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .step-segment.current .segment-title {
          color: #FFFFFF;
          font-weight: 700;
        }

        .step-segment.done .segment-title {
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
