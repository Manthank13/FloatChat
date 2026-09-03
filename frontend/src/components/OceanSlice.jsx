import { useState, useMemo } from 'react';
import { 
  Thermometer, 
  Droplets, 
  Layers, 
  Gauge, 
  Info
} from 'lucide-react';

export default function OceanSlice({ 
  profileData = [], 
  title = "Living Ocean Column Stratification", 
  floatId = null,
  initialParam = "temp"
}) {
  const [activeParam, setActiveParam] = useState(initialParam);
  const [hoveredDepth, setHoveredDepth] = useState(null);

  const paramConfigs = {
    temp: {
      label: "Temperature",
      unit: "°C",
      color: "#F43F5E",
      glow: "rgba(244, 63, 94, 0.4)",
      min: 0,
      max: 32,
      dataKey: "temp",
      icon: Thermometer,
      desc: "In-situ seawater temperature measuring surface mixed-layer heat content and thermocline slope."
    },
    salinity: {
      label: "Salinity",
      unit: "PSU",
      color: "#00E5FF",
      glow: "rgba(0, 229, 255, 0.4)",
      min: 30,
      max: 38,
      dataKey: "salinity",
      icon: Droplets,
      desc: "Practical Salinity (PSU) measuring freshwater discharge plumes vs high-evaporation water masses."
    },
    pressure: {
      label: "Pressure",
      unit: "dbar",
      color: "#38BDF8",
      glow: "rgba(56, 189, 248, 0.4)",
      min: 0,
      max: 2000,
      dataKey: "depth", // Hydrostatic pressure ≈ depth in decibars
      icon: Gauge,
      desc: "Hydrostatic seawater pressure measured directly via strain-gauge CTD pressure transducers."
    },
    density: {
      label: "Density (σθ)",
      unit: "kg/m³",
      color: "#A855F7",
      glow: "rgba(168, 85, 247, 0.4)",
      min: 19,
      max: 29,
      dataKey: "density",
      icon: Layers,
      desc: "Potential density anomaly defining vertical buoyancy, water column stability, and stratification."
    }
  };

  const currentParam = paramConfigs[activeParam] || paramConfigs.temp;

  // Chart dimensions & scaling
  const chartWidth = 560;
  const chartHeight = 380;
  const padding = { top: 35, right: 35, bottom: 45, left: 65 };

  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const maxDepth = useMemo(() => {
    if (!profileData || profileData.length === 0) return 2000;
    const depths = profileData.map(d => d.depth);
    return Math.max(...depths, 2000);
  }, [profileData]);

  // Points for SVG path
  const points = useMemo(() => {
    if (!profileData || profileData.length === 0) return [];
    const { min, max, dataKey } = currentParam;
    return profileData
      .filter(d => d[dataKey] !== undefined)
      .map(d => {
        const val = d[dataKey];
        const clamped = Math.max(min, Math.min(max, val));
        const x = padding.left + ((clamped - min) / (max - min)) * innerWidth;
        const y = padding.top + (d.depth / maxDepth) * innerHeight;
        return {
          x,
          y,
          depth: d.depth,
          val,
          raw: d
        };
      });
  }, [profileData, currentParam, maxDepth, innerWidth, innerHeight, padding.left, padding.top]);

  const pathString = useMemo(() => {
    if (points.length === 0) return "";
    return points.reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
    }, "");
  }, [points]);

  const areaString = useMemo(() => {
    if (points.length === 0) return "";
    const first = points[0];
    const last = points[points.length - 1];
    return `${pathString} L ${padding.left} ${last.y} L ${padding.left} ${first.y} Z`;
  }, [pathString, points, padding.left]);

  const depthTicks = [0, 100, 500, 1000, 1500, 2000].filter(d => d <= maxDepth);
  if (maxDepth >= 4000) depthTicks.push(3000, 4000);

  const valTicks = useMemo(() => {
    const { min, max } = currentParam;
    const count = 5;
    const step = (max - min) / (count - 1);
    return Array.from({ length: count }, (_, i) => +(min + i * step).toFixed(1));
  }, [currentParam]);

  const activeHoverPoint = useMemo(() => {
    if (hoveredDepth === null) return null;
    return points.find(p => p.depth === hoveredDepth) || points[0];
  }, [hoveredDepth, points]);

  return (
    <div className="ocean-slice-instrument glass-panel-elevated">
      {/* Instrument Header */}
      <div className="slice-header">
        <div className="slice-title-block">
          <div className="slice-tag-row">
            <span className="instrument-badge font-mono">CTD WATER COLUMN INSTRUMENT</span>
            {floatId && <span className="float-id-tag font-mono">ARGO #{floatId}</span>}
          </div>
          <h3 className="slice-main-title font-mono">{title}</h3>
        </div>

        {/* Parameter Switcher */}
        <div className="slice-param-pills font-mono">
          {Object.entries(paramConfigs).map(([key, config]) => {
            const Icon = config.icon;
            const isActive = activeParam === key;
            return (
              <button
                key={key}
                className={`param-pill ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveParam(key);
                  setHoveredDepth(null);
                }}
                style={{ '--pill-accent': config.color }}
              >
                <Icon size={13} />
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Living Water Column */}
      <div className="slice-canvas-box">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="slice-svg">
          <defs>
            <linearGradient id={`slice-grad-${activeParam}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={currentParam.color} stopOpacity="0.32" />
              <stop offset="100%" stopColor={currentParam.color} stopOpacity="0.03" />
            </linearGradient>

            {/* Depth Stratification Layer Gradients */}
            <linearGradient id="epipelagicGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0284C7" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0.03" />
            </linearGradient>
            <linearGradient id="mesopelagicGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0.16" />
            </linearGradient>
          </defs>

          {/* Epipelagic Mixed Layer Zone (0 - 200m) */}
          <rect
            x={padding.left}
            y={padding.top}
            width={innerWidth}
            height={(200 / maxDepth) * innerHeight}
            fill="url(#epipelagicGrad)"
          />
          <text 
            x={chartWidth - padding.right - 8} 
            y={padding.top + 18} 
            fill="#38BDF8" 
            opacity="0.8" 
            fontSize="9" 
            textAnchor="end"
            fontFamily="var(--font-mono)"
          >
            Epipelagic Mixed Layer (0–200m)
          </text>

          {/* Mesopelagic Thermocline / Halocline (200 - 1000m) */}
          <rect
            x={padding.left}
            y={padding.top + (200 / maxDepth) * innerHeight}
            width={innerWidth}
            height={((1000 - 200) / maxDepth) * innerHeight}
            fill="url(#mesopelagicGrad)"
          />
          <text 
            x={chartWidth - padding.right - 8} 
            y={padding.top + (500 / maxDepth) * innerHeight} 
            fill="#818CF8" 
            opacity="0.6" 
            fontSize="9" 
            textAnchor="end"
            fontFamily="var(--font-mono)"
          >
            Mesopelagic Pycnocline (200–1000m)
          </text>

          {/* Bathypelagic Abyss (1000m+) */}
          <text 
            x={chartWidth - padding.right - 8} 
            y={padding.top + (1500 / maxDepth) * innerHeight} 
            fill="#64748B" 
            opacity="0.6" 
            fontSize="9" 
            textAnchor="end"
            fontFamily="var(--font-mono)"
          >
            Bathypelagic Deep Layer (1000m+)
          </text>

          {/* Horizontal Depth Grid Lines */}
          {depthTicks.map((d) => {
            const y = padding.top + (d / maxDepth) * innerHeight;
            return (
              <g key={`d-${d}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="rgba(56, 189, 248, 0.12)"
                  strokeDasharray={d === 0 ? "none" : "2 4"}
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  fill="#94A3B8"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="var(--font-mono)"
                >
                  {d}m
                </text>
              </g>
            );
          })}

          {/* Vertical Parameter Grid Lines */}
          {valTicks.map((v) => {
            const { min, max } = currentParam;
            const x = padding.left + ((v - min) / (max - min)) * innerWidth;
            return (
              <g key={`v-${v}`}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={chartHeight - padding.bottom}
                  stroke="rgba(255, 255, 255, 0.05)"
                />
                <text
                  x={x}
                  y={chartHeight - padding.bottom + 16}
                  fill="#94A3B8"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                >
                  {v}
                </text>
              </g>
            );
          })}

          {/* Axis Labels */}
          <text
            x={padding.left + innerWidth / 2}
            y={chartHeight - 8}
            fill="#CBD5E1"
            fontSize="11"
            fontWeight="600"
            textAnchor="middle"
            fontFamily="var(--font-mono)"
          >
            {currentParam.label} ({currentParam.unit})
          </text>

          <text
            transform="rotate(-90)"
            x={-(padding.top + innerHeight / 2)}
            y={18}
            fill="#CBD5E1"
            fontSize="11"
            fontWeight="600"
            textAnchor="middle"
            fontFamily="var(--font-mono)"
          >
            Depth (meters ↓)
          </text>

          {/* Area Fill under profile curve */}
          <path d={areaString} fill={`url(#slice-grad-${activeParam})`} />

          {/* Profile Line */}
          <path
            d={pathString}
            fill="none"
            stroke={currentParam.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`drop-shadow(0 0 6px ${currentParam.glow})`}
          />

          {/* Interactive Depth Inspection Nodes */}
          {points.map((pt, i) => (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={hoveredDepth === pt.depth ? 6.5 : 3.5}
              fill={hoveredDepth === pt.depth ? "#FFFFFF" : currentParam.color}
              stroke={currentParam.color}
              strokeWidth="2"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredDepth(pt.depth)}
            />
          ))}

          {/* Crosshairs on Active Hovered Node */}
          {activeHoverPoint && (
            <g pointerEvents="none">
              <line
                x1={padding.left}
                y1={activeHoverPoint.y}
                x2={chartWidth - padding.right}
                y2={activeHoverPoint.y}
                stroke="#FFFFFF"
                strokeOpacity="0.45"
                strokeDasharray="2 2"
              />
              <line
                x1={activeHoverPoint.x}
                y1={padding.top}
                x2={activeHoverPoint.x}
                y2={chartHeight - padding.bottom}
                stroke="#FFFFFF"
                strokeOpacity="0.45"
                strokeDasharray="2 2"
              />
            </g>
          )}
        </svg>

        {/* Floating Telemetry HUD Readout */}
        {activeHoverPoint && (
          <div 
            className="slice-telemetry-hud"
            style={{
              left: `${(activeHoverPoint.x / chartWidth) * 100}%`,
              top: `${(activeHoverPoint.y / chartHeight) * 100}%`
            }}
          >
            <div className="hud-header font-mono">
              <span>{activeHoverPoint.depth}m Depth</span>
              <span className="hud-layer-tag">
                {activeHoverPoint.depth <= 200 ? 'Epipelagic' : activeHoverPoint.depth <= 1000 ? 'Mesopelagic' : 'Bathypelagic'}
              </span>
            </div>
            <div className="hud-val font-mono" style={{ color: currentParam.color }}>
              {activeHoverPoint.val} {currentParam.unit}
            </div>
            {activeHoverPoint.raw.salinity && activeParam !== 'salinity' && (
              <div className="hud-sub font-mono">Sal: {activeHoverPoint.raw.salinity} PSU</div>
            )}
            {activeHoverPoint.raw.temp && activeParam !== 'temp' && (
              <div className="hud-sub font-mono">Temp: {activeHoverPoint.raw.temp} °C</div>
            )}
          </div>
        )}
      </div>

      {/* Sensor Interpretation Note */}
      <div className="slice-footer">
        <div className="footer-note">
          <Info size={13} className="text-cyan" />
          <span>{currentParam.desc}</span>
        </div>
        <span className="footer-rtqc font-mono">CTD In-situ Profile • 1 dbar resolution</span>
      </div>

      <style>{`
        .ocean-slice-instrument {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          width: 100%;
        }

        .slice-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .slice-title-block {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .slice-tag-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .instrument-badge {
          font-size: 10px;
          color: var(--cyan-primary);
          background: rgba(0, 229, 255, 0.1);
          border: 1px solid rgba(0, 229, 255, 0.25);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .float-id-tag {
          font-size: 11px;
          color: var(--text-muted);
        }

        .slice-main-title {
          font-size: 15px;
          font-weight: 700;
          color: #FFFFFF;
        }

        .slice-param-pills {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(10, 25, 47, 0.7);
          padding: 4px;
          border-radius: var(--radius-md);
          border: 1px solid var(--data-border);
        }

        .param-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }

        .param-pill:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.05);
        }

        .param-pill.active {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid var(--pill-accent);
          box-shadow: 0 0 10px rgba(0, 229, 255, 0.2);
        }

        .slice-canvas-box {
          position: relative;
          width: 100%;
          border-radius: var(--radius-md);
          background: rgba(3, 10, 22, 0.75);
          border: 1px solid rgba(56, 189, 248, 0.1);
          overflow: hidden;
        }

        .slice-svg {
          width: 100%;
          height: auto;
          display: block;
        }

        .slice-telemetry-hud {
          position: absolute;
          transform: translate(-50%, -125%);
          background: rgba(4, 13, 26, 0.95);
          backdrop-filter: blur(14px);
          border: 1px solid var(--cyan-primary);
          border-radius: var(--radius-md);
          padding: 8px 12px;
          box-shadow: var(--shadow-hud);
          pointer-events: none;
          z-index: 50;
          min-width: 140px;
        }

        .hud-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          font-size: 10px;
          color: #FFFFFF;
          margin-bottom: 2px;
        }

        .hud-layer-tag {
          font-size: 9px;
          color: var(--cyan-primary);
          background: rgba(0, 229, 255, 0.1);
          padding: 1px 4px;
          border-radius: 2px;
        }

        .hud-val {
          font-size: 15px;
          font-weight: 700;
        }

        .hud-sub {
          font-size: 10px;
          color: var(--text-muted);
        }

        .slice-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          padding-top: 4px;
          border-top: 1px solid var(--border-light);
        }

        .footer-note {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--text-muted);
        }

        .footer-rtqc {
          font-size: 10px;
          color: var(--text-muted);
        }

        .text-cyan { color: var(--cyan-primary); }
      `}</style>
    </div>
  );
}
