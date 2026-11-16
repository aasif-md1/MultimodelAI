import { useEffect, useRef, useState, useMemo } from 'react';

export default function RotatingHeadline({ isPlaying = true }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const linesRef = useRef([]);
  const isPlayingRef = useRef(isPlaying);
  const activeIndexRef = useRef(0);

  const daypart = useMemo(() => {
    const h = new Date().getHours();
    return h >= 5 && h < 12 ? 'this morning' : h >= 12 && h < 18 ? 'this afternoon' : 'tonight';
  }, []);

  const lines = useMemo(
    () => [
      `what are we *exploring* ${daypart}?`,
      'analyze images and *video clips*',
      'review code and *pull requests*',
      'summarize complex *documents*',
      'chat with *voice and vision*',
      'plan your next *breakthrough*',
      'draft ideas with *multimodal AI*',
    ],
    [daypart]
  );

  const parsedLines = useMemo(() => {
    return lines.map((line) => {
      const tokens = [];
      line
        .split(/(\*[^*]+\*)/)
        .filter(Boolean)
        .forEach((part) => {
          const accent = part.startsWith('*');
          part
            .replace(/\*/g, '')
            .split(/(\s+)/)
            .forEach((tok) => {
              if (!tok) return;
              if (/^\s+$/.test(tok)) {
                tokens.push({ text: ' ', isSpace: true });
              } else {
                tokens.push({ text: tok, accent, isSpace: false });
              }
            });
        });
      return tokens;
    });
  }, [lines]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const HOLD_FIRST = 2800;
    const HOLD = 2000;
    const OUT = { dur: 380, stagger: 26, ease: 'cubic-bezier(.55,0,.75,.35)' };
    const IN = { dur: 620, stagger: 46, ease: 'cubic-bezier(.16,1,.3,1)' };

    let timer = 0;
    let busy = false;
    let visible = !document.hidden;

    const words = (el) => (el ? [...el.querySelectorAll('.hl-w')] : []);

    function animateOut(el) {
      if (!el) return Promise.resolve();
      const ws = words(el);
      const soft = reduce.matches;
      return Promise.all(
        ws.map((w, i) =>
          w.animate(
            soft
              ? [{ opacity: 1 }, { opacity: 0 }]
              : [
                  { opacity: 1, filter: 'blur(0px)', transform: 'translateY(0) scale(1)' },
                  { opacity: 0, filter: 'blur(12px)', transform: 'translateY(-.22em) scale(.97)' },
                ],
            { duration: soft ? 260 : OUT.dur, delay: soft ? 0 : i * OUT.stagger, easing: OUT.ease, fill: 'forwards' }
          ).finished
        )
      );
    }

    function animateIn(el) {
      if (!el) return Promise.resolve();
      const ws = words(el);
      const soft = reduce.matches;
      return Promise.all(
        ws.map((w, i) =>
          w.animate(
            soft
              ? [{ opacity: 0 }, { opacity: 1 }]
              : [
                  { opacity: 0, filter: 'blur(14px)', transform: 'translateY(.34em) scale(1.04)' },
                  { opacity: 0.7, filter: 'blur(4px)', offset: 0.45 },
                  { opacity: 1, filter: 'blur(0px)', transform: 'translateY(0) scale(1)' },
                ],
            { duration: soft ? 320 : IN.dur, delay: soft ? 0 : i * IN.stagger, easing: IN.ease, fill: 'backwards' }
          ).finished
        )
      );
    }

    async function next() {
      timer = 0;
      if (!isPlayingRef.current || !visible || busy) return;
      busy = true;
      const curIdx = activeIndexRef.current;
      const nxtIdx = (curIdx + 1) % lines.length;
      const cur = linesRef.current[curIdx];
      const nxt = linesRef.current[nxtIdx];

      try {
        await animateOut(cur);
        if (cur) {
          cur.getAnimations({ subtree: true }).forEach((a) => a.cancel());
        }
        activeIndexRef.current = nxtIdx;
        setActiveIndex(nxtIdx);
        await animateIn(nxt);
      } catch {
        // cancelled
      }
      busy = false;
      schedule();
    }

    function schedule() {
      clearTimeout(timer);
      timer = 0;
      if (isPlayingRef.current && visible) {
        timer = setTimeout(next, activeIndexRef.current === 0 ? HOLD_FIRST : HOLD);
      }
    }

    const onVisChange = () => {
      visible = !document.hidden;
      if (!busy) schedule();
    };
    document.addEventListener('visibilitychange', onVisChange);

    schedule();

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, [lines.length]);

  return (
    <h1 id="headline">
      <span className="sr-only">what are we exploring tonight?</span>
      <span className="hl" id="headline-visual" aria-hidden="true">
        {parsedLines.map((tokens, i) => (
          <span
            key={i}
            ref={(el) => {
              linesRef.current[i] = el;
            }}
            className={`hl-line ${i === activeIndex ? 'is-on' : ''}`}
          >
            {tokens.map((tok, j) =>
              tok.isSpace ? (
                ' '
              ) : (
                <span
                  key={j}
                  className={`hl-w ${tok.accent ? 'hl-accent' : ''}`}
                >
                  {tok.text}
                </span>
              )
            )}
          </span>
        ))}
      </span>
    </h1>
  );
}
