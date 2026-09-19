export const settings = {
  scene: -1, blend: 0, speed: 0.55, density: 1.2, threshold: 0.12, resolution: 1,
  radius: 190, radial: 42, tangential: 24, decay: 600, ground: 0.1,
  samples: 720, falloff: 0.95,
};
export const metrics = { cost: 0, peak: 0, lit: 0, frames: 0, scene: 0 };
const TAU = Math.PI * 2;
const glyphs = ' .:;+=x*#%@';
if (import.meta.env?.DEV && typeof window !== 'undefined') Object.assign(window, { portfolio: { metrics, settings } });
const darkInk = ['#240806', '#5E1712', '#C9362E', '#F0584C', '#FF8A7E'];
const lightInk = ['#070606', '#070606', '#070606', '#C9362E', '#C9362E'];

// Stateless curves. All sample coordinates are overwritten, never integrated.
export function sample(scene: number, t: number, layer: number, out: Float32Array) {
  if (scene === 0) {
    const r = Math.exp(Math.cos(t)) - 2 * Math.cos(4 * t) - Math.pow(Math.sin(t / 12), 5);
    const contraction = 1 - layer * 0.065;
    out[0] = Math.sin(t) * r * contraction / 3;
    out[1] = -Math.cos(t) * r * contraction / 3;
    out[2] = Math.sin(t * 3 + layer * 0.4) * 0.35;
  } else if (scene === 1) {
    const r = 0.66 + 0.23 * Math.cos(3 * t + layer * 0.13);
    out[0] = r * Math.cos(2 * t);
    out[1] = r * Math.sin(2 * t) * 0.68 + 0.18 * Math.sin(3 * t);
    out[2] = Math.sin(3 * t + layer * 0.13);
  } else if (scene === 2) {
    const r = (0.58 + 0.34 * Math.cos(5 * t)) * (1 - layer * 0.065);
    out[0] = r * Math.cos(t);
    out[1] = r * Math.sin(t);
    out[2] = Math.sin(5 * t + layer * 0.35);
  } else {
    out[0] = t / Math.PI - 1;
    out[1] = (layer - 5) * 0.10 + Math.sin(t * 1.4 + layer * 0.15) * 0.18 + Math.sin(t * 3 - layer * 0.12) * 0.09;
    out[2] = Math.cos(t * 2 + layer * 0.3);
  }
}

