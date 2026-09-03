import { useState, useRef, useEffect } from 'react';
import { 
  User, 
  LogOut, 
  ShieldCheck, 
  ChevronDown,
  Bookmark,
  Bell
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import ThemeToggle from './ThemeToggle';

export default function UserMenu({ onOpenWatchlist, onOpenAlertSettings }) {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  const handleWatchlistClick = () => {
    setIsOpen(false);
    if (onOpenWatchlist) onOpenWatchlist();
  };

  const handleAlertSettingsClick = () => {
    setIsOpen(false);
    if (onOpenAlertSettings) onOpenAlertSettings();
  };

  const displayName = user?.name || 'Climate Analyst';
  const displayEmail = user?.email || 'analyst@floatchat.ai';
  const displayRole = user?.role || 'Climate Intelligence Analyst';
  const userInitial = displayName.charAt(0).toUpperCase() || 'A';

  return (
    <div className="user-menu-container" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        className={`user-menu-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="User Account & Preferences"
      >
        <div className="trigger-avatar-circle">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={displayName} className="trigger-avatar-img" />
          ) : (
            <span className="trigger-initial font-mono">{userInitial}</span>
          )}
        </div>
        <span className="trigger-name desktop-only">{displayName.split(' ')[0]}</span>
        <ChevronDown size={12} className={`trigger-arrow ${isOpen ? 'rotated' : ''}`} />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="user-menu-dropdown glass-panel-elevated" role="menu">
          {/* User Profile Header */}
          <div className="user-dropdown-header">
            <div className="header-avatar-circle">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={displayName} className="header-avatar-img" />
              ) : (
                <User size={16} className="text-cyan" />
              )}
            </div>
            <div className="header-user-info">
              <span className="header-name">{displayName}</span>
              <span className="header-email font-mono">{displayEmail}</span>
              <div className="header-badge-row">
                <span className="badge badge-cyan font-mono">{displayRole}</span>
                <span className="verified-pill font-mono">
                  <ShieldCheck size={10} className="text-emerald" />
                  <span>Verified</span>
                </span>
              </div>
            </div>
          </div>

          <div className="dropdown-divider" />

          {/* Quick Actions / Shortcuts */}
          <div className="dropdown-actions-group">
            {onOpenWatchlist && (
              <button 
                type="button"
                className="btn-menu-action font-mono"
                onClick={handleWatchlistClick}
              >
                <Bookmark size={13} className="text-cyan" />
                <span className="action-label">My Climate Watchlist</span>
              </button>
            )}

            {onOpenAlertSettings && (
              <button 
                type="button"
                className="btn-menu-action font-mono"
                onClick={handleAlertSettingsClick}
              >
                <Bell size={13} className="text-cyan" />
                <span className="action-label">Alert & Location Settings</span>
                <span className={`badge ${user?.location?.status === 'enabled' ? 'badge-emerald' : 'badge-amber'} font-mono status-badge`}>
                  {user?.location?.status === 'enabled' ? 'Active' : 'Setup'}
                </span>
              </button>
            )}
          </div>

          <div className="dropdown-divider" />

          {/* Theme Switcher */}
          <div className="dropdown-section">
            <span className="section-title-label font-mono">APPEARANCE</span>
            <ThemeToggle />
          </div>

          <div className="dropdown-divider" />

          {/* Logout Action */}
          <div className="dropdown-footer">
            <button
              type="button"
              className="btn-logout-action font-mono"
              onClick={handleLogout}
              role="menuitem"
            >
              <LogOut size={13} className="text-rose" />
              <span>Sign Out of Mission</span>
            </button>
          </div>
        </div>
      )}

      <style>{`
        .user-menu-container {
          position: relative;
          display: inline-block;
        }

        .user-menu-trigger {
          display: flex;
          align-items: center;
          gap: 7px;
          background: var(--data-surface);
          border: 1px solid var(--border-light);
          padding: 3px 8px 3px 4px;
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all var(--transition-fast);
          box-shadow: var(--shadow-subtle);
        }

        .user-menu-trigger:hover,
        .user-menu-trigger.open {
          background: var(--data-surface-hover);
          border-color: var(--cyan-primary);
        }

        .trigger-avatar-circle {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--cyan-subtle);
          border: 1px solid var(--data-border-active);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .trigger-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .trigger-initial {
          font-size: 10px;
          font-weight: 800;
          color: var(--cyan-primary);
        }

        .trigger-name {
          font-size: 11.5px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .trigger-arrow {
          color: var(--text-muted);
          transition: transform var(--transition-fast);
        }

        .trigger-arrow.rotated {
          transform: rotate(180deg);
        }

        .user-menu-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          width: 256px;
          background: var(--glass-panel-elevated);
          border: 1px solid var(--data-border-active);
          border-radius: var(--radius-lg);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.7), 0 0 16px rgba(0, 229, 255, 0.1);
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          z-index: 1100;
          animation: scaleUp 0.15s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .user-dropdown-header {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 4px;
        }

        .header-avatar-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--cyan-subtle);
          border: 1px solid var(--data-border-active);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
        }

        .header-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .header-user-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
          flex: 1;
        }

        .header-name {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .header-email {
          font-size: 9.5px;
          color: var(--text-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .header-badge-row {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 3px;
          flex-wrap: wrap;
        }

        .verified-pill {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 8px;
          color: var(--emerald-nominal);
          background: rgba(16, 185, 129, 0.1);
          padding: 1px 5px;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(16, 185, 129, 0.25);
        }

        .dropdown-divider {
          height: 1px;
          background: var(--border-light);
          margin: 0 -2px;
        }

        .dropdown-actions-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .btn-menu-action {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: 10.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          width: 100%;
          text-align: left;
        }

        .btn-menu-action:hover {
          background: var(--data-surface-hover);
          color: var(--text-primary);
          border-color: var(--data-border);
        }

        .action-label {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .status-badge {
          font-size: 8.5px;
          padding: 1px 5px;
        }

        .dropdown-section {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 2px 4px;
        }

        .section-title-label {
          font-size: 8.5px;
          color: var(--text-muted);
          font-weight: 700;
          letter-spacing: 0.08em;
        }

        .dropdown-footer {
          padding-top: 2px;
        }

        .btn-logout-action {
          display: flex;
          align-items: center;
          gap: 7px;
          width: 100%;
          padding: 6px 8px;
          background: rgba(244, 63, 94, 0.08);
          border: 1px solid rgba(244, 63, 94, 0.2);
          border-radius: var(--radius-md);
          color: #F87171;
          font-size: 10.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-logout-action:hover {
          background: rgba(244, 63, 94, 0.18);
          border-color: rgba(244, 63, 94, 0.4);
          color: #FECACA;
        }

        .text-cyan { color: var(--cyan-primary); }
        .text-emerald { color: var(--emerald-nominal); }
        .text-rose { color: var(--red-critical); }
        .badge-amber { background: rgba(245, 158, 11, 0.15); color: var(--amber-warning); border: 1px solid rgba(245, 158, 11, 0.3); }
        .badge-emerald { background: rgba(16, 185, 129, 0.15); color: var(--emerald-nominal); border: 1px solid rgba(16, 185, 129, 0.3); }

        @keyframes scaleUp {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(-4px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
