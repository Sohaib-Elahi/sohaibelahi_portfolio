import { useEffect, useRef } from 'react';
import { site } from '../content/site';
import '../entrance.css';

export function EntranceReveal({ onReveal, onComplete }: { onReveal: () => void; onComplete: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const finish = useRef(onComplete);
  useEffect(() => {
    const overlay = root.current!;
    const content = document.querySelector<HTMLElement>('.site-content')!;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    // Direct section links retain their destination; reduced motion enters immediately.
    if (reduced.matches || (location.hash && location.hash !== '#main')) { onComplete(); return; }
    let cancelled = false;
    let timeline: { kill: () => void } | undefined;
    let unsubscribe: (() => void) | undefined;
    const previousOverflow = document.body.style.overflow;
    const landing = document.querySelector<HTMLElement>('.landing')!;
    const previousWillChange = landing.style.willChange;
    landing.style.willChange = 'transform';
    const oldFocus = document.activeElement as HTMLElement | null;
    content.inert = true;
    document.body.style.overflow = 'hidden';
    overlay.focus({ preventScroll: true });
    function complete() {
      if (cancelled) return;
      cancelled = true;
      unsubscribe?.();
      timeline?.kill();
      content.inert = false;
      document.body.style.overflow = previousOverflow;
      landing.style.transform = '';
      landing.style.willChange = previousWillChange;
      if (overlay.contains(document.activeElement)) { overlay.blur(); oldFocus?.focus({ preventScroll: true }); }
      onComplete();
    }
    finish.current = complete;
    const timeout = setTimeout(complete, 9000);
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') complete(); };
    document.addEventListener('keydown', escape);
    reduced.addEventListener('change', complete);
    window.addEventListener('resize', complete);
    void Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 700))]).then(async () => {
      const { gsap, subscribeScene } = await import('../lib/scroll');
      if (cancelled) return;
      const greeting = overlay.querySelector<HTMLElement>('.entrance-greeting')!;
      const dot = overlay.querySelector<HTMLElement>('.entrance-dot')!;
      const square = overlay.querySelector<HTMLElement>('.entrance-square')!;
      const curtain = overlay.querySelector<HTMLElement>('.entrance-curtain')!;
      const rect = dot.getBoundingClientRect();
      const width = overlay.clientWidth, height = overlay.clientHeight;
      const startX = rect.left + rect.width / 2, startY = rect.top + rect.height / 2;
      const state = { arrive: 0, travel: 0, open: 0, uncover: 0, settle: 0, exit: 0 };
      const skip = overlay.querySelector<HTMLElement>('.entrance-skip')!;
      dot.style.opacity = '0';
      square.style.opacity = '1';
      function paint() {
        greeting.style.opacity = String(state.arrive * (1 - state.travel));
        greeting.style.transform = `translateY(${(1 - state.arrive) * 24 - state.travel * 24}px) scale(${1 - state.travel * .08})`;
        const x = startX + (width / 2 - startX) * state.travel;
        const y = startY + (height / 2 - startY) * state.travel;
        const size = rect.width + (64 - rect.width) * state.travel + (Math.max(width, height) * 1.5 - 64) * state.open;
        square.style.transform = `translate3d(${x - 32}px,${y - 32}px,0) rotate(${state.travel * 90}deg) scale(${size / 64})`;
        square.style.opacity = String(state.arrive * (1 - state.uncover));
        skip.style.opacity = String(1 - state.exit);
        if (state.uncover > 0) {
          const radius = size / 2;
          const l = width / 2 - radius, r = width / 2 + radius;
          const t = height / 2 - radius, b = height / 2 + radius;
          curtain.style.clipPath = `polygon(evenodd, 0 0,100% 0,100% 100%,0 100%,0 0,${l}px ${t}px,${r}px ${t}px,${r}px ${b}px,${l}px ${b}px,${l}px ${t}px)`;
          landing.style.transform = `translateZ(0) scale(${1.035 - state.settle * .035})`;
        }
      }
      const sequence = gsap.timeline({ paused: true, onUpdate: paint, onComplete: complete })
        .to(state, { arrive: 1, duration: .8, ease: 'power2.out' })
        .to(state, { travel: 1, duration: 1.05, ease: 'power2.inOut' }, 1.95)
        .call(onReveal, [], 2.85)
        .to(state, { uncover: 1, duration: .38, ease: 'sine.inOut' }, 3)
        .to(state, { open: 1, duration: 1.9, ease: 'power2.inOut' }, 3)
        .to(state, { settle: 1, duration: 2.3, ease: 'sine.inOut' }, 3)
        .to(state, { exit: 1, duration: .35, ease: 'sine.inOut' }, 4.75);
      timeline = sequence;
      // Use elapsed entrance time, independent of when the shared GSAP clock starts.
      const started = performance.now();
      unsubscribe = subscribeScene(time => sequence.totalTime(Math.max(0, time - started) / 1000));
      paint();
    }).catch(complete);
    return () => {
      cancelled = true; unsubscribe?.(); timeline?.kill(); clearTimeout(timeout);
      document.removeEventListener('keydown', escape);
      reduced.removeEventListener('change', complete);
      window.removeEventListener('resize', complete);
      content.inert = false; document.body.style.overflow = previousOverflow;
      landing.style.transform = '';
      landing.style.willChange = previousWillChange;
    };
  }, [onComplete, onReveal]);
  return <div className="entrance" ref={root} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Welcome to Sohaib Elahi’s portfolio" data-lenis-prevent>
    <div className="entrance-curtain" aria-hidden="true" />
    <div className="entrance-greeting" aria-hidden="true"><p>Hi, I’m</p><div>{site.fullName}<span className="entrance-dot" /></div></div>
    <div className="entrance-square" aria-hidden="true" />
    <button className="entrance-skip" onClick={() => finish.current()}>Skip intro ↗</button>
  </div>;
}
