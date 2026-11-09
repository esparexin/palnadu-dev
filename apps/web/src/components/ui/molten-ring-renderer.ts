import {
  CORNER,
  CROSSFADE,
  WOBBLE,
  CURSOR_FUSE,
  CURSOR_REACH,
  WAVE,
  WAVE_FREQ,
  WAVE_SPEED,
  BAND,
  REFRACT,
  SQUEEZE,
  RIPPLE,
  RIPPLE_FREQ,
  FRINGE,
  SHEEN,
  clamp,
} from "./molten-ring-constants";

export interface RingRenderPassParams {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  quad: WebGLVertexArrayObject | null;
  u: (_name: string) => WebGLUniformLocation | null | undefined;
  canvasWidth: number;
  canvasHeight: number;
  width: number;
  height: number;
  long: number;
  short: number;
  count: number;
  pos: Float32Array;
  rot: Float32Array;
  scale: Float32Array;
  strands: number;
  strandA: Float32Array;
  strandB: Float32Array;
  strandPar: Float32Array;
  fuse: number;
  reduced: boolean;
  speed: number;
  spread: number;
  clock: number;
  ink: [number, number, number];
  atlas: WebGLTexture | null;
  COLS: number;
  mx: number;
  my: number;
  present: number;
  pointerSpeed: number;
  glass: boolean;
}

export function renderRingPass(p: RingRenderPassParams) {
  const { gl, u } = p;
  gl.viewport(0, 0, p.canvasWidth, p.canvasHeight);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(p.program);
  gl.bindVertexArray(p.quad);

  gl.uniform2f(u("uResolution")!, p.width, p.height);
  gl.uniform2f(u("uSize")!, p.long, p.short);
  gl.uniform1f(u("uCorner")!, CORNER * p.long);
  gl.uniform1f(u("uCount")!, p.count);
  gl.uniform2fv(u("uCentre")!, p.pos);
  gl.uniform1fv(u("uAngle")!, p.rot);
  gl.uniform4fv(u("uCardState")!, p.scale);
  gl.uniform1f(u("uStrandCount")!, p.strands);
  gl.uniform2fv(u("uStrandA")!, p.strandA);
  gl.uniform2fv(u("uStrandB")!, p.strandB);
  gl.uniform4fv(u("uStrandPar")!, p.strandPar);
  gl.uniform1f(u("uFuse")!, p.fuse * p.long);
  gl.uniform1f(u("uJitter")!, p.reduced ? 0 : WOBBLE * p.long * clamp(p.speed * 2 + (1 - p.spread), 0, 1));
  gl.uniform1f(u("uTime")!, p.reduced ? 0 : p.clock);
  gl.uniform3fv(u("uColor")!, p.ink);
  gl.uniform1f(u("uCrossfade")!, CROSSFADE * p.long);
  gl.uniform1f(u("uHasArt")!, p.atlas ? 1 : 0);
  gl.uniform2f(u("uGrid")!, p.COLS, Math.ceil(p.count / p.COLS));
  gl.uniform4f(u("uCursor")!, p.mx, p.my, p.present, CURSOR_FUSE * p.long);
  gl.uniform4f(u("uWake")!, CURSOR_REACH * p.long, p.reduced ? 0 : WAVE * p.long * clamp(p.pointerSpeed / 40, 0, 1), WAVE_FREQ / p.long, WAVE_SPEED);
  gl.uniform1f(u("uLipDepth")!, p.glass ? BAND * p.height : 0);
  gl.uniform4f(u("uLip")!, REFRACT * p.long, SQUEEZE, RIPPLE * p.long, RIPPLE_FREQ / p.long);
  gl.uniform1f(u("uFringe")!, FRINGE);
  gl.uniform1f(u("uSheen")!, SHEEN);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, p.atlas);
  gl.uniform1i(u("uAtlas")!, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}
