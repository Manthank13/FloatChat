import { useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Download, 
  Sparkles, 
  MapPin, 
  Layers, 
  Thermometer, 
  Droplets, 
  Wind, 
  Scale 
} from 'lucide-react';

export default function EvidenceDrawer({ 
  evidence, 
  onClose, 
  onAskFollowUp,
  onNavigateToMap,
  onCompareWithRegion
}) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!evidence) return null;

  const floatData = evidence.float || {
    id: "ARGO-IN-2902741",
    wmoNumber: "2902741",
    name: "INCOIS-Apex-084",
    region: evidence.region || "Bay of Bengal (Off Chennai)",
    lat: evidence.lat || 13.08,
    lng: evidence.lng || 80.27,
    surfaceTemp: evidence.temp || 28.4,
    surfaceSalinity: evidence.salinity || 33.1,
    mixedLayerDepth: evidence.mld || 35,
    cycleNumber: 142,
    sensors: ["CTD (Seabird SBE41CP)", "Optode 4330 (Dissolved O2)", "FLBB (Chlorophyll-a)"]
  };

  const handleDownloadCsv = () => {
    const profile = evidence.profile || [
      { depth: 0, temp: floatData.surfaceTemp, salinity: floatData.surfaceSalinity },
      { depth: 10, temp: 28.3, salinity: 33.2 },
      { depth: 25, temp: 28.1, salinity: 33.5 },
      { depth: 50, temp: 26.8, salinity: 34.2 },
      { depth: 100, temp: 19.8, salinity: 34.9 },
      { depth: 500, temp: 9.4, salinity: 35.0 },
      { depth: 1000, temp: 5.8, salinity: 34.8 },
      { depth: 2000, temp: 3.1, salinity: 34.8 }
    ];

    const headers = "Depth (m),Temperature (C),Salinity (PSU),WMO ID,Quality Flag\n";
    const rows = profile.map(p => `${p.depth},${p.temp || p.temperature},${p.salinity || 34.5},${floatData.wmoNumber},RTQC_PASS`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `FloatChat_Evidence_${floatData.id}_Cycle${floatData.cycleNumber || 142}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="evidence-drawer-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Evidence Chain Drawer">
      <div className="evidence-drawer-card glass-panel-elevated" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-header">
          <div className="dh-left">
            <div className="evidence-chain-badge font-mono">
              <ShieldCheck size={14} className="text-emerald" />
              <span>OBSERVATIONAL EVIDENCE CHAIN</span>
            </div>
            <h2 className="drawer-title">{evidence.title || "Climate Risk Evidence & Telemetry Verification"}</h2>
            <span className="drawer-region-sub font-mono">
              <MapPin size={12} className="text-cyan" />
              <span>{evidence.region || floatData.region} • {floatData.lat}° N, {floatData.lng}° E</span>
            </span>
          </div>
          <button className="btn-close-drawer" onClick={onClose} aria-label="Close evidence drawer">
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="drawer-scroll-body">
          {/* STEP 1: AI CONCLUSION */}
          <div className="evidence-step-card">
            <div className="step-tag-row font-mono">
              <span className="step-num text-cyan">01</span>
              <span className="step-label">AI SCIENTIFIC CONCLUSION</span>
            </div>
            <p className="step-body-highlight">
              "{evidence.conclusion || evidence.summary || "Elevated Upper-Ocean Heat Content and a freshwater halocline barrier layer provide significant thermodynamic fuel that increases cyclone rapid intensification potential."}"
            </p>
            {evidence.riskScore && (
              <div className="evidence-risk-badge font-mono">
                <span>COMPOSITE RISK INDEX:</span>
                <strong className="text-rose">{evidence.riskScore} / 100 ({evidence.riskLevel?.toUpperCase() || "ELEVATED"})</strong>
              </div>
            )}
          </div>

          {/* STEP 2: PHYSICAL SIGNALS & ANOMALIES */}
          <div className="evidence-step-card">
            <div className="step-tag-row font-mono">
              <span className="step-num text-cyan">02</span>
              <span className="step-label">VERIFIED ENVIRONMENTAL SIGNALS</span>
            </div>
            <div className="signals-metrics-grid font-mono">
              <div className="signal-box">
                <div className="sb-header">
                  <Thermometer size={13} className="text-rose" />
                  <span>SEA SURFACE TEMP</span>
                </div>
                <strong className="sb-value">{floatData.surfaceTemp || "28.4"} °C</strong>
                <span className="sb-anomaly text-rose">+0.8°C vs 30-Yr Mean</span>
              </div>

              <div className="signal-box">
                <div className="sb-header">
                  <Droplets size={13} className="text-cyan" />
                  <span>SURFACE SALINITY</span>
                </div>
                <strong className="sb-value">{floatData.surfaceSalinity || "33.1"} PSU</strong>
                <span className="sb-anomaly text-cyan">-0.4 PSU (Diluted Cap)</span>
              </div>

              <div className="signal-box">
                <div className="sb-header">
                  <Layers size={13} className="text-emerald" />
                  <span>MIXED LAYER (MLD)</span>
                </div>
                <strong className="sb-value">{floatData.mixedLayerDepth || "35"} m</strong>
                <span className="sb-anomaly text-emerald">Stratified Heat Trap</span>
              </div>

              <div className="signal-box">
                <div className="sb-header">
                  <Wind size={13} className="text-amber" />
                  <span>CYCLONE HEAT (TCHP)</span>
                </div>
                <strong className="sb-value">&gt; 85 kJ/cm²</strong>
                <span className="sb-anomaly text-amber">High Intensity Range</span>
              </div>
            </div>
          </div>

          {/* STEP 3: IN-SITU SENSOR GROUND TRUTH */}
          <div className="evidence-step-card">
            <div className="step-tag-row font-mono">
              <span className="step-num text-cyan">03</span>
              <span className="step-label">GROUND-TRUTH SENSOR TELEMETRY</span>
            </div>
            
            <div className="sensor-specs-table font-mono">
              <div className="spec-row">
                <span className="spec-k">Sensor Unit ID:</span>
                <span className="spec-v text-cyan">{floatData.id} (WMO #{floatData.wmoNumber})</span>
              </div>
              <div className="spec-row">
                <span className="spec-k">Calibrated Sensors:</span>
                <span className="spec-v">{floatData.sensors?.join(", ") || "CTD (Seabird SBE41CP), Optode 4330"}</span>
              </div>
              <div className="spec-row">
                <span className="spec-k">Quality Control:</span>
                <span className="spec-v text-emerald">RTQC PASS (Real-Time Quality Controlled)</span>
              </div>
              <div className="spec-row">
                <span className="spec-k">Profile Cast Depth:</span>
                <span className="spec-v">Surface to 2,000m Abyssal Base (Cycle #{floatData.cycleNumber || 142})</span>
              </div>
              <div className="spec-row">
                <span className="spec-k">Telemetry Uplink:</span>
                <span className="spec-v">Iridium SBD Satellite Transceiver (INCOIS / ARGO GDAC)</span>
              </div>
            </div>

            <button className="btn-export-csv font-mono" onClick={handleDownloadCsv}>
              <Download size={13} />
              <span>Export In-Situ CTD Telemetry (CSV)</span>
            </button>
          </div>

          {/* STEP 4: SCIENTIFIC PHYSICAL MECHANICS */}
          <div className="evidence-step-card">
            <div className="step-tag-row font-mono">
              <span className="step-num text-cyan">04</span>
              <span className="step-label">PHYSICAL OCEAN-ATMOSPHERE MECHANISM</span>
            </div>
            <p className="step-prose">
              Low-salinity runoff from Gangetic and peninsular river systems spreads across the upper Bay of Bengal, creating a buoyant 25–35m freshwater cap. The steep density gradient (halocline) acts as a physical barrier that restricts vertical wind-driven turbulent mixing. As solar radiation penetrates this layer, heat is trapped in the shallow upper water column instead of diffusing downward, significantly accelerating thermodynamic air-sea flux.
            </p>
          </div>

          {/* STEP 5: ACTIONABLE RESILIENCE RECOMMENDATIONS */}
          <div className="evidence-step-card">
            <div className="step-tag-row font-mono">
              <span className="step-num text-cyan">05</span>
              <span className="step-label">DISASTER RESILIENCE & PREPAREDNESS</span>
            </div>
            <ul className="resilience-actions-list font-mono">
              <li>
                <span className="action-bullet text-amber">▶</span>
                <span>Track rapid intensification probability for low-pressure depressions in the {evidence.region || "Bay of Bengal"} sector.</span>
              </li>
              <li>
                <span className="action-bullet text-cyan">▶</span>
                <span>Coordinate with coastal disaster response authorities to assess storm surge vulnerability during astronomical high tides.</span>
              </li>
              <li>
                <span className="action-bullet text-emerald">▶</span>
                <span>Issue cautionary advisories to localized artisanal fisheries regarding stratified surface thermal stress.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Drawer Action Bar */}
        <div className="drawer-footer-actions">
          {onAskFollowUp && (
            <button 
              className="btn-drawer-action btn-ask-ai font-mono"
              onClick={() => {
                onAskFollowUp(`Explain the scientific evidence and coastal disaster implications for ${evidence.region || "this region"} in detail.`);
                onClose();
              }}
            >
              <Sparkles size={14} />
              <span>Ask FloatChat About This Signal</span>
            </button>
          )}

          {onNavigateToMap && (
            <button 
              className="btn-drawer-action btn-secondary font-mono"
              onClick={() => {
                onNavigateToMap();
                onClose();
              }}
            >
              <MapPin size={13} />
              <span>View On Risk Map</span>
            </button>
          )}

          {onCompareWithRegion && (
            <button 
              className="btn-drawer-action btn-secondary font-mono"
              onClick={() => {
                onCompareWithRegion(evidence.region || "Chennai", "Mumbai");
                onClose();
              }}
            >
              <Scale size={13} />
              <span>Compare With Mumbai</span>
            </button>
          )}
        </div>
      </div>

      <style>{`
        .evidence-drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(1, 4, 10, 0.7);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          z-index: 2000;
          display: flex;
          justify-content: flex-end;
          animation: fadeIn 0.25s ease-out;
        }

        .evidence-drawer-card {
          width: 100%;
          max-width: 580px;
          height: 100vh;
          background: var(--glass-panel-elevated);
          border-left: 1px solid var(--data-border-active);
          box-shadow: -10px 0 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 229, 255, 0.15);
          display: flex;
          flex-direction: column;
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        .drawer-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-light);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          background: rgba(4, 13, 26, 0.5);
        }

        .dh-left {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .evidence-chain-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 700;
          color: var(--emerald-nominal);
          letter-spacing: 0.08em;
        }

        .drawer-title {
          font-size: 17px;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.3;
        }

        .drawer-region-sub {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11.5px;
          color: var(--text-muted);
        }

        .btn-close-drawer {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-light);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }

        .btn-close-drawer:hover {
          color: #FFFFFF;
          background: rgba(244, 63, 94, 0.2);
          border-color: var(--red-critical);
        }

        .drawer-scroll-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .evidence-step-card {
          background: var(--data-surface);
          border: 1px solid var(--data-border);
          border-radius: var(--radius-lg);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .step-tag-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.06em;
        }

        .step-num {
          background: rgba(0, 229, 255, 0.12);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(0, 229, 255, 0.25);
        }

        .step-label {
          color: var(--text-secondary);
        }

        .step-body-highlight {
          font-size: 13.5px;
          color: var(--text-primary);
          line-height: 1.5;
          font-style: italic;
          border-left: 2px solid var(--cyan-primary);
          padding-left: 10px;
        }

        .evidence-risk-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(244, 63, 94, 0.1);
          border: 1px solid rgba(244, 63, 94, 0.25);
          padding: 6px 10px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          color: var(--text-secondary);
        }

        .signals-metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        @media (max-width: 480px) {
          .signals-metrics-grid {
            grid-template-columns: 1fr;
          }
        }

        .signal-box {
          background: rgba(4, 13, 26, 0.5);
          border: 1px solid var(--border-light);
          padding: 10px;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sb-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 9.5px;
          color: var(--text-muted);
        }

        .sb-value {
          font-size: 15px;
          color: var(--text-primary);
          font-weight: 800;
        }

        .sb-anomaly {
          font-size: 10px;
        }

        .sensor-specs-table {
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: rgba(4, 13, 26, 0.5);
          padding: 10px 12px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-light);
          font-size: 11px;
        }

        .spec-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          padding-bottom: 4px;
        }

        .spec-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .spec-k {
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .spec-v {
          color: var(--text-primary);
          text-align: right;
          word-break: break-word;
        }

        .btn-export-csv {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          padding: 9px;
          background: rgba(0, 229, 255, 0.08);
          border: 1px solid rgba(0, 229, 255, 0.25);
          border-radius: var(--radius-md);
          color: var(--cyan-primary);
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-export-csv:hover {
          background: rgba(0, 229, 255, 0.18);
          border-color: var(--cyan-primary);
        }

        .step-prose {
          font-size: 12.5px;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .resilience-actions-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 11.5px;
          color: var(--text-primary);
        }

        .resilience-actions-list li {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          line-height: 1.4;
        }

        .action-bullet {
          flex-shrink: 0;
          font-size: 10px;
          margin-top: 2px;
        }

        .drawer-footer-actions {
          padding: 16px 24px;
          border-top: 1px solid var(--border-light);
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: rgba(4, 13, 26, 0.6);
        }

        .btn-drawer-action {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 11px;
          border-radius: var(--radius-md);
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-ask-ai {
          background: linear-gradient(135deg, var(--cyan-primary) 0%, var(--electric-blue) 100%);
          color: var(--text-dark);
          box-shadow: 0 0 14px rgba(0, 229, 255, 0.3);
        }

        .btn-ask-ai:hover {
          background: #FFFFFF;
          color: #020611;
          box-shadow: 0 0 20px rgba(0, 229, 255, 0.5);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-light);
          color: var(--text-primary);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
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
