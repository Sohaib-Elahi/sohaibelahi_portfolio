import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function FooterSineWave() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();

    // 2. Camera Setup
    let width = containerRef.current.clientWidth || window.innerWidth;
    let height = containerRef.current.clientHeight || 300;
    
    // Choose wide view angle to contain the full screen width elegantly
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    // Position camera far enough to see the horizontal wave span
    camera.position.z = 10;

    const isMobileScreen = window.innerWidth < 768;
    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isMobileScreen ? Math.min(window.devicePixelRatio, 1.2) : Math.min(window.devicePixelRatio, 1.8));

    // 4. Geometry & Particles Setup
    const particleCount = isMobileScreen ? 1500 : 4000;
    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(particleCount * 3);
    const progress = new Float32Array(particleCount);
    const randomSpeed = new Float32Array(particleCount);
    const randomOffset = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Evenly spread out the starting phase
      progress[i] = i / particleCount;

      // Random speed modifier per individual particle
      randomSpeed[i] = 0.55 + Math.random() * 0.9;

      // 3D Fuzzy noise dispersion around the core sine wave to create a thick glow ribbon
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.05 + Math.random() * 1.15; // radial thickness of the beam
      randomOffset[i * 3] = 0; // x-dispersion handled natively along direction
      randomOffset[i * 3 + 1] = Math.sin(angle) * radius;
      randomOffset[i * 3 + 2] = Math.cos(angle) * radius;

      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aProgress", new THREE.BufferAttribute(progress, 1));
    geometry.setAttribute("aRandomSpeed", new THREE.BufferAttribute(randomSpeed, 1));
    geometry.setAttribute("aRandomOffset", new THREE.BufferAttribute(randomOffset, 3));

    // 5. Shader Uniforms
    const uniforms = {
      uTime: { value: 0.0 },
      uSize: { value: 24.0 }, 
    };

    // 6. Shader Programs: Custom Vertex & Fragment Shaders for the Sine Wave flow
    const vertexShader = `
      uniform float uTime;
      uniform float uSize;

      attribute float aProgress;
      attribute float aRandomSpeed;
      attribute vec3 aRandomOffset;

      varying float vProgress;
      varying float vBrightness;
      varying float vFade;

      void main() {
        // Compute cyclic movement progress from right (1.0) to left (0.0)
        // Mod keeps them recycling endlessly. Speed is scaled down/up.
        float flowTime = uTime * 0.065 * aRandomSpeed;
        float flowProgress = mod(aProgress - flowTime, 1.0);

        // Map progress of 0.0 (left side) to 1.0 (right side) to space coordinate X
        // Extended horizontally to 12.0 to assure they span completely past screen limits
        float x = mix(12.5, -12.5, flowProgress);

        // Compute multi-harmonic sine waves for clean liquid movement
        float wave1 = sin(x * 0.45 + uTime * 1.55);
        float wave2 = cos(x * 1.0 - uTime * 0.95) * 0.35;
        float wave3 = sin(x * 2.1 + uTime * 2.3) * 0.12;
        
        float y = (wave1 + wave2 + wave3) * 0.85;

        // Wave depth path to enrich 3D parallax
        float z = sin(x * 0.5 + uTime * 0.75) * 0.5;

        // Adding dynamic wind turbulences to dispersion offsets
        vec3 wind = vec3(
          0.0,
          sin(x * 1.5 + uTime * 2.0) * 0.08,
          cos(x * 1.2 + uTime * 1.8) * 0.08
        );

        vec3 finalPos = vec3(x, y, z) + aRandomOffset + wind;

        vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        // Screen size calculation keeping perspective scaling
        gl_PointSize = uSize * (1.0 / -mvPosition.z) * mix(0.7, 1.3, sin(flowProgress * 24.0) * 0.5 + 0.5);

        // Fade transparent boundaries far outside screen limits to guarantee endless fluid continuity
        vFade = smoothstep(0.0, 0.08, flowProgress) * smoothstep(1.0, 0.92, flowProgress);
        vProgress = flowProgress;
        vBrightness = 0.55 + 0.45 * sin(uTime * 1.2 + flowProgress * 6.28);
      }
    `;

    const fragmentShader = `
      varying float vProgress;
      varying float vBrightness;
      varying float vFade;

      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        
        // Circular mask for particles
        if (dist > 0.5) discard;

        // Radial glow calculation
        float glow = smoothstep(0.5, 0.0, dist);
        float core = smoothstep(0.15, 0.0, dist) * 0.7;

        // Premium red/crimson gradient colors
        vec3 pureNeonRed = vec3(1.0, 0.05, 0.01);
        vec3 deepRubyRed = vec3(0.58, 0.01, 0.04);

        // Color shifting along the path
        vec3 baseColor = mix(pureNeonRed, deepRubyRed, sin(vProgress * 3.1415) * 0.5 + 0.5);

        // Inject hot white/peach core for deep premium glow
        vec3 finalColor = baseColor + vec3(1.0, 0.22, 0.22) * core;
        finalColor *= vBrightness;

        gl_FragColor = vec4(finalColor, glow * vFade * 0.78);
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

    // Adjust scale based on screen size dynamically
    const updateScaleWithWindow = (w: number) => {
      if (w < 640) {
        points.scale.set(0.65, 0.65, 0.65);
        camera.position.z = 11;
      } else if (w < 1024) {
        points.scale.set(0.85, 0.85, 0.85);
        camera.position.z = 10;
      } else {
        points.scale.set(1.1, 1.1, 1.1);
        camera.position.z = 9;
      }
    };
    updateScaleWithWindow(width);

    // 7. Render Loop
    let isVisible = false;
    let animationFrameId: number | null = null;
    const clock = new THREE.Clock();

    const animate = () => {
      if (!isVisible) {
        animationFrameId = null;
        return;
      }
      animationFrameId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();
      uniforms.uTime.value = elapsed;

      renderer.render(scene, camera);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        const wasVisible = isVisible;
        isVisible = entry.isIntersecting;
        if (isVisible && !wasVisible) {
          if (animationFrameId === null) {
            clock.getDelta(); // reset clock
            animate();
          }
        }
      },
      { threshold: 0.01 }
    );
    observer.observe(containerRef.current);

    // 8. Resizing handler
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
      renderer.setPixelRatio(isMobileScreen ? Math.min(window.devicePixelRatio, 1.2) : Math.min(window.devicePixelRatio, 1.8));
      updateScaleWithWindow(w);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(containerRef.current);

    window.addEventListener("resize", handleResize);

    // 9. Cleanup
    return () => {
      observer.disconnect();
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();

      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-[320px] md:h-[400px] pointer-events-none z-10 overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full pointer-events-none opacity-90 mix-blend-screen" />
    </div>
  );
}
