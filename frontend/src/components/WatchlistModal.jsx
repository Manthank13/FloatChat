import { useState, useEffect } from 'react';
import { 
  Bookmark, 
  X, 
  Plus, 
  Trash2, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  MapPin
} from 'lucide-react';

const DEFAULT_REGIONS = [
  {
    id: "reg_chennai",
    name: "Chennai (South Bay of Bengal)",
    riskScore: 78,
    riskLevel: "elevated",
    trend: "up",
    sst: "28.4 °C (+0.8°C)",
    primaryHazard: "Tropical Cyclone Heat Potential (>85 kJ/cm²)",
    floatId: "ARGO-IN-2902741",
    lastObservation: "24 mins ago"
  },
  {
    id: "reg_mumbai",
    name: "Mumbai (Central Arabian Sea)",
    riskScore: 54,
    riskLevel: "moderate",
    trend: "stable",
    sst: "29.1 °C (+0.3°C)",
    primaryHazard: "Pre-Monsoon Thermal Mixing",
    floatId: "ARGO-IN-2903118",
    lastObservation: "1 hour ago"
  },
  {
    id: "reg_kolkata",
    name: "Kolkata / Sundarbans (North BoB)",
    riskScore: 82,
    riskLevel: "high",
    trend: "up",
    sst: "28.9 °C (+1.1°C)",
    primaryHazard: "Deltaic Storm Surge Coupling & Low Salinity",
    floatId: "ARGO-IN-2902890",
    lastObservation: "45 mins ago"
  },
  {
    id: "reg_andaman",
    name: "Andaman Sea (Port Blair Basin)",
    riskScore: 71,
    riskLevel: "elevated",
    trend: "up",
    sst: "29.4 °C (+1.2°C)",
    primaryHazard: "Marine Heatwave & Coral Bleaching Risk",
    floatId: "ARGO-IN-2903550",
    lastObservation: "2 hours ago"
  }
];

const AVAILABLE_EXTRA_REGIONS = [
  {
    id: "reg_lakshadweep",
    name: "Lakshadweep / Kochi Coast",
    riskScore: 48,
    riskLevel: "nominal",
    trend: "stable",
    sst: "28.2 °C (+0.1°C)",
    primaryHazard: "Baseline Upwelling Stratification",
    floatId: "ARGO-IN-2903345",
    lastObservation: "3 hours ago"
  },
  {
    id: "reg_equatorial",
    name: "Equatorial Indian Ocean",
    riskScore: 58,
    riskLevel: "moderate",
    trend: "down",
    sst: "28.6 °C (+0.4°C)",
    primaryHazard: "Indian Ocean Dipole (IOD) Oscillation",
    floatId: "ARGO-IN-2902672",
    lastObservation: "30 mins ago"
  }
];

