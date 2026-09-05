/**
 * Footer wordmark lens — Canvas 2D approximation of monopo.london's Pixi stack:
 * 1. White wordmark with inverse circular hole (outside lens)
 * 2. Mosaic "content swap" disc (inside lens) with displacement warp + rim RGB split
 * 3. Glass rim overlay
 * 4. Cursor lerp for organic tracking
 */

import {
  WORDMARK_PATH_D,
  WORDMARK_VIEWBOX_H,
  WORDMARK_VIEWBOX_W,
} from "./wordmark-path";

export type FooterLensPointer = { x: number; y: number } | null;

export type FooterLensEngine = {
  setSize: (cssWidth: number, cssHeight: number) => void;
  /** Immediate target (used by rAF lerp in the component). */
  setPointer: (pointer: FooterLensPointer) => void;
  /** Draw at a smoothed lens center (component owns lerp). */
  drawAt: (lx: number, ly: number, active: boolean) => void;
  destroy: () => void;
  getDpr: () => number;
};

const MOSAIC_COLS = 48;
const MOSAIC_ROWS = 20;

/** Cool gray mosaic tiles — dark / mid / light. */
const MOSAIC_COOL: ReadonlyArray<readonly [number, number, number]> = [
  [28, 30, 34],
  [42, 46, 52],
  [58, 62, 70],
  [74, 78, 86],
  [92, 96, 104],
  [110, 114, 122],
  [128, 132, 140],
  [148, 152, 160],
  [168, 172, 180],
  [188, 192, 198],
  [208, 212, 218],
  [228, 230, 234],
];

const MOSAIC_WARM: ReadonlyArray<readonly [number, number, number]> = [
  [72, 58, 48],
  [96, 78, 62],
  [118, 92, 72],
  [140, 110, 88],
  [158, 128, 102],
  [176, 148, 118],
];

/**
 * Loupe warp — collage-readable:
 * - Strong flat zoom across the middle ~70% of the lens
 * - Only subtle dome + CA in the outer rim
 * (sampleDist = dist * zoom → lower zoom = stronger magnification)
 */
/** Flat zoom across the clear center (~2.5×; ~10% less than prior 2.8×). */
const ZOOM_CENTER = 0.4;
/** Slightly softer zoom at the rim (~1.9×) — keep falloff mild. */
const ZOOM_EDGE = 0.53;
/** Clean plateau as fraction of lensR (~70% diameter stays undistorted). */
const INNER_FLAT = 0.7;
/** Subtle rim displacement only (fraction of lensR). */
const DISPLACE_FRAC = 0.035;
/** Displacement + CA start at the outer 30% (fraction of lensR). */
const RIM_START = 0.7;
/** Soft chromatic split at the outer rim (fraction of lensR). */
const CA_FRAC = 0.01;
/**
 * Lens radius as fraction of wordmark width.
 * Sized so letter height sits inside the dome (~0.7× diameter), not on the poles.
 */
const LENS_R_FRAC = 0.115;

type Cache = {
  logoX: number;
  logoY: number;
  logoW: number;
  logoH: number;
  path2d: Path2D;
  whiteWordmark: HTMLCanvasElement;
  reveal: HTMLCanvasElement;
  revealData: ImageData;
  revealDw: number;
  revealDh: number;
};

