import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Map, 
  BarChart3, 
  ShieldAlert, 
  Bell,
  Clock, 
  MessageSquare,
  Bookmark, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Radio
} from 'lucide-react';
import { getFleetStatus } from '../services/api';

export default function Sidebar({
  activePage = 'chat',
  setActivePage,
  conversations = [],
  onSelectConversation,
  onDeleteConversation,
  onClearAllConversations,
  activeConversationId,
  onNewChat,
  onOpenWatchlist,
  onOpenAlertSettings,
  isOpen = false,
  setIsOpen
}) {
  const [fleetStats, setFleetStats] = useState({ regionalIndianOceanCount: 6, nominalCadenceDays: 10, rtqcStatus: "RTQC PASS" });

  useEffect(() => {
    getFleetStatus().then((res) => {
      if (res.success && res.data) {
        setFleetStats(res.data);
      }
    });
  }, []);

  const handleNavClick = (pageId) => {
    if (setActivePage) {
      setActivePage(pageId);
    }
  };

  const handleHistoryClick = () => {
    if (!isOpen && setIsOpen) {
      setIsOpen(true);
    }
  };

  const handleAlertsClick = () => {
    if (onOpenAlertSettings) {
      onOpenAlertSettings();
    } else if (setActivePage) {
      setActivePage('about');
    }
  };

  return (
    <aside 
      className={`sidebar-observatory-container ${isOpen ? 'expanded' : 'collapsed'}`}
      role="navigation"
      aria-label="Observatory Navigation Rail"
      aria-expanded={isOpen}
    >
      <div className="sidebar-inner-content">
        {/* Top Header & Expand / Collapse Button */}
        <div className="sidebar-top-bar">
          {isOpen ? (
            <div className="sidebar-brand-badge font-mono">
              <span className="brand-dot animate-pulse"></span>
              <span>OBSERVATORY</span>
            </div>
          ) : (
            <div className="collapsed-indicator" />
          )}
          <button 
            type="button"
            className="sidebar-toggle-btn"
            onClick={() => setIsOpen && setIsOpen(!isOpen)}
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            {!isOpen && (
              <span className="sidebar-hover-tooltip font-mono">
                Expand sidebar
              </span>
            )}
          </button>
        </div>

        {/* Primary Navigation Rail (Simple, Universal, Obvious Icons) */}
        <nav className="sidebar-primary-nav" aria-label="Main Navigation">
          {/* 1. ✨ Climate Intelligence */}
          <button
            type="button"
            className={`sidebar-nav-btn ${activePage === 'chat' ? 'active' : ''}`}
            onClick={() => handleNavClick('chat')}
            title="Climate Intelligence"
            aria-label="Climate Intelligence"
            aria-current={activePage === 'chat' ? 'page' : undefined}
          >
            <div className="nav-btn-icon-wrap">
              <Sparkles size={17} className={activePage === 'chat' ? 'text-cyan' : ''} />
            </div>
            {isOpen && <span className="nav-btn-label">Climate Intelligence</span>}
            {!isOpen && (
              <span className="sidebar-hover-tooltip font-mono">
                Climate Intelligence
              </span>
            )}
          </button>

          {/* 2. 🗺 Risk & Sensor Map */}
          <button
            type="button"
            className={`sidebar-nav-btn ${activePage === 'explore' ? 'active' : ''}`}
            onClick={() => handleNavClick('explore')}
            title="Risk & Sensor Map"
            aria-label="Risk & Sensor Map"
            aria-current={activePage === 'explore' ? 'page' : undefined}
          >
            <div className="nav-btn-icon-wrap">
              <Map size={17} className={activePage === 'explore' ? 'text-cyan' : ''} />
            </div>
            {isOpen && <span className="nav-btn-label">Risk & Sensor Map</span>}
            {!isOpen && (
              <span className="sidebar-hover-tooltip font-mono">
                Risk & Sensor Map
              </span>
            )}
          </button>

          {/* 3. 📊 Environmental Signals */}
          <button
            type="button"
            className={`sidebar-nav-btn ${activePage === 'data' || activePage === 'inspect' ? 'active' : ''}`}
            onClick={() => handleNavClick('data')}
            title="Environmental Signals"
            aria-label="Environmental Signals"
            aria-current={activePage === 'data' || activePage === 'inspect' ? 'page' : undefined}
          >
            <div className="nav-btn-icon-wrap">
              <BarChart3 size={17} className={activePage === 'data' || activePage === 'inspect' ? 'text-cyan' : ''} />
            </div>
            {isOpen && <span className="nav-btn-label">Environmental Signals</span>}
            {!isOpen && (
              <span className="sidebar-hover-tooltip font-mono">
                Environmental Signals
              </span>
            )}
          </button>

          {/* 4. 🛡 Disaster Resilience */}
          <button
            type="button"
            className={`sidebar-nav-btn ${activePage === 'about' ? 'active' : ''}`}
            onClick={() => handleNavClick('about')}
            title="Disaster Resilience"
            aria-label="Disaster Resilience"
            aria-current={activePage === 'about' ? 'page' : undefined}
          >
            <div className="nav-btn-icon-wrap">
              <ShieldAlert size={17} className={activePage === 'about' ? 'text-cyan' : ''} />
            </div>
            {isOpen && <span className="nav-btn-label">Disaster Resilience</span>}
            {!isOpen && (
              <span className="sidebar-hover-tooltip font-mono">
                Disaster Resilience
              </span>
            )}
          </button>

          {/* 5. 🔔 Alerts */}
          <button
            type="button"
            className="sidebar-nav-btn"
            onClick={handleAlertsClick}
            title="Alerts"
            aria-label="Alerts"
          >
            <div className="nav-btn-icon-wrap">
              <Bell size={17} />
            </div>
            {isOpen && <span className="nav-btn-label">Alerts</span>}
            {!isOpen && (
              <span className="sidebar-hover-tooltip font-mono">
                Alerts
              </span>
            )}
          </button>

          {/* 6. 🕘 History */}
          <button
            type="button"
            className="sidebar-nav-btn"
            onClick={handleHistoryClick}
            title="History"
            aria-label="History"
          >
            <div className="nav-btn-icon-wrap">
              <Clock size={17} />
            </div>
            {isOpen && <span className="nav-btn-label">History</span>}
            {!isOpen && (
              <span className="sidebar-hover-tooltip font-mono">
                History
              </span>
            )}
          </button>

          {/* 7. 💬 Messages */}
          <button
            type="button"
            className="sidebar-nav-btn"
            onClick={onNewChat}
            title="Messages"
            aria-label="Messages"
          >
            <div className="nav-btn-icon-wrap">
              <MessageSquare size={17} />
            </div>
            {isOpen && <span className="nav-btn-label">Messages</span>}
            {!isOpen && (
              <span className="sidebar-hover-tooltip font-mono">
                Messages
              </span>
            )}
          </button>

          {/* 8. 🔖 Bookmarks */}
          {onOpenWatchlist && (
            <button
              type="button"
              className="sidebar-nav-btn"
              onClick={onOpenWatchlist}
              title="Bookmarks"
              aria-label="Bookmarks"
            >
              <div className="nav-btn-icon-wrap">
                <Bookmark size={17} />
              </div>
              {isOpen && <span className="nav-btn-label">Bookmarks</span>}
              {!isOpen && (
                <span className="sidebar-hover-tooltip font-mono">
                  Bookmarks
                </span>
              )}
            </button>
          )}

          {/* 9. ⚙ Settings */}
          {onOpenAlertSettings && (
            <button
              type="button"
              className="sidebar-nav-btn"
              onClick={onOpenAlertSettings}
              title="Settings"
              aria-label="Settings"
            >
              <div className="nav-btn-icon-wrap">
                <Settings size={17} />
              </div>
              {isOpen && <span className="nav-btn-label">Settings</span>}
              {!isOpen && (
                <span className="sidebar-hover-tooltip font-mono">
                  Settings
                </span>
              )}
            </button>
          )}
        </nav>

        <div className="sidebar-divider" />

        {/* Mission History / Recent Inquiries List (Visible in Expanded Mode) */}
        {isOpen && (
          <div className="sidebar-conversations-section">
            <div className="section-label-row">
              <div className="section-label-group font-mono">
                <Clock size={11} className="text-cyan" />
                <span className="section-label">RECENT INQUIRIES</span>
              </div>
              {conversations.length > 0 && onClearAllConversations && (
                <button
                  type="button"
                  className="btn-clear-logs font-mono"
                  onClick={onClearAllConversations}
                  title="Clear inquiry history"
                  aria-label="Clear inquiry history"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="conversations-scroll-list">
              {conversations.length === 0 ? (
                <div className="empty-logs-hint font-mono">
                  <span>No inquiries recorded in this session.</span>
                </div>
              ) : (
                conversations.map((conv) => {
                  const isActive = activeConversationId === conv.id;
                  return (
                    <div
                      key={conv.id}
                      className={`conversation-item ${isActive ? 'active' : ''}`}
                      onClick={() => onSelectConversation && onSelectConversation(conv)}
                      title={conv.title}
                      role="button"
                      tabIndex={0}
                      aria-label={`Open inquiry: ${conv.title}`}
                    >
                      <div className="conv-icon-wrap">
                        <MessageSquare size={13} />
                      </div>

                      <div className="conv-info">
                        <span className="conv-title">{conv.title}</span>
                        <div className="conv-meta font-mono">
                          <span className="conv-basin">{conv.basin || "Regional"}</span>
                          <span className="conv-dot">•</span>
                          <span className="conv-time">{conv.time || "Recent"}</span>
                        </div>
                      </div>

                      {onDeleteConversation && (
                        <button 
                          type="button"
                          className="btn-delete-conv"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(conv.id);
                          }}
                          title="Remove entry"
                          aria-label="Remove entry"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Bottom Observatory Telemetry Strip */}
        {isOpen && (
          <div className="sidebar-bottom-telemetry">
            <div className="telemetry-box-header">
              <Radio size={12} className="text-cyan" />
              <span className="telemetry-box-title font-mono">CLIMATE SENSING ARRAY</span>
            </div>
            <div className="telemetry-data-row font-mono">
              <div className="tele-item">
                <span className="tele-k">Active</span>
                <strong className="tele-v text-emerald">{fleetStats.regionalIndianOceanCount || 6} Sensors</strong>
              </div>
              <div className="tele-item">
                <span className="tele-k">Cadence</span>
                <strong className="tele-v">{fleetStats.nominalCadenceDays || 10} Days</strong>
              </div>
              <div className="tele-item">
                <span className="tele-k">Quality</span>
                <strong className="tele-v text-cyan">{fleetStats.rtqcStatus || "RTQC PASS"}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .sidebar-observatory-container {
          background: var(--glass-panel-elevated);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-right: 1px solid var(--border-light);
          height: 100%;
          display: flex;
          flex-direction: column;
          transition: width 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          z-index: 30;
          flex-shrink: 0;
          overflow: visible;
        }

        .sidebar-observatory-container.expanded {
          width: 240px;
        }

        .sidebar-observatory-container.collapsed {
          width: 58px;
        }

        .sidebar-inner-content {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 10px 7px;
          gap: 6px;
        }

        .sidebar-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2px 2px 6px;
          min-height: 28px;
          position: relative;
        }

        .sidebar-brand-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 9px;
          color: var(--cyan-primary);
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .brand-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--cyan-primary);
        }

        .collapsed-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--cyan-primary);
          margin-left: 6px;
          opacity: 0.6;
        }

        .sidebar-toggle-btn {
          color: var(--text-muted);
          padding: 6px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: auto;
          position: relative;
          background: transparent;
          border: 1px solid transparent;
        }

        .sidebar-toggle-btn:hover {
          color: var(--text-primary);
          background: var(--data-surface-hover);
          border-color: var(--border-light);
        }

        /* Primary Navigation Items */
        .sidebar-primary-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sidebar-nav-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          border-radius: var(--radius-md);
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
          position: relative;
          text-align: left;
          width: 100%;
          font-family: inherit;
        }

        .sidebar-observatory-container.collapsed .sidebar-nav-btn {
          justify-content: center;
          padding: 8px 0;
        }

        .sidebar-nav-btn:hover {
          background: var(--data-surface-hover);
          color: var(--text-primary);
          border-color: var(--data-border);
        }

        .sidebar-nav-btn.active {
          background: var(--cyan-subtle);
          border-color: var(--data-border-active);
          color: var(--text-primary);
          box-shadow: 0 0 12px var(--cyan-glow);
        }

        .nav-btn-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          flex-shrink: 0;
        }

        .sidebar-nav-btn.active .nav-btn-icon-wrap {
          color: var(--cyan-primary);
        }

        .nav-btn-label {
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Fast, Unobtrusive Tooltip for Collapsed State */
        .sidebar-hover-tooltip {
          position: absolute;
          left: calc(100% + 12px);
          top: 50%;
          transform: translateY(-50%);
          background: var(--bg-midnight);
          border: 1px solid var(--border-light);
          padding: 5px 10px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.12s ease-out, transform 0.12s ease-out;
          z-index: 1000;
          box-shadow: var(--shadow-hud);
        }

        .sidebar-hover-tooltip::before {
          content: '';
          position: absolute;
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          border-width: 4px;
          border-style: solid;
          border-color: transparent var(--border-light) transparent transparent;
        }

        .sidebar-observatory-container.collapsed .sidebar-nav-btn:hover .sidebar-hover-tooltip,
        .sidebar-observatory-container.collapsed .sidebar-toggle-btn:hover .sidebar-hover-tooltip {
          opacity: 1;
          visibility: visible;
        }

        .sidebar-divider {
          height: 1px;
          background: var(--border-light);
          margin: 4px 0;
        }

        /* Mission History Section */
        .sidebar-conversations-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          gap: 6px;
          min-height: 80px;
        }

        .section-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2px 4px;
        }

        .section-label-group {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .section-label {
          font-size: 9px;
          color: var(--text-muted);
          letter-spacing: 0.08em;
          font-weight: 700;
        }

        .btn-clear-logs {
          font-size: 9px;
          color: var(--text-muted);
          cursor: pointer;
          transition: color var(--transition-fast);
          padding: 1px 5px;
          border-radius: var(--radius-sm);
          background: transparent;
          border: none;
        }

        .btn-clear-logs:hover {
          color: var(--red-critical);
          background: rgba(244, 63, 94, 0.1);
        }

        .conversations-scroll-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .empty-logs-hint {
          padding: 16px 8px;
          text-align: center;
          font-size: 10.5px;
          color: var(--text-muted);
        }

        .conversation-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          border-radius: var(--radius-md);
          background: var(--data-surface);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
          position: relative;
        }

        .conversation-item:hover {
          background: var(--data-surface-hover);
          color: var(--text-primary);
          border-color: var(--data-border);
        }

        .conversation-item.active {
          background: var(--cyan-subtle);
          border-color: var(--data-border-active);
          color: var(--text-primary);
        }

        .conv-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .conversation-item.active .conv-icon-wrap {
          color: var(--cyan-primary);
        }

        .conv-info {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
          flex: 1;
        }

        .conv-title {
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .conv-meta {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 8.5px;
          color: var(--text-muted);
        }

        .conv-dot {
          opacity: 0.5;
        }

        .btn-delete-conv {
          color: var(--text-muted);
          padding: 3px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
          flex-shrink: 0;
          opacity: 0;
          background: transparent;
          border: none;
        }

        .conversation-item:hover .btn-delete-conv {
          opacity: 1;
        }

        .btn-delete-conv:hover {
          color: var(--red-critical);
          background: rgba(244, 63, 94, 0.15);
        }

        .sidebar-bottom-telemetry {
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 7px 9px;
          display: flex;
          flex-direction: column;
          gap: 5px;
          box-shadow: var(--shadow-subtle);
        }

        .telemetry-box-header {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .telemetry-box-title {
          font-size: 8px;
          font-weight: 800;
          color: var(--cyan-primary);
          letter-spacing: 0.06em;
        }

        .telemetry-data-row {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
        }

        .tele-item {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .tele-k {
          color: var(--text-muted);
          font-size: 7.5px;
        }

        .tele-v {
          font-size: 9.5px;
        }

        .text-emerald { color: var(--emerald-nominal); }
        .text-cyan { color: var(--cyan-primary); }

        @media (max-width: 768px) {
          .sidebar-observatory-container {
            display: none;
          }
        }
      `}</style>
    </aside>
  );
}
