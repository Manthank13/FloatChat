import { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Database, 
  Activity, 
  Sparkles, 
  ShieldCheck, 
  Thermometer, 
  Droplets, 
  Layers, 
  Wind, 
  FileSpreadsheet, 
  AlertTriangle, 
  MapPin, 
  Download, 
  Scale, 
  Compass, 
  Radio, 
  RotateCcw 
} from 'lucide-react';

export default function SignalInspect({ 
  signal = null, 
  onBack, 
  onNavigateToChat 
}) {
  const [activeParam, setActiveParam] = useState('temp');
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Fallback / default data if opened directly without a specific signal passed
  const signalData = useMemo(() => {
    const raw = signal || {};
    const floatObj = raw.float || {};

    return {
      title: raw.title || "Sea Surface Temperature & Upper Ocean Heat Content",
      category: raw.category || "Thermodynamic Anomaly",
      region: raw.region || floatObj.region || "Bay of Bengal (Off Chennai)",
      lat: raw.lat || floatObj.lat || 13.0827,
      lng: raw.lng || floatObj.lng || 80.2707,
      surfaceTemp: raw.surfaceTemp || raw.temp || floatObj.surfaceTemp || 28.4,
      surfaceSalinity: raw.surfaceSalinity || raw.salinity || floatObj.surfaceSalinity || 33.1,
      mixedLayerDepth: raw.mixedLayerDepth || raw.mld || floatObj.mixedLayerDepth || 35,
      tchp: raw.tchp || 88.5,
      density: raw.density || 22.4,
      riskScore: raw.riskScore || 78,
      riskLevel: raw.riskLevel || "High",
      floatId: raw.floatId || floatObj.id || "ARGO-IN-2902741",
      wmoNumber: floatObj.wmoNumber || "2902741",
      platform: floatObj.platform || "Apex Profiling Float (INCOIS / MoES)",
      cycleNumber: floatObj.cycleNumber || 142,
      lastTransmission: floatObj.lastTransmission || "Today, 06:14 UTC (RTQC PASS)",
      sensors: floatObj.sensors || [
        "Sea-Bird SBE 41CP CTD (Conductivity, Temp, Pressure)",
        "Aanderaa Optode 4330 (Dissolved Oxygen)",
        "WetLabs FLBB (Chlorophyll-a / Turbidity)"
      ],
      conclusion: raw.conclusion || raw.summary || "Elevated upper-ocean heat content combined with a riverine halocline barrier layer creates a thermodynamic heat trap, restricting wind-driven vertical cooling and increasing the likelihood of rapid tropical storm intensification.",
      mechanisms: raw.mechanisms || "Gangetic and peninsular river discharge creates a low-salinity (33.1 PSU) buoyant surface layer that insulates the upper 35 meters. Heat absorption from intense solar radiation cannot diffuse past the pycnocline barrier, concentrating thermal energy at the air-sea interface.",
      profile: raw.profile || floatObj.profile || [
        { depth: 0, temp: 28.4, salinity: 33.1, density: 21.8, tchp: 88.5 },
        { depth: 10, temp: 28.3, salinity: 33.2, density: 21.9, tchp: 88.1 },
        { depth: 25, temp: 28.1, salinity: 33.5, density: 22.2, tchp: 87.0 },
        { depth: 50, temp: 26.8, salinity: 34.2, density: 23.4, tchp: 82.3 },
        { depth: 100, temp: 19.8, salinity: 34.9, density: 25.6, tchp: 64.0 },
        { depth: 200, temp: 14.5, salinity: 35.1, density: 26.7, tchp: 38.2 },
        { depth: 500, temp: 9.4, salinity: 35.0, density: 27.3, tchp: 12.0 },
        { depth: 1000, temp: 5.8, salinity: 34.8, density: 27.6, tchp: 0.0 },
        { depth: 2000, temp: 3.1, salinity: 34.8, density: 27.8, tchp: 0.0 }
      ],
      timeSeries: [
        { date: "May 01", temp: 27.6, baseline: 27.6, anomaly: "+0.0°C" },
        { date: "May 08", temp: 27.8, baseline: 27.6, anomaly: "+0.2°C" },
        { date: "May 15", temp: 28.1, baseline: 27.6, anomaly: "+0.5°C" },
        { date: "May 22", temp: 28.3, baseline: 27.6, anomaly: "+0.7°C" },
        { date: "May 29", temp: 28.4, baseline: 27.6, anomaly: "+0.8°C" }
      ]
    };
  }, [signal]);

  // Parameter configuration
  const paramConfigs = {
    temp: {
      label: "Seawater Temperature",
      unit: "°C",
      color: "#F43F5E",
      min: 0,
      max: 32,
      dataKey: "temp",
      icon: Thermometer,
      desc: "In-situ seawater temperature measuring surface thermal energy and thermocline depth."
    },
    salinity: {
      label: "Practical Salinity",
      unit: "PSU",
      color: "#00E5FF",
      min: 30,
      max: 38,
      dataKey: "salinity",
      icon: Droplets,
      desc: "Salinity concentration capturing freshwater river runoff plumes vs high-salinity oceanic water masses."
    },
    density: {
      label: "Potential Density (σθ)",
      unit: "kg/m³",
      color: "#A855F7",
      min: 19,
      max: 29,
      dataKey: "density",
      icon: Layers,
      desc: "Water density controlling vertical stratification stability and barrier layer resistance."
    },
    tchp: {
      label: "Tropical Cyclone Heat (TCHP)",
      unit: "kJ/cm²",
      color: "#F59E0B",
      min: 0,
      max: 120,
      dataKey: "tchp",
      icon: Wind,
      desc: "Integrated heat content above the 26°C isotherm, representing thermal fuel for cyclone intensification."
    }
  };

  const activeConfig = paramConfigs[activeParam] || paramConfigs.temp;

  // Chart SVG Coordinates Calculation
  const chartWidth = 900;
  const chartHeight = 360;
  const padLeft = 70;
  const padTop = 30;
  const padRight = 40;
  const padBottom = 45;
  const innerW = chartWidth - padLeft - padRight;
  const innerH = chartHeight - padTop - padBottom;
  const maxDepth = 2000;

  const chartPoints = useMemo(() => {
    const { min, max, dataKey } = activeConfig;
    return signalData.profile.map(p => {
      const val = p[dataKey] !== undefined ? p[dataKey] : min;
      const clamped = Math.max(min, Math.min(max, val));
      const x = padLeft + ((clamped - min) / (max - min)) * innerW;
      const y = padTop + (p.depth / maxDepth) * innerH;
      return { x, y, depth: p.depth, val, raw: p };
    });
  }, [signalData.profile, activeConfig, innerW, innerH]);

  const pathD = useMemo(() => {
    if (chartPoints.length === 0) return "";
    return chartPoints.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, "");
  }, [chartPoints]);

  const handleDownloadCSV = () => {
    const headers = "Depth_m,Temperature_C,Salinity_PSU,Density_kg_m3,TCHP_kJ_cm2,WMO_ID,QC_Flag\n";
    const rows = signalData.profile.map(p => 
      `${p.depth},${p.temp},${p.salinity},${p.density || 24.5},${p.tchp || 0},${signalData.wmoNumber},RTQC_PASS`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `FloatChat_Signal_Analysis_${signalData.floatId}_${activeParam}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    setTimeout(() => {
      setIsLoading(false);
    }, 600);
  };

  // Full-Page Error State
  if (hasError) {
    return (
      <div className="signal-inspect-page error-mode">
        <div className="inspect-error-card glass-panel-elevated font-mono">
          <AlertTriangle size={36} className="text-rose animate-bounce" />
          <h2 className="error-title">Unable to Load Environmental Signal Data</h2>
          <p className="error-desc">
            The observational telemetry feed for this environmental parameter could not be retrieved from the marine observation network.
          </p>
          <div className="error-actions">
            <button className="btn-retry font-mono" onClick={handleRetry}>
              <RotateCcw size={14} />
              <span>Retry Retrieval</span>
            </button>
            <button className="btn-back-error font-mono" onClick={onBack}>
              <ArrowLeft size={14} />
              <span>← Back to Environmental Signals</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full-Page Loading Skeleton State
  if (isLoading) {
    return (
      <div className="signal-inspect-page loading-mode">
        <div className="inspect-loading-wrap font-mono">
          <Activity size={28} className="text-cyan animate-pulse" />
          <span>SYNCHRONIZING CALIBRATED ENVIRONMENTAL DATA...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="signal-inspect-page">
      {/* 1. Clear Back Navigation Bar */}
      <div className="inspect-top-nav-bar">
        <button 
          type="button" 
          className="btn-back-signals font-mono"
          onClick={onBack}
          aria-label="Back to Environmental Signals"
        >
          <ArrowLeft size={16} />
          <span>← Back to Environmental Signals</span>
        </button>

        <div className="inspect-breadcrumb font-mono">
          <span className="bc-dim">Environmental Signals</span>
          <span className="bc-sep">/</span>
          <span className="bc-dim">{signalData.region}</span>
          <span className="bc-sep">/</span>
          <span className="bc-active text-cyan">{signalData.title}</span>
        </div>
      </div>

      {/* 2. Hero Signal Identity & Basin Metadata */}
      <div className="inspect-hero-section">
        <div className="hero-left">
          <div className="hero-tag-row font-mono">
            <div className="rtqc-live-badge">
              <span className="live-dot" />
              <span>RTQC PASS • IN-SITU OBSERVATION</span>
            </div>
            <span className="hero-category-tag">{signalData.category}</span>
          </div>

          <h1 className="inspect-main-title">{signalData.title}</h1>

          <div className="hero-geo-meta font-mono">
            <span className="geo-item">
              <MapPin size={13} className="text-cyan" />
              <strong>{signalData.region}</strong>
            </span>
            <span className="geo-divider">•</span>
            <span className="geo-item">
              <Compass size={13} className="text-muted" />
              <span>{signalData.lat}° N, {signalData.lng}° E</span>
            </span>
            <span className="geo-divider">•</span>
            <span className="geo-item">
              <Radio size={13} className="text-emerald" />
              <span>Sensor: {signalData.floatId}</span>
            </span>
          </div>
        </div>

        <div className="hero-right">
          <div className="risk-gauge-card glass-panel font-mono">
            <span className="rg-label">COMPOSITE RISK INDEX</span>
            <div className="rg-score-wrap">
              <strong className="rg-score text-rose">{signalData.riskScore}</strong>
              <span className="rg-max">/ 100</span>
            </div>
            <span className="rg-badge-pill high">{signalData.riskLevel.toUpperCase()} INTENSITY</span>
          </div>
        </div>
      </div>

      {/* 3. Signal Summary KPI Metrics Grid */}
      <div className="signal-summary-grid font-mono">
        <div className="summary-card glass-panel">
          <div className="sc-header">
            <Thermometer size={16} className="text-rose" />
            <span className="sc-label">SEA SURFACE TEMP</span>
          </div>
          <div className="sc-val-row">
            <strong className="sc-val text-rose">{signalData.surfaceTemp} °C</strong>
            <span className="sc-anomaly text-rose">+0.8°C Anomaly</span>
          </div>
          <span className="sc-sub">Threshold for Tropical Convection: &gt;26.5°C</span>
        </div>

        <div className="summary-card glass-panel">
          <div className="sc-header">
            <Droplets size={16} className="text-cyan" />
            <span className="sc-label">SURFACE SALINITY</span>
          </div>
          <div className="sc-val-row">
            <strong className="sc-val text-cyan">{signalData.surfaceSalinity} PSU</strong>
            <span className="sc-anomaly text-cyan">-0.6 PSU Halocline</span>
          </div>
          <span className="sc-sub">River Runoff Freshwater Plume Dilution</span>
        </div>

        <div className="summary-card glass-panel">
          <div className="sc-header">
            <Layers size={16} className="text-emerald" />
            <span className="sc-label">MIXED LAYER DEPTH</span>
          </div>
          <div className="sc-val-row">
            <strong className="sc-val text-emerald">{signalData.mixedLayerDepth} m</strong>
            <span className="sc-anomaly text-emerald">Thin Barrier Layer</span>
          </div>
          <span className="sc-sub">Pycnocline restricts vertical wind mixing</span>
        </div>

        <div className="summary-card glass-panel">
          <div className="sc-header">
            <Wind size={16} className="text-amber" />
            <span className="sc-label">CYCLONE HEAT (TCHP)</span>
          </div>
          <div className="sc-val-row">
            <strong className="sc-val text-amber">{signalData.tchp} kJ/cm²</strong>
            <span className="sc-anomaly text-amber">High Energy Trap</span>
          </div>
          <span className="sc-sub">Sustained thermodynamic oceanic fuel</span>
        </div>
      </div>

      {/* 4. Large Full-Width Data Visualization Instrument */}
      <div className="inspect-visualization-card glass-panel-elevated">
        <div className="vis-card-header">
          <div className="vis-title-group">
            <div className="vis-tag font-mono">
              <Database size={14} className="text-cyan" />
              <span>VERTICAL WATER COLUMN STRATIFICATION & TELEMETRY</span>
            </div>
            <span className="vis-desc">
              Calibrated in-situ CTD profile from surface (0m) to abyssal depth (2,000m)
            </span>
          </div>

          <div className="vis-header-actions font-mono">
            {/* Parameter Switcher */}
            <div className="param-tabs-pill">
              {Object.entries(paramConfigs).map(([k, cfg]) => (
                <button
                  key={k}
                  type="button"
                  className={`param-tab ${activeParam === k ? 'active' : ''}`}
                  onClick={() => setActiveParam(k)}
                >
                  <cfg.icon size={12} />
                  <span>{cfg.label}</span>
                </button>
              ))}
            </div>

            <button type="button" className="btn-export-telemetry" onClick={handleDownloadCSV}>
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* SVG Interactive Vertical Profile Instrument */}
        <div className="vis-chart-viewport">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="vis-svg">
            <defs>
              <linearGradient id="visParamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={activeConfig.color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={activeConfig.color} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Depth Zone Bands */}
            <rect x={padLeft} y={padTop} width={innerW} height={(200 / maxDepth) * innerH} fill="rgba(56, 189, 248, 0.05)" />
            <text x={chartWidth - padRight - 8} y={padTop + 16} fill="var(--text-muted)" fontSize="9.5" fontFamily="monospace" textAnchor="end">
              Epipelagic Mixed Layer (0–200m)
            </text>

            <rect x={padLeft} y={padTop + (200 / maxDepth) * innerH} width={innerW} height={((1000 - 200) / maxDepth) * innerH} fill="rgba(99, 102, 241, 0.04)" />
            <text x={chartWidth - padRight - 8} y={padTop + (500 / maxDepth) * innerH} fill="var(--text-muted)" fontSize="9.5" fontFamily="monospace" textAnchor="end">
              Mesopelagic Thermocline / Halocline (200–1,000m)
            </text>

            {/* Depth Grid Lines */}
            {[0, 200, 500, 1000, 1500, 2000].map(d => {
              const y = padTop + (d / maxDepth) * innerH;
              return (
                <g key={d}>
                  <line x1={padLeft} y1={y} x2={chartWidth - padRight} y2={y} stroke="var(--border-light)" strokeDasharray="3 3" />
                  <text x={padLeft - 10} y={y + 4} fill="var(--text-muted)" fontSize="9.5" fontFamily="monospace" textAnchor="end">
                    {d}m
                  </text>
                </g>
              );
            })}

            {/* Parameter X-Axis Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const x = padLeft + ratio * innerW;
              const val = activeConfig.min + ratio * (activeConfig.max - activeConfig.min);
              return (
                <g key={idx}>
                  <line x1={x} y1={padTop} x2={x} y2={chartHeight - padBottom} stroke="var(--border-light)" strokeDasharray="2 4" />
                  <text x={x} y={chartHeight - padBottom + 16} fill="var(--text-muted)" fontSize="9.5" fontFamily="monospace" textAnchor="middle">
                    {val.toFixed(0)} {activeConfig.unit}
                  </text>
                </g>
              );
            })}

            {/* Curve Fill Area */}
            <path
              d={`${pathD} L ${padLeft} ${chartHeight - padBottom} L ${padLeft} ${padTop} Z`}
              fill="url(#visParamGrad)"
            />

            {/* Main Trend Line */}
            <path
              d={pathD}
              fill="none"
              stroke={activeConfig.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* CTD Data Points */}
            {chartPoints.map((pt, idx) => (
              <g 
                key={idx}
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredPoint?.depth === pt.depth ? 7 : 4.5}
                  fill={hoveredPoint?.depth === pt.depth ? '#FFFFFF' : activeConfig.color}
                  stroke="var(--bg-abyss)"
                  strokeWidth="2"
                />
              </g>
            ))}
          </svg>

          {/* Interactive Hover Tooltip Popover */}
          {hoveredPoint && (
            <div 
              className="chart-data-popover glass-panel-elevated font-mono"
              style={{
                left: `${Math.min(chartWidth - 220, Math.max(80, (hoveredPoint.x / chartWidth) * 100))}%`,
                top: `${(hoveredPoint.y / chartHeight) * 100}%`
              }}
            >
              <div className="cdp-title">Depth: {hoveredPoint.depth} meters</div>
              <div className="cdp-row">
                <span className="cdp-k">{activeConfig.label}:</span>
                <strong className="cdp-v" style={{ color: activeConfig.color }}>
                  {hoveredPoint.val} {activeConfig.unit}
                </strong>
              </div>
              <div className="cdp-sub">CTD Sensor: Sea-Bird SBE 41CP</div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Dual-Column Context Grid: WHAT CHANGED? vs WHY IT MATTERS */}
      <div className="inspect-context-grid">
        {/* Left Column: WHAT CHANGED? */}
        <div className="context-column-card glass-panel">
          <div className="card-tag-row font-mono">
            <Activity size={15} className="text-amber" />
            <span className="tag-title text-amber">WHAT CHANGED? • HISTORICAL ANOMALY TRACKER</span>
          </div>

          <p className="context-desc">
            Comparison of recent 30-day observations against the 30-year climatological baseline recorded at this location.
          </p>

          <div className="time-series-list font-mono">
            {signalData.timeSeries.map((ts, idx) => (
              <div key={idx} className="ts-row">
                <span className="ts-date">{ts.date}</span>
                <div className="ts-bar-wrap">
                  <div className="ts-bar-fill" style={{ width: `${((ts.temp - 26) / 4) * 100}%` }} />
                </div>
                <strong className="ts-val">{ts.temp} °C</strong>
                <span className="ts-anomaly text-rose">{ts.anomaly}</span>
              </div>
            ))}
          </div>

          <div className="baseline-summary-strip font-mono">
            <span className="bss-label">30-Yr Climatological Mean:</span>
            <strong className="bss-val">27.6 °C (Baseline)</strong>
            <span className="bss-delta text-rose">+0.8°C Positive Anomaly</span>
          </div>
        </div>

        {/* Right Column: WHY IT MATTERS */}
        <div className="context-column-card glass-panel">
          <div className="card-tag-row font-mono">
            <Scale size={15} className="text-cyan" />
            <span className="tag-title text-cyan">WHY IT MATTERS • OCEAN DYNAMICS & RESILIENCE</span>
          </div>

          <p className="context-prose">
            {signalData.mechanisms}
          </p>

          <div className="risk-implications-box font-mono">
            <span className="rib-header">COASTAL IMPACT PROFILE:</span>
            <ul className="rib-list">
              <li>• Rapid Storm Intensification window accelerated by 24–36 hours.</li>
              <li>• Reduced cold-water wake upwelling behind advancing low-pressure systems.</li>
              <li>• Coral reef thermal stress index elevated in coastal shallow sectors.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 6. Ground-Truth In-Situ Sensor Telemetry Card */}
      <div className="inspect-telemetry-card glass-panel font-mono">
        <div className="itc-header">
          <div className="itc-tag">
            <ShieldCheck size={16} className="text-emerald" />
            <span>GROUND-TRUTH ARGO SENSOR TELEMETRY & VERIFICATION</span>
          </div>
          <span className="itc-timestamp">Last Telemetry Transmission: {signalData.lastTransmission}</span>
        </div>

        <div className="telemetry-specs-grid">
          <div className="spec-tile">
            <span className="st-k">WMO PLATFORM ID</span>
            <strong className="st-v text-cyan">{signalData.floatId}</strong>
            <span className="st-sub">WMO #{signalData.wmoNumber}</span>
          </div>

          <div className="spec-tile">
            <span className="st-k">CALIBRATED SUITE</span>
            <strong className="st-v">Sea-Bird SBE 41CP</strong>
            <span className="st-sub">CTD Profiling Transducer</span>
          </div>

          <div className="spec-tile">
            <span className="st-k">QUALITY CONTROL</span>
            <strong className="st-v text-emerald">RTQC PASS (Flag 1)</strong>
            <span className="st-sub">INCOIS Real-Time QC</span>
          </div>

          <div className="spec-tile">
            <span className="st-k">PROFILE CYCLE</span>
            <strong className="st-v">Cycle #{signalData.cycleNumber}</strong>
            <span className="st-sub">0m to 2,000m Abyssal Cast</span>
          </div>
        </div>

        <div className="telemetry-footer-bar">
          <button type="button" className="btn-export-full font-mono" onClick={handleDownloadCSV}>
            <FileSpreadsheet size={14} />
            <span>Export Complete NetCDF-Derived Profile CSV</span>
          </button>
        </div>
      </div>

      {/* 7. AI Scientific Interpretation & Inquiry Follow-Up */}
      <div className="inspect-ai-conclusion-card glass-panel-elevated">
        <div className="ai-card-header">
          <div className="ai-tag font-mono">
            <Sparkles size={16} className="text-cyan" />
            <span>AI SCIENTIFIC INTERPRETATION & DISASTER RESILIENCE SUMMARY</span>
          </div>
        </div>

        <p className="ai-conclusion-text">
          "{signalData.conclusion}"
        </p>

        <div className="ai-action-footer">
          {onNavigateToChat && (
            <button 
              type="button"
              className="btn-ask-floatchat font-mono"
              onClick={() => onNavigateToChat(`Provide an in-depth disaster resilience and physical mechanism assessment for the ${signalData.title} in ${signalData.region}.`)}
            >
              <Sparkles size={14} />
              <span>Ask FloatChat to Deep-Dive This Signal</span>
            </button>
          )}
        </div>
      </div>

      <style>{`
        .signal-inspect-page {
          width: 100%;
          min-height: 100%;
          padding: 24px 32px 64px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          box-sizing: border-box;
          animation: fadeIn 0.2s ease-out;
        }

        /* Top Navigation Bar */
        .inspect-top-nav-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-light);
          flex-wrap: wrap;
        }

        .btn-back-signals {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
          box-shadow: var(--shadow-subtle);
        }

        .btn-back-signals:hover {
          background: var(--data-surface-hover);
          border-color: var(--cyan-primary);
          color: var(--cyan-primary);
          transform: translateX(-2px);
        }

        .inspect-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11.5px;
        }

        .bc-dim { color: var(--text-muted); }
        .bc-sep { color: var(--border-light); }
        .bc-active { font-weight: 700; }

        /* Hero Section */
        .inspect-hero-section {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
        }

        .hero-left {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
          min-width: 300px;
        }

        .hero-tag-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .rtqc-live-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 800;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.35);
          color: var(--emerald-nominal);
          padding: 3px 9px;
          border-radius: var(--radius-full);
          letter-spacing: 0.06em;
        }

        .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--emerald-nominal);
          box-shadow: 0 0 6px var(--emerald-nominal);
        }

        .hero-category-tag {
          font-size: 10px;
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          padding: 3px 9px;
          border-radius: var(--radius-full);
          color: var(--text-secondary);
        }

        .inspect-main-title {
          font-size: 24px;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.25;
          margin: 0;
        }

        .hero-geo-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: var(--text-secondary);
          flex-wrap: wrap;
        }

        .geo-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .geo-divider { color: var(--border-light); }

        /* Risk Gauge Card */
        .risk-gauge-card {
          padding: 14px 20px;
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          min-width: 160px;
          box-shadow: var(--shadow-subtle);
        }

        .rg-label {
          font-size: 9.5px;
          color: var(--text-muted);
          letter-spacing: 0.08em;
          font-weight: 700;
        }

        .rg-score-wrap {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .rg-score {
          font-size: 32px;
          font-weight: 900;
          line-height: 1;
        }

        .rg-max {
          font-size: 13px;
          color: var(--text-muted);
        }

        .rg-badge-pill {
          font-size: 9.5px;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          font-weight: 800;
        }

        .rg-badge-pill.high {
          background: rgba(244, 63, 94, 0.15);
          color: var(--red-critical);
          border: 1px solid rgba(244, 63, 94, 0.35);
        }

        /* Summary Metric Cards */
        .signal-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
        }

        .summary-card {
          padding: 16px 18px;
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          gap: 6px;
          box-shadow: var(--shadow-subtle);
        }

        .sc-header {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .sc-label {
          font-size: 10px;
          color: var(--text-muted);
          font-weight: 700;
          letter-spacing: 0.06em;
        }

        .sc-val-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
        }

        .sc-val {
          font-size: 22px;
          font-weight: 800;
        }

        .sc-anomaly {
          font-size: 11px;
          font-weight: 700;
        }

        .sc-sub {
          font-size: 10.5px;
          color: var(--text-muted);
          line-height: 1.35;
        }

        /* Large Visualization Card */
        .inspect-visualization-card {
          border-radius: var(--radius-xl);
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: var(--shadow-elevated);
        }

        .vis-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .vis-title-group {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .vis-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10.5px;
          font-weight: 800;
          color: var(--cyan-primary);
          letter-spacing: 0.08em;
        }

        .vis-desc {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .vis-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .param-tabs-pill {
          display: flex;
          align-items: center;
          gap: 3px;
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          padding: 3px;
          border-radius: var(--radius-full);
        }

        .param-tab {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border-radius: var(--radius-full);
          font-size: 11px;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .param-tab.active {
          background: var(--cyan-subtle);
          color: var(--text-primary);
          font-weight: 700;
          box-shadow: 0 0 10px var(--cyan-glow);
        }

        .btn-export-telemetry {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          font-size: 11.5px;
          color: var(--text-primary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-export-telemetry:hover {
          background: var(--data-surface-hover);
          border-color: var(--cyan-primary);
        }

        .vis-chart-viewport {
          position: relative;
          width: 100%;
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          padding: 12px;
          overflow: hidden;
        }

        .vis-svg {
          width: 100%;
          height: auto;
          display: block;
        }

        .chart-data-popover {
          position: absolute;
          transform: translate(-50%, -115%);
          padding: 8px 12px;
          border-radius: var(--radius-md);
          font-size: 11px;
          pointer-events: none;
          box-shadow: var(--shadow-hud);
          z-index: 10;
        }

        .cdp-title {
          font-weight: 800;
          color: var(--text-primary);
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 2px;
          margin-bottom: 3px;
        }

        .cdp-row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }

        .cdp-k { color: var(--text-muted); }
        .cdp-sub {
          font-size: 9px;
          color: var(--text-muted);
          margin-top: 3px;
        }

        /* Dual-Column Context Grid */
        .inspect-context-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 18px;
        }

        .context-column-card {
          padding: 20px 22px;
          border-radius: var(--radius-xl);
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: var(--shadow-subtle);
        }

        .card-tag-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .tag-title {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .context-desc {
          font-size: 12.5px;
          color: var(--text-secondary);
          line-height: 1.45;
          margin: 0;
        }

        .context-prose {
          font-size: 13px;
          color: var(--text-primary);
          line-height: 1.6;
          margin: 0;
        }

        .time-series-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 4px;
        }

        .ts-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
        }

        .ts-date {
          width: 55px;
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .ts-bar-wrap {
          flex: 1;
          height: 6px;
          background: var(--border-light);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .ts-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--cyan-primary), var(--red-critical));
          border-radius: var(--radius-full);
        }

        .ts-val {
          width: 55px;
          text-align: right;
        }

        .ts-anomaly {
          width: 55px;
          text-align: right;
          font-weight: 700;
        }

        .baseline-summary-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          font-size: 10.5px;
          flex-wrap: wrap;
          gap: 6px;
        }

        .bss-label { color: var(--text-muted); }

        .risk-implications-box {
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .rib-header {
          font-size: 9.5px;
          font-weight: 800;
          color: var(--amber-warning);
          letter-spacing: 0.06em;
        }

        .rib-list {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 11.5px;
          color: var(--text-secondary);
        }

        /* Ground-Truth Telemetry Card */
        .inspect-telemetry-card {
          border-radius: var(--radius-xl);
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: var(--shadow-subtle);
        }

        .itc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .itc-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10.5px;
          font-weight: 800;
          color: var(--emerald-nominal);
          letter-spacing: 0.08em;
        }

        .itc-timestamp {
          font-size: 11px;
          color: var(--text-muted);
        }

        .telemetry-specs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .spec-tile {
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .st-k {
          font-size: 8.5px;
          color: var(--text-muted);
          font-weight: 700;
          letter-spacing: 0.06em;
        }

        .st-v {
          font-size: 13px;
          font-weight: 700;
        }

        .st-sub {
          font-size: 10px;
          color: var(--text-muted);
        }

        .telemetry-footer-bar {
          display: flex;
          justify-content: flex-end;
        }

        .btn-export-full {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          font-size: 11.5px;
          color: var(--text-primary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-export-full:hover {
          background: var(--data-surface-hover);
          border-color: var(--cyan-primary);
        }

        /* AI Interpretation Card */
        .inspect-ai-conclusion-card {
          border-radius: var(--radius-xl);
          padding: 22px 26px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: var(--shadow-hud);
        }

        .ai-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .ai-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10.5px;
          font-weight: 800;
          color: var(--cyan-primary);
          letter-spacing: 0.08em;
        }

        .ai-conclusion-text {
          font-size: 14px;
          line-height: 1.65;
          color: var(--text-primary);
          font-weight: 500;
          margin: 0;
        }

        .ai-action-footer {
          display: flex;
          justify-content: flex-start;
          padding-top: 6px;
        }

        .btn-ask-floatchat {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 18px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, var(--cyan-primary) 0%, var(--electric-blue) 100%);
          border: 1px solid var(--cyan-primary);
          color: #FFFFFF;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
          box-shadow: 0 0 16px var(--cyan-glow);
        }

        .btn-ask-floatchat:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 24px var(--cyan-glow);
        }

        /* Error / Loading Full-Page States */
        .signal-inspect-page.error-mode,
        .signal-inspect-page.loading-mode {
          min-height: 60vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .inspect-error-card {
          max-width: 480px;
          padding: 32px 28px;
          border-radius: var(--radius-xl);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 16px;
          box-shadow: var(--shadow-hud);
        }

        .error-title {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
        }

        .error-desc {
          font-size: 12.5px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0;
        }

        .error-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 8px;
        }

        .btn-retry {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: var(--radius-md);
          background: var(--cyan-primary);
          border: 1px solid var(--cyan-primary);
          color: #FFFFFF;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
        }

        .btn-back-error {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: var(--radius-md);
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          color: var(--text-primary);
          font-size: 12px;
          cursor: pointer;
        }

        .inspect-loading-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          font-size: 12px;
          color: var(--cyan-primary);
          letter-spacing: 0.08em;
          font-weight: 700;
        }

        .text-rose { color: var(--red-critical); }
        .text-cyan { color: var(--cyan-primary); }
        .text-emerald { color: var(--emerald-nominal); }
        .text-amber { color: var(--amber-warning); }

        @media (max-width: 768px) {
          .signal-inspect-page {
            padding: 16px;
            gap: 16px;
          }

          .inspect-context-grid {
            grid-template-columns: 1fr;
          }

          .inspect-main-title {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
}
