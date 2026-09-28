import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { personal } from '../content/personal';
import { StarIcon, PlaneIcon } from './DecorativeIcons';
import { playSound } from '../lib/sound';
import '../personal.css';

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
  function move(event: PointerEvent<HTMLDivElement>) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--scene-x', `${((event.clientX - rect.left) / rect.width - .5) * 18}px`);
    event.currentTarget.style.setProperty('--scene-y', `${((event.clientY - rect.top) / rect.height - .5) * 12}px`);
  }
  return <article className="personal-card personal-cinema">
    <div className={`cinema-scene ${movie ? 'cinema-night' : 'cinema-space'}`} onPointerMove={move} onPointerLeave={event => { event.currentTarget.style.setProperty('--scene-x', '0px'); event.currentTarget.style.setProperty('--scene-y', '0px'); }}>
      <div className="personal-card-top"><span>Favourite films</span><span aria-hidden="true"><StarIcon /></span></div>
      <div className="cinema-universe" aria-hidden="true"><div className="cinema-orbit" /><div className="cinema-horizon" />
        <div className="cinema-stars">{Array.from({ length: 28 }, (_, i) => <i key={i} style={{ left: `${i * 37 % 100}%`, top: `${i * 23 % 80}%`, opacity: .2 + (i % 4) * .2 }} />)}</div>
      </div>
      <div className="cinema-title" aria-live="polite"><span>{movie ? 'A little city of stars.' : 'Somewhere beyond the ordinary.'}</span><h3>{personal.movies[movie]}</h3></div>
    </div>
    <div className="cinema-switch" role="group" aria-label="Choose a favourite film">{personal.movies.map((title, i) => <button key={title} aria-pressed={movie === i} onClick={() => { setMovie(i); playSound('art', i); }}><span aria-hidden="true">{i ? '✦' : '◌'}</span>{title}</button>)}</div>
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
      <button className="music-play" aria-label={`${playing || loading ? 'Pause' : 'Play'} K. by Cigarettes After Sex`} aria-pressed={playing} onClick={() => void togglePlayback()}><span aria-hidden="true">{playing || loading ? 'Ⅱ' : '▶'}</span></button></div>
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
    <div className={`travel-landmark travel-place-${destination}`} aria-hidden="true"><i /><i /><i /><i /><i /><span /></div>
    <div className="travel-route"><span>Pakistan</span><span aria-hidden="true">··········· <PlaneIcon /> ···········</span><h3 aria-live="polite">{personal.destinations[destination]}</h3></div>
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
  </section>;
}
