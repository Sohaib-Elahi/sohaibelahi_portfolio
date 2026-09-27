import { useCallback, useEffect, useRef, useState } from 'react';
import { site } from './content/site';
import { PortfolioBody, PortfolioFooter } from './components/PortfolioBody';
import { setSoundEnabled, playSound, installSoundUnlock } from './lib/sound';
import { createEngine, metrics, settings } from './ascii/engine';
import { createRibbon } from './ascii/ribbon';
import { Landing, Navigation } from './components/Landing';
import './landing.css';
import { EntranceReveal } from './components/EntranceReveal';


const ranges = { blend: [0, 1, 0.01], speed: [0, 2, 0.05], density: [0.2, 1.5, 0.05], threshold: [0.03, 0.5, 0.01], resolution: [0.7, 1.5, 0.1], radius: [50, 400, 10], radial: [0, 120, 2], tangential: [0, 100, 2], decay: [100, 1500, 50], ground: [0, 0.5, 0.01], samples: [180, 1080, 60], falloff: [0.6, 2, 0.05] } as const;
export default function App() {
  const lab = typeof location !== 'undefined' && location.pathname === '/lab', type = typeof location !== 'undefined' && location.pathname === '/type';
  const [entry, setEntry] = useState<'pending' | 'revealing' | 'ready'>('pending');
  const reveal = useCallback(() => setEntry('revealing'), []);
  const completeEntry = useCallback(() => setEntry('ready'), []);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<ReturnType<typeof createEngine> | null>(null);
  const [theme, setTheme] = useState('dark');
  useEffect(() => { try { if (localStorage.getItem('theme') === 'light') setTheme('light'); } catch { /* Storage is optional. */ } }, []);
  const [soundEnabled, setSound] = useState(true);
  useEffect(installSoundUnlock, []);
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
      engine.current = lab ? createEngine(canvas.current, true) : createRibbon(canvas.current);
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
  function changeTheme() { setTheme(theme === 'dark' ? 'light' : 'dark'); playSound(); }
  const themeButton = <button className="theme-toggle" onClick={changeTheme} aria-label={`${site.themeLabel}: ${theme === 'dark' ? site.light : site.dark}`}>{theme === 'dark' ? site.light : site.dark}<span className="theme-symbol" aria-hidden="true" /></button>;
  if (type) return <main className="type-proof">
    {themeButton}<h1>{site.type.title}</h1>
    <h2>{site.type.pixel}</h2><p className="pixel-specimen" style={{ fontVariationSettings: `"ELSH" ${pixelAxis}` }}>{site.type.specimen}</p>
    <label>{site.type.axis}<input type="range" min="0" max="100" value={pixelAxis} onChange={e => setPixelAxis(Number(e.target.value))} /></label>
    <h2>{site.type.sans}</h2><p>{site.type.specimen}</p><a href="/">{site.type.back}</a>
  </main>;
  return <>
    {lab && <canvas className="ascii-canvas" ref={canvas} aria-hidden="true" />}
    {lab ? <main className="lab">
      <a href="/">{site.lab.back}</a><h1>{site.lab.title}</h1>{themeButton}
      <label>{site.lab.scene}<select defaultValue="0" onChange={e => { settings.scene = Number(e.target.value); engine.current?.draw(performance.now()); }}>{site.lab.scenes.map((name, i) => <option key={name} value={i}>{name}</option>)}</select></label>
      {(Object.keys(ranges) as (keyof typeof ranges)[]).map(key => <label key={key}>{site.lab.controls[key]}<input type="range" min={ranges[key][0]} max={ranges[key][1]} step={ranges[key][2]} defaultValue={settings[key]} onChange={e => { settings[key] = Number(e.target.value); if (key === 'resolution') engine.current?.resize(); engine.current?.draw(performance.now()); }} /></label>)}
      <output>{site.lab.cost}: {stats.cost.toFixed(2)} ms<br />{site.lab.lit}: {stats.lit}</output>
      <button onClick={() => { metrics.peak = 0; }}>{site.lab.reset}</button>
    </main> : <>
      <div className="site-content" data-entry={entry}>
      <a className="skip" href="#main">{site.skip}</a>
      <Navigation preferences={<>
        <button className="sound-toggle" aria-label={`${site.soundLabel}: ${soundEnabled ? site.soundOn : site.soundOff}`} aria-pressed={soundEnabled} onClick={() => { setSound(!soundEnabled); setSoundEnabled(!soundEnabled); }}><span className="sound-symbol" aria-hidden="true"><i /><i /><i /></span></button>
        {themeButton}
      </>} />
      <main id="main">
        <Landing canvasRef={canvas} />
        <PortfolioBody />
      </main>
      <PortfolioFooter soundEnabled={soundEnabled} onSoundToggle={() => { setSound(!soundEnabled); setSoundEnabled(!soundEnabled); }} />
      </div>
      {entry !== 'ready' && <EntranceReveal onReveal={reveal} onComplete={completeEntry} />}
    </>}
  </>;
}
