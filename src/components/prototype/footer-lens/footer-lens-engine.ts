/**
 * Footer lens canvas engine — spec-matched loupe prototype.
 *
 * Lens sizing is against the wordmark’s own rendered width (not canvas width).
 * Warp: 60 concentric rings, INNER_FLAT=0.45 @ ZOOM_CENTER=0.6, outer eases to
 * ZOOM_EDGE=1.05 with t^1.6. CA: quadratic rim falloff, bilinear, 1/3 lens res.
 *
 * To swap real BTS photos into drawMosaic: load with crossOrigin='anonymous'
 * or destination-in throws SecurityError.
 */

import {
  WORDMARK_VIEWBOX_H,
  WORDMARK_VIEWBOX_W,
  getWordmarkPath,
} from './wordmark-path';

export type FooterLensState = {
  cssW: number;
  cssH: number;
  dpr: number;
  pointerX: number;
  pointerY: number;
  pointerActive: boolean;
};

export type FooterLensCache = {
  revealKey: string;
  reveal: HTMLCanvasElement | null;
};

const LOGO_FIT_WIDTH = 0.92;
const LOGO_FIT_HEIGHT = 0.7;

/** Lens radius as a fraction of wordmark rendered width (~16.5% diameter). */
const LENS_RADIUS_FRAC = 0.0825;
/** Soft feather beyond the hard radius, also vs wordmark width. */
const LENS_FEATHER_FRAC = 0.03375;

const INNER_FLAT = 0.45;
const ZOOM_CENTER = 0.6;
const ZOOM_EDGE = 1.05;
const RING_COUNT = 60;
const ZOOM_EASE = 1.6;

/** Max RGB channel offset in CSS pixels at the rim. */
const CA_MAX_PX = 5;
/** Linear resolution of the CA working buffer relative to the lens footprint. */
const CA_RES_SCALE = 1 / 3;

const MOSAIC_COLS = 14;
const MOSAIC_ROWS = 5;
const MOSAIC_BASE = ['#5c5c5c', '#6e6e6e', '#4a4a4a', '#7a7a7a', '#585858'] as const;
const MOSAIC_WARM = ['rgba(243,112,33,0.55)', 'rgba(253,185,19,0.5)'] as const;
const GRAIN_DOTS = 400;

/** Contain-fit the wordmark into the lens-wrap box (not the full viewport). */
function logoSize(cssW: number, cssH: number): {logoW: number; logoH: number} {
  const maxW = cssW * LOGO_FIT_WIDTH;
  const maxH = cssH * LOGO_FIT_HEIGHT;
  const scale = Math.min(
    maxW / WORDMARK_VIEWBOX_W,
    maxH / WORDMARK_VIEWBOX_H,
  );
  return {
    logoW: WORDMARK_VIEWBOX_W * scale,
    logoH: WORDMARK_VIEWBOX_H * scale,
  };
}

function lensMetrics(logoW: number): {lensR: number; feather: number} {
  return {
    lensR: logoW * LENS_RADIUS_FRAC,
    feather: logoW * LENS_FEATHER_FRAC,
  };
}

/** Zoom for a normalized radius t (0 at center, 1 at rim). */
function zoomAt(t: number): number {
  if (t <= INNER_FLAT) return ZOOM_CENTER;
  const u = (t - INNER_FLAT) / (1 - INNER_FLAT);
  const eased = Math.pow(u, ZOOM_EASE);
  return ZOOM_CENTER + (ZOOM_EDGE - ZOOM_CENTER) * eased;
}

export function drawWordmarkPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  logoW: number,
  logoH: number,
): void {
  const path = getWordmarkPath();
  ctx.save();
  ctx.translate(cx - logoW / 2, cy - logoH / 2);
  ctx.scale(logoW / WORDMARK_VIEWBOX_W, logoH / WORDMARK_VIEWBOX_H);
  ctx.fill(path);
  ctx.restore();
}

