import { useEffect, useRef, useState } from 'react';
import type { createTextArt } from '../ascii/text-art';
import '../text-playground.css';

type Note = { id: string; text: string; created: number };
const keyName = 'portfolio-text-key';
export default function TextPlayground() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const root = useRef<HTMLElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const art = useRef<ReturnType<typeof createTextArt> | null>(null);
  const latest = useRef('');
  const [text, setText] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [own, setOwn] = useState<string[]>([]);
  const [next, setNext] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [ready, setReady] = useState(false);
  function change(value: string) { const clipped = [...value].slice(0, 32).join(''); latest.current = clipped; setText(clipped); art.current?.setText(clipped); }
  async function load(offset = 0) {
    if (loadingRef.current) return;
    loadingRef.current = true; setLoading(true); setStatus('');
    try {
      const response = await fetch(`/api/notes?offset=${offset}`, { signal: AbortSignal.timeout(8000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setNotes(previous => offset ? [...previous, ...data.notes.filter((n: Note) => !previous.some(p => p.id === n.id))] : data.notes);
      setNext(data.next); setLoaded(true);
    } catch { setStatus('The collection couldn’t load. Your canvas still works.'); }
    finally { loadingRef.current = false; setLoading(false); }
  }
  useEffect(() => {
    let cancelled = false, dispose: (() => void) | undefined;
    const near = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      near.disconnect(); void load();
      void Promise.all([document.fonts.ready, import('../ascii/text-art'), import('../lib/scroll')]).then(([, module, { subscribeScene }]) => {
        if (cancelled) return;
        const renderer = module.createTextArt(canvas.current!); art.current = renderer; renderer.setText(latest.current); setReady(true);
        const unsubscribe = subscribeScene(renderer.draw);
        dispose = () => { unsubscribe(); renderer.dispose(); art.current = null; };
      });
    }, { rootMargin: '160px' });
    near.observe(root.current!);
    try { const saved = JSON.parse(localStorage.getItem('portfolio-text-owned') || '[]'); if (Array.isArray(saved)) setOwn(saved.filter(id => typeof id === 'string')); } catch { /* Saving still works when storage is unavailable. */ }
    return () => { cancelled = true; near.disconnect(); dispose?.(); };
  }, []);
  function visitorKey() {
    try { let key = localStorage.getItem(keyName); if (!key) { key = crypto.randomUUID(); localStorage.setItem(keyName, key); } return key; }
    catch { return null; }
  }
  function remember(ids: string[]) { setOwn(ids); try { localStorage.setItem('portfolio-text-owned', JSON.stringify(ids)); } catch { /* The server keeps the published entry. */ } }
  async function publish() {
    const key = visitorKey();
    if (!key) { setStatus('Enable browser storage to publish and manage your entry. PNG export still works.'); return; }
    setBusy(true); setStatus('');
    try {
      const response = await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, key }), signal: AbortSignal.timeout(8000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      remember([...own, data.note.id]); setNotes(previous => [data.note, ...previous]); setLoaded(true); setStatus('Saved.'); rail.current?.scrollTo({ left: 0, behavior: 'smooth' });
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Couldn’t save. Try again.'); }
    finally { setBusy(false); }
  }
  async function remove(id: string) {
    setBusy(true);
    try {
      const response = await fetch('/api/notes', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, key: visitorKey() }), signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error('Couldn’t remove this entry. Try again.');
      setNotes(previous => previous.filter(note => note.id !== id)); remember(own.filter(value => value !== id)); setStatus('Your entry was removed.');
    } catch (error) { setStatus((error as Error).message); } finally { setBusy(false); }
  }
  async function download() {
    const blob = await art.current?.exportPNG();
    if (!blob) { setStatus('Couldn’t export. Try again.'); return; }
    const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = 'a-little-more-you.png'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function slide(direction: number) {
    const element = rail.current;
    if (!element) return;
    element.scrollBy({ left: direction * element.clientWidth * .85, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  return <article className="text-playground" ref={root} aria-labelledby="text-playground-title">
    <h3 id="text-playground-title">A little more you.</h3>
    <div className="text-art-stage"><canvas ref={canvas} role="img" aria-label={`ASCII artwork: ${text || 'Your turn.'}`} /></div>
    <form className="text-playground-form" onSubmit={event => { event.preventDefault(); void publish(); }}>
      <div className="text-input"><input id="visitor-text" aria-label="Your text, up to 32 characters" value={text} onChange={event => change(event.target.value)} maxLength={64} placeholder="Type something…" autoComplete="off" spellCheck={false} /></div>
      <div className="text-playground-actions"><button type="button" className="body-text-button" disabled={!ready} onClick={() => void download()}>Save PNG <span aria-hidden="true">↓</span></button><button className="body-text-button" disabled={busy || !text.trim()}>{busy ? 'Saving…' : 'Leave it here'} <span aria-hidden="true">↗</span></button></div>
    </form>
    <div className="text-playground-note"><p>Saved words are public.</p><p role="status">{status}</p></div>
    <div className="visitor-collection" role="region" aria-label="Public visitor collection">
      <div className="collection-controls"><button className="body-text-button" disabled={loading} onClick={() => { rail.current?.scrollTo({ left: 0 }); void load(); }} aria-label="Refresh collection">↻</button><button onClick={() => slide(-1)} aria-label="Previous saved words">←</button><button onClick={() => slide(1)} aria-label="Next saved words">→</button></div>
      <div className="visitor-notes" ref={rail} tabIndex={0} aria-label="Saved words. Scroll horizontally to explore." onKeyDown={event => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); slide(event.key === 'ArrowLeft' ? -1 : 1); }
      }}>
        {!notes.length && <p className="collection-empty">{loading ? 'Loading…' : loaded ? 'Leave the first word.' : 'Collection unavailable. Try refresh.'}</p>}
        {notes.map(note => <div className="visitor-note" key={note.id}><button className="visitor-note-text" onClick={() => change(note.text)} aria-label={`Play with ${note.text}`}>{note.text}</button>{own.includes(note.id) && <button className="visitor-note-remove" disabled={busy} onClick={() => void remove(note.id)} aria-label={`Remove your entry: ${note.text}`}>Remove</button>}</div>)}
        {next !== null && <div className="visitor-note visitor-note-more"><button className="body-text-button" disabled={loading} onClick={() => void load(next)}>{loading ? 'Loading…' : 'More words'} <span aria-hidden="true">→</span></button></div>}
      </div>
    </div>
  </article>;
}
