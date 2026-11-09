export function build(
  gl: WebGL2RenderingContext,
  vert: string,
  frag: string
) {
  const program = gl.createProgram();
  if (!program) return null;

  for (const [type, source] of [
    [gl.VERTEX_SHADER, vert],
    [gl.FRAGMENT_SHADER, frag],
  ] as const) {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      return null;
    }
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }

  gl.bindAttribLocation(program, 0, "aPos");
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

export function uniforms(gl: WebGL2RenderingContext, program: WebGLProgram) {
  const cache = new Map<string, WebGLUniformLocation | null>();
  return (name: string) => {
    let loc = cache.get(name);
    if (loc === undefined) {
      loc = gl.getUniformLocation(program, name);
      cache.set(name, loc);
    }
    return loc;
  };
}

export function colorReader() {
  const probe = document.createElement("canvas");
  probe.width = probe.height = 1;
  const ctx = probe.getContext("2d", { willReadFrequently: true });

  return (css: string): [number, number, number] => {
    if (!ctx) return [0, 0, 0];
    ctx.fillStyle = "#000";
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return [r / 255, g / 255, b / 255];
  };
}

export function packAtlas(
  images: HTMLImageElement[],
  cols: number,
  cell: number,
  ratio: number
) {
  const rows = Math.ceil(images.length / cols);
  const sheet = document.createElement("canvas");
  sheet.width = cols * cell;
  sheet.height = rows * Math.round(cell / ratio);
  const ctx = sheet.getContext("2d");
  if (!ctx) return sheet;

  const cellH = Math.round(cell / ratio);
  images.forEach((image, i) => {
    if (!image.naturalWidth || !image.naturalHeight) return;
    const x = (i % cols) * cell;
    const y = Math.floor(i / cols) * cellH;
    const scale = Math.max(
      cell / image.naturalWidth,
      cellH / image.naturalHeight
    );
    const w = image.naturalWidth * scale;
    const h = image.naturalHeight * scale;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, cell, cellH);
    ctx.clip();
    ctx.drawImage(image, x + (cell - w) / 2, y + (cellH - h) / 2, w, h);
    ctx.restore();
  });

  return sheet;
}
