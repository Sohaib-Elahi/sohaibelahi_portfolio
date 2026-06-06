import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

export default function ThreeFlowLoop() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();

    // 2. Camera Setup
    let width = containerRef.current.clientWidth || window.innerWidth;
    let height = containerRef.current.clientHeight || 1000;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.z = 11;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 4. Geometry & Custom Attributes for 12,000 particles (denser, glowing flow)
    const particleCount = 12000;
    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(particleCount * 3);
    const progress = new Float32Array(particleCount);
    const randomSpeed = new Float32Array(particleCount);
    const randomOffset = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Evenly distribute progress along the curve (0.0 to 1.0)
      const progVal = i / particleCount;
      progress[i] = progVal;

      // Random speed modifier per particle for natural fluid flow
      randomSpeed[i] = 0.4 + Math.random() * 1.6;

      // Random 3D offset/dispersion
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 0.3 + Math.random() * 2.2; // Dispersion radius

      randomOffset[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      randomOffset[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      randomOffset[i * 3 + 2] = r * Math.cos(phi);

      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aProgress", new THREE.BufferAttribute(progress, 1));
    geometry.setAttribute("aRandomSpeed", new THREE.BufferAttribute(randomSpeed, 1));
    geometry.setAttribute("aRandomOffset", new THREE.BufferAttribute(randomOffset, 3));

    // 5. High-Performance Shaders (Orange-Red Neon Spectrum)
    const uniforms = {
      uTime: { value: 0.0 },
      uScroll: { value: 0.0 },
      uSize: { value: 36.0 },
    };

    const vertexShader = `
      uniform float uTime;
      uniform float uScroll;
      uniform float uSize;

      attribute float aProgress;
      attribute float aRandomSpeed;
      attribute vec3 aRandomOffset;

      varying float vProgress;
      varying float vBrightness;

      void main() {
        // Base particle movement over time (parametric curve)
        float flowTime = uTime * 0.22 * aRandomSpeed;
        float phase = aProgress * 6.28318 + flowTime;

        // Custom parametric Lemniscate Loop coordinates proportioned beautifully for front view visibility
        float x = 8.5 * sin(phase);
        float y = 2.8 * sin(2.0 * phase) * 0.77;
        float z = 1.0 * cos(phase);

        // Wind turbulence offsets
        vec3 windOffset = vec3(
          sin(phase * 2.5 + uTime) * 0.15,
          cos(phase * 3.5 + uTime * 0.7) * 0.12,
          sin(phase * 1.8 + uTime * 1.1) * 0.15
        );

        // Dispersion scales with smooth screen layout context (tightens on Scroll)
        float dispersionScale = mix(1.8, 0.15, uScroll);
        vec3 offsetPos = aRandomOffset * dispersionScale + windOffset;

        vec3 finalPos = vec3(x, y, z) + offsetPos;

        vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        // Perspective-based glowing size
        gl_PointSize = uSize * (1.15 / -mvPosition.z) * mix(0.75, 1.5, sin(phase * 2.0) * 0.5 + 0.5);

        vProgress = aProgress;
        vBrightness = mix(0.4, 0.95, uScroll) * (0.8 + 0.25 * sin(flowTime + phase * 1.5));
      }
    `;

    const fragmentShader = `
      varying float vProgress;
      varying float vBrightness;

      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        if (dist > 0.5) discard;

        float glow = smoothstep(0.5, 0.0, dist);
        float core = smoothstep(0.12, 0.0, dist) * 0.8;

        // Vibrant deep reddish spectrum
        vec3 baseRed = vec3(1.0, 0.02, 0.01);        // Sharp intense neon scarlet red
        vec3 crimsonRed = vec3(0.72, 0.01, 0.04);    // Deep sophisticated crimson-ruby red

        vec3 finalColor = mix(baseRed, crimsonRed, sin(vProgress * 6.283 + vBrightness * 2.5) * 0.5 + 0.5);

        // Inject red-hot core energy for volumetric glow
        finalColor += vec3(1.0, 0.18, 0.18) * core;
        finalColor *= vBrightness;

        gl_FragColor = vec4(finalColor, glow * 0.88);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Dynamic scale to adjust size of the loop itself relative to monitor/container width
    const updateScaleWithWindow = (w: number) => {
      if (w < 640) {
        points.scale.set(0.55, 0.55, 0.55);
      } else if (w < 1024) {
        points.scale.set(0.75, 0.75, 0.75);
      } else {
        points.scale.set(0.9, 0.9, 0.9);
      }
    };
    updateScaleWithWindow(width);

    // 6. GSAP ScrollTrigger Integration with scrubbing (morphs particles based on page scroll position)
    const scrollAnimation = gsap.to(uniforms.uScroll, {
      value: 1.0,
      scrollTrigger: {
        trigger: containerRef.current.parentElement || containerRef.current,
        start: "top 85%",
        end: "bottom 10%",
        scrub: 1.2,
      },
      overwrite: "auto",
    });

    // 7. Core Render Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();
      uniforms.uTime.value = elapsedTime;

      // Perfectly front-facing infinity loop with absolutely no tilt
      points.rotation.y = 0.0;
      points.rotation.x = 0.0;
      points.rotation.z = 0.0;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    // 8. Robust Resizing Setup
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      updateScaleWithWindow(w);
    };

    // Use ResizeObserver for incredibly accurate layout shifts tracking
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(containerRef.current);

    window.addEventListener("resize", handleResize);

    // 9. Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      
      if (scrollAnimation.scrollTrigger) {
        scrollAnimation.scrollTrigger.kill();
      }
      scrollAnimation.kill();

      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
    </div>
  );
}