export function createEngine(canvas: HTMLCanvasElement, lab = false) {
  const ctx = canvas.getContext('2d', { alpha: true })!;
  const atlas = document.createElement('canvas');
  const ink = atlas.getContext('2d')!;
  const point = new Float32Array(3);
  const lowEnd = navigator.hardwareConcurrency <= 4;
  let values = new Float32Array(0);
  let stride = 1;
  let width = 0, height = 0, cell = 7, cols = 0, rows = 0, dpr = 1;
  let rules = new Float32Array(0);
  let mouseX = -1000, mouseY = -1000, velocity = 0, lastMove = -10000;
  let lastX = 0, lastY = 0, theme = '';
  let sceneNodes: HTMLElement[] = [], sceneTops: number[] = [];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const born = performance.now();
  function makeAtlas() {
    theme = document.documentElement.dataset.theme || 'dark';
    atlas.width = glyphs.length * 24; atlas.height = 5 * 24;
    ink.font = '18px "Geist Sans"'; ink.textAlign = 'center'; ink.textBaseline = 'middle';
    for (let color = 0; color < 5; color++) {
      ink.fillStyle = (theme === 'dark' ? darkInk : lightInk)[color];
      for (let g = 0; g < glyphs.length; g++) ink.fillText(glyphs[g], g * 24 + 12, color * 24 + 12);
    }
  }
  function resize() {
    width = innerWidth; height = innerHeight;
    const mobile = width < 768;
    cell = (mobile ? 9 : width < 1100 ? 7.5 : 7) * settings.resolution;
    dpr = Math.min(devicePixelRatio, lowEnd ? 1 : mobile ? 1.25 : 1.5);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(width / cell); rows = Math.ceil(height / cell);
    values = new Float32Array(cols * rows);
    stride = Math.max(1, Math.floor(values.length * 0.618));
    function gcd(a: number, b: number): number { while (b) { const t = b; b = a % b; a = t; } return a; }
    while (gcd(stride, values.length) !== 1) stride++;
    sceneNodes = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]'));
    sceneTops = sceneNodes.map(n => n.getBoundingClientRect().top + scrollY);
    const elements = document.querySelectorAll<HTMLElement>('.service');
    rules = new Float32Array(elements.length * 3);
    elements.forEach((n, i) => { const r = n.getBoundingClientRect(); rules[i * 3] = r.left; rules[i * 3 + 1] = r.top + scrollY; rules[i * 3 + 2] = r.width; });
    makeAtlas();
    if (reduced.matches) draw(performance.now());
  }
  function move(e: PointerEvent) {
    const now = performance.now();
    velocity = Math.min(2, Math.hypot(e.clientX - lastX, e.clientY - lastY) / Math.max(8, now - lastMove));
    mouseX = lastX = e.clientX; mouseY = lastY = e.clientY; lastMove = now;
  }
  function draw(now: number) {
    const start = performance.now();
    if (theme !== document.documentElement.dataset.theme) makeAtlas();
    values.fill(0);
    ctx.clearRect(0, 0, width, height);
    const mobile = width < 768;
    const budget = mobile ? 1100 : 2600;
    const time = reduced.matches ? 1 : now * 0.001 * settings.speed;
    let scene = settings.scene >= 0 ? settings.scene : 0;
    let nextScene = scene, transition = 0;
    if (lab) { scene = Math.max(0, settings.scene); nextScene = (scene + 1) % 4; transition = settings.blend; }
    if (!lab && settings.scene < 0) {
      const view = scrollY + height * 0.5;
      for (let i = 0; i < sceneNodes.length; i++) {
        if (view >= sceneTops[i]) scene = Number(sceneNodes[i].dataset.scene);
        else {
          const distance = sceneTops[i] - view;
          if (distance < height * 0.15) { nextScene = Number(sceneNodes[i].dataset.scene); transition = 1 - distance / (height * 0.15); }
          break;
        }
      }
    }
    metrics.scene = scene;
    const age = Math.max(0, (now - lastMove) / settings.decay);
    const force = reduced.matches ? 0 : Math.exp(-age * 3);
    for (let pass = 0; pass < (transition > 0 && nextScene !== scene ? 2 : 1); pass++) {
      const shape = pass === 0 ? scene : nextScene;
      const entrance = !lab && shape === 0 && !reduced.matches ? 1 - Math.pow(1 - Math.min(1, Math.max(0, (now - born) / 900)), 3) : 1;
      const amount = (pass === 0 ? 1 - transition : transition) * entrance;
      const size = Math.min(width * (mobile ? 0.36 : 0.3), height * (mobile ? 0.22 : 0.33));
      const cx = lab ? width * (mobile ? 0.5 : 0.62) : width * (mobile ? 0.5 : shape >= 2 ? 0.26 : 0.75);
      const cy = lab ? height * 0.46 : height * (mobile ? 0.34 : shape >= 2 ? 0.66 : 0.5);
      const layers = mobile ? 6 : 9;
      const steps = Math.round(settings.samples * (lowEnd ? 0.5 : mobile ? 0.75 : 1));
      for (let layer = 0; layer < layers; layer++) {
        for (let i = 0; i < steps; i++) {
          const t = i / steps * TAU;
          sample(shape, t, layer, point);
          let x = cx + point[0] * size;
          let y = cy + point[1] * size;
          const dx = x - mouseX, dy = y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
          const influence = Math.exp(-dist * dist / (settings.radius * settings.radius)) * force;
          x += (dx / dist * settings.radial - dy / dist * velocity * settings.tangential) * influence;
          y += (dy / dist * settings.radial + dx / dist * velocity * settings.tangential) * influence;
          const gx = x / cell, gy = y / cell;
          const ix = Math.round(gx), iy = Math.round(gy);
          const wave = 0.68 + 0.16 * Math.sin(t * 8 - time * 2 + layer * 0.32) + 0.1 * Math.sin(t * 13 + time * 1.1);
          const brightness = wave * (0.78 + point[2] * 0.2) * settings.density;
          for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) {
            const col = ix + xx, row = iy + yy;
            if (col < 0 || row < 0 || col >= cols || row >= rows) continue;
            const distance = Math.hypot(gx - col, gy - row);
            const value = Math.max(0, 1 - distance / (settings.falloff + (1 - amount) * 0.5)) * brightness;
            const noise = ((col * 73 + row * 137) % 101) / 101;
            if (noise > amount) continue;
            const index = row * cols + col;
            if (value > values[index]) values[index] = value;
          }
        }
      }
    }
    let lit = 0;
    // Visit alternating rows to distribute the hard ink ceiling over the figure.
    const count = values.length;
    for (let n = 0; n < count && lit < budget - 80; n++) {
      const index = (n * stride) % count;
      const value = values[index];
      if (value < settings.threshold) continue;
      const glyph = Math.min(glyphs.length - 1, 2 + Math.floor(value * 9));
      const color = Math.min(4, Math.max(2, Math.floor(value * 7)));
      ctx.drawImage(atlas, glyph * 24, color * 24, 24, 24, index % cols * cell, Math.floor(index / cols) * cell, cell, cell);
      lit++;
    }
    // Ground lives on the coarser grid and stays subordinate to the figure.
    if (settings.ground > 0) for (let row = 0; row < rows && lit < budget - 80; row += 2) for (let col = 0; col < cols && lit < budget - 80; col += 2) {
      if ((col * 17 + row * 31) % 97 !== 0 || col < cols * 0.38) continue;
      ctx.globalAlpha = settings.ground;
      ctx.drawImage(atlas, 2 * 24, 24, 24, 24, col * cell, row * cell, cell, cell);
      lit++;
    }
    ctx.globalAlpha = 1;
    for (let r = 0; r < rules.length; r += 3) {
      const y = rules[r + 1] - scrollY;
      if (y < 100 || y > height) continue;
      for (let i = 0; i < 20 && lit < budget; i++) {
        const x = rules[r] + i * 14;
        const active = Math.abs(mouseY - y) < 120;
        const color = active ? 3 : 1;
        const glyph = active ? 2 + Math.floor((0.5 + 0.5 * Math.sin(i * 0.6 - time * 3)) * 4) : 1;
        ctx.drawImage(atlas, glyph * 24, color * 24, 24, 24, x, y - 4, 9, 9);
        lit++;
      }
    }
    metrics.lit = lit; metrics.cost = performance.now() - start;
    metrics.peak = Math.max(metrics.peak, metrics.cost); metrics.frames++;
  }
  resize();
  addEventListener('pointermove', move, { passive: true });
  addEventListener('resize', resize);
  return { draw, resize, dispose() { removeEventListener('pointermove', move); removeEventListener('resize', resize); } };
}
