import { 
  LifeBuoy, 
  Anchor, 
  Building2, 
  Fish, 
  AlertOctagon
} from 'lucide-react';

export default function ResiliencePanel({
  hazardTitle = "Disaster Resilience & Planning Implications",
  hazards = [],
  actions = [],
  region = "Coastal Sector"
}) {
  const defaultHazards = hazards.length > 0 ? hazards : [
    {
      category: "Cyclone & Surge Potential",
      icon: AlertOctagon,
      title: "Elevated Rapid Intensification Risk",
      detail: "Upper ocean heat content exceeding 85 kJ/cm² combined with shallow barrier layers reduces evaporative cooling, creating favorable thermodynamic conditions for sudden storm intensification.",
      severity: "High Relevance",
      color: "var(--red-critical)"
    },
    {
      category: "Coastal Inundation",
      icon: Anchor,
      title: "Storm Surge & River Plume Coupling",
      detail: "Low-salinity river discharge plumes already saturate nearshore estuarine outlets, increasing vulnerability to compounded tidal flooding during high-wind events.",
      severity: "Moderate Relevance",
      color: "var(--amber-warning)"
    },
    {
      category: "Marine Ecosystem Stress",
      icon: Fish,
      title: "Thermal Stress on Fisheries & Reefs",
      detail: "Sustained +0.8°C thermal anomaly restricts vertical nutrient upwelling, potentially displacing pelagic fish stocks and stressing coastal coral ecosystems.",
      severity: "Ongoing Tracking",
      color: "var(--cyan-primary)"
    }
  ];

  const defaultActions = actions.length > 0 ? actions : [
    "Alert coastal emergency management to monitor rapid intensification tracks in the South Bay of Bengal.",
    "Verify drainage discharge readiness in coastal Chennai lowlands to prevent compounded surge/runoff flooding.",
    "Issue advisory for nearshore fishing fleets regarding thermal displacement of pelagic species.",
    "Increase temporal sampling cadence on localized ARGO floats to 5-day profiling mode."
  ];

  return (
    <div className="resilience-panel glass-panel-elevated">
      {/* Header */}
      <div className="resilience-header">
        <div className="resilience-title-wrap">
          <div className="resilience-icon-box">
            <LifeBuoy size={18} className="text-cyan" />
          </div>
          <div>
            <div className="resilience-tag font-mono">DISASTER RESILIENCE TRANSLATION</div>
            <h3 className="resilience-heading">{hazardTitle}</h3>
          </div>
        </div>

        <span className="badge badge-emerald font-mono">Actionable Intelligence</span>
      </div>

      {/* Hazard Implications Grid */}
      <div className="hazards-grid">
        {defaultHazards.map((h, idx) => {
          const Icon = h.icon || AlertOctagon;
          return (
            <div key={idx} className="hazard-card">
              <div className="hazard-top">
                <div className="hazard-cat font-mono" style={{ color: h.color }}>
                  <Icon size={13} />
                  <span>{h.category}</span>
                </div>
                <span className="hazard-severity-pill font-mono" style={{ color: h.color }}>
                  {h.severity}
                </span>
              </div>
              <h4 className="hazard-title">{h.title}</h4>
              <p className="hazard-detail">{h.detail}</p>
            </div>
          );
        })}
      </div>

      {/* Actionable Resilience Recommendations */}
      <div className="resilience-actions-box">
        <div className="actions-header font-mono">
          <Building2 size={14} className="text-cyan" />
          <span>RECOMMENDED RESILIENCE & PREPAREDNESS MEASURES ({region})</span>
        </div>

        <div className="actions-list">
          {defaultActions.map((act, idx) => (
            <div key={idx} className="action-item">
              <span className="action-num font-mono">0{idx + 1}</span>
              <span className="action-text">{act}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .resilience-panel {
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          border-radius: var(--radius-xl);
          background: rgba(6, 18, 35, 0.85);
          border: 1px solid rgba(0, 229, 255, 0.3);
        }

        .resilience-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 12px;
        }

        .resilience-title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .resilience-icon-box {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          background: rgba(0, 229, 255, 0.12);
          border: 1px solid rgba(0, 229, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .resilience-tag {
          font-size: 10.5px;
          color: var(--cyan-primary);
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .resilience-heading {
          font-size: 16px;
          font-weight: 800;
          color: #FFFFFF;
        }

        .hazards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 12px;
        }

        .hazard-card {
          background: rgba(8, 24, 48, 0.65);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: all var(--transition-fast);
        }

        .hazard-card:hover {
          background: rgba(12, 32, 60, 0.85);
          border-color: rgba(0, 229, 255, 0.35);
          transform: translateY(-2px);
        }

        .hazard-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .hazard-cat {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .hazard-severity-pill {
          font-size: 9.5px;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
        }

        .hazard-title {
          font-size: 14px;
          font-weight: 700;
          color: #FFFFFF;
        }

        .hazard-detail {
          font-size: 12.5px;
          color: #CBD5E1;
          line-height: 1.5;
        }

        .resilience-actions-box {
          background: rgba(4, 14, 28, 0.7);
          border: 1px solid var(--data-border);
          border-radius: var(--radius-lg);
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .actions-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: #FFFFFF;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .actions-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .action-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13px;
          color: #E2E8F0;
          line-height: 1.45;
        }

        .action-num {
          color: var(--cyan-primary);
          font-weight: 700;
          font-size: 11px;
          background: rgba(0, 229, 255, 0.1);
          padding: 2px 6px;
          border-radius: 3px;
          margin-top: 1px;
        }
      `}</style>
    </div>
  );
}
