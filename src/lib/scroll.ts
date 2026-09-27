import Lenis from 'lenis';
import { gsap } from 'gsap/gsap-core';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// ScrollTrigger needs this CSS utility; native sticky avoids the full CSSPlugin.
gsap.utils.checkPrefix = property => property in document.documentElement.style ? property : '';
gsap.registerPlugin(ScrollTrigger);
const sceneListeners = new Set<(time: number) => void>();
export function subscribeScene(draw: (time: number) => void) {
  sceneListeners.add(draw);
  draw(performance.now());
  return () => { sceneListeners.delete(draw); };
}
function drawScenes(time: number) { sceneListeners.forEach(draw => draw(time)); }
export function startScroll(draw: (time: number) => void, refresh: () => void) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0, lenis: Lenis | undefined;
  // Own the only continuous ticker. GSAP and Lenis are advanced by it.
  gsap.ticker.remove(gsap.updateRoot);
  gsap.ticker.sleep();
  function tick(time: number) {
    lenis?.raf(time);
    gsap.updateRoot(time / 1000);
    gsap.ticker.sleep();
    draw(time);
    drawScenes(time);
    frame = requestAnimationFrame(tick);
  }
  function staticDraw() { const time = performance.now(); draw(time); drawScenes(time); }
  function configure() {
    cancelAnimationFrame(frame); lenis?.destroy(); lenis = undefined;
    if (!reduced.matches) {
      lenis = new Lenis({ autoRaf: false, duration: 0.9, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      frame = requestAnimationFrame(tick);
    } else staticDraw();
    ScrollTrigger.refresh(); refresh();
  }
  function visibility() {
    if (document.hidden) cancelAnimationFrame(frame);
    else configure();
  }
  function scroll() { if (reduced.matches) staticDraw(); }
  configure();
  reduced.addEventListener('change', configure);
  document.addEventListener('visibilitychange', visibility);
  addEventListener('scroll', scroll, { passive: true });
  const observer = new MutationObserver(staticDraw);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => { cancelAnimationFrame(frame); lenis?.destroy(); observer.disconnect(); reduced.removeEventListener('change', configure); document.removeEventListener('visibilitychange', visibility); removeEventListener('scroll', scroll); };
}
export { gsap, ScrollTrigger };