/** Deterministic 0..1 from tile index (stable across frames, no Math.random flicker). */
function tileHash(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function drawPersonSilhouette(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
): void {
  const headR = size * 0.16;
  const torsoW = size * 0.4;
  const torsoH = size * 0.36;
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy - size * 0.18, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - torsoW * 0.55, cy - size * 0.02);
  ctx.lineTo(cx + torsoW * 0.55, cy - size * 0.02);
  ctx.lineTo(cx + torsoW * 0.35, cy + torsoH);
  ctx.lineTo(cx - torsoW * 0.35, cy + torsoH);
  ctx.closePath();
  ctx.fill();
}

/**
 * Crisp 14×5 cool-gray tile mosaic with per-tile vignette, sparse warm accents,
 * person silhouettes, and light film grain. Placeholder for real BTS photos.
 */
export function drawMosaic(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const tw = w / MOSAIC_COLS;
  const th = h / MOSAIC_ROWS;

  for (let row = 0; row < MOSAIC_ROWS; row++) {
    for (let col = 0; col < MOSAIC_COLS; col++) {
      const i = row * MOSAIC_COLS + col;
      const h0 = tileHash(i);
      const h1 = tileHash(i + 97);
      const h2 = tileHash(i + 193);
      const px = x + col * tw;
      const py = y + row * th;

      ctx.fillStyle = MOSAIC_BASE[Math.floor(h0 * MOSAIC_BASE.length) % MOSAIC_BASE.length]!;
      ctx.fillRect(px, py, tw + 0.5, th + 0.5);

      const rg = ctx.createRadialGradient(
        px + tw * 0.5,
        py + th * 0.5,
        0,
        px + tw * 0.5,
        py + th * 0.5,
        Math.max(tw, th) * 0.72,
      );
      rg.addColorStop(0, 'rgba(255,255,255,0.16)');
      rg.addColorStop(1, 'rgba(0,0,0,0.12)');
      ctx.fillStyle = rg;
      ctx.fillRect(px, py, tw + 0.5, th + 0.5);

      if (h1 < 0.12) {
        ctx.fillStyle = MOSAIC_WARM[h2 < 0.5 ? 0 : 1]!;
        ctx.fillRect(px, py, tw + 0.5, th + 0.5);
      }

      const iconSize = Math.min(tw, th) * 0.55;
      drawPersonSilhouette(ctx, px + tw * 0.5, py + th * 0.48, iconSize);
    }
  }

  // Film grain — ~400 1×1 dots at 5% alpha across the mosaic
  for (let g = 0; g < GRAIN_DOTS; g++) {
    const gx = x + tileHash(g * 3 + 1) * w;
    const gy = y + tileHash(g * 3 + 2) * h;
    ctx.fillStyle =
      tileHash(g * 3 + 3) < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    ctx.fillRect(gx, gy, 1, 1);
  }
}

function buildRevealBuffer(
  cssW: number,
  cssH: number,
  dpr: number,
  cx: number,
  cy: number,
  logoW: number,
  logoH: number,
): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(cssW * dpr));
  c.height = Math.max(1, Math.round(cssH * dpr));
  const ctx = c.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Mosaic covers the wordmark box tightly (14×5 over logo bounds). Light pad so
  // ZOOM_CENTER samples still hit tiles near glyph edges.
  const padX = logoW * 0.08;
  const padY = logoH * 0.35;
  drawMosaic(
    ctx,
    cx - logoW / 2 - padX,
    cy - logoH / 2 - padY,
    logoW + padX * 2,
    logoH + padY * 2,
  );

  ctx.globalCompositeOperation = 'destination-in';
  ctx.fillStyle = '#fff';
  drawWordmarkPath(ctx, cx, cy, logoW, logoH);
  ctx.globalCompositeOperation = 'source-over';

  return c;
}

/**
 * 60 concentric rings. Outer drawn first, inner last so flat center wins.
 * zoom = source/dest radius ratio → canvas scale = 1/zoom around lens center.
 * imageSmoothingEnabled stays false so each ring stays faceted (stepped mag),
 * not a soft uniform blur.
 */
