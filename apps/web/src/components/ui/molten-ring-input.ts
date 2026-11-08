import {
  DRAG,
  CLICK_SLOP,
  CLICK_MS,
  SNAP_IDLE,
  SNAP_EASE,
  EASE,
  clamp,
  outCubic,
} from "./molten-ring-constants";

export interface RingInputState {
  goal: number;
  lastInput: number;
  snapped: boolean;
  pointerX: number;
  pointerY: number;
  pointerSpeed: number;
  hovered: number;
  tween: { from: number; to: number; at: number } | null;
}

export function attachRingInputs(
  canvas: HTMLCanvasElement,
  state: RingInputState,
  count: number,
  FRONT: number,
  scrollLinkedRef: React.RefObject<boolean>,
  scrollProgressRef: React.RefObject<number | undefined>
) {
  let dragFromY: number | null = null;
  let dragFromX: number | null = null;
  let dragTravel = 0;
  let isCaptured = false;

  const onWheel = () => {
    state.lastInput = performance.now();
  };

  const onDown = (event: PointerEvent) => {
    dragFromY = event.clientY;
    dragFromX = event.clientX;
    dragTravel = 0;
    state.tween = null;
    if (event.pointerType === "mouse") {
      canvas.setPointerCapture(event.pointerId);
      isCaptured = true;
    }
  };

  const onMove = (event: PointerEvent) => {
    const box = canvas.getBoundingClientRect();
    const nx = event.clientX - box.left;
    const ny = event.clientY - box.top;
    state.pointerSpeed = Math.hypot(nx - state.pointerX, ny - state.pointerY);
    state.pointerX = nx;
    state.pointerY = ny;

    if (dragFromY !== null && dragFromX !== null) {
      const dy = event.clientY - dragFromY;
      const dx = event.clientX - dragFromX;
      dragTravel += Math.hypot(dx, dy);
      state.goal -= dy * DRAG;
      dragFromY = event.clientY;
      dragFromX = event.clientX;
      state.lastInput = performance.now();
      state.snapped = false;
    }
  };

  const onUp = (event: PointerEvent) => {
    if (dragTravel < CLICK_SLOP) {
      const box = canvas.getBoundingClientRect();
      const clickY = event.clientY - box.top;
      const mid = box.height / 2;
      const dir = clickY < mid - 20 ? -1 : clickY > mid + 20 ? 1 : 0;
      if (dir) {
        state.tween = { from: state.goal, to: Math.round(state.goal) + dir, at: performance.now() };
        state.lastInput = performance.now();
        state.snapped = true;
      }
    }
    dragFromY = null;
    dragFromX = null;
    if (isCaptured) {
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch {}
      isCaptured = false;
    }
  };

  const onLeave = () => {
    state.pointerX = -1;
    state.pointerY = -1;
    state.hovered = -1;
  };

  const onWindowScroll = () => {
    if (!scrollLinkedRef.current || typeof scrollProgressRef.current === "number") return;
    const rect = canvas.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const top = rect.top;
    const h = rect.height;
    if (top > vh || top + h < 0) return;
    const frac = clamp((vh - top) / (vh + h), 0, 1);
    state.goal = frac * (count - 1);
    state.lastInput = performance.now();
    state.snapped = false;
  };

  canvas.addEventListener("wheel", onWheel, { passive: true });
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("pointerleave", onLeave);
  window.addEventListener("scroll", onWindowScroll, { passive: true });

  return () => {
    canvas.removeEventListener("wheel", onWheel);
    canvas.removeEventListener("pointerdown", onDown);
    canvas.removeEventListener("pointermove", onMove);
    canvas.removeEventListener("pointerup", onUp);
    canvas.removeEventListener("pointercancel", onUp);
    canvas.removeEventListener("pointerleave", onLeave);
    window.removeEventListener("scroll", onWindowScroll);
  };
}

export function updateRingHover(
  inputState: RingInputState,
  at: Array<{ x: number; y: number }>,
  count: number,
  long: number,
  short: number,
  mx: number,
  my: number,
  present: number
) {
  if (present && inputState.pointerSpeed < 24) {
    inputState.hovered = -1;
    let best = Infinity;
    for (let i = 0; i < count; i++) {
      const dx = Math.abs(mx - at[i].x);
      const dy = Math.abs(my - at[i].y);
      if (dx > long / 2 || dy > short / 2) continue;
      if (dx + dy < best) {
        best = dx + dy;
        inputState.hovered = i;
      }
    }
  }
  inputState.pointerSpeed *= 0.85;
}

export function advanceRingProgress({
  inputState,
  scrollProgress,
  count,
  now,
  reduced,
  currentProgress,
}: {
  inputState: RingInputState;
  scrollProgress?: number;
  count: number;
  now: number;
  reduced: boolean;
  currentProgress: number;
}) {
  if (typeof scrollProgress === "number" && !inputState.tween) {
    inputState.goal = clamp(scrollProgress, 0, 1) * (count - 1);
    inputState.snapped = false;
  } else if (inputState.tween) {
    const t = clamp((now - inputState.tween.at) / CLICK_MS, 0, 1);
    inputState.goal = inputState.tween.from + (inputState.tween.to - inputState.tween.from) * outCubic(t);
    if (t >= 1) inputState.tween = null;
  } else if (!inputState.snapped && now - inputState.lastInput > SNAP_IDLE) {
    inputState.goal = Math.round(inputState.goal);
    inputState.snapped = true;
  }
  const nextProgress =
    currentProgress + (inputState.goal - currentProgress) * (reduced ? 1 : inputState.snapped ? SNAP_EASE : EASE);
  const speed = Math.abs(inputState.goal - nextProgress);
  return { nextProgress, speed };
}
