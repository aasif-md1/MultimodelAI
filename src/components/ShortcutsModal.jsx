import React from 'react';
import { KurageIcon } from './KurageIcons';

export default function ShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcutsList = [
    { key: `${modKey} K`, desc: 'Open history and command palette' },
    { key: '/', desc: 'Jump to composer prompt' },
    { key: '↵', desc: 'Send prompt or save' },
    { key: '⇧ ↵', desc: 'Insert new line' },
    { key: 'esc', desc: 'Close dialog, menu or clear status' },
    { key: '?', desc: 'Show keyboard shortcuts' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-3 bg-black/65 backdrop-blur-[3px] animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-[500px] rounded-[18px] border border-white/[0.18] bg-[#090c12]/95 backdrop-blur-[22px] shadow-[0_40px_120px_-24px_rgba(0,0,0,0.9)] overflow-hidden text-[var(--mist-50)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.09]">
          <h2 id="shortcuts-title" className="text-base font-medium text-[var(--mist-50)]">
            Keyboard shortcuts
          </h2>
          <button
            onClick={onClose}
            className="grid place-items-center w-8 h-8 rounded-lg text-[var(--mist-400)] hover:text-[var(--mist-50)] hover:bg-white/[0.06] transition-colors"
            aria-label="Close"
          >
            <KurageIcon name="x" className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 grid grid-cols-[auto_1fr] gap-x-5 gap-y-3.5 items-center text-sm font-sans">
          {shortcutsList.map((sc, i) => (
            <React.Fragment key={i}>
              <div className="justify-self-start">
                <kbd className="inline-block min-w-[28px] px-2 py-1 rounded-[7px] border border-white/[0.18] bg-white/[0.04] text-[var(--mist-50)] text-center font-mono text-xs">
                  {sc.key}
                </kbd>
              </div>
              <div className="text-[var(--mist-200)] text-sm">{sc.desc}</div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
