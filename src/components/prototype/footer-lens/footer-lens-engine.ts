/**
 * Symbol loupe — Canvas 2D approximation of monopo.london's Pixi stack.
 * Prototype for the About hero: large Vantage mark as a collage canvas.
 * 1. White symbol with inverse circular hole (outside lens)
 * 2. Photo-collage disc (inside lens) with displacement warp + rim RGB split
 * 3. Glass rim overlay
 * 4. Cursor lerp for organic tracking
 */

import {
  SYMBOL_PATH_D,
  SYMBOL_VIEWBOX_H,
  SYMBOL_VIEWBOX_W,
} from "./symbol-path";

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

/**
 * Placeholder-resolution photo collage (alpha-masked to the "A").
 * Expect a higher-res re-export before shipping — pipeline test asset only.
 */
const COLLAGE_SRC = "/prototype/footer-lens/collage.png";

/**
 * Loupe warp — collage-readable:
 * - Nearly flat zoom across most of the lens (one continuous curve, no seam)
 * - Gentle dome + CA only near the rim
 * (sampleDist = dist * zoom → lower zoom = stronger magnification)
 */
/** Center zoom (~2.2×). Confirmed; do not raise without re-checking collage. */
const ZOOM_CENTER = 0.45;
/** Rim zoom — closer to center so the dome is a soft falloff, not a second zone. */
const ZOOM_EDGE = 0.55;
/**
 * Exponent for the continuous zoom / rim falloff (u^N).
 * Higher = flatter longer, thinner transition at the edge. Tuned ~6–10.
 */
const ZOOM_FALLOFF_EXP = 9;
/** Subtle rim displacement only (fraction of lensR). */
const DISPLACE_FRAC = 0.035;
/** Soft chromatic split at the outer rim (fraction of lensR). */
const CA_FRAC = 0.01;
/**
 * Soft-focus onset as fraction of lensR — blur only in this outer band,
 * aligned with the alpha feather at the disc boundary.
 */
const EDGE_BLUR_START = 0.82;
/** Base blur radius in CSS px; multiplied by dpr for the device-pixel disc. */
const EDGE_BLUR_CSS_PX = 5;
/**
 * Lens radius as fraction of symbol width.
 * Slightly larger than the wordmark loupe so the collage reads on a square mark.
 */
const LENS_R_FRAC = 0.161;
/**
 * Reveal-buffer supersample vs logo CSS size (× devicePixelRatio).
 * Sized so ~ZOOM_CENTER magnification still has spare source pixels on Retina.
 */
const REVEAL_SUPER = 1 / ZOOM_CENTER;

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

/* -------------------------------------------------------------------------- */
/* LEGACY procedural mosaic — kept for easy restore. Not used while COLLAGE_SRC
 * is active. Re-enable by calling buildProceduralMosaicReveal from rebuildCache.
 * -------------------------------------------------------------------------- */

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

