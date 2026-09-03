import { useState, useRef, useEffect } from 'react';
import { 
  User, 
  LogOut, 
  ShieldCheck, 
  Building2, 
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
  const displayOrg = user?.organization || 'Global Environmental Array';

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
                <User size={18} className="text-cyan" />
              )}
            </div>
            <div className="header-user-info">
              <span className="header-name">{displayName}</span>
              <span className="header-email font-mono">{displayEmail}</span>
              <div className="header-badge-row">
                <span className="badge badge-cyan font-mono">{displayRole}</span>
              </div>
            </div>
          </div>

          <div className="dropdown-divider" />

          {/* Organization Info */}
          <div className="dropdown-section">
            <div className="org-info-row font-mono">
              <Building2 size={12} className="text-muted" />
              <span className="org-text">{displayOrg}</span>
            </div>
            <div className="status-verify-row font-mono">
              <ShieldCheck size={12} className="text-emerald" />
              <span>Verified Research Access</span>
            </div>
          </div>

          <div className="dropdown-divider" />

          {/* Custom Watchlist Shortcut */}
          {onOpenWatchlist && (
            <>
              <div className="dropdown-section">
                <button 
                  className="btn-watchlist-menu font-mono"
                  onClick={handleWatchlistClick}
                >
                  <Bookmark size={13} className="text-cyan" />
                  <span>My Climate Watchlist</span>
                </button>
              </div>
              <div className="dropdown-divider" />
            </>
          )}

          {/* Alert & Location Settings */}
          {onOpenAlertSettings && (
            <>
              <div className="dropdown-section">
                <button 
                  className="btn-watchlist-menu font-mono"
                  onClick={handleAlertSettingsClick}
                >
                  <Bell size={13} className="text-cyan" />
                  <span style={{ flex: 1, textAlign: 'left' }}>Alert & Location Settings</span>
                  <span className={`badge ${user?.location?.status === 'enabled' ? 'badge-emerald' : 'badge-amber'} font-mono`} style={{ fontSize: '9.5px', padding: '1px 6px' }}>
                    {user?.location?.status === 'enabled' ? 'Active' : 'Configure'}
                  </span>
                </button>
              </div>
              <div className="dropdown-divider" />
            </>
          )}

          {/* Theme Switcher */}
          <div className="dropdown-section">
            <span className="section-title-label font-mono">APPEARANCE THEME</span>
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
              <LogOut size={14} className="text-rose" />
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
          padding: 4px 8px 4px 5px;
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
          width: 26px;
          height: 26px;
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
          font-size: 11px;
          font-weight: 800;
          color: var(--cyan-primary);
        }

        .trigger-name {
          font-size: 12px;
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
          top: calc(100% + 8px);
          right: 0;
          width: 280px;
          background: var(--glass-panel-elevated);
          border: 1px solid var(--data-border-active);
          border-radius: var(--radius-lg);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.7), 0 0 16px rgba(0, 229, 255, 0.1);
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 1100;
          animation: scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .user-dropdown-header {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 4px;
        }

        .header-avatar-circle {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(0, 229, 255, 0.15);
          border: 1px solid rgba(0, 229, 255, 0.3);
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
        }

        .header-name {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .header-email {
          font-size: 10px;
          color: var(--text-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .header-badge-row {
          margin-top: 3px;
        }

        .dropdown-divider {
          height: 1px;
          background: var(--border-light);
          margin: 0 -4px;
        }

        .dropdown-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 0 4px;
        }

        .section-title-label {
          font-size: 9px;
          color: var(--text-muted);
          font-weight: 700;
          letter-spacing: 0.08em;
        }

        .org-info-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10.5px;
          color: var(--text-secondary);
        }

        .org-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .status-verify-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          color: var(--emerald-nominal);
        }

        .btn-watchlist-menu {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 7px 10px;
          background: rgba(0, 229, 255, 0.08);
          border: 1px solid rgba(0, 229, 255, 0.25);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-watchlist-menu:hover {
          background: rgba(0, 229, 255, 0.18);
          border-color: var(--cyan-primary);
        }

        .btn-logout-action {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          padding: 8px 12px;
          background: rgba(244, 63, 94, 0.1);
          border: 1px solid rgba(244, 63, 94, 0.25);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-logout-action:hover {
          background: rgba(244, 63, 94, 0.25);
          border-color: var(--red-critical);
          color: #FFFFFF;
        }

        .text-rose { color: var(--red-critical); }
        .text-cyan { color: var(--cyan-primary); }
        .text-emerald { color: var(--emerald-nominal); }
      `}</style>
    </div>
  );
}
