import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function AboutBackgroundCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 1200;
    const height = container.clientHeight || 800;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 10);

    const isMobileScreen = window.innerWidth < 768;
    const renderer = new THREE.WebGLRenderer({ antialias: !isMobileScreen, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isMobileScreen ? Math.min(window.devicePixelRatio, 1.2) : Math.min(window.devicePixelRatio, 1.8));
    container.appendChild(renderer.domElement);

    // Dynamic particles matching the red/black mesh theme
    const particleCount = isMobileScreen ? 80 : 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4 - 2;

      speeds[i * 3] = (Math.random() - 0.5) * 1.5;
      speeds[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
      speeds[i * 3 + 2] = (Math.random() - 0.5) * 0.5;

      scales[i] = 0.5 + Math.random() * 2.5;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 3));
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
      attribute vec3 aSpeed;
      varying float vGlow;
      varying vec3 vWorldPosition;

      void main() {
        vec3 pos = position;

        // Bounded, deterministic GPU-driven drift oscillation
        pos.x += sin(uTime * 0.2 + aSpeed.x) * 1.2;
        pos.y += cos(uTime * 0.15 + aSpeed.y) * 1.2;
        pos.z += sin(uTime * 0.1 + aSpeed.z) * 0.6;

        pos.x += sin(uTime * 0.4 + pos.y) * 0.12;
        pos.y += cos(uTime * 0.3 + pos.x) * 0.12;

        vec3 mouseWorld = vec3(uMouse.x * 10.0, uMouse.y * 6.0, 0.0);
        float dist = distance(pos, mouseWorld);
        if (dist < 4.0) {
          float push = (1.0 - (dist / 4.0)) * 0.6;
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

        float alpha = smoothstep(0.5, 0.05, dist) * 0.7;
        
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

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Background Mesh
    const meshSegments = isMobileScreen ? 8 : 16;
    const meshGeom = new THREE.PlaneGeometry(100, 60, meshSegments, meshSegments);
    const meshUniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
    };

    const meshVertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const meshFragmentShader = `
      varying vec2 vUv;
      uniform float uTime;
      uniform vec2 uMouse;

      void main() {
        vec2 uv = vUv;
        float n1 = sin(uv.x * 4.0 + uTime * 0.25) * cos(uv.y * 3.0 - uTime * 0.15);
        float n2 = sin(uv.y * 5.0 - uTime * 0.35) * cos(uv.x * 2.0 + uTime * 0.45);
        float wave = (n1 + n2) * 0.5;

        vec2 m = uMouse * 0.5 + 0.5;
        float d = distance(uv, m);
        float glow = smoothstep(0.65, 0.0, d) * 0.16;

        vec3 baseBlack = vec3(0.0, 0.0, 0.0);
        vec3 deepRed = vec3(0.12, 0.02, 0.02);
        vec3 vibrantRed = vec3(0.85, 0.08, 0.08);

        float factor1 = smoothstep(-0.5, 0.6, wave);
        vec3 mixedLava = mix(deepRed, baseBlack, factor1);
        mixedLava += vibrantRed * glow;

        float centerVignette = distance(uv, vec2(0.5));
        mixedLava = mix(mixedLava, vec3(0.0), centerVignette * 0.4);

        float borderVignette = smoothstep(0.0, 0.15, uv.x) * smoothstep(1.0, 0.85, uv.x) *
                               smoothstep(0.0, 0.15, uv.y) * smoothstep(1.0, 0.85, uv.y);

        gl_FragColor = vec4(mixedLava * borderVignette, 0.85 * borderVignette);
      }
    `;

    const meshMat = new THREE.ShaderMaterial({
      uniforms: meshUniforms,
      vertexShader: meshVertexShader,
      fragmentShader: meshFragmentShader,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    const backgroundMesh = new THREE.Mesh(meshGeom, meshMat);
    backgroundMesh.position.z = -5;
    scene.add(backgroundMesh);

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

    let isVisible = false;
    let animationFrameId: number | null = null;
    let clock = new THREE.Clock();

    const animate = () => {
      if (!isVisible) {
        animationFrameId = null;
        return;
      }
      animationFrameId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();
      uniforms.uTime.value = elapsed;
      meshUniforms.uTime.value = elapsed;

      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      uniforms.uMouse.value.set(mouseX, mouseY);
      meshUniforms.uMouse.value.set(mouseX, mouseY);

      camera.position.x = mouseX * 0.8;
      camera.position.y = mouseY * 0.5;
      camera.lookAt(0, 0, 0);

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
    observer.observe(container);

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
      observer.disconnect();
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      resizeObserver.disconnect();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      scene.clear();
      geometry.dispose();
      material.dispose();
      meshGeom.dispose();
      meshMat.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}