/** @deprecated Prefer COLLAGE_SRC; kept so the gray-tile placeholder is easy to restore. */
function buildProceduralMosaicReveal(
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

// Keep the restore helper referenced so tree-shaking / unused lint stays quiet.
void buildProceduralMosaicReveal;

/* -------------------------------------------------------------------------- */

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

/**
 * Reveal buffer from the photo collage, then destination-in against Path2D.
 * Collage is already alpha-masked to the "A"; Path2D intersect is intentional
 * (harmless when they agree; watch for thin double-edge / gap if they drift).
 * Drawn into the supersampled buffer (logoCss * dpr * REVEAL_SUPER).
 */
function buildRevealBuffer(
  path2d: Path2D,
  logoX: number,
  logoY: number,
  logoW: number,
  logoH: number,
  dw: number,
  dh: number,
  collage: CanvasImageSource,
): { canvas: HTMLCanvasElement; data: ImageData } {
  const c = document.createElement("canvas");
  c.width = dw;
  c.height = dh;
  const ctx = c.getContext("2d")!;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(collage, 0, 0, dw, dh);

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

/**
 * One continuous zoom curve over the full 0..1 radius — no INNER_FLAT split.
 * Slope stays C∞; u^N keeps the middle nearly flat and pushes warp to a thin rim.
 */
function zoomAt(u: number): number {
  const t = Math.min(1, Math.max(0, u));
  return ZOOM_CENTER + (ZOOM_EDGE - ZOOM_CENTER) * Math.pow(t, ZOOM_FALLOFF_EXP);
}

/** Displace / CA weight — same continuous family as zoom (no rim-start kink). */
function rimWeight(u: number): number {
  const t = Math.min(1, Math.max(0, u));
  return Math.pow(t, ZOOM_FALLOFF_EXP);
}

/**
 * Device-pixel diameter for the loupe disc. Always even so the circle center
 * sits on a pixel boundary and x/y radii stay identical (no egg from ceil).
 */
function lensDiscDiameterPx(lensR: number, dpr: number): number {
  const raw = Math.max(2, Math.round(lensR * 2 * dpr));
  return raw % 2 === 0 ? raw : raw + 1;
}

/**
 * Cap internal loupe raster size. Full Retina disc + pad + dilate was a
 * multi-million-op hog every hover frame on large About hero viewports.
 * We still blit at full CSS/device size; only the warp buffer is downscaled.
 */
const MAX_LOUPE_WORK_PX = 360;

/** Skip rebuild when the lens center moves less than this (CSS px). */
const LOUPE_MOVE_EPS = 0.4;

type LoupeScratch = {
  size: number;
  pad: number;
  sharp: HTMLCanvasElement;
  opaque: HTMLCanvasElement;
  opaqueRaster: HTMLCanvasElement;
  sharpRaster: HTMLCanvasElement;
  blurredPadded: HTMLCanvasElement;
  revealBlurred: HTMLCanvasElement;
  out: HTMLCanvasElement;
  sharpImg: ImageData;
  opaqueImg: ImageData;
  dilatePrev: Uint8ClampedArray;
};

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function ensureLoupeScratch(
  scratch: LoupeScratch | null,
  size: number,
  pad: number,
): LoupeScratch {
  const paddedSize = size + pad * 2;
  if (
    scratch &&
    scratch.size === size &&
    scratch.pad === pad &&
    scratch.sharp.width === size &&
    scratch.opaque.width === paddedSize
  ) {
    return scratch;
  }

  const sharp = makeCanvas(size, size);
  const opaque = makeCanvas(paddedSize, paddedSize);
  const sharpCtx = sharp.getContext("2d")!;
  const opaqueCtx = opaque.getContext("2d")!;
  return {
    size,
    pad,
    sharp,
    opaque,
    opaqueRaster: makeCanvas(paddedSize, paddedSize),
    sharpRaster: makeCanvas(size, size),
    blurredPadded: makeCanvas(paddedSize, paddedSize),
    revealBlurred: makeCanvas(size, size),
    out: makeCanvas(size, size),
    sharpImg: sharpCtx.createImageData(size, size),
    opaqueImg: opaqueCtx.createImageData(paddedSize, paddedSize),
    dilatePrev: new Uint8ClampedArray(paddedSize * paddedSize * 4),
  };
}

/**
 * Grow opaque RGB into neighboring transparent texels so a subsequent blur
 * never samples empty (0,0,0,0) and dilutes toward black.
 * `prevBuf` is reused across iterations to avoid per-frame allocations.
 */
function dilateOpaqueRgb(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  iterations: number,
  prevBuf: Uint8ClampedArray,
): void {
  const neighbors: ReadonlyArray<readonly [number, number]> = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ];
  for (let iter = 0; iter < iterations; iter++) {
    prevBuf.set(data);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = (y * w + x) * 4;
        if (prevBuf[i + 3]! >= 128) continue;
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (const [dx, dy] of neighbors) {
          const j = ((y + dy) * w + (x + dx)) * 4;
          if (prevBuf[j + 3]! < 128) continue;
          r += prevBuf[j]!;
          g += prevBuf[j + 1]!;
          b += prevBuf[j + 2]!;
          n++;
        }
        if (n === 0) continue;
        data[i] = Math.round(r / n);
        data[i + 1] = Math.round(g / n);
        data[i + 2] = Math.round(b / n);
        data[i + 3] = 255;
      }
    }
  }
}

/**
 * Build the inside-lens disc at (optionally capped) device-pixel resolution.
 * Soft-focus is applied after blur so alpha never pollutes the filter.
 */
