import * as React from "react";
import {
  MAX_CARDS,
  MAX_STRANDS,
  ENTRY_MS,
  THEME_EVERY,
  inOutCubic,
  type MoltenRingItem,
} from "./molten-ring-constants";
import { QUAD_VERT, RING_FRAG } from "./molten-ring-shaders";
import { build, uniforms, colorReader } from "./molten-ring-gl";
import { computeRingFrame } from "./molten-ring-sim";
import {
  attachRingInputs,
  updateRingHover,
  advanceRingProgress,
  type RingInputState,
} from "./molten-ring-input";
import { renderRingPass } from "./molten-ring-renderer";
import { createQuadMesh, loadRingAtlas } from "./molten-ring-loader";

interface UseMoltenRingGlParams {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  items: MoltenRingItem[];
  count: number;
  sources: string;
  reduced: boolean;
  settings: React.MutableRefObject<{
    arc: number;
    cardSize: number;
    cardRatio: number;
    fuse: number;
    threads: boolean;
    glass: boolean;
  }>;
  scrollLinkedRef: React.MutableRefObject<boolean>;
  scrollProgressRef: React.MutableRefObject<number | undefined>;
  step: React.MutableRefObject<(_by: number) => void>;
  setActive: React.Dispatch<React.SetStateAction<number>>;
  setSupported: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useMoltenRingGl({
  canvasRef,
  items,
  count,
  sources,
  reduced,
  settings,
  scrollLinkedRef,
  scrollProgressRef,
  step,
  setActive,
  setSupported,
}: UseMoltenRingGlParams) {
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !count) return;

    const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: false, antialias: false });
    if (!gl) {
      setSupported(false);
      return;
    }

    const readColor = colorReader();
    const program = build(gl, QUAD_VERT, RING_FRAG);
    if (!program) return;
    const u = uniforms(gl, program);

    const { quad, buffer } = createQuadMesh(gl);
    const atlasLoader = loadRingAtlas(gl, items, count, settings.current.cardRatio);

    let width = 0;
    let height = 0;
    let progress = 0;
    let entry = 0;
    let clock = 0;
    let previous = 0;
    let ticks = 0;
    let frame = 0;
    let ink: [number, number, number] = [0, 0, 0];

    const inputState: RingInputState = {
      goal: 0,
      lastInput: 0,
      snapped: true,
      pointerX: -1,
      pointerY: -1,
      pointerSpeed: 0,
      hovered: -1,
      tween: null,
    };

    const leanX = new Float32Array(count);
    const leanY = new Float32Array(count);
    const swell = new Float32Array(count);
    const dim = new Float32Array(count);
    const pos = new Float32Array(MAX_CARDS * 2);
    const rot = new Float32Array(MAX_CARDS);
    const scale = new Float32Array(MAX_CARDS * 4);
    const strandA = new Float32Array(MAX_STRANDS * 2);
    const strandB = new Float32Array(MAX_STRANDS * 2);
    const strandPar = new Float32Array(MAX_STRANDS * 4);
    const at = Array.from({ length: count }, () => ({ x: 0, y: 0, angle: 0, scale: 1 }));
    const FRONT = Math.floor(count / 2);

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = w;
      height = h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    step.current = (by: number) => {
      inputState.tween = { from: inputState.goal, to: Math.round(inputState.goal) + by, at: performance.now() };
      inputState.lastInput = performance.now();
      inputState.snapped = true;
    };

    const cleanupInputs = attachRingInputs(canvas, inputState, count, FRONT, scrollLinkedRef, scrollProgressRef);

    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      if (!width || !height) return;
      const dt = previous ? Math.min((now - previous) / 1000, 1 / 20) : 0;
      previous = now;
      clock += dt;
      const config = settings.current;

      if (ticks++ % THEME_EVERY === 0) ink = readColor(getComputedStyle(canvas).color);
      const atlas = atlasLoader.getAtlas();
      if (atlas) entry = reduced ? 1 : Math.min(1, entry + (dt * 1000) / ENTRY_MS);
      const spread = inOutCubic(entry);

      const { nextProgress, speed } = advanceRingProgress({
        inputState,
        scrollProgress: scrollProgressRef.current,
        count,
        now,
        reduced,
        currentProgress: progress,
      });
      progress = nextProgress;

      const near = (((Math.round(inputState.goal) + FRONT) % count) + count) % count;
      setActive((prev) => (prev === near ? prev : near));

      const long = width * config.cardSize;
      const short = long / config.cardRatio;
      const mx = inputState.pointerX >= 0 ? inputState.pointerX - width / 2 : 0;
      const my = inputState.pointerY >= 0 ? height / 2 - inputState.pointerY : 0;
      const present = inputState.pointerX >= 0 ? 1 : 0;

      updateRingHover(inputState, at, count, long, short, mx, my, present);

      const { strands } = computeRingFrame({
        count,
        width,
        config,
        progress,
        spread,
        FRONT,
        pointerX: inputState.pointerX,
        pointerY: inputState.pointerY,
        height,
        hovered: inputState.hovered,
        leanX,
        leanY,
        dim,
        swell,
        at,
        pos,
        rot,
        scale,
        strandA,
        strandB,
        strandPar,
      });

      renderRingPass({
        gl,
        program,
        quad,
        u,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        width,
        height,
        long,
        short,
        count,
        pos,
        rot,
        scale,
        strands,
        strandA,
        strandB,
        strandPar,
        fuse: config.fuse,
        reduced,
        speed,
        spread,
        clock,
        ink,
        atlas,
        COLS: atlasLoader.COLS,
        mx,
        my,
        present,
        pointerSpeed: inputState.pointerSpeed,
        glass: config.glass,
      });
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      cleanupInputs();
      atlasLoader.cleanup();
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(quad);
      gl.deleteProgram(program);
    };
  }, [sources, count, reduced]);
}
