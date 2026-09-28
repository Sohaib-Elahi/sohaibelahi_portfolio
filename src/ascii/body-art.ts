export type ArtKind = 'bloom' | 'signal' | 'cube' | 'surface' | 'flock' | 'ai';

/** Section-local surfaces share a springy glyph field and the site's animation clock. */
export function createBodyArt(canvas: HTMLCanvasElement, kind: ArtKind, onPluck: (note: number) => void) {
  const ctx = canvas.getContext('2d')!;
  const host = canvas.parentElement!;
  const card = host.closest<HTMLElement>('.body-service-card');
  const atlas = document.createElement('canvas');
  const ink = atlas.getContext('2d')!;
  let atlasSlot = 1, atlasDpr = 1;
  let interacting = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 1, height = 1, columns = 1, rows = 1, cell = 7;
  let values = new Float32Array(0);
  let offsetsX = new Float32Array(0), offsetsY = new Float32Array(0);
  let velocityX = new Float32Array(0), velocityY = new Float32Array(0);
  let theme = '';
  let visible = false, pointerX = .5, pointerY = .5, targetX = .5, targetY = .5;
  let active = false, influence = 0, phase = 0, targetPhase = 0, texture = 0;
  let lastTime = 0, lastPaint = 0, motionDistance = 0, lastPluck = 0;
  let rippleStart = -10000, rippleX = .5, rippleY = .5;
  let letterPoints: { x: number; y: number }[] = [];
  const alphabets = [' .:+*x#@', ' .:;+X%@', ' .·+=*#@'];
  // Rasterize the variable-font glyphs once per size/theme/texture, not every frame.
  function makeAtlas() {
    const colors = theme === 'light'
      ? ['#41120c', '#9c1b10', '#c52b1b', '#000000'] : ['#8c241c', '#f34d40', '#ff6147', '#ffffff'];
    atlasDpr = Math.min(devicePixelRatio, 2);
    atlasSlot = Math.ceil((cell + 5) * atlasDpr);
    atlas.width = atlasSlot * 8; atlas.height = atlasSlot * 4;
    ink.font = `400 ${(cell + 1) * atlasDpr}px "Geist Pixel"`;
    ink.textAlign = 'center'; ink.textBaseline = 'middle';
    ink.lineWidth = (theme === 'light' ? .32 : .16) * atlasDpr;
    colors.forEach((color, row) => {
      ink.fillStyle = ink.strokeStyle = color;
      for (let glyph = 1; glyph < 8; glyph++) {
        const x = (glyph + .5) * atlasSlot, y = (row + .5) * atlasSlot;
        ink.strokeText(alphabets[texture][glyph], x, y);
        ink.fillText(alphabets[texture][glyph], x, y);
      }
    });
  }
  function resize() {
    width = host.clientWidth; height = host.clientHeight;
    cell = kind === 'flock' ? Math.max(2.5, Math.min(4, width / 170)) : Math.max(3, Math.min(5, Math.min(width, height) / 65));
    const dpr = Math.min(devicePixelRatio, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    columns = Math.ceil(width / cell); rows = Math.ceil(height / cell);
    values = new Float32Array(columns * rows);
    offsetsX = new Float32Array(values.length); offsetsY = new Float32Array(values.length);
    velocityX = new Float32Array(values.length); velocityY = new Float32Array(values.length);
    if (kind === 'ai') {
      const mask = document.createElement('canvas');
      mask.width = Math.ceil(width); mask.height = Math.ceil(height);
      const ink = mask.getContext('2d')!;
      ink.font = `400 ${Math.min(width * .63, height * .72)}px "Geist Pixel"`;
      ink.textAlign = 'center'; ink.textBaseline = 'alphabetic';
      const metrics = ink.measureText('AI');
      const baseline = height * .48 + (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
      ink.fillText('AI', width / 2, baseline, width * .8);
      const pixels = ink.getImageData(0, 0, mask.width, mask.height).data;
      letterPoints = [];
      for (let y = 0; y < mask.height; y += cell) for (let x = 0; x < mask.width; x += cell) {
        if (pixels[(Math.floor(y) * mask.width + Math.floor(x)) * 4 + 3] > 90) letterPoints.push({ x, y });
      }
    }
    theme = document.documentElement.dataset.theme || 'dark';
    makeAtlas();
    draw(lastTime, true);
  }
  function raster(px: number, py: number, brightness: number) {
    const col = Math.floor(px / cell), row = Math.floor(py / cell);
    if (col < 0 || col >= columns || row < 0 || row >= rows) return;
    const index = row * columns + col;
    values[index] = Math.max(values[index], Math.min(.99, brightness));
  }
  function plot(x: number, y: number, z: number, brightness: number) {
    const angle = (pointerX - .5) * influence * .6;
    const scale = Math.min(width, height - 30) * .39;
    raster(width * .5 + (x * Math.cos(angle) + z * Math.sin(angle)) * scale,
      (height - 20) * .5 + (y + z * (pointerY - .5) * influence * .4) * scale, brightness);
  }
  // The wing outline is invariant; keep its expensive trigonometry out of each frame.
  const wingOutline = Array.from({ length: 240 }, (_, i) => {
    const a = i / 240 * Math.PI * 2;
    const r = (Math.exp(Math.cos(a)) - 2 * Math.cos(4 * a) - Math.pow(Math.sin(a / 12), 5)) / 4;
    return { x: Math.sin(a) * r, y: -Math.cos(a) * r, angle: a * 4 };
  });
  function flock(t: number) {
    const compact = width < 600;
    const count = width < 900 ? 5 : 7;
    for (let bird = 0; bird < count; bird++) {
      const seed = bird * 2.399;
      const column = compact ? (bird < 3 ? (bird + .5) / 3 : (bird - 3 + 1) / 3) : (bird + .5) / count;
      const row = compact ? (bird < 3 ? .28 : .7) : .47;
      let cx = width * column + Math.sin(t * .65 + seed) * width * .018;
      let cy = height * (row + Math.sin(seed + t * .45) * (compact ? .055 : .16));
      const dx = cx - pointerX * width, dy = cy - pointerY * height;
      const distance = Math.hypot(dx, dy);
      const evade = Math.max(0, 1 - distance / 200) * influence;
      cx += dx / Math.max(distance, 1) * evade * 65;
      cy += dy / Math.max(distance, 1) * evade * 45;
      const size = Math.min(width / (compact ? 3 : count) * .78, height * (compact ? .31 : .44), 138) * (.8 + .2 * Math.sin(seed + 1));
      const flap = .42 + .58 * (.5 + .5 * Math.sin(t * 5 + seed));
      const tilt = Math.sin(t + seed) * .22;
      const cosTilt = Math.cos(tilt), sinTilt = Math.sin(tilt);
      for (let layer = 2; layer <= 12; layer++) for (const point of wingOutline) {
        const x = point.x * size * flap * layer / 12;
        const y = point.y * size * layer / 12;
        raster(cx + x * cosTilt - y * sinTilt, cy + x * sinTilt + y * cosTilt, .25 + layer / 23 + .16 * Math.cos(point.angle + seed));
      }
      for (let y = -size * .3; y < size * .3; y += 3) raster(cx, cy + y, .85);
      for (let a = 0; a < 1; a += .07) for (const side of [-1, 1]) raster(cx + side * a * size * .14, cy - size * (.3 + a * .2), .6);
    }
  }
  function draw(now: number, force = false) {
    lastTime = now;
    if ((!visible || card?.dataset.artCovered === 'true') && !force) return;
    const currentTheme = document.documentElement.dataset.theme || 'dark';
    if (!force && theme === currentTheme && now - lastPaint < 25) return;
    if (theme !== currentTheme) { theme = currentTheme; makeAtlas(); }
    const dt = Math.min(2, Math.max(.5, (now - lastPaint) / 16.67));
    lastPaint = now;
    const still = reduced.matches;
    influence += ((active && !still ? 1 : 0) - influence) * .12 * dt;
    pointerX += (targetX - pointerX) * .2 * dt; pointerY += (targetY - pointerY) * .2 * dt;
    phase += (targetPhase - phase) * .025 * dt;
    const t = (still ? .8 : now * .00035) + phase;
    values.fill(0);
    if (kind === 'ai') {
      for (const point of letterPoints) {
        const breath = still ? 1 : 1 + Math.sin(t * 1.4) * .018;
        const x = width / 2 + (point.x - width / 2) * breath;
        const y = height / 2 + (point.y - height / 2) * breath;
        raster(x + 9, y + 9, .24);
        raster(x, y, .48 + .4 * (.5 + .5 * Math.sin(point.x * .018 - t * 2)));
      }
    } else if (kind === 'flock') flock(t);
    else if (kind === 'bloom') {
      for (let layer = 0; layer < 24; layer++) for (let i = 0; i < 300; i++) {
        const a = i / 300 * Math.PI * 2;
        const r = (.48 + .18 * Math.cos(a * 6 + t)) * (1 + layer / 48);
        plot(Math.cos(a) * r, Math.sin(a) * r, Math.sin(a * 3 + t) * .3, .2 + layer / 35 + .12 * Math.sin(a * 5 - t));
      }
    } else if (kind === 'signal') {
      for (let layer = 0; layer < 22; layer++) for (let i = 0; i < 220; i++) {
        const x = i / 110 - 1;
        plot(x, Math.sin(x * 3.3 - t * 1.4 + layer * .06) * .38 + (layer - 11) * .028, Math.cos(x * 3 + t) * .4, .25 + (1 + Math.cos(layer * .2 + x * 3)) * .3);
      }
    } else if (kind === 'cube') {
      const angle = t * .3;
      for (let face = 0; face < 3; face++) for (let u = -1; u <= 1; u += .05) for (let v = -1; v <= 1; v += .05) {
        const x = face === 0 ? .68 : u * .68, y = face === 1 ? .68 : v * .68;
        const z = face === 2 ? -.68 : (face === 0 ? u : v) * .68;
        const rx = x * Math.cos(angle) + z * Math.sin(angle), rz = -x * Math.sin(angle) + z * Math.cos(angle);
        plot(rx, y * .8 - rz * .45, rz, .25 + (face + 1) * .14 + .2 * Math.cos(u * 4 + t));
      }
    } else {
      for (let layer = 0; layer < 28; layer++) for (let i = 0; i < 210; i++) {
        const x = i / 105 - 1, y = (layer / 28 - .5) * 1.7;
        const wave = Math.sin(x * 4 + y * 2 - t) * .22 + Math.cos(y * 4 + t) * .13;
        plot(x * .92, y * .5 + wave, wave, .18 + (1 + Math.sin(x * 3 + y * 3 - t)) * .32);
      }
    }
    ctx.clearRect(0, 0, width, height);
    const radius = kind === 'flock' ? 90 : Math.min(width * .34, 145);
    const rippleAge = (now - rippleStart) / 1000;
    let touching = false;
    const moving = !still && (influence > .001 || rippleAge < 2.6);
    if (!moving && interacting) {
      offsetsX.fill(0); offsetsY.fill(0); velocityX.fill(0); velocityY.fill(0);
    }
    interacting = moving;
    const damping = Math.pow(.73, dt);
    const tileSize = atlasSlot / atlasDpr;
    for (let i = 0; i < values.length; i++) {
      const x = (i % columns + .5) * cell, y = (Math.floor(i / columns) + .5) * cell;
      const value = values[i];
      if (!moving && value < .12) continue;
      let near = 0;
      if (moving) {
        const dx = x - pointerX * width, dy = y - pointerY * height;
        const distance = Math.hypot(dx, dy);
        near = Math.max(0, 1 - distance / radius) * influence;
        const force = near * near;
        const rippleDistance = Math.hypot(x - rippleX * width, y - rippleY * height);
        const ripple = !still && rippleAge < 1.6 ? Math.sin((rippleDistance - rippleAge * 260) * .055) * Math.exp(-Math.pow((rippleDistance - rippleAge * 260) / 55, 2)) * (1 - rippleAge / 1.6) * 16 : 0;
        const displacement = force * 55 + ripple;
        const tx = still ? 0 : dx / Math.max(1, distance) * displacement - dy / Math.max(1, distance) * force * 14;
        const ty = still ? 0 : dy / Math.max(1, distance) * displacement + dx / Math.max(1, distance) * force * 14;
        velocityX[i] = (velocityX[i] + (tx - offsetsX[i]) * .12 * dt) * damping;
        velocityY[i] = (velocityY[i] + (ty - offsetsY[i]) * .12 * dt) * damping;
        offsetsX[i] += velocityX[i] * dt; offsetsY[i] += velocityY[i] * dt;
      }
      if (value < .12) continue;
      if (near > .25) touching = true;
      const lit = Math.min(.99, value + near * .55);
      const color = Math.min(3, Math.floor(lit * 4));
      const shimmer = near > .25 && !still ? Math.floor(now * .008 + i * .19) % 3 : 0;
      const glyph = Math.min(7, Math.floor(lit * 7));
      const character = 1 + (glyph + shimmer) % 7;
      ctx.drawImage(atlas, character * atlasSlot, color * atlasSlot, atlasSlot, atlasSlot,
        x + offsetsX[i] - tileSize / 2, y + offsetsY[i] - tileSize / 2, tileSize, tileSize);
    }
    if (touching && motionDistance > 24 && now - lastPluck > 180) {
      onPluck(Math.floor(pointerX * 8)); lastPluck = now; motionDistance = 0;
    }
  }
  function move(event: PointerEvent) {
    if (reduced.matches) return;
    const rect = host.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width, y = (event.clientY - rect.top) / rect.height;
    if (active) motionDistance = Math.min(70, motionDistance + Math.hypot((x - targetX) * width, (y - targetY) * height));
    else { pointerX = x; pointerY = y; motionDistance = 25; }
    targetX = x; targetY = y; active = true;
  }
  function leave() { active = false; motionDistance = 0; }
  function reshape(event: MouseEvent) {
    if (event.detail) move(event as PointerEvent);
    rippleX = event.detail ? targetX : .5; rippleY = event.detail ? targetY : .5;
    rippleStart = lastTime; targetPhase += .7; texture = (texture + 1) % alphabets.length;
    makeAtlas();
    draw(lastTime, true);
  }
  host.addEventListener('pointermove', move); host.addEventListener('pointerleave', leave); host.addEventListener('click', reshape);
  const size = new ResizeObserver(resize); size.observe(host);
  const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) draw(lastTime, true); }); visibility.observe(host);
  resize();
  return { draw, dispose() { size.disconnect(); visibility.disconnect(); host.removeEventListener('pointermove', move); host.removeEventListener('pointerleave', leave); host.removeEventListener('click', reshape); } };
}
