import React, { useRef, useEffect } from 'react';

export default function InteractiveTextCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let width = canvas.width = canvas.clientWidth;
    let height = canvas.height = canvas.clientHeight;

    let particles: Particle[] = [];
    const mouse = { x: -1000, y: -1000, radius: 100 };

    class Particle {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      size: number;
      density: number;
      color: string;
      vx: number;
      vy: number;

      constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this.baseX = x;
        this.baseY = y;
        this.size = Math.random() * 1.2 + 0.6; // Small, elegant particle size
        this.density = (Math.random() * 25) + 5;
        this.color = color;
        this.vx = 0;
        this.vy = 0;
      }

      draw() {
        ctx!.fillStyle = this.color;
        ctx!.fillRect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);
      }

      update() {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouse.radius) {
          let forceDirectionX = dx / distance;
          let forceDirectionY = dy / distance;
          // Apply a force inversely proportional to distance
          let force = (mouse.radius - distance) / mouse.radius;
          let directionX = forceDirectionX * force * this.density;
          let directionY = forceDirectionY * force * this.density;
          
          this.vx -= directionX;
          this.vy -= directionY;
        } else {
          // Spring back to home position
          let springX = (this.baseX - this.x) * 0.05;
          let springY = (this.baseY - this.y) * 0.05;
          this.vx += springX;
          this.vy += springY;
        }

        // Apply friction
        this.vx *= 0.88;
        this.vy *= 0.88;

        this.x += this.vx;
        this.y += this.vy;
      }
    }

    function init() {
      particles = [];
      if (!ctx || !canvas) return;
      
      ctx.clearRect(0, 0, width, height);
      
      const fontSize = Math.max(Math.min(width * 0.14, 150), 60);
      ctx.font = `italic 300 ${fontSize}px "Apple Garamond", Garamond, "Baskerville", serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const lineGap = fontSize * 0.9;
      const centerY = height / 2;

      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.fillText('I Design', width / 2 - fontSize * 0.7, centerY - lineGap);
      ctx.fillText('I Build', width / 2, centerY);
      
      // Make the last word slightly faded native text styling
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('I Scale', width / 2 + fontSize * 0.7, centerY + lineGap);

      const textCoordinates = ctx.getImageData(0, 0, width, height);
      ctx.clearRect(0, 0, width, height);

      // We extract pixel locations to create particles
      const step = width < 768 ? 6 : 4; 
      
      for (let y = 0; y < textCoordinates.height; y += step) {
        for (let x = 0; x < textCoordinates.width; x += step) {
          const alpha = textCoordinates.data[(y * 4 * textCoordinates.width) + (x * 4) + 3];
          if (alpha > 128) {
            let a = alpha / 255;
            let r = textCoordinates.data[(y * 4 * textCoordinates.width) + (x * 4)];
            let g = textCoordinates.data[(y * 4 * textCoordinates.width) + (x * 4) + 1];
            let b = textCoordinates.data[(y * 4 * textCoordinates.width) + (x * 4) + 2];
            let color = `rgba(${r}, ${g}, ${b}, ${a})`;
            particles.push(new Particle(x, y, color));
          }
        }
      }
    }

    // Delay init slightly to ensure font is loaded
    document.fonts.ready.then(() => {
        init();
    });

    let isVisible = false;
    let animationId: number | null = null;
    function animate() {
      if (!isVisible) {
        animationId = null;
        return;
      }
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      
      for (let i = 0; i < particles.length; i++) {
        particles[i].draw();
        particles[i].update();
      }
      animationId = requestAnimationFrame(animate);
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const handleResize = () => {
      width = canvas.width = canvas.clientWidth;
      height = canvas.height = canvas.clientHeight;
      init();
    };

    // Use pointer events for better mobile/touch support
    window.addEventListener('pointermove', handleMouseMove);
    canvas.addEventListener('pointerleave', handleMouseLeave);
    
    // Add resize observer for robust resize handling
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        const wasVisible = isVisible;
        isVisible = entry.isIntersecting;
        if (isVisible && !wasVisible) {
          if (animationId === null) {
            animate();
          }
        }
      },
      { threshold: 0.01 }
    );
    intersectionObserver.observe(canvas);

    return () => {
      intersectionObserver.disconnect();
      if (animationId !== null) cancelAnimationFrame(animationId);
      window.removeEventListener('pointermove', handleMouseMove);
      canvas.removeEventListener('pointerleave', handleMouseLeave);
      resizeObserver.disconnect();
    };

  }, []);

  return <canvas ref={canvasRef} className="w-full h-[500px] cursor-crosshair touch-none relative z-10 block" />;
}
