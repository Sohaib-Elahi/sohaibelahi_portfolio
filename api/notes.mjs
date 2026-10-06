import { noteStore } from '../server/notes-store.mjs';

export default async function handler(req, res) {
  const send = (status, data) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(data)); };
  if (!['GET', 'POST', 'DELETE'].includes(req.method)) { res.setHeader('Allow', 'GET, POST, DELETE'); return send(405, { error: 'Method not allowed.' }); }
  try {
    const store = noteStore();
    if (req.method === 'GET') {
      const offset = Number(new URL(req.url, 'http://localhost').searchParams.get('offset') || 0);
      if (!Number.isSafeInteger(offset) || offset < 0 || offset > 1000000) return send(400, { error: 'Invalid page.' });
      const rows = await store.list(offset);
      return send(200, { notes: rows.slice(0, 20), next: rows.length > 20 ? offset + 20 : null });
    }
    // Mutations come only from this site's JSON form, never cross-origin forms.
    if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return send(403, { error: 'Use the form on this website.' });
    if (!req.headers['content-type']?.startsWith('application/json')) return send(415, { error: 'JSON is required.' });
    let data = req.body;
    if (!data) { let raw = ''; for await (const part of req) { raw += part; if (Buffer.byteLength(raw) > 2048) return send(413, { error: 'That entry is too long.' }); } data = JSON.parse(raw); }
    if (typeof data === 'string') data = JSON.parse(data);
    if (!data || typeof data.key !== 'string' || !/^[a-f0-9-]{36}$/.test(data.key)) return send(400, { error: 'Please reload and try again.' });
    if (req.method === 'DELETE') {
      if (typeof data.id !== 'string' || !/^[a-f0-9-]{36}$/.test(data.id)) return send(400, { error: 'Invalid entry.' });
      return await store.remove(data.id, data.key) ? send(200, { removed: true }) : send(403, { error: 'This entry belongs to another visitor.' });
    }
    if (typeof data.text !== 'string') return send(400, { error: 'Write something first.' });
    const text = data.text.normalize('NFC').replace(/\s+/gu, ' ').trim();
    if (!text || [...text].length > 32 || /[\p{Cc}\p{Cf}<>]/u.test(text)) return send(400, { error: 'Use 1–32 visible characters.' });
    if (/https?:|www\.|@/iu.test(text)) return send(400, { error: 'Please leave out links and contact details.' });
    const ip = process.env.VERCEL ? String(req.headers['x-vercel-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0] : req.socket?.remoteAddress || 'local';
    const note = await store.save(text, data.key, ip);
    if (!note) { res.setHeader('Retry-After', '60'); return send(429, { error: 'Give it a minute before adding another.' }); }
    return send(201, { note });
  } catch (error) {
    if (error instanceof SyntaxError) return send(400, { error: 'Invalid entry.' });
    return send(503, { error: 'The collection is unavailable. Your text is still here; try again shortly.' });
  }
}
