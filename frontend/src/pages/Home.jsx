import QueryInput from '../components/QueryInput';
import ExampleQueries from '../components/ExampleQueries';
import ChatWindow from '../components/ChatWindow';
import FloatDetails from '../components/FloatDetails';
import { 
  Sparkles, 
  Flame, 
  Layers, 
  Radio, 
  MapPin, 
  ArrowUpRight, 
  CheckCircle2 
} from 'lucide-react';

const HOMEPAGE_RISK_SIGNALS = [
  {
    id: "risk-cyclone-bob",
    title: "Cyclone Rapid Intensification Fuel",
    region: "Bay of Bengal (Off Chennai)",
    coordinates: "13.08° N, 80.27° E",
    sensorId: "ARGO-IN-2902741",
    severity: "critical",
    riskScore: 84,
    primaryMetric: {
      label: "Tropical Cyclone Heat Potential (TCHP)",
      value: "88.5",
      unit: "kJ/cm²",
      threshold: "> 80 kJ/cm² (High Fuel)",
      barPercent: 88
    },
    subMetrics: [
      { label: "SST Anomaly", value: "+0.8 °C", status: "elevated" },
      { label: "Mixed Layer Depth", value: "35 m", status: "barrier" }
    ],
    summary: "Freshwater river discharge caps the surface, trapping intense thermal energy in the top 35m and creating an ideal fuel source for sudden cyclone rapid intensification.",
    queryText: "Analyze why Chennai faces elevated cyclone rapid intensification risk from upper ocean heat content and halocline barrier layers.",
    telemetryData: {
      title: "Cyclone Rapid Intensification Fuel — Bay of Bengal",
      category: "Thermodynamic Heat Anomaly",
      region: "Bay of Bengal (Off Chennai)",
      surfaceTemp: 28.4,
      surfaceSalinity: 33.1,
      mixedLayerDepth: 35,
      tchp: 88.5,
      riskScore: 84,
      wmoNumber: "2902741"
    }
  },
  {
    id: "risk-mhw-andaman",
    title: "Marine Heatwave & Coral Thermal Stress",
    region: "Andaman Sea Basin",
    coordinates: "11.62° N, 92.72° E",
    sensorId: "ARGO-IN-2902743",
    severity: "critical",
    riskScore: 78,
    primaryMetric: {
      label: "Sea Surface Temperature (SST)",
      value: "30.2",
      unit: "°C",
      threshold: "+1.4°C Above Climatology (Cat II Strong)",
      barPercent: 78
    },
    subMetrics: [
      { label: "Heating Weeks", value: "5.2 DHW", status: "critical" },
      { label: "Depth Extent", value: "0–80 m", status: "elevated" }
    ],
    summary: "Subsurface temperature inversion sustained over 18 days exceeds the local 90th percentile thermal threshold, triggering severe marine heatwave alerts for coral reef ecosystems.",
    queryText: "Assess the Andaman Sea marine heatwave, Degree Heating Weeks (DHW), and ecological stress for coastal ecosystems.",
    telemetryData: {
      title: "Marine Heatwave & Coral Thermal Stress — Andaman Sea",
      category: "Thermal Heatwave Indicator",
      region: "Andaman Sea Basin",
      surfaceTemp: 30.2,
      surfaceSalinity: 32.8,
      mixedLayerDepth: 42,
      tchp: 74.0,
      riskScore: 78,
      wmoNumber: "2902743"
    }
  },
  {
    id: "risk-halocline-ganges",
    title: "Freshwater Barrier Layer Stratification",
    region: "Northern Bay of Bengal (Ganges Plume)",
    coordinates: "19.50° N, 88.60° E",
    sensorId: "ARGO-IN-2902745",
    severity: "elevated",
    riskScore: 68,
    primaryMetric: {
      label: "Surface Halocline Salinity Cap",
      value: "31.8",
      unit: "PSU",
      threshold: "-2.4 PSU River Dilution",
      barPercent: 68
    },
    subMetrics: [
      { label: "Buoyant Cap", value: "25 m", status: "barrier" },
      { label: "Heat Trapping", value: "+1.1 °C", status: "elevated" }
    ],
    summary: "Intense monsoonal runoff from the Ganges-Brahmaputra creates a sharp density discontinuity, suppressing turbulent mixing and amplifying atmospheric heat uptake.",
    queryText: "Explain how freshwater discharge and barrier layers in the Northern Bay of Bengal alter regional climate resilience and cyclone tracks.",
    telemetryData: {
      title: "Freshwater Barrier Layer Stratification — Ganges Plume",
      category: "Halocline Salinity Discontinuity",
      region: "Northern Bay of Bengal (Ganges Plume)",
      surfaceTemp: 28.9,
      surfaceSalinity: 31.8,
      mixedLayerDepth: 25,
      tchp: 81.2,
      riskScore: 68,
      wmoNumber: "2902745"
    }
  },
  {
    id: "risk-coastal-arabian",
    title: "Coastal Vulnerability & Storm Surge Coupling",
    region: "Eastern Arabian Sea (Mumbai / Konkan)",
    coordinates: "18.95° N, 72.82° E",
    sensorId: "ARGO-IN-2902742",
    severity: "monitored",
    riskScore: 62,
    primaryMetric: {
      label: "Thermodynamic Surge Risk Index",
      value: "62",
      unit: "/ 100",
      threshold: "Moderate Thermal Coupling",
      barPercent: 62
    },
    subMetrics: [
      { label: "Surface Temp", value: "29.1 °C", status: "nominal" },
      { label: "Isotherm Depth", value: "65 m", status: "nominal" }
    ],
    summary: "Suppressed coastal upwelling coupled with high onshore atmospheric moisture transport increases vulnerability to high-tide urban inundation during low-pressure systems.",
    queryText: "Evaluate coastal storm surge vulnerability and thermodynamic ocean coupling for the Mumbai and Konkan coastal sector.",
    telemetryData: {
      title: "Coastal Vulnerability & Surge Coupling — Arabian Sea",
      category: "Coastal Hydrodynamic Coupling",
      region: "Eastern Arabian Sea (Mumbai / Konkan)",
      surfaceTemp: 29.1,
      surfaceSalinity: 35.8,
      mixedLayerDepth: 65,
      tchp: 62.0,
      riskScore: 62,
      wmoNumber: "2902742"
    }
  }
];

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
      {/* If fresh session, render the clean, informative Climate Intelligence Command Center hero */}
      {isFreshSession ? (
        <div className="observatory-landing-wrapper">
          {/* Top Hero: Clean Mission Control Query Header */}
          <div className="observatory-hero">
            {/* System Status Pill */}
            <div className="status-pill-observatory font-mono">
              <span className="live-dot-green animate-pulse"></span>
              <span className="pill-text">GLOBAL CLIMATE OBSERVING ARRAY ACTIVE • 3,842 IN-SITU SENSORS (SIMULATION ENGINE)</span>
            </div>

            {/* Large Headline */}
            <h1 className="observatory-title">
              ASK THE <span className="text-cyan-accent">CLIMATE.</span>
            </h1>

            {/* Clear Value Proposition Subhead */}
            <p className="observatory-subhead">
              Turning in-situ ocean observations, vertical CTD stratification, and climate signals into actionable early risk intelligence.
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

          {/* Section: Live Fleet Telemetry Tele-Strip */}
          <div className="fleet-telemetry-strip">
            <div className="tele-chip font-mono">
              <div className="chip-icon-wrap">
                <Radio size={14} className="text-cyan" />
              </div>
              <div className="chip-body">
                <span className="chip-label">GLOBAL OBSERVING ARRAY</span>
                <strong className="chip-value">3,842 Floats Active</strong>
              </div>
            </div>

            <div className="tele-chip font-mono">
              <div className="chip-icon-wrap">
                <MapPin size={14} className="text-emerald" />
              </div>
              <div className="chip-body">
                <span className="chip-label">INDIAN OCEAN SECTOR</span>
                <strong className="chip-value">4 Monitored Basins</strong>
              </div>
            </div>

            <div className="tele-chip font-mono">
              <div className="chip-icon-wrap">
                <Flame size={14} className="text-amber" />
              </div>
              <div className="chip-body">
                <span className="chip-label">THERMAL ANOMALIES</span>
                <strong className="chip-value text-amber">3 Active Alerts</strong>
              </div>
            </div>

            <div className="tele-chip font-mono">
              <div className="chip-icon-wrap">
                <CheckCircle2 size={14} className="text-cyan" />
              </div>
              <div className="chip-body">
                <span className="chip-label">DATA ASSURANCE</span>
                <strong className="chip-value text-cyan">RTQC Flag 1 Verified</strong>
              </div>
            </div>
          </div>

          {/* Section: Live Climate Risk Snapshot (Compact Data-Driven Cards) */}
          <div className="risk-snapshot-section">
            <div className="section-header-row">
              <div className="section-title-group">
                <div className="section-title-tag font-mono">
                  <Flame size={13} className="text-amber" />
                  <span>LIVE CLIMATE RISK SNAPSHOT</span>
                </div>
                <h2 className="section-main-heading">Emerging Oceanic & Coastal Hazards</h2>
              </div>
              <span className="section-hint font-mono">Select any risk signal to query AI or inspect verified in-situ telemetry</span>
            </div>

            <div className="risk-cards-grid">
              {HOMEPAGE_RISK_SIGNALS.map((signal) => {
                const isCritical = signal.severity === 'critical';
                return (
                  <div key={signal.id} className="home-risk-card glass-panel-elevated">
                    {/* Card Header */}
                    <div className="card-top-row">
                      <div className="card-region-tag font-mono">
                        <MapPin size={11} className="text-cyan" />
                        <span>{signal.region}</span>
                      </div>
                      <span className={`risk-badge font-mono ${isCritical ? 'badge-critical' : 'badge-warning'}`}>
                        {isCritical ? 'CRITICAL RISK' : 'ELEVATED RISK'} • {signal.riskScore}/100
                      </span>
                    </div>

                    {/* Card Title */}
                    <h3 className="card-signal-title">{signal.title}</h3>

                    {/* Primary Gauge Bar */}
                    <div className="metric-gauge-block font-mono">
                      <div className="gauge-label-row">
                        <span className="gauge-name">{signal.primaryMetric.label}</span>
                        <span className="gauge-val">
                          <strong>{signal.primaryMetric.value}</strong> {signal.primaryMetric.unit}
                        </span>
                      </div>
                      <div className="gauge-progress-track">
                        <div 
                          className={`gauge-progress-fill ${isCritical ? 'fill-critical' : 'fill-warning'}`}
                          style={{ width: `${signal.primaryMetric.barPercent}%` }}
                        />
                      </div>
                      <span className="gauge-threshold-note">{signal.primaryMetric.threshold}</span>
                    </div>

                    {/* Secondary Metrics Mini-Pills */}
                    <div className="submetrics-row font-mono">
                      {signal.subMetrics.map((sm, idx) => (
                        <div key={idx} className="submetric-pill">
                          <span className="submetric-k">{sm.label}:</span>
                          <strong className="submetric-v">{sm.value}</strong>
                        </div>
                      ))}
                    </div>

                    {/* Diagnostic Summary */}
                    <p className="card-diag-summary">{signal.summary}</p>

                    {/* Action Buttons */}
                    <div className="card-actions-row font-mono">
                      <button
                        type="button"
                        className="btn-deep-dive"
                        onClick={() => onSendMessage(signal.queryText)}
                        title="Query FloatChat for deep AI interpretation"
                      >
                        <Sparkles size={12} />
                        <span>Ask FloatChat</span>
                        <ArrowUpRight size={12} className="btn-arrow" />
                      </button>

                      {onInspectSignal && (
                        <button
                          type="button"
                          className="btn-inspect-telemetry"
                          onClick={() => onInspectSignal(signal.telemetryData, 'chat')}
                          title="Inspect raw vertical profile & sensor evidence"
                        >
                          <Layers size={12} />
                          <span>Inspect Telemetry</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Observe -> Analyze -> Explain -> Act Visual Flow */}
          <div className="mission-pipeline-banner glass-panel font-mono">
            <div className="pipeline-step">
              <span className="step-num">01</span>
              <div className="step-text">
                <strong>OBSERVE</strong>
                <span>Calibrated CTD Sensors</span>
              </div>
            </div>
            <span className="pipeline-arrow">→</span>

            <div className="pipeline-step">
              <span className="step-num">02</span>
              <div className="step-text">
                <strong>ANALYZE</strong>
                <span>Heat & Halocline Stratification</span>
              </div>
            </div>
            <span className="pipeline-arrow">→</span>

            <div className="pipeline-step">
              <span className="step-num">03</span>
              <div className="step-text">
                <strong>EXPLAIN</strong>
                <span>Compound Risk Diagnostics</span>
              </div>
            </div>
            <span className="pipeline-arrow">→</span>

            <div className="pipeline-step">
              <span className="step-num">04</span>
              <div className="step-text">
                <strong>ACT</strong>
                <span>Early Coastal Resilience</span>
              </div>
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
                <span>FloatChat Climate Intelligence • Grounded in In-Situ Environmental Observations (Simulation Engine)</span>
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
          max-width: 1140px;
          margin: 0 auto;
          width: 100%;
          padding: 36px 24px 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 32px;
          animation: revealDepth 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .observatory-hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 16px;
          width: 100%;
          max-width: 860px;
        }

        .status-pill-observatory {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--glass-panel);
          border: 1px solid var(--border-light);
          padding: 5px 14px;
          border-radius: var(--radius-full);
          font-size: 10px;
          color: var(--text-secondary);
          box-shadow: var(--shadow-subtle);
        }

        .live-dot-green {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--emerald-nominal);
          box-shadow: 0 0 8px var(--emerald-nominal);
        }

        .observatory-title {
          font-size: clamp(32px, 4.8vw, 48px);
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 1.05;
          margin: 0;
          color: var(--text-primary);
        }

        .text-cyan-accent {
          background: linear-gradient(135deg, var(--cyan-primary) 0%, #38BDF8 60%, #818CF8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .observatory-subhead {
          font-size: 14px;
          color: var(--text-secondary);
          max-width: 620px;
          line-height: 1.5;
          margin: 0;
        }

        .observatory-query-box {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 4px;
        }

        /* Fleet Telemetry Strip */
        .fleet-telemetry-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          width: 100%;
        }

        .tele-chip {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--glass-panel);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          box-shadow: var(--shadow-subtle);
          transition: all var(--transition-fast);
        }

        .tele-chip:hover {
          border-color: var(--data-border-active);
          background: var(--data-surface-hover);
        }

        .chip-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: var(--radius-sm);
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          flex-shrink: 0;
        }

        .chip-body {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .chip-label {
          font-size: 8px;
          color: var(--text-muted);
          letter-spacing: 0.06em;
          font-weight: 700;
        }

        .chip-value {
          font-size: 11px;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Live Climate Risk Snapshot */
        .risk-snapshot-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
        }

        .section-header-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 8px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .section-title-group {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .section-title-tag {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 9.5px;
          font-weight: 800;
          color: var(--amber-warning);
          letter-spacing: 0.08em;
        }

        .section-main-heading {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
        }

        .section-hint {
          font-size: 10px;
          color: var(--text-muted);
        }

        .risk-cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          width: 100%;
        }

        .home-risk-card {
          background: var(--glass-panel-elevated);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: all var(--transition-fast);
          box-shadow: var(--shadow-subtle);
        }

        .home-risk-card:hover {
          border-color: var(--data-border-active);
          transform: translateY(-2px);
          box-shadow: var(--shadow-elevated);
        }

        .card-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .card-region-tag {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .risk-badge {
          font-size: 9px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: var(--radius-sm);
        }

        .badge-critical {
          background: rgba(244, 63, 94, 0.15);
          color: #F87171;
          border: 1px solid rgba(244, 63, 94, 0.35);
        }

        .badge-warning {
          background: rgba(245, 158, 11, 0.15);
          color: var(--amber-warning);
          border: 1px solid rgba(245, 158, 11, 0.35);
        }

        .card-signal-title {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          line-height: 1.3;
        }

        .metric-gauge-block {
          background: var(--data-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 9px 12px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .gauge-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 10px;
        }

        .gauge-name {
          color: var(--text-secondary);
          font-weight: 600;
        }

        .gauge-val {
          color: var(--text-primary);
        }

        .gauge-val strong {
          color: var(--cyan-primary);
          font-size: 12px;
        }

        .gauge-progress-track {
          width: 100%;
          height: 5px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 3px;
          overflow: hidden;
        }

        .gauge-progress-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.4s ease;
        }

        .fill-critical {
          background: linear-gradient(90deg, #F59E0B 0%, #F43F5E 100%);
        }

        .fill-warning {
          background: linear-gradient(90deg, #0284C7 0%, #F59E0B 100%);
        }

        .gauge-threshold-note {
          font-size: 8.5px;
          color: var(--text-muted);
        }

        .submetrics-row {
          display: flex;
          gap: 8px;
        }

        .submetric-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 9.5px;
          background: var(--data-surface);
          border: 1px solid var(--border-subtle);
          padding: 3px 8px;
          border-radius: var(--radius-sm);
        }

        .submetric-k {
          color: var(--text-muted);
        }

        .submetric-v {
          color: var(--text-primary);
        }

        .card-diag-summary {
          font-size: 11px;
          color: var(--text-secondary);
          line-height: 1.45;
          margin: 0;
        }

        .card-actions-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: auto;
          padding-top: 6px;
        }

        .btn-deep-dive {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 7px 12px;
          background: var(--cyan-subtle);
          border: 1px solid var(--data-border-active);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 10.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-deep-dive:hover {
          background: rgba(0, 229, 255, 0.22);
          border-color: var(--cyan-primary);
          box-shadow: 0 0 10px var(--cyan-glow);
        }

        .btn-arrow {
          transition: transform var(--transition-fast);
        }

        .btn-deep-dive:hover .btn-arrow {
          transform: translate(2px, -2px);
        }

        .btn-inspect-telemetry {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 7px 10px;
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-inspect-telemetry:hover {
          color: var(--text-primary);
          background: var(--data-surface-hover);
          border-color: var(--data-border);
        }

        /* Mission Pipeline Banner */
        .mission-pipeline-banner {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-light);
          flex-wrap: wrap;
          gap: 12px;
        }

        .pipeline-step {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .step-num {
          font-size: 14px;
          font-weight: 900;
          color: var(--cyan-primary);
          opacity: 0.8;
        }

        .step-text {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .step-text strong {
          font-size: 10.5px;
          color: var(--text-primary);
          letter-spacing: 0.06em;
        }

        .step-text span {
          font-size: 9px;
          color: var(--text-muted);
        }

        .pipeline-arrow {
          color: var(--cyan-primary);
          opacity: 0.5;
          font-size: 14px;
        }

        /* Active Workspace View */
        .active-observatory-chat-view {
          display: flex;
          flex-direction: column;
          flex: 1;
          height: 100%;
          position: relative;
          overflow: hidden;
        }

        .sticky-observatory-console {
          padding: 14px 24px 18px;
          background: var(--glass-panel-elevated);
          border-top: 1px solid var(--border-light);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          z-index: 20;
        }

        .console-inner {
          max-width: 960px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .console-telemetry-tag {
          display: flex;
          justify-content: center;
          font-size: 9px;
          color: var(--text-muted);
          text-align: center;
        }

        .text-cyan { color: var(--cyan-primary); }
        .text-emerald { color: var(--emerald-nominal); }
        .text-amber { color: var(--amber-warning); }

        @media (max-width: 900px) {
          .fleet-telemetry-strip {
            grid-template-columns: repeat(2, 1fr);
          }
          .risk-cards-grid {
            grid-template-columns: 1fr;
          }
          .mission-pipeline-banner {
            display: none;
          }
        }

        @media (max-width: 600px) {
          .fleet-telemetry-strip {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
