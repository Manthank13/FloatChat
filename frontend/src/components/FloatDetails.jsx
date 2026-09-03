import { useState } from 'react';
import { 
  X, 
  Thermometer, 
  Droplets, 
  Gauge, 
  Battery, 
  Radio, 
  Download, 
  Layers, 
  Cpu
} from 'lucide-react';
import OceanSlice from './OceanSlice';
import FloatJourney from './FloatJourney';

export default function FloatDetails({ float, onClose, onAskAboutFloat }) {
  const [activeViewTab, setActiveViewTab] = useState('slice'); // 'slice' | 'journey'

  if (!float) return null;

  const formatLat = (lat) => `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`;
  const formatLng = (lng) => `${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`;

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(float, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${float.id}_telemetry.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="float-details-drawer">
      {/* Drawer Header */}
      <div className="drawer-header">
        <div className="drawer-header-left">
          <div className="float-badge-row">
            <span className="float-id-badge font-mono">{float.id}</span>
            <span className={`status-pill ${float.status.toLowerCase().replace(/\s+/g, '-')}`}>
              <span className="status-dot"></span>
              {float.status}
            </span>
          </div>
          <h3 className="float-name">{float.name}</h3>
          <span className="float-institution">{float.institution}</span>
        </div>

        <div className="drawer-header-right">
          {/* Tab Switcher */}
          <div className="drawer-tab-pills">
            <button
              className={`drawer-tab-pill ${activeViewTab === 'slice' ? 'active' : ''}`}
              onClick={() => setActiveViewTab('slice')}
            >
              Ocean Slice
            </button>
            <button
              className={`drawer-tab-pill ${activeViewTab === 'journey' ? 'active' : ''}`}
              onClick={() => setActiveViewTab('journey')}
            >
              10-Day Float Journey
            </button>
          </div>

          <button className="btn-close-drawer" onClick={onClose} title="Close Panel">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Drawer Body Scroll */}
      <div className="drawer-body">
        {/* Core Metadata Grid */}
        <div className="scientific-meta-grid">
          <div className="meta-card">
            <span className="meta-label">WMO Number</span>
            <span className="meta-val font-mono">{float.wmoNumber}</span>
          </div>

          <div className="meta-card">
            <span className="meta-label">Geographic Coordinates</span>
            <span className="meta-val font-mono coords">
              {formatLat(float.lat)}, {formatLng(float.lng)}
            </span>
          </div>

          <div className="meta-card">
            <span className="meta-label">Cycle Number</span>
            <span className="meta-val font-mono">Cycle #{float.cycleNumber}</span>
          </div>

          <div className="meta-card">
            <span className="meta-label">Last Transmission</span>
            <span className="meta-val font-mono">{float.lastTransmission}</span>
          </div>
        </div>

        {/* Telemetry KPI Strip */}
        <div className="telemetry-strip-grid">
          <div className="kpi-box">
            <div className="kpi-header">
              <Thermometer size={14} className="text-rose" />
              <span>SST / Deep Temp</span>
            </div>
            <div className="kpi-large-val font-mono">
              {float.surfaceTemp}°C <span className="kpi-sub-val">→ {float.deepTemp}°C</span>
            </div>
          </div>

          <div className="kpi-box">
            <div className="kpi-header">
              <Droplets size={14} className="text-cyan" />
              <span>Surface / Deep Salinity</span>
            </div>
            <div className="kpi-large-val font-mono">
              {float.surfaceSalinity} <span className="kpi-sub-val">→ {float.deepSalinity} PSU</span>
            </div>
          </div>

          <div className="kpi-box">
            <div className="kpi-header">
              <Layers size={14} className="text-sky" />
              <span>Mixed Layer / Thermocline</span>
            </div>
            <div className="kpi-large-val font-mono">
              {float.mixedLayerDepth}m <span className="kpi-sub-val">| {float.thermoclineDepth}m</span>
            </div>
          </div>

          <div className="kpi-box">
            <div className="kpi-header">
              <Gauge size={14} className="text-amber" />
              <span>Max Profiling Depth</span>
            </div>
            <div className="kpi-large-val font-mono">
              {float.maxDepth} meters
            </div>
          </div>
        </div>

        {/* View Switcher: Ocean Slice OR Float Journey */}
        {activeViewTab === 'slice' && float.profile && (
          <div className="drawer-instrument-wrap">
            <OceanSlice
              profileData={float.profile}
              title={`Vertical CTD Stratification Profile (${float.wmoNumber})`}
              floatId={float.id}
            />
          </div>
        )}

        {activeViewTab === 'journey' && (
          <div className="drawer-instrument-wrap">
            <FloatJourney float={float} />
          </div>
        )}

        {/* Hardware & Sensor Payload */}
        <div className="hardware-specs-card">
          <div className="card-section-title">
            <Cpu size={14} className="text-cyan" />
            <span>Installed Sensor Payload & Comms</span>
          </div>

          <div className="sensor-tag-list">
            {float.sensors?.map((sensor, i) => (
              <span key={i} className="sensor-tag font-mono">
                {sensor}
              </span>
            ))}
          </div>

          <div className="comms-row font-mono">
            <div className="comm-item">
              <Radio size={13} className="text-muted" />
              <span className="comm-label">Telemetry:</span>
              <strong className="comm-val">{float.transmissionType}</strong>
            </div>
            <div className="comm-item">
              <Battery size={13} className="text-amber" />
              <span className="comm-label">Battery:</span>
              <strong className="comm-val text-emerald">{float.batteryPercent}%</strong>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="drawer-actions">
          {onAskAboutFloat && (
            <button 
              className="btn-ask-about font-mono"
              onClick={() => onAskAboutFloat(float)}
            >
              <span>Ask FloatChat AI About This Float</span>
            </button>
          )}

          <button 
            className="btn-export-data font-mono"
            onClick={handleExportData}
            title="Download CTD telemetry dataset in JSON format"
          >
            <Download size={14} />
            <span>Export Raw Telemetry</span>
          </button>
        </div>
      </div>

      <style>{`
        .float-details-drawer {
          background: rgba(4, 13, 26, 0.95);
          backdrop-filter: blur(24px);
          border: 1px solid var(--data-border-active);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-hud);
          display: flex;
          flex-direction: column;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
          animation: revealDepth 0.3s ease-out;
        }

        .drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 22px;
          border-bottom: 1px solid var(--border-light);
          background: rgba(8, 22, 40, 0.6);
          flex-wrap: wrap;
          gap: 12px;
        }

        .float-badge-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 4px;
        }

        .float-id-badge {
          font-size: 13px;
          font-weight: 700;
          color: var(--cyan-primary);
          background: rgba(0, 229, 255, 0.1);
          border: 1px solid rgba(0, 229, 255, 0.3);
          padding: 2px 8px;
          border-radius: var(--radius-sm);
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: var(--radius-full);
        }

        .status-pill.active {
          background: rgba(0, 229, 255, 0.15);
          color: var(--cyan-primary);
          border: 1px solid rgba(0, 229, 255, 0.3);
        }

        .status-pill.profiling {
          background: rgba(16, 185, 129, 0.15);
          color: var(--emerald-nominal);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .status-pill.surface-uplink {
          background: rgba(245, 158, 11, 0.15);
          color: var(--amber-warning);
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .float-name {
          font-size: 17px;
          color: #FFFFFF;
          margin-bottom: 2px;
        }

        .float-institution {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .drawer-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .drawer-tab-pills {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(10, 25, 47, 0.6);
          padding: 3px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-light);
        }

        .drawer-tab-pill {
          padding: 5px 12px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
        }

        .drawer-tab-pill:hover {
          color: #FFFFFF;
        }

        .drawer-tab-pill.active {
          background: rgba(0, 229, 255, 0.15);
          color: var(--cyan-primary);
          border: 1px solid rgba(0, 229, 255, 0.3);
        }

        .btn-close-drawer {
          color: var(--text-muted);
          padding: 6px;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
        }

        .btn-close-drawer:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.1);
        }

        .drawer-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .scientific-meta-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 10px;
        }

        .meta-card {
          background: rgba(8, 22, 40, 0.5);
          border: 1px solid var(--data-border);
          border-radius: var(--radius-md);
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .meta-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          font-weight: 700;
        }

        .meta-val {
          font-size: 13px;
          color: #FFFFFF;
          font-weight: 600;
        }

        .meta-val.coords {
          color: var(--cyan-primary);
        }

        .telemetry-strip-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
        }

        .kpi-box {
          background: rgba(8, 22, 40, 0.6);
          border: 1px solid var(--data-border);
          border-radius: var(--radius-md);
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .kpi-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .kpi-large-val {
          font-size: 17px;
          font-weight: 700;
          color: #FFFFFF;
        }

        .kpi-sub-val {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .hardware-specs-card {
          background: rgba(8, 22, 40, 0.5);
          border: 1px solid var(--data-border);
          border-radius: var(--radius-md);
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .card-section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 700;
          color: #FFFFFF;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .sensor-tag-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .sensor-tag {
          font-size: 11px;
          background: rgba(0, 229, 255, 0.08);
          color: var(--cyan-primary);
          border: 1px solid rgba(0, 229, 255, 0.25);
          padding: 3px 8px;
          border-radius: var(--radius-sm);
        }

        .comms-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          padding-top: 8px;
          border-top: 1px solid var(--border-light);
          font-size: 11px;
        }

        .comm-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .comm-label {
          color: var(--text-muted);
        }

        .comm-val {
          color: #FFFFFF;
        }

        .drawer-instrument-wrap {
          margin-top: 2px;
        }

        .drawer-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 8px;
          flex-wrap: wrap;
        }

        .btn-ask-about {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px 16px;
          background: linear-gradient(135deg, var(--cyan-primary) 0%, var(--deep-blue) 100%);
          border-radius: var(--radius-md);
          color: var(--text-dark);
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-ask-about:hover {
          background: #FFFFFF;
          box-shadow: 0 0 16px rgba(0, 229, 255, 0.4);
        }

        .btn-export-data {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-export-data:hover {
          background: rgba(255, 255, 255, 0.09);
        }

        .text-cyan { color: var(--cyan-primary); }
        .text-rose { color: var(--red-critical); }
        .text-sky { color: var(--sky-core); }
        .text-amber { color: var(--amber-warning); }
        .text-emerald { color: var(--emerald-nominal); }
        .text-muted { color: var(--text-muted); }
      `}</style>
    </div>
  );
}
