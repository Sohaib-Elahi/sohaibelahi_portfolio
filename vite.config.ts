import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';
import tailwindcss from '@tailwindcss/vite';
const notesPreview = {
  name: 'notes-preview',
  configureServer: installNotes,
  configurePreviewServer: installNotes,
};
function installNotes(server: { middlewares: { use: (handler: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void } }) {
  server.middlewares.use((req, res, next) => {
    if (req.url?.split('?')[0] !== '/api/notes') return next();
    // Local SQLite preview uses the same HTTP handler as the hosted collection.
    const modulePath = pathToFileURL(resolve('api/notes.mjs')).href;
    void import(modulePath).then(({ default: handler }) => handler(req, res)).catch(() => { res.statusCode = 503; res.end(JSON.stringify({ error: 'The collection is unavailable.' })); });
  });
}
export default defineConfig({ plugins: [react(), tailwindcss(), notesPreview], ssr: { noExternal: ['gsap', 'lenis'] }, build: { minify: 'terser', terserOptions: { compress: { passes: 3 } } } });
