/**
 * Cursor-warped painted gradient — WebGL2 port of monopo.london's
 * <monopo-gradient> fragment shader (IQ gradient-noise displacement +
 * four-stop color bands + film grain), driven by Vantage brand tokens.
 */

/** Brand palette: vp-black, warm deep (from orange), vp-link, vp-orange. */
const COLOR_1 = new Float32Array([0.039, 0.039, 0.039]); // #0a0a0a
const COLOR_2 = new Float32Array([0.165, 0.094, 0.078]); // #2a1814
const COLOR_3 = new Float32Array([0.976, 0.859, 0.141]); // #f9db24
const COLOR_4 = new Float32Array([0.941, 0.306, 0.137]); // #f04e23

/** Defaults tuned from monopo hero attrs, remapped to our palette. */
const DEFAULTS = {
  colorSize: 0.95,
  colorSpacing: 0.48,
  colorRotation: -0.382,
  colorSpread: 2.8,
  colorOffsetX: -0.55,
  colorOffsetY: -0.15,
  /** Negative Y lifts the painted bands toward the nav (clip +Y is up). */
  transformYBias: -0.32,
  displacementBase: 0.04,
  displacementMax: 4.0,
  seedBase: -0.6,
  zoom: 0.68,
  spacing: 4.27,
  noiseSize: 1.4,
  noiseIntensity: 0.055,
} as const;

const VERT_SRC = `#version 300 es
in vec3 position;
out vec2 vPosition;
void main() {
  gl_Position = vec4(position, 1.0);
  vPosition = position.xy;
}
`;

/** IQ gradient-noise-with-derivatives (MIT) + monopo band mixer. */
const FRAG_SRC = `#version 300 es
precision highp float;

uniform vec3 color1;
uniform vec3 color2;
uniform vec3 color3;
uniform vec3 color4;
uniform float colorSize;
uniform float colorSpacing;
uniform float colorRotation;
uniform float colorSpread;
uniform float displacement;
uniform float zoom;
uniform float spacing;
uniform float seed;
uniform vec2 viewportSize;
uniform vec2 colorOffset;
uniform vec2 transformPosition;
uniform float noiseSize;
uniform float noiseIntensity;

in vec2 vPosition;
out vec4 fragColor;

vec3 gradientNoiseHash(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}

// Value in x, derivatives in yzw — Inigo Quilez
vec4 gradientNoise3D(in vec3 x) {
  vec3 p = floor(x);
  vec3 w = fract(x);
  vec3 u = w * w * w * (w * (w * 6.0 - 15.0) + 10.0);
  vec3 du = 30.0 * w * w * (w * (w - 2.0) + 1.0);

  vec3 ga = gradientNoiseHash(p + vec3(0.0, 0.0, 0.0));
  vec3 gb = gradientNoiseHash(p + vec3(1.0, 0.0, 0.0));
  vec3 gc = gradientNoiseHash(p + vec3(0.0, 1.0, 0.0));
  vec3 gd = gradientNoiseHash(p + vec3(1.0, 1.0, 0.0));
  vec3 ge = gradientNoiseHash(p + vec3(0.0, 0.0, 1.0));
  vec3 gf = gradientNoiseHash(p + vec3(1.0, 0.0, 1.0));
  vec3 gg = gradientNoiseHash(p + vec3(0.0, 1.0, 1.0));
  vec3 gh = gradientNoiseHash(p + vec3(1.0, 1.0, 1.0));

  float va = dot(ga, w - vec3(0.0, 0.0, 0.0));
  float vb = dot(gb, w - vec3(1.0, 0.0, 0.0));
  float vc = dot(gc, w - vec3(0.0, 1.0, 0.0));
  float vd = dot(gd, w - vec3(1.0, 1.0, 0.0));
  float ve = dot(ge, w - vec3(0.0, 0.0, 1.0));
  float vf = dot(gf, w - vec3(1.0, 0.0, 1.0));
  float vg = dot(gg, w - vec3(0.0, 1.0, 1.0));
  float vh = dot(gh, w - vec3(1.0, 1.0, 1.0));

  return vec4(
    va + u.x * (vb - va) + u.y * (vc - va) + u.z * (ve - va)
      + u.x * u.y * (va - vb - vc + vd)
      + u.y * u.z * (va - vc - ve + vg)
      + u.z * u.x * (va - vb - ve + vf)
      + (-va + vb + vc - vd + ve - vf - vg + vh) * u.x * u.y * u.z,
    ga + u.x * (gb - ga) + u.y * (gc - ga) + u.z * (ge - ga)
      + u.x * u.y * (ga - gb - gc + gd)
      + u.y * u.z * (ga - gc - ge + gg)
      + u.z * u.x * (ga - gb - ge + gf)
      + (-ga + gb + gc - gd + ge - gf - gg + gh) * u.x * u.y * u.z
      + du * (vec3(vb, vc, ve) - va
        + u.yzx * vec3(va - vb - vc + vd, va - vc - ve + vg, va - vb - ve + vf)
        + u.zxy * vec3(va - vb - ve + vf, va - vb - vc + vd, va - vc - ve + vg)
        + u.yzx * u.zxy * (-va + vb + vc - vd + ve - vf - vg + vh))
  );
}

float hash(vec2 p) {
  p = 50.0 * fract(p * 0.3183099 + vec2(0.71, 0.113));
  return -1.0 + 2.0 * fract(p.x * p.y * (p.x + p.y));
}

float computeNoise(in vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

vec2 rotate(vec2 v, float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c) * v;
}

void main() {
  vec2 position = vPosition;
  position.x *= min(1.0, viewportSize.x / viewportSize.y);
  position.y *= min(1.0, viewportSize.y / viewportSize.x);
  position /= zoom;
  position += transformPosition;

  vec2 noiseLocalPosition = position * 0.5 + 0.5;
  vec3 displacementNoise = gradientNoise3D(vec3(noiseLocalPosition, seed)).xyz;

  float grain = computeNoise(vPosition * viewportSize / noiseSize);

  position += displacementNoise.xz * displacement;

  vec2 offsetedPosition = position;
  offsetedPosition -= colorOffset;
  offsetedPosition = mod(offsetedPosition - spacing, vec2(spacing * 2.0)) - spacing;
  offsetedPosition = rotate(offsetedPosition, -colorRotation);
  offsetedPosition /= vec2(colorSize, colorSize);
  offsetedPosition *= vec2(1.0 / colorSpread, 1.0);

  vec3 color = vec3(0.0);
  color = mix(color1, color, smoothstep(0.0, 1.0, distance(offsetedPosition, vec2(0.0, colorSpacing * 1.5))));
  color = mix(color2, color, smoothstep(0.0, 1.0, distance(offsetedPosition, vec2(0.0, colorSpacing * 0.5))));
  color = mix(color3, color, smoothstep(0.0, 1.0, distance(offsetedPosition, vec2(0.0, -colorSpacing * 0.5))));
  color = mix(color4, color, smoothstep(0.0, 1.0, distance(offsetedPosition, vec2(0.0, -colorSpacing * 1.5))));

  color += grain * noiseIntensity;
  color = clamp(color, 0.0, 1.0);
  fragColor = vec4(color, 1.0);
}
`;

