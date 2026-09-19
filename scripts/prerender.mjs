import { createServer } from 'vite';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { readFile, writeFile } from 'node:fs/promises';
const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
try {
  const { default: App } = await server.ssrLoadModule('/src/App.tsx');
  const html = renderToString(createElement(App));
  const path = new URL('../dist/index.html', import.meta.url);
  const template = await readFile(path, 'utf8');
  await writeFile(path, template.replace('<div id="root"></div>', `<div id="root">${html}</div>`));
  console.log('Prerendered portfolio content for immediate first paint.');
} finally { await server.close(); }