function buildWarpedLens(
  src: HTMLCanvasElement,
  cssW: number,
  cssH: number,
  dpr: number,
  lx: number,
  ly: number,
  lensR: number,
  feather: number,
): HTMLCanvasElement {
  const outerR = lensR + feather;
  const pad = Math.ceil(outerR) + 2;
  const sizeCss = pad * 2;
  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.round(sizeCss * dpr));
  out.height = Math.max(1, Math.round(sizeCss * dpr));
  const ctx = out.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;

  const ox = pad;
  const oy = pad;

  // Outermost → innermost
  for (let i = RING_COUNT; i >= 1; i--) {
    const tOuter = i / RING_COUNT;
    const tInner = (i - 1) / RING_COUNT;
    const destOuter = tOuter * lensR;
    const midT = (tOuter + tInner) / 2;
    const zoom = zoomAt(midT);
    const scale = 1 / zoom;

    ctx.save();
    ctx.beginPath();
    ctx.arc(ox, oy, destOuter, 0, Math.PI * 2);
    ctx.clip();

    ctx.translate(ox, oy);
    ctx.scale(scale, scale);
    ctx.translate(-lx, -ly);
    ctx.drawImage(src, 0, 0, cssW, cssH);
    ctx.restore();
  }

  // Soft feather: opaque through lensR, fade to 0 by lensR+feather
  ctx.globalCompositeOperation = 'destination-in';
  const fade = ctx.createRadialGradient(ox, oy, lensR, ox, oy, outerR);
  fade.addColorStop(0, 'rgba(0,0,0,1)');
  fade.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, sizeCss, sizeCss);
  ctx.globalCompositeOperation = 'source-over';

  return out;
}

function sampleChannelBilinear(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  x: number,
  y: number,
  channel: 0 | 1 | 2,
): number {
  if (x < 0 || y < 0 || x >= w - 1 || y >= h - 1) {
    const xi = Math.max(0, Math.min(w - 1, Math.floor(x)));
    const yi = Math.max(0, Math.min(h - 1, Math.floor(y)));
    return data[(yi * w + xi) * 4 + channel]!;
  }
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const i00 = (y0 * w + x0) * 4 + channel;
  const i10 = (y0 * w + x0 + 1) * 4 + channel;
  const i01 = ((y0 + 1) * w + x0) * 4 + channel;
  const i11 = ((y0 + 1) * w + x0 + 1) * 4 + channel;
  return (
    data[i00]! * (1 - fx) * (1 - fy) +
    data[i10]! * fx * (1 - fy) +
    data[i01]! * (1 - fx) * fy +
    data[i11]! * fx * fy
  );
}

/**
 * Chromatic aberration working buffer at ~1/3 lens resolution.
 * Returns full-lens CA result (bilinear RGB split, quadratic rim falloff).
 * Caller composites this over the crisp warp with a rim-weighted alpha so the
 * flat center keeps faceted mosaic detail.
 */
