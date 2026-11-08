import type { MoltenRingItem } from "./molten-ring-constants";
import { packAtlas } from "./molten-ring-gl";

export function createQuadMesh(gl: WebGL2RenderingContext) {
  const quad = gl.createVertexArray();
  gl.bindVertexArray(quad);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]),
    gl.STATIC_DRAW
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  return { quad, buffer };
}

export function loadRingAtlas(
  gl: WebGL2RenderingContext,
  items: MoltenRingItem[],
  count: number,
  cardRatio: number
) {
  const COLS = Math.min(4, count);
  const CELL = 512;
  let atlas: WebGLTexture | null = null;
  let loaded = 0;

  const images = items.slice(0, count).map((item) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    const settle = () => {
      if (++loaded < count) return;
      atlas = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, atlas);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        packAtlas(images, COLS, CELL, cardRatio)
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };
    image.onload = settle;
    image.onerror = () => settle();
    image.src = item.image;
    return image;
  });

  return {
    images,
    COLS,
    getAtlas: () => atlas,
    cleanup: () => {
      for (const image of images) image.onload = null;
      if (atlas) gl.deleteTexture(atlas);
    },
  };
}
