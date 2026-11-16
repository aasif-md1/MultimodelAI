import { useState, useEffect, useRef } from 'react';
import { KurageIcon } from './KurageIcons';

const LIBRARY_TEMPLATES = [
  { title: 'Weekly review', text: 'Walk me through a weekly review: wins, misses, what to drop, and the one thing to protect next week.' },
  { title: 'Meeting to decisions', text: 'Turn this meeting transcript into decisions, owners and deadlines:\n\n' },
  { title: 'Executive rewrite', text: 'Rewrite this for a busy executive: the ask in one line, then context in three bullets:\n\n' },
  { title: 'Find the counterargument', text: 'Argue against my position as strongly as you can, then tell me which point I should take seriously: ' },
  { title: 'Analyze visual data', text: 'Examine this attached media in high detail, breaking down layout, key subjects, and hidden patterns: ' },
];

export default function CommandPalette({
  isOpen,
  onClose,
  sessions = [],
  onSelectSession,
  onNewChat,
  onFillPrompt,
  mode,
  onSelectMode,
  isMotionPlaying,
  onToggleMotion,
  isWebSearchOn,
  onToggleWebSearch,
  onOpenShortcuts,
}) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  const handleClose = () => {
    setQuery('');
    setActiveIndex(0);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const recentItems = sessions.map((s) => ({
    type: 'recent',
    icon: 'history',
    text: s.title || 'Untitled Conversation',
    meta: s.updatedAt ? new Date(s.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
    run: () => {
      onSelectSession(s.id);
      handleClose();
    },
  }));

  const libraryItems = LIBRARY_TEMPLATES.map((item) => ({
    type: 'library',
    icon: 'bookmark',
    text: item.title,
    meta: 'template',
    run: () => {
      onFillPrompt(item.text);
      handleClose();
    },
  }));

  const actionItems = [
    {
      type: 'action',
      icon: 'pen',
      text: 'New chat',
      meta: '',
      run: () => {
        onNewChat();
        handleClose();
      },
    },
    {
      type: 'action',
      icon: isMotionPlaying ? 'pause' : 'play',
      text: isMotionPlaying ? 'Pause motion' : 'Play motion',
      meta: '',
      run: () => {
        onToggleMotion();
        handleClose();
      },
    },
    {
      type: 'action',
      icon: 'globe',
      text: isWebSearchOn ? 'Turn web search off' : 'Turn web search on',
      meta: '',
      run: () => {
        onToggleWebSearch();
        handleClose();
      },
    },
    {
      type: 'action',
      icon: 'auto',
      text: 'Switch to Auto mode',
      meta: mode === 'auto' ? 'active' : '',
      run: () => {
        onSelectMode('auto');
        handleClose();
      },
    },
    {
      type: 'action',
      icon: 'fast',
      text: 'Switch to Fast mode',
      meta: mode === 'fast' ? 'active' : '',
      run: () => {
        onSelectMode('fast');
        handleClose();
      },
    },
    {
      type: 'action',
      icon: 'think',
      text: 'Switch to Think mode',
      meta: mode === 'think' ? 'active' : '',
      run: () => {
        onSelectMode('think');
        handleClose();
      },
    },
    {
      type: 'action',
      icon: 'keyboard',
      text: 'Keyboard shortcuts',
      meta: '?',
      run: () => {
        handleClose();
        onOpenShortcuts();
      },
    },
  ];

  const q = query.trim().toLowerCase();
  const filterList = (list) => (q ? list.filter((it) => it.text.toLowerCase().includes(q)) : list);

  const groups = [
    { id: 'recent', title: 'recent', items: filterList(recentItems) },
    { id: 'library', title: 'library', items: filterList(libraryItems) },
    { id: 'actions', title: 'actions', items: filterList(actionItems) },
  ].filter((g) => g.items.length > 0);

  const flatItems = groups.flatMap((g) => g.items);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (flatItems.length) setActiveIndex((prev) => (prev + 1) % flatItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (flatItems.length) setActiveIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems[activeIndex]) flatItems[activeIndex].run();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-3 bg-black/65 backdrop-blur-[3px] animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="w-full max-w-[620px] max-h-[min(580px,calc(100dvh-48px))] rounded-[18px] border border-white/[0.18] bg-[#090c12]/95 backdrop-blur-[22px] shadow-[0_40px_120px_-24px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-[var(--mist-50)]"
        role="dialog"
        aria-modal="true"
        aria-label="History and commands"
      >
        {/* Search header */}
        <div className="flex items-center gap-2.5 h-[58px] px-4 border-b border-white/[0.09] text-[var(--mist-400)]">
          <KurageIcon name="search" className="w-5 h-5 flex-none text-[var(--mist-400)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search prompts and commands"
            className="flex-1 min-w-0 h-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 text-base text-[var(--mist-50)] placeholder-[var(--mist-500)]"
            style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
            autoComplete="off"
            spellCheck="false"
          />
          <kbd className="px-2 py-0.5 rounded-[7px] border border-white/[0.09] text-xs text-[var(--mist-400)] font-mono">
            esc
          </kbd>
        </div>

        {/* List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-3 font-sans">
          {flatItems.length === 0 ? (
            <p className="p-4 text-sm text-[var(--mist-400)]">
              Nothing matches &ldquo;{query}&rdquo;. Try another term or press Esc.
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.id} role="group" className="space-y-1">
                <p className="px-2.5 py-1 text-xs font-mono font-normal text-[var(--mist-500)] tracking-wide">
                  {group.title}
                </p>
                {group.items.map((item) => {
                  const itemIndex = flatItems.indexOf(item);
                  const isSelected = itemIndex === activeIndex;
                  return (
                    <div
                      key={item.text + itemIndex}
                      role="option"
                      aria-selected={isSelected}
                      onClick={item.run}
                      onMouseEnter={() => setActiveIndex(itemIndex)}
                      className={`flex items-center gap-3 min-h-[42px] px-3 py-2 rounded-[10px] text-sm cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-white/[0.08] text-[var(--mist-50)] shadow-[inset_2px_0_0_var(--accent)]'
                          : 'text-[var(--mist-200)] hover:bg-white/[0.055]'
                      }`}
                    >
                      <KurageIcon name={item.icon} className="w-4 h-4 flex-none text-[var(--mist-400)]" />
                      <span className="truncate flex-1 min-w-0">{item.text}</span>
                      {item.meta && (
                        <span className="ml-auto pl-3 font-mono text-xs text-[var(--mist-500)] flex-none">
                          {item.meta}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 border-t border-white/[0.09] font-mono text-xs text-[var(--mist-500)]">
          <span>
            <kbd className="text-[var(--mist-400)]">↑↓</kbd> move
          </span>
          <span>
            <kbd className="text-[var(--mist-400)]">↵</kbd> open
          </span>
          <span>
            <kbd className="text-[var(--mist-400)]">esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
