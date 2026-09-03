import { useState } from 'react';
import { 
  MapPin, 
  ShieldAlert, 
  Check, 
  AlertCircle, 
  Navigation, 
  Lock,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';

export default function LocationPermissionModal({ isOpen, onClose, onComplete }) {
  const { requestLocationPermission, updateLocationPreference } = useAuth();
  
  const [modalState, setModalState] = useState('prompt'); // 'prompt' | 'requesting' | 'granted' | 'denied' | 'unsupported'
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleAllowLocation = async () => {
    setModalState('requesting');
    setErrorMessage('');

    try {
      const result = await requestLocationPermission(50);
      if (result.success) {
        setModalState('granted');
        setTimeout(() => {
          if (onComplete) onComplete('enabled');
          if (onClose) onClose();
        }, 1200);
      } else {
        if (result.error?.includes('not supported')) {
          setModalState('unsupported');
        } else {
          setModalState('denied');
        }
        setErrorMessage(result.error || 'Location access was denied.');
      }
    } catch (err) {
      setModalState('denied');
      setErrorMessage(err.message || 'Unable to retrieve location.');
    }
  };

  const handleDismissNotNow = async () => {
    await updateLocationPreference({
      latitude: null,
      longitude: null,
      alertRadiusKm: 50,
      locationStatus: 'dismissed'
    });
    if (onComplete) onComplete('dismissed');
    if (onClose) onClose();
  };

  const handleContinueAfterDenied = () => {
    if (onComplete) onComplete('denied');
    if (onClose) onClose();
  };

  return (
    <div className="loc-permission-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="loc-modal-title">
      <div className="loc-permission-modal-card glass-panel-elevated">
        
        {/* Radar Icon Top Center with Ripple */}
        <div className="loc-radar-icon-wrap">
          <div className={`loc-radar-circle ${modalState}`}>
            {modalState === 'granted' ? (
              <Check size={28} className="text-emerald animate-bounce" />
            ) : modalState === 'denied' || modalState === 'unsupported' ? (
              <AlertCircle size={28} className="text-amber" />
            ) : (
              <MapPin size={28} className="text-cyan loc-pin-icon" />
            )}
            <span className="loc-pulse-ring-1" />
            <span className="loc-pulse-ring-2" />
          </div>
        </div>

        {/* PROMPT STATE */}
        {modalState === 'prompt' && (
          <>
            <div className="loc-modal-header">
              <span className="loc-modal-badge font-mono">
                <ShieldAlert size={12} className="text-cyan" />
                EARLY WARNING PROXIMITY
              </span>
              <h2 id="loc-modal-title" className="loc-modal-title">
                Enable Location for Disaster Alerts
              </h2>
              <p className="loc-modal-desc">
                FloatChat uses your approximate location to identify whether you may be within the affected area of a climate or disaster event.
              </p>
            </div>

            <div className="loc-info-highlight-box">
              <div className="loc-highlight-row font-mono">
                <Navigation size={14} className="text-cyan" />
                <span>Selected Alert Radius: <strong>50 km (Default)</strong></span>
              </div>
              <p className="loc-highlight-text">
                Your location helps us provide relevant proximity alerts, such as when a detected cyclonic heat surge or marine anomaly occurs near your region.
              </p>
            </div>

            {/* Privacy Assurance */}
            <div className="loc-privacy-notice font-mono">
              <Lock size={12} className="text-muted" />
              <span>Location is strictly used for proximity distance calculation and is never shared or exposed publicly.</span>
            </div>

            {/* Action Buttons */}
            <div className="loc-modal-actions-row">
              <button
                type="button"
                className="btn-loc-not-now font-mono"
                onClick={handleDismissNotNow}
              >
                Not Now
              </button>

              <button
                type="button"
                className="btn-loc-allow font-mono"
                onClick={handleAllowLocation}
                autoFocus
              >
                <MapPin size={14} />
                <span>Allow Location</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </>
        )}

        {/* REQUESTING STATE */}
        {modalState === 'requesting' && (
          <div className="loc-state-feedback requesting">
            <div className="loc-spinner-radar" />
            <h3 className="loc-feedback-title">Requesting Browser Permission</h3>
            <p className="loc-feedback-desc">
              Please click <strong>"Allow"</strong> on your browser's location prompt to activate proximity alerts.
            </p>
          </div>
        )}

        {/* GRANTED STATE */}
        {modalState === 'granted' && (
          <div className="loc-state-feedback granted">
            <div className="loc-success-pill font-mono">
              <Check size={14} className="text-emerald" />
              <span>LOCATION ENABLED ✓</span>
            </div>
            <h3 className="loc-feedback-title">Proximity Alerts Activated</h3>
            <p className="loc-feedback-desc">
              FloatChat can now provide location-based disaster and coastal hazard alerts within your 50 km radius.
            </p>
          </div>
        )}

        {/* DENIED STATE */}
        {(modalState === 'denied' || modalState === 'unsupported') && (
          <div className="loc-state-feedback denied">
            <div className="loc-warning-pill font-mono">
              <AlertCircle size={14} className="text-amber" />
              <span>LOCATION ACCESS DENIED</span>
            </div>
            <h3 className="loc-feedback-title">Location Access Was Denied</h3>
            <p className="loc-feedback-desc">
              {errorMessage || "Location access was denied. You can enable it anytime from your browser settings or Alert Preferences."}
            </p>

            <div className="loc-denied-guide font-mono">
              <span>💡 You can still explore the full observatory without location.</span>
            </div>

            <button
              type="button"
              className="btn-loc-continue font-mono"
              onClick={handleContinueAfterDenied}
            >
              <span>Continue to Observatory</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

      </div>

      <style>{`
        .loc-permission-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 17, 0.85);
          backdrop-filter: blur(16px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: fadeIn 0.25s ease-out;
        }

        .loc-permission-modal-card {
          width: 100%;
          max-width: 480px;
          background: var(--glass-panel-elevated);
          border: 1px solid var(--data-border-active);
          box-shadow: var(--shadow-elevated), 0 0 40px rgba(0, 229, 255, 0.15);
          border-radius: var(--radius-2xl);
          padding: 32px 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .loc-radar-icon-wrap {
          margin-bottom: 20px;
          position: relative;
        }

        .loc-radar-circle {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(0, 229, 255, 0.1);
          border: 1.5px solid var(--cyan-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .loc-radar-circle.granted {
          background: rgba(16, 185, 129, 0.15);
          border-color: var(--emerald-nominal);
        }

        .loc-radar-circle.denied,
        .loc-radar-circle.unsupported {
          background: rgba(245, 158, 11, 0.15);
          border-color: var(--amber-warning);
        }

        .loc-pulse-ring-1,
        .loc-pulse-ring-2 {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 1px solid var(--cyan-primary);
          opacity: 0.6;
          animation: sonarPulse 2.5s infinite;
        }

        .loc-pulse-ring-2 {
          inset: -14px;
          animation-delay: 1.2s;
          opacity: 0.3;
        }

        .loc-modal-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .loc-modal-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--cyan-primary);
          background: rgba(0, 229, 255, 0.1);
          border: 1px solid rgba(0, 229, 255, 0.25);
          padding: 4px 10px;
          border-radius: var(--radius-full);
        }

        .loc-modal-title {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text-primary);
          line-height: 1.3;
        }

        .loc-modal-desc {
          font-size: 13.5px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .loc-info-highlight-box {
          width: 100%;
          background: var(--data-surface);
          border: 1px solid var(--data-border);
          border-radius: var(--radius-lg);
          padding: 14px 16px;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 16px;
        }

        .loc-highlight-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11.5px;
          color: var(--text-primary);
        }

        .loc-highlight-text {
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.45;
        }

        .loc-privacy-notice {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-subtle);
          padding: 8px 12px;
          border-radius: var(--radius-md);
          margin-bottom: 24px;
          text-align: left;
          line-height: 1.4;
        }

        .loc-modal-actions-row {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          width: 100%;
        }

        .btn-loc-not-now {
          padding: 11px 18px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-loc-not-now:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
        }

        .btn-loc-allow {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 20px;
          background: linear-gradient(135deg, #00E5FF 0%, #0284C7 100%);
          border: none;
          border-radius: var(--radius-md);
          color: #020611;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
          box-shadow: 0 4px 18px rgba(0, 229, 255, 0.35);
        }

        .btn-loc-allow:hover {
          box-shadow: 0 6px 24px rgba(0, 229, 255, 0.55);
          transform: translateY(-1px);
        }

        .loc-state-feedback {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
        }

        .loc-feedback-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .loc-feedback-desc {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.5;
          max-width: 380px;
        }

        .loc-success-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          color: var(--emerald-nominal);
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          padding: 4px 12px;
          border-radius: var(--radius-full);
        }

        .loc-warning-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          color: var(--amber-warning);
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          padding: 4px 12px;
          border-radius: var(--radius-full);
        }

        .loc-denied-guide {
          font-size: 11px;
          color: var(--text-muted);
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          padding: 8px 12px;
          border-radius: var(--radius-md);
          margin-top: 4px;
        }

        .btn-loc-continue {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          margin-top: 16px;
          padding: 11px 20px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-loc-continue:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: var(--cyan-primary);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }

        @media (max-width: 480px) {
          .loc-permission-modal-card {
            padding: 24px 20px;
          }
          .loc-modal-actions-row {
            flex-direction: column-reverse;
          }
          .btn-loc-not-now,
          .btn-loc-allow {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
