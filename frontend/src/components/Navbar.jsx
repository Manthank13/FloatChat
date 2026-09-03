import { useState, useEffect, useRef } from 'react';
import { 
  Map, 
  BarChart3, 
  Menu, 
  X, 
  Sparkles, 
  ShieldAlert, 
  Radio, 
  ChevronRight, 
  LogOut, 
  User as UserIcon 
} from 'lucide-react';
import { checkSystemHealth } from '../api/climateApi';
import { useAuth } from '../context/useAuth';
import UserMenu from './user/UserMenu';
import ThemeToggle from './user/ThemeToggle';

export default function Navbar({ 
  activePage, 
  setActivePage, 
  onNewChat, 
  onOpenWatchlist, 
  onOpenAlertSettings 
}) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState({ isLive: false, mode: 'mock' });
  const drawerRef = useRef(null);
  const menuBtnRef = useRef(null);

  useEffect(() => {
    checkSystemHealth().then(setBackendStatus);
    const interval = setInterval(() => {
      checkSystemHealth().then(setBackendStatus);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close drawer on Escape key or outside click
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
        menuBtnRef.current?.focus();
      }
    };

    const handleClickOutside = (e) => {
      if (
        mobileMenuOpen &&
        drawerRef.current &&
        !drawerRef.current.contains(e.target) &&
        menuBtnRef.current &&
        !menuBtnRef.current.contains(e.target)
      ) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // Main navigation items
  const navItems = [
    { id: 'chat', label: 'Climate Intelligence', category: 'CLIMATE INTELLIGENCE', icon: Sparkles },
    { id: 'explore', label: 'Risk & Sensor Map', category: 'MONITOR & SENSORS', icon: Map },
    { id: 'data', label: 'Environmental Signals', category: 'MONITOR & SENSORS', icon: BarChart3 },
    { id: 'about', label: 'Disaster Resilience', category: 'RESILIENCE & MISSION', icon: ShieldAlert },
  ];

  const effectiveActiveId = activePage === 'inspect' ? 'data' : activePage;
  const activeItemObj = navItems.find(i => i.id === effectiveActiveId) || navItems[0];

  const handleNavClick = (pageId) => {
    setActivePage(pageId);
    setMobileMenuOpen(false);
  };

  const handleDrawerLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
  };

  const displayName = user?.name || 'Climate Analyst';
  const displayEmail = user?.email || 'analyst@floatchat.ai';

  return (
    <header className="navbar-container">
      <div className="navbar-content">
        {/* Left: Clean Logo & Platform Tagline */}
        <div 
          className="navbar-left" 
          onClick={() => handleNavClick('chat')} 
          role="button" 
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleNavClick('chat')}
        >
          <div className="logo-wrapper">
            <img src="/ocean-logo.svg" alt="FloatChat Logo" className="navbar-logo" />
            <span className="logo-radar-pulse"></span>
          </div>
          <div className="brand-text">
            <div className="brand-title-row">
              <span className="brand-name">Float<span className="brand-accent">Chat</span></span>
              <span className="badge badge-cyan font-mono beta-tag">CLIMATE AI</span>
            </div>
            <span className="brand-subtitle font-mono">CLIMATE INTELLIGENCE & DISASTER RESILIENCE</span>
          </div>
        </div>

        {/* Desktop Nav Rail (1100px+) */}
        <nav className="desktop-nav-rail" aria-label="Observatory Primary Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id || (activePage === 'inspect' && item.id === 'data');
            return (
              <button
                key={item.id}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={14} className="nav-icon" />
                <span>{item.label}</span>
                {isActive && <span className="active-indicator-pill" />}
              </button>
            );
          })}
        </nav>

        {/* Right: Actions & Adaptive Controls */}
        <div className="navbar-right">
          {/* Active section pill on medium screens (768px - 1100px) */}
          <div className="medium-active-section-pill font-mono">
            <span className="dot-cyan"></span>
            <span>{activeItemObj.label}</span>
          </div>

          {/* Telemetry Status Indicator (Desktop only) */}
          <div 
            className="telemetry-status desktop-status-widget font-mono" 
            title={backendStatus.isLive ? 'FastAPI Backend Online' : 'Global In-situ ARGO Array (~3,840 Active Floats)'}
          >
            <span className={`status-dot ${backendStatus.isLive ? 'live' : 'simulated'}`}></span>
            <div className="status-info">
              <span className="status-label">GLOBAL ARRAY</span>
              <span className="status-value">{backendStatus.isLive ? 'FastAPI Live' : '3,840+ Floats'}</span>
            </div>
          </div>

          {/* New Inquiry Action Button */}
          <button 
            className="btn-new-chat-nav font-mono"
            onClick={onNewChat}
            title="Start new climate inquiry"
          >
            <Sparkles size={13} />
            <span className="btn-label">New Inquiry</span>
          </button>

          {/* User Profile Popover Menu */}
          <UserMenu 
            onOpenWatchlist={onOpenWatchlist} 
            onOpenAlertSettings={onOpenAlertSettings} 
          />

          {/* Hamburger Menu Toggle Button (Visible <= 1100px) */}
          <button 
            ref={menuBtnRef}
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={20} className="text-cyan" /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Responsive Glassmorphism Navigation Drawer (<= 1100px) */}
      {mobileMenuOpen && (
        <div 
          ref={drawerRef} 
          className="responsive-nav-drawer glass-panel"
          role="dialog"
          aria-label="Mobile and Tablet Navigation Menu"
        >
          {/* User Profile Summary in Drawer */}
          <div className="drawer-user-card">
            <div className="drawer-user-avatar">
              <UserIcon size={18} className="text-cyan" />
            </div>
            <div className="drawer-user-details">
              <span className="duc-name">{displayName}</span>
              <span className="duc-email font-mono">{displayEmail}</span>
            </div>
          </div>

          {/* Section: Climate Intelligence */}
          <div className="drawer-category">
            <span className="drawer-category-label font-mono">CLIMATE INTELLIGENCE</span>
            <button
              className={`drawer-nav-item ${activePage === 'chat' ? 'active' : ''}`}
              onClick={() => handleNavClick('chat')}
            >
              <div className="drawer-item-left">
                <Sparkles size={16} className="item-icon text-cyan" />
                <div className="drawer-item-text">
                  <span className="item-title">Climate Intelligence</span>
                  <span className="item-sub">Natural-language climate risk & inquiry engine</span>
                </div>
              </div>
              <ChevronRight size={14} className="drawer-arrow" />
            </button>
          </div>

          {/* Section: Monitor & Sensors */}
          <div className="drawer-category">
            <span className="drawer-category-label font-mono">MONITOR & SENSORS</span>
            <button
              className={`drawer-nav-item ${activePage === 'explore' ? 'active' : ''}`}
              onClick={() => handleNavClick('explore')}
            >
              <div className="drawer-item-left">
                <Map size={16} className="item-icon text-sky" />
                <div className="drawer-item-text">
                  <span className="item-title">Risk & Sensor Map</span>
                  <span className="item-sub">Spatial geospatial tracking & risk sectors</span>
                </div>
              </div>
              <ChevronRight size={14} className="drawer-arrow" />
            </button>

            <button
              className={`drawer-nav-item ${activePage === 'data' ? 'active' : ''}`}
              onClick={() => handleNavClick('data')}
            >
              <div className="drawer-item-left">
                <BarChart3 size={16} className="item-icon text-emerald" />
                <div className="drawer-item-text">
                  <span className="item-title">Environmental Signals</span>
                  <span className="item-sub">CTD depth slicer & water column comparator</span>
                </div>
              </div>
              <ChevronRight size={14} className="drawer-arrow" />
            </button>
          </div>

          {/* Section: Resilience */}
          <div className="drawer-category">
            <span className="drawer-category-label font-mono">RESILIENCE & MISSION</span>
            <button
              className={`drawer-nav-item ${activePage === 'about' ? 'active' : ''}`}
              onClick={() => handleNavClick('about')}
            >
              <div className="drawer-item-left">
                <ShieldAlert size={16} className="item-icon text-cyan" />
                <div className="drawer-item-text">
                  <span className="item-title">Disaster Resilience</span>
                  <span className="item-sub">Scientific safety policies & 3-tier architecture</span>
                </div>
              </div>
              <ChevronRight size={14} className="drawer-arrow" />
            </button>
          </div>

          {/* Section: Appearance Theme */}
          <div className="drawer-category">
            <span className="drawer-category-label font-mono">APPEARANCE THEME</span>
            <ThemeToggle />
          </div>

          {/* Section: System Telemetry & Actions */}
          <div className="drawer-system-footer font-mono">
            <div className="drawer-status-box">
              <div className="dsb-left">
                <Radio size={14} className="text-cyan animate-pulse" />
                <span>OBSERVING ARRAY:</span>
              </div>
              <strong className="text-emerald">
                {backendStatus.isLive ? 'FastAPI Backend Online' : '3,842 In-situ Floats Active'}
              </strong>
            </div>

            <button 
              className="drawer-btn-new-inquiry"
              onClick={() => {
                onNewChat();
                setMobileMenuOpen(false);
              }}
            >
              <Sparkles size={14} />
              <span>Launch New Climate Inquiry</span>
            </button>

            <button 
              className="drawer-btn-logout"
              onClick={handleDrawerLogout}
            >
              <LogOut size={14} className="text-rose" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      <style>{`
        .navbar-container {
          position: sticky;
          top: 0;
          left: 0;
          right: 0;
          width: 100%;
          max-width: 100vw;
          height: 68px;
          background: var(--glass-panel-elevated);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-light);
          z-index: 1000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          box-sizing: border-box;
        }

        .navbar-content {
          max-width: 1400px;
          height: 100%;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          box-sizing: border-box;
        }

        .navbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          user-select: none;
          flex-shrink: 0;
        }

        .logo-wrapper {
          position: relative;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .navbar-logo {
          width: 30px;
          height: 30px;
          filter: drop-shadow(0 0 8px rgba(0, 229, 255, 0.5));
          position: relative;
          z-index: 2;
        }

        .logo-radar-pulse {
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          border: 1.5px solid var(--cyan-primary);
          animation: sonarPulse 3s infinite cubic-bezier(0.16, 1, 0.3, 1);
          opacity: 0.7;
        }

        .brand-text {
          display: flex;
          flex-direction: column;
        }

        .brand-title-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .brand-name {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.03em;
        }

        .brand-accent {
          color: var(--cyan-primary);
        }

        .beta-tag {
          font-size: 9px;
          padding: 1px 5px;
          letter-spacing: 0.05em;
        }

        .brand-tagline {
          font-size: 10px;
          color: var(--text-muted);
          font-weight: 500;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }

        /* Desktop Nav Rail (> 1100px) */
        .desktop-nav-rail {
          display: flex;
          align-items: center;
          gap: 3px;
          background: var(--data-surface);
          padding: 4px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-light);
          box-shadow: var(--shadow-subtle);
        }

        .nav-link {
          position: relative;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 6px 14px;
          border-radius: var(--radius-full);
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text-secondary);
          transition: all var(--transition-fast);
          cursor: pointer;
          white-space: nowrap;
        }

        .nav-link:hover {
          color: var(--text-primary);
          background: var(--data-surface-hover);
        }

        .nav-link.active {
          color: var(--text-primary);
          background: var(--cyan-subtle);
          border: 1px solid var(--data-border-active);
          box-shadow: 0 0 14px var(--cyan-glow);
        }

        .nav-icon {
          color: var(--text-muted);
          transition: color var(--transition-fast);
        }

        .nav-link.active .nav-icon {
          color: var(--cyan-primary);
        }

        /* Navbar Right Container */
        .navbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        /* Medium Screen Active Section Pill (Hidden on > 1100px) */
        .medium-active-section-pill {
          display: none;
          align-items: center;
          gap: 6px;
          background: rgba(0, 229, 255, 0.08);
          border: 1px solid rgba(0, 229, 255, 0.25);
          padding: 4px 10px;
          border-radius: var(--radius-full);
          font-size: 11px;
          color: var(--cyan-primary);
          font-weight: 600;
          white-space: nowrap;
        }

        .dot-cyan {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--cyan-primary);
          box-shadow: 0 0 6px var(--cyan-primary);
        }

        /* Telemetry Status Box */
        .telemetry-status {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          padding: 5px 10px;
          border-radius: var(--radius-md);
        }

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .status-dot.live {
          background: var(--emerald-nominal);
          box-shadow: 0 0 8px var(--emerald-nominal);
        }

        .status-dot.simulated {
          background: var(--cyan-primary);
          box-shadow: 0 0 8px var(--cyan-primary);
        }

        .status-info {
          display: flex;
          flex-direction: column;
        }

        .status-label {
          font-size: 8px;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .status-value {
          font-size: 10.5px;
          font-weight: 700;
          color: var(--text-primary);
        }

        /* New Inquiry Button */
        .btn-new-chat-nav {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: linear-gradient(135deg, rgba(0, 229, 255, 0.15) 0%, rgba(2, 132, 199, 0.25) 100%);
          border: 1px solid rgba(0, 229, 255, 0.35);
          border-radius: var(--radius-md);
          color: var(--cyan-primary);
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }

        .btn-new-chat-nav:hover {
          background: linear-gradient(135deg, rgba(0, 229, 255, 0.25) 0%, rgba(2, 132, 199, 0.4) 100%);
          border-color: var(--cyan-primary);
          box-shadow: 0 0 12px rgba(0, 229, 255, 0.3);
          transform: translateY(-1px);
        }

        /* Hamburger Button (Hidden on wide screens) */
        .mobile-menu-btn {
          display: none;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .mobile-menu-btn:hover {
          background: var(--data-surface-hover);
          border-color: var(--cyan-primary);
        }

        .mobile-menu-btn:focus-visible {
          outline: 2px solid var(--cyan-primary);
        }

        /* Responsive Navigation Drawer */
        .responsive-nav-drawer {
          position: absolute;
          top: 68px;
          left: 0;
          right: 0;
          background: var(--glass-panel-elevated);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-bottom: 1px solid var(--data-border-active);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.75), 0 0 20px rgba(0, 229, 255, 0.15);
          padding: 20px 24px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          animation: slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          max-height: calc(100vh - 72px);
          overflow-y: auto;
          box-sizing: border-box;
        }

        .drawer-user-card {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(0, 229, 255, 0.08);
          border: 1px solid rgba(0, 229, 255, 0.25);
          padding: 10px 14px;
          border-radius: var(--radius-md);
        }

        .drawer-user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(0, 229, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .drawer-user-details {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .duc-name {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .duc-email {
          font-size: 11px;
          color: var(--text-muted);
        }

        .drawer-category {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .drawer-category-label {
          font-size: 9.5px;
          color: var(--text-muted);
          letter-spacing: 0.08em;
          font-weight: 700;
          margin-bottom: 2px;
        }

        .drawer-nav-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
        }

        .drawer-nav-item:hover {
          background: var(--data-surface-hover);
          border-color: rgba(0, 229, 255, 0.35);
          color: var(--text-primary);
        }

        .drawer-nav-item.active {
          background: rgba(0, 229, 255, 0.12);
          border-color: rgba(0, 229, 255, 0.4);
          color: var(--text-primary);
        }

        .drawer-item-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .drawer-item-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .item-title {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .item-sub {
          font-size: 11px;
          color: var(--text-muted);
        }

        .drawer-arrow {
          color: var(--text-muted);
          transition: transform var(--transition-fast);
        }

        .drawer-nav-item:hover .drawer-arrow {
          color: var(--cyan-primary);
          transform: translateX(2px);
        }

        .drawer-system-footer {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-top: 12px;
          border-top: 1px solid var(--border-light);
        }

        .drawer-status-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          background: var(--data-surface);
          padding: 8px 12px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-light);
          flex-wrap: wrap;
          gap: 6px;
        }

        .dsb-left {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-muted);
        }

        .drawer-btn-new-inquiry {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, var(--cyan-primary) 0%, var(--electric-blue) 100%);
          color: var(--text-dark);
          font-size: 13px;
          font-weight: 800;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          box-shadow: 0 0 16px rgba(0, 229, 255, 0.3);
        }

        .drawer-btn-new-inquiry:hover {
          background: #FFFFFF;
          color: #020611;
          box-shadow: 0 0 24px rgba(0, 229, 255, 0.5);
        }

        .drawer-btn-logout {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          padding: 10px;
          background: rgba(244, 63, 94, 0.1);
          border: 1px solid rgba(244, 63, 94, 0.25);
          color: var(--text-primary);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
          transition: all var(--transition-fast);
        }

        .drawer-btn-logout:hover {
          background: rgba(244, 63, 94, 0.25);
          border-color: var(--red-critical);
        }

        /* ==========================================================================
           RESPONSIVE BREAKPOINTS (1100px, 900px, 768px, 480px)
           ========================================================================== */

        /* Breakpoint: <= 1100px (Medium / Half-Screen Desktop) */
        @media (max-width: 1100px) {
          .desktop-nav-rail {
            display: none !important;
          }

          .desktop-status-widget {
            display: none !important;
          }

          .user-menu-container {
            display: none !important;
          }

          .medium-active-section-pill {
            display: inline-flex;
          }

          .mobile-menu-btn {
            display: flex;
          }
        }

        /* Breakpoint: <= 768px (Tablet & Phablet) */
        @media (max-width: 768px) {
          .navbar-content {
            padding: 0 16px;
          }

          .brand-tagline {
            display: none;
          }

          .medium-active-section-pill {
            display: none;
          }

          .btn-new-chat-nav .btn-label {
            display: none;
          }

          .btn-new-chat-nav {
            padding: 8px;
            border-radius: var(--radius-md);
          }
        }

        /* Breakpoint: <= 480px (Compact Mobile) */
        @media (max-width: 480px) {
          .navbar-container {
            height: 60px;
          }

          .navbar-left {
            gap: 8px;
          }

          .logo-wrapper {
            width: 28px;
            height: 28px;
          }

          .navbar-logo {
            width: 26px;
            height: 26px;
          }

          .brand-name {
            font-size: 16px;
          }

          .beta-tag {
            display: none;
          }

          .responsive-nav-drawer {
            top: 60px;
            padding: 16px;
          }
        }

        .text-rose { color: var(--red-critical); }
        .text-emerald { color: var(--emerald-nominal); }
        .text-cyan { color: var(--cyan-primary); }
        .text-sky { color: var(--sky-core); }
      `}</style>
    </header>
  );
}
