import { 
  Thermometer, 
  Droplets, 
  Layers, 
  ShieldAlert, 
  TrendingUp, 
  Scale
} from 'lucide-react';

export default function ComparisonView({
  comparison = null
}) {
  if (!comparison) return null;

  const locA = comparison.locationA || {
    name: "Chennai (Bay of Bengal)",
    riskLevel: "elevated",
    sst: "28.4 °C",
    sstAnomaly: "+0.8°C Anomaly",
    salinity: "33.1 PSU (Diluted)",
    barrierLayer: "28m Freshwater Cap",
    mld: "35m",
    cyclonePotential: "High (>85 kJ/cm²)",
    floatId: "ARGO-IN-2902741"
  };

  const locB = comparison.locationB || {
    name: "Mumbai (Arabian Sea)",
    riskLevel: "moderate",
    sst: "29.1 °C",
    sstAnomaly: "+0.3°C Anomaly",
    salinity: "36.6 PSU (High Saline)",
    barrierLayer: "None (Deep Mixing)",
    mld: "65m",
    cyclonePotential: "Moderate (55 kJ/cm²)",
    floatId: "ARGO-IN-2903118"
  };

  const differences = comparison.keyDifferences || [
    {
      metric: "Barrier Layer & Salinity",
      diff: "Bay of Bengal has low salinity (33.1 PSU) and a 28m barrier layer trapping heat; Arabian Sea has high salinity (36.6 PSU) with deep convective mixing.",
      significance: "Freshwater capping prevents heat loss in the Bay of Bengal, fostering rapid storm intensification."
    },
    {
      metric: "Mixed Layer Depth (MLD)",
      diff: "Chennai sector MLD is shallow (35m); Mumbai sector MLD is deep (65m).",
      significance: "Shallow warm layers concentrate thermal energy near the surface rather than diluting it downwards."
    },
    {
      metric: "Tropical Cyclone Heat Potential",
      diff: "Bay of Bengal TCHP >85 kJ/cm² vs Arabian Sea TCHP ~55 kJ/cm².",
      significance: "Significantly higher thermodynamic reservoir available for cyclogenesis in the Chennai coastal basin."
    }
  ];

  const getRiskClass = (level) => {
    if (level === 'elevated' || level === 'high') return 'risk-elevated';
    if (level === 'moderate') return 'risk-moderate';
    return 'risk-nominal';
  };

  return (
    <div className="comparison-view-panel glass-panel-elevated">
      {/* Header */}
      <div className="comparison-header">
        <div className="comp-title-group">
          <div className="comp-icon-box">
            <Scale size={18} className="text-cyan" />
          </div>
          <div>
            <span className="comp-tag font-mono">REGIONAL CLIMATE RISK CONTRAST</span>
            <h3 className="comp-title">
              {comparison.title || `${locA.name} vs ${locB.name}`}
            </h3>
          </div>
        </div>
        <span className="badge badge-cyan font-mono">Dual-Basin Synthesis</span>
      </div>

      {/* Side-by-Side Cards */}
      <div className="comparison-cards-grid">
        {/* Location A */}
        <div className={`comp-location-card ${getRiskClass(locA.riskLevel)}`}>
          <div className="loc-card-header">
            <div className="loc-name-block">
              <span className="loc-badge font-mono">Sector A</span>
              <h4 className="loc-name">{locA.name}</h4>
            </div>
            <span className={`risk-pill font-mono ${getRiskClass(locA.riskLevel)}`}>
              {locA.riskLevel.toUpperCase()} RISK
            </span>
          </div>

          <div className="loc-metrics-list font-mono">
            <div className="loc-metric-item">
              <span className="m-label"><Thermometer size={12} className="text-red" /> Sea Surface Temp:</span>
              <span className="m-val">{locA.sst} <small>({locA.sstAnomaly})</small></span>
            </div>
            <div className="loc-metric-item">
              <span className="m-label"><Droplets size={12} className="text-cyan" /> Surface Salinity:</span>
              <span className="m-val">{locA.salinity}</span>
            </div>
            <div className="loc-metric-item">
              <span className="m-label"><Layers size={12} className="text-sky" /> Mixed Layer Depth:</span>
              <span className="m-val">{locA.mld}</span>
            </div>
            <div className="loc-metric-item">
              <span className="m-label"><ShieldAlert size={12} className="text-red" /> Barrier Layer:</span>
              <span className="m-val">{locA.barrierLayer}</span>
            </div>
            <div className="loc-metric-item highlight">
              <span className="m-label"><TrendingUp size={12} className="text-red" /> Cyclone Potential:</span>
              <strong className="m-val text-red">{locA.cyclonePotential}</strong>
            </div>
          </div>
        </div>

        {/* Location B */}
        <div className={`comp-location-card ${getRiskClass(locB.riskLevel)}`}>
          <div className="loc-card-header">
            <div className="loc-name-block">
              <span className="loc-badge font-mono">Sector B</span>
              <h4 className="loc-name">{locB.name}</h4>
            </div>
            <span className={`risk-pill font-mono ${getRiskClass(locB.riskLevel)}`}>
              {locB.riskLevel.toUpperCase()} RISK
            </span>
          </div>

          <div className="loc-metrics-list font-mono">
            <div className="loc-metric-item">
              <span className="m-label"><Thermometer size={12} className="text-red" /> Sea Surface Temp:</span>
              <span className="m-val">{locB.sst} <small>({locB.sstAnomaly})</small></span>
            </div>
            <div className="loc-metric-item">
              <span className="m-label"><Droplets size={12} className="text-cyan" /> Surface Salinity:</span>
              <span className="m-val">{locB.salinity}</span>
            </div>
            <div className="loc-metric-item">
              <span className="m-label"><Layers size={12} className="text-sky" /> Mixed Layer Depth:</span>
              <span className="m-val">{locB.mld}</span>
            </div>
            <div className="loc-metric-item">
              <span className="m-label"><ShieldAlert size={12} className="text-cyan" /> Barrier Layer:</span>
              <span className="m-val">{locB.barrierLayer}</span>
            </div>
            <div className="loc-metric-item highlight">
              <span className="m-label"><TrendingUp size={12} className="text-amber" /> Cyclone Potential:</span>
              <strong className="m-val text-amber">{locB.cyclonePotential}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Key Differences & Scientific Why */}
      <div className="differences-section">
        <div className="diff-header font-mono">
          <TrendingUp size={13} className="text-cyan" />
          <span>KEY PHYSICAL DIFFERENCES & WHY THEY MATTER</span>
        </div>

        <div className="diff-list">
          {differences.map((d, idx) => (
            <div key={idx} className="diff-card">
              <div className="diff-metric-row font-mono">
                <span className="diff-metric-name">{d.metric}</span>
              </div>
              <p className="diff-desc">{d.diff}</p>
              <div className="diff-significance font-mono">
                <span className="sig-label">Resilience Implication:</span>
                <span className="sig-text">{d.significance}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .comparison-view-panel {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          border-radius: var(--radius-xl);
          background: rgba(6, 18, 35, 0.85);
          border: 1px solid rgba(0, 229, 255, 0.3);
        }

        .comparison-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 12px;
        }

        .comp-title-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .comp-icon-box {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          background: rgba(0, 229, 255, 0.12);
          border: 1px solid rgba(0, 229, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .comp-tag {
          font-size: 10.5px;
          color: var(--cyan-primary);
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .comp-title {
          font-size: 16px;
          font-weight: 800;
          color: #FFFFFF;
        }

        .comparison-cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .comp-location-card {
          background: rgba(8, 24, 48, 0.7);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
        }

        .comp-location-card.risk-elevated {
          border-color: rgba(244, 63, 94, 0.4);
          background: rgba(244, 63, 94, 0.05);
        }

        .comp-location-card.risk-moderate {
          border-color: rgba(245, 158, 11, 0.4);
          background: rgba(245, 158, 11, 0.05);
        }

        .loc-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 8px;
        }

        .loc-name-block {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .loc-badge {
          font-size: 10px;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .loc-name {
          font-size: 15px;
          font-weight: 700;
          color: #FFFFFF;
        }

        .risk-pill {
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          border: 1px solid;
        }

        .risk-pill.risk-elevated {
          color: var(--red-critical);
          background: rgba(244, 63, 94, 0.15);
          border-color: rgba(244, 63, 94, 0.4);
        }

        .risk-pill.risk-moderate {
          color: var(--amber-warning);
          background: rgba(245, 158, 11, 0.15);
          border-color: rgba(245, 158, 11, 0.4);
        }

        .loc-metrics-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 11.5px;
        }

        .loc-metric-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 0;
          border-bottom: 1px dashed rgba(255, 255, 255, 0.06);
        }

        .loc-metric-item.highlight {
          border-bottom: none;
          background: rgba(255, 255, 255, 0.03);
          padding: 6px 8px;
          border-radius: var(--radius-sm);
          margin-top: 4px;
        }

        .m-label {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-secondary);
        }

        .m-val {
          color: #FFFFFF;
        }

        .m-val small {
          color: var(--text-muted);
        }

        .differences-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: rgba(4, 14, 28, 0.7);
          border: 1px solid var(--data-border);
          border-radius: var(--radius-lg);
          padding: 16px 20px;
        }

        .diff-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #FFFFFF;
          font-weight: 700;
        }

        .diff-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .diff-card {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 10px 12px;
          background: rgba(8, 22, 42, 0.6);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-light);
        }

        .diff-metric-name {
          font-size: 11px;
          font-weight: 700;
          color: var(--cyan-primary);
        }

        .diff-desc {
          font-size: 12.5px;
          color: #E2E8F0;
          line-height: 1.45;
        }

        .diff-significance {
          display: flex;
          align-items: baseline;
          gap: 6px;
          font-size: 11px;
          color: var(--amber-warning);
          margin-top: 2px;
        }

        .sig-label {
          font-weight: 700;
        }

        .text-red { color: var(--red-critical); }
        .text-amber { color: var(--amber-warning); }
        .text-sky { color: var(--sky-core); }

        @media (max-width: 800px) {
          .comparison-cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