function buildLensDisc(
  cache: Cache,
  lensR: number,
  lx: number,
  ly: number,
  dpr: number,
  size: number,
  scratchIn: LoupeScratch | null,
): { disc: HTMLCanvasElement; scratch: LoupeScratch } {
  const blurPx = Math.max(1, EDGE_BLUR_CSS_PX * dpr);
  // Pad past the blur kernel so rim samples never see empty transparent black.
  const pad = Math.ceil(blurPx * 2) + 2;
  const paddedSize = size + pad * 2;
  const scratch = ensureLoupeScratch(scratchIn, size, pad);

  const { revealData, revealDw, revealDh, logoX, logoY, logoW, logoH } = cache;
  const src = revealData.data;
  const scaleX = revealDw / logoW;
  const scaleY = revealDh / logoH;
  const cx = size / 2;
  const cy = size / 2;
  const radiusPx = size / 2;
  const discCss = size / dpr;
  const originX = lx - discCss / 2;
  const originY = ly - discCss / 2;

  const sharpCtx = scratch.sharp.getContext("2d")!;
  const opaqueCtx = scratch.opaque.getContext("2d")!;
  const sharpData = scratch.sharpImg.data;
  const opaqueData = scratch.opaqueImg.data;
  sharpData.fill(0);
  opaqueData.fill(0);

  for (let py = 0; py < paddedSize; py++) {
    for (let px = 0; px < paddedSize; px++) {
      const dxPx = px + 0.5 - (pad + cx);
      const dyPx = py + 0.5 - (pad + cy);
      const distPxRaw = Math.hypot(dxPx, dyPx);
      if (distPxRaw > radiusPx + pad) continue;

      // Clamp sampling radius for the pad ring — extend real edge color outward.
      const distPx = Math.min(distPxRaw, radiusPx);
      const dxCss = dxPx / dpr;
      const dyCss = dyPx / dpr;
      const distRawCss = distPxRaw / dpr;
      const dist = distPx / dpr;
      const t = Math.min(1, dist / lensR);
      const inv = distRawCss > 1e-6 ? 1 / distRawCss : 0;
      const ux = dxCss * inv;
      const uy = dyCss * inv;

      const toSrc = (qxCss: number, qyCss: number): [number, number] => {
        const logoPx = originX + qxCss;
        const logoPy = originY + qyCss;
        return [(logoPx - logoX) * scaleX, (logoPy - logoY) * scaleY];
      };

      const zoom = zoomAt(t);
      const rw = rimWeight(t);
      const sampleDist = dist * zoom + lensR * DISPLACE_FRAC * rw;
      const sampleXCss = discCss / 2 + ux * sampleDist;
      const sampleYCss = discCss / 2 + uy * sampleDist;

      const [sx0, sy0] = toSrc(sampleXCss, sampleYCss);
      const a = sampleChannelBilinear(src, revealDw, revealDh, sx0, sy0, 3);
      // Need real photo coverage — skip empty collage / OOB.
      if (a < 0.5) continue;

      const caOff = lensR * CA_FRAC * rw;
      const [sxR, syR] = toSrc(sampleXCss + ux * caOff, sampleYCss + uy * caOff);
      const [sxB, syB] = toSrc(sampleXCss - ux * caOff, sampleYCss - uy * caOff);
      const r = sampleChannelBilinear(src, revealDw, revealDh, sxR, syR, 0);
      const g = sampleChannelBilinear(src, revealDw, revealDh, sx0, sy0, 1);
      const b = sampleChannelBilinear(src, revealDw, revealDh, sxB, syB, 2);

      // Opaque blur source: solid alpha (no lens-edge feather baked in).
      const oi = (py * paddedSize + px) * 4;
      opaqueData[oi] = r;
      opaqueData[oi + 1] = g;
      opaqueData[oi + 2] = b;
      opaqueData[oi + 3] = 255;

      // Sharp layer: only inside the visible disc, with soft circle coverage.
      if (distPxRaw > radiusPx + 0.5) continue;
      const sx = px - pad;
      const sy = py - pad;
      if (sx < 0 || sy < 0 || sx >= size || sy >= size) continue;
      const edge = radiusPx - distPxRaw;
      const circleCover = edge >= 0.5 ? 1 : edge + 0.5;
      const outA = a * circleCover;
      if (outA < 0.5) continue;
      const si = (sy * size + sx) * 4;
      sharpData[si] = r;
      sharpData[si + 1] = g;
      sharpData[si + 2] = b;
      sharpData[si + 3] = outA;
    }
  }

  // Enough iterations to cover ~blur kernel; full `pad` was O(pad) frame killers.
  const dilateIters = Math.min(6, Math.max(2, Math.ceil(blurPx)));
  dilateOpaqueRgb(opaqueData, paddedSize, paddedSize, dilateIters, scratch.dilatePrev);

  sharpCtx.putImageData(scratch.sharpImg, 0, 0);
  opaqueCtx.putImageData(scratch.opaqueImg, 0, 0);

  // Rasterize before filter (putImageData-only canvases can skip blur in Chromium).
  const opaqueRasterCtx = scratch.opaqueRaster.getContext("2d")!;
  opaqueRasterCtx.clearRect(0, 0, paddedSize, paddedSize);
  opaqueRasterCtx.drawImage(scratch.opaque, 0, 0);

  const sharpRasterCtx = scratch.sharpRaster.getContext("2d")!;
  sharpRasterCtx.clearRect(0, 0, size, size);
  sharpRasterCtx.drawImage(scratch.sharp, 0, 0);

  applyRimSoftFocus(scratch, blurPx);
  return { disc: scratch.out, scratch };
}

