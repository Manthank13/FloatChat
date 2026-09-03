import { 
  Wind, 
  Thermometer, 
  Scale, 
  ShieldAlert, 
  Droplets,
  ArrowUpRight
} from 'lucide-react';

export default function ExampleQueries({ onSelectQuery }) {
  const examples = [
    {
      text: "Is Chennai at increased cyclone risk?",
      tag: "Cyclone Risk",
      icon: Wind,
      color: "var(--red-critical)"
    },
    {
      text: "Show temperature and salinity changes near Chennai",
      tag: "CTD Cast",
      icon: Thermometer,
      color: "var(--cyan-primary)"
    },
    {
      text: "Compare cyclone risk between Chennai and Mumbai",
      tag: "Basin Contrast",
      icon: Scale,
      color: "var(--violet-secondary)"
    },
    {
      text: "What are the major climate risks in the Bay of Bengal?",
      tag: "Risk Sectors",
      icon: ShieldAlert,
      color: "var(--amber-warning)"
    },
    {
      text: "What evidence suggests increased coastal risk?",
      tag: "Ground Truth",
      icon: Droplets,
      color: "var(--sky-core)"
    }
  ];

  return (
    <div className="suggested-investigations-container">
      <div className="suggested-header font-mono">
        <span>SUGGESTED INVESTIGATIONS:</span>
      </div>
      <div className="suggested-chips-grid">
        {examples.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              className="investigation-prompt-chip"
              onClick={() => onSelectQuery(item.text)}
            >
              <div className="chip-left">
                <Icon size={13} style={{ color: item.color }} className="chip-icon" />
                <span className="chip-text">{item.text}</span>
              </div>
              <ArrowUpRight size={12} className="chip-arrow" />
            </button>
          );
        })}
      </div>

      <style>{`
        .suggested-investigations-container {
          width: 100%;
          margin-top: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .suggested-header {
          font-size: 10px;
          color: var(--text-muted);
          letter-spacing: 0.08em;
          text-align: left;
          font-weight: 700;
        }

        .suggested-chips-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 8px;
        }

        .investigation-prompt-chip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 9px 14px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
          backdrop-filter: blur(10px);
          text-align: left;
          box-shadow: var(--shadow-subtle);
        }

        .investigation-prompt-chip:hover {
          background: var(--data-surface-hover);
          border-color: var(--cyan-primary);
          color: var(--text-primary);
          transform: translateY(-1px);
          box-shadow: var(--shadow-elevated);
        }

        .chip-left {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .chip-icon {
          flex-shrink: 0;
        }

        .chip-text {
          font-size: 12px;
          line-height: 1.35;
          color: var(--text-primary);
          font-weight: 500;
        }

        .chip-arrow {
          color: var(--text-muted);
          flex-shrink: 0;
          transition: transform var(--transition-fast), color var(--transition-fast);
        }

        .investigation-prompt-chip:hover .chip-arrow {
          color: var(--cyan-primary);
          transform: translate(2px, -2px);
        }
      `}</style>
    </div>
  );
}
