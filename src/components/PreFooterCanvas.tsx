import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function PreFooterCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 1200;
    const height = container.clientHeight || 800;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Dynamic particles matching the red/black mesh theme
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 16;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 4 - 2;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;

      speeds[i * 3] = (Math.random() - 0.5) * 0.004;
      speeds[i * 3 + 1] = (Math.random() - 0.5) * 0.004;
      speeds[i * 3 + 2] = (Math.random() - 0.5) * 0.001;

      scales[i] = 0.5 + Math.random() * 2.5;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));

    const uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uColor: { value: new THREE.Color(0xef4444) },
    };

    const vertexShader = `
      uniform float uTime;
      uniform vec2 uMouse;
      attribute float aScale;
      varying float vGlow;
      varying vec3 vWorldPosition;

      void main() {
        vec3 pos = position;

        pos.x += sin(uTime * 0.4 + pos.y) * 0.12;
        pos.y += cos(uTime * 0.3 + pos.x) * 0.12;

        vec3 mouseWorld = vec3(uMouse.x * 10.0, uMouse.y * 6.0, 0.0);
        float dist = distance(pos, mouseWorld);
        // Make them repel heavily
        if (dist < 5.0) {
          float push = (1.0 - (dist / 5.0)) * 1.2;
          pos += normalize(pos - mouseWorld) * push;
        }

        vWorldPosition = pos;
        vGlow = 1.0 - (dist / 14.0);

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        gl_PointSize = (12.0 / -mvPosition.z) * aScale * (1.0 + sin(uTime * 1.8 + pos.x) * 0.2);
      }
    `;

    const fragmentShader = `
      uniform vec3 uColor;
      uniform float uTime;
      varying float vGlow;
      varying vec3 vWorldPosition;

      void main() {
        float dist = distance(gl_PointCoord, vec2(0.5));
        if (dist > 0.5) discard;

        float alpha = smoothstep(0.5, 0.05, dist) * 0.8;
        
        vec3 col = mix(uColor, vec3(0.95, 0.1, 0.1), sin(vWorldPosition.y + uTime) * 0.5 + 0.5);
        col = mix(col, vec3(1.0, 0.85, 0.85), (1.0 - dist * 2.0) * 0.4);

        gl_FragColor = vec4(col, alpha);
      }
    `;

    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      targetX = (e.clientX - cx) / (rect.width / 2);
      targetY = -(e.clientY - cy) / (rect.height / 2);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();
      uniforms.uTime.value = elapsed;

      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      uniforms.uMouse.value.set(mouseX, mouseY);

      const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        posArray[i * 3] += speeds[i * 3] + Math.sin(elapsed + i) * 0.0001;
        posArray[i * 3 + 1] += speeds[i * 3 + 1] + Math.cos(elapsed + i) * 0.0001;

        const ox = originalPositions[i * 3];
        const oy = originalPositions[i * 3 + 1];
        const dx = posArray[i * 3] - ox;
        const dy = posArray[i * 3 + 1] - oy;

        if (dx * dx + dy * dy > 3.0) {
          posArray[i * 3] = ox;
          posArray[i * 3 + 1] = oy;
        }
      }
      posAttr.needsUpdate = true;

      camera.position.x = mouseX * 0.8;
      camera.position.y = mouseY * 0.5;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      scene.clear();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none -z-10" />;
}
