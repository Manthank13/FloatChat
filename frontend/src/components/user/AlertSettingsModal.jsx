import { useState } from 'react';
import { 
  X, 
  Bell, 
  MapPin, 
  ShieldAlert, 
  Check, 
  AlertCircle, 
  Navigation, 
  RotateCw,
  PowerOff
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';

export default function AlertSettingsModal({ isOpen, onClose }) {
  const { locationPreference, updateLocationPreference, requestLocationPermission } = useAuth();

  const [selectedRadius, setSelectedRadius] = useState(() => locationPreference?.alertRadiusKm || 50);
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  if (!isOpen) return null;

  const isEnabled = locationPreference?.status === 'enabled';
  const isDenied = locationPreference?.status === 'denied';

  const handleRadiusChange = async (radius) => {
    setSelectedRadius(radius);
    setIsUpdating(true);
    try {
      await updateLocationPreference({
        latitude: locationPreference?.latitude,
        longitude: locationPreference?.longitude,
        alertRadiusKm: radius,
        locationStatus: locationPreference?.status || 'enabled'
      });
      setFeedbackMessage(`Alert radius set to ${radius} km.`);
      setTimeout(() => setFeedbackMessage(''), 2500);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEnableOrRefreshLocation = async () => {
    setIsUpdating(true);
    setFeedbackMessage('');
    try {
      const res = await requestLocationPermission(selectedRadius);
      if (res.success) {
        setFeedbackMessage('Location access updated successfully ✓');
      } else {
        setFeedbackMessage(res.error || 'Location access was denied.');
      }
      setTimeout(() => setFeedbackMessage(''), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDisableLocation = async () => {
    setIsUpdating(true);
    try {
      await updateLocationPreference({
        latitude: null,
        longitude: null,
        alertRadiusKm: selectedRadius,
        locationStatus: 'disabled'
      });
      setFeedbackMessage('Location-based alerts disabled.');
      setTimeout(() => setFeedbackMessage(''), 2500);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="alert-settings-modal-overlay" role="dialog" aria-modal="true">
      <div className="alert-settings-card glass-panel-elevated">
        
        {/* Header */}
        <div className="settings-header-row">
          <div className="settings-title-group">
            <div className="settings-icon-badge">
              <Bell size={16} className="text-cyan" />
            </div>
            <div>
              <h2 className="settings-title">Alert & Proximity Settings</h2>
              <p className="settings-subtitle">Manage early-warning thresholds and regional disaster alerts.</p>
            </div>
          </div>
          <button 
            type="button" 
            className="btn-close-settings" 
            onClick={onClose}
            title="Close Alert Settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Feedback Message */}
        {feedbackMessage && (
          <div className={`settings-feedback-banner ${feedbackMessage.includes('✓') || feedbackMessage.includes('set') ? 'success' : 'warning'} font-mono`}>
            {feedbackMessage.includes('✓') || feedbackMessage.includes('set') ? <Check size={14} /> : <AlertCircle size={14} />}
            <span>{feedbackMessage}</span>
          </div>
        )}

        <div className="settings-body-scroll">
          
          {/* SECTION 1: Location Access */}
          <div className="settings-section-box">
            <div className="section-box-header">
              <div className="box-title-row">
                <MapPin size={15} className="text-cyan" />
                <span className="box-title">LOCATION ACCESS</span>
              </div>
              <div className={`status-tag font-mono ${isEnabled ? 'enabled' : isDenied ? 'denied' : 'disabled'}`}>
                <span className="status-dot">●</span>
                <span>{isEnabled ? 'Enabled' : isDenied ? 'Access Denied' : 'Disabled'}</span>
              </div>
            </div>

            <p className="section-box-desc">
              FloatChat uses your approximate location to calculate distance to detected cyclones, marine heatwaves, and storm surge events.
            </p>

            {isEnabled ? (
              <div className="loc-active-info font-mono">
                <div className="loc-active-row">
                  <Check size={13} className="text-emerald" />
                  <span>Proximity alerts active within <strong>{selectedRadius} km</strong></span>
                </div>
                <div className="loc-actions-group">
                  <button
                    type="button"
                    className="btn-settings-action refresh"
                    onClick={handleEnableOrRefreshLocation}
                    disabled={isUpdating}
                  >
                    <RotateCw size={12} className={isUpdating ? 'animate-spin' : ''} />
                    <span>Refresh Coordinates</span>
                  </button>
                  <button
                    type="button"
                    className="btn-settings-action disable"
                    onClick={handleDisableLocation}
                    disabled={isUpdating}
                  >
                    <PowerOff size={12} />
                    <span>Disable Location</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="loc-inactive-box">
                <p className="loc-inactive-guide font-mono">
                  {isDenied 
                    ? "⚠️ Location access was denied in your browser settings. To enable, allow location permission for this site in your browser bar."
                    : "Enable location to receive proximity-based disaster alerts."}
                </p>
                <button
                  type="button"
                  className="btn-enable-loc-action font-mono"
                  onClick={handleEnableOrRefreshLocation}
                  disabled={isUpdating}
                >
                  <MapPin size={13} />
                  <span>{isDenied ? 'Retry Location Request' : 'Enable Location'}</span>
                </button>
              </div>
            )}
          </div>

          {/* SECTION 2: Alert Proximity Radius */}
          <div className="settings-section-box">
            <div className="section-box-header">
              <div className="box-title-row">
                <Navigation size={15} className="text-cyan" />
                <span className="box-title">ALERT PROXIMITY RADIUS</span>
              </div>
              <span className="badge badge-cyan font-mono">{selectedRadius} km Selected</span>
            </div>

            <p className="section-box-desc">
              Trigger high-priority early warning notifications when extreme climate indicators are observed within this distance.
            </p>

            <div className="radius-picker-grid font-mono">
              {[25, 50, 100, 250].map((radius) => (
                <button
                  key={radius}
                  type="button"
                  className={`radius-option-btn ${selectedRadius === radius ? 'active' : ''}`}
                  onClick={() => handleRadiusChange(radius)}
                  disabled={isUpdating}
                >
                  <span className="radius-val">{radius} km</span>
                  <span className="radius-tag">{radius === 50 ? 'Recommended' : radius <= 25 ? 'Immediate Harbor' : radius >= 250 ? 'Regional Basin' : 'Extended Coast'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 3: Active Early Warning Channels */}
          <div className="settings-section-box">
            <div className="section-box-header">
              <div className="box-title-row">
                <ShieldAlert size={15} className="text-cyan" />
                <span className="box-title">ASSIMILATED HAZARD FEEDS</span>
              </div>
            </div>

            <div className="hazard-channels-list font-mono">
              <div className="channel-item">
                <span className="channel-bullet text-cyan">●</span>
                <span>Cyclone Heat Potential &amp; Rapid Intensification (TCHP &gt; 85 kJ/cm²)</span>
              </div>
              <div className="channel-item">
                <span className="channel-bullet text-cyan">●</span>
                <span>Marine Heatwave Thermal Ecosystem Stress (DHW &gt; 4.0)</span>
              </div>
              <div className="channel-item">
                <span className="channel-bullet text-cyan">●</span>
                <span>Lowland Estuarine Storm Surge &amp; Tidal Barrage Coupling</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="settings-footer-row">
          <button
            type="button"
            className="btn-done-settings font-mono"
            onClick={onClose}
          >
            <span>Done</span>
          </button>
        </div>

      </div>

      <style>{`
        .alert-settings-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 17, 0.85);
          backdrop-filter: blur(14px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: fadeIn 0.2s ease-out;
        }

        .alert-settings-card {
          width: 100%;
          max-width: 520px;
          max-height: 90vh;
          background: var(--glass-panel-elevated);
          border: 1px solid var(--data-border-active);
          border-radius: var(--radius-2xl);
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-elevated);
          overflow: hidden;
        }

        .settings-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-light);
        }

        .settings-title-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .settings-icon-badge {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          background: rgba(0, 229, 255, 0.1);
          border: 1px solid rgba(0, 229, 255, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .settings-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .settings-subtitle {
          font-size: 11.5px;
          color: var(--text-muted);
        }

        .btn-close-settings {
          color: var(--text-muted);
          padding: 6px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-close-settings:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.08);
        }

        .settings-feedback-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 24px;
          font-size: 11.5px;
        }

        .settings-feedback-banner.success {
          background: rgba(16, 185, 129, 0.12);
          color: var(--emerald-nominal);
          border-bottom: 1px solid rgba(16, 185, 129, 0.25);
        }

        .settings-feedback-banner.warning {
          background: rgba(245, 158, 11, 0.12);
          color: var(--amber-warning);
          border-bottom: 1px solid rgba(245, 158, 11, 0.25);
        }

        .settings-body-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .settings-section-box {
          background: var(--data-surface);
          border: 1px solid var(--data-border);
          border-radius: var(--radius-xl);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .section-box-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .box-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .box-title {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: var(--text-primary);
          font-family: var(--font-mono);
        }

        .section-box-desc {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.45;
        }

        .status-tag {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10.5px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: var(--radius-full);
        }

        .status-tag.enabled {
          background: rgba(16, 185, 129, 0.12);
          color: var(--emerald-nominal);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .status-tag.disabled {
          background: rgba(255, 255, 255, 0.06);
          color: var(--text-muted);
          border: 1px solid var(--border-light);
        }

        .status-tag.denied {
          background: rgba(245, 158, 11, 0.12);
          color: var(--amber-warning);
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .status-dot {
          font-size: 9px;
        }

        .loc-active-info {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-top: 4px;
        }

        .loc-active-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          color: var(--text-primary);
        }

        .loc-actions-group {
          display: flex;
          gap: 10px;
        }

        .btn-settings-action {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: var(--radius-md);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-settings-action.refresh {
          background: rgba(0, 229, 255, 0.1);
          border: 1px solid rgba(0, 229, 255, 0.3);
          color: var(--cyan-primary);
        }

        .btn-settings-action.refresh:hover {
          background: rgba(0, 229, 255, 0.2);
        }

        .btn-settings-action.disable {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-light);
          color: var(--text-muted);
        }

        .btn-settings-action.disable:hover {
          background: rgba(244, 63, 94, 0.15);
          color: var(--red-critical);
          border-color: rgba(244, 63, 94, 0.3);
        }

        .loc-inactive-box {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .loc-inactive-guide {
          font-size: 11px;
          color: var(--text-muted);
          line-height: 1.4;
        }

        .btn-enable-loc-action {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 9px 16px;
          background: linear-gradient(135deg, #00E5FF 0%, #0284C7 100%);
          border: none;
          border-radius: var(--radius-md);
          color: #020611;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-enable-loc-action:hover {
          box-shadow: 0 4px 16px rgba(0, 229, 255, 0.4);
        }

        .radius-picker-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .radius-option-btn {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 10px 12px;
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          cursor: pointer;
          text-align: left;
          transition: all var(--transition-fast);
        }

        .radius-option-btn:hover {
          border-color: rgba(0, 229, 255, 0.3);
          background: var(--data-surface-hover);
        }

        .radius-option-btn.active {
          background: rgba(0, 229, 255, 0.12);
          border-color: var(--cyan-primary);
          box-shadow: 0 0 12px rgba(0, 229, 255, 0.15);
        }

        .radius-val {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .radius-tag {
          font-size: 9.5px;
          color: var(--text-muted);
        }

        .hazard-channels-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .channel-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 11px;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .channel-bullet {
          font-size: 10px;
          margin-top: 1px;
        }

        .settings-footer-row {
          padding: 16px 24px;
          border-top: 1px solid var(--border-light);
          display: flex;
          justify-content: flex-end;
        }

        .btn-done-settings {
          padding: 9px 24px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-done-settings:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: var(--cyan-primary);
        }
      `}</style>
    </div>
  );
}
