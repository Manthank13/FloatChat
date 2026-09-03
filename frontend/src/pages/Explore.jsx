import { useState, useMemo, useEffect } from 'react';
import OceanMap from '../components/OceanMap';
import FloatDetails from '../components/FloatDetails';
import { 
  Search, 
  Compass,
  Activity,
  Sparkles,
  ShieldAlert,
  Layers,
  Thermometer,
  Droplets
} from 'lucide-react';
import { getFloatLocations } from '../services/api';

export default function Explore({ onAskAboutFloat, onInspectSignal }) {
  const [fleetFloats, setFleetFloats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedFloat, setSelectedFloat] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 13.0, lng: 80.0, zoom: 5 });

  useEffect(() => {
    let isMounted = true;
    getFloatLocations().then((res) => {
      if (isMounted) {
        if (res.success && res.data) {
          setFleetFloats(res.data);
        }
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter floats
  const filteredFloats = useMemo(() => {
    return fleetFloats.filter((f) => {
      const matchesSearch = 
        f.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.wmoNumber.includes(searchTerm) ||
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.region.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRegion = selectedRegion === 'all' || f.regionCategory === selectedRegion;
      const matchesStatus = selectedStatus === 'all' || f.status.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesRegion && matchesStatus;
    });
  }, [fleetFloats, searchTerm, selectedRegion, selectedStatus]);

  const handleSelectFloatFromList = (float) => {
    setSelectedFloat(float);
    setMapCenter({ lat: float.lat, lng: float.lng, zoom: 7 });
  };

  const handleQuickRegionFocus = (lat, lng, zoom, regionCat) => {
    setMapCenter({ lat, lng, zoom });
    if (regionCat) setSelectedRegion(regionCat);
  };

  return (
    <div className="explore-page-container">
      {/* Top Controls Bar */}
      <div className="explore-toolbar">
        <div className="toolbar-left">
          <div className="explore-title-group">
            <Compass size={18} className="text-cyan" />
            <h2 className="explore-heading">Climate Risk & Environmental Sensor Map</h2>
          </div>
          <span className="badge badge-emerald font-mono">
            {filteredFloats.length} In-situ Profiling Sensors Active
          </span>
        </div>

        {/* Search & Filter Bar */}
        <div className="toolbar-filters">
          <div className="search-input-wrap">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Search Sensor ID, WMO #, or climate sector..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="explore-search-input"
            />
          </div>

          {/* Region Select */}
          <select 
            value={selectedRegion} 
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="explore-select font-mono"
          >
            <option value="all">All Climate Basins</option>
            <option value="bay_of_bengal">Bay of Bengal Sector</option>
            <option value="arabian_sea">Arabian Sea Sector</option>
            <option value="equatorial_indian_ocean">Equatorial Deep Warm Pool</option>
          </select>

          {/* Status Select */}
          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="explore-select font-mono"
          >
            <option value="all">All Telemetry Statuses</option>
            <option value="active">Active Surface</option>
            <option value="profiling">Profiling (0-2000m)</option>
            <option value="surface uplink">Surface Uplink</option>
          </select>
        </div>
      </div>

      {/* Quick Coastal Basin Focus Pills */}
      <div className="quick-focus-bar font-mono">
        <span className="qf-label">QUICK SECTOR FOCUS:</span>
        <button className="qf-pill" onClick={() => handleQuickRegionFocus(13.08, 80.27, 7, 'bay_of_bengal')}>
          <span className="text-amber">●</span> Chennai / South BoB (Elevated Heat)
        </button>
        <button className="qf-pill" onClick={() => handleQuickRegionFocus(15.30, 71.85, 7, 'arabian_sea')}>
          <span className="text-sky">●</span> Mumbai / Arabian Sea (Deep Mixing)
        </button>
        <button className="qf-pill" onClick={() => handleQuickRegionFocus(20.50, 88.20, 7, 'bay_of_bengal')}>
          <span className="text-rose">●</span> Kolkata / North BoB (Freshwater Plume)
        </button>
        <button className="qf-pill" onClick={() => handleQuickRegionFocus(11.66, 92.74, 7, 'bay_of_bengal')}>
          <span className="text-rose">●</span> Andaman Sea (Marine Heatwave)
        </button>
        <button className="qf-pill" onClick={() => handleQuickRegionFocus(0.00, 80.50, 6, 'equatorial_indian_ocean')}>
          <span className="text-emerald">●</span> Equatorial Warm Pool
        </button>
      </div>

      {/* Main Split Layout: Map on left/center, Float list on right */}
      <div className="explore-main-grid">
        {/* Left: Ocean Map Area */}
        <div className="map-viewport-wrapper">
          <OceanMap
            floats={filteredFloats}
            selectedFloatId={selectedFloat?.id}
            onSelectFloat={(float) => setSelectedFloat(float)}
            center={mapCenter}
            height="100%"
            interactive={true}
            showControls={true}
          />
        </div>

        {/* Right: Fleet Directory Sidebar */}
        <div className="fleet-directory-panel">
          <div className="directory-header">
            <div className="directory-title-row">
              <span className="directory-title font-mono">IN-SITU CLIMATE SENSING FLEET</span>
              <span className="font-mono dir-count">{filteredFloats.length} Units</span>
            </div>
            <p className="directory-subtitle">Select a sensor to inspect CTD profiles, anomalies, and drift</p>
          </div>

          <div className="directory-list">
            {isLoading ? (
              <div className="empty-directory font-mono" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '30px' }}>
                <Activity size={20} className="text-cyan animate-pulse" />
                <p>Retrieving active ARGO array...</p>
              </div>
            ) : filteredFloats.length === 0 ? (
              <div className="empty-directory font-mono">
                <p>No in-situ sensors found matching your filter criteria.</p>
              </div>
            ) : (
              filteredFloats.map((float) => {
                const isSelected = selectedFloat?.id === float.id;
                const isElevated = float.surfaceTemp > 28.0;

                return (
                  <div
                    key={float.id}
                    className={`fleet-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectFloatFromList(float)}
                  >
                    <div className="fleet-card-header">
                      <div className="fch-left">
                        <span className="float-id font-mono">{float.id}</span>
                        <span className="float-wmo font-mono">WMO #{float.wmoNumber}</span>
                      </div>
                      <span className={`status-pill font-mono ${isElevated ? 'elevated' : 'nominal'}`}>
                        {isElevated ? 'Elevated Heat' : 'Nominal'}
                      </span>
                    </div>

                    <div className="fleet-card-body">
                      <div className="region-name font-mono">{float.region}</div>
                      
                      <div className="metrics-row font-mono">
                        <div className="metric-chip">
                          <Thermometer size={12} className={isElevated ? 'text-rose' : 'text-cyan'} />
                          <span>{float.surfaceTemp} °C</span>
                        </div>
                        <div className="metric-chip">
                          <Droplets size={12} className="text-cyan" />
                          <span>{float.surfaceSalinity} PSU</span>
                        </div>
                        <div className="metric-chip">
                          <Layers size={12} className="text-emerald" />
                          <span>{float.maxDepth}m</span>
                        </div>
                      </div>

                      <div className="card-actions-bar">
                        <button
                          className="btn-card-ask font-mono"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onAskAboutFloat) onAskAboutFloat(float);
                          }}
                        >
                          <Sparkles size={12} />
                          <span>Ask FloatChat</span>
                        </button>

                        <button
                          type="button"
                          className="btn-card-evidence font-mono"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onInspectSignal) {
                              onInspectSignal({
                                title: `Float ${float.id} Observational Evidence`,
                                region: float.region,
                                float: float,
                                surfaceTemp: float.surfaceTemp,
                                surfaceSalinity: float.surfaceSalinity,
                                mixedLayerDepth: float.mixedLayerDepth || 35,
                                conclusion: `In-situ CTD cast #${float.cycleNumber || 142} recorded surface temperature of ${float.surfaceTemp}°C and salinity of ${float.surfaceSalinity} PSU.`
                              }, 'explore');
                            }
                          }}
                        >
                          <ShieldAlert size={12} />
                          <span>Inspect</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Float Details Full Modal */}
      {selectedFloat && (
        <div className="modal-overlay" onClick={() => setSelectedFloat(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <FloatDetails
              float={selectedFloat}
              onClose={() => setSelectedFloat(null)}
              onAskAboutFloat={onAskAboutFloat}
            />
          </div>
        </div>
      )}

      <style>{`
        .explore-page-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          background: transparent;
        }

        .explore-toolbar {
          padding: 14px 24px;
          background: var(--glass-panel-elevated);
          border-bottom: 1px solid var(--border-light);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          z-index: 10;
        }

        .toolbar-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .explore-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .explore-heading {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .toolbar-filters {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .search-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 10px;
          color: var(--text-muted);
          pointer-events: none;
        }

        .explore-search-input {
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 7px 12px 7px 32px;
          color: var(--text-primary);
          font-size: 12px;
          width: 220px;
          transition: all var(--transition-fast);
        }

        .explore-search-input:focus {
          outline: none;
          border-color: var(--cyan-primary);
          width: 260px;
        }

        .explore-select {
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 7px 10px;
          color: var(--text-secondary);
          font-size: 11px;
          cursor: pointer;
        }

        .explore-select:focus {
          outline: none;
          border-color: var(--cyan-primary);
        }

        .quick-focus-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 24px;
          background: rgba(4, 13, 26, 0.4);
          border-bottom: 1px solid var(--border-light);
          overflow-x: auto;
          white-space: nowrap;
          font-size: 11px;
        }

        .qf-label {
          font-size: 9.5px;
          color: var(--text-muted);
          font-weight: 700;
          letter-spacing: 0.06em;
          flex-shrink: 0;
        }

        .qf-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          padding: 4px 10px;
          border-radius: var(--radius-full);
          color: var(--text-secondary);
          font-size: 11px;
          cursor: pointer;
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }

        .qf-pill:hover {
          background: var(--data-surface-hover);
          color: var(--text-primary);
          border-color: var(--cyan-primary);
        }

        .explore-main-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          flex: 1;
          overflow: hidden;
        }

        @media (max-width: 1024px) {
          .explore-main-grid {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr 280px;
          }
        }

        .map-viewport-wrapper {
          height: 100%;
          position: relative;
        }

        .fleet-directory-panel {
          background: var(--glass-panel);
          border-left: 1px solid var(--border-light);
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }

        .directory-header {
          padding: 14px 18px;
          border-bottom: 1px solid var(--border-light);
          display: flex;
          flex-direction: column;
          gap: 2px;
          background: rgba(4, 13, 26, 0.5);
        }

        .directory-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .directory-title {
          font-size: 11px;
          font-weight: 700;
          color: var(--cyan-primary);
          letter-spacing: 0.05em;
        }

        .dir-count {
          font-size: 10.5px;
          color: var(--text-muted);
        }

        .directory-subtitle {
          font-size: 11px;
          color: var(--text-muted);
        }

        .directory-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .empty-directory {
          padding: 24px;
          text-align: center;
          color: var(--text-muted);
          font-size: 12px;
        }

        .fleet-card {
          background: var(--data-surface);
          border: 1px solid var(--data-border);
          border-radius: var(--radius-md);
          padding: 12px 14px;
          cursor: pointer;
          transition: all var(--transition-fast);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .fleet-card:hover {
          background: var(--data-surface-hover);
          border-color: rgba(0, 229, 255, 0.4);
          transform: translateY(-1px);
        }

        .fleet-card.selected {
          border-color: var(--cyan-primary);
          background: rgba(0, 229, 255, 0.1);
          box-shadow: 0 0 14px rgba(0, 229, 255, 0.2);
        }

        .fleet-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .fch-left {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .float-id {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .float-wmo {
          font-size: 10px;
          color: var(--text-muted);
        }

        .status-pill {
          font-size: 9px;
          padding: 2px 6px;
          border-radius: var(--radius-full);
          font-weight: 700;
        }

        .status-pill.elevated {
          background: rgba(245, 158, 11, 0.15);
          color: var(--amber-warning);
          border: 1px solid rgba(245, 158, 11, 0.35);
        }

        .status-pill.nominal {
          background: rgba(16, 185, 129, 0.15);
          color: var(--emerald-nominal);
          border: 1px solid rgba(16, 185, 129, 0.35);
        }

        .fleet-card-body {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .region-name {
          font-size: 11px;
          color: var(--text-secondary);
        }

        .metrics-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .metric-chip {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(4, 13, 26, 0.6);
          border: 1px solid var(--border-light);
          padding: 3px 6px;
          border-radius: var(--radius-sm);
          font-size: 10.5px;
          color: var(--text-primary);
        }

        .card-actions-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 2px;
        }

        .btn-card-ask {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(0, 229, 255, 0.12);
          border: 1px solid rgba(0, 229, 255, 0.3);
          color: var(--cyan-primary);
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          font-size: 10.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
          flex: 1;
          justify-content: center;
        }

        .btn-card-ask:hover {
          background: var(--cyan-primary);
          color: var(--text-dark);
        }

        .btn-card-evidence {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-light);
          color: var(--text-secondary);
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          font-size: 10.5px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-card-evidence:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
          border-color: var(--cyan-primary);
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(1, 4, 10, 0.75);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .modal-card {
          width: 100%;
          max-width: 800px;
          max-height: 85vh;
          background: var(--glass-panel-elevated);
          border: 1px solid var(--data-border-active);
          border-radius: var(--radius-xl);
          overflow-y: auto;
        }

        .text-rose { color: var(--red-critical); }
        .text-cyan { color: var(--cyan-primary); }
        .text-emerald { color: var(--emerald-nominal); }
        .text-amber { color: var(--amber-warning); }
        .text-sky { color: var(--sky-core); }
      `}</style>
    </div>
  );
}
