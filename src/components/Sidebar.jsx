import { useState, useRef, useEffect } from 'react';
import { KurageIcon, KurageLogo, KurageAvatar } from './KurageIcons';
import { Trash2, Edit2, Check, X } from 'lucide-react';

export default function Sidebar({
  sessions = [],
  currentSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  isCollapsed,
  onToggleCollapse,
  onOpenHistory,
  onOpenLibrary,
  isMotionPlaying,
  onToggleMotion,
  onOpenShortcuts,
  onOpenSettings,
  userName = 'User',
  isMobileDrawer = false,
  onCloseMobileDrawer,
}) {
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [tooltip, setTooltip] = useState({ text: '', top: 0, visible: false });
  const editInputRef = useRef(null);

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
  const modKey = isMac ? '⌘' : 'Ctrl';

  useEffect(() => {
    if (editingSessionId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingSessionId]);

  const handleStartRename = (session, e) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitle(session.title || 'New Conversation');
  };

  const handleSaveRename = (sessionId) => {
    const trimmed = editTitle.trim();
    if (trimmed && onRenameSession) {
      onRenameSession(sessionId, trimmed);
    }
    setEditingSessionId(null);
  };

  const handleKeyDownRename = (e, sessionId) => {
    if (e.key === 'Enter') {
      handleSaveRename(sessionId);
    } else if (e.key === 'Escape') {
      setEditingSessionId(null);
    }
  };

  const showTip = (e, text) => {
    if (!isCollapsed || isMobileDrawer) return;
    const r = e.currentTarget.getBoundingClientRect();
    setTooltip({
      text,
      top: r.top + r.height / 2,
      visible: true,
    });
  };

  const hideTip = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  return (
    <aside className="rail" id="rail" aria-label="Sidebar">
      {/* Brand Header */}
      <a
        className="brand"
        href="#prompt"
        onClick={(e) => {
          e.preventDefault();
          onNewChat();
          if (isMobileDrawer && onCloseMobileDrawer) onCloseMobileDrawer();
        }}
        onMouseEnter={(e) => showTip(e, 'SpaceAI, go to prompt')}
        onMouseLeave={hideTip}
        aria-label="SpaceAI, go to prompt"
      >
        <KurageLogo className="brand-mark" />
        <span className="wordmark" aria-hidden="true">
          SpaceAI
        </span>
      </a>

      {/* Workspace Nav Items */}
      <nav className="rail-nav" aria-label="Workspace">
        {/* New Chat */}
        <button
          className="nav-item"
          type="button"
          aria-current="page"
          onClick={() => {
            onNewChat();
            if (isMobileDrawer && onCloseMobileDrawer) onCloseMobileDrawer();
          }}
          onMouseEnter={(e) => showTip(e, 'New chat')}
          onMouseLeave={hideTip}
        >
          <KurageIcon name="pen" className="i" />
          <span className="label">New chat</span>
        </button>

        {/* History */}
        <button
          className="nav-item"
          type="button"
          onClick={() => {
            onOpenHistory();
            if (isMobileDrawer && onCloseMobileDrawer) onCloseMobileDrawer();
          }}
          onMouseEnter={(e) => showTip(e, 'History')}
          onMouseLeave={hideTip}
          aria-haspopup="dialog"
        >
          <KurageIcon name="history" className="i" />
          <span className="label">History</span>
          <span className="kbd-hint" aria-hidden="true">
            <span data-mod>{modKey}</span>K
          </span>
        </button>

        {/* Library */}
        <button
          className="nav-item"
          type="button"
          onClick={() => {
            onOpenLibrary?.();
            if (isMobileDrawer && onCloseMobileDrawer) onCloseMobileDrawer();
          }}
          onMouseEnter={(e) => showTip(e, 'Prompt library')}
          onMouseLeave={hideTip}
          aria-haspopup="dialog"
        >
          <KurageIcon name="bookmark" className="i" />
          <span className="label">Library</span>
        </button>
      </nav>

      {/* Recent list (hidden when collapsed on desktop via CSS .app[data-rail="collapsed"] .rail-recent) */}
      <section className="rail-recent" aria-labelledby="recent-heading">
        <h2 className="rail-heading" id="recent-heading">
          recent
        </h2>
        {sessions.length === 0 ? (
          <p className="recent-empty" id="recent-empty">
            Nothing yet. Prompts you run in this app show up here.
          </p>
        ) : (
          <ul className="recent-list" id="recent-list">
            {sessions.map((session) => {
              const isSelected = session.id === currentSessionId;
              const isEditing = editingSessionId === session.id;

              return (
                <li key={session.id} className="group relative">
                  {isEditing ? (
                    <div className="flex items-center gap-1 px-2 py-1 bg-white/[0.08] rounded-[10px]">
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => handleKeyDownRename(e, session.id)}
                        className="flex-1 bg-transparent border-0 outline-none text-xs text-[var(--mist-50)] px-1 py-1"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRename(session.id)}
                        className="p-1 text-[var(--accent)] hover:text-white"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSessionId(null)}
                        className="p-1 text-[var(--mist-500)] hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        onSelectSession(session.id);
                        if (isMobileDrawer && onCloseMobileDrawer) onCloseMobileDrawer();
                      }}
                      className={`group flex items-center justify-between w-full min-h-[36px] px-3 py-1.5 rounded-[10px] text-[13px] text-left cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-white/[0.08] text-[var(--mist-50)]'
                          : 'text-[var(--mist-400)] hover:bg-white/[0.055] hover:text-[var(--mist-50)]'
                      }`}
                    >
                      <span className="truncate flex-1 min-w-0 pr-2">
                        {session.title || 'Untitled Conversation'}
                      </span>

                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => handleStartRename(session, e)}
                          className="p-1 text-[var(--mist-400)] hover:text-[var(--mist-50)] rounded hover:bg-white/[0.08]"
                          title="Rename"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(session.id);
                          }}
                          className="p-1 text-[var(--mist-400)] hover:text-[var(--danger)] rounded hover:bg-white/[0.08]"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Rail Foot */}
      <div className="rail-foot">
        <button
          className="nav-item"
          type="button"
          id="motion-toggle"
          onClick={onToggleMotion}
          onMouseEnter={(e) => showTip(e, isMotionPlaying ? 'Pause motion' : 'Play motion')}
          onMouseLeave={hideTip}
        >
          <KurageIcon name={isMotionPlaying ? 'pause' : 'play'} className="i" />
          <span className="label">{isMotionPlaying ? 'Pause motion' : 'Play motion'}</span>
        </button>

        <button
          className="nav-item"
          type="button"
          onClick={() => {
            onOpenShortcuts();
            if (isMobileDrawer && onCloseMobileDrawer) onCloseMobileDrawer();
          }}
          onMouseEnter={(e) => showTip(e, 'Keyboard shortcuts')}
          onMouseLeave={hideTip}
          aria-haspopup="dialog"
        >
          <KurageIcon name="help" className="i" />
          <span className="label">Shortcuts</span>
        </button>

        {!isMobileDrawer && (
          <button
            className="nav-item rail-expand"
            type="button"
            id="rail-toggle"
            onClick={onToggleCollapse}
            onMouseEnter={(e) => showTip(e, isCollapsed ? 'Expand sidebar' : 'Collapse sidebar')}
            onMouseLeave={hideTip}
            aria-expanded={!isCollapsed}
            aria-controls="rail"
          >
            <KurageIcon name="panel" className="i" />
            <span className="label">{isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}</span>
          </button>
        )}

        <button
          className="nav-item profile"
          type="button"
          onClick={() => {
            onOpenSettings?.();
            if (isMobileDrawer && onCloseMobileDrawer) onCloseMobileDrawer();
          }}
          onMouseEnter={(e) => showTip(e, userName)}
          onMouseLeave={hideTip}
        >
          <span className="avatar" aria-hidden="true">
            <KurageAvatar size={28} />
          </span>
          <span className="label">
            {userName} <small>Multimodal Pro</small>
          </span>
        </button>
      </div>

      {/* Tooltip for collapsed desktop rail */}
      {tooltip.visible && (
        <div
          className="tooltip"
          id="tooltip"
          aria-hidden="true"
          style={{
            left: 84,
            top: tooltip.top,
          }}
        >
          {tooltip.text}
        </div>
      )}
    </aside>
  );
}
