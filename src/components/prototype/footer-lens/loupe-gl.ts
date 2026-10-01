/**
 * GPU loupe warp. Same sample math as the Canvas 2D disc (zoom curve, rim
 * displacement, nearest geometry gate, bilinear photo + hole allowance,
 * chromatic split). Runs every hover frame instead of the JS pixel loop.
 */

export type LoupeGlSources = {
  reveal: HTMLCanvasElement;
  hole: Uint8ClampedArray;
  geom: Uint8Array;
  dw: number;
  dh: number;
  stamp: number;
};

export type LoupeGlDraw = {
  size: number;
  dpr: number;
  lensR: number;
  originX: number;
  originY: number;
  logoX: number;
  logoY: number;
  scaleX: number;
  scaleY: number;
  zoomCenter: number;
  zoomEdge: number;
  falloffExp: number;
  displaceFrac: number;
  caFrac: number;
};

export type LoupeGl = {
  canvas: HTMLCanvasElement;
  sync: (sources: LoupeGlSources) => void;
  draw: (args: LoupeGlDraw) => void;
  destroy: () => void;
};

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;
precision highp int;

uniform sampler2D uReveal;
uniform sampler2D uHole;
uniform sampler2D uGeom;
uniform vec2 uRevealSize;
uniform vec2 uDiscSize;
uniform float uDpr;
uniform float uLensR;
uniform vec2 uOrigin;
uniform vec2 uLogo;
uniform vec2 uScale;
uniform float uZoomCenter;
uniform float uZoomEdge;
uniform float uFalloffExp;
uniform float uDisplaceFrac;
uniform float uCaFrac;

out vec4 fragColor;

float rimWeight(float u) {
  return pow(clamp(u, 0.0, 1.0), uFalloffExp);
}

float zoomAt(float u) {
  return uZoomCenter + (uZoomEdge - uZoomCenter) * rimWeight(u);
}

vec4 tapCanvas(sampler2D tex, vec2 texel) {
  vec2 uv = (texel + 0.5) / uRevealSize;
  uv.y = 1.0 - uv.y;
  return texture(tex, uv);
}

float geomAt(vec2 texel) {
  ivec2 p = ivec2(floor(texel));
  if (p.x < 0 || p.y < 0 || p.x >= int(uRevealSize.x) || p.y >= int(uRevealSize.y)) {
    return 0.0;
  }
  int y = int(uRevealSize.y) - 1 - p.y;
  return texelFetch(uGeom, ivec2(p.x, y), 0).r;
}

