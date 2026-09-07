'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ParticleNode {
  chaotic: THREE.Vector3;
  structured: THREE.Vector3;
  current: THREE.Vector3;
}

export function HeroScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 80 : 140;

    // ─── Three.js Scene Setup ──────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    camera.position.z = isMobile ? 9.0 : 7.2;

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

    // ─── Mathematical Lattice Coordinates ──────────────────────
    const nodes: ParticleNode[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
    const baseRadius = isMobile ? 2.3 : 2.8;

    for (let i = 0; i < particleCount; i++) {
      // Chaotic: high entropy, scattered points (The Problem)
      const radiusC = (baseRadius + 0.4) * (0.8 + Math.random() * 0.9);
      const thetaC = Math.random() * Math.PI * 2;
      const phiC = Math.acos(Math.random() * 2 - 1);
      const chaotic = new THREE.Vector3(
        radiusC * Math.sin(phiC) * Math.cos(thetaC) + (Math.random() - 0.5) * 1.6,
        radiusC * Math.sin(phiC) * Math.sin(thetaC) + (Math.random() - 0.5) * 1.6,
        radiusC * Math.cos(phiC) + (Math.random() - 0.5) * 1.6,
      );

      // Structured: Harmonic spherical lattice (The Solution)
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
      });
    }

    // Points Buffer
    const pointsGeometry = new THREE.BufferGeometry();
    const positionsArray = new Float32Array(particleCount * 3);
    const colorsArray = new Float32Array(particleCount * 3);

    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positionsArray, 3));
    pointsGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));

    const pointsMaterial = new THREE.PointsMaterial({
      size: isMobile ? 0.08 : 0.07,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(pointsGeometry, pointsMaterial);
    scene.add(points);

    // Connecting Lines Buffer
    const maxLines = (particleCount * (particleCount - 1)) / 2;
    const linePositions = new Float32Array(maxLines * 6);
    const lineColors = new Float32Array(maxLines * 6);

    const linesGeometry = new THREE.BufferGeometry();
    linesGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    linesGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const linesMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const lines = new THREE.LineSegments(linesGeometry, linesMaterial);
    scene.add(lines);

    // ─── Interaction & Scroll State ─────────────────────────────
    let scrollProgress = 0;
    let targetScrollProgress = 0;
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const onScroll = () => {
      const maxScroll = Math.max(window.innerHeight * 0.85, 400);
      targetScrollProgress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
    };

    const onMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 0.6;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 0.6;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // Touch support
    let touchStartX = 0;
    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      targetMouseX += ((e.touches[0].clientX - touchStartX) / window.innerWidth) * 0.8;
      targetMouseY += ((e.touches[0].clientY - touchStartY) / window.innerHeight) * 0.8;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    // Resize
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.position.z = width < 768 ? 9.0 : 7.2;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // ─── Apple-Style Smooth Animation Loop ──────────────────────
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Weighted damping for Apple-like momentum
      scrollProgress += (targetScrollProgress - scrollProgress) * 0.08;
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      const t = scrollProgress; // 0 = Problem, 1 = Solution

      const rotY = time * THREE.MathUtils.lerp(0.18, 0.08, t) + mouseX;
      const rotX = Math.sin(time * 0.15) * 0.12 + mouseY;

      points.rotation.y = rotY;
      points.rotation.x = rotX;
      lines.rotation.y = rotY;
      lines.rotation.x = rotX;

      // Interpolate nodes
      const posAttr = pointsGeometry.attributes.position as THREE.BufferAttribute;
      const colAttr = pointsGeometry.attributes.color as THREE.BufferAttribute;

      for (let i = 0; i < particleCount; i++) {
        const node = nodes[i];
        // Turbulence settles down as the problem is understood and resolved
        const turbulence = (1 - t) * 0.28;
        const nx = Math.sin(time * 1.4 + i) * turbulence;
        const ny = Math.cos(time * 1.2 + i * 2) * turbulence;
        const nz = Math.sin(time * 1.0 + i * 3) * turbulence;

        node.current.lerpVectors(node.chaotic, node.structured, t);
        node.current.x += nx;
        node.current.y += ny;
        node.current.z += nz;

        positionsArray[i * 3] = node.current.x;
        positionsArray[i * 3 + 1] = node.current.y;
        positionsArray[i * 3 + 2] = node.current.z;

        // Subtle color evolution: muted warm amber/smoke -> clear luminous cyan
        const r = THREE.MathUtils.lerp(0.85, 0.08, t);
        const g = THREE.MathUtils.lerp(0.6, 0.78, t);
        const b = THREE.MathUtils.lerp(0.25, 0.92, t);

        colorsArray[i * 3] = r;
        colorsArray[i * 3 + 1] = g;
        colorsArray[i * 3 + 2] = b;
      }

      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;

      // Lines connect close neighbors
      let lineIndex = 0;
      const connectDist = THREE.MathUtils.lerp(0.85, 1.35, t);

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

            const lineAlpha = alpha * THREE.MathUtils.lerp(0.12, 0.48, t);

            for (let k = 0; k < 6; k += 3) {
              lineColors[lineIndex * 6 + k] = 0.1 * lineAlpha;
              lineColors[lineIndex * 6 + k + 1] = 0.65 * lineAlpha;
              lineColors[lineIndex * 6 + k + 2] = 0.92 * lineAlpha;
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

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
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
    </div>
  );
}
