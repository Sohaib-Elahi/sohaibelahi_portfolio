import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { personal } from '../content/personal';
import { StarIcon, PlaneIcon } from './DecorativeIcons';
import { playSound } from '../lib/sound';
import '../personal.css';
const TextPlayground = lazy(() => import('./TextPlayground'));


function TextPlaygroundSlot() {
  const slot = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setNear(true); observer.disconnect(); }
    }, { rootMargin: '400px' });
    observer.observe(slot.current!);
    return () => observer.disconnect();
  }, []);
  return <div ref={slot} style={{ minHeight: 600 }}>{near && <Suspense fallback={null}><TextPlayground /></Suspense>}</div>;
}

function PakistanClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const update = () => setNow(new Date());
    update(); const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);
  const options = { timeZone: 'Asia/Karachi' };
  const clock = now ? new Intl.DateTimeFormat('en-US', { ...options, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).formatToParts(now) : [];
  const clockDigits = clock.filter(part => part.type !== 'dayPeriod').map(part => part.value).join('').trim();
  const period = clock.find(part => part.type === 'dayPeriod')?.value;
  return <article className="personal-card personal-clock">
    <div className="personal-card-top"><span>Current location</span></div>
    <h3>Pakistan</h3>
    <time dateTime={now?.toISOString()}><span>{now ? clockDigits : '––:––:––'}</span>{period && <span className="clock-period"> {period}</span>}</time>
    <div className="personal-clock-bottom"><span>{now ? new Intl.DateTimeFormat('en-GB', { ...options, weekday: 'long', day: 'numeric', month: 'short' }).format(now) : 'Local time'}</span><span>UTC +5</span></div>
  </article>;
}

function Cinema() {
  const [movie, setMovie] = useState(0);
  return <article className="personal-card personal-cinema">
    <div className="personal-card-top"><span>Favourite films</span><StarIcon /></div>
    <svg className="cinema-art" viewBox="0 0 260 110" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      {movie ? <><path d="M155 20a34 34 0 1 0 36 50 32 32 0 0 1-36-50Z" /><path className="art-accent" d="M67 35v10m-5-5h10M207 72v8m-4-4h8M94 84h2" /></> : <><circle cx="130" cy="55" r="37" /><ellipse className="art-accent" cx="130" cy="55" rx="105" ry="9" transform="rotate(-12 130 55)" /><path opacity=".3" d="M25 96h210" /></>}
    </svg>
    <h3 aria-live="polite">{personal.movies[movie]}</h3>
    <div className="cinema-switch" role="group" aria-label="Choose a favourite film">{personal.movies.map((title, i) => <button key={title} aria-pressed={movie === i} onClick={() => { setMovie(i); playSound('art', i); }}>{title}</button>)}</div>
  </article>;
}

function Music() {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  async function togglePlayback() {
    const media = audio.current;
    if (!media) return;
    if (!media.paused || loading) { media.pause(); setLoading(false); return; }
    setError(false); setLoading(true);
    if (media.error) media.load();
    try { await media.play(); }
    catch (cause) {
      if (!(cause instanceof DOMException && cause.name === 'AbortError')) setError(true);
      setLoading(false);
    }
  }
  return <article className={`personal-card personal-music${playing ? ' is-playing' : ''}`}>
    <div className="personal-card-top"><span>Last listened to</span><span aria-hidden="true">♫</span></div>
    <audio ref={audio} src={personal.audio} preload="none"
      onPlaying={() => { setPlaying(true); setLoading(false); setError(false); }}
      onPause={() => { setPlaying(false); setLoading(false); }}
      onEnded={() => { setPlaying(false); setLoading(false); }}
      onWaiting={() => setLoading(true)}
      onError={() => { setPlaying(false); setLoading(false); setError(true); }} />
    <div className="music-track"><div className="music-record" aria-hidden="true"><i /></div><div><h3>{personal.song}</h3><p>{personal.artist}</p></div>
      <button className="music-play" aria-label={`${playing || loading ? 'Pause' : 'Play'} K. by Cigarettes After Sex`} aria-pressed={playing} onClick={() => void togglePlayback()}><svg className="decoration-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor"><path d={playing || loading ? 'M6 4h4v16H6zM14 4h4v16h-4z' : 'M7 4v16l13-8z'} /></svg></button></div>
    <div className="music-bottom"><span role="status">{error ? 'Couldn’t load. Retry.' : loading ? 'Loading song…' : playing ? 'Playing' : 'Listen to K.'}</span><span className="music-wave" aria-hidden="true">{Array.from({length:16},(_,i)=><i key={i} style={{height: `${5 + (i * 7 % 19)}px`, animationDelay: `${i * -83}ms`}} />)}</span></div>
  </article>;
}

