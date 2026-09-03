import { useState } from 'react';
import { 
  ShieldAlert, 
  Wind, 
  Waves, 
  Thermometer, 
  CloudRain, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  MapPin,
  Info, 
  Sparkles 
} from 'lucide-react';

export default function ClimateRiskScore({ 
  overallScore = 78, 
  overallLevel = "elevated", 
  regionName = "Regional Ocean Basin",
  onOpenEvidence,
  onNavigateToMap,
  onAskAboutRisk
}) {
  const [activeSectorId, setActiveSectorId] = useState('cyclone');

  const riskSectors = [
    {
      id: 'cyclone',
      title: 'Cyclone Rapid Intensification',
      score: 78,
      level: 'elevated',
      trend: 'up',
      icon: Wind,
      color: 'var(--amber-warning)',
      keySignals: [
        'Tropical Cyclone Heat Potential > 85 kJ/cm²',
        'Upper Ocean Thermal Energy Concentration',
        'Halocline Barrier Layer & Buoyancy Stratification'
      ],
      mechanisms: 'Freshwater capping inhibits wind mixing, trapping high thermal energy in the upper water column and providing continuous thermodynamic enthalpy flux.',
      evidenceCount: 'Calibrated ARGO CTD Profiling Array',
      severityTag: 'High Energy Potential'
    },
    {
      id: 'flood',
      title: 'Coastal Surge & Flood Coupling',
      score: 64,
      level: 'moderate',
      trend: 'up',
      icon: Waves,
      color: 'var(--sky-core)',
      keySignals: [
        'Sea-Level Anomaly (+4.2 cm departure)',
        'Spring Tide Astronomical Coupling',
        'Estuarine Drainage Restriction'
      ],
      mechanisms: 'Compounded risk when seasonal cyclonic storm surges coincide with localized low-salinity river runoff discharges.',
      evidenceCount: '2 In-Situ Moorings + Tide Gauges',
      severityTag: 'Moderate Surge Vulnerability'
    },
    {
      id: 'marine_heat',
      title: 'Marine Heatwave & Ecosystem',
      score: 52,
      level: 'moderate',
      trend: 'stable',
      icon: Thermometer,
      color: 'var(--emerald-nominal)',
      keySignals: [
        'Upper 50m thermal storage anomaly',
        'Chlorophyll-a localized depression',
        'Dissolved O2 saturation (210 umol/kg)'
      ],
      mechanisms: 'Shallow thermal stratification suppresses vertical upwelling of deep nutrient-rich water, elevating surface ecosystem stress.',
      evidenceCount: 'Seabird SBE41CP + Optode 4330',
      severityTag: 'Localized Thermal Stress'
    },
    {
      id: 'rainfall',
      title: 'Extreme Atmospheric Convection',
      score: 70,
      level: 'elevated',
      trend: 'up',
      icon: CloudRain,
      color: 'var(--red-critical)',
      keySignals: [
        'High Air-Sea Vapor Pressure Deficit',
        'Total Column Water Vapor (>55 mm)',
        'Convective Available Potential Energy (CAPE)'
      ],
      mechanisms: 'Elevated SST exceeds 28°C threshold required for continuous convective cloud cluster genesis and intense coastal rainfall bands.',
      evidenceCount: 'Satellite-assimilated in-situ array',
      severityTag: 'Elevated Convection Signal'
    }
  ];

  const activeSector = riskSectors.find(s => s.id === activeSectorId) || riskSectors[0];

  const getScoreColor = (score) => {
    if (score >= 75) return 'var(--amber-warning)';
    if (score >= 85) return 'var(--red-critical)';
    if (score >= 50) return 'var(--sky-core)';
    return 'var(--emerald-nominal)';
  };

  return (
    <div className="climate-risk-score-widget glass-panel">
      {/* Top Banner Header */}
      <div className="crs-header">
        <div className="crs-header-left">
          <div className="crs-badge font-mono">
            <ShieldAlert size={14} className="text-amber" />
            <span>COMPOSITE CLIMATE RISK INDEX</span>
          </div>
          <span className="crs-region-title">{regionName}</span>
        </div>

        <div className="crs-overall-gauge font-mono">
          <div className="gauge-number-wrap">
            <span className="gauge-val" style={{ color: getScoreColor(overallScore) }}>{overallScore}</span>
            <span className="gauge-max">/ 100</span>
          </div>
          <span className={`gauge-pill ${overallLevel}`}>
            {overallLevel.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Sector Selection Tabs */}
      <div className="crs-sectors-bar">
        {riskSectors.map((sector) => {
          const Icon = sector.icon;
          const isSelected = sector.id === activeSectorId;
          return (
            <button
              key={sector.id}
              className={`sector-tab-btn font-mono ${isSelected ? 'active' : ''}`}
              onClick={() => setActiveSectorId(sector.id)}
            >
              <Icon size={14} style={{ color: sector.color }} className="sector-icon" />
              <span className="sector-name">{sector.title.split(' ')[0]}</span>
              <span className="sector-score" style={{ color: getScoreColor(sector.score) }}>{sector.score}</span>
            </button>
          );
        })}
      </div>

      {/* Active Sector Diagnostic Deep-Dive */}
      <div className="crs-sector-body">
        <div className="sector-summary-header">
          <div className="ssh-left">
            <h4 className="ssh-title">{activeSector.title}</h4>
            <span className="ssh-tag font-mono text-cyan">{activeSector.severityTag}</span>
          </div>
          <div className="ssh-trend font-mono">
            {activeSector.trend === 'up' && <span className="text-rose"><TrendingUp size={13} /> Increasing Trend</span>}
            {activeSector.trend === 'stable' && <span className="text-cyan"><Minus size={13} /> Baseline Stability</span>}
            {activeSector.trend === 'down' && <span className="text-emerald"><TrendingDown size={13} /> Decreasing Risk</span>}
          </div>
        </div>

        {/* Contributing Environmental Signals */}
        <div className="crs-signals-list font-mono">
          <span className="signals-label">PRIMARY CONTRIBUTING SIGNALS:</span>
          <div className="signals-chips">
            {activeSector.keySignals.map((sig, idx) => (
              <div key={idx} className="sig-chip">
                <span className="sig-bullet text-cyan">●</span>
                <span>{sig}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Physical Mechanism Description */}
        <div className="crs-mechanism-box">
          <div className="cmb-header font-mono">
            <Info size={12} className="text-cyan" />
            <span>PHYSICAL OBSERVATIONAL MECHANISM</span>
          </div>
          <p className="cmb-text">{activeSector.mechanisms}</p>
        </div>

        {/* Action Controls */}
        <div className="crs-actions-row font-mono">
          <span className="evidence-badge">Evidence: {activeSector.evidenceCount}</span>

          <div className="crs-btn-group">
            {onOpenEvidence && (
              <button
                className="btn-crs-action btn-view-evidence"
                onClick={() => onOpenEvidence({
                  title: `${activeSector.title} Evidence Verification`,
                  region: regionName,
                  riskScore: activeSector.score,
                  riskLevel: activeSector.level,
                  conclusion: activeSector.mechanisms
                })}
              >
                <ShieldAlert size={12} />
                <span>View Evidence Chain</span>
              </button>
            )}

            {onNavigateToMap && (
              <button
                className="btn-crs-action btn-ask-context"
                onClick={onNavigateToMap}
              >
                <MapPin size={12} />
                <span>View On Map</span>
              </button>
            )}

            {onAskAboutRisk && (
              <button
                className="btn-crs-action btn-ask-context"
                onClick={() => onAskAboutRisk(`Explain the scientific factors driving the ${activeSector.title} in ${regionName}.`)}
              >
                <Sparkles size={12} />
                <span>Ask FloatChat</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .climate-risk-score-widget {
          background: var(--glass-panel);
          border: 1px solid var(--data-border);
          border-radius: var(--radius-xl);
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 20px;
        }

        .crs-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-light);
        }

        .crs-header-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .crs-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 700;
          color: var(--amber-warning);
          letter-spacing: 0.08em;
        }

        .crs-region-title {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .crs-overall-gauge {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .gauge-number-wrap {
          display: flex;
          align-items: baseline;
          gap: 3px;
        }

        .gauge-val {
          font-size: 26px;
          font-weight: 900;
          line-height: 1;
        }

        .gauge-max {
          font-size: 12px;
          color: var(--text-muted);
        }

        .gauge-pill {
          font-size: 9.5px;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          font-weight: 800;
          letter-spacing: 0.05em;
        }

        .gauge-pill.elevated {
          background: rgba(245, 158, 11, 0.15);
          color: var(--amber-warning);
          border: 1px solid rgba(245, 158, 11, 0.35);
        }

        .gauge-pill.high {
          background: rgba(244, 63, 94, 0.15);
          color: var(--red-critical);
          border: 1px solid rgba(244, 63, 94, 0.35);
        }

        .gauge-pill.moderate {
          background: rgba(56, 189, 248, 0.15);
          color: var(--sky-core);
          border: 1px solid rgba(56, 189, 248, 0.35);
        }

        .crs-sectors-bar {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 6px;
        }

        .sector-tab-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 10px;
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-size: 11px;
        }

        .sector-tab-btn:hover {
          background: var(--data-surface-hover);
          color: var(--text-primary);
          border-color: rgba(0, 229, 255, 0.3);
        }

        .sector-tab-btn.active {
          background: rgba(0, 229, 255, 0.12);
          border-color: var(--cyan-primary);
          color: var(--text-primary);
          box-shadow: 0 0 10px rgba(0, 229, 255, 0.2);
        }

        .sector-score {
          font-weight: 800;
        }

        .crs-sector-body {
          background: var(--data-surface);
          border: 1px solid var(--data-border);
          border-radius: var(--radius-lg);
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          animation: fadeIn 0.2s ease-out;
        }

        .sector-summary-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .ssh-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ssh-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .ssh-tag {
          font-size: 10px;
          background: rgba(0, 229, 255, 0.1);
          border: 1px solid rgba(0, 229, 255, 0.25);
          padding: 2px 7px;
          border-radius: var(--radius-full);
        }

        .ssh-trend {
          font-size: 11px;
          display: flex;
          align-items: center;
        }

        .crs-signals-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .signals-label {
          font-size: 9.5px;
          color: var(--text-muted);
          letter-spacing: 0.06em;
          font-weight: 700;
        }

        .signals-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .sig-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          padding: 5px 9px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          color: var(--text-primary);
          box-shadow: var(--shadow-subtle);
        }

        .sig-bullet {
          font-size: 8px;
        }

        .crs-mechanism-box {
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          padding: 10px 12px;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 4px;
          box-shadow: var(--shadow-subtle);
        }

        .cmb-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 9.5px;
          color: var(--text-muted);
          font-weight: 700;
        }

        .cmb-text {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .crs-actions-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-top: 8px;
          border-top: 1px solid var(--border-light);
          flex-wrap: wrap;
        }

        .evidence-badge {
          font-size: 10.5px;
          color: var(--text-muted);
        }

        .crs-btn-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-crs-action {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-view-evidence {
          background: var(--cyan-subtle);
          border: 1px solid var(--data-border-active);
          color: var(--cyan-primary);
        }

        .btn-view-evidence:hover {
          background: var(--cyan-primary);
          color: #FFFFFF;
        }

        .btn-ask-context {
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          color: var(--text-primary);
        }

        .btn-ask-context:hover {
          background: var(--data-surface-hover);
          border-color: var(--cyan-primary);
        }

        .text-rose { color: var(--red-critical); }
        .text-cyan { color: var(--cyan-primary); }
        .text-emerald { color: var(--emerald-nominal); }
        .text-amber { color: var(--amber-warning); }
      `}</style>
    </div>
  );
}
