import { useState } from 'react';
import { 
  TrendingUp, 
  Thermometer, 
  Droplets, 
  Layers, 
  AlertTriangle,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

export default function WhatChangedMode({ 
  regionName = "Bay of Bengal (Off Chennai)",
  onOpenEvidence,
  onAskAboutTrend
}) {
  const [timeRange, setTimeRange] = useState('30D');
  const [activeMetric, setActiveMetric] = useState('temp');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Multi-range time series dataset
  const timeSeriesData = {
    '7D': [
      { date: 'Aug 27', temp: 28.0, salinity: 33.4, mld: 38, baselineTemp: 27.6, anomaly: '+0.4°C' },
      { date: 'Aug 28', temp: 28.1, salinity: 33.3, mld: 37, baselineTemp: 27.6, anomaly: '+0.5°C' },
      { date: 'Aug 29', temp: 28.2, salinity: 33.2, mld: 36, baselineTemp: 27.6, anomaly: '+0.6°C' },
      { date: 'Aug 30', temp: 28.3, salinity: 33.2, mld: 35, baselineTemp: 27.6, anomaly: '+0.7°C' },
      { date: 'Aug 31', temp: 28.3, salinity: 33.1, mld: 35, baselineTemp: 27.6, anomaly: '+0.7°C' },
      { date: 'Sep 01', temp: 28.4, salinity: 33.1, mld: 35, baselineTemp: 27.6, anomaly: '+0.8°C' },
      { date: 'Today',  temp: 28.4, salinity: 33.1, mld: 35, baselineTemp: 27.6, anomaly: '+0.8°C' },
    ],
    '30D': [
      { date: 'Aug 03', temp: 27.7, salinity: 33.8, mld: 42, baselineTemp: 27.6, anomaly: '+0.1°C' },
      { date: 'Aug 08', temp: 27.8, salinity: 33.7, mld: 40, baselineTemp: 27.6, anomaly: '+0.2°C' },
      { date: 'Aug 13', temp: 28.0, salinity: 33.5, mld: 39, baselineTemp: 27.6, anomaly: '+0.4°C' },
      { date: 'Aug 18', temp: 28.1, salinity: 33.4, mld: 37, baselineTemp: 27.6, anomaly: '+0.5°C' },
      { date: 'Aug 23', temp: 28.3, salinity: 33.2, mld: 36, baselineTemp: 27.6, anomaly: '+0.7°C' },
      { date: 'Aug 28', temp: 28.4, salinity: 33.1, mld: 35, baselineTemp: 27.6, anomaly: '+0.8°C' },
      { date: 'Sep 02', temp: 28.4, salinity: 33.1, mld: 35, baselineTemp: 27.6, anomaly: '+0.8°C' },
    ],
    '90D': [
      { date: 'Jun 05', temp: 27.2, salinity: 34.2, mld: 48, baselineTemp: 27.5, anomaly: '-0.3°C' },
      { date: 'Jun 25', temp: 27.4, salinity: 34.0, mld: 46, baselineTemp: 27.5, anomaly: '-0.1°C' },
      { date: 'Jul 15', temp: 27.6, salinity: 33.8, mld: 44, baselineTemp: 27.5, anomaly: '+0.1°C' },
      { date: 'Aug 05', temp: 27.9, salinity: 33.6, mld: 40, baselineTemp: 27.6, anomaly: '+0.3°C' },
      { date: 'Aug 25', temp: 28.3, salinity: 33.2, mld: 36, baselineTemp: 27.6, anomaly: '+0.7°C' },
      { date: 'Current',temp: 28.4, salinity: 33.1, mld: 35, baselineTemp: 27.6, anomaly: '+0.8°C' },
    ],
    '1Y': [
      { date: 'Sep 25', temp: 27.6, salinity: 33.5, mld: 40, baselineTemp: 27.6, anomaly: '0.0°C' },
      { date: 'Dec 25', temp: 26.2, salinity: 33.0, mld: 55, baselineTemp: 26.0, anomaly: '+0.2°C' },
      { date: 'Mar 26', temp: 27.1, salinity: 34.1, mld: 32, baselineTemp: 26.8, anomaly: '+0.3°C' },
      { date: 'Jun 26', temp: 27.9, salinity: 33.9, mld: 44, baselineTemp: 27.5, anomaly: '+0.4°C' },
      { date: 'Sep 26', temp: 28.4, salinity: 33.1, mld: 35, baselineTemp: 27.6, anomaly: '+0.8°C' },
    ]
  };

  const currentPoints = timeSeriesData[timeRange] || timeSeriesData['30D'];

  const metricConfigs = {
    temp: { label: 'Sea Surface Temp', unit: '°C', key: 'temp', color: 'var(--red-critical)', baseVal: 27.6 },
    salinity: { label: 'Surface Salinity', unit: 'PSU', key: 'salinity', color: 'var(--cyan-primary)', baseVal: 33.5 },
    mld: { label: 'Mixed Layer Depth', unit: 'm', key: 'mld', color: 'var(--emerald-nominal)', baseVal: 40 }
  };

  const config = metricConfigs[activeMetric];

  // SVG dimensions
  const chartWidth = 600;
  const chartHeight = 180;
  const padX = 40;
  const padY = 30;

  const values = currentPoints.map(p => p[config.key]);
  const minVal = Math.min(...values, config.baseVal) * 0.98;
  const maxVal = Math.max(...values, config.baseVal) * 1.02;

  const getY = (val) => chartHeight - padY - ((val - minVal) / (maxVal - minVal || 1)) * (chartHeight - padY * 2);
  const getX = (idx) => padX + (idx / (currentPoints.length - 1 || 1)) * (chartWidth - padX * 2);

  const pathD = currentPoints.reduce((acc, p, idx) => {
    const x = getX(idx);
    const y = getY(p[config.key]);
    return `${acc} ${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
  }, '');

  const baseY = getY(config.baseVal);

  return (
    <div className="what-changed-widget glass-panel">
      {/* Widget Header */}
      <div className="wc-header">
        <div className="wc-title-col">
          <div className="wc-badge font-mono">
            <TrendingUp size={13} className="text-cyan" />
            <span>"WHAT CHANGED?" HISTORICAL TREND ANALYTICS</span>
          </div>
          <h3 className="wc-region-name">{regionName}</h3>
        </div>

        {/* Time Range Selector */}
        <div className="time-range-pills font-mono">
          {['7D', '30D', '90D', '1Y'].map(range => (
            <button
              key={range}
              className={`range-pill ${timeRange === range ? 'active' : ''}`}
              onClick={() => {
                setTimeRange(range);
                setHoveredPoint(null);
              }}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Selector Bar */}
      <div className="wc-metric-tabs font-mono">
        <button
          className={`metric-tab ${activeMetric === 'temp' ? 'active' : ''}`}
          onClick={() => setActiveMetric('temp')}
        >
          <Thermometer size={13} className="text-rose" />
          <span>SST (+0.8°C)</span>
        </button>
        <button
          className={`metric-tab ${activeMetric === 'salinity' ? 'active' : ''}`}
          onClick={() => setActiveMetric('salinity')}
        >
          <Droplets size={13} className="text-cyan" />
          <span>Salinity (-0.4 PSU)</span>
        </button>
        <button
          className={`metric-tab ${activeMetric === 'mld' ? 'active' : ''}`}
          onClick={() => setActiveMetric('mld')}
        >
          <Layers size={13} className="text-emerald" />
          <span>Mixed Layer (35m)</span>
        </button>
      </div>

      {/* Interactive SVG Chart */}
      <div className="wc-chart-container">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="wc-chart-svg">
          {/* Baseline reference line */}
          <line
            x1={padX}
            y1={baseY}
            x2={chartWidth - padX}
            y2={baseY}
            stroke="var(--text-muted)"
            strokeDasharray="4 4"
            strokeWidth="1"
            opacity="0.4"
          />
          <text
            x={padX + 4}
            y={baseY - 5}
            fill="var(--text-muted)"
            fontSize="9"
            fontFamily="monospace"
          >
            30-Yr Climatological Baseline ({config.baseVal} {config.unit})
          </text>

          {/* Area fill */}
          <path
            d={`${pathD} L ${chartWidth - padX} ${chartHeight - padY} L ${padX} ${chartHeight - padY} Z`}
            fill={config.color}
            opacity="0.08"
          />

          {/* Value trend line */}
          <path
            d={pathD}
            fill="none"
            stroke={config.color}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Data Points */}
          {currentPoints.map((pt, idx) => {
            const cx = getX(idx);
            const cy = getY(pt[config.key]);
            const isHovered = hoveredPoint?.date === pt.date;

            return (
              <g key={idx} onMouseEnter={() => setHoveredPoint(pt)} onMouseLeave={() => setHoveredPoint(null)}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 4}
                  fill={isHovered ? '#FFFFFF' : config.color}
                  stroke="var(--bg-abyss)"
                  strokeWidth="2"
                  style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                />
                <text
                  x={cx}
                  y={chartHeight - 10}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="9.5"
                  fontFamily="monospace"
                >
                  {pt.date}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Point Tooltip Popover */}
        {hoveredPoint && (
          <div className="chart-hover-tooltip glass-panel-elevated font-mono">
            <span className="tooltip-date">{hoveredPoint.date}</span>
            <div className="tooltip-row">
              <span className="tk">{config.label}:</span>
              <strong className="tv" style={{ color: config.color }}>{hoveredPoint[config.key]} {config.unit}</strong>
            </div>
            <div className="tooltip-row">
              <span className="tk">Baseline:</span>
              <span>{config.baseVal} {config.unit}</span>
            </div>
            <div className="tooltip-row">
              <span className="tk">Anomaly:</span>
              <span className="text-rose">{hoveredPoint.anomaly}</span>
            </div>
          </div>
        )}
      </div>

      {/* Detected Change Synthesis Banner */}
      <div className="wc-detected-banner">
        <div className="db-left">
          <AlertTriangle size={15} className="text-amber" />
          <div className="db-text">
            <span className="db-title font-mono">DETECTED MULTI-PARAMETER SHIFT</span>
            <p className="db-body">
              Multiple environmental indicators in the {regionName} have departed from regional 30-year baselines over the last {timeRange}: <strong>+0.8°C thermal anomaly</strong> coupled with a <strong>freshwater dilution cap</strong> that restricts vertical heat dissipation.
            </p>
          </div>
        </div>

        <div className="db-actions font-mono">
          {onOpenEvidence && (
            <button 
              className="btn-db-action btn-evidence"
              onClick={() => onOpenEvidence({
                title: `"What Changed?" ${timeRange} Environmental Anomaly Evidence`,
                region: regionName,
                conclusion: `Observed +0.8°C thermal departure and 33.1 PSU barrier layer over the last ${timeRange}.`
              })}
            >
              <ShieldAlert size={12} />
              <span>Inspect Evidence</span>
            </button>
          )}

          {onAskAboutTrend && (
            <button
              className="btn-db-action btn-ask"
              onClick={() => onAskAboutTrend(`Analyze how environmental conditions have changed in the ${regionName} over the past ${timeRange}.`)}
            >
              <Sparkles size={12} />
              <span>Ask FloatChat</span>
            </button>
          )}
        </div>
      </div>

      <style>{`
        .what-changed-widget {
          background: var(--glass-panel);
          border: 1px solid var(--data-border);
          border-radius: var(--radius-xl);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 20px;
        }

        .wc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .wc-title-col {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .wc-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 700;
          color: var(--cyan-primary);
          letter-spacing: 0.08em;
        }

        .wc-region-name {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .time-range-pills {
          display: flex;
          align-items: center;
          gap: 4px;
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          padding: 3px;
          border-radius: var(--radius-full);
        }

        .range-pill {
          padding: 4px 10px;
          border-radius: var(--radius-full);
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .range-pill:hover {
          color: var(--text-primary);
        }

        .range-pill.active {
          background: var(--cyan-primary);
          color: var(--text-dark);
        }

        .wc-metric-tabs {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .metric-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          padding: 6px 12px;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .metric-tab:hover {
          background: var(--data-surface-hover);
          color: var(--text-primary);
        }

        .metric-tab.active {
          border-color: var(--cyan-primary);
          color: var(--text-primary);
          background: rgba(0, 229, 255, 0.1);
        }

        .wc-chart-container {
          position: relative;
          width: 100%;
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          padding: 10px 0;
          overflow: hidden;
        }

        .wc-chart-svg {
          width: 100%;
          height: auto;
          display: block;
        }

        .chart-hover-tooltip {
          position: absolute;
          top: 14px;
          right: 14px;
          background: var(--glass-panel-elevated);
          border: 1px solid var(--data-border-active);
          border-radius: var(--radius-md);
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
          gap: 3px;
          font-size: 11px;
          pointer-events: none;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
          animation: fadeIn 0.15s ease-out;
        }

        .tooltip-date {
          font-weight: 800;
          color: var(--text-primary);
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 2px;
          margin-bottom: 2px;
        }

        .tooltip-row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }

        .tk {
          color: var(--text-muted);
        }

        .wc-detected-banner {
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.25);
          border-radius: var(--radius-lg);
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .db-left {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          flex: 1;
          min-width: 260px;
        }

        .db-text {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .db-title {
          font-size: 10px;
          font-weight: 800;
          color: var(--amber-warning);
          letter-spacing: 0.06em;
        }

        .db-body {
          font-size: 12px;
          color: var(--text-primary);
          line-height: 1.45;
        }

        .db-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .btn-db-action {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 7px 12px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-evidence {
          background: var(--cyan-subtle);
          border: 1px solid var(--data-border-active);
          color: var(--cyan-primary);
        }

        .btn-evidence:hover {
          background: var(--cyan-primary);
          color: #FFFFFF;
        }

        .btn-ask {
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          color: var(--text-primary);
        }

        .btn-ask:hover {
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
