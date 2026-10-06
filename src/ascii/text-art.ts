/** Cached text mask + glyph atlas: input work happens once, motion only recolors cells. */
export function createTextArt(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  const mask = document.createElement('canvas');
  const ink = mask.getContext('2d', { willReadFrequently: true })!;
  const atlas = document.createElement('canvas');
  const glyphs = atlas.getContext('2d')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let points: { x: number; y: number }[] = [], text = 'Your turn.', theme = '', visible = false, last = -1000;
  const width = 1200, height = 360, cell = 5;
  canvas.width = mask.width = width; canvas.height = mask.height = height;
  function palette() {
    theme = document.documentElement.dataset.theme || 'dark';
    const colors = theme === 'light' ? ['#9c1b10', '#c52b1b', '#070606'] : ['#b83428', '#f34d40', '#fafaf8'];
    atlas.width = 18; atlas.height = 18;
    glyphs.font = 'bold 8px monospace'; glyphs.textAlign = 'center'; glyphs.textBaseline = 'middle';
    colors.forEach((color, row) => { glyphs.fillStyle = color; ['+', 'x', '#'].forEach((letter, column) => glyphs.fillText(letter, column * 6 + 3, row * 6 + 3)); });
  }
  function setText(value: string) {
    text = value.trim() || 'Your turn.';
    ink.clearRect(0, 0, width, height);
    ink.font = '200px "Geist Pixel", sans-serif';
    const size = Math.min(270, 200 * (width - 70) / Math.max(1, ink.measureText(text).width));
    ink.font = `${size}px "Geist Pixel", sans-serif`; ink.fillStyle = '#fff';
    ink.textAlign = 'center'; ink.textBaseline = 'alphabetic';
    const metrics = ink.measureText(text);
    ink.fillText(text, width / 2, height / 2 + (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2);
    const data = ink.getImageData(0, 0, width, height).data;
    points = [];
    for (let y = 0; y < height; y += cell) for (let x = 0; x < width; x += cell) if (data[(y * width + x) * 4 + 3] > 60) points.push({ x, y });
    draw(performance.now(), true);
  }
  function draw(now: number, force = false) {
    if (!force && (!visible || document.hidden || reduced.matches || now - last < 50)) return;
    last = now;
    if (theme !== document.documentElement.dataset.theme) palette();
    ctx.clearRect(0, 0, width, height);
    const time = reduced.matches ? 0 : now / 1600;
    for (const { x, y } of points) {
      const wave = (Math.sin(x * .008 - time + y * .009) + 1) / 2;
      const color = wave > .72 ? 2 : wave > .18 ? 1 : 0;
      const letter = Math.floor((x + y) / cell) % 3;
      ctx.drawImage(atlas, letter * 6, color * 6, 6, 6, x, y, 6, 6);
    }
  }
  function refresh() { palette(); draw(performance.now(), true); }
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) draw(performance.now(), true); }); observer.observe(canvas);
  const themeChange = new MutationObserver(refresh); themeChange.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  reduced.addEventListener('change', refresh);
  palette(); setText(text);
  return { setText, draw,
    exportPNG() {
      const output = document.createElement('canvas'); output.width = width; output.height = height;
      const out = output.getContext('2d')!;
      out.fillStyle = theme === 'light' ? '#FAFAF8' : '#000000'; out.fillRect(0, 0, width, height); out.drawImage(canvas, 0, 0);
      return new Promise<Blob | null>(resolve => output.toBlob(resolve, 'image/png'));
    },
    dispose() { observer.disconnect(); themeChange.disconnect(); reduced.removeEventListener('change', refresh); },
  };
}
