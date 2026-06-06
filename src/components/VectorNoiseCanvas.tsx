import React, { useEffect, useRef, useState } from "react";
import { perlin } from "../utils/noise";

interface Particle {
  x: number;
  y: number;
  history: { x: number; y: number }[];
  speed: number;
  age: number;
  maxAge: number;
  color: { r: number; g: number; b: number; a: number };
  angleOffset: number;
  thickness: number;
}

export default function VectorNoiseCanvas() {
  const glCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const mouseRef = useRef<{ x: number; y: number; active: boolean; prevX: number; prevY: number; velocity: number }>({
    x: 0,
    y: 0,
    active: false,
    prevX: 0,
    prevY: 0,
    velocity: 0,
  });

  const scrollRef = useRef<number>(0);

  const [particleCount] = useState<number>(500);
  const [noiseScale] = useState<number>(0.0032);
  const [flowSpeed] = useState<number>(1.4);

  useEffect(() => {
    const handleScroll = () => {
      scrollRef.current = window.scrollY / (window.innerHeight || 1);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const glCanvas = glCanvasRef.current;
    const strokeCanvas = strokeCanvasRef.current;
    if (!glCanvas || !strokeCanvas || !containerRef.current) return;

    const gl = glCanvas.getContext("webgl");
    const ctx = strokeCanvas.getContext("2d");
    if (!gl || !ctx) return;

    let width = glCanvas.width = strokeCanvas.width = window.innerWidth;
    let height = glCanvas.height = strokeCanvas.height = window.innerHeight;

    const dpr = window.devicePixelRatio || 1;

    const resizeCanvases = () => {
      if (!containerRef.current || !glCanvas || !strokeCanvas) return;
      const rect = containerRef.current.getBoundingClientRect();
      width = rect.width;
      height = rect.height;

      // GL screen Setup
      glCanvas.width = width * dpr;
      glCanvas.height = height * dpr;
      glCanvas.style.width = `${width}px`;
      glCanvas.style.height = `${height}px`;
      gl.viewport(0, 0, glCanvas.width, glCanvas.height);

      // Stroke Canvas high-density Setup
      strokeCanvas.width = width * dpr;
      strokeCanvas.height = height * dpr;
      strokeCanvas.style.width = `${width}px`;
      strokeCanvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    resizeCanvases();
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvases();
    });
    resizeObserver.observe(containerRef.current);

    // ==========================================
    // 1. WEBGL FRAGMENT SHADER SETUP (GLSL)
    // ==========================================
    const vsSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform float u_time;
      uniform float u_mouse_active;
      uniform float u_scroll;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        vec2 shift = vec2(100.0);
        mat2 rot = mat2(cos(0.50), sin(0.50), -sin(0.50), cos(0.50));
        for (int i = 0; i < 4; ++i) {
          v += a * noise(p);
          p = rot * p * 2.0 + shift;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
        
        float t = u_time * 0.25;
        
        vec2 m = (u_mouse - 0.5 * u_resolution.xy) / u_resolution.y;
        float d = length(p - m);
        float mouseWarp = 0.0;

        if (u_mouse_active > 0.5) {
          // Senior Creative Coder mathematical field attraction:
          // Pull space coordinates towards the mouse and rotate to create spiral vortices
          vec2 toMouse = m - p;
          float distToMouse = length(toMouse);
          float pull = smoothstep(1.0, 0.0, distToMouse);
          
          p += (toMouse / (distToMouse + 0.001)) * pull * 0.42;
          
          // Whirl matrix twist mapping
          float angle = pull * 0.45;
          float c = cos(angle);
          float s = sin(angle);
          p = mat2(c, -s, s, c) * p;
        }

        // Advanced math: Domain Warping
        vec2 q = vec2(
          fbm(p + vec2(0.0)),
          fbm(p + vec2(2.4, 4.1) + t * 0.08)
        );

        vec2 r = vec2(
          fbm(p + 3.0 * q + vec2(1.2, 5.8) + t * 0.04),
          fbm(p + 3.0 * q + vec2(4.7, 1.2) + t * 0.08)
        );

        float f = fbm(p + 3.0 * r);

        // Pure pitch black background base
        vec3 col = vec3(0.0, 0.0, 0.0);
        
        // Muted crimson flowing rivers (slightly more vibrant and luxurious)
        col = mix(col, vec3(0.18, 0.007, 0.009), clamp(f * f * 2.5, 0.0, 1.0));
        // Soft vermilion copper streams
        col = mix(col, vec3(0.32, 0.015, 0.012), clamp(length(q) * 1.2, 0.0, 1.0));
        
        // Subtle and highly sophisticated bronze-red highlight peaks
        col = mix(col, vec3(0.52, 0.08, 0.028), clamp(pow(length(r.x), 3.8) * 1.3, 0.0, 1.0));

        // Muted, atmospheric spotlight glow at index pointing
        if (u_mouse_active > 0.5) {
          float spot = smoothstep(0.7, 0.0, d);
          col += vec3(0.14, 0.008, 0.006) * spot * 0.95;
        } else {
          float centerSpot = smoothstep(0.85, 0.0, length(p));
          col += vec3(0.06, 0.003, 0.0015) * centerSpot * (0.4 + sin(t * 1.3) * 0.1);
        }

        // Vignette framing
        float vignette = uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
        vignette = clamp(pow(16.0 * vignette, 0.45), 0.0, 1.0);
        col *= vignette;

        // WebGL creative scroll based transition to pure black
        float fade = clamp(u_scroll, 0.0, 1.0);
        float threshold = fade * 1.45 - 0.22;
        float pattern = uv.y - f * 0.22;
        float dissolve = smoothstep(threshold - 0.2, threshold + 0.2, pattern);
        col *= dissolve;

        // Perfect seamless vertical gradient to pure black at the bottom edge to completely resolve background breaks
        float bottomFade = smoothstep(0.0, 0.15, uv.y);
        col *= bottomFade;

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const compileShader = (source: string, type: number): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compiling error: ", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(vsSource, gl.VERTEX_SHADER);
    const fs = compileShader(fsSource, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Linking program error: ", gl.getProgramInfoLog(program));
      return;
    }

    const positionAttributeLocation = gl.getAttribLocation(program, "position");
    const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
    const mouseUniformLocation = gl.getUniformLocation(program, "u_mouse");
    const timeUniformLocation = gl.getUniformLocation(program, "u_time");
    const mouseActiveUniformLocation = gl.getUniformLocation(program, "u_mouse_active");
    const scrollUniformLocation = gl.getUniformLocation(program, "u_scroll");

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0,
      ]),
      gl.STATIC_DRAW
    );

    // ==========================================
    // 2. CANVAS PARTICLE FLOW FIELD SETUP
    // ==========================================
    let particles: Particle[] = [];
    const createParticle = (initRandomAge = false): Particle => {
      const rx = Math.random() * width;
      const ry = Math.random() * height;
      const maxAge = 140 + Math.random() * 200;
      
      const rChance = Math.random();
      let redVal = 255;
      let greenVal = 20;
      let blueVal = 15;
      const alpha = 0.45 + Math.random() * 0.45; // Substantially more glowing filaments

      if (rChance < 0.45) {
        // High intensity neon fire red
        redVal = 255;
        greenVal = 25;
        blueVal = 15;
      } else if (rChance < 0.82) {
        // Burning electric orange-red
        redVal = 255;
        greenVal = 75;
        blueVal = 20;
      } else {
        // Intense deep crimson glow
        redVal = 230;
        greenVal = 10;
        blueVal = 15;
      }

      // Pre-initialize history to prevent starting with an ugly dot or snap
      const history: { x: number; y: number }[] = [];
      const len = 12 + Math.floor(Math.random() * 8); // 12-20 points
      for (let j = 0; j < len; j++) {
        history.push({ x: rx, y: ry });
      }

      return {
        x: rx,
        y: ry,
        history,
        speed: 0.95 + Math.random() * 1.9, // Slightly faster, more dynamic flows
        age: initRandomAge ? Math.floor(Math.random() * maxAge * 0.85) : 0,
        maxAge: maxAge,
        color: { r: redVal, g: greenVal, b: blueVal, a: alpha },
        angleOffset: (Math.random() - 0.5) * 0.25,
        thickness: 1.2 + Math.random() * 1.6, 
      };
    };

    // Fill set
    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle(true));
    }

    let time = 0;
    let animationFrameId: number;

    const render = () => {
      time += 0.0035 * flowSpeed;

      // Ensure mouse position translates perfectly in WebGL coords (WebGL starts from bottom left)
      const mouse = mouseRef.current;
      const glMouseY = height - mouse.y;

      // A. SHADER DRAW BINDINGS
      gl.useProgram(program);
      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(resolutionUniformLocation, glCanvas.width, glCanvas.height);
      gl.uniform2f(mouseUniformLocation, mouse.x * dpr, glMouseY * dpr);
      gl.uniform1f(timeUniformLocation, time);
      gl.uniform1f(mouseActiveUniformLocation, mouse.active ? 1.0 : 0.0);
      gl.uniform1f(scrollUniformLocation, scrollRef.current);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // B. CANVAS PARTICLES RENDERING WITH COMPLETE PIXEL REFRESH TO PREVENT ACCUMULATION SMUDGES
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, strokeCanvas.width, strokeCanvas.height);
      ctx.restore();

      ctx.save();
      // Fade particles completely based on scroll to black body
      const scrollFade = Math.max(0, 1 - scrollRef.current * 1.5);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Fetch flow direction via Perlin Noise
        const angle = perlin.noise3D(p.x * noiseScale, p.y * noiseScale, time) * Math.PI * 4.2 + p.angleOffset;

        let vx = Math.cos(angle) * p.speed;
        let vy = Math.sin(angle) * p.speed;

        // Gravitational attraction pull logic (No rotating swirls, clean magnetic attraction into mouse)
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 20) {
            // Sucked into cursor gravity sink. Expire immediately and regenerate to loop the flow gracefully
            p.age = p.maxAge;
          } else if (dist < 450) {
            // Far-reaching creative Perlin attraction field (450px) with smooth force decay
            const force = Math.pow((450 - dist) / 450, 1.4);
            
            // Tangent circular swirl vectors mapping to physical vortex spirals
            const tx = -dy / dist;
            const ty = dx / dist;
            
            // Mix direct attraction towards mouse and orbiting swirl tangent vectors
            const attractionX = (dx / dist) * p.speed * 2.6 + tx * p.speed * 1.5;
            const attractionY = (dy / dist) * p.speed * 2.6 + ty * p.speed * 1.5;
            
            // Realtime responsive kinetic feedback: smooth, gentle cursor velocity reaction
            const speedBoost = 1.0 + Math.min(mouse.velocity * 0.05, 0.7);
            
            // Seamlessly override classical Perlin flow with the enhanced attractor vortex
            vx = (vx * (1 - force) + attractionX * force) * speedBoost;
            vy = (vy * (1 - force) + attractionY * force) * speedBoost;
          }
        }

        // Push current point to history, then slide
        p.history.push({ x: p.x, y: p.y });
        if (p.history.length > 24) {
          p.history.shift();
        }

        p.x += vx;
        p.y += vy;
        p.age++;

        // Render the flowing trail by drawing gorgeous gradient segment lines
        const len = p.history.length;
        if (len > 1 && scrollFade > 0.01) {
          const ageRatio = p.age / p.maxAge;
          const lifeFade = ageRatio < 0.15 ? (ageRatio / 0.15) : (1 - ageRatio);

          for (let j = 1; j < len; j++) {
            const p1 = p.history[j - 1];
            const p2 = p.history[j];
            const segmentRatio = j / (len - 1);

            // Double Pass Neon Filament Layering
            // Pass 1: Wider lower-opacity neon bloom trail
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.color.a * segmentRatio * lifeFade * scrollFade * 0.18})`;
            ctx.lineWidth = p.thickness * segmentRatio * lifeFade * 3.5;
            ctx.stroke();

            // Pass 2: Sharp vibrant core energy filament
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(255, 120, 110, ${p.color.a * segmentRatio * lifeFade * scrollFade * 0.95})`;
            ctx.lineWidth = p.thickness * segmentRatio * lifeFade * 0.95;
            ctx.stroke();
          }
        }

        // Check boundary limits
        const isOutOfBounds = p.x < -40 || p.x > width + 40 || p.y < -40 || p.y > height + 40;
        if (p.age >= p.maxAge || isOutOfBounds) {
          particles[i] = createParticle(false);
        }
      }
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    // Global window-level mouse movement tracker to capture coordinates across all elements
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const curX = e.clientX - rect.left;
      const curY = e.clientY - rect.top;
      
      const mouse = mouseRef.current;
      const dx = curX - mouse.prevX;
      const dy = curY - mouse.prevY;
      const vel = Math.sqrt(dx * dx + dy * dy);

      mouseRef.current = {
        x: curX,
        y: curY,
        active: true,
        prevX: curX,
        prevY: curY,
        velocity: vel * 0.35 + mouse.velocity * 0.65,
      };
    };

    const handleWindowMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener("mousemove", handleWindowMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleWindowMouseLeave, { passive: true });

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseleave", handleWindowMouseLeave);
      resizeObserver.disconnect();
    };
  }, [particleCount, noiseScale, flowSpeed]);

  return (
    <div
      ref={containerRef}
      id="flow-field-container"
      className="absolute inset-0 w-full h-full overflow-hidden bg-[#000000] select-none pointer-events-auto"
    >
      {/* 1. Underlying WebGL Canvas running premium GLSL fluid simulations */}
      <canvas
        ref={glCanvasRef}
        className="absolute inset-0 w-full h-full block pointer-events-none"
      />

      {/* 2. Top-Layer High Performance 2D Canvas rendering visible filament flow vectors */}
      <canvas
        ref={strokeCanvasRef}
        className="absolute inset-0 w-full h-full block pointer-events-none mix-blend-screen"
      />
    </div>
  );
}

