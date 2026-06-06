import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function PhoenixParticles() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Standard high performance 3D scene setup
    const scene = new THREE.Scene();
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Clean perspective camera focused purely on the center of the bird
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.2);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // High fidelity pristine structural particle bird
    const particleCount = 28000;
    const geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(particleCount * 3);
    const initialPositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const initialColors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const customData = new Float32Array(particleCount * 4); // [speed, offset, angleOffset, particleSectionType]

    // Cozy, extremely dim ambient embers (ghost outline by default, pure elegant luxury)
    const cDimCharcoal = new THREE.Color("#050102"); 
    const cDimBurgundy = new THREE.Color("#0f0203");
    const cDimRust = new THREE.Color("#1a0405");

    for (let i = 0; i < particleCount; i++) {
      let x = 0, y = 0, z = 0;
      let sectType = 1; // 1=Body/Head, 2=Left Wing, 3=Right Wing, 4=Tail
      const rSect = Math.random();

      if (rSect < 0.20) {
        // A. HIGH ACCURACY CENTRAL BODY, NOBLE HEAD & SYMMETRICAL CRESTS (20%)
        sectType = 1;
        const t = Math.random(); // vertical progress from 0 (bottom of body) to 1 (top of head/beak)
        
        if (t < 0.55) {
          // Torso: Muscular fire-shaped teardrop silhouette merging into the hips
          const progress = t / 0.55;
          y = -0.55 + 1.15 * progress;
          // Torso width taper curve fitting the thick, powerful central torso in the reference photo
          const radius = (0.05 + 0.14 * Math.sin(progress * Math.PI)) * (0.8 + 0.2 * Math.random());
          const theta = Math.random() * Math.PI * 2;
          x = Math.cos(theta) * radius;
          z = Math.sin(theta) * radius * 0.55;
        } else if (t < 0.78) {
          // Neck: Thick, graceful flame column
          const progress = (t - 0.55) / 0.23;
          y = 0.60 + 0.32 * progress;
          const radius = (0.045 - 0.012 * progress) * (0.9 + 0.1 * Math.random());
          const theta = Math.random() * Math.PI * 2;
          x = Math.cos(theta) * radius;
          z = Math.sin(theta) * radius * 0.55;
        } else {
          // Proud crest head with a sleek, backwards-sweeping feather plume (matching real noble phoenix depiction)
          const progress = (t - 0.78) / 0.22;
          y = 0.92 + 0.22 * progress;
          
          const rHead = Math.random();
          if (rHead < 0.35) {
            // Sleek feathery crown crest sweeping elegantly backward and slightly upward along the midline
            const uCrest = Math.random();
            x = (Math.random() - 0.5) * 0.035; // keep it tight to the head midline, no horn/antler look
            y = 1.05 + 0.18 * uCrest;
            z = -0.04 - 0.16 * uCrest; // sweeps backward elegantly
          } else {
            // Standard central head and piercing forward beak projection
            const radius = 0.055 * Math.sin((1 - progress) * Math.PI * 0.5 + 0.5);
            const theta = Math.random() * Math.PI * 2;
            x = Math.cos(theta) * radius;
            z = Math.sin(theta) * radius * 0.65;
            
            // Hawk-like elegant pointed beak sweeping forward and slightly down
            if (progress > 0.4) {
              const beakP = (progress - 0.4) / 0.6;
              z += beakP * 0.16;
              y -= beakP * 0.045;
              x *= (1 - beakP); // elegant taper
            }
          }
        }
      } else if (rSect < 0.84) {
        // B. SYMMETRICAL WINGS WITH OUTER PLUME FLARINGS (64%)
        // Closely model the wings from the source photo: curving out, thick coverts, and dramatic vertical flaring at the tips.
        const isLeft = Math.random() < 0.5;
        sectType = isLeft ? 2 : 3;
        const sign = isLeft ? -1 : 1;
        
        const wingPart = Math.random();
        const u = Math.random(); // span factor along wing bone (0 to 1)

        // Calculate right-wing base coordinates first (symmetry is handled perfectly at the end)
        const wingX = 0.04 + 2.35 * Math.pow(u, 0.85);
        // S-shaped curve modeling the high-flying soaring posture
        const wingY = -0.15 + 1.35 * Math.pow(u, 1.3) + 0.68 * Math.sin(u * Math.PI);
        const wingZ = -u * 0.20;

        if (wingPart < 0.52) {
          // Layer 1: Long structural feathers fanning and draping beautifully down and out
          const fanAngle = (1.18 + (u * 0.62 - 0.31)) * Math.PI * 0.5;
          const featherLength = (0.42 + 1.45 * Math.pow(1.0 - u, 0.55)) * (0.18 + 0.82 * Math.random());
          const v = Math.random();
          
          x = wingX + Math.cos(fanAngle) * featherLength * v;
          y = wingY + Math.sin(fanAngle) * featherLength * v;
          z = wingZ + (Math.random() - 0.5) * 0.04 - u * 0.18;
        } else if (wingPart < 0.82) {
          // Layer 2: Main dense wing coverts (creates the majestic silhouette thickness near body)
          const angle = (1.65 - u * 0.45) * Math.PI * 0.5;
          const len = (0.22 + 0.65 * Math.pow(1.0 - u, 0.5)) * Math.random();
          
          x = wingX + Math.cos(angle) * len;
          y = wingY + Math.sin(angle) * len;
          z = wingZ + 0.08 * (Math.random() - 0.5);
        } else {
          // Layer 3: Flaring outer wing tips (upward tongues of fire/smoke)
          // Near the tips (u > 0.65), feathers sweep straight up like burning dynamic flames in the reference photo
          const tSpan = 0.65 + u * 0.35;
          const fx = 0.04 + 2.35 * Math.pow(tSpan, 0.85);
          const fy = -0.15 + 1.35 * Math.pow(tSpan, 1.3) + 0.68 * Math.sin(tSpan * Math.PI);
          
          const flameProg = Math.random();
          // vertical flaring
          x = fx + (Math.random() - 0.5) * 0.20;
          y = fy + flameProg * (0.55 + 0.75 * tSpan);
          z = -tSpan * 0.20 + (Math.random() - 0.5) * 0.05;
        }

        // Apply symmetry mirroring to the left side
        x = x * sign;
      } else {
        // C. BROAD SHIELD-LIKE CASCADING TAIL FEATHERS (16%)
        sectType = 4;
        const t = Math.random(); // progress along tail blade
        
        // 9 distinct ribbons fanning outwards symmetrically to match the beautiful shield shape below
        const strandID = Math.floor(Math.random() * 9);
        const strandFactor = (strandID - 4) * 0.22; // symmetrically fanned x offsets

        const length = 1.35 + 0.55 * Math.random();
        y = -0.55 - t * length;
        
        // S-curve sweeping elegantly outward on the flanks
        const sweepX = strandFactor * Math.pow(t, 1.15) * 0.95 + (Math.random() - 0.5) * 0.02;
        x = sweepX;
        z = (Math.random() - 0.5) * 0.04 - t * 0.12;
      }

      // Record Positions
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      initialPositions[i * 3] = x;
      initialPositions[i * 3 + 1] = y;
      initialPositions[i * 3 + 2] = z;

      // Assign extremely dark, luxury-designed base color template
      // This maps to "subtle invisible outline" concept
      let pColor = cDimCharcoal;
      const cChance = Math.random();
      if (sectType === 1) {
        // Body (slight elegant whisper of dark rose)
        pColor = cChance < 0.6 ? cDimBurgundy : cDimRust;
      } else if (sectType === 4) {
        // Tail (dark luxury charcoal)
        pColor = cChance < 0.5 ? cDimCharcoal : cDimBurgundy;
      } else {
        // Wings (whispering dark burgundy to look incredibly professional)
        pColor = cChance < 0.75 ? cDimBurgundy : cDimRust;
      }

      colors[i * 3] = pColor.r;
      colors[i * 3 + 1] = pColor.g;
      colors[i * 3 + 2] = pColor.b;

      initialColors[i * 3] = pColor.r;
      initialColors[i * 3 + 1] = pColor.g;
      initialColors[i * 3 + 2] = pColor.b;

      // EXTREMELY SMALL, elegant micro-dots representing celestial dust
      sizes[i] = 0.35 + Math.random() * 1.15;

      // Speed & movement metadata configuration
      customData[i * 4] = 0.52 + Math.random() * 1.05; // speed multiplier
      customData[i * 4 + 1] = Math.random() * Math.PI * 2; // initial phase
      customData[i * 4 + 2] = (Math.random() < 0.5 ? -1.0 : 1.0) * (0.15 + Math.random() * 0.25); // direction
      customData[i * 4 + 3] = sectType; // identifier
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

    // High performance Points material
    const material = new THREE.PointsMaterial({
      size: 0.0125, // VERY SMALL pristine micro-particles (highly sophisticated, looks just like a 3D scan)
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    // Custom shader compile overrides to render perfectly round glowing plasma spikes
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        "void main() {",
        `
        attribute float aSize;
        void main() {
        `
      );
      shader.vertexShader = shader.vertexShader.replace(
        "gl_PointSize = size;",
        "gl_PointSize = size * aSize;"
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "void main() {",
        `
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;
          float alpha = smoothstep(0.5, 0.08, dist);
        `
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "gl_FragColor = vec4( diffuseColor.rgb, diffuseColor.a );",
        "gl_FragColor = vec4( diffuseColor.rgb, diffuseColor.a * alpha * 1.45 );"
      );
    };

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Track mouse interaction properties
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0, active: false };

    const handleMouseMove = (event: MouseEvent) => {
      mouse.targetX = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(event.clientY / window.innerHeight) * 2 + 1;
      mouse.active = true;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Handle Resize events securely
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    // Dynamic rendering loop
    const clock = new THREE.Clock();
    let reqId: number;

    // Premium active glows (intense cosmic laser field) when interacted with
    const cActiveBrightOrange = new THREE.Color("#f24e13");
    const cActiveGoldenFire = new THREE.Color("#ecaa0d");
    const cActiveCrimsonLaser = new THREE.Color("#cc0004");

    const animate = () => {
      reqId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      
      // Interpolate mouse smoothly (Euler decay)
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // Front angle perspective (no ongoing auto rotation), subtle reactive mouse-parallax
      if (points) {
        points.rotation.y = mouse.x * 0.16;
        points.rotation.x = -0.05 + mouse.y * 0.1;
        // Whisper constant hover float
        points.position.y = Math.sin(elapsedTime * 0.75) * 0.035;
      }

      const posArray = geometry.attributes.position.array as Float32Array;
      const colorArray = geometry.attributes.color.array as Float32Array;
      const count = posArray.length / 3;

      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        
        const ix = initialPositions[idx];
        const iy = initialPositions[idx + 1];
        const iz = initialPositions[idx + 2];

        const speed = customData[i * 4];
        const phaseOffset = customData[i * 4 + 1];
        const spinMultiplier = customData[i * 4 + 2];
        const type = customData[i * 4 + 3];

        let targetX = ix;
        let targetY = iy;
        let targetZ = iz;

        // Elegant micro thermal wave oscillation (very muted, high physical stability)
        if (type === 2 || type === 3) {
          // Extremely subtle majestic wing flutter, keeping wings clean and identifiable
          const flap = Math.sin(elapsedTime * 1.5 * speed + phaseOffset) * 0.022;
          targetY += flap;
          targetZ += flap * 0.4;
        } else if (type === 4) {
          // Subtle ribbon flow
          targetX += Math.sin(iy * 2.0 + elapsedTime * 1.35 * speed) * 0.022;
          targetZ += Math.cos(elapsedTime * 1.1 + phaseOffset) * 0.015;
        } else {
          // Heat shimmering body hum
          targetX += Math.sin(elapsedTime * 2.5 + phaseOffset) * 0.003;
          targetY += Math.cos(elapsedTime * 2.5 + phaseOffset) * 0.003;
        }

        let proximityIntensity = 0;

        // Responsive active drag gravity matching the flower attraction website code
        if (mouse.active) {
          const mouseWorldX = mouse.x * 2.6;
          const mouseWorldY = mouse.y * 2.1;

          const dx = mouseWorldX - posArray[idx];
          const dy = mouseWorldY - posArray[idx + 1];
          const dz = 0.0 - posArray[idx + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < 1.4) {
            // Highly tactile, fluid vector displacement
            const pullFactor = Math.pow((1.4 - dist) / 1.4, 1.45);
            proximityIntensity = pullFactor; // illuminate particles as the mouse moves close

            const vortexStrength = pullFactor * 0.28;
            const swirlX = -dy * vortexStrength * 0.65 * (spinMultiplier > 0 ? 1 : -1);
            const swirlY = dx * vortexStrength * 0.65 * (spinMultiplier > 0 ? 1 : -1);

            targetX += dx * vortexStrength * 0.35 + swirlX;
            targetY += dy * vortexStrength * 0.35 + swirlY;
            targetZ += dz * vortexStrength * 0.22;
          }
        }

        // High precision Euler spring feedback cycle (Returns to correct bird silhouette frame)
        posArray[idx] += (targetX - posArray[idx]) * 0.12;
        posArray[idx + 1] += (targetY - posArray[idx + 1]) * 0.12;
        posArray[idx + 2] += (targetZ - posArray[idx + 2]) * 0.12;

        // Elegant lerp transition: Muted background colors transition to active neon flame colors
        const baseR = initialColors[idx];
        const baseG = initialColors[idx + 1];
        const baseB = initialColors[idx + 2];

        // Assigning responsive glowing highlights based on element sector type
        let activeColor = cActiveGoldenFire;
        if (type === 1) {
          activeColor = cActiveGoldenFire;
        } else if (type === 2 || type === 3) {
          // Inner wing area has bright golden flares, outer wing has hot orange
          activeColor = (Math.abs(ix) < 0.65) ? cActiveGoldenFire : cActiveBrightOrange;
        } else if (type === 4) {
          activeColor = cActiveCrimsonLaser;
        }

        colorArray[idx] += (THREE.MathUtils.lerp(baseR, activeColor.r, proximityIntensity) - colorArray[idx]) * 0.12;
        colorArray[idx + 1] += (THREE.MathUtils.lerp(baseG, activeColor.g, proximityIntensity) - colorArray[idx + 1]) * 0.12;
        colorArray[idx + 2] += (THREE.MathUtils.lerp(baseB, activeColor.b, proximityIntensity) - colorArray[idx + 2]) * 0.12;
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener("mousemove", handleMouseMove);
      resizeObserver.disconnect();
      if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-10" 
      style={{ mixBlendMode: "screen" }}
    />
  );
}
