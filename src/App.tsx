import { useEffect, useRef, useState } from 'react';
import { site } from './content/site';
import images from './content/images.json';
import { createEngine, metrics, settings } from './ascii/engine';


type PortfolioImage = typeof images[number];
const ranges = { blend: [0, 1, 0.01], speed: [0, 2, 0.05], density: [0.2, 1.5, 0.05], threshold: [0.03, 0.5, 0.01], resolution: [0.7, 1.5, 0.1], radius: [50, 400, 10], radial: [0, 120, 2], tangential: [0, 100, 2], decay: [100, 1500, 50], ground: [0, 0.5, 0.01], samples: [180, 1080, 60], falloff: [0.6, 2, 0.05] } as const;
let audio: AudioContext | undefined;
function sound(enabled: boolean) {
  if (!enabled) return;
  audio ??= new AudioContext();
  void audio.resume();
  const oscillator = audio.createOscillator(), gain = audio.createGain();
  oscillator.connect(gain); gain.connect(audio.destination);
  oscillator.frequency.setValueAtTime(330, audio.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(180, audio.currentTime + 0.12);
  gain.gain.setValueAtTime(0.018, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.12);
  oscillator.start(); oscillator.stop(audio.currentTime + 0.12);
  oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
}
function Gallery({ items, direction }: { items: PortfolioImage[]; direction: 1 | -1 }) {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current!, rail = track.current!;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    void document.fonts.ready.then(async () => {
    const { gsap, ScrollTrigger } = await import('./lib/scroll');
    if (cancelled) return;
    const context = gsap.matchMedia();
    context.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
      const distance = () => Math.max(0, rail.scrollWidth - innerWidth + 96);
      function size() { element.style.height = `${innerHeight + distance() * 0.65}px`; }
      size();
      const trigger = ScrollTrigger.create({
        trigger: element, start: 'top top', end: () => `+=${distance() * 0.65}`,
        onRefreshInit: size,
        onUpdate: self => { rail.style.transform = `translateX(${-distance() * (direction === 1 ? self.progress : 1 - self.progress)}px)`; },
      });
      rail.style.transform = `translateX(${direction === 1 ? 0 : -distance()}px)`;
      return () => { trigger.kill(); element.style.height = ''; rail.style.transform = ''; };
    });
    cleanup = () => context.revert();
    });
    return () => { cancelled = true; cleanup?.(); };
  }, [direction]);
  return <section ref={root} className="gallery" aria-label={site.galleryLabel}>
    <div className="gallery-window"><div ref={track} className="gallery-track" tabIndex={0} onKeyDown={e => {
      if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.preventDefault();
      if (innerWidth < 900 || matchMedia('(prefers-reduced-motion: reduce)').matches) e.currentTarget.scrollBy({ left: e.key === 'ArrowRight' ? 360 : -360, behavior: 'instant' });
      else window.scrollBy({ top: e.key === 'ArrowRight' ? 420 : -420, behavior: 'instant' });
    }}>
      {items.map((image, i) => <picture key={image.src} className="work-image" style={{ aspectRatio: `${image.width}/${image.height}` }}>
        <source srcSet={`${image.src}-small.avif ${Math.min(image.width, 640)}w, ${image.src}.avif ${image.width}w`} sizes="(max-width: 899px) 86vw, 55vw" type="image/avif" />
        <img src={`${image.src}.webp`} srcSet={`${image.src}-small.webp ${Math.min(image.width, 640)}w, ${image.src}.webp ${image.width}w`} sizes="(max-width: 899px) 86vw, 55vw" width={image.width} height={image.height} alt={`${site.imageAlt} ${i + 1}`} loading="lazy" decoding="async" />
      </picture>)}
    </div></div>
  </section>;
}
export default function App() {
  const lab = typeof location !== 'undefined' && location.pathname === '/lab', type = typeof location !== 'undefined' && location.pathname === '/type';
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<ReturnType<typeof createEngine> | null>(null);
  const [theme, setTheme] = useState('dark');
  useEffect(() => { try { if (localStorage.getItem('theme') === 'light') setTheme('light'); } catch { /* Storage is optional. */ } }, []);
  const [soundEnabled, setSound] = useState(false);
  const [stats, setStats] = useState({ cost: 0, lit: 0 });
  const [pixelAxis, setPixelAxis] = useState(0);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#070606' : '#FAFAF8');
    try { localStorage.setItem('theme', theme); } catch { /* Storage is optional. */ }
  }, [theme]);
  useEffect(() => {
    if (type) return;
    let cancelled = false, stop: (() => void) | undefined, removeRefresh: (() => void) | undefined;
    void document.fonts.ready.then(async () => {
      const { startScroll, ScrollTrigger } = await import('./lib/scroll');
      if (cancelled || !canvas.current) return;
      engine.current = createEngine(canvas.current, lab);
      stop = startScroll(engine.current.draw, engine.current.resize);
      ScrollTrigger.addEventListener('refresh', engine.current.resize);
      const resize = engine.current.resize;
      removeRefresh = () => ScrollTrigger.removeEventListener('refresh', resize);
    });
    return () => { cancelled = true; stop?.(); removeRefresh?.(); engine.current?.dispose(); };
  }, [lab, type]);
  useEffect(() => {
    if (!lab) return;
    const timer = setInterval(() => setStats({ cost: metrics.cost, lit: metrics.lit }), 500);
    return () => clearInterval(timer);
  }, [lab]);
  function changeTheme() { setTheme(theme === 'dark' ? 'light' : 'dark'); sound(soundEnabled); }
  const themeButton = <button className="theme-toggle" onClick={changeTheme} aria-label={`${site.themeLabel}: ${theme === 'dark' ? site.light : site.dark}`}>{theme === 'dark' ? site.light : site.dark}<span className="theme-symbol" aria-hidden="true" /></button>;
  if (type) return <main className="type-proof">
    {themeButton}<h1>{site.type.title}</h1>
    <h2>{site.type.pixel}</h2><p className="pixel-specimen" style={{ fontVariationSettings: `"ELSH" ${pixelAxis}` }}>{site.type.specimen}</p>
    <label>{site.type.axis}<input type="range" min="0" max="100" value={pixelAxis} onChange={e => setPixelAxis(Number(e.target.value))} /></label>
    <h2>{site.type.sans}</h2><p>{site.type.specimen}</p><a href="/">{site.type.back}</a>
  </main>;
  return <>
    <canvas className="ascii-canvas" ref={canvas} aria-hidden="true" />
    {lab ? <main className="lab">
      <a href="/">{site.lab.back}</a><h1>{site.lab.title}</h1>{themeButton}
      <label>{site.lab.scene}<select defaultValue="0" onChange={e => { settings.scene = Number(e.target.value); engine.current?.draw(performance.now()); }}>{site.lab.scenes.map((name, i) => <option key={name} value={i}>{name}</option>)}</select></label>
      {(Object.keys(ranges) as (keyof typeof ranges)[]).map(key => <label key={key}>{site.lab.controls[key]}<input type="range" min={ranges[key][0]} max={ranges[key][1]} step={ranges[key][2]} defaultValue={settings[key]} onChange={e => { settings[key] = Number(e.target.value); if (key === 'resolution') engine.current?.resize(); engine.current?.draw(performance.now()); }} /></label>)}
      <output>{site.lab.cost}: {stats.cost.toFixed(2)} ms<br />{site.lab.lit}: {stats.lit}</output>
      <button onClick={() => { metrics.peak = 0; }}>{site.lab.reset}</button>
    </main> : <>
      <a className="skip" href="#main">{site.skip}</a>
      <header><a className="wordmark" href="#main" aria-label={site.fullName}>{site.name}<span aria-hidden="true">.</span></a>
        <nav aria-label={site.role}>{site.nav.map(link => <a key={link.href} href={link.href}>{link.text}</a>)}</nav>
        <div className="preferences"><button className="sound-toggle" aria-label={`${site.soundLabel}: ${soundEnabled ? site.soundOn : site.soundOff}`} aria-pressed={soundEnabled} onClick={() => { setSound(!soundEnabled); sound(!soundEnabled); }}><span className="control-label">{soundEnabled ? site.soundOn : site.soundOff}</span><span className="sound-symbol" aria-hidden="true"><i /><i /><i /></span></button>{themeButton}</div>
      </header>
      <main id="main">
        <section className="hero" data-scene="0">
          <div className="hero-copy"><h1><span>{site.headline[0]}</span><span>{site.headline[1]}</span></h1>
            <p>{site.intro}</p><a className="text-link" href="#work">{site.workLink}<span aria-hidden="true">↗</span></a>
          </div>
          <div className="hero-foot"><span>{site.role}</span><span className="pointer-hint">{site.interaction}</span><a href="#work">{site.scroll}<span aria-hidden="true">↓</span></a></div>
        </section>
        <div id="work" className="work" data-scene="1">
          <Gallery items={images.slice(0, 12)} direction={1} />
          <Gallery items={images.slice(12)} direction={-1} />
        </div>
        <section id="services" className="services section" data-scene="2">
          <h2>{site.servicesTitle}</h2><div className="service-list">{site.services.map(service => <div className="service" key={service.name}><h3>{service.name}</h3><p>{service.detail}</p></div>)}</div>
        </section>
        <section id="about" className="about section" data-scene="3">
          <h2>{site.aboutTitle}</h2><div className="about-layout">
            <picture className="portrait"><source srcSet="/images/portrait.avif" type="image/avif" /><img src="/images/portrait.webp" width="1000" height="1000" alt={site.portraitAlt} loading="lazy" /></picture>
            <div className="about-copy">{site.about.map(p => <p key={p}>{p}</p>)}<a className="text-link" href="/resume.pdf" target="_blank" rel="noreferrer">{site.resume}<span aria-hidden="true">↗</span></a>
              <ul className="experience">{site.experience.map(([company, place, period]) => <li key={company}><span>{company}{place && <small>{place}</small>}</span><span>{period}</span></li>)}</ul>
            </div>
          </div>
        </section>
      </main>
      <footer id="contact" data-scene="1"><a className="contact-name" href={`mailto:${site.email}`}>{site.fullName}<span aria-hidden="true">↗</span></a><div className="footer-bottom"><a className="email" href={`mailto:${site.email}`}>{site.email}</a>{site.socials.map(s => <a key={s.href} href={s.href} target="_blank" rel="noreferrer">{s.label}<span aria-hidden="true">↗</span></a>)}</div></footer>
    </>}
  </>;
}
