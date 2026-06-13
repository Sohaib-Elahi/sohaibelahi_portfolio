import React, { useEffect, useRef } from "react";

interface SeededParticle {
  x: number;
  y: number;
  history: { x: number; y: number }[];
  speed: number;
  age: number;
  maxAge: number;
  opacity: number;
  lineWidth: number;
  angleOffset: number;
  color: string;
}

export default function FooterCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = container.clientWidth || window.innerWidth);
    let height = (canvas.height = container.clientHeight || 500);
    const isMobileScreen = window.innerWidth < 768;
    const dpr = isMobileScreen ? Math.min(window.devicePixelRatio || 1, 1.2) : Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      if (!container || !canvas) return;
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    resize();
    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(container);

    // Build smooth vector streams
    let filaments: SeededParticle[] = [];
    const filamentCount = isMobileScreen ? Math.min(40, Math.floor((width * height) / 12000)) : Math.min(100, Math.floor((width * height) / 6000));

    const createFilament = (randomStart = false): SeededParticle => {
      const rx = Math.random() * width;
      const ry = Math.random() * height;
      const maxAge = 150 + Math.random() * 200;

      const history: { x: number; y: number }[] = [];
      const historyLength = 10 + Math.floor(Math.random() * 8);
      for (let j = 0; j < historyLength; j++) {
        history.push({ x: rx, y: ry });
      }

      // Rich shades of dark crimson, ruby, and vermilion for deep glowing aesthetics
      const colors = [
        "rgba(239, 68, 68, 0.45)", // soft red
        "rgba(185, 28, 28, 0.35)", // deep crimson
        "rgba(153, 27, 27, 0.25)", // muted dark wine
        "rgba(254, 138, 138, 0.2)", // pale peach-red
      ];
      const color = colors[Math.floor(Math.random() * colors.length)];

      return {
        x: rx,
        y: ry,
        history,
        speed: 0.4 + Math.random() * 0.9,
        age: randomStart ? Math.floor(Math.random() * maxAge * 0.7) : 0,
        maxAge,
        opacity: 0.15 + Math.random() * 0.3,
        lineWidth: 0.6 + Math.random() * 1.2,
        angleOffset: (Math.random() - 0.5) * 0.1,
        color,
      };
    };

    // Initialize filaments
    for (let i = 0; i < filamentCount; i++) {
      filaments.push(createFilament(true));
    }

    let time = 0;
    let animId: number | null = null;
    let isVisible = false;

    // Fluid field mathematics function
    const getFieldAngle = (x: number, y: number, t: number) => {
      // Elegant compounding harmonic waves instead of heavy noise
      const waves =
        Math.sin(x * 0.0035 + t * 0.3) * 1.5 +
        Math.cos(y * 0.004 + t * 0.3) * 1.2 +
        Math.sin((x + y) * 0.002 - t * 0.1) * 0.7;
      return waves;
    };

    const draw = () => {
      time += 0.008;

      // Smooth mouse lerping to avoid jerks
      const mouse = mouseRef.current;
      if (mouse.active) {
        mouse.x += (mouse.targetX - mouse.x) * 0.08;
        mouse.y += (mouse.targetY - mouse.y) * 0.08;
      } else {
        mouse.x += (-2000 - mouse.x) * 0.08;
        mouse.y += (-2000 - mouse.y) * 0.08;
      }

      // Clear with perfect dark transparent wash to allow background glow overlays
      ctx.clearRect(0, 0, width, height);

      // --- LAYER 1: VIBRANT VECTOR FIELD INDICATORS GRID (TINY, ULTRA-AESTHETIC DESIGNS) ---
      const gridSpacing = 44;
      const cols = Math.ceil(width / gridSpacing);
      const rows = Math.ceil(height / gridSpacing);

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const gx = c * gridSpacing + gridSpacing / 2;
          const gy = r * gridSpacing + gridSpacing / 2;

          // Get raw vector field angle at coordinate
          let angle = getFieldAngle(gx, gy, time * 0.4);

          // Gently influence indicators based on simulated mouse proximity
          const dx = mouse.x - gx;
          const dy = mouse.y - gy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          let intensity = 0;

          if (dist < 260) {
            intensity = (1 - dist / 260) * 0.85;
            // Align beautifully with tangent vectors to form a beautiful orbit ripple
            const angleToMouse = Math.atan2(dy, dx);
            angle = angle * (1 - intensity) + (angleToMouse + Math.PI / 2) * intensity;
          }

          // Draw custom premium microscopic tick marks representing vectors
          ctx.save();
          ctx.translate(gx, gy);
          ctx.rotate(angle);

          // Vector brightness grows slightly on hover
          const baseAlpha = 0.035 + intensity * 0.12;
          ctx.strokeStyle = `rgba(239, 68, 68, ${baseAlpha})`;
          ctx.lineWidth = 0.65;

          // Cute luxury crosshair representing direction
          ctx.beginPath();
          ctx.moveTo(-4, 0);
          ctx.lineTo(4, 0);
          ctx.moveTo(0, -1.5);
          ctx.lineTo(0, 1.5);
          ctx.stroke();
          ctx.restore();
        }
      }

      // --- LAYER 2: INTERACTIVE FILAMENT STREAMS ---
      filaments.forEach((p, idx) => {
        // Fetch raw vector angle
        let angle = getFieldAngle(p.x, p.y, time * 0.5) + p.angleOffset;

        // Apply mouse interaction
        const mDx = mouse.x - p.x;
        const mDy = mouse.y - p.y;
        const mDist = Math.sqrt(mDx * mDx + mDy * mDy);

        let vx = Math.cos(angle) * p.speed;
        let vy = Math.sin(angle) * p.speed;

        if (mDist < 260) {
          // Circular vortex twist (no snaps, pure continuous tangent curve)
          const force = Math.pow(1 - mDist / 260, 1.3);
          const tangentX = -mDy / (mDist + 1);
          const tangentY = mDx / (mDist + 1);

          // Blended vector velocity
          vx = vx * (1 - force) + (tangentX * 2.2 + (mDx / (mDist + 1)) * -1.2) * force * p.speed;
          vy = vy * (1 - force) + (tangentY * 2.2 + (mDy / (mDist + 1)) * -1.2) * force * p.speed;
        }

        // Store positions and step forward
        p.history.push({ x: p.x, y: p.y });
        if (p.history.length > 18) {
          p.history.shift();
        }

        p.x += vx;
        p.y += vy;
        p.age += 0.5;

        // Draw elegant gradient trail line
        const len = p.history.length;
        if (len > 1) {
          const lifeRatio = p.age / p.maxAge;
          const fade = lifeRatio < 0.1 ? lifeRatio / 0.1 : 1 - lifeRatio;

          ctx.beginPath();
          ctx.moveTo(p.history[0].x, p.history[0].y);

          for (let j = 1; j < len; j++) {
            ctx.lineTo(p.history[j].x, p.history[j].y);
          }

          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.lineWidth * fade;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.stroke();
        }

        // Regenerate when expired or out of bounds
        const isOutside = p.x < -30 || p.x > width + 30 || p.y < -30 || p.y > height + 30;
        if (p.age >= p.maxAge || isOutside) {
          filaments[idx] = createFilament(false);
        }
      });

      if (isVisible) {
        animId = requestAnimationFrame(draw);
      } else {
        animId = null;
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        const wasVisible = isVisible;
        isVisible = entry.isIntersecting;
        if (isVisible && !wasVisible && animId === null) {
          time = 0;
          draw();
        }
      },
      { threshold: 0.01 }
    );
    observer.observe(container);

    // Event listeners
    const handleMouseMove = (e: MouseEvent) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mouseRef.current.targetX = e.clientX - rect.left;
      mouseRef.current.targetY = e.clientY - rect.top;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0 && container) {
        const rect = container.getBoundingClientRect();
        mouseRef.current.targetX = e.touches[0].clientX - rect.left;
        mouseRef.current.targetY = e.touches[0].clientY - rect.top;
        mouseRef.current.active = true;
      }
    };

    container.addEventListener("mousemove", handleMouseMove, { passive: true });
    container.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleMouseLeave, { passive: true });

    return () => {
      observer.disconnect();
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleMouseLeave);
      if (animId !== null) cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full -z-10 bg-black/10">
      <canvas ref={canvasRef} className="block w-full h-full opacity-60 mix-blend-screen" />
    </div>
  );
}