void main() {
  vec2 frag = vec2(gl_FragCoord.x, uDiscSize.y - gl_FragCoord.y);
  vec2 delta = frag - uDiscSize * 0.5;
  float distPx = length(delta);
  float radius = uDiscSize.x * 0.5;
  if (distPx > radius + 0.5) {
    fragColor = vec4(0.0);
    return;
  }

  float distCss = min(distPx, radius) / uDpr;
  float distRawCss = distPx / uDpr;
  float t = min(1.0, distCss / max(uLensR, 1e-4));
  float inv = distRawCss > 1e-4 ? 1.0 / distRawCss : 0.0;
  vec2 dir = delta / uDpr * inv;
  float rw = rimWeight(t);
  float sampleDist = distCss * zoomAt(t) + uLensR * uDisplaceFrac * rw;
  float halfCss = (uDiscSize.x / uDpr) * 0.5;
  vec2 logo = uOrigin + vec2(halfCss) + dir * sampleDist;
  vec2 texel = (logo - uLogo) * uScale;

  bool inMark = geomAt(texel) >= 0.5;
  vec4 photo = inMark ? tapCanvas(uReveal, texel) : vec4(0.0);
  if (!inMark || photo.a < 1.0 / 255.0) {
    vec4 hole = tapCanvas(uHole, texel);
    if (hole.a < 1.0 / 255.0) {
      fragColor = vec4(0.0);
      return;
    }
    photo = hole;
  }

  float ca = uLensR * uCaFrac * rw;
  if (ca > 1e-4 && photo.a >= 250.0 / 255.0) {
    vec2 ux = dir;
    vec4 rTap;
    vec4 bTap;
    if (inMark) {
      rTap = tapCanvas(uReveal, (logo + ux * ca - uLogo) * uScale);
      bTap = tapCanvas(uReveal, (logo - ux * ca - uLogo) * uScale);
    } else {
      rTap = tapCanvas(uHole, (logo + ux * ca - uLogo) * uScale);
      bTap = tapCanvas(uHole, (logo - ux * ca - uLogo) * uScale);
    }
    if (rTap.a >= 0.5 && rTap.r >= 40.0 / 255.0) photo.r = rTap.r;
    if (bTap.a >= 0.5 && bTap.b >= 40.0 / 255.0) photo.b = bTap.b;
  }

  float edge = radius - distPx;
  float cover = edge <= 0.0 ? 0.0 : edge >= 0.75 ? 1.0 : edge / 0.75;
  photo.a *= cover;

  // Soft rim: a few extra warped taps, mixed only near the edge.
  float rim = smoothstep(0.82, 1.0, t) * 0.5;
  if (rim > 0.02 && photo.a > 0.0) {
    vec4 blur = vec4(0.0);
    float n = 0.0;
    for (int i = 0; i < 8; i++) {
      float ang = float(i) * 0.785398;
      vec2 off = vec2(cos(ang), sin(ang)) * 2.5;
      vec2 pf = frag + off;
      vec2 d2 = pf - uDiscSize * 0.5;
      float dp = length(d2);
      float dc = min(dp, radius) / uDpr;
      float dr = dp / uDpr;
      float tt = min(1.0, dc / max(uLensR, 1e-4));
      float inv2 = dr > 1e-4 ? 1.0 / dr : 0.0;
      vec2 dir2 = d2 / uDpr * inv2;
      float rw2 = rimWeight(tt);
      float sd = dc * zoomAt(tt) + uLensR * uDisplaceFrac * rw2;
      vec2 logo2 = uOrigin + vec2(halfCss) + dir2 * sd;
      vec2 texel2 = (logo2 - uLogo) * uScale;
      vec4 s;
      if (geomAt(texel2) >= 0.5) s = tapCanvas(uReveal, texel2);
      else s = tapCanvas(uHole, texel2);
      blur += s;
      n += 1.0;
    }
    blur /= max(n, 1.0);
    photo = mix(photo, blur, rim);
  }

  fragColor = photo;
}
`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) throw new Error('loupe shader alloc');
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(log || 'loupe shader compile');
  }
  return sh;
}

function makeTex(gl: WebGL2RenderingContext, filter: number) {
  const tex = gl.createTexture();
  if (!tex) throw new Error('loupe texture alloc');
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

export function createLoupeGl(): LoupeGl {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    depth: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
  });
  if (!gl) throw new Error('loupe WebGL2 unavailable');

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  const program = gl.createProgram();
  if (!program) throw new Error('loupe program');
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || 'loupe link');
  }

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, 'position');

  const texReveal = makeTex(gl, gl.LINEAR);
  const texHole = makeTex(gl, gl.LINEAR);
  const texGeom = makeTex(gl, gl.NEAREST);

  const u = {
    reveal: gl.getUniformLocation(program, 'uReveal')!,
    hole: gl.getUniformLocation(program, 'uHole')!,
    geom: gl.getUniformLocation(program, 'uGeom')!,
    revealSize: gl.getUniformLocation(program, 'uRevealSize')!,
    discSize: gl.getUniformLocation(program, 'uDiscSize')!,
    dpr: gl.getUniformLocation(program, 'uDpr')!,
    lensR: gl.getUniformLocation(program, 'uLensR')!,
    origin: gl.getUniformLocation(program, 'uOrigin')!,
    logo: gl.getUniformLocation(program, 'uLogo')!,
    scale: gl.getUniformLocation(program, 'uScale')!,
    zoomCenter: gl.getUniformLocation(program, 'uZoomCenter')!,
    zoomEdge: gl.getUniformLocation(program, 'uZoomEdge')!,
    falloffExp: gl.getUniformLocation(program, 'uFalloffExp')!,
    displaceFrac: gl.getUniformLocation(program, 'uDisplaceFrac')!,
    caFrac: gl.getUniformLocation(program, 'uCaFrac')!,
  };

  let stamp = Number.NaN;
  let dw = 0;
  let dh = 0;

  const uploadRgba = (tex: WebGLTexture, w: number, h: number, data: TexImageSource | Uint8ClampedArray) => {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    if (data instanceof Uint8ClampedArray) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
    }
  };

  return {
    canvas,
    sync(sources) {
      if (sources.stamp === stamp && sources.dw === dw && sources.dh === dh) return;
      stamp = sources.stamp;
      dw = sources.dw;
      dh = sources.dh;
      uploadRgba(texReveal, dw, dh, sources.reveal);
      uploadRgba(texHole, dw, dh, sources.hole);
      gl.bindTexture(gl.TEXTURE_2D, texGeom);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, dw, dh, 0, gl.RED, gl.UNSIGNED_BYTE, sources.geom);
    },
    draw(args) {
      if (canvas.width !== args.size || canvas.height !== args.size) {
        canvas.width = args.size;
        canvas.height = args.size;
      }
      gl.viewport(0, 0, args.size, args.size);
      gl.disable(gl.BLEND);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texReveal);
      gl.uniform1i(u.reveal, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, texHole);
      gl.uniform1i(u.hole, 1);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, texGeom);
      gl.uniform1i(u.geom, 2);

      gl.uniform2f(u.revealSize, dw, dh);
      gl.uniform2f(u.discSize, args.size, args.size);
      gl.uniform1f(u.dpr, args.dpr);
      gl.uniform1f(u.lensR, args.lensR);
      gl.uniform2f(u.origin, args.originX, args.originY);
      gl.uniform2f(u.logo, args.logoX, args.logoY);
      gl.uniform2f(u.scale, args.scaleX, args.scaleY);
      gl.uniform1f(u.zoomCenter, args.zoomCenter);
      gl.uniform1f(u.zoomEdge, args.zoomEdge);
      gl.uniform1f(u.falloffExp, args.falloffExp);
      gl.uniform1f(u.displaceFrac, args.displaceFrac);
      gl.uniform1f(u.caFrac, args.caFrac);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    },
    destroy() {
      gl.deleteTexture(texReveal);
      gl.deleteTexture(texHole);
      gl.deleteTexture(texGeom);
      gl.deleteBuffer(buf);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    },
  };
}
