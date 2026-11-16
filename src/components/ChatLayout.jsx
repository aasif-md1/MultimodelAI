import { useState } from 'react';
import { KurageIcon } from './KurageIcons';
import OceanBackground from './OceanBackground';

export default function ChatLayout({
  sidebar,
  children,
  isCollapsed,
  onOpenHistory,
  mode = 'auto',
  isMotionPlaying = true,
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
  const modKey = isMac ? '⌘' : 'Ctrl';

  return (
    <div
      className="app"
      id="app"
      data-rail={isCollapsed ? 'collapsed' : 'expanded'}
      data-drawer={isDrawerOpen ? 'open' : 'closed'}
    >
      {/* Sidebar Rail */}
      {sidebar({
        isMobileDrawer: false,
        onCloseMobileDrawer: () => setIsDrawerOpen(false),
      })}

      {/* Mobile Scrim */}
      <div
        className="scrim"
        id="scrim"
        hidden={!isDrawerOpen}
        onClick={() => setIsDrawerOpen(false)}
      />

      {/* Main Workspace with Ocean Canvas */}
      <main id="main">
        {/* Procedural ASCII Jellyfish Background Canvas */}
        <OceanBackground mode={mode} isPlaying={isMotionPlaying} />

        {/* Topbar */}
        <header className="topbar">
          <button
            className="menu-btn"
            type="button"
            id="menu-btn"
            onClick={() => setIsDrawerOpen((prev) => !prev)}
            aria-label="Open menu"
            aria-expanded={isDrawerOpen}
            aria-controls="rail"
          >
            <KurageIcon name="menu" className="i" />
          </button>

          <button
            className="history-pill"
            type="button"
            id="history-pill"
            onClick={onOpenHistory}
            aria-haspopup="dialog"
          >
            <KurageIcon name="history" className="i i-sm" />
            <span>History</span>
            <kbd aria-hidden="true">
              <span data-mod>{modKey}</span>K
            </kbd>
          </button>
        </header>

        {/* Content Area (Stage or Chat Stream) */}
        {children}
      </main>
    </div>
  );
}
