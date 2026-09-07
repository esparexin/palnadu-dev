'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const PARTICLE_COUNT = 150;

interface ParticleNode {
  chaotic: THREE.Vector3;
  structured: THREE.Vector3;
  current: THREE.Vector3;
  jitter: THREE.Vector3;
}

export function HeroScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // ─── Scene, Camera, Renderer ────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    camera.position.z = 8;

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
      // WebGL not available
      return;
    }

    // ─── Node Data Calculation ──────────────────────────────────
    const nodes: ParticleNode[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Chaotic: random scattered distribution with outward turbulence
      const radiusC = 3.2 + Math.random() * 2.2;
      const thetaC = Math.random() * Math.PI * 2;
      const phiC = Math.acos(Math.random() * 2 - 1);
      const chaotic = new THREE.Vector3(
        radiusC * Math.sin(phiC) * Math.cos(thetaC) + (Math.random() - 0.5) * 1.5,
        radiusC * Math.sin(phiC) * Math.sin(thetaC) + (Math.random() - 0.5) * 1.5,
        radiusC * Math.cos(phiC) + (Math.random() - 0.5) * 1.5,
      );

      // Structured: Fibonacci lattice on sphere (Solution)
      const yS = 1 - (i / (PARTICLE_COUNT - 1)) * 2;
      const radiusS = Math.sqrt(Math.max(0, 1 - yS * yS)) * 2.8;
      const thetaS = phi * i;
      const structured = new THREE.Vector3(
        Math.cos(thetaS) * radiusS,
        yS * 2.8,
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

    // ─── Points Geometry & Material ─────────────────────────────
    const pointsGeometry = new THREE.BufferGeometry();
    const positionsArray = new Float32Array(PARTICLE_COUNT * 3);
    const colorsArray = new Float32Array(PARTICLE_COUNT * 3);

    pointsGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positionsArray, 3),
    );
    pointsGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(colorsArray, 3),
    );

    const pointsMaterial = new THREE.PointsMaterial({
      size: 0.065,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });

    const points = new THREE.Points(pointsGeometry, pointsMaterial);
    scene.add(points);

    // ─── Lines Geometry & Material ──────────────────────────────
    const maxLines = (PARTICLE_COUNT * (PARTICLE_COUNT - 1)) / 2;
    const linePositions = new Float32Array(maxLines * 6);
    const lineColors = new Float32Array(maxLines * 6);

    const linesGeometry = new THREE.BufferGeometry();
    linesGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(linePositions, 3),
    );
    linesGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(lineColors, 3),
    );

    const linesMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.45,
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

    const onScroll = () => {
      const maxScroll = Math.max(window.innerHeight * 0.8, 400);
      scrollProgress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
    };

    const onMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 0.6;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 0.6;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // ─── Resize Handling ─────────────────────────────────────────
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
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
      const t = scrollProgress; // 0 = Problem (chaotic), 1 = Solution (structured)

      // Smooth mouse parallax
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // Group rotation
      const rotY = time * THREE.MathUtils.lerp(0.2, 0.08, t) + mouseX;
      const rotX = Math.sin(time * 0.15) * 0.2 + mouseY;

      points.rotation.y = rotY;
      points.rotation.x = rotX;
      lines.rotation.y = rotY;
      lines.rotation.x = rotX;

      // Interpolate nodes
      const posAttr = pointsGeometry.attributes.position as THREE.BufferAttribute;
      const colAttr = pointsGeometry.attributes.color as THREE.BufferAttribute;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const node = nodes[i];

        // Chaotic turbulence reduces as t approaches 1
        const turbulence = (1 - t) * 0.25;
        const noiseX = Math.sin(time * 1.4 + i) * turbulence;
        const noiseY = Math.cos(time * 1.2 + i * 2) * turbulence;
        const noiseZ = Math.sin(time * 1.0 + i * 3) * turbulence;

        node.current.lerpVectors(node.chaotic, node.structured, t);
        node.current.x += noiseX;
        node.current.y += noiseY;
        node.current.z += noiseZ;

        positionsArray[i * 3] = node.current.x;
        positionsArray[i * 3 + 1] = node.current.y;
        positionsArray[i * 3 + 2] = node.current.z;

        // Color transition: Muted charcoal/amber -> Elegant luminous cyan
        const r = THREE.MathUtils.lerp(0.55, 0.15, t);
        const g = THREE.MathUtils.lerp(0.5, 0.72, t);
        const b = THREE.MathUtils.lerp(0.5, 0.95, t);

        colorsArray[i * 3] = r;
        colorsArray[i * 3 + 1] = g;
        colorsArray[i * 3 + 2] = b;
      }

      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;

      // Calculate connections
      let lineIndex = 0;
      const connectDist = THREE.MathUtils.lerp(0.85, 1.35, t);

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        for (let j = i + 1; j < PARTICLE_COUNT; j++) {
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

            const lineAlpha = alpha * THREE.MathUtils.lerp(0.1, 0.45, t);

            for (let k = 0; k < 6; k += 3) {
              lineColors[lineIndex * 6 + k] = 0.25 * lineAlpha;
              lineColors[lineIndex * 6 + k + 1] = 0.65 * lineAlpha;
              lineColors[lineIndex * 6 + k + 2] = 0.95 * lineAlpha;
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
      resizeObserver.disconnect();

      pointsGeometry.dispose();
      pointsMaterial.dispose();
      linesGeometry.dispose();
      linesMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full pointer-events-none">
      <canvas ref={canvasRef} className="h-full w-full block" />
    </div>
  );
}