/**
 * Soft-focus rim: blur a fully-opaque padded buffer first, THEN mask alpha.
 * Never blur a feathered/transparent edge — that dilutes RGB toward black and
 * reads as a flat gradient instead of softened photo detail.
 */
function applyRimSoftFocus(scratch: LoupeScratch, blurPx: number): void {
  const size = scratch.size;
  const pad = scratch.pad;
  const cx = size / 2;
  const cy = size / 2;
  const radiusPx = size / 2;

  const bctx = scratch.blurredPadded.getContext("2d")!;
  bctx.clearRect(0, 0, scratch.blurredPadded.width, scratch.blurredPadded.height);
  bctx.filter = `blur(${blurPx}px)`;
  bctx.drawImage(scratch.opaqueRaster, 0, 0);
  bctx.filter = "none";

  // Crop blurred padded buffer back to the visible disc size.
  const cctx = scratch.revealBlurred.getContext("2d")!;
  cctx.clearRect(0, 0, size, size);
  cctx.globalCompositeOperation = "source-over";
  cctx.drawImage(scratch.blurredPadded, -pad, -pad);

  // Alpha mask LAST — rim soft-focus band × soft circle edge. Blur never sees this.
  cctx.globalCompositeOperation = "destination-in";
  const mask = cctx.createRadialGradient(
    cx,
    cy,
    radiusPx * EDGE_BLUR_START,
    cx,
    cy,
    radiusPx,
  );
  mask.addColorStop(0, "rgba(0,0,0,0)");
  mask.addColorStop(0.35, "rgba(0,0,0,0.2)");
  mask.addColorStop(0.7, "rgba(0,0,0,0.65)");
  // Feather the very rim so the lens edge isn't a hard cut on the blurred layer.
  mask.addColorStop(0.92, "rgba(0,0,0,1)");
  mask.addColorStop(1, "rgba(0,0,0,0)");
  cctx.fillStyle = mask;
  cctx.beginPath();
  cctx.arc(cx, cy, radiusPx, 0, Math.PI * 2);
  cctx.fill();
  cctx.globalCompositeOperation = "source-over";

  const octx = scratch.out.getContext("2d")!;
  octx.clearRect(0, 0, size, size);
  octx.drawImage(scratch.sharpRaster, 0, 0);
  octx.drawImage(scratch.revealBlurred, 0, 0);
}

/**
 * Procedural glass rim (stand-in for monopo's /lense.png).
 * Primary stroke radius === reveal clip radius (same center, same r).
 */
