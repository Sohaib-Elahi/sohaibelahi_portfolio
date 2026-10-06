import { createHmac, randomUUID, createHash } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const prefix = 'portfolio:notes:';
const digest = value => createHash('sha256').update(value).digest('hex');
const publicNote = ({ id, text, created }) => ({ id, text, created });
let database;
async function localDatabase() {
  if (!database) {
    const directory = process.env.NOTES_LOCAL_DIR || resolve('.local');
    await mkdir(directory, { recursive: true });
    const { DatabaseSync } = await import('node:sqlite');
    database = new DatabaseSync(resolve(directory, 'visitor-notes.sqlite'));
    database.exec('CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY, text TEXT NOT NULL, created INTEGER NOT NULL, secret TEXT NOT NULL); CREATE TABLE IF NOT EXISTS limits (ip TEXT PRIMARY KEY, until INTEGER NOT NULL);');
  }
  return database;
}

export function noteStore(env = process.env) {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  if ((!url || !token) && env.VERCEL) throw new Error('Storage is not connected yet.');
  async function redis(...command) {
    const response = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(command), signal: AbortSignal.timeout(5000) });
    const result = await response.json();
    if (!response.ok || result.error) throw new Error('Storage is temporarily unavailable.');
    return result.result;
  }
  return {
    async list(offset = 0) {
      if (!url || !token) {
        const db = await localDatabase();
        return db.prepare('SELECT id,text,created FROM notes ORDER BY created DESC,id DESC LIMIT 21 OFFSET ?').all(offset);
      }
      const ids = await redis('ZREVRANGE', `${prefix}index`, offset, offset + 20);
      if (!ids.length) return [];
      const rows = await redis('MGET', ...ids.map(id => prefix + id));
      return rows.filter(Boolean).map(row => publicNote(JSON.parse(row)));
    },
    async save(text, key, ip) {
      const note = { id: randomUUID(), text, created: Date.now(), secret: digest(key) };
      const ipHash = createHmac('sha256', token || 'local-preview').update(ip).digest('hex');
      if (!url || !token) {
        const db = await localDatabase();
        db.exec('BEGIN IMMEDIATE');
        try {
          const limit = db.prepare('SELECT until FROM limits WHERE ip=?').get(ipHash);
          if (limit && limit.until > Date.now()) { db.exec('ROLLBACK'); return null; }
          db.prepare('DELETE FROM limits WHERE until<=?').run(Date.now());
          db.prepare('INSERT OR REPLACE INTO limits VALUES (?,?)').run(ipHash, Date.now() + 60000);
          db.prepare('INSERT INTO notes VALUES (?,?,?,?)').run(note.id, text, note.created, note.secret);
          db.exec('COMMIT');
        } catch (e) { db.exec('ROLLBACK'); throw e; }
      } else {
        const saved = await redis('EVAL', `if not redis.call('SET',KEYS[1],'1','NX','EX',60) then return 0 end redis.call('SET',KEYS[2],ARGV[1]) redis.call('ZADD',KEYS[3],ARGV[2],ARGV[3]) return 1`, 3, `${prefix}limit:${ipHash}`, prefix + note.id, `${prefix}index`, JSON.stringify(note), note.created, note.id);
        if (!saved) return null;
      }
      return publicNote(note);
    },
    async remove(id, key) {
      if (!url || !token) {
        const db = await localDatabase();
        return db.prepare('DELETE FROM notes WHERE id=? AND secret=?').run(id, digest(key)).changes > 0;
      }
      return Boolean(await redis('EVAL', `local raw=redis.call('GET',KEYS[1]) if not raw then return 0 end if cjson.decode(raw).secret~=ARGV[1] then return 0 end redis.call('DEL',KEYS[1]) redis.call('ZREM',KEYS[2],ARGV[2]) return 1`, 2, prefix + id, `${prefix}index`, digest(key), id));
    },
  };
}
