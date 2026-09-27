import { useEffect, useRef, useState } from 'react';
import { body } from '../content/body';

export function AnimatedPortrait() {
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const syncPreference = () => setReduced(preference.matches);
    syncPreference();
    preference.addEventListener('change', syncPreference);
    const preload = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setNear(true); preload.disconnect(); }
    }, { rootMargin: '200px' });
    const visibility = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    preload.observe(frame.current!); visibility.observe(frame.current!);
    return () => { preference.removeEventListener('change', syncPreference); preload.disconnect(); visibility.disconnect(); };
  }, []);

  useEffect(() => {
    const media = video.current;
    if (!media) return;
    let cancelled = false;
    function syncPlayback() {
      if (!media) return;
      if (near && visible && !reduced && !failed && !document.hidden) {
        void media.play().catch(() => { if (!cancelled) setFailed(true); });
      } else media.pause();
    }
    syncPlayback();
    document.addEventListener('visibilitychange', syncPlayback);
    return () => { cancelled = true; document.removeEventListener('visibilitychange', syncPlayback); media.pause(); };
  }, [near, visible, reduced, failed]);

  return <div ref={frame} className="body-portrait body-portrait-motion">
    <img src="/images/portrait-ascii.webp" alt={body.portraitAlt} width="720" height="840" loading="lazy" decoding="async" />
    <video ref={video} src={near && !reduced && !failed ? '/images/portrait-ascii.mp4' : undefined}
      className={ready && !reduced && !failed ? 'is-ready' : ''} width="720" height="840"
      muted loop playsInline disablePictureInPicture preload="none" aria-hidden="true"
      onPlaying={() => setReady(true)}
      onError={() => setFailed(true)} />
  </div>;
}
