'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ParticleNode {
  chaotic: THREE.Vector3;
  structured: THREE.Vector3;
  current: THREE.Vector3;
  jitter: THREE.Vector3;
}

const STAGES = [
  { label: 'Problem', desc: 'Disorganized challenges & friction', color: 'text-amber-400' },
  { label: 'Understand', desc: 'Identifying root bottlenecks & users', color: 'text-amber-300' },
  { label: 'Analyze', desc: 'Assessing feasibility & risk', color: 'text-cyan-300' },
  { label: 'Plan', desc: 'Architecture & practical roadmap', color: 'text-cyan-400' },
  { label: 'Build', desc: 'Quality engineering & modern stack', color: 'text-cyan-400' },
  { label: 'Solution', desc: 'Production-ready digital system', color: 'text-cyan-300' },
];

export function HeroScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 85 : 150;

    // ─── Scene, Camera, Renderer ────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    camera.position.z = isMobile ? 9.5 : 7.5;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(container.clientWidth, container.clientHeight);
    } catch {
      return;
    }

    // ─── Node Coordinates ───────────────────────────────────────
    const nodes: ParticleNode[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

    const baseRadius = isMobile ? 2.4 : 3.0;

    for (let i = 0; i < particleCount; i++) {
      // Chaotic: high entropy outward turbulence
      const radiusC = (baseRadius + 0.5) * (0.8 + Math.random() * 0.8);
      const thetaC = Math.random() * Math.PI * 2;
      const phiC = Math.acos(Math.random() * 2 - 1);
      const chaotic = new THREE.Vector3(
        radiusC * Math.sin(phiC) * Math.cos(thetaC) + (Math.random() - 0.5) * 1.8,
        radiusC * Math.sin(phiC) * Math.sin(thetaC) + (Math.random() - 0.5) * 1.8,
        radiusC * Math.cos(phiC) + (Math.random() - 0.5) * 1.8,
      );

      // Structured: crystalline harmonic sphere
      const yS = 1 - (i / (particleCount - 1)) * 2;
      const radiusS = Math.sqrt(Math.max(0, 1 - yS * yS)) * baseRadius;
      const thetaS = phi * i;
      const structured = new THREE.Vector3(
        Math.cos(thetaS) * radiusS,
        yS * baseRadius,
        Math.sin(thetaS) * radiusS,
      );

      nodes.push({
        chaotic,
        structured,
        current: chaotic.clone(),
        jitter: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
        ),
      });
    }

    // ─── Points Geometry ────────────────────────────────────────
    const pointsGeometry = new THREE.BufferGeometry();
    const positionsArray = new Float32Array(particleCount * 3);
    const colorsArray = new Float32Array(particleCount * 3);

    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positionsArray, 3));
    pointsGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));

    const pointsMaterial = new THREE.PointsMaterial({
      size: isMobile ? 0.09 : 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(pointsGeometry, pointsMaterial);
    scene.add(points);

    // ─── Network Lines Geometry ─────────────────────────────────
    const maxLines = (particleCount * (particleCount - 1)) / 2;
    const linePositions = new Float32Array(maxLines * 6);
    const lineColors = new Float32Array(maxLines * 6);

    const linesGeometry = new THREE.BufferGeometry();
    linesGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    linesGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const linesMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const lines = new THREE.LineSegments(linesGeometry, linesMaterial);
    scene.add(lines);

    // ─── Interaction & Scroll State ─────────────────────────────
    let scrollProgress = 0;
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let isTouching = false;
    let touchStartX = 0;
    let touchStartY = 0;

    const onScroll = () => {
      const maxScroll = Math.max(window.innerHeight * 0.9, 450);
      const p = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
      scrollProgress = p;

      // Update active methodology stage
      const stageIndex = Math.min(Math.floor(p * STAGES.length), STAGES.length - 1);
      setCurrentStageIdx(stageIndex);
    };

    const onMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 0.8;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 0.8;
    };

    // Mobile touch controls for natural tactile feel
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        isTouching = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isTouching || e.touches.length === 0) return;
      const deltaX = (e.touches[0].clientX - touchStartX) / window.innerWidth;
      const deltaY = (e.touches[0].clientY - touchStartY) / window.innerHeight;
      targetMouseX += deltaX * 1.5;
      targetMouseY += deltaY * 1.5;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const onTouchEnd = () => {
      isTouching = false;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    // ─── Resize Handling ─────────────────────────────────────────
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.position.z = width < 768 ? 9.5 : 7.5;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // ─── Animation Loop ──────────────────────────────────────────
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const time = clock.getElapsedTime();
      const t = scrollProgress; // 0 = Chaotic, 1 = Solution

      // Smooth camera and rotation damping
      mouseX += (targetMouseX - mouseX) * 0.06;
      mouseY += (targetMouseY - mouseY) * 0.06;

      const rotY = time * THREE.MathUtils.lerp(0.25, 0.1, t) + mouseX;
      const rotX = Math.sin(time * 0.2) * 0.15 + mouseY;

      points.rotation.y = rotY;
      points.rotation.x = rotX;
      lines.rotation.y = rotY;
      lines.rotation.x = rotX;

      // Dynamic Node Interpolation
      const posAttr = pointsGeometry.attributes.position as THREE.BufferAttribute;
      const colAttr = pointsGeometry.attributes.color as THREE.BufferAttribute;

      for (let i = 0; i < particleCount; i++) {
        const node = nodes[i];
        // Turbulence dampens as understanding and planning increase
        const turbulence = (1 - t) * 0.35;
        const noiseX = Math.sin(time * 1.5 + i) * turbulence;
        const noiseY = Math.cos(time * 1.3 + i * 2) * turbulence;
        const noiseZ = Math.sin(time * 1.1 + i * 3) * turbulence;

        node.current.lerpVectors(node.chaotic, node.structured, t);
        node.current.x += noiseX;
        node.current.y += noiseY;
        node.current.z += noiseZ;

        positionsArray[i * 3] = node.current.x;
        positionsArray[i * 3 + 1] = node.current.y;
        positionsArray[i * 3 + 2] = node.current.z;

        // Dynamic Color: Warm chaotic Amber (Problem) -> Crisp Luminous Cyan (Solution)
        const r = THREE.MathUtils.lerp(0.95, 0.05, t);
        const g = THREE.MathUtils.lerp(0.65, 0.85, t);
        const b = THREE.MathUtils.lerp(0.2, 0.95, t);

        colorsArray[i * 3] = r;
        colorsArray[i * 3 + 1] = g;
        colorsArray[i * 3 + 2] = b;
      }

      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;

      // Network Lines Calculation
      let lineIndex = 0;
      const connectDist = THREE.MathUtils.lerp(0.9, 1.45, t);

      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          const p1 = nodes[i].current;
          const p2 = nodes[j].current;
          const dist = p1.distanceTo(p2);

          if (dist < connectDist) {
            const alpha = 1.0 - dist / connectDist;

            linePositions[lineIndex * 6] = p1.x;
            linePositions[lineIndex * 6 + 1] = p1.y;
            linePositions[lineIndex * 6 + 2] = p1.z;

            linePositions[lineIndex * 6 + 3] = p2.x;
            linePositions[lineIndex * 6 + 4] = p2.y;
            linePositions[lineIndex * 6 + 5] = p2.z;

            // Lines grow crisper and brighter as structure crystallizes
            const lineAlpha = alpha * THREE.MathUtils.lerp(0.15, 0.6, t);

            const lr = THREE.MathUtils.lerp(0.9, 0.05, t) * lineAlpha;
            const lg = THREE.MathUtils.lerp(0.55, 0.8, t) * lineAlpha;
            const lb = THREE.MathUtils.lerp(0.2, 0.98, t) * lineAlpha;

            for (let k = 0; k < 6; k += 3) {
              lineColors[lineIndex * 6 + k] = lr;
              lineColors[lineIndex * 6 + k + 1] = lg;
              lineColors[lineIndex * 6 + k + 2] = lb;
            }

            lineIndex++;
          }
        }
      }

      const linePosAttr = linesGeometry.attributes.position as THREE.BufferAttribute;
      const lineColAttr = linesGeometry.attributes.color as THREE.BufferAttribute;
      linePosAttr.needsUpdate = true;
      lineColAttr.needsUpdate = true;
      linesGeometry.setDrawRange(0, lineIndex * 2);

      renderer.render(scene, camera);
    };

    animate();

    // ─── Cleanup ─────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      resizeObserver.disconnect();

      pointsGeometry.dispose();
      pointsMaterial.dispose();
      linesGeometry.dispose();
      linesMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden">
      <canvas ref={canvasRef} className="h-full w-full block" />

      {/* Floating Methodology Transition Status Pill */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-slate-950/80 backdrop-blur-md shadow-lg text-xs font-mono">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
          </span>
          <span className="text-muted-foreground uppercase tracking-widest text-[10px]">
            Methodology:
          </span>
          <span className={`font-semibold uppercase ${STAGES[currentStageIdx].color}`}>
            {STAGES[currentStageIdx].label}
          </span>
          <span className="hidden sm:inline text-muted-foreground text-[10px]">
            — {STAGES[currentStageIdx].desc}
          </span>
        </div>
      </div>
    </div>
  );
}
