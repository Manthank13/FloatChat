import { useState } from 'react';
import { 
  Radio, 
  Layers, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Navigation 
} from 'lucide-react';
import { useAuth } from '../context/useAuth';

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === null || lat1 === undefined || lon1 === null || lon1 === undefined || !lat2 || !lon2) return null;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
}

export default function About({ onNavigateToChat, onOpenAlertSettings, onInspectSignal }) {
  const { user } = useAuth();
  const [expandedStep, setExpandedStep] = useState(null);

  const activeAlerts = [
    {
      id: "alert_bob_cyclone",
      level: "elevated",
      title: "Elevated Cyclone Heat Potential",
      region: "South & Central Bay of Bengal (Off Chennai)",
      lat: 13.0827,
      lng: 80.2707,
      score: 78,
      leadTime: "48 - 72 Hour Operational Horizon",
      indicator: "TCHP > 85 kJ/cm² • SST 28.4°C (+0.8°C Anomaly)",
      significance: "Freshwater capping creates a 28m barrier layer inhibiting vertical cooling, providing favorable thermodynamic energy for rapid intensification.",
      actions: [
        "Pre-position coastal storm surge pumps in low-elevation drainage basins.",
        "Alert port authorities to monitor sea-state wave periods."
      ]
    },
    {
      id: "alert_andaman_marine_heat",
      level: "high",
      title: "Marine Heatwave & Ecosystem Thermal Stress",
      region: "Andaman Sea Basin (Port Blair Sector)",
      lat: 11.6234,
      lng: 92.7265,
      score: 82,
      leadTime: "Ongoing (Day 14)",
      indicator: "SST 29.4°C (+1.2°C Anomaly) • Degree Heating Weeks: 4.8",
      significance: "Sustained high SST suppressing nutrient upwelling, triggering localized coral bleaching indicators.",
      actions: [
        "Notify marine sanctuary authorities and artisanal fishery cooperatives.",
        "Maintain high-cadence 5-day profiling on Float ARGO-IN-2903550."
      ]
    },
    {
      id: "alert_chennai_coastal_surge",
      level: "moderate",
      title: "Low-Lying Estuarine Storm Surge Coupling",
      region: "Chennai Urban Coastal Corridor",
      lat: 12.9800,
      lng: 80.2400,
      score: 64,
      leadTime: "Spring Tide Alignment Window",
      indicator: "Sea-Level Anomaly +4.2cm • River Runoff Discharge",
      significance: "Compounded backwater flooding risk if precipitation runoff coincides with high tidal peaks.",
      actions: [
        "Inspect coastal sluice gates and tidal barrages.",
        "Review flood resilience evacuation plans for vulnerable lowlands."
      ]
    }
  ];

  const argoSteps = [
    {
      num: "01",
      title: "Surface Deployment",
      desc: "Autonomous float is deployed into the ocean, checks internal CTD sensors, and acquires GPS satellite fix.",
      detail: "Deployed via research vessel or aircraft. Automatically calibrates pressure, conductivity, and temperature baseline sensors before submerging."
    },
    {
      num: "02",
      title: "Descent to 1,000m",
      desc: "Internal hydraulic pump draws oil from external bladder to deflate, sinking to neutral buoyancy at 1,000 dbar.",
      detail: "Reaches neutral buoyancy equilibrium at ~1,000 meters depth where water density matches the float's calibrated mass."
    },
    {
      num: "03",
      title: "9-Day Lagrangian Drift",
      desc: "Drifts neutrally with deep subsurface currents for 9–10 days, recording intermediate water mass transport.",
      detail: "Acts as a passive ocean current tracer, mapping slow abyssal circulation patterns across thousands of kilometers."
    },
    {
      num: "04",
      title: "Deep Dive to 2,000m",
      desc: "Further deflates to descend to 2,000m depth (or 4,000m for Deep-Argo units) to initiate ascending cast.",
      detail: "Takes high-pressure readings at the base of the ocean thermocline before beginning the ascent."
    },
    {
      num: "05",
      title: "CTD Profiling Ascent",
      desc: "Inflates bladder to ascend at ~10 cm/s, continuously recording high-precision Temperature, Salinity, and Pressure.",
      detail: "Captures dense vertical data points across the water column, measuring haloclines, barrier layers, and mixed layer depth."
    },
    {
      num: "06",
      title: "Satellite Telemetry Uplink",
      desc: "Surfaces, acquires new coordinates, and beams binary data packets to GDAC via Iridium satellites for FloatChat AI.",
      detail: "Real-time automated RTQC pipelines validate the data within hours, feeding directly into FloatChat's Climate Intelligence engine."
    }
  ];

  const toggleStep = (idx) => {
    setExpandedStep(expandedStep === idx ? null : idx);
  };

  return (
    <div className="about-page-container">
      {/* Hero Section */}
      <div className="about-hero">
        <div className="about-badge font-mono">
          <ShieldAlert size={13} className="text-cyan" />
          <span>CLIMATE INTELLIGENCE & DISASTER RESILIENCE MISSION</span>
        </div>

        <h1 className="about-title">
          "FloatChat converts scientific environmental observations into understandable climate-risk and disaster-resilience intelligence."
        </h1>

        <p className="about-lead">
          An AI-powered environmental intelligence platform grounding climate policy, coastal hazard planning, and disaster preparedness 
          in real-time oceanic, atmospheric, and ARGO float in-situ observations.
        </p>

        <div className="hero-action-row font-mono">
          <button className="btn-launch-chat-hero" onClick={onNavigateToChat}>
            <Sparkles size={14} />
            <span>Launch Climate Risk Inquiry</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Active Climate Signals & Early Warning Stream */}
      <div className="resilience-stream-section">
        <div className="section-title-row">
          <div className="str-left">
            <ShieldAlert size={18} className="text-amber" />
            <h2 className="section-heading font-mono">ACTIVE CLIMATE SIGNALS & HAZARD MONITOR</h2>
          </div>
          <span className="badge badge-amber font-mono">3 Regional Signals Monitored</span>
        </div>

        <div className="alerts-stream-grid">
          {activeAlerts.map((alert) => (
            <div key={alert.id} className={`alert-stream-card ${alert.level} glass-panel`}>
              <div className="asc-header">
                <div className="asc-title-wrap">
                  <span className={`alert-level-tag font-mono ${alert.level}`}>
                    {alert.level.toUpperCase()} SIGNAL
                  </span>
                  <h3 className="asc-title">{alert.title}</h3>
                </div>
                <span className="asc-score font-mono">{alert.score} / 100</span>
              </div>

              <div className="asc-region font-mono text-cyan">
                <span>{alert.region}</span>
                <span className="asc-dot">•</span>
                <span className="asc-leadtime">{alert.leadTime}</span>
              </div>

              {/* Proximity Alert Indicator */}
              {(() => {
                const userLoc = user?.location;
                const isLocationActive = userLoc?.status === 'enabled' && userLoc?.latitude && userLoc?.longitude;
                const distanceKm = isLocationActive ? calculateDistanceKm(userLoc.latitude, userLoc.longitude, alert.lat, alert.lng) : null;
                const isWithinRadius = distanceKm !== null && distanceKm <= (userLoc?.alertRadiusKm || 50);

                if (isLocationActive) {
                  return (
                    <div className={`asc-proximity-banner ${isWithinRadius ? 'within' : 'outside'} font-mono`}>
                      <Navigation size={12} className={isWithinRadius ? 'text-amber animate-pulse' : 'text-cyan'} />
                      <span>
                        {isWithinRadius 
                          ? `🎯 PROXIMITY ALERT: ~${distanceKm} km from your location (Within ${userLoc?.alertRadiusKm || 50} km radius)`
                          : `📍 Monitoring: ~${distanceKm} km from your location (> ${userLoc?.alertRadiusKm || 50} km radius)`}
                      </span>
                    </div>
                  );
                }

                return (
                  <div className="asc-proximity-banner inactive font-mono">
                    <MapPin size={12} className="text-muted" />
                    <span>Location Disabled — Enable to receive proximity alerts</span>
                    {onOpenAlertSettings && (
                      <button 
                        type="button" 
                        className="btn-asc-enable-loc"
                        onClick={onOpenAlertSettings}
                      >
                        Enable
                      </button>
                    )}
                  </div>
                );
              })()}

              <div className="asc-indicator-box font-mono">
                <span className="ib-label">Observed Indicator:</span>
                <span className="ib-val">{alert.indicator}</span>
              </div>

              <p className="asc-significance">{alert.significance}</p>

              <div className="asc-actions-list font-mono">
                <span className="actions-header">Resilience & Preparedness Actions:</span>
                {alert.actions.map((act, aIdx) => (
                  <div key={aIdx} className="action-row">
                    <CheckCircle2 size={12} className="text-emerald flex-shrink-0" />
                    <span>{act}</span>
                  </div>
                ))}
              </div>

              <div className="asc-card-footer font-mono">
                <button
                  type="button"
                  className="btn-alert-ask"
                  onClick={() => onNavigateToChat && onNavigateToChat(`Explain early warning mechanisms and coastal preparedness for the ${alert.title} in ${alert.region}.`)}
                >
                  <Sparkles size={12} />
                  <span>Ask FloatChat</span>
                </button>

                <button
                  type="button"
                  className="btn-alert-evidence"
                  onClick={() => {
                    if (onInspectSignal) {
                      onInspectSignal({
                        title: `${alert.title} — Evidence Verification`,
                        region: alert.region,
                        riskScore: alert.score,
                        riskLevel: alert.level,
                        conclusion: alert.significance
                      }, 'about');
                    }
                  }}
                >
                  <ShieldCheck size={12} />
                  <span>Inspect Evidence Chain</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3 Core Platform Pillars */}
      <div className="pillars-grid">
        <div className="pillar-card glass-panel">
          <div className="pillar-icon bg-cyan">
            <Radio size={22} />
          </div>
          <h3 className="pillar-title">In-Situ Observational Ground Truth</h3>
          <p className="pillar-text">
            Ingesting real-time telemetry from ~3,840 autonomous robotic ARGO floats profiling the global ocean from surface to 2,000m and 4,000m depth.
          </p>
        </div>

        <div className="pillar-card glass-panel">
          <div className="pillar-icon bg-blue">
            <Layers size={22} />
          </div>
          <h3 className="pillar-title">Thermodynamic & Physical Stratification</h3>
          <p className="pillar-text">
            Capturing non-linear climate dynamics including halocline freshwater barrier layers, thermocline heat traps, and upper-ocean heat reservoirs.
          </p>
        </div>

        <div className="pillar-card glass-panel">
          <div className="pillar-icon bg-emerald">
            <ShieldCheck size={22} />
          </div>
          <h3 className="pillar-title">AI Grounded in Domain Evidence</h3>
          <p className="pillar-text">
            Translating complex multidimensional NetCDF ocean-atmosphere observations into actionable early warning signals and coastal disaster resilience insights.
          </p>
        </div>
      </div>

      {/* Interactive 6-Stage Sensor Telemetry Lifecycle */}
      <div className="lifecycle-section glass-panel">
        <div className="section-title-row">
          <div className="str-left">
            <Radio size={18} className="text-cyan" />
            <h2 className="section-heading font-mono">ARGO IN-SITU OBSERVATIONAL TELEMETRY CYCLE</h2>
          </div>
          <span className="font-mono text-muted" style={{ fontSize: '11px' }}>Click step to inspect mechanics</span>
        </div>

        <div className="lifecycle-steps-grid">
          {argoSteps.map((step, idx) => (
            <div 
              key={step.num} 
              className={`lifecycle-step-card ${expandedStep === idx ? 'expanded' : ''}`}
              onClick={() => toggleStep(idx)}
              role="button"
              tabIndex={0}
            >
              <div className="lsc-header">
                <span className="step-num font-mono text-cyan">{step.num}</span>
                <h4 className="step-title">{step.title}</h4>
                <div className="lsc-expand-icon">
                  {expandedStep === idx ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </div>
              <p className="step-desc">{step.desc}</p>
              {expandedStep === idx && (
                <p className="step-detail font-mono">{step.detail}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .about-page-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 24px 60px;
          display: flex;
          flex-direction: column;
          gap: 36px;
        }

        .about-hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 16px;
          padding: 40px 20px;
          background: radial-gradient(circle at 50% 30%, rgba(0, 229, 255, 0.08) 0%, transparent 70%);
        }

        .about-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(0, 229, 255, 0.1);
          border: 1px solid rgba(0, 229, 255, 0.3);
          padding: 4px 12px;
          border-radius: var(--radius-full);
          font-size: 11px;
          color: var(--cyan-primary);
          font-weight: 700;
          letter-spacing: 0.08em;
        }

        .about-title {
          font-size: 26px;
          font-weight: 800;
          color: var(--text-primary);
          max-width: 860px;
          line-height: 1.35;
        }

        .about-lead {
          font-size: 14px;
          color: var(--text-secondary);
          max-width: 720px;
          line-height: 1.6;
        }

        .hero-action-row {
          margin-top: 10px;
        }

        .btn-launch-chat-hero {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: linear-gradient(135deg, var(--cyan-primary) 0%, var(--electric-blue) 100%);
          color: var(--text-dark);
          font-size: 13px;
          font-weight: 800;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          box-shadow: 0 0 20px rgba(0, 229, 255, 0.35);
        }

        .btn-launch-chat-hero:hover {
          background: #FFFFFF;
          color: #020611;
          box-shadow: 0 0 30px rgba(0, 229, 255, 0.55);
          transform: translateY(-1px);
        }

        .resilience-stream-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .section-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .str-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-heading {
          font-size: 14px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: 0.05em;
        }

        .alerts-stream-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 16px;
        }

        .alert-stream-card {
          border-radius: var(--radius-xl);
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          border: 1px solid var(--data-border);
        }

        .alert-stream-card.elevated {
          border-color: rgba(245, 158, 11, 0.35);
          background: linear-gradient(180deg, rgba(245, 158, 11, 0.06) 0%, rgba(6, 18, 35, 0.6) 100%);
        }

        .alert-stream-card.high {
          border-color: rgba(244, 63, 94, 0.35);
          background: linear-gradient(180deg, rgba(244, 63, 94, 0.06) 0%, rgba(6, 18, 35, 0.6) 100%);
        }

        .alert-stream-card.moderate {
          border-color: rgba(56, 189, 248, 0.35);
          background: linear-gradient(180deg, rgba(56, 189, 248, 0.06) 0%, rgba(6, 18, 35, 0.6) 100%);
        }

        .asc-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }

        .asc-title-wrap {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .alert-level-tag {
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 0.06em;
        }

        .alert-level-tag.elevated { color: var(--amber-warning); }
        .alert-level-tag.high { color: var(--red-critical); }
        .alert-level-tag.moderate { color: var(--sky-core); }

        .asc-title {
          font-size: 15px;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.3;
        }

        .asc-score {
          font-size: 18px;
          font-weight: 900;
          color: var(--text-primary);
        }

        .asc-region {
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .asc-dot {
          opacity: 0.4;
        }

        .asc-proximity-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border-radius: var(--radius-sm);
          font-size: 10.5px;
          line-height: 1.3;
        }

        .asc-proximity-banner.within {
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.35);
          color: var(--amber-warning);
          box-shadow: 0 0 12px rgba(245, 158, 11, 0.15);
        }

        .asc-proximity-banner.outside {
          background: rgba(0, 229, 255, 0.08);
          border: 1px solid rgba(0, 229, 255, 0.2);
          color: var(--text-cyan);
        }

        .asc-proximity-banner.inactive {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          color: var(--text-muted);
          justify-content: space-between;
        }

        .btn-asc-enable-loc {
          padding: 2px 8px;
          background: rgba(0, 229, 255, 0.15);
          border: 1px solid rgba(0, 229, 255, 0.3);
          border-radius: var(--radius-sm);
          color: var(--cyan-primary);
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-asc-enable-loc:hover {
          background: var(--cyan-primary);
          color: #020611;
        }

        .asc-indicator-box {
          background: rgba(4, 13, 26, 0.6);
          border: 1px solid var(--border-light);
          padding: 8px 10px;
          border-radius: var(--radius-sm);
          font-size: 10.5px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .ib-label {
          color: var(--text-muted);
        }

        .ib-val {
          color: var(--text-primary);
          font-weight: 700;
        }

        .asc-significance {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .asc-actions-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 11px;
          background: rgba(6, 18, 35, 0.4);
          padding: 10px;
          border-radius: var(--radius-sm);
        }

        .actions-header {
          font-size: 9.5px;
          color: var(--text-muted);
          font-weight: 700;
          letter-spacing: 0.05em;
          margin-bottom: 2px;
        }

        .action-row {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          color: var(--text-primary);
        }

        .asc-card-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
        }

        .btn-alert-ask {
          display: flex;
          align-items: center;
          gap: 5px;
          background: linear-gradient(135deg, rgba(0, 229, 255, 0.15) 0%, rgba(2, 132, 199, 0.25) 100%);
          border: 1px solid rgba(0, 229, 255, 0.35);
          color: var(--cyan-primary);
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
          flex: 1;
          justify-content: center;
        }

        .btn-alert-ask:hover {
          background: var(--cyan-primary);
          color: var(--text-dark);
        }

        .btn-alert-evidence {
          display: flex;
          align-items: center;
          gap: 5px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-light);
          color: var(--text-secondary);
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-alert-evidence:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
          border-color: var(--cyan-primary);
        }

        .pillars-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .pillar-card {
          border: 1px solid var(--data-border);
          border-radius: var(--radius-xl);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .pillar-icon {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pillar-icon.bg-cyan {
          background: rgba(0, 229, 255, 0.15);
          color: var(--cyan-primary);
          border: 1px solid rgba(0, 229, 255, 0.3);
        }

        .pillar-icon.bg-emerald {
          background: rgba(16, 185, 129, 0.15);
          color: var(--emerald-nominal);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .pillar-icon.bg-sky {
          background: rgba(56, 189, 248, 0.15);
          color: var(--sky-core);
          border: 1px solid rgba(56, 189, 248, 0.3);
        }

        .pillar-title {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .pillar-text {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .lifecycle-section {
          border: 1px solid var(--data-border);
          border-radius: var(--radius-xl);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .lifecycle-steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 12px;
        }

        .lifecycle-step-card {
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .lifecycle-step-card:hover {
          background: var(--data-surface-hover);
          border-color: rgba(0, 229, 255, 0.4);
        }

        .lifecycle-step-card.expanded {
          border-color: var(--cyan-primary);
          background: rgba(0, 229, 255, 0.08);
        }

        .lsc-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .step-num {
          font-size: 12px;
          font-weight: 800;
        }

        .step-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          flex: 1;
        }

        .lsc-expand-icon {
          color: var(--text-muted);
        }

        .step-desc {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.45;
        }

        .step-detail {
          font-size: 11px;
          color: var(--cyan-primary);
          line-height: 1.45;
          margin-top: 4px;
          padding-top: 6px;
          border-top: 1px solid rgba(0, 229, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
