import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Info, 
  CheckCircle2,
  TrendingUp,
  MapPin
} from 'lucide-react';

export default function RiskIndicator({ 
  riskLevel = "moderate", // "nominal" | "moderate" | "elevated" | "high"
  title = "Climate & Coastal Risk Assessment",
  region = "Bay of Bengal (Off Chennai)",
  confidence = "92% (High Confidence)",
  factors = [],
  summary = ""
}) {
  const normalizedLevel = (riskLevel || "moderate").toLowerCase();

  const riskConfigs = {
    nominal: {
      label: "NOMINAL BASELINE",
      color: "var(--emerald-nominal)",
      bg: "rgba(16, 185, 129, 0.12)",
      border: "rgba(16, 185, 129, 0.35)",
      glow: "0 0 20px rgba(16, 185, 129, 0.2)",
      icon: ShieldCheck,
      badgeText: "Nominal Conditions",
      desc: "Environmental indicators remain within standard 30-year climatological baseline variations."
    },
    moderate: {
      label: "MODERATE ANOMALY",
      color: "var(--amber-warning)",
      bg: "rgba(245, 158, 11, 0.12)",
      border: "rgba(245, 158, 11, 0.35)",
      glow: "0 0 20px rgba(245, 158, 11, 0.2)",
      icon: AlertTriangle,
      badgeText: "Elevated Monitoring",
      desc: "Localized thermal or salinity anomalies observed that warrant ongoing sensor tracking."
    },
    elevated: {
      label: "ELEVATED RISK SIGNAL",
      color: "var(--red-critical)",
      bg: "rgba(244, 63, 94, 0.14)",
      border: "rgba(244, 63, 94, 0.4)",
      glow: "0 0 25px rgba(244, 63, 94, 0.25)",
      icon: ShieldAlert,
      badgeText: "Heightened Hazard Signal",
      desc: "Upper-ocean heat content and barrier layer trapping exceed regional thresholds, indicating heightened convective/cyclone potential."
    },
    high: {
      label: "HIGH HAZARD POTENTIAL",
      color: "#FF1744",
      bg: "rgba(255, 23, 68, 0.18)",
      border: "rgba(255, 23, 68, 0.5)",
      glow: "0 0 30px rgba(255, 23, 68, 0.35)",
      icon: ShieldAlert,
      badgeText: "Critical Alert Signal",
      desc: "Multiple co-located physical triggers indicate significant thermodynamic fuel for extreme marine or atmospheric events."
    }
  };

  const currentConfig = riskConfigs[normalizedLevel] || riskConfigs.moderate;
  const Icon = currentConfig.icon;

  const defaultFactors = factors.length > 0 ? factors : [
    { name: "Sea Surface Temperature", status: "28.4 °C (+0.8°C above baseline)", impact: "High" },
    { name: "Tropical Cyclone Heat Potential", status: ">85 kJ/cm² in upper 80m", impact: "Elevated" },
    { name: "Halocline Barrier Layer", status: "28m freshwater capping layer", impact: "Moderate" },
    { name: "Atmospheric Wind Shear Coupling", status: "Moderate vertical shear", impact: "Nominal" }
  ];

  return (
    <div className="risk-indicator-panel glass-panel-elevated" style={{ borderColor: currentConfig.border }}>
      {/* Top Banner */}
      <div className="risk-header-row">
        <div className="risk-badge-group">
          <div className="risk-icon-wrap" style={{ background: currentConfig.bg, borderColor: currentConfig.border, color: currentConfig.color }}>
            <Icon size={18} />
          </div>
          <div className="risk-title-block">
            <div className="risk-status-pill font-mono" style={{ color: currentConfig.color, background: currentConfig.bg, borderColor: currentConfig.border }}>
              <span className="risk-pulse-dot" style={{ background: currentConfig.color }}></span>
              <span>{currentConfig.label}</span>
            </div>
            <h3 className="risk-main-title">{title}</h3>
          </div>
        </div>

        <div className="risk-meta-pill font-mono">
          <MapPin size={12} className="text-cyan" />
          <span>{region}</span>
        </div>
      </div>

      {/* Summary Narrative */}
      <p className="risk-summary-text">
        {summary || currentConfig.desc}
      </p>

      {/* Risk Gauge Visual Bar */}
      <div className="risk-gauge-container font-mono">
        <div className="gauge-track">
          <div className={`gauge-segment nominal ${normalizedLevel === 'nominal' ? 'active' : ''}`}>
            <span>Nominal</span>
          </div>
          <div className={`gauge-segment moderate ${normalizedLevel === 'moderate' ? 'active' : ''}`}>
            <span>Moderate</span>
          </div>
          <div className={`gauge-segment elevated ${normalizedLevel === 'elevated' ? 'active' : ''}`}>
            <span>Elevated</span>
          </div>
          <div className={`gauge-segment high ${normalizedLevel === 'high' ? 'active' : ''}`}>
            <span>High</span>
          </div>
        </div>
      </div>

      {/* Contributing Physical Factors */}
      <div className="risk-factors-section">
        <div className="factors-header font-mono">
          <TrendingUp size={13} className="text-cyan" />
          <span>CONTRIBUTING ENVIRONMENTAL RISK FACTORS</span>
        </div>

        <div className="factors-grid">
          {defaultFactors.map((f, idx) => (
            <div key={idx} className="factor-pill">
              <div className="factor-top">
                <span className="factor-name font-mono">{f.name}</span>
                <span className={`factor-impact font-mono ${f.impact.toLowerCase()}`}>
                  {f.impact}
                </span>
              </div>
              <span className="factor-status font-mono">{f.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scientific Notice & Confidence */}
      <div className="risk-footer-strip font-mono">
        <div className="confidence-tag">
          <CheckCircle2 size={12} className="text-emerald" />
          <span>Observational Confidence: <strong>{confidence}</strong></span>
        </div>
        <div className="disclaimer-mini">
          <Info size={11} className="text-cyan" />
          <span>Risk diagnostics based on in-situ physical observations</span>
        </div>
      </div>

      <style>{`
        .risk-indicator-panel {
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          border-radius: var(--radius-xl);
          background: rgba(6, 18, 35, 0.85);
          position: relative;
          overflow: hidden;
        }

        .risk-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .risk-badge-group {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .risk-icon-wrap {
          width: 42px;
          height: 42px;
          border-radius: var(--radius-md);
          border: 1px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .risk-title-block {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .risk-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          font-size: 10.5px;
          font-weight: 800;
          border: 1px solid;
          letter-spacing: 0.05em;
          width: fit-content;
        }

        .risk-pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          animation: pulseGlow 1.5s infinite;
        }

        .risk-main-title {
          font-size: 16px;
          font-weight: 800;
          color: #FFFFFF;
          letter-spacing: -0.01em;
        }

        .risk-meta-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(10, 25, 47, 0.6);
          border: 1px solid var(--border-light);
          padding: 4px 10px;
          border-radius: var(--radius-full);
          font-size: 11px;
          color: var(--text-secondary);
        }

        .risk-summary-text {
          font-size: 13.5px;
          color: #E2E8F0;
          line-height: 1.55;
        }

        .risk-gauge-container {
          width: 100%;
        }

        .gauge-track {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 4px;
          background: rgba(10, 25, 47, 0.6);
          padding: 3px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-light);
        }

        .gauge-segment {
          text-align: center;
          padding: 5px;
          border-radius: var(--radius-sm);
          font-size: 10px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          transition: all var(--transition-fast);
        }

        .gauge-segment.nominal.active {
          background: rgba(16, 185, 129, 0.25);
          color: var(--emerald-nominal);
          border: 1px solid var(--emerald-nominal);
        }

        .gauge-segment.moderate.active {
          background: rgba(245, 158, 11, 0.25);
          color: var(--amber-warning);
          border: 1px solid var(--amber-warning);
        }

        .gauge-segment.elevated.active {
          background: rgba(244, 63, 94, 0.3);
          color: var(--red-critical);
          border: 1px solid var(--red-critical);
        }

        .gauge-segment.high.active {
          background: rgba(255, 23, 68, 0.4);
          color: #FF1744;
          border: 1px solid #FF1744;
        }

        .risk-factors-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-top: 6px;
        }

        .factors-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10.5px;
          color: var(--text-muted);
          font-weight: 700;
        }

        .factors-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 8px;
        }

        .factor-pill {
          background: rgba(8, 24, 48, 0.7);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .factor-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .factor-name {
          font-size: 10.5px;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .factor-impact {
          font-size: 9.5px;
          padding: 1px 5px;
          border-radius: 2px;
          font-weight: 700;
        }

        .factor-impact.high, .factor-impact.elevated {
          color: var(--red-critical);
          background: rgba(244, 63, 94, 0.15);
        }

        .factor-impact.moderate {
          color: var(--amber-warning);
          background: rgba(245, 158, 11, 0.15);
        }

        .factor-impact.nominal {
          color: var(--emerald-nominal);
          background: rgba(16, 185, 129, 0.15);
        }

        .factor-status {
          font-size: 11.5px;
          color: #FFFFFF;
        }

        .risk-footer-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 10px;
          border-top: 1px solid var(--border-light);
          flex-wrap: wrap;
          gap: 8px;
          font-size: 10.5px;
          color: var(--text-muted);
        }

        .confidence-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #E2E8F0;
        }

        .confidence-tag strong {
          color: var(--emerald-nominal);
        }

        .disclaimer-mini {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      `}</style>
    </div>
  );
}
