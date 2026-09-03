export default function FloatChatLogo({ size = 32, showText = true, className = "" }) {
  return (
    <div className={`floatchat-brand-lockup ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      <div 
        className="floatchat-logo-icon"
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <svg viewBox="0 0 100 100" fill="none" width="100%" height="100%">
          <defs>
            <linearGradient id="fc-cyan-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f2fe" />
              <stop offset="100%" stopColor="#4facfe" />
            </linearGradient>
            <linearGradient id="fc-violet-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
            <linearGradient id="fc-hull-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00f2fe" />
              <stop offset="35%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
            <filter id="fc-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Ambient Depth Glow Background */}
          <circle cx="50" cy="50" r="46" fill="#040d21" stroke="rgba(0, 242, 254, 0.35)" strokeWidth="1.5" />

          {/* Orbital Telemetry Waves */}
          <path d="M 22 34 A 32 32 0 0 1 78 34" stroke="url(#fc-cyan-grad)" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.7" />
          <path d="M 28 26 A 40 40 0 0 1 72 26" stroke="url(#fc-violet-grad)" strokeWidth="1.5" strokeDasharray="2 4" opacity="0.5" />

          {/* Wave Surface */}
          <path d="M 12 56 Q 30 50, 50 56 T 88 56" stroke="rgba(0, 242, 254, 0.4)" strokeWidth="1.5" fill="none" />
          <path d="M 16 64 Q 35 58, 50 64 T 84 64" stroke="rgba(139, 92, 246, 0.35)" strokeWidth="1.5" fill="none" />

          {/* Argo Profiling Float Body */}
          <line x1="50" y1="14" x2="50" y2="30" stroke="#00f2fe" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="50" cy="14" r="3" fill="#00f2fe" filter="url(#fc-glow)" />

          {/* Floatation Collar */}
          <rect x="42" y="30" width="16" height="5" rx="2.5" fill="#38bdf8" />

          {/* Streamlined Hull */}
          <path d="M 44 35 L 56 35 L 54 74 Q 50 82, 46 74 Z" fill="url(#fc-hull-grad)" stroke="#38bdf8" strokeWidth="1" />

          {/* CTD Sensor Grid */}
          <line x1="45" y1="44" x2="55" y2="44" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="1" />
          <line x1="46" y1="53" x2="54" y2="53" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="1" />
          <line x1="47" y1="62" x2="53" y2="62" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="1" />

          {/* Bottom Sensor Port */}
          <circle cx="50" cy="79" r="2" fill="#00f2fe" filter="url(#fc-glow)" />
        </svg>
      </div>

      {showText && (
        <div className="floatchat-brand-text" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ 
              fontWeight: 800, 
              fontSize: '18px', 
              letterSpacing: '-0.02em', 
              background: 'linear-gradient(135deg, #ffffff 30%, #38bdf8 80%, #00f2fe 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              FLOAT<span style={{ color: '#00f2fe', WebkitTextFillColor: '#00f2fe' }}>CHAT</span>
            </span>
            <span style={{
              fontSize: '9px',
              fontFamily: 'JetBrains Mono, monospace',
              padding: '2px 5px',
              borderRadius: '4px',
              background: 'rgba(0, 242, 254, 0.12)',
              color: '#00f2fe',
              border: '1px solid rgba(0, 242, 254, 0.3)',
              fontWeight: 600,
              letterSpacing: '0.05em'
            }}>
              ARGO AI
            </span>
          </div>
          <span style={{ 
            fontSize: '10px', 
            letterSpacing: '0.04em', 
            color: 'var(--text-tertiary, #64748b)',
            fontWeight: 500
          }}>
            OCEAN INTELLIGENCE PLATFORM
          </span>
        </div>
      )}
    </div>
  );
}