function paintGlassOverlay(
  ctx: CanvasRenderingContext2D,
  lx: number,
  ly: number,
  lensR: number,
): void {
  const outer = lensR * 1.06;
  const inner = lensR * 0.82;

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

  ctx.save();
  ctx.beginPath();
  ctx.arc(lx, ly, lensR, 0, Math.PI * 2);
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

  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = Math.max(1, lensR * 0.018);
  ctx.beginPath();
  ctx.arc(lx, ly, lensR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.lineWidth = Math.max(0.75, lensR * 0.012);
  ctx.beginPath();
  ctx.arc(lx, ly, lensR, 0, Math.PI * 2);
  ctx.stroke();
}

function loadCollageImage(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load collage: ${COLLAGE_SRC}`));
    img.src = COLLAGE_SRC;
  });
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
  let collage: HTMLImageElement | null = null;
  let destroyed = false;
  let lastActive = false;
  let lastLx = 0;
  let lastLy = 0;
  let loupeScratch: LoupeScratch | null = null;
  let lastBuiltLx = Number.NaN;
  let lastBuiltLy = Number.NaN;

  const ensurePath = () => {
    if (!path2d) path2d = new Path2D(SYMBOL_PATH_D);
    return path2d;
  };

  const rebuildCache = () => {
    if (cssW < 8 || cssH < 8 || !collage) {
      cache = null;
      return;
    }

    const path = ensurePath();
    const vbW = SYMBOL_VIEWBOX_W;
    const vbH = SYMBOL_VIEWBOX_H;
    // Large symbol (still above About hero's 48vmin/28rem), dialed back 30%
    // from the near-fullscreen fit so the loupe has breathing room.
    const padX = cssW * 0.18;
    const padY = cssH * 0.18;
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

    const whiteW = Math.max(1, Math.round(logoW * dpr));
    const whiteH = Math.max(1, Math.round(logoH * dpr));
    const revealW = Math.max(1, Math.round(logoW * dpr * REVEAL_SUPER));
    const revealH = Math.max(1, Math.round(logoH * dpr * REVEAL_SUPER));
    const whiteWordmark = buildWhiteWordmark(
      scaled,
      logoX,
      logoY,
      logoW,
      logoH,
      whiteW,
      whiteH,
    );
    const { canvas: reveal, data: revealData } = buildRevealBuffer(
      scaled,
      logoX,
      logoY,
      logoW,
      logoH,
      revealW,
      revealH,
      collage,
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
      revealDw: revealW,
      revealDh: revealH,
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
    const blitPx = lensDiscDiameterPx(lensR, dpr);
    // Cap warp raster; blit still fills the full device-pixel disc.
    let workPx = Math.min(blitPx, MAX_LOUPE_WORK_PX);
    if (workPx % 2 !== 0) workPx -= 1;
    workPx = Math.max(2, workPx);
    const workDpr = (workPx / blitPx) * dpr;

    clear();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const { disc, scratch } = buildLensDisc(
      cache,
      lensR,
      lx,
      ly,
      workDpr,
      workPx,
      loupeScratch,
    );
    loupeScratch = scratch;
    lastBuiltLx = lx;
    lastBuiltLy = ly;

    const cxDev = lx * dpr;
    const cyDev = ly * dpr;
    const rDev = blitPx / 2;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.beginPath();
    ctx.arc(cxDev, cyDev, rDev, 0, Math.PI * 2);
    ctx.clip();
    ctx.imageSmoothingEnabled = workPx < blitPx;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(disc, cxDev - rDev, cyDev - rDev, blitPx, blitPx);
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, cssW, cssH);
    ctx.arc(lx, ly, lensR, 0, Math.PI * 2, true);
    ctx.clip("evenodd");
    ctx.drawImage(whiteWordmark, logoX, logoY, logoW, logoH);
    ctx.restore();

    paintGlassOverlay(ctx, lx, ly, lensR);
  };

  const redraw = () => {
    if (lastActive && cache) {
      drawActive(lastLx, lastLy);
    } else {
      drawIdle();
    }
  };

  void loadCollageImage()
    .then((img) => {
      if (destroyed) return;
      collage = img;
      rebuildCache();
      redraw();
    })
    .catch((err) => {
      console.error("[footer-lens]", err);
    });

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
      redraw();
    },
    setPointer(next) {
      pointer = next;
    },
    drawAt(lx, ly, active) {
      if (
        active &&
        lastActive &&
        cache &&
        Math.abs(lx - lastBuiltLx) < LOUPE_MOVE_EPS &&
        Math.abs(ly - lastBuiltLy) < LOUPE_MOVE_EPS
      ) {
        lastLx = lx;
        lastLy = ly;
        return;
      }
      lastLx = lx;
      lastLy = ly;
      lastActive = active;
      if (!active || !cache) {
        lastBuiltLx = Number.NaN;
        lastBuiltLy = Number.NaN;
        drawIdle();
        return;
      }
      drawActive(lx, ly);
    },
    destroy() {
      destroyed = true;
      cache = null;
      path2d = null;
      pointer = null;
      collage = null;
      loupeScratch = null;
    },
    getDpr() {
      return dpr;
    },
  };
}
