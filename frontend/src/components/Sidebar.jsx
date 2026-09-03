import { useState, useEffect } from 'react';
import { 
  Sparkles, 
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

  const handleHomeClick = () => {
    if (setActivePage) {
      setActivePage('chat');
    }
  };

  const handleHistoryClick = () => {
    if (!isOpen && setIsOpen) {
      setIsOpen(true);
    }
  };

  return (
    <aside 
      className={`sidebar-utility-container ${isOpen ? 'expanded' : 'collapsed'}`}
      role="navigation"
      aria-label="Secondary Utility Rail"
      aria-expanded={isOpen}
    >
      <div className="sidebar-inner-content">
        {/* Top Header & Expand / Collapse Button */}
        <div className="sidebar-top-bar">
          {isOpen ? (
            <div className="sidebar-section-badge font-mono">
              <span className="brand-dot animate-pulse"></span>
              <span>WORKSPACE</span>
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

        {/* Utility & Workspace Navigation Items */}
        <nav className="sidebar-nav-group" aria-label="Utility Navigation">
          {/* OBSERVATORY: Home / Intelligence */}
          <button
            type="button"
            className={`sidebar-nav-btn ${activePage === 'chat' ? 'active' : ''}`}
            onClick={handleHomeClick}
            title="Climate Intelligence Home"
            aria-label="Climate Intelligence Home"
            aria-current={activePage === 'chat' ? 'page' : undefined}
          >
            <div className="nav-btn-icon-wrap">
              <Sparkles size={17} className={activePage === 'chat' ? 'text-cyan' : ''} />
            </div>
            {isOpen && <span className="nav-btn-label">Home / Intelligence</span>}
            {!isOpen && (
              <span className="sidebar-hover-tooltip font-mono">
                Home / Intelligence
              </span>
            )}
          </button>

          {/* WORKSPACE: Messages / New Inquiry */}
          <button
            type="button"
            className="sidebar-nav-btn"
            onClick={onNewChat}
            title="New Climate Inquiry"
            aria-label="New Climate Inquiry"
          >
            <div className="nav-btn-icon-wrap">
              <MessageSquare size={17} />
            </div>
            {isOpen && <span className="nav-btn-label">New Inquiry</span>}
            {!isOpen && (
              <span className="sidebar-hover-tooltip font-mono">
                New Inquiry
              </span>
            )}
          </button>

          {/* WORKSPACE: History */}
          <button
            type="button"
            className="sidebar-nav-btn"
            onClick={handleHistoryClick}
            title="Mission History"
            aria-label="Mission History"
          >
            <div className="nav-btn-icon-wrap">
              <Clock size={17} />
            </div>
            {isOpen && <span className="nav-btn-label">Mission History</span>}
            {!isOpen && (
              <span className="sidebar-hover-tooltip font-mono">
                Mission History
              </span>
            )}
          </button>

          {/* WORKSPACE: Bookmarks / Watchlist */}
          {onOpenWatchlist && (
            <button
              type="button"
              className="sidebar-nav-btn"
              onClick={onOpenWatchlist}
              title="Climate Watchlist"
              aria-label="Climate Watchlist"
            >
              <div className="nav-btn-icon-wrap">
                <Bookmark size={17} />
              </div>
              {isOpen && <span className="nav-btn-label">Climate Watchlist</span>}
              {!isOpen && (
                <span className="sidebar-hover-tooltip font-mono">
                  Climate Watchlist
                </span>
              )}
            </button>
          )}

          {/* SYSTEM: Alert & Location Settings */}
          {onOpenAlertSettings && (
            <button
              type="button"
              className="sidebar-nav-btn"
              onClick={onOpenAlertSettings}
              title="Alert & Location Settings"
              aria-label="Alert & Location Settings"
            >
              <div className="nav-btn-icon-wrap">
                <Settings size={17} />
              </div>
              {isOpen && <span className="nav-btn-label">Alert Settings</span>}
              {!isOpen && (
                <span className="sidebar-hover-tooltip font-mono">
                  Alert & Location Settings
                </span>
              )}
            </button>
          )}
        </nav>

        <div className="sidebar-divider" />

        {/* Mission History List (Visible in Expanded Mode) */}
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
              <span className="telemetry-box-title font-mono">IN-SITU OBSERVING ARRAY</span>
            </div>
            <div className="telemetry-data-row font-mono">
              <div className="tele-item">
                <span className="tele-k">Regional</span>
                <strong className="tele-v text-emerald">{fleetStats.regionalIndianOceanCount || 6} Floats</strong>
              </div>
              <div className="tele-item">
                <span className="tele-k">Cadence</span>
                <strong className="tele-v">{fleetStats.nominalCadenceDays || 10}d</strong>
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
        .sidebar-utility-container {
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

        .sidebar-utility-container.expanded {
          width: 220px;
        }

        .sidebar-utility-container.collapsed {
          width: 56px;
        }

        .sidebar-inner-content {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 10px 6px;
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

        .sidebar-section-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 8.5px;
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

        /* Navigation Items */
        .sidebar-nav-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sidebar-nav-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
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

        .sidebar-utility-container.collapsed .sidebar-nav-btn {
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
          width: 22px;
          height: 22px;
          flex-shrink: 0;
        }

        .sidebar-nav-btn.active .nav-btn-icon-wrap {
          color: var(--cyan-primary);
        }

        .nav-btn-label {
          font-size: 11.5px;
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

        .sidebar-utility-container.collapsed .sidebar-nav-btn:hover .sidebar-hover-tooltip,
        .sidebar-utility-container.collapsed .sidebar-toggle-btn:hover .sidebar-hover-tooltip {
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
          font-size: 8.5px;
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
          font-size: 10px;
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
          font-size: 10.5px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .conv-meta {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 8px;
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
          padding: 7px 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          box-shadow: var(--shadow-subtle);
        }

        .telemetry-box-header {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .telemetry-box-title {
          font-size: 7.5px;
          font-weight: 800;
          color: var(--cyan-primary);
          letter-spacing: 0.06em;
        }

        .telemetry-data-row {
          display: flex;
          justify-content: space-between;
          font-size: 8.5px;
        }

        .tele-item {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .tele-k {
          color: var(--text-muted);
          font-size: 7px;
        }

        .tele-v {
          font-size: 9px;
        }

        .text-emerald { color: var(--emerald-nominal); }
        .text-cyan { color: var(--cyan-primary); }

        @media (max-width: 768px) {
          .sidebar-utility-container {
            display: none;
          }
        }
      `}</style>
    </aside>
  );
}