function hash01(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function mixRgb(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number,
): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function mosaicColor(col: number, row: number): [number, number, number] {
  const n = col * 17 + row * 31;
  const useWarm = hash01(n + 0.17) < 0.12;
  const palette = useWarm ? MOSAIC_WARM : MOSAIC_COOL;
  const idx = Math.floor(hash01(n) * palette.length) % palette.length;
  const base = palette[idx]!;
  const neighbor =
    palette[(idx + 1 + Math.floor(hash01(n + 2.1) * (palette.length - 1))) % palette.length]!;
  const shade = mixRgb(base, neighbor, hash01(n + 4.4) * 0.35);
  const cx = (MOSAIC_COLS - 1) / 2;
  const cy = (MOSAIC_ROWS - 1) / 2;
  const dx = (col - cx) / Math.max(cx, 1);
  const dy = (row - cy) / Math.max(cy, 1);
  const vignette = Math.min(1, Math.hypot(dx, dy) / 1.15);
  const factor = 1 - vignette * 0.28;
  return [
    Math.max(0, Math.min(255, Math.round(shade[0] * factor))),
    Math.max(0, Math.min(255, Math.round(shade[1] * factor))),
    Math.max(0, Math.min(255, Math.round(shade[2] * factor))),
  ];
}

function paintPersonSilhouette(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
): void {
  const cx = x + w * 0.5;
  const headR = Math.min(w, h) * (0.12 + hash01(seed) * 0.04);
  const headY = y + h * (0.28 + hash01(seed + 1) * 0.08);
  const shoulderY = headY + headR * 1.35;
  const shoulderW = w * (0.38 + hash01(seed + 2) * 0.12);
  const bodyH = h * (0.42 + hash01(seed + 3) * 0.1);
  const alpha = 0.22 + hash01(seed + 4) * 0.12;

  ctx.save();
  ctx.fillStyle = `rgba(12, 14, 18, ${alpha})`;
  ctx.beginPath();
  ctx.arc(cx, headY, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - shoulderW * 0.5, shoulderY + bodyH);
  ctx.quadraticCurveTo(cx - shoulderW * 0.55, shoulderY, cx - headR * 0.85, shoulderY);
  ctx.lineTo(cx + headR * 0.85, shoulderY);
  ctx.quadraticCurveTo(cx + shoulderW * 0.55, shoulderY, cx + shoulderW * 0.5, shoulderY + bodyH);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function buildWhiteWordmark(
  path2d: Path2D,
  logoX: number,
  logoY: number,
  logoW: number,
  logoH: number,
  dw: number,
  dh: number,
): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = dw;
  c.height = dh;
  const ctx = c.getContext("2d")!;
  ctx.setTransform(dw / logoW, 0, 0, dh / logoH, 0, 0);
  ctx.translate(-logoX, -logoY);
  ctx.fillStyle = "#ffffff";
  ctx.fill(path2d);
  return c;
}

function buildRevealBuffer(
  path2d: Path2D,
  logoX: number,
  logoY: number,
  logoW: number,
  logoH: number,
  dw: number,
  dh: number,
): { canvas: HTMLCanvasElement; data: ImageData } {
  const c = document.createElement("canvas");
  c.width = dw;
  c.height = dh;
  const ctx = c.getContext("2d")!;

  const cellW = dw / MOSAIC_COLS;
  const cellH = dh / MOSAIC_ROWS;
  for (let row = 0; row < MOSAIC_ROWS; row++) {
    for (let col = 0; col < MOSAIC_COLS; col++) {
      const [r, g, b] = mosaicColor(col, row);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(col * cellW, row * cellH, cellW + 0.5, cellH + 0.5);
    }
  }

  const personCells = [
    [8, 5],
    [18, 9],
    [28, 5],
    [38, 10],
  ] as const;
  for (let i = 0; i < personCells.length; i++) {
    const [col, row] = personCells[i]!;
    paintPersonSilhouette(ctx, col * cellW, row * cellH, cellW * 1.15, cellH * 1.35, 10 + i * 7);
  }

  const grain = ctx.getImageData(0, 0, dw, dh);
  const gd = grain.data;
  for (let i = 0; i < gd.length; i += 4) {
    const n = (hash01(i * 0.0013) - 0.5) * 14;
    gd[i] = Math.max(0, Math.min(255, gd[i]! + n));
    gd[i + 1] = Math.max(0, Math.min(255, gd[i + 1]! + n));
    gd[i + 2] = Math.max(0, Math.min(255, gd[i + 2]! + n));
  }
  ctx.putImageData(grain, 0, 0);

  ctx.save();
  ctx.globalCompositeOperation = "destination-in";
  ctx.setTransform(dw / logoW, 0, 0, dh / logoH, 0, 0);
  ctx.translate(-logoX, -logoY);
  ctx.fillStyle = "#fff";
  ctx.fill(path2d);
  ctx.restore();

  return { canvas: c, data: ctx.getImageData(0, 0, dw, dh) };
}

/**
 * Bilinear sample. Out-of-bounds → 0 (no clamp-to-edge).
 * Clamp would repeat the logo's top/bottom rows into infinite vertical streaks
 * when the lens / warp samples past the wordmark buffer.
 */
function sampleChannelBilinear(
  data: Uint8ClampedArray,
  dw: number,
  dh: number,
  sx: number,
  sy: number,
  channel: 0 | 1 | 2 | 3,
): number {
  if (sx < 0 || sy < 0 || sx >= dw - 1e-6 || sy >= dh - 1e-6) return 0;

  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const x1 = Math.min(dw - 1, x0 + 1);
  const y1 = Math.min(dh - 1, y0 + 1);
  const fx = sx - x0;
  const fy = sy - y0;
  const i00 = (y0 * dw + x0) * 4 + channel;
  const i10 = (y0 * dw + x1) * 4 + channel;
  const i01 = (y1 * dw + x0) * 4 + channel;
  const i11 = (y1 * dw + x1) * 4 + channel;
  const v0 = data[i00]! * (1 - fx) + data[i10]! * fx;
  const v1 = data[i01]! * (1 - fx) + data[i11]! * fx;
  return v0 * (1 - fy) + v1 * fy;
}

function sampleRGBA(
  data: Uint8ClampedArray,
  dw: number,
  dh: number,
  sx: number,
  sy: number,
): [number, number, number, number] {
  return [
    sampleChannelBilinear(data, dw, dh, sx, sy, 0),
    sampleChannelBilinear(data, dw, dh, sx, sy, 1),
    sampleChannelBilinear(data, dw, dh, sx, sy, 2),
    sampleChannelBilinear(data, dw, dh, sx, sy, 3),
  ];
}

function zoomAt(t: number): number {
  if (t <= INNER_FLAT) return ZOOM_CENTER;
  const u = (t - INNER_FLAT) / (1 - INNER_FLAT);
  const e = u * u * (3 - 2 * u);
  return ZOOM_CENTER + (ZOOM_EDGE - ZOOM_CENTER) * e;
}

function rimWeight(t: number): number {
  if (t <= RIM_START) return 0;
  const u = (t - RIM_START) / (1 - RIM_START);
  return u * u * (3 - 2 * u);
}

/**
 * Build the inside-lens disc: mosaic with radial zoom + rim displacement + CA.
 * Shared UV for alpha and RGB so the silhouette magnifies with the texture.
 * Out-of-bounds → 0 (no clamp-to-edge streaks).
 */
function buildLensDisc(
  cache: Cache,
  lensR: number,
  lx: number,
  ly: number,
): HTMLCanvasElement {
  const size = Math.max(1, Math.ceil(lensR * 2));
  const out = document.createElement("canvas");
  out.width = size;
  out.height = size;
  const ctx = out.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const outData = img.data;

  const { revealData, revealDw, revealDh, logoX, logoY, logoW, logoH } = cache;
  const src = revealData.data;
  const scaleX = revealDw / logoW;
  const scaleY = revealDh / logoH;
  const cx = size / 2;
  const cy = size / 2;
  const rPx = lensR;
  const originX = lx - lensR;
  const originY = ly - lensR;

  for (let py = 0; py < size; py++) {
    const dy = py - cy;
    for (let px = 0; px < size; px++) {
      const dx = px - cx;
      const dist = Math.hypot(dx, dy);
      if (dist > rPx) continue;

      const t = dist / rPx;
      const inv = dist > 1e-6 ? 1 / dist : 0;
      const ux = dx * inv;
      const uy = dy * inv;

      const toSrc = (qx: number, qy: number): [number, number] => {
        const logoPx = originX + qx;
        const logoPy = originY + qy;
        return [(logoPx - logoX) * scaleX, (logoPy - logoY) * scaleY];
      };

      // One shared UV for alpha + RGB so the silhouette magnifies with the
      // texture. (An unzoomed alpha gate locked top/bottom edges to 1:1 and
      // spawned chopped slivers where gate vs color disagreed.)
      const zoom = zoomAt(t);
      const rw = rimWeight(t);
      const sampleDist = dist * zoom + lensR * DISPLACE_FRAC * rw;
      const sampleX = cx + ux * sampleDist;
      const sampleY = cy + uy * sampleDist;

      const [sx0, sy0] = toSrc(sampleX, sampleY);
      const a = sampleChannelBilinear(src, revealDw, revealDh, sx0, sy0, 3);
      if (a < 1) continue;

      let r: number;
      let g: number;
      let b: number;
      if (rw < 0.02) {
        [r, g, b] = sampleRGBA(src, revealDw, revealDh, sx0, sy0);
      } else {
        // Rim CA — RGB offsets only; alpha stays on the shared UV so chromatic
        // chips don't detach from the glyph.
        const caOff = lensR * CA_FRAC * rw;
        const [sxR, syR] = toSrc(sampleX + ux * caOff, sampleY + uy * caOff);
        const [sxB, syB] = toSrc(sampleX - ux * caOff, sampleY - uy * caOff);
        r = sampleChannelBilinear(src, revealDw, revealDh, sxR, syR, 0);
        g = sampleChannelBilinear(src, revealDw, revealDh, sx0, sy0, 1);
        b = sampleChannelBilinear(src, revealDw, revealDh, sxB, syB, 2);
      }

      const i = (py * size + px) * 4;
      outData[i] = r;
      outData[i + 1] = g;
      outData[i + 2] = b;
      outData[i + 3] = a;
    }
  }

  ctx.putImageData(img, 0, 0);
  return out;
}

/** Procedural glass rim (stand-in for monopo's /lense.png). */
function paintGlassOverlay(
  ctx: CanvasRenderingContext2D,
  lx: number,
  ly: number,
  lensR: number,
): void {
  const outer = lensR * 1.06;
  const inner = lensR * 0.82;

  // Soft annular highlight
  const ring = ctx.createRadialGradient(lx, ly, inner, lx, ly, outer);
  ring.addColorStop(0, "rgba(255,255,255,0)");
  ring.addColorStop(0.55, "rgba(255,255,255,0)");
  ring.addColorStop(0.78, "rgba(255,255,255,0.14)");
  ring.addColorStop(0.92, "rgba(255,255,255,0.06)");
  ring.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(lx, ly, outer, 0, Math.PI * 2);
  ctx.fill();

  // Specular crescent (top-left)
  ctx.save();
  ctx.beginPath();
  ctx.arc(lx, ly, lensR * 0.98, 0, Math.PI * 2);
  ctx.clip();
  const spec = ctx.createRadialGradient(
    lx - lensR * 0.35,
    ly - lensR * 0.4,
    0,
    lx - lensR * 0.1,
    ly - lensR * 0.15,
    lensR * 0.85,
  );
  spec.addColorStop(0, "rgba(255,255,255,0.22)");
  spec.addColorStop(0.35, "rgba(255,255,255,0.06)");
  spec.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = spec;
  ctx.fillRect(lx - lensR, ly - lensR, lensR * 2, lensR * 2);
  ctx.restore();

  // Thin rim stroke
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = Math.max(1, lensR * 0.018);
  ctx.beginPath();
  ctx.arc(lx, ly, lensR * 0.995, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.lineWidth = Math.max(0.75, lensR * 0.012);
  ctx.beginPath();
  ctx.arc(lx, ly, lensR * 1.01, 0, Math.PI * 2);
  ctx.stroke();
}

export function createFooterLensEngine(canvas: HTMLCanvasElement): FooterLensEngine {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    throw new Error("2d context unavailable");
  }

  let dpr = 1;
  let cssW = 0;
  let cssH = 0;
  let cache: Cache | null = null;
  let pointer: FooterLensPointer = null;
  let path2d: Path2D | null = null;

  const ensurePath = () => {
    if (!path2d) path2d = new Path2D(WORDMARK_PATH_D);
    return path2d;
  };

  const rebuildCache = () => {
    if (cssW < 8 || cssH < 8) {
      cache = null;
      return;
    }

    const path = ensurePath();
    const vbW = WORDMARK_VIEWBOX_W;
    const vbH = WORDMARK_VIEWBOX_H;
    // Logo is intentionally smaller than the full-bleed canvas so the lens
    // can travel past letter edges without being clipped by the stage.
    const padX = cssW * 0.12; // ~76% width
    const padY = cssH * 0.22; // ~56% height
    const fitW = cssW - padX * 2;
    const fitH = cssH - padY * 2;
    const scale = Math.min(fitW / vbW, fitH / vbH);
    const logoW = vbW * scale;
    const logoH = vbH * scale;
    const logoX = (cssW - logoW) / 2;
    const logoY = (cssH - logoH) / 2;

    const scaled = new Path2D();
    const m = new DOMMatrix().translate(logoX, logoY).scale(scale);
    scaled.addPath(path, m);

    const bufW = Math.max(1, Math.round(logoW * dpr));
    const bufH = Math.max(1, Math.round(logoH * dpr));
    const whiteWordmark = buildWhiteWordmark(scaled, logoX, logoY, logoW, logoH, bufW, bufH);
    const { canvas: reveal, data: revealData } = buildRevealBuffer(
      scaled,
      logoX,
      logoY,
      logoW,
      logoH,
      bufW,
      bufH,
    );

    cache = {
      logoX,
      logoY,
      logoW,
      logoH,
      path2d: scaled,
      whiteWordmark,
      reveal,
      revealData,
      revealDw: bufW,
      revealDh: bufH,
    };
  };

  const clear = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const drawIdle = () => {
    if (!cache) return;
    clear();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(cache.whiteWordmark, cache.logoX, cache.logoY, cache.logoW, cache.logoH);
  };

  const drawActive = (lx: number, ly: number) => {
    if (!cache) return;
    const { logoX, logoY, logoW, logoH, whiteWordmark } = cache;
    const lensR = logoW * LENS_R_FRAC;

    clear();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // 1) Lens content first — never paint white under the disc (that caused
    // the plain wordmark to show through inside the circle).
    const disc = buildLensDisc(cache, lensR, lx, ly);
    ctx.save();
    ctx.beginPath();
    ctx.arc(lx, ly, lensR, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(disc, lx - lensR, ly - lensR, lensR * 2, lensR * 2);
    ctx.restore();

    // 2) White wordmark only outside the lens (inverse circular mask).
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, cssW, cssH);
    ctx.arc(lx, ly, lensR, 0, Math.PI * 2, true);
    ctx.clip("evenodd");
    ctx.drawImage(whiteWordmark, logoX, logoY, logoW, logoH);
    ctx.restore();

    // 3) Glass rim overlay.
    paintGlassOverlay(ctx, lx, ly, lensR);
  };

  return {
    setSize(cssWidth, cssHeight) {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = Math.max(0, cssWidth);
      cssH = Math.max(0, cssHeight);
      canvas.width = Math.max(1, Math.round(cssW * dpr));
      canvas.height = Math.max(1, Math.round(cssH * dpr));
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      rebuildCache();
      if (pointer) {
        drawActive(pointer.x, pointer.y);
      } else {
        drawIdle();
      }
    },
    setPointer(next) {
      pointer = next;
    },
    drawAt(lx, ly, active) {
      if (!active || !cache) {
        drawIdle();
        return;
      }
      drawActive(lx, ly);
    },
    destroy() {
      cache = null;
      path2d = null;
      pointer = null;
    },
    getDpr() {
      return dpr;
    },
  };
}
