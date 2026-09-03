import { 
  Sparkles, 
  Activity, 
  Layers, 
  ShieldAlert, 
  LifeBuoy,
  ArrowDown
} from 'lucide-react';

export default function InvestigationFlow({ 
  query = "",
  observationTitle = "Thermal Anomaly & Halocline Dilution",
  insightTitle = "Subsurface Barrier Layer Heat Trapping",
  riskTitle = "Elevated Cyclone Heat Potential (>85 kJ/cm²)",
  resilienceTitle = "Coastal Hazard Preparedness & Surge Tracking"
}) {
  const steps = [
    {
      num: "01",
      tag: "USER INQUIRY",
      title: query || "Target Climate Risk Inquiry",
      icon: Sparkles,
      color: "var(--cyan-primary)"
    },
    {
      num: "02",
      tag: "OBSERVATIONAL SIGNAL",
      title: observationTitle,
      icon: Activity,
      color: "var(--sky-core)"
    },
    {
      num: "03",
      tag: "SCIENTIFIC INSIGHT",
      title: insightTitle,
      icon: Layers,
      color: "var(--violet-secondary)"
    },
    {
      num: "04",
      tag: "CLIMATE RISK",
      title: riskTitle,
      icon: ShieldAlert,
      color: "var(--red-critical)"
    },
    {
      num: "05",
      tag: "DISASTER RESILIENCE",
      title: resilienceTitle,
      icon: LifeBuoy,
      color: "var(--emerald-nominal)"
    }
  ];

  return (
    <div className="investigation-flow-timeline">
      <div className="flow-steps-track">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={idx} className="flow-step-wrapper">
              <div className="flow-step-node">
                <div className="flow-node-icon" style={{ color: step.color, borderColor: step.color, background: `rgba(0, 229, 255, 0.08)` }}>
                  <Icon size={14} />
                </div>
                <div className="flow-node-content">
                  <span className="flow-node-tag font-mono" style={{ color: step.color }}>
                    STEP {step.num} • {step.tag}
                  </span>
                  <span className="flow-node-title">{step.title}</span>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className="flow-connector-line">
                  <ArrowDown size={12} className="connector-arrow" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .investigation-flow-timeline {
          width: 100%;
          background: rgba(6, 18, 35, 0.6);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          padding: 16px 20px;
          backdrop-filter: blur(12px);
        }

        .flow-steps-track {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .flow-step-wrapper {
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .flow-step-node {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(8, 24, 48, 0.5);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          transition: all var(--transition-fast);
        }

        .flow-step-node:hover {
          background: rgba(12, 32, 60, 0.8);
          border-color: rgba(0, 229, 255, 0.3);
        }

        .flow-node-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 1px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .flow-node-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .flow-node-tag {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .flow-node-title {
          font-size: 13px;
          font-weight: 600;
          color: #FFFFFF;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .flow-connector-line {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 14px;
          color: var(--cyan-primary);
          opacity: 0.6;
        }

        .connector-arrow {
          animation: bounceDown 1.5s infinite;
        }

        @keyframes bounceDown {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(2px); }
        }
      `}</style>
    </div>
  );
}
