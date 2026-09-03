import { 
  Droplets, 
  Thermometer, 
  Layers, 
  Activity, 
  Battery, 
  Zap, 
  Gauge, 
  Compass, 
  ShieldAlert,
  Radio,
  ArrowUpRight
} from 'lucide-react';

export default function DataCard({ 
  label, 
  value, 
  change, 
  type = "default", 
  icon = null,
  anomaly = null,
  riskRelevance = null,
  riskLevel = null, // "elevated" | "moderate" | "nominal" | "low"
  sourceEvidence = null,
  onExploreEvidence = null
}) {
  const renderIcon = () => {
    switch (icon) {
      case 'Droplets':
        return <Droplets size={17} className="kpi-icon salinity" />;
      case 'Thermometer':
        return <Thermometer size={17} className="kpi-icon temp" />;
      case 'Layers':
        return <Layers size={17} className="kpi-icon depth" />;
      case 'Activity':
        return <Activity size={17} className="kpi-icon activity" />;
      case 'Battery':
        return <Battery size={17} className="kpi-icon battery" />;
      case 'Zap':
        return <Zap size={17} className="kpi-icon zap" />;
      case 'Gauge':
        return <Gauge size={17} className="kpi-icon gauge" />;
      case 'AlertTriangle':
      case 'ShieldAlert':
        return <ShieldAlert size={17} className="kpi-icon alert" />;
      case 'Radio':
        return <Radio size={17} className="kpi-icon radio" />;
      default:
        return <Compass size={17} className="kpi-icon default" />;
    }
  };

  const getRiskClass = () => {
    if (riskLevel === 'elevated' || riskRelevance?.toLowerCase().includes('elevated') || riskRelevance?.toLowerCase().includes('high')) {
      return 'risk-elevated';
    }
    if (riskLevel === 'moderate' || riskRelevance?.toLowerCase().includes('moderate') || riskRelevance?.toLowerCase().includes('anomaly')) {
      return 'risk-moderate';
    }
    return 'risk-nominal';
  };

  return (
    <div className={`data-kpi-card glass-panel ${type} ${getRiskClass()}`}>
      <div className="kpi-top">
        <span className="kpi-label font-mono">{label}</span>
        <div className="kpi-icon-wrap">
          {renderIcon()}
        </div>
      </div>

      <div className="kpi-value-row">
        <span className="kpi-value font-mono">{value}</span>
      </div>

      {/* Climate Anomaly / Delta */}
      {(anomaly || change) && (
        <div className="kpi-anomaly-row">
          <span className="kpi-change-pill font-mono">{anomaly || change}</span>
        </div>
      )}

      {/* Risk Relevance Context */}
      {riskRelevance && (
        <div className="kpi-risk-footer">
          <span className="risk-indicator-dot"></span>
          <span className="risk-label font-mono">
            <strong>Risk relevance:</strong> {riskRelevance}
          </span>
        </div>
      )}

      {/* Source Evidence & Interaction */}
      {sourceEvidence && (
        <div className="kpi-evidence-footer">
          <span className="evidence-tag font-mono">{sourceEvidence}</span>
          {onExploreEvidence && (
            <button 
              className="btn-explore-evidence font-mono"
              onClick={onExploreEvidence}
              title="Inspect in-situ telemetry evidence"
            >
              <span>Explore Evidence</span>
              <ArrowUpRight size={11} />
            </button>
          )}
        </div>
      )}

      <style>{`
        .data-kpi-card {
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 7px;
          transition: all var(--transition-fast);
          position: relative;
          overflow: hidden;
        }

        .data-kpi-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1.5px;
          background: linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.5), transparent);
          opacity: 0;
          transition: opacity var(--transition-fast);
        }

        .data-kpi-card.risk-elevated::before {
          background: linear-gradient(90deg, transparent, rgba(244, 63, 94, 0.7), transparent);
          opacity: 1;
        }

        .data-kpi-card.risk-moderate::before {
          background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.7), transparent);
          opacity: 1;
        }

        .data-kpi-card:hover {
          background: var(--glass-panel-hover);
          border-color: var(--data-border-active);
          transform: translateY(-2px);
          box-shadow: var(--shadow-elevated);
        }

        .data-kpi-card:hover::before {
          opacity: 1;
        }

        .kpi-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .kpi-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-muted);
          font-weight: 700;
        }

        .kpi-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .kpi-icon.salinity { color: var(--cyan-primary); }
        .kpi-icon.temp { color: var(--red-critical); }
        .kpi-icon.depth { color: var(--sky-core); }
        .kpi-icon.activity { color: var(--emerald-nominal); }
        .kpi-icon.battery { color: var(--amber-warning); }
        .kpi-icon.zap { color: var(--cyan-primary); }
        .kpi-icon.gauge { color: #A855F7; }
        .kpi-icon.alert { color: var(--red-critical); }
        .kpi-icon.radio { color: var(--emerald-nominal); }
        .kpi-icon.default { color: var(--text-secondary); }

        .kpi-value-row {
          display: flex;
          align-items: baseline;
        }

        .kpi-value {
          font-size: 19px;
          font-weight: 700;
          color: #FFFFFF;
          letter-spacing: -0.02em;
        }

        .kpi-anomaly-row {
          display: flex;
          align-items: center;
        }

        .kpi-change-pill {
          font-size: 10px;
          color: var(--cyan-primary);
          background: rgba(0, 229, 255, 0.08);
          border: 1px solid rgba(0, 229, 255, 0.2);
          padding: 2px 7px;
          border-radius: var(--radius-sm);
          font-weight: 600;
        }

        .risk-elevated .kpi-change-pill {
          color: var(--red-critical);
          background: rgba(244, 63, 94, 0.1);
          border-color: rgba(244, 63, 94, 0.3);
        }

        .risk-moderate .kpi-change-pill {
          color: var(--amber-warning);
          background: rgba(245, 158, 11, 0.1);
          border-color: rgba(245, 158, 11, 0.3);
        }

        .kpi-risk-footer {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          padding-top: 6px;
          border-top: 1px solid var(--border-light);
          font-size: 10.5px;
          color: var(--text-secondary);
          line-height: 1.35;
        }

        .risk-indicator-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--emerald-nominal);
          margin-top: 4px;
          flex-shrink: 0;
        }

        .risk-elevated .risk-indicator-dot {
          background: var(--red-critical);
          box-shadow: 0 0 6px rgba(244, 63, 94, 0.6);
        }

        .risk-moderate .risk-indicator-dot {
          background: var(--amber-warning);
          box-shadow: 0 0 6px rgba(245, 158, 11, 0.6);
        }

        .risk-label strong {
          color: #E2E8F0;
        }

        .kpi-evidence-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-top: 2px;
        }

        .evidence-tag {
          font-size: 9.5px;
          color: var(--text-muted);
        }

        .btn-explore-evidence {
          display: flex;
          align-items: center;
          gap: 3px;
          background: none;
          border: none;
          color: var(--cyan-primary);
          font-size: 10px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          transition: all var(--transition-fast);
        }

        .btn-explore-evidence:hover {
          color: #FFFFFF;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
