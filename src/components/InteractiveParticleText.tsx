import React, { useEffect, useRef } from "react";

interface InteractiveParticleTextProps {
  text: string;
}

interface TextParticle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  ease: number;
  friction: number;
}

export default function InteractiveParticleText({ text }: InteractiveParticleTextProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: TextParticle[] = [];
    let animationFrameId: number;
    let width = 0;
    let height = 0;

    // Offscreen canvas to render text and extract pixels
    const offscreen = document.createElement("canvas");
    const offCtx = offscreen.getContext("2d");

    const initTextParticles = () => {
      if (!canvas || !containerRef.current || !offCtx) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      width = containerRect.width;
      height = containerRect.height;

      // Set canvas sizing high-density
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      // Render text offscreen to get coordinates
      offscreen.width = width;
      offscreen.height = height;
      
      offCtx.clearRect(0, 0, width, height);
      offCtx.fillStyle = "#ffffff";
      
      // Select elegant display typography scale
      const fontSize = Math.min(width / 10, 84);
      offCtx.font = `600 ${fontSize}px "Cormorant Garamond", Georgia, serif`;
      offCtx.textAlign = "center";
      offCtx.textBaseline = "middle";
      
      // Draw text in middle of screen
      offCtx.fillText(text, width / 2, height / 2);

      // Extract raw pixels
      const imgData = offCtx.getImageData(0, 0, width, height);
      const data = imgData.data;
      particles = [];

      // Step coordinates to maintain high-precision but optimal particle counts (approx. 400-600 particles max)
      const step = Math.max(Math.floor(fontSize / 16), 4);

      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const index = (y * width + x) * 4;
          const alpha = data[index + 3];

          // If pixel has text content (visible pixel)
          if (alpha > 120) {
            // Spawning RESTING target coordinate
            const originX = x;
            const originY = y;
            
            // Random scatter start position for elegant entry animation
            const startX = originX + (Math.random() - 0.5) * 60;
            const startY = originY + (Math.random() - 0.5) * 60;

            // Neon crimson, bright coral, and glowing amber palette
            const rand = Math.random();
            let color = "rgba(255, 59, 48, 0.85)"; // #ff3b30
            if (rand < 0.25) {
              color = "rgba(255, 110, 20, 0.9)"; // amber
            } else if (rand < 0.5) {
              color = "rgba(255, 24, 86, 0.95)"; // pink-red
            } else if (rand < 0.7) {
              color = "rgba(255, 255, 255, 0.95)"; // bright spark accent
            }

            particles.push({
              x: startX,
              y: startY,
              originX,
              originY,
              vx: 0,
              vy: 0,
              size: 1.0 + Math.random() * 2.1,
              color,
              ease: 0.05 + Math.random() * 0.07,
              friction: 0.82 + Math.random() * 0.08,
            });
          }
        }
      }
    };

    initTextParticles();

    // Resize tracking
    const resizeObserver = new ResizeObserver(() => {
      initTextParticles();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    const mouse = mouseRef.current;

    // Core Animation loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Interaction calculation
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const threshold = 75; // Interaction sweep radius

          if (dist < threshold) {
            // Creative push/blast wave math
            const force = (threshold - dist) / threshold;
            const angle = Math.atan2(dy, dx);
            
            // Accelerate away from mouse
            p.vx -= Math.cos(angle) * force * 1.6;
            p.vy -= Math.sin(angle) * force * 1.6;
          }
        }

        // Return home spring physics force
        const homeDx = p.originX - p.x;
        const homeDy = p.originY - p.y;
        
        p.vx += homeDx * p.ease;
        p.vy += homeDy * p.ease;

        // Apply friction drag
        p.vx *= p.friction;
        p.vy *= p.friction;

        // Apply velocity update
        p.x += p.vx;
        p.y += p.vy;

        // Draw particle dot
        ctx.fillStyle = p.color;
        
        // Add subtle dynamic coordinate scaling when moving fast for speed-stretch effect
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const stretch = Math.min(speed * 0.25, 2);
        
        ctx.beginPath();
        if (speed > 1.5) {
          // Render stretched stardust ellipse along movement path
          const angle = Math.atan2(p.vy, p.vx);
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(angle);
          ctx.ellipse(0, 0, p.size + stretch, p.size, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [text]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    };
  };

  const handleMouseLeave = () => {
    mouseRef.current.active = false;
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-32 sm:h-44 md:h-52 select-none relative"
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="block cursor-pointer absolute inset-0 w-full h-full"
      />
    </div>
  );
}
