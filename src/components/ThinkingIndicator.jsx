import { KurageAvatar } from './KurageIcons';

export default function ThinkingIndicator({ hasMedia, mode = 'auto' }) {
  const modeText = mode === 'think' ? 'Thinking deeply...' : hasMedia ? 'Analyzing visual data...' : 'Processing...';

  return (
    <div className="flex gap-3.5 w-full animate-message max-w-3xl mx-auto px-4">
      {/* Assistant Avatar */}
      <div className="shrink-0 mt-0.5">
        <KurageAvatar size={28} />
      </div>

      {/* Bubble with bioluminescent pulsing dots */}
      <div className="flex flex-col gap-1.5">
        <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[var(--surface)] border border-[var(--border)] backdrop-blur-md flex items-center gap-2 shadow-lg">
          <div className="flex items-center gap-1.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan-300)] animate-dot-1 inline-block shadow-[0_0_8px_var(--cyan-300)]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan-300)] animate-dot-2 inline-block shadow-[0_0_8px_var(--cyan-300)]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--violet-300)] animate-dot-3 inline-block shadow-[0_0_8px_var(--violet-300)]" />
          </div>
          <span className="text-xs text-[var(--mist-400)] font-medium ml-1.5 font-mono">
            {modeText}
          </span>
        </div>
      </div>
    </div>
  );
}
