import { playSound } from '../lib/sound';

/** A shaded tube swept along a lemniscate, rasterized into character cells. */
export function createRibbon(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d')!;
  const stage = canvas.parentElement!;
  const atlas = document.createElement('canvas');
  const ink = atlas.getContext('2d')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const alphabets = [' .,:;+xX#@', ' .·:+*#%@X', ' .:/=+*#%@'];
  let width = 1, height = 1, columns = 1, rows = 1, cell = 7;
  let depth = new Float32Array(0), light = new Float32Array(0);
  let theme = '', texture = 0, visible = true;
  let pointerX = -2, pointerY = -2, tilt = 0, targetTilt = 0;
  let lastTime = 0, pulseStart = -10000;
  let soundX = -1, soundY = -1, soundDistance = 0, lastPluck = 0;

  function makeAtlas() {
    theme = document.documentElement.dataset.theme || 'dark';
    const colors = theme === 'dark'
      ? ['#240806', '#5E1712', '#C9362E', '#F34D40', '#FF8A7E', '#FAFAF8']
      : ['#24100c', '#080606', '#9c1b10', '#c52b1b', '#050303', '#000000'];
    atlas.width = 10 * 20; atlas.height = colors.length * 20;
    ink.font = '400 17px "Geist Pixel"';
    ink.textAlign = 'center'; ink.textBaseline = 'middle';
    for (let color = 0; color < colors.length; color++) {
      ink.fillStyle = ink.strokeStyle = colors[color];
      ink.lineWidth = theme === 'light' ? 1 : .25;
      for (let glyph = 0; glyph < 10; glyph++) {
        // Slightly reinforce cached glyph edges without changing the shaded palette.
        ink.strokeText(alphabets[texture][glyph], glyph * 20 + 10, color * 20 + 10);
        ink.fillText(alphabets[texture][glyph], glyph * 20 + 10, color * 20 + 10);
      }
    }
  }
  function resize() {
    width = stage.clientWidth; height = stage.clientHeight;
    cell = Math.max(3, Math.min(6, width / 180));
    const dpr = Math.min(devicePixelRatio, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    columns = Math.ceil(width / cell); rows = Math.ceil(height / cell);
    depth = new Float32Array(columns * rows); light = new Float32Array(depth.length);
    makeAtlas(); draw(lastTime);
  }
  function draw(now: number) {
    if (!visible) return;
    lastTime = now;
    if (theme !== document.documentElement.dataset.theme) makeAtlas();
    const time = reduced.matches ? 0.8 : now * 0.00035;
    tilt += (targetTilt - tilt) * 0.045;
    depth.fill(-100); light.fill(0);
    context.clearRect(0, 0, width, height);
    const pulseAge = (now - pulseStart) / 1000;
    const pulse = reduced.matches ? 0 : Math.max(0, 1 - pulseAge / 1.5);
    const steps = width < 600 ? 600 : 1050;
    // One projection scale preserves the loop silhouette at every aspect ratio.
    const scale = Math.min(width * .48, height * .78);
    for (let i = 0; i < steps; i++) {
      const t = i / steps * Math.PI * 2;
      const x = Math.sin(t) * 0.81;
      const y = Math.sin(2 * t) * 0.30;
      const z = Math.cos(t) * 0.25;
      const dx = Math.cos(t) * 0.81, dy = Math.cos(2 * t) * 0.60;
      const length = Math.hypot(dx, dy);
      const nx = -dy / length, ny = dx / length;
      for (let j = 0; j < 42; j++) {
        const v = j / 42 * Math.PI * 2;
        const radius = 0.13 + Math.sin(t * 3 - time) * 0.012 + Math.sin(t * 5 - pulseAge * 9) * pulse * 0.025;
        const sx = x + nx * Math.cos(v) * radius;
        const sy = y + ny * Math.cos(v) * radius;
        const sz = z + Math.sin(v) * radius;
        const px = width * .5 + (sx + sz * tilt * .4) * scale;
        const py = height * .5 + (sy * 1.35 + sx * tilt * .08) * scale;
        const col = Math.floor(px / cell), row = Math.floor(py / cell);
        if (col < 0 || row < 0 || col >= columns || row >= rows) continue;
        const index = row * columns + col;
        if (sz < depth[index]) continue;
        depth[index] = sz;
        const distance = Math.hypot(px / width - pointerX, py / height - pointerY);
        const reveal = reduced.matches ? 0 : Math.max(0, 1 - distance / 0.22);
        const highlight = Math.pow(Math.max(0, Math.sin(v) * 0.75 - Math.cos(v) * 0.5), 2);
        const traveling = 0.5 + 0.5 * Math.cos(t * 3 - time * 2);
        light[index] = Math.min(1, 0.18 + highlight * 0.56 + traveling * 0.16 + reveal * 0.48);
      }
    }
    for (let i = 0; i < light.length; i++) {
      const value = light[i];
      if (!value) continue;
      const x = i % columns * cell, y = Math.floor(i / columns) * cell;
      const proximity = Math.max(0, 1 - Math.hypot(x / width - pointerX, y / height - pointerY) / 0.23);
      const shimmer = reduced.matches ? 0 : Math.floor(time * 6 + i * 0.17) % 3;
      const inkWeight = theme === 'light' ? 1 : 0;
      const glyph = Math.min(9, Math.max(1 + inkWeight, Math.floor(value * 9) + inkWeight + (proximity > 0.3 ? shimmer : 0)));
      const color = Math.min(5, Math.floor(value * 5.8));
      context.drawImage(atlas, glyph * 20, color * 20, 20, 20, x, y, cell + 0.6, cell + 0.6);
    }
  }
  function move(event: PointerEvent) {
    if (reduced.matches) return;
    const rect = stage.getBoundingClientRect();
    pointerX = (event.clientX - rect.left) / rect.width;
    pointerY = (event.clientY - rect.top) / rect.height;
    targetTilt = (pointerX - 0.5) * 0.65;
  }
  function leave() { pointerX = pointerY = -2; targetTilt = 0; }
  function changeTexture() { pulseStart = lastTime; texture = (texture + 1) % alphabets.length; makeAtlas(); draw(lastTime); }
  // Sound follows the existing artwork without changing its rendering or motion.
  function pluck(event: PointerEvent) {
    const rect = stage.getBoundingClientRect();
    const x = (event.clientX - rect.left) * width / rect.width;
    const y = (event.clientY - rect.top) * height / rect.height;
    soundDistance += soundX < 0 ? 25 : Math.hypot(x - soundX, y - soundY);
    soundX = x; soundY = y;
    const now = performance.now();
    if (soundDistance < 24 || now - lastPluck < 180) return;
    const col = Math.floor(x / cell), row = Math.floor(y / cell);
    for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) {
      const c = col + dx, r = row + dy;
      if (c >= 0 && c < columns && r >= 0 && r < rows && light[r * columns + c] > .12) {
        playSound('hover', Math.floor(x / width * 8));
        soundDistance = 0; lastPluck = now; return;
      }
    }
  }
  function silence() { soundX = soundY = -1; soundDistance = 0; }
  function tap() { playSound('art', texture); }
  stage.addEventListener('pointermove', pluck);
  stage.addEventListener('pointerleave', silence);
  stage.addEventListener('click', tap);
  stage.addEventListener('pointermove', move);
  stage.addEventListener('pointerleave', leave);
  stage.addEventListener('click', changeTexture);
  const observer = new ResizeObserver(resize); observer.observe(stage);
  const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) draw(lastTime); });
  visibility.observe(stage);
  resize();
  return { draw, resize, dispose() { stage.removeEventListener('pointermove', pluck); stage.removeEventListener('pointerleave', silence); stage.removeEventListener('click', tap); observer.disconnect(); visibility.disconnect(); stage.removeEventListener('pointermove', move); stage.removeEventListener('pointerleave', leave); stage.removeEventListener('click', changeTexture); } };
}