export default function WatchlistModal({ isOpen, onClose, onSelectRegionInvestigation }) {
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem('floatchat_watchlist');
      return saved ? JSON.parse(saved) : DEFAULT_REGIONS;
    } catch {
      return DEFAULT_REGIONS;
    }
  });

  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    localStorage.setItem('floatchat_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  if (!isOpen) return null;

  const handleRemove = (e, id) => {
    e.stopPropagation();
    setWatchlist(prev => prev.filter(item => item.id !== id));
  };

  const handleAddRegion = (reg) => {
    if (!watchlist.some(w => w.id === reg.id)) {
      setWatchlist(prev => [...prev, reg]);
    }
    setIsAdding(false);
  };

  const unusedRegions = AVAILABLE_EXTRA_REGIONS.filter(
    extra => !watchlist.some(w => w.id === extra.id)
  );

  return (
    <div className="watchlist-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="watchlist-modal-card glass-panel-elevated" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="watchlist-header">
          <div className="wh-title-row">
            <div className="watchlist-badge font-mono">
              <Bookmark size={13} className="text-cyan" />
              <span>CUSTOM WATCHLIST</span>
            </div>
            <h2 className="watchlist-title">Monitored Climate Risk Sectors</h2>
            <p className="watchlist-sub">Track active regional ocean thermal energy, coastal hazards, and in-situ floats.</p>
          </div>
          <button className="btn-close-modal" onClick={onClose} aria-label="Close Watchlist">
            <X size={18} />
          </button>
        </div>

        {/* Watchlist Grid */}
        <div className="watchlist-body">
          <div className="watchlist-actions-bar font-mono">
            <span className="count-label">{watchlist.length} Monitored Coastal Regions</span>
            {unusedRegions.length > 0 && (
              <button 
                className="btn-add-region"
                onClick={() => setIsAdding(!isAdding)}
              >
                <Plus size={13} />
                <span>Add Region</span>
              </button>
            )}
          </div>

          {/* Add Region Picker Drawer */}
          {isAdding && (
            <div className="add-region-picker font-mono">
              <span className="picker-title">Available Coastal Basins:</span>
              <div className="picker-list">
                {unusedRegions.map(reg => (
                  <button 
                    key={reg.id} 
                    className="picker-item-btn"
                    onClick={() => handleAddRegion(reg)}
                  >
                    <span>{reg.name}</span>
                    <Plus size={12} className="text-cyan" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Region Cards */}
          <div className="watchlist-items-list">
            {watchlist.map((item) => (
              <div
                key={item.id}
                className="watchlist-region-card"
                onClick={() => {
                  onSelectRegionInvestigation(item.name);
                  onClose();
                }}
                role="button"
                tabIndex={0}
              >
                <div className="wrc-left">
                  <div className="wrc-header">
                    <MapPin size={13} className="text-cyan" />
                    <span className="wrc-name">{item.name}</span>
                    <span className={`wrc-risk-pill ${item.riskLevel} font-mono`}>
                      {item.riskScore} / 100 • {item.riskLevel.toUpperCase()}
                    </span>
                  </div>

                  <div className="wrc-hazard font-mono">
                    <span className="hazard-label">Primary Hazard:</span>
                    <span className="hazard-text">{item.primaryHazard}</span>
                  </div>

                  <div className="wrc-meta font-mono">
                    <span>SST: {item.sst}</span>
                    <span>•</span>
                    <span>Float: {item.floatId}</span>
                    <span>•</span>
                    <span>{item.lastObservation}</span>
                  </div>
                </div>

                <div className="wrc-right">
                  <div className="trend-indicator font-mono">
                    {item.trend === 'up' && <span className="trend-up text-rose"><TrendingUp size={14} /> Rising</span>}
                    {item.trend === 'stable' && <span className="trend-stable text-cyan"><Minus size={14} /> Stable</span>}
                    {item.trend === 'down' && <span className="trend-down text-emerald"><TrendingDown size={14} /> Lower</span>}
                  </div>

                  <div className="wrc-btn-group">
                    <button
                      className="btn-launch-investigation font-mono"
                      title="Launch Climate Intelligence Inquiry"
                    >
                      <Sparkles size={12} />
                      <span>Investigate</span>
                    </button>
                    <button
                      className="btn-delete-watchlist"
                      onClick={(e) => handleRemove(e, item.id)}
                      title="Remove from watchlist"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="watchlist-footer font-mono">
          <span>Click any monitored region to run a real-time environmental risk investigation.</span>
        </div>
      </div>

      <style>{`
        .watchlist-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(1, 4, 10, 0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.25s ease-out;
        }

        .watchlist-modal-card {
          width: 100%;
          max-width: 760px;
          max-height: 85vh;
          background: var(--glass-panel-elevated);
          border: 1px solid var(--data-border-active);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-hud), 0 20px 60px rgba(0, 0, 0, 0.7);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .watchlist-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-light);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          background: rgba(4, 13, 26, 0.5);
        }

        .wh-title-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .watchlist-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 700;
          color: var(--cyan-primary);
          letter-spacing: 0.08em;
        }

        .watchlist-title {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .watchlist-sub {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .btn-close-modal {
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
        }

        .btn-close-modal:hover {
          color: #FFFFFF;
          background: rgba(244, 63, 94, 0.2);
          border-color: var(--red-critical);
        }

        .watchlist-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .watchlist-actions-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-muted);
        }

        .btn-add-region {
          display: flex;
          align-items: center;
          gap: 5px;
          background: rgba(0, 229, 255, 0.1);
          border: 1px solid rgba(0, 229, 255, 0.3);
          color: var(--cyan-primary);
          padding: 5px 10px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-add-region:hover {
          background: rgba(0, 229, 255, 0.2);
        }

        .add-region-picker {
          background: rgba(6, 18, 35, 0.8);
          border: 1px solid var(--data-border-active);
          padding: 12px;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .picker-title {
          font-size: 10px;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .picker-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .picker-item-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(12, 34, 64, 0.6);
          border: 1px solid var(--border-light);
          padding: 5px 10px;
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          font-size: 11px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .picker-item-btn:hover {
          border-color: var(--cyan-primary);
          background: rgba(0, 229, 255, 0.15);
        }

        .watchlist-items-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .watchlist-region-card {
          background: var(--data-surface);
          border: 1px solid var(--data-border);
          border-radius: var(--radius-lg);
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .watchlist-region-card:hover {
          background: var(--data-surface-hover);
          border-color: rgba(0, 229, 255, 0.4);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        }

        .wrc-left {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-width: 0;
        }

        .wrc-header {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .wrc-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .wrc-risk-pill {
          font-size: 9.5px;
          padding: 2px 7px;
          border-radius: var(--radius-full);
          font-weight: 800;
        }

        .wrc-risk-pill.elevated {
          background: rgba(245, 158, 11, 0.15);
          color: var(--amber-warning);
          border: 1px solid rgba(245, 158, 11, 0.35);
        }

        .wrc-risk-pill.high {
          background: rgba(244, 63, 94, 0.15);
          color: var(--red-critical);
          border: 1px solid rgba(244, 63, 94, 0.35);
        }

        .wrc-risk-pill.moderate {
          background: rgba(56, 189, 248, 0.15);
          color: var(--sky-core);
          border: 1px solid rgba(56, 189, 248, 0.35);
        }

        .wrc-risk-pill.nominal {
          background: rgba(16, 185, 129, 0.15);
          color: var(--emerald-nominal);
          border: 1px solid rgba(16, 185, 129, 0.35);
        }

        .wrc-hazard {
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .hazard-label {
          color: var(--text-muted);
        }

        .hazard-text {
          color: var(--text-primary);
        }

        .wrc-meta {
          font-size: 10px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .wrc-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
          flex-shrink: 0;
        }

        .trend-indicator {
          font-size: 11px;
          font-weight: 700;
        }

        .trend-up, .trend-stable, .trend-down {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .wrc-btn-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-launch-investigation {
          display: flex;
          align-items: center;
          gap: 5px;
          background: linear-gradient(135deg, rgba(0, 229, 255, 0.15) 0%, rgba(2, 132, 199, 0.25) 100%);
          border: 1px solid rgba(0, 229, 255, 0.35);
          color: var(--cyan-primary);
          padding: 5px 9px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-launch-investigation:hover {
          background: var(--cyan-primary);
          color: var(--text-dark);
        }

        .btn-delete-watchlist {
          color: var(--text-muted);
          padding: 6px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-delete-watchlist:hover {
          color: var(--red-critical);
          background: rgba(244, 63, 94, 0.15);
        }

        .watchlist-footer {
          padding: 12px 24px;
          border-top: 1px solid var(--border-light);
          background: rgba(4, 13, 26, 0.5);
          font-size: 11px;
          color: var(--text-muted);
          text-align: center;
        }

        .text-rose { color: var(--red-critical); }
        .text-cyan { color: var(--cyan-primary); }
        .text-emerald { color: var(--emerald-nominal); }
      `}</style>
    </div>
  );
}