export type GradientPointer = {x: number; y: number} | null;

export type GradientBgEngine = {
  setSize: (cssW: number, cssH: number) => void;
  setPointer: (p: GradientPointer, cssW: number, cssH: number) => void;
  frame: () => void;
  destroy: () => void;
};

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) throw new Error('shader alloc failed');
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(log || 'shader compile failed');
  }
  return sh;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function createGradientBgEngine(canvas: HTMLCanvasElement): GradientBgEngine {
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    premultipliedAlpha: false,
  });
  if (!gl) {
    throw new Error('WebGL2 unavailable for gradient background');
  }

  const vs = compile(gl, gl.VERTEX_SHADER, VERT_SRC);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
  const program = gl.createProgram();
  if (!program) throw new Error('program alloc failed');
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || 'link failed');
  }

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0]),
    gl.STATIC_DRAW,
  );

  const locPos = gl.getAttribLocation(program, 'position');

  const u = {
    color1: gl.getUniformLocation(program, 'color1')!,
    color2: gl.getUniformLocation(program, 'color2')!,
    color3: gl.getUniformLocation(program, 'color3')!,
    color4: gl.getUniformLocation(program, 'color4')!,
    colorSize: gl.getUniformLocation(program, 'colorSize')!,
    colorSpacing: gl.getUniformLocation(program, 'colorSpacing')!,
    colorRotation: gl.getUniformLocation(program, 'colorRotation')!,
    colorSpread: gl.getUniformLocation(program, 'colorSpread')!,
    displacement: gl.getUniformLocation(program, 'displacement')!,
    zoom: gl.getUniformLocation(program, 'zoom')!,
    spacing: gl.getUniformLocation(program, 'spacing')!,
    seed: gl.getUniformLocation(program, 'seed')!,
    viewportSize: gl.getUniformLocation(program, 'viewportSize')!,
    colorOffset: gl.getUniformLocation(program, 'colorOffset')!,
    transformPosition: gl.getUniformLocation(program, 'transformPosition')!,
    noiseSize: gl.getUniformLocation(program, 'noiseSize')!,
    noiseIntensity: gl.getUniformLocation(program, 'noiseIntensity')!,
  };

  let cssW = 1;
  let cssH = 1;

  // Explicit `number` — DEFAULTS is `as const`, so bare lets pin literal types
  // and `lerp()` (returns number) fails tsc on Vercel.
  let targetForce: number = DEFAULTS.displacementBase;
  let targetSeed: number = DEFAULTS.seedBase;
  let targetTX = 0;
  let targetTY: number = DEFAULTS.transformYBias;
  let targetOX: number = DEFAULTS.colorOffsetX;
  let targetOY: number = DEFAULTS.colorOffsetY;

  let smoothForce: number = targetForce;
  let smoothSeed: number = targetSeed;
  let smoothTX = 0;
  let smoothTY: number = DEFAULTS.transformYBias;
  let smoothOX: number = targetOX;
  let smoothOY: number = targetOY;

  const SMOOTH = 0.08;

  const draw = () => {
    smoothForce = lerp(smoothForce, targetForce, SMOOTH);
    smoothSeed = lerp(smoothSeed, targetSeed, SMOOTH);
    smoothTX = lerp(smoothTX, targetTX, SMOOTH);
    smoothTY = lerp(smoothTY, targetTY, SMOOTH);
    smoothOX = lerp(smoothOX, targetOX, SMOOTH);
    smoothOY = lerp(smoothOY, targetOY, SMOOTH);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(locPos);
    gl.vertexAttribPointer(locPos, 3, gl.FLOAT, false, 0, 0);

    gl.uniform3fv(u.color1, COLOR_1);
    gl.uniform3fv(u.color2, COLOR_2);
    gl.uniform3fv(u.color3, COLOR_3);
    gl.uniform3fv(u.color4, COLOR_4);
    gl.uniform1f(u.colorSize, DEFAULTS.colorSize);
    gl.uniform1f(u.colorSpacing, DEFAULTS.colorSpacing);
    gl.uniform1f(u.colorRotation, DEFAULTS.colorRotation);
    gl.uniform1f(u.colorSpread, DEFAULTS.colorSpread);
    gl.uniform1f(u.displacement, smoothForce);
    gl.uniform1f(u.zoom, DEFAULTS.zoom);
    gl.uniform1f(u.spacing, DEFAULTS.spacing);
    gl.uniform1f(u.seed, smoothSeed);
    gl.uniform2f(u.viewportSize, cssW, cssH);
    gl.uniform2f(u.colorOffset, smoothOX, smoothOY);
    gl.uniform2f(u.transformPosition, smoothTX, smoothTY);
    gl.uniform1f(u.noiseSize, DEFAULTS.noiseSize);
    gl.uniform1f(u.noiseIntensity, DEFAULTS.noiseIntensity);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };

  return {
    setSize(w, h) {
      cssW = Math.max(1, w);
      cssH = Math.max(1, h);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(cssW * dpr));
      canvas.height = Math.max(1, Math.round(cssH * dpr));
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      draw();
    },
    setPointer(p, w, h) {
      if (!p) {
        targetForce = DEFAULTS.displacementBase;
        targetSeed = DEFAULTS.seedBase;
        targetTX = 0;
        targetTY = DEFAULTS.transformYBias;
        targetOX = DEFAULTS.colorOffsetX;
        targetOY = DEFAULTS.colorOffsetY;
        return;
      }
      const nx = Math.min(1, Math.max(0, p.x / Math.max(w, 1)));
      const ny = Math.min(1, Math.max(0, p.y / Math.max(h, 1)));
      // Monopo maps clientX → force 0..5, clientY → seed -1..1
      targetForce = lerp(DEFAULTS.displacementBase, DEFAULTS.displacementMax, nx);
      targetSeed = lerp(-1, 1, ny);
      targetTX = (nx - 0.5) * -0.35;
      targetTY = DEFAULTS.transformYBias + (ny - 0.5) * -0.35;
      targetOX = DEFAULTS.colorOffsetX + (nx - 0.5) * 0.45;
      targetOY = DEFAULTS.colorOffsetY + (ny - 0.5) * 0.35;
    },
    frame() {
      draw();
    },
    destroy() {
      gl.deleteBuffer(buf);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
