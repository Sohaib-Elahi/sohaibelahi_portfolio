import assert from 'node:assert/strict';
import { sample } from '../src/ascii/engine.ts';
const out = new Float32Array(3);
for (let scene = 0; scene < 4; scene++) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let layer = 0; layer < 11; layer++) for (let i = 0; i < 720; i++) {
    sample(scene, i / 720 * Math.PI * 2, layer, out);
    assert(out.every(Number.isFinite), `Non-finite sample in scene ${scene}`);
    assert(out.every(v => Math.abs(v) < 2), `Unbounded sample in scene ${scene}`);
    minX = Math.min(minX, out[0]); maxX = Math.max(maxX, out[0]);
    minY = Math.min(minY, out[1]); maxY = Math.max(maxY, out[1]);
  }
  assert(maxX - minX > 1 && maxY - minY > 0.8, `Collapsed silhouette in scene ${scene}`);
}
console.log('All four analytic forms have finite, bounded, non-collapsed silhouettes.');
