import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { execFileSync } from 'node:child_process';
import handler from '../api/notes.mjs';
import { noteStore } from '../server/notes-store.mjs';

const directory = await mkdtemp(join(tmpdir(), 'portfolio-notes-'));
process.env.NOTES_LOCAL_DIR = directory;
after(() => rm(directory, { recursive: true, force: true }));
async function request(method, data, options = {}) {
  const req = Readable.from([typeof data === 'string' ? data : JSON.stringify(data || {})]);
  Object.assign(req, { method, url: options.url || '/api/notes', headers: { host: 'localhost:4173', origin: options.origin || 'http://localhost:4173', 'content-type': 'application/json' }, socket: { remoteAddress: options.ip || randomUUID() } });
  const headers = {};
  let body;
  const res = { statusCode: 200, setHeader: (key, value) => { headers[key] = value; }, end: value => { body = JSON.parse(value); } };
  await handler(req, res);
  return { status: res.statusCode, body, headers };
}

test('shared collection survives a new process; only the owner can delete', async () => {
  const key = randomUUID();
  const saved = await request('POST', { key, text: '  Hello   world  ' });
  assert.equal(saved.status, 201); assert.equal(saved.body.note.text, 'Hello world');
  assert.deepEqual(Object.keys(saved.body.note).sort(), ['created', 'id', 'text']);
  const script = `import { noteStore } from './server/notes-store.mjs'; console.log(JSON.stringify(await noteStore().list()));`;
  const rows = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8', env: process.env }));
  assert.ok(rows.some(row => row.id === saved.body.note.id));
  assert.equal((await request('DELETE', { id: saved.body.note.id, key: randomUUID() })).status, 403);
  assert.equal((await request('DELETE', { id: saved.body.note.id, key })).status, 200);
  assert.ok(!(await request('GET')).body.notes.some(row => row.id === saved.body.note.id));
});
test('rejects invalid input, cross-origin writes and repeated submissions', async () => {
  const key = randomUUID();
  for (const text of ['', 'x'.repeat(33), '<script>', 'name@example.com', 'https://example.com', '\u200B']) {
    assert.equal((await request('POST', { text, key })).status, 400, text);
  }
  assert.equal((await request('POST', '{bad')).status, 400);
  assert.equal((await request('POST', { text: 'Hello', key }, { origin: 'https://elsewhere.example' })).status, 403);
  assert.equal((await request('GET', null, { url: '/api/notes?offset=-1' })).status, 400);
  assert.equal((await request('PATCH')).status, 405);
  const first = await request('POST', { text: 'سلام', key }, { ip: 'one-browser' });
  assert.equal(first.status, 201);
  const second = await request('POST', { text: 'Again', key }, { ip: 'one-browser' });
  assert.equal(second.status, 429); assert.equal(second.headers['Retry-After'], '60');
});
test('paginates without leaking ownership secrets', async () => {
  const store = noteStore();
  for (let i = 0; i < 23; i++) await store.save(`Entry ${i}`, randomUUID(), `visitor-${i}`);
  const first = await request('GET');
  const second = await request('GET', null, { url: `/api/notes?offset=${first.body.next}` });
  assert.equal(first.body.notes.length, 20); assert.equal(second.body.notes.length, 4);
  assert.equal(new Set([...first.body.notes, ...second.body.notes].map(n => n.id)).size, 24);
  assert.ok(!JSON.stringify(first.body).includes('secret'));
});
test('production fails closed when durable storage is not connected', () => {
  assert.throws(() => noteStore({ VERCEL: '1' }), /not connected/);
});