function FavouriteQuote() {
  return <article className="personal-card personal-quote">
    <div className="personal-card-top"><span>Favourite quote</span><span aria-hidden="true"><StarIcon /></span></div>
    <span className="quote-mark" aria-hidden="true">“</span>
    <blockquote>{personal.quote}</blockquote>
  </article>;
}

function Travel() {
  const [destination, setDestination] = useState(0);
  return <article className="personal-card personal-travel">
    <div className="personal-card-top"><span>Places I dream of</span><span aria-hidden="true">↗</span></div>
    <svg className="travel-landmark" viewBox="0 0 260 130" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <path opacity=".25" d="M20 112h220" />
      {destination === 0 ? <><path d="M38 112V75h28v37m130 0V65h24v47M82 112V57h21v55m51 0V46h26v66" opacity=".45" /><path className="art-accent" d="M112 112V78h5V51h6V28h6V8m2 104V28h6v23h6v27h5v34" /></> : destination === 1 ? <><path d="m25 112 52-66 52 66M77 46l15 66m58 0 37-46 38 46" opacity=".45" /><path className="art-accent" d="m82 112 66-90 65 90M148 22l20 90" /></> : <><path d="M38 112V69l9-28 9 28v43m148 0V69l9-28 9 28v43M70 112V62l10-35 10 35v50m80 0V62l10-35 10 35v50" opacity=".45" /><path className="art-accent" d="M101 112V72l12-46 10 46V16l7-12 7 12v56l10-46 12 46v40" /></>}
    </svg>
    <div className="travel-route"><span>Pakistan <PlaneIcon /></span><h3 aria-live="polite">{personal.destinations[destination]}</h3></div>
    <div className="travel-choices" role="group" aria-label="Explore dream destinations">{personal.destinations.map((place, i) => <button aria-pressed={destination === i} key={place} onClick={() => { setDestination(i); playSound('tap', i); }}>{place}</button>)}</div>
  </article>;
}

function PixelPad() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pixels = useRef(new Set<number>());
  function draw() {
    const context = canvas.current?.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, 280, 180);
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--color-red-400').trim();
    for (let y = 0; y < 18; y++) for (let x = 0; x < 28; x++) {
      context.fillStyle = pixels.current.has(y * 28 + x) ? accent : '#ffffff12';
      context.fillRect(x * 10 + 2, y * 10 + 2, 6, 6);
    }
  }
  useEffect(() => {
    // A small butterfly starts the page; visitors can make it their own.
    for (let y = 4; y < 14; y++) for (let x = 5; x < 23; x++) {
      const dx = Math.abs(x - 14), dy = y - 8;
      if (dx < 1 || (dx > 1 && dx < 8 - Math.abs(dy) && (x + y) % 3 !== 0)) pixels.current.add(y * 28 + x);
    }
    draw();
  }, []);
  function paint(event: PointerEvent<HTMLButtonElement>) {
    if (event.type === 'pointermove' && !event.buttons) return;
    const rect = canvas.current!.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / rect.width * 28);
    const y = Math.floor((event.clientY - rect.top) / rect.height * 18);
    if (x >= 0 && x < 28 && y >= 0 && y < 18) { pixels.current.add(y * 28 + x); draw(); }
  }
  return <article className="personal-card personal-pixels"><div className="personal-card-top"><span>A little room to play</span><span aria-hidden="true"><StarIcon /></span></div>
    <button className="pixel-pad" aria-label="Pixel doodle pad. Drag to draw, or press Enter to add a spark." onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); paint(event); playSound('art'); }} onPointerMove={paint} onClick={event => {
      if (event.detail !== 0) return;
      const x = 2 + Math.floor(Math.random() * 24), y = 2 + Math.floor(Math.random() * 14);
      [0, 1, -1, 28, -28].forEach(offset => pixels.current.add(y * 28 + x + offset)); draw(); playSound('art');
    }}><canvas width="280" height="180" ref={canvas} aria-hidden="true" /></button>
    <h3>Leave a little mark.</h3><div className="pixel-pad-bottom"><span>Drag to draw</span><button onClick={() => { pixels.current.clear(); draw(); playSound(); }}>Clear</button></div>
  </article>;
}

export function PersonalBento() {
  return <section id="personal" className="body-section personal-section" aria-labelledby="personal-title">
    <div className="body-section-heading"><h2 id="personal-title">{personal.title}</h2><p>{personal.intro}</p></div>
    <div className="personal-grid"><PakistanClock /><Music /><Cinema /><FavouriteQuote /><Travel /><PixelPad /></div>
    <TextPlaygroundSlot />
  </section>;
}
