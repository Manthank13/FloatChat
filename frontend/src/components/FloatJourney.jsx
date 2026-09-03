import { useState } from 'react';
import { 
  Radio, 
  Layers, 
  Compass, 
  ArrowDown, 
  ArrowUp,
  RotateCw
} from 'lucide-react';

export default function FloatJourney({ float }) {
  const [activeStepIndex, setActiveStepIndex] = useState(3); // Default to ascent profiling step

  if (!float) return null;

  const journeySteps = [
    {
      id: "surface-launch",
      phase: "Phase 1: Surface Initialization",
      time: "Day 0 (00:00)",
      depth: 0,
      temp: float.surfaceTemp,
      salinity: float.surfaceSalinity,
      pressure: 0,
      icon: Radio,
      title: "GPS Fix & Initial Surface Transmission",
      desc: "Float is at surface, checks in with Iridium satellite, validates internal RTQC sensors, and vents buoyancy bladder."
    },
    {
      id: "descent-parking",
      phase: "Phase 2: Hydraulic Descent",
      time: "Day 0 (06:00)",
      depth: 1000,
      temp: 6.2,
      salinity: 34.8,
      pressure: 100,
      icon: ArrowDown,
      title: "Descent to Intermediate Parking Depth",
      desc: "The internal hydraulic pump pulls oil into the internal reservoir, decreasing volume to neutrally balance at 1,000 dbar."
    },
    {
      id: "neutral-drift",
      phase: "Phase 3: Subsurface Drift",
      time: "Days 1 – 9",
      depth: 1000,
      temp: 5.8,
      salinity: 34.8,
      pressure: 100,
      icon: Compass,
      title: "9-Day Subsurface Lagrangian Drift",
      desc: "Drifting passively with deep ocean currents to track intermediate water mass movement without GPS interference."
    },
    {
      id: "deep-descent",
      phase: "Phase 4: Deep Profile Dive",
      time: "Day 10 (00:00)",
      depth: float.maxDepth,
      temp: float.deepTemp,
      salinity: float.deepSalinity,
      pressure: float.maxDepth / 10,
      icon: Layers,
      title: `Deep Dive to ${float.maxDepth}m Base`,
      desc: `Float sinks from 1,000m to ${float.maxDepth}m to commence the full vertical oceanographic acquisition profile.`
    },
    {
      id: "ascent-profile",
      phase: "Phase 5: CTD Ascending Cast",
      time: "Day 10 (06:00)",
      depth: 200,
      temp: 14.2,
      salinity: 35.1,
      pressure: 20,
      icon: ArrowUp,
      title: "Continuous In-situ Data Acquisition",
      desc: "Float inflates external bladder to rise at ~10 cm/s while high-precision CTD sensors sample temperature and salinity at 1 Hz."
    },
    {
      id: "surface-uplink",
      phase: "Phase 6: Satellite Telemetry",
      time: "Day 10 (12:00)",
      depth: 0,
      temp: float.surfaceTemp,
      salinity: float.surfaceSalinity,
      pressure: 0,
      icon: RotateCw,
      title: "Cycle Complete: Satellite Telemetry Beam",
      desc: "Float reaches the surface, acquires new GPS coordinates, and transmits profile packet to GDAC via Iridium SBD."
    }
  ];

  const currentStep = journeySteps[activeStepIndex];

  return (
    <div className="float-journey-card">
      <div className="journey-header">
        <div className="journey-title-group">
          <Layers size={18} className="text-cyan" />
          <h3 className="journey-heading">10-Day Autonomous Profiling Journey</h3>
        </div>
        <span className="badge badge-cyan font-mono">
          Cycle #{float.cycleNumber} • {float.id}
        </span>
      </div>

      {/* Interactive Vertical / Horizontal Stepper */}
      <div className="journey-steps-timeline">
        {journeySteps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === activeStepIndex;
          return (
            <button
              key={step.id}
              className={`journey-step-pill ${isActive ? 'active' : ''}`}
              onClick={() => setActiveStepIndex(idx)}
            >
              <div className="step-pill-indicator">
                <Icon size={13} />
              </div>
              <div className="step-pill-info">
                <span className="step-pill-phase font-mono">{step.time}</span>
                <span className="step-pill-depth font-mono">{step.depth}m</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Phase Telemetry Focus */}
      <div className="journey-active-details">
        <div className="active-phase-left">
          <div className="phase-badge font-mono">{currentStep.phase}</div>
          <h4 className="phase-title">{currentStep.title}</h4>
          <p className="phase-desc">{currentStep.desc}</p>
        </div>

        {/* Telemetry Snapshot at this Step */}
        <div className="active-phase-telemetry font-mono">
          <div className="phase-stat-box">
            <span className="stat-name">Depth</span>
            <span className="stat-num text-cyan">{currentStep.depth} m</span>
          </div>
          <div className="phase-stat-box">
            <span className="stat-name">Temperature</span>
            <span className="stat-num text-rose">{currentStep.temp} °C</span>
          </div>
          <div className="phase-stat-box">
            <span className="stat-name">Salinity</span>
            <span className="stat-num text-cyan">{currentStep.salinity} PSU</span>
          </div>
          <div className="phase-stat-box">
            <span className="stat-name">Pressure</span>
            <span className="stat-num text-sky">{currentStep.pressure} dbar</span>
          </div>
        </div>
      </div>

      <style>{`
        .float-journey-card {
          background: rgba(8, 22, 40, 0.7);
          border: 1px solid var(--data-border);
          border-radius: var(--radius-lg);
          padding: 20px;
          backdrop-filter: blur(14px);
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
        }

        .journey-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
        }

        .journey-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .journey-heading {
          font-size: 15px;
          font-weight: 700;
          color: #FFFFFF;
        }

        .journey-steps-timeline {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 8px;
          background: rgba(4, 13, 26, 0.6);
          padding: 8px;
          border-radius: var(--radius-md);
          border: 1px solid rgba(56, 189, 248, 0.08);
        }

        .journey-step-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          background: rgba(10, 25, 47, 0.4);
          border: 1px solid transparent;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
        }

        .journey-step-pill:hover {
          background: rgba(14, 38, 68, 0.7);
          color: #FFFFFF;
        }

        .journey-step-pill.active {
          background: rgba(0, 229, 255, 0.12);
          border-color: rgba(0, 229, 255, 0.35);
          color: #FFFFFF;
          box-shadow: 0 0 10px rgba(0, 229, 255, 0.15);
        }

        .step-pill-indicator {
          color: var(--cyan-primary);
          display: flex;
          align-items: center;
        }

        .step-pill-info {
          display: flex;
          flex-direction: column;
        }

        .step-pill-phase {
          font-size: 10px;
          color: var(--text-muted);
        }

        .step-pill-depth {
          font-size: 12px;
          font-weight: 700;
          color: #FFFFFF;
        }

        .journey-active-details {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 16px;
          background: rgba(10, 25, 47, 0.5);
          border: 1px solid var(--data-border);
          border-radius: var(--radius-md);
          padding: 16px;
        }

        .active-phase-left {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .phase-badge {
          font-size: 11px;
          color: var(--cyan-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 700;
        }

        .phase-title {
          font-size: 15px;
          color: #FFFFFF;
          font-weight: 700;
        }

        .phase-desc {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.45;
        }

        .active-phase-telemetry {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .phase-stat-box {
          background: rgba(6, 18, 35, 0.7);
          border: 1px solid rgba(56, 189, 248, 0.1);
          border-radius: var(--radius-sm);
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .stat-name {
          font-size: 10px;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .stat-num {
          font-size: 15px;
          font-weight: 700;
        }

        .text-cyan { color: var(--cyan-primary); }
        .text-rose { color: var(--red-critical); }
        .text-sky { color: var(--sky-core); }

        @media (max-width: 768px) {
          .journey-active-details {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
