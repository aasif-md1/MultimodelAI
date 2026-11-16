import { useState } from 'react';
import { KurageIcon } from './KurageIcons';
import { Trash2, AlertTriangle, Check } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  onClearAllChats,
  userName = 'User',
  onUpdateUserName,
}) {
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [localName, setLocalName] = useState(userName || 'User');
  const [prevUserName, setPrevUserName] = useState(userName);
  const [savedNameNotice, setSavedNameNotice] = useState(false);

  if (prevUserName !== userName) {
    setPrevUserName(userName);
    setLocalName(userName || 'User');
  }

  if (!isOpen) return null;

  const handleSaveName = () => {
    const trimmed = localName.trim();
    if (trimmed) {
      onUpdateUserName?.(trimmed);
      setSavedNameNotice(true);
      setTimeout(() => setSavedNameNotice(false), 2000);
    } else {
      setLocalName(userName || 'User');
    }
  };

  const handleClear = async () => {
    await onClearAllChats();
    setConfirmingClear(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-[3px] animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setConfirmingClear(false);
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-md bg-[#090c12]/95 border border-white/[0.18] rounded-[18px] shadow-[0_40px_120px_-24px_rgba(0,0,0,0.9)] backdrop-blur-[22px] p-6 relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-medium text-[var(--mist-50)]">
            SpaceAI Settings
          </h2>
          <button
            onClick={() => {
              setConfirmingClear(false);
              onClose();
            }}
            className="p-1.5 text-[var(--mist-400)] hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
            aria-label="Close settings"
          >
            <KurageIcon name="x" className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="py-5 space-y-6">
          {/* User Profile Section */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--mist-500)] mb-3">
              Profile
            </h3>
            <div className="p-4 bg-[var(--surface-solid)] border border-[var(--border)] rounded-xl flex flex-col gap-2.5">
              <label htmlFor="settings-name" className="text-sm font-medium text-[var(--mist-50)]">
                Display Name
              </label>
              <div className="text-xs text-[var(--mist-400)] leading-relaxed">
                Your custom name shown in the welcome greeting and sidebar profile.
              </div>
              <div className="flex items-center gap-2 mt-1">
                <input
                  id="settings-name"
                  type="text"
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                  }}
                  maxLength={32}
                  className="flex-1 bg-black/40 border border-white/[0.14] rounded-lg px-3 py-1.5 text-sm text-[var(--mist-50)] outline-none focus:border-[var(--cyan-300)]/70 transition-colors"
                  placeholder="Enter your name"
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  className="px-3 py-1.5 bg-white/[0.08] hover:bg-white/[0.14] text-[var(--mist-50)] text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  {savedNameNotice ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[var(--cyan-300)]" />
                      <span className="text-[var(--cyan-300)]">Saved</span>
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Data & Storage Section */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--mist-500)] mb-3">
              Data & Storage
            </h3>

            <div className="p-4 bg-[var(--surface-solid)] border border-[var(--border)] rounded-xl flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-medium text-[var(--mist-50)]">Clear Conversations</div>
                  <div className="text-xs text-[var(--mist-400)] mt-0.5 leading-relaxed">
                    Permanently wipe all conversation sessions and indexed multimodal media from this browser.
                  </div>
                </div>
              </div>

              {!confirmingClear ? (
                <button
                  type="button"
                  onClick={() => setConfirmingClear(true)}
                  className="self-start mt-1 flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[var(--danger)] border border-red-400/30 hover:bg-red-400/10 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Conversations</span>
                </button>
              ) : (
                <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-xs text-red-300 font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>This action cannot be undone. Are you sure?</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClear}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Yes, delete all</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingClear(false)}
                      className="px-3 py-1.5 bg-white/[0.08] hover:bg-white/[0.14] text-[var(--mist-200)] text-xs font-medium rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[var(--border)] flex justify-end">
          <button
            onClick={() => {
              setConfirmingClear(false);
              onClose();
            }}
            className="px-4 py-2 bg-white/[0.08] hover:bg-white/[0.14] text-[var(--mist-50)] text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