function applyChromaticAberration(
  lensCanvas: HTMLCanvasElement,
  lensCssSize: number,
  dpr: number,
  outerR: number,
): HTMLCanvasElement {
  const sw = Math.max(2, Math.round(lensCssSize * CA_RES_SCALE * dpr));
  const sh = sw;
  const small = document.createElement('canvas');
  small.width = sw;
  small.height = sh;
  const sctx = small.getContext('2d', {willReadFrequently: true})!;
  sctx.imageSmoothingEnabled = true;
  sctx.drawImage(lensCanvas, 0, 0, sw, sh);

  const img = sctx.getImageData(0, 0, sw, sh);
  const srcData = img.data;
  const out = sctx.createImageData(sw, sh);
  const dst = out.data;

  const cx = (sw - 1) / 2;
  const cy = (sh - 1) / 2;
  const rMax = outerR * CA_RES_SCALE * dpr;
  const rMax2 = rMax * rMax;
  const maxShift = CA_MAX_PX * CA_RES_SCALE * dpr;

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist2 = dx * dx + dy * dy;
      const i = (y * sw + x) * 4;
      const a = srcData[i + 3]!;

      if (a < 1 || dist2 > rMax2) {
        dst[i] = 0;
        dst[i + 1] = 0;
        dst[i + 2] = 0;
        dst[i + 3] = 0;
        continue;
      }

      const dist = Math.sqrt(dist2);
      const n = dist / rMax;
      const fringe = n * n;
      const inv = dist > 1e-4 ? 1 / dist : 0;
      const ux = dx * inv;
      const uy = dy * inv;
      const shift = fringe * maxShift;

      dst[i] = sampleChannelBilinear(
        srcData,
        sw,
        sh,
        x + ux * shift,
        y + uy * shift,
        0,
      );
      dst[i + 1] = sampleChannelBilinear(srcData, sw, sh, x, y, 1);
      dst[i + 2] = sampleChannelBilinear(
        srcData,
        sw,
        sh,
        x - ux * shift,
        y - uy * shift,
        2,
      );
      // Rim-only composite weight: negligible at center, full at edge
      dst[i + 3] = Math.round(a * Math.min(1, fringe * 1.35));
    }
  }

  sctx.putImageData(out, 0, 0);

  const finalC = document.createElement('canvas');
  finalC.width = lensCanvas.width;
  finalC.height = lensCanvas.height;
  const fctx = finalC.getContext('2d')!;
  fctx.imageSmoothingEnabled = true;
  fctx.imageSmoothingQuality = 'high';
  fctx.drawImage(small, 0, 0, finalC.width, finalC.height);
  return finalC;
}

export function resizeCanvas(
  canvas: HTMLCanvasElement,
  cssW: number,
  cssH: number,
  dpr: number,
): CanvasRenderingContext2D {
  canvas.width = Math.max(1, Math.round(cssW * dpr));
  canvas.height = Math.max(1, Math.round(cssH * dpr));
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export function renderFooterLens(
  ctx: CanvasRenderingContext2D,
  state: FooterLensState,
  cache?: FooterLensCache,
): void {
  const {cssW, cssH, dpr, pointerX, pointerY, pointerActive} = state;
  const cx = cssW / 2;
  const cy = cssH / 2;
  const {logoW, logoH} = logoSize(cssW, cssH);
  const {lensR, feather} = lensMetrics(logoW);
  const outerR = lensR + feather;

  ctx.clearRect(0, 0, cssW, cssH);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, cssW, cssH);

  ctx.fillStyle = '#fff';
  drawWordmarkPath(ctx, cx, cy, logoW, logoH);

  if (!pointerActive) return;

  const revealKey = `${cssW}x${cssH}@${dpr}`;
  let reveal: HTMLCanvasElement;
  if (cache && cache.reveal && cache.revealKey === revealKey) {
    reveal = cache.reveal;
  } else {
    reveal = buildRevealBuffer(cssW, cssH, dpr, cx, cy, logoW, logoH);
    if (cache) {
      cache.revealKey = revealKey;
      cache.reveal = reveal;
    }
  }

  const warped = buildWarpedLens(
    reveal,
    cssW,
    cssH,
    dpr,
    pointerX,
    pointerY,
    lensR,
    feather,
  );
  const lensCssSize = Math.ceil(outerR) * 2 + 4;
  const caLayer = applyChromaticAberration(warped, lensCssSize, dpr, outerR);

  const pad = Math.ceil(outerR) + 2;
  // Crisp faceted warp (tiles + ring steps) underneath; CA only where rim alpha > 0
  ctx.drawImage(warped, pointerX - pad, pointerY - pad, pad * 2, pad * 2);
  ctx.drawImage(caLayer, pointerX - pad, pointerY - pad, pad * 2, pad * 2);

  // Subtle hard rim at the optical radius (inside the feather)
  ctx.beginPath();
  ctx.arc(pointerX, pointerY, lensR, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = Math.max(1, logoW * 0.002);
  ctx.stroke();
}
