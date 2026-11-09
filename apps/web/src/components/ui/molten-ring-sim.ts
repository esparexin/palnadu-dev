import {
  SPACING,
  REACH,
  PULL,
  GRAB,
  RELEASE,
  NEIGHBOUR_PUSH,
  NEIGHBOUR_DIM,
  NEIGHBOUR_SCALE,
  NEIGHBOUR_REACH,
  SWELL,
  MAX_STRANDS,
  STRAND_SNAP,
  STRAND,
  WAIST,
  SAG,
  WELD,
  clamp,
} from "./molten-ring-constants";

export interface RingSimContext {
  count: number;
  width: number;
  config: {
    cardSize: number;
    cardRatio: number;
    arc: number;
    threads: boolean;
  };
  progress: number;
  spread: number;
  FRONT: number;
  pointerX: number;
  pointerY: number;
  height: number;
  hovered: number;
  leanX: Float32Array;
  leanY: Float32Array;
  dim: Float32Array;
  swell: Float32Array;
  at: Array<{ x: number; y: number; angle: number; scale: number }>;
  pos: Float32Array;
  rot: Float32Array;
  scale: Float32Array;
  strandA: Float32Array;
  strandB: Float32Array;
  strandPar: Float32Array;
}

export function computeRingFrame(ctx: RingSimContext): { strands: number } {
  const {
    count,
    width,
    config,
    progress,
    spread,
    FRONT,
    pointerX,
    pointerY,
    height,
    hovered,
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
  } = ctx;

  const long = width * config.cardSize;
  const short = long / config.cardRatio;
  const radius = width * config.arc;
  const angleStep = (short * SPACING) / radius;
  const centreX = -radius;

  for (let i = 0; i < count; i++) {
    const slot = ((((i - progress) % count) + count) % count) - FRONT;
    const angle = slot * angleStep * spread;
    at[i].angle = angle;
    at[i].x = centreX + Math.cos(angle) * radius;
    at[i].y = Math.sin(angle) * radius;
  }

  const mx = pointerX >= 0 ? pointerX - width / 2 : 0;
  const my = pointerY >= 0 ? height / 2 - pointerY : 0;
  const present = pointerX >= 0 ? 1 : 0;

  let strands = 0;
  for (let i = 0; i < count; i++) {
    const dx = mx - at[i].x;
    const dy = my - at[i].y;
    const pull = present ? Math.max(0, 1 - Math.hypot(dx, dy) / (long * REACH)) : 0;
    const isHovered = i === hovered ? 1 : 0;

    const towardX = dx * (pull * pull) * PULL * long * 0.02;
    const towardY = dy * (pull * pull) * PULL * long * 0.02;
    leanX[i] += (towardX - leanX[i]) * (pull > 0 ? GRAB : RELEASE);
    leanY[i] += (towardY - leanY[i]) * (pull > 0 ? GRAB : RELEASE);

    let push = 0;
    let dimTarget = 0;
    if (hovered >= 0 && i !== hovered) {
      let gap = Math.abs(i - hovered);
      gap = Math.min(gap, count - gap);
      const off = Math.max(0, 1 - gap / NEIGHBOUR_REACH);
      push = Math.sign(at[i].y - at[hovered].y || 1) * off * NEIGHBOUR_PUSH * long;
      dimTarget = off * NEIGHBOUR_DIM;
    }
    dim[i] += (dimTarget - dim[i]) * (dimTarget > dim[i] ? GRAB : RELEASE);

    const wantSwell =
      pull * pull * SWELL +
      isHovered * NEIGHBOUR_SCALE -
      dimTarget * (NEIGHBOUR_SCALE / NEIGHBOUR_DIM);
    swell[i] += (wantSwell - swell[i]) * (wantSwell > swell[i] ? GRAB : RELEASE);

    at[i].x += leanX[i];
    at[i].y += leanY[i] + push;
    at[i].scale = (0.18 + 0.82 * spread) * (1 + swell[i]);

    pos[i * 2] = at[i].x;
    pos[i * 2 + 1] = at[i].y;
    rot[i] = at[i].angle;
    scale[i * 4] = at[i].scale;
    scale[i * 4 + 1] = at[i].scale;
    scale[i * 4 + 2] = 1 - dim[i];
    scale[i * 4 + 3] = i;
  }

  if (config.threads) {
    for (let i = 0; i < count && strands < MAX_STRANDS; i++) {
      const j = (i + 1) % count;
      const gap = Math.hypot(at[j].x - at[i].x, at[j].y - at[i].y);
      const opening = (gap - short) / (short * STRAND_SNAP);
      if (opening > 1 || opening < -1) continue;

      const strength = Math.max(1 - spread, hovered === i || hovered === j ? 1 : 0);
      if (strength < 0.02) continue;
      const rEnd = short * 0.5 * STRAND * strength * (1 - clamp(opening, 0, 1));
      if (rEnd <= 0.5) continue;

      strandA[strands * 2] = at[i].x;
      strandA[strands * 2 + 1] = at[i].y;
      strandB[strands * 2] = at[j].x;
      strandB[strands * 2 + 1] = at[j].y;
      strandPar[strands * 4] = rEnd;
      strandPar[strands * 4 + 1] = rEnd * WAIST;
      strandPar[strands * 4 + 2] = SAG * long * clamp(opening, 0, 1);
      strandPar[strands * 4 + 3] = WELD * long;
      strands++;
    }
  }

  return { strands };
}
