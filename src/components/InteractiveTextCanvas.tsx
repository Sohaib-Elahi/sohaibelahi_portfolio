import React, { useRef, useEffect } from 'react';

/**
 * InteractiveTextCanvas
 * -------------------------------------------------------------------
 * Particles flow in from random scatter positions and crystallise into
 * fully-solid white text "I Design / I Build / I Scale".
 * Mouse/touch repels them; they spring back to their home positions.
 * On mobile: heavier step → fewer particles → fast & readable.
 */
export default function InteractiveTextCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const isMobile = window.innerWidth < 768;

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    const mouse = { x: -9999, y: -9999, radius: isMobile ? 60 : 110 };

    // ── Particle ────────────────────────────────────────────────────
    class Particle {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      size: number;
      density: number;
      vx: number = 0;
      vy: number = 0;
      // Particles start far from home for the "flow-in" intro effect
      settled: boolean = false;

      constructor(bx: number, by: number) {
        this.baseX = bx;
        this.baseY = by;
        // Scatter position: random on canvas
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = isMobile ? (Math.random() * 1.0 + 0.5) : (Math.random() * 1.3 + 0.6);
        this.density = (Math.random() * 20) + 5;
      }

      draw() {
        ctx!.fillStyle = 'rgba(255,255,255,0.92)';
        const s = this.size;
        ctx!.fillRect(this.x - s, this.y - s, s * 2, s * 2);
      }

      update() {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          this.vx -= (dx / dist) * force * this.density;
          this.vy -= (dy / dist) * force * this.density;
        }

        // Spring toward home — stronger spring = faster convergence
        const springStrength = this.settled ? 0.06 : 0.04;
        this.vx += (this.baseX - this.x) * springStrength;
        this.vy += (this.baseY - this.y) * springStrength;

        // Friction
        this.vx *= 0.86;
        this.vy *= 0.86;

        this.x += this.vx;
        this.y += this.vy;

        // Mark settled once close enough
        if (!this.settled) {
          const d2 = (this.x - this.baseX) ** 2 + (this.y - this.baseY) ** 2;
          if (d2 < 4) this.settled = true;
        }
      }
    }

    // ── Build particles from text pixels ────────────────────────────
    function buildParticles() {
      if (!ctx || !canvas) return;
      particles = [];

      ctx.clearRect(0, 0, width, height);

      // ── Font sizing: 3 stacked lines ────────────────────────────
      const fontSize = isMobile
        ? Math.max(Math.min(width * 0.17, 110), 48)
        : Math.max(Math.min(width * 0.12, 140), 72);

      ctx.font = `italic 300 ${fontSize}px "Apple Garamond", Garamond, "Baskerville", "Times New Roman", serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const lineGap = fontSize * 0.95;
      const cy = height / 2;

      ctx.fillStyle = 'rgba(255,255,255,1)';
      ctx.fillText('I Design', width / 2, cy - lineGap);
      ctx.fillText('I Build', width / 2, cy);
      ctx.fillText('I Scale', width / 2, cy + lineGap);

      const imageData = ctx.getImageData(0, 0, width, height);
      ctx.clearRect(0, 0, width, height);

      const step = isMobile ? 7 : 4;

      for (let y = 0; y < imageData.height; y += step) {
        for (let x = 0; x < imageData.width; x += step) {
          const alpha = imageData.data[(y * 4 * imageData.width) + (x * 4) + 3];
          if (alpha > 128) {
            particles.push(new Particle(x, y));
          }
        }
      }
    }

    // ── Resize ───────────────────────────────────────────────────────
    function resize() {
      if (!canvas) return;
      width = canvas.width = canvas.clientWidth;
      height = canvas.height = canvas.clientHeight;
      buildParticles();
    }

    // ── Animation loop ───────────────────────────────────────────────
    let isVisible = false;
    let rafId: number | null = null;

    function animate() {
      if (!isVisible) { rafId = null; return; }
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].draw();
        particles[i].update();
      }
      rafId = requestAnimationFrame(animate);
    }

    // ── Event handlers ───────────────────────────────────────────────
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onPointerLeave = () => { mouse.x = -9999; mouse.y = -9999; };

    // Touch support
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length < 1) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.touches[0].clientX - rect.left;
      mouse.y = e.touches[0].clientY - rect.top;
    };
    const onTouchEnd = () => { mouse.x = -9999; mouse.y = -9999; };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);

    // ── ResizeObserver ───────────────────────────────────────────────
    const resizeObs = new ResizeObserver(() => resize());
    resizeObs.observe(canvas);

    // ── IntersectionObserver ─────────────────────────────────────────
    const intersectionObs = new IntersectionObserver(([entry]) => {
      const was = isVisible;
      isVisible = entry.isIntersecting;
      if (isVisible && !was && rafId === null) animate();
    }, { threshold: 0.01 });
    intersectionObs.observe(canvas);

    // ── Init after fonts load ────────────────────────────────────────
    document.fonts.ready.then(() => resize());

    return () => {
      intersectionObs.disconnect();
      resizeObs.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full touch-none relative z-10 block"
      style={{ height: 'clamp(280px, 40vw, 480px)' }}
    />
  );
}
