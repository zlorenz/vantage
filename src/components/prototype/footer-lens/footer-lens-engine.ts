/**
 * Symbol loupe — Canvas 2D approximation of monopo.london's Pixi stack.
 * Prototype for the About hero: large Vantage mark as a collage canvas.
 * 1. White symbol with inverse circular hole (outside lens)
 * 2. Photo-collage disc (inside lens) with displacement warp + rim RGB split
 * 3. Glass rim overlay
 * 4. Cursor lerp for organic tracking
 *
 * ---------------------------------------------------------------------------
 * MANDATORY REGRESSION CHECKLIST — every change to this file must re-verify
 * ALL items with screenshots before reporting. Do not scope QA to the current
 * bug only; silent regressions of previously fixed behavior are the recurring
 * failure mode.
 *
 *  1. Cusp singularity — no floating shard; gap reads open
 *  2. Cusp gap sufficiency — ≥0.70 vb units / clear work-res pixels
 *  3. Lens shows real photo content on hover (not blank)
 *  4. No white base bleed-through inside the lens
 *  5. No oversized black disc / clear-region mismatch
 *  6. Glass rim stroke aligns with reveal outer edge
 *  7. No hard warp seam (smooth center→rim mag)
 *  8. Magnification still reads strong (~2.2× class)
 *  9. No ring-warp banding/pixelation
 * 10. No blur color-wash (soft photo detail, not muddy flat)
 * 11. No blur ghost-edge (one sharp→soft transition)
 * 12. Glass rim visible on letterform AND page backgrounds
 * 13. Performance ~16–18ms build, not 70–160ms
 * 14. Edge-bulge — warped coverage; silhouette moves with hover
 * 15. No black / smeared band — natural photo falloff at outer edges
 * 16. 1× idle pixel-stable vs pre-work baseline
 * 17. No transparent holes in legitimate dark photo (hair, frames, fabric, shadow)
 *
 * Coverage position must stay WARPED (item 14). No-data is SOURCE ALPHA /
 * out-of-bounds only — never a luminance guess that punches holes in real
 * dark photo (items 15–17).
 * ---------------------------------------------------------------------------
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
/**
 * Solid coverage gate for 0..255 alpha samples.
 * CRITICAL: bilinear returns 0..255 — never compare against 0.5, or nearly
 * transparent fringe / counter-hole pixels get treated as real content,
 * forced opaque, dilated, and blurred into white/blue rim halos and floating
 * dark shards (e.g. the "A" negative-space triangle).
 */
const ALPHA_SOLID = 128;
/**
 * Reveal-texel radius of the precomputed "near mask boundary" band.
 * Used when building edgeProx (optional diagnostics / future adaptive paths).
 * Per-frame coverage now uses the full geomMask directly (O(1)), so this
 * no longer gates live isPointInPath.
 */
const EDGE_PROX_RADIUS = 8;
/**
 * Fallback warp-edge distance in reveal texels when dynamic sizing isn't
 * available. Prefer `warpEdgeDistForReveal(dw)` so falloff scales with the
 * buffer (~8 viewBox units — same reach as the old cusp damp, but everywhere).
 */
const WARP_EDGE_DIST_MIN = 64;

function warpEdgeDistForReveal(revealDw: number): number {
  // Preserve prior CSS damp reach: old path used ~8 units in a 36-unit
  // viewBox; re-export is 88.7 units (~2.46×), so scale the VB constant.
  const warpEdgeVb = (8 * SYMBOL_VIEWBOX_W) / 36;
  return Math.max(
    WARP_EDGE_DIST_MIN,
    Math.ceil((revealDw * warpEdgeVb) / SYMBOL_VIEWBOX_W),
  );
}

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
  /**
   * Geometric occupancy (0/255) at each reveal texel (build-time isPointInPath).
   * Used for O(1) warp pre-coverage and as a fast interior reference.
   */
  geomMask: Uint8Array;
  /**
   * 1 = within EDGE_PROX_RADIUS of any geom boundary; 0 = deep interior/exterior.
   * O(1) lookup decides live hit-test vs fast bilinear — no hardcoded cusps.
   */
  edgeProx: Uint8Array;
  /**
   * Distance (texels, capped per reveal) to nearest geom boundary.
   * Drives general warp dampening on both sides of every edge/gap.
   */
  edgeDist: Uint16Array;
  /** Cap used when building edgeDist (reveal-texel units). */
  warpEdgeDist: number;
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

  // Build the letterform mask in source-over (fill only), then apply it once
  // with destination-in. Stroking under destination-in itself would keep only
  // the hairline outline and wipe the filled interior — empty lens.
  //
  // A thin path stroke used to seal the A-counter cusp singularity; that
  // singularity is now opened by the 0.70-unit gap in SYMBOL_PATH_D, and the
  // stroke was over-sealing the counter apex with real dark collage texels
  // (Case A). Hairline gaps at other junctions are still sealed by
  // morphCloseAlpha below.
  const mask = document.createElement("canvas");
  mask.width = dw;
  mask.height = dh;
  const mctx = mask.getContext("2d")!;
  mctx.setTransform(dw / logoW, 0, 0, dh / logoH, 0, 0);
  mctx.translate(-logoX, -logoY);
  mctx.fillStyle = "#fff";
  mctx.fill(path2d);

  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(mask, 0, 0);
  ctx.globalCompositeOperation = "source-over";

  const data = ctx.getImageData(0, 0, dw, dh);
  // destination-in clears alpha outside the mark but often leaves stale RGB
  // (white / photo ghosts). Zero those so bilinear never bleeds foreign color
  // into letterform edges, and sub-solid fringe cannot seed the opaque blur path.
  scrubTransparentRgb(data.data);
  // Seal remaining hairline gaps at sharp cusps at full reveal resolution.
  // Radius 1 (was 3): radius 3 over-sealed the opened A-counter apex with
  // real dark collage texels (Case A). Radius 1 still closes 1px hairlines
  // at other junctions without bridging the 0.70-unit cusp opening.
  const closeTmp = new Uint8ClampedArray(data.data.length);
  morphCloseAlpha(data.data, dw, dh, 1, closeTmp);
  scrubTransparentRgb(data.data);
  ctx.putImageData(data, 0, 0);
  return { canvas: c, data };
}

/** Zero stale RGB only where alpha is fully empty (destination-in exterior).
 * Keep soft AA fringes — zeroing them made geometrically-inside edge texels
 * fail coverage and punch dark notches (page bg through the lens hole).
 */
function scrubTransparentRgb(rgba: Uint8ClampedArray): void {
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i + 3]! !== 0) continue;
    rgba[i] = 0;
    rgba[i + 1] = 0;
    rgba[i + 2] = 0;
  }
}

/**
 * Build-time geometric occupancy, edge-proximity band, and edge-distance
 * field for the WHOLE mark. isPointInPath runs once per reveal rebuild.
 */
function buildGeomEdgeMaps(
  path2d: Path2D,
  logoX: number,
  logoY: number,
  logoW: number,
  logoH: number,
  dw: number,
  dh: number,
): {
  geomMask: Uint8Array;
  edgeProx: Uint8Array;
  edgeDist: Uint16Array;
  warpEdgeDist: number;
} {
  const hitCtx = ensurePathHitCtx();
  const geomMask = new Uint8Array(dw * dh);
  const scaleX = dw / logoW;
  const scaleY = dh / logoH;
  for (let y = 0; y < dh; y++) {
    const logoCssY = logoY + (y + 0.5) / scaleY;
    const row = y * dw;
    for (let x = 0; x < dw; x++) {
      const logoCssX = logoX + (x + 0.5) / scaleX;
      if (hitCtx.isPointInPath(path2d, logoCssX, logoCssY, "nonzero")) {
        geomMask[row + x] = 255;
      }
    }
  }

  const warpEdgeDist = warpEdgeDistForReveal(dw);
  // Chamfer distance-to-boundary (0 on boundary, increases away).
  const INF = 0xffff;
  const edgeDist = new Uint16Array(dw * dh);
  edgeDist.fill(INF);
  for (let y = 0; y < dh; y++) {
    const row = y * dw;
    for (let x = 0; x < dw; x++) {
      const g = geomMask[row + x]!;
      if (
        (x > 0 && geomMask[row + x - 1]! !== g) ||
        (x + 1 < dw && geomMask[row + x + 1]! !== g) ||
        (y > 0 && geomMask[row - dw + x]! !== g) ||
        (y + 1 < dh && geomMask[row + dw + x]! !== g)
      ) {
        edgeDist[row + x] = 0;
      }
    }
  }
  // Forward chamfer
  for (let y = 0; y < dh; y++) {
    const row = y * dw;
    for (let x = 0; x < dw; x++) {
      const i = row + x;
      let d = edgeDist[i]!;
      if (x > 0) d = Math.min(d, edgeDist[i - 1]! + 1);
      if (y > 0) d = Math.min(d, edgeDist[i - dw]! + 1);
      if (x > 0 && y > 0) d = Math.min(d, edgeDist[i - dw - 1]! + 1);
      if (x + 1 < dw && y > 0) d = Math.min(d, edgeDist[i - dw + 1]! + 1);
      edgeDist[i] = Math.min(INF, d);
    }
  }
  // Backward chamfer
  for (let y = dh - 1; y >= 0; y--) {
    const row = y * dw;
    for (let x = dw - 1; x >= 0; x--) {
      const i = row + x;
      let d = edgeDist[i]!;
      if (x + 1 < dw) d = Math.min(d, edgeDist[i + 1]! + 1);
      if (y + 1 < dh) d = Math.min(d, edgeDist[i + dw]! + 1);
      if (x + 1 < dw && y + 1 < dh) d = Math.min(d, edgeDist[i + dw + 1]! + 1);
      if (x > 0 && y + 1 < dh) d = Math.min(d, edgeDist[i + dw - 1]! + 1);
      edgeDist[i] = Math.min(d, warpEdgeDist);
    }
  }

  const edgeProx = new Uint8Array(dw * dh);
  for (let i = 0; i < edgeProx.length; i++) {
    if (edgeDist[i]! <= EDGE_PROX_RADIUS) edgeProx[i] = 1;
  }
  return { geomMask, edgeProx, edgeDist, warpEdgeDist };
}

/** O(1) nearest sample of the edge-proximity band. */
function sampleEdgeProxNearest(
  edgeProx: Uint8Array,
  dw: number,
  dh: number,
  sx: number,
  sy: number,
): boolean {
  // Just outside the reveal buffer is still "near a boundary" for the mark
  // silhouette — treat a thin OOB ring as proximity so coverage stays precise.
  if (sx < -EDGE_PROX_RADIUS || sy < -EDGE_PROX_RADIUS) return false;
  if (sx >= dw + EDGE_PROX_RADIUS || sy >= dh + EDGE_PROX_RADIUS) return false;
  const ix = Math.min(dw - 1, Math.max(0, Math.floor(sx)));
  const iy = Math.min(dh - 1, Math.max(0, Math.floor(sy)));
  if (sx < 0 || sy < 0 || sx >= dw || sy >= dh) return true;
  return edgeProx[iy * dw + ix]! !== 0;
}

/**
 * O(1) nearest sample of edge distance (0 = boundary).
 * Out-of-buffer samples add Euclidean distance past the clamp edge so points
 * just outside the logo (pad / viewBox overflow) still damp like near-edge
 * exterior — previously OOB returned the max distance and got full warp,
 * which jumped exterior rays into the letterform at sharp outer vertices.
 */
function sampleEdgeDistNearest(
  edgeDist: Uint16Array,
  dw: number,
  dh: number,
  sx: number,
  sy: number,
  warpEdgeDist: number,
): number {
  const ix = Math.min(dw - 1, Math.max(0, Math.floor(sx)));
  const iy = Math.min(dh - 1, Math.max(0, Math.floor(sy)));
  const base = edgeDist[iy * dw + ix]!;
  if (sx >= 0 && sy >= 0 && sx < dw && sy < dh) return base;
  const ox = sx < 0 ? -sx : sx >= dw ? sx - (dw - 1) : 0;
  const oy = sy < 0 ? -sy : sy >= dh ? sy - (dh - 1) : 0;
  return Math.min(warpEdgeDist, base + Math.hypot(ox, oy));
}

/** Smoothstep 0..1. */
function smoothstep01(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/**
 * General warp amount from edge distance + occupancy.
 * Outside the mark → identity. Near any boundary → damp. Deep interior → full.
 */
/**
 * Warp amount from edge distance + occupancy.
 * Outside near any boundary → strong damp (large reach) so empty samples
 * cannot jump into letterform. Inside near a boundary → lighter damp so
 * thin tips stay continuous without killing loupe zoom in thicker strokes.
 * Coverage is decided at the unwarped (pre) position separately — warp only
 * affects which color is sampled (with identity fallback if the warped
 * sample leaves the mark).
 */
function edgeWarpAmount(
  edgeDist: number,
  insideMark: boolean,
  warpEdgeDist: number,
): number {
  // Inside reach ≈ 1.5 viewBox units; outside keeps the full ~8-unit map.
  const reach = insideMark
    ? Math.max(16, Math.ceil(warpEdgeDist * (1.5 / 8)))
    : warpEdgeDist;
  if (edgeDist >= reach) return 1;
  return smoothstep01(edgeDist / reach);
}


/** Nearest-texel geometric occupancy (O(1)). */
function sampleGeomMaskNearest(
  geomMask: Uint8Array,
  dw: number,
  dh: number,
  sx: number,
  sy: number,
): boolean {
  if (sx < 0 || sy < 0 || sx >= dw || sy >= dh) return false;
  const ix = Math.min(dw - 1, Math.max(0, Math.floor(sx)));
  const iy = Math.min(dh - 1, Math.max(0, Math.floor(sy)));
  return geomMask[iy * dw + ix]! >= 128;
}

/**
 * Morphological close on binary alpha (dilate then erode) to seal hairline gaps.
 * The "A" counter cusp is 1–2px at source; without this, exterior flood can leak
 * through the pinch and leave a magnified dark triangle shard in the loupe.
 * Spreads neighbor RGB when dilating so sealed texels aren't black.
 */
function morphCloseAlpha(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  radius: number,
  tmp: Uint8ClampedArray,
): void {
  if (radius < 1) return;
  const neigh: ReadonlyArray<readonly [number, number]> = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ];

  const dilate = (src: Uint8ClampedArray, dst: Uint8ClampedArray) => {
    dst.set(src);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = (y * w + x) * 4;
        if (src[i + 3]! >= ALPHA_SOLID) continue;
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (const [dx, dy] of neigh) {
          const j = ((y + dy) * w + (x + dx)) * 4;
          if (src[j + 3]! < ALPHA_SOLID) continue;
          r += src[j]!;
          g += src[j + 1]!;
          b += src[j + 2]!;
          n++;
        }
        if (n === 0) continue;
        dst[i] = Math.round(r / n);
        dst[i + 1] = Math.round(g / n);
        dst[i + 2] = Math.round(b / n);
        dst[i + 3] = 255;
      }
    }
  };

  const erode = (src: Uint8ClampedArray, dst: Uint8ClampedArray) => {
    dst.set(src);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = (y * w + x) * 4;
        if (src[i + 3]! < ALPHA_SOLID) continue;
        let solid = true;
        for (const [dx, dy] of neigh) {
          const j = ((y + dy) * w + (x + dx)) * 4;
          if (src[j + 3]! < ALPHA_SOLID) {
            solid = false;
            break;
          }
        }
        if (solid) continue;
        dst[i] = 0;
        dst[i + 1] = 0;
        dst[i + 2] = 0;
        dst[i + 3] = 0;
      }
    }
  };

  for (let k = 0; k < radius; k++) {
    dilate(data, tmp);
    data.set(tmp);
  }
  for (let k = 0; k < radius; k++) {
    erode(data, tmp);
    data.set(tmp);
  }
}

/**
 * Morph-close only inside the solid bbox (+ radius margin). Full-frame
 * dilate/erode was ~13ms/frame on the 416² pad; letterform usually occupies
 * a fraction of that.
 */
function morphCloseAlphaBounded(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  radius: number,
  tmp: Uint8ClampedArray,
  knownBBox?: { minX: number; minY: number; maxX: number; maxY: number } | null,
): void {
  if (radius < 1) return;
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  if (
    knownBBox &&
    knownBBox.maxX >= knownBBox.minX &&
    knownBBox.maxY >= knownBBox.minY
  ) {
    minX = knownBBox.minX;
    minY = knownBBox.minY;
    maxX = knownBBox.maxX;
    maxY = knownBBox.maxY;
  } else {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3]! < ALPHA_SOLID) continue;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return;
  let x0 = Math.max(1, minX - radius);
  let y0 = Math.max(1, minY - radius);
  let x1 = Math.min(w - 2, maxX + radius);
  let y1 = Math.min(h - 2, maxY + radius);

  const neigh: ReadonlyArray<readonly [number, number]> = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ];

  const copyBBox = (src: Uint8ClampedArray, dst: Uint8ClampedArray) => {
    for (let y = y0; y <= y1; y++) {
      const row = y * w;
      for (let x = x0; x <= x1; x++) {
        const i = (row + x) * 4;
        dst[i] = src[i]!;
        dst[i + 1] = src[i + 1]!;
        dst[i + 2] = src[i + 2]!;
        dst[i + 3] = src[i + 3]!;
      }
    }
  };

  const dilate = (src: Uint8ClampedArray, dst: Uint8ClampedArray) => {
    copyBBox(src, dst);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = (y * w + x) * 4;
        if (src[i + 3]! >= ALPHA_SOLID) continue;
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (const [dx, dy] of neigh) {
          const j = ((y + dy) * w + (x + dx)) * 4;
          if (src[j + 3]! < ALPHA_SOLID) continue;
          r += src[j]!;
          g += src[j + 1]!;
          b += src[j + 2]!;
          n++;
        }
        if (n === 0) continue;
        dst[i] = Math.round(r / n);
        dst[i + 1] = Math.round(g / n);
        dst[i + 2] = Math.round(b / n);
        dst[i + 3] = 255;
      }
    }
  };

  const erode = (src: Uint8ClampedArray, dst: Uint8ClampedArray) => {
    copyBBox(src, dst);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = (y * w + x) * 4;
        if (src[i + 3]! < ALPHA_SOLID) continue;
        let solid = true;
        for (const [dx, dy] of neigh) {
          const j = ((y + dy) * w + (x + dx)) * 4;
          if (src[j + 3]! < ALPHA_SOLID) {
            solid = false;
            break;
          }
        }
        if (solid) continue;
        dst[i] = 0;
        dst[i + 1] = 0;
        dst[i + 2] = 0;
        dst[i + 3] = 0;
      }
    }
  };

  for (let k = 0; k < radius; k++) {
    dilate(data, tmp);
    x0 = Math.max(1, x0 - 1);
    y0 = Math.max(1, y0 - 1);
    x1 = Math.min(w - 2, x1 + 1);
    y1 = Math.min(h - 2, y1 + 1);
    copyBBox(tmp, data);
  }
  for (let k = 0; k < radius; k++) {
    erode(data, tmp);
    copyBBox(tmp, data);
  }
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

/** One bilinear tap for R,G,B (avoids three separate channel walks). */
function sampleRgbBilinear(
  data: Uint8ClampedArray,
  dw: number,
  dh: number,
  sx: number,
  sy: number,
): [number, number, number] {
  if (sx < 0 || sy < 0 || sx >= dw - 1e-6 || sy >= dh - 1e-6) {
    return [0, 0, 0];
  }
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const x1 = Math.min(dw - 1, x0 + 1);
  const y1 = Math.min(dh - 1, y0 + 1);
  const fx = sx - x0;
  const fy = sy - y0;
  const w00 = (1 - fx) * (1 - fy);
  const w10 = fx * (1 - fy);
  const w01 = (1 - fx) * fy;
  const w11 = fx * fy;
  const i00 = (y0 * dw + x0) * 4;
  const i10 = (y0 * dw + x1) * 4;
  const i01 = (y1 * dw + x0) * 4;
  const i11 = (y1 * dw + x1) * 4;
  return [
    data[i00]! * w00 + data[i10]! * w10 + data[i01]! * w01 + data[i11]! * w11,
    data[i00 + 1]! * w00 +
      data[i10 + 1]! * w10 +
      data[i01 + 1]! * w01 +
      data[i11 + 1]! * w11,
    data[i00 + 2]! * w00 +
      data[i10 + 2]! * w10 +
      data[i01 + 2]! * w01 +
      data[i11 + 2]! * w11,
  ];
}

/**
 * Real-photo sampling (warped coverage stays).
 *
 * No-data ground truth = reveal SOURCE ALPHA (or sample OOB → a=0), NOT
 * luminance. Dark hair / frames / fabric / shadow are real photo and must
 * stay opaque. Transparent only when the reveal has no alpha there, or the
 * warped sample falls outside the buffer.
 */
/** CA: ignore near-black channel taps (quality only — not a coverage gate). */
const PHOTO_EDGE_MIN_LUMA = 40;
/**
 * Thin loupe-space alpha soften at the exterior silhouette (own RGB kept).
 * Short on purpose — just AA softness, not a visible colored ring.
 */
const EDGE_ALPHA_FEATHER_PX = 2;

type WarpedSample = { r: number; g: number; b: number; a: number };

/**
 * Warped-sample coverage + color + alpha.
 *
 * Coverage position: WARPED (geom at warped sample — silhouette bulges).
 * Presence: reveal alpha at the sample (bilinear). OOB bilinear → 0 → null.
 * Never reject in-bounds texels for being dark.
 */
function sampleWarpedMark(
  src: Uint8ClampedArray,
  geomMask: Uint8Array,
  revealDw: number,
  revealDh: number,
  sx: number,
  sy: number,
): WarpedSample | null {
  if (!sampleGeomMaskNearest(geomMask, revealDw, revealDh, sx, sy)) {
    return null;
  }
  // OOB returns 0 from sampleChannelBilinear — true out-of-bounds / no data.
  const aTap = sampleChannelBilinear(src, revealDw, revealDh, sx, sy, 3);
  if (aTap < 1) return null;
  const [r, g, b] = sampleRgbBilinear(src, revealDw, revealDh, sx, sy);
  return { r, g, b, a: Math.min(255, Math.round(aTap)) };
}

/**
 * Thin exterior alpha soften: fade alpha only, keep each texel’s own RGB.
 * Seeds from border-connected transparent (not enclosed counters).
 */
function featherExteriorAlphaOnly(
  rgba: Uint8ClampedArray,
  w: number,
  h: number,
  featherPx: number,
): void {
  if (featherPx < 1) return;
  const n = w * h;
  const exteriorEmpty = new Uint8Array(n);
  const q = new Int32Array(n);
  let qh = 0;
  let qt = 0;
  const trySeed = (x: number, y: number) => {
    const i = y * w + x;
    if (rgba[i * 4 + 3]! >= 128) return;
    if (exteriorEmpty[i]!) return;
    exteriorEmpty[i] = 1;
    q[qt++] = i;
  };
  for (let x = 0; x < w; x++) {
    trySeed(x, 0);
    trySeed(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    trySeed(0, y);
    trySeed(w - 1, y);
  }
  while (qh < qt) {
    const i = q[qh++]!;
    const x = i % w;
    const y = (i / w) | 0;
    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        if (ox === 0 && oy === 0) continue;
        const nx = x + ox;
        const ny = y + oy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const ni = ny * w + nx;
        if (exteriorEmpty[ni]!) continue;
        if (rgba[ni * 4 + 3]! >= 128) continue;
        exteriorEmpty[ni] = 1;
        q[qt++] = ni;
      }
    }
  }

  const dist = new Uint8Array(n);
  dist.fill(255);
  qh = 0;
  qt = 0;
  for (let i = 0; i < n; i++) {
    if (!exteriorEmpty[i]!) continue;
    dist[i] = 0;
    q[qt++] = i;
  }
  const cap = featherPx + 1;
  while (qh < qt) {
    const i = q[qh++]!;
    const d = dist[i]!;
    if (d >= cap) continue;
    const x = i % w;
    const y = (i / w) | 0;
    const nd = d + 1;
    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        if (ox === 0 && oy === 0) continue;
        const nx = x + ox;
        const ny = y + oy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const ni = ny * w + nx;
        if (nd >= dist[ni]!) continue;
        dist[ni] = nd;
        q[qt++] = ni;
      }
    }
  }
  for (let i = 0; i < n; i++) {
    const d = dist[i]!;
    if (d === 0 || d > featherPx) continue;
    const p = i * 4;
    const a = rgba[p + 3]!;
    if (a < 1) continue;
    const t = d / featherPx;
    const cover = t * t * (3 - 2 * t);
    rgba[p + 3] = Math.round(a * cover);
  }
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
const MAX_LOUPE_WORK_PX = 480;

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
 * Build the inside-lens disc at (optionally capped) device-pixel resolution.
 * Soft-focus is applied after blur so alpha never pollutes the filter.
 *
 * Coverage position: WARPED. Geom occupancy and color are both taken at the
 * fully warped sample. No-data fringe feathers alpha toward transparent —
 * never a forced-opaque synthetic fill. No identity fallback.
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
  const t0 = performance.now();
  const blurPx = Math.max(1, EDGE_BLUR_CSS_PX * dpr);
  // Pad past the blur kernel so rim samples never see empty transparent black.
  const pad = Math.ceil(blurPx * 2) + 2;
  const paddedSize = size + pad * 2;
  const scratch = ensureLoupeScratch(scratchIn, size, pad);

  const {
    revealData,
    revealDw,
    revealDh,
    logoX,
    logoY,
    logoW,
    logoH,
    geomMask,
  } = cache;
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

  const halfCss = discCss / 2;
  let solidMinX = paddedSize;
  let solidMinY = paddedSize;
  let solidMaxX = -1;
  let solidMaxY = -1;

  const tMain0 = performance.now();
  const sampleR = radiusPx + pad;
  const sampleR2 = sampleR * sampleR;
  const centerPx = pad + cx;
  const centerPy = pad + cy;
  for (let py = 0; py < paddedSize; py++) {
    const dyPx = py + 0.5 - centerPy;
    const dy2 = dyPx * dyPx;
    if (dy2 > sampleR2) continue;
    const xSpan = Math.sqrt(sampleR2 - dy2);
    const px0 = Math.max(0, Math.floor(centerPx - xSpan));
    const px1 = Math.min(paddedSize - 1, Math.ceil(centerPx + xSpan));
    for (let px = px0; px <= px1; px++) {
      const dxPx = px + 0.5 - centerPx;
      const distPxRaw = Math.hypot(dxPx, dyPx);
      if (distPxRaw > sampleR) continue;

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

      const zoom = zoomAt(t);
      const rw = rimWeight(t);
      // Coverage position: WARPED. Real photo at source alpha; no-data →
      // transparent (page shows through — no colored feather halo).
      const sampleDist = dist * zoom + lensR * DISPLACE_FRAC * rw;
      const sampleXCss = halfCss + ux * sampleDist;
      const sampleYCss = halfCss + uy * sampleDist;
      const logoCssX = originX + sampleXCss;
      const logoCssY = originY + sampleYCss;
      const sx0 = (logoCssX - logoX) * scaleX;
      const sy0 = (logoCssY - logoY) * scaleY;
      const sampled = sampleWarpedMark(
        src,
        geomMask,
        revealDw,
        revealDh,
        sx0,
        sy0,
      );
      if (!sampled) continue;
      let { r, g, b, a: sampleA } = sampled;
      const caOff = lensR * CA_FRAC * rw;
      // CA only on fully opaque real samples — soft fringe stays single-channel.
      if (caOff > 1e-6 && sampleA >= 250) {
        const sxR = (logoCssX + ux * caOff - logoX) * scaleX;
        const syR = (logoCssY + uy * caOff - logoY) * scaleY;
        if (
          sampleChannelBilinear(src, revealDw, revealDh, sxR, syR, 3) >=
          ALPHA_SOLID
        ) {
          const rTap = sampleChannelBilinear(
            src,
            revealDw,
            revealDh,
            sxR,
            syR,
            0,
          );
          if (rTap >= PHOTO_EDGE_MIN_LUMA) r = rTap;
        }
        const sxB = (logoCssX - ux * caOff - logoX) * scaleX;
        const syB = (logoCssY - uy * caOff - logoY) * scaleY;
        if (
          sampleChannelBilinear(src, revealDw, revealDh, sxB, syB, 3) >=
          ALPHA_SOLID
        ) {
          const bTap = sampleChannelBilinear(
            src,
            revealDw,
            revealDh,
            sxB,
            syB,
            2,
          );
          if (bTap >= PHOTO_EDGE_MIN_LUMA) b = bTap;
        }
      }

      // Blur source keeps sample alpha so soft photo edges blur as one falloff.
      const oi = (py * paddedSize + px) * 4;
      opaqueData[oi] = r;
      opaqueData[oi + 1] = g;
      opaqueData[oi + 2] = b;
      opaqueData[oi + 3] = sampleA;
      if (sampleA >= 128) {
        if (px < solidMinX) solidMinX = px;
        if (py < solidMinY) solidMinY = py;
        if (px > solidMaxX) solidMaxX = px;
        if (py > solidMaxY) solidMaxY = py;
      }

      // Sharp layer: sample alpha × soft circle coverage.
      if (distPxRaw > radiusPx + 0.5) continue;
      const sx = px - pad;
      const sy = py - pad;
      if (sx < 0 || sy < 0 || sx >= size || sy >= size) continue;
      const edge = radiusPx - distPxRaw;
      const feather = 1.75;
      const circleCover =
        edge >= feather ? 1 : Math.max(0, (edge + feather) / (2 * feather));
      const outA = sampleA * circleCover;
      if (outA < 1) continue;
      const si = (sy * size + sx) * 4;
      sharpData[si] = r;
      sharpData[si + 1] = g;
      sharpData[si + 2] = b;
      sharpData[si + 3] = outA;
    }
  }
  const mainLoopMs = performance.now() - tMain0;

  // Snapshot solid coverage before morph so scrub only re-tests texels that
  // morph-close newly filled (the counter-leak risk). Pre-validated main-loop
  // solids do not need a second geometric pass.
  const preMorphSolid = new Uint8Array(paddedSize * paddedSize);
  for (let i = 0, p = 3; i < preMorphSolid.length; i++, p += 4) {
    preMorphSolid[i] = opaqueData[p]! >= 200 ? 1 : 0;
  }

  // Soft photo-edge falloff must not participate in morph close — dilate/erode
  // would snap partial alphas to 0/255 and reintroduce a hard/smeared band.
  // Park soft texels, morph only hard solids, then restore.
  const softPark = new Uint8ClampedArray(opaqueData.length);
  for (let p = 3; p < opaqueData.length; p += 4) {
    const a = opaqueData[p]!;
    if (a === 0 || a >= 200) continue;
    softPark[p - 3] = opaqueData[p - 3]!;
    softPark[p - 2] = opaqueData[p - 2]!;
    softPark[p - 1] = opaqueData[p - 1]!;
    softPark[p] = a;
    opaqueData[p - 3] = 0;
    opaqueData[p - 2] = 0;
    opaqueData[p - 1] = 0;
    opaqueData[p] = 0;
  }

  // Seal hairline gaps in loupe coverage (A stroke junctions). Do NOT inpaint
  // the enclosed A counter — that hole should stay transparent so the page
  // gradient shows through.
  const tMorph0 = performance.now();
  // Radius 1 seals 1px hairlines at junctions without bridging the opened
  // counter cusp (0.70 viewBox units in SYMBOL_PATH_D).
  if (solidMaxX >= 0) {
    morphCloseAlphaBounded(
      opaqueData,
      paddedSize,
      paddedSize,
      1,
      scratch.dilatePrev,
      { minX: solidMinX, minY: solidMinY, maxX: solidMaxX, maxY: solidMaxY },
    );
  }
  for (let p = 3; p < softPark.length; p += 4) {
    if (softPark[p]! < 1) continue;
    if (opaqueData[p]! >= 1) continue; // morph sealed over this cell
    opaqueData[p - 3] = softPark[p - 3]!;
    opaqueData[p - 2] = softPark[p - 2]!;
    opaqueData[p - 1] = softPark[p - 1]!;
    opaqueData[p] = softPark[p]!;
  }
  // Mirror any coverage morph-close added into the sharp disc.
  // Live: morph dilates opaqueData into hairline gaps; sharp was only written
  // by the warp loop, so without this copy those sealed texels stay empty
  // in the sharp layer and the seal is invisible in the final disc.
  for (let sy = 0; sy < size; sy++) {
    for (let sx = 0; sx < size; sx++) {
      const si = (sy * size + sx) * 4;
      if (sharpData[si + 3]! >= 1) continue;
      const oi = ((sy + pad) * paddedSize + (sx + pad)) * 4;
      // Only mirror near-solid morph seals — leave soft photo falloff alone.
      if (opaqueData[oi + 3]! < 200) continue;
      sharpData[si] = opaqueData[oi]!;
      sharpData[si + 1] = opaqueData[oi + 1]!;
      sharpData[si + 2] = opaqueData[oi + 2]!;
      sharpData[si + 3] = opaqueData[oi + 3]!;
    }
  }

  // Morph dilate can re-fill the geometrically-open counter from letterform
  // neighbors. Scrub only those newly filled solid texels (bbox-limited).
  const scrubPad = 2;
  const scrubMinX =
    solidMaxX >= 0 ? Math.max(0, solidMinX - scrubPad) : 0;
  const scrubMinY =
    solidMaxY >= 0 ? Math.max(0, solidMinY - scrubPad) : 0;
  const scrubMaxX =
    solidMaxX >= 0 ? Math.min(paddedSize - 1, solidMaxX + scrubPad) : -1;
  const scrubMaxY =
    solidMaxY >= 0 ? Math.min(paddedSize - 1, solidMaxY + scrubPad) : -1;
  for (let py = scrubMinY; py <= scrubMaxY; py++) {
    for (let px = scrubMinX; px <= scrubMaxX; px++) {
      const cell = py * paddedSize + px;
      const oi = cell * 4;
      if (opaqueData[oi + 3]! < 1) continue;
      if (preMorphSolid[cell]!) continue; // already validated in main loop
      const dxPx = px + 0.5 - (pad + cx);
      const dyPx = py + 0.5 - (pad + cy);
      const distPxRaw = Math.hypot(dxPx, dyPx);
      if (distPxRaw > radiusPx + pad) {
        opaqueData[oi] = 0;
        opaqueData[oi + 1] = 0;
        opaqueData[oi + 2] = 0;
        opaqueData[oi + 3] = 0;
        continue;
      }
      const dxCss = dxPx / dpr;
      const dyCss = dyPx / dpr;
      const distRawCss = distPxRaw / dpr;
      const distPx = Math.min(distPxRaw, radiusPx);
      const dist = distPx / dpr;
      const t = Math.min(1, dist / lensR);
      const inv = distRawCss > 1e-6 ? 1 / distRawCss : 0;
      const ux = dxCss * inv;
      const uy = dyCss * inv;
      const zoom = zoomAt(t);
      const rw = rimWeight(t);
      const sampleDist = dist * zoom + lensR * DISPLACE_FRAC * rw;
      const sampleLogoX = originX + discCss / 2 + ux * sampleDist;
      const sampleLogoY = originY + discCss / 2 + uy * sampleDist;
      // Morph may only seal texels whose WARPED sample stays in the mark.
      // Re-sample with feathered alpha — never force opaque synthetic fill.
      const sxM = (sampleLogoX - logoX) * scaleX;
      const syM = (sampleLogoY - logoY) * scaleY;
      const morphColor = sampleWarpedMark(
        src,
        geomMask,
        revealDw,
        revealDh,
        sxM,
        syM,
      );
      if (morphColor && morphColor.a >= 200) {
        opaqueData[oi] = morphColor.r;
        opaqueData[oi + 1] = morphColor.g;
        opaqueData[oi + 2] = morphColor.b;
        opaqueData[oi + 3] = morphColor.a;
        const sxKeep = px - pad;
        const syKeep = py - pad;
        if (
          sxKeep >= 0 &&
          syKeep >= 0 &&
          sxKeep < size &&
          syKeep < size
        ) {
          const siKeep = (syKeep * size + sxKeep) * 4;
          if (sharpData[siKeep + 3]! >= 1) {
            sharpData[siKeep] = morphColor.r;
            sharpData[siKeep + 1] = morphColor.g;
            sharpData[siKeep + 2] = morphColor.b;
            sharpData[siKeep + 3] = Math.min(
              sharpData[siKeep + 3]!,
              morphColor.a,
            );
          }
        }
        continue;
      }
      opaqueData[oi] = 0;
      opaqueData[oi + 1] = 0;
      opaqueData[oi + 2] = 0;
      opaqueData[oi + 3] = 0;
      const sx = px - pad;
      const sy = py - pad;
      if (sx < 0 || sy < 0 || sx >= size || sy >= size) continue;
      const si = (sy * size + sx) * 4;
      sharpData[si] = 0;
      sharpData[si + 1] = 0;
      sharpData[si + 2] = 0;
      sharpData[si + 3] = 0;
    }
  }
  // Thin alpha-only exterior AA (own RGB kept — no nearest-color halo).
  featherExteriorAlphaOnly(
    opaqueData,
    paddedSize,
    paddedSize,
    EDGE_ALPHA_FEATHER_PX,
  );
  featherExteriorAlphaOnly(sharpData, size, size, EDGE_ALPHA_FEATHER_PX);
  const morphMs = performance.now() - tMorph0;

  // Do NOT dilate with forced opaque alpha before blur — that expands a hard
  // silhouette which, after blur, reads as a second ghost edge. Blur color+alpha
  // together so content edges soften as one continuous falloff.
  const tBlit0 = performance.now();
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
  const blitMs = performance.now() - tBlit0;
  const buildMs = performance.now() - t0;
  const g = globalThis as unknown as {
    __VP_LENS_PROFILE?: {
      buildMs: number;
      workPx: number;
      mainLoopMs: number;
      morphMs: number;
      blitMs: number;
      paddedSize: number;
    };
    __VP_LENS_DEBUG_SHARP?: HTMLCanvasElement;
    __VP_LENS_DEBUG_OPAQUE?: HTMLCanvasElement;
    __VP_LENS_DEBUG_BLURRED?: HTMLCanvasElement;
    __VP_LENS_DEBUG_DISC?: HTMLCanvasElement;
    __VP_LENS_DEBUG_REVEAL?: HTMLCanvasElement;
    __VP_LENS_DEBUG_META?: Record<string, unknown>;
    __VP_LENS_DEBUG_PAD?: number;
  };
  g.__VP_LENS_PROFILE = {
    buildMs,
    workPx: size,
    mainLoopMs,
    morphMs,
    blitMs,
    paddedSize,
  };
  g.__VP_LENS_DEBUG_SHARP = scratch.sharp;
  g.__VP_LENS_DEBUG_OPAQUE = scratch.opaque;
  g.__VP_LENS_DEBUG_BLURRED = scratch.revealBlurred;
  g.__VP_LENS_DEBUG_DISC = scratch.out;
  g.__VP_LENS_DEBUG_REVEAL = cache.reveal;
  g.__VP_LENS_DEBUG_PAD = pad;
  g.__VP_LENS_DEBUG_META = {
    buildMs,
    lx,
    ly,
    workDpr: dpr,
    workPx: size,
    lensR,
    logoX,
    logoY,
    logoW,
    logoH,
    revealDw,
    revealDh,
    pad,
    paddedSize,
  };
  return { disc: scratch.out, scratch };
}

/** Reused 2d context for Path2D.isPointInPath (identity transform). */
let pathHitCanvas: HTMLCanvasElement | null = null;
function ensurePathHitCtx(): CanvasRenderingContext2D {
  if (!pathHitCanvas) {
    pathHitCanvas = document.createElement("canvas");
    pathHitCanvas.width = 1;
    pathHitCanvas.height = 1;
  }
  const ctx = pathHitCanvas.getContext("2d")!;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return ctx;
}

/**
 * Soft-focus rim via true sharp↔blur crossfade.
 * Drawing full sharp under a rim-only blur left the sharp letterform edge
 * visible through the soft halo — two boundaries (ghost edge). Instead:
 * attenuate sharp toward the rim and show blur only there, so edges soften
 * as one continuous transition.
 */
function applyRimSoftFocus(scratch: LoupeScratch, blurPx: number): void {
  const size = scratch.size;
  const pad = scratch.pad;
  const cx = size / 2;
  const cy = size / 2;
  const radiusPx = size / 2;

  const bctx = scratch.blurredPadded.getContext("2d")!;
  bctx.clearRect(0, 0, scratch.blurredPadded.width, scratch.blurredPadded.height);
  // Blur color+alpha together — pre-blur alpha already matches photo coverage
  // (no forced-opaque dilate, no hard coverage clip afterward).
  bctx.filter = `blur(${blurPx}px)`;
  bctx.drawImage(scratch.opaqueRaster, 0, 0);
  bctx.filter = "none";

  const cctx = scratch.revealBlurred.getContext("2d")!;
  cctx.clearRect(0, 0, size, size);
  cctx.globalCompositeOperation = "source-over";
  cctx.drawImage(scratch.blurredPadded, -pad, -pad);

  // Rim visibility for the soft layer (0 at center → peak near rim → 0 at edge).
  cctx.globalCompositeOperation = "destination-in";
  const blurMask = cctx.createRadialGradient(
    cx,
    cy,
    radiusPx * EDGE_BLUR_START,
    cx,
    cy,
    radiusPx,
  );
  blurMask.addColorStop(0, "rgba(0,0,0,0)");
  blurMask.addColorStop(0.4, "rgba(0,0,0,0.35)");
  blurMask.addColorStop(0.75, "rgba(0,0,0,0.85)");
  blurMask.addColorStop(1, "rgba(0,0,0,0)");
  cctx.fillStyle = blurMask;
  cctx.beginPath();
  cctx.arc(cx, cy, radiusPx, 0, Math.PI * 2);
  cctx.fill();
  cctx.globalCompositeOperation = "source-over";

  // Attenuate sharp toward the rim (inverse of blur visibility) so its hard
  // content edge doesn't sit under the soft halo.
  const sctx = scratch.sharpRaster.getContext("2d")!;
  sctx.globalCompositeOperation = "destination-in";
  const sharpMask = sctx.createRadialGradient(
    cx,
    cy,
    radiusPx * EDGE_BLUR_START,
    cx,
    cy,
    radiusPx,
  );
  sharpMask.addColorStop(0, "rgba(0,0,0,1)");
  sharpMask.addColorStop(0.4, "rgba(0,0,0,0.85)");
  sharpMask.addColorStop(0.75, "rgba(0,0,0,0.25)");
  sharpMask.addColorStop(1, "rgba(0,0,0,0)");
  sctx.fillStyle = sharpMask;
  sctx.beginPath();
  sctx.arc(cx, cy, radiusPx, 0, Math.PI * 2);
  sctx.fill();
  sctx.globalCompositeOperation = "source-over";

  const octx = scratch.out.getContext("2d")!;
  octx.clearRect(0, 0, size, size);
  octx.drawImage(scratch.sharpRaster, 0, 0);
  octx.drawImage(scratch.revealBlurred, 0, 0);
}

/**
 * Procedural glass chrome (stand-in for monopo's /lense.png).
 * Drawn last on the main canvas with no clip / destination-in — independent
 * of the letterform-masked mosaic. Soft rim glow + offset specular + dual
 * hairlines so the lens reads as a glass sphere even over pure page background
 * (matching redesign.vantage.pictures/about). Stripped to a dark hairline in
 * 3cbe0bdc; that left only a faint outline on empty bg.
 */
function paintGlassOverlay(
  ctx: CanvasRenderingContext2D,
  lx: number,
  ly: number,
  lensR: number,
): void {
  const outer = lensR * 1.06;
  const inner = lensR * 0.82;

  // Soft annular rim wash (glass edge thickness).
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

  // Offset specular highlight — the "sphere" cue on empty background.
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
    const { geomMask, edgeProx, edgeDist, warpEdgeDist } = buildGeomEdgeMaps(
      scaled,
      logoX,
      logoY,
      logoW,
      logoH,
      revealW,
      revealH,
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
      geomMask,
      edgeProx,
      edgeDist,
      warpEdgeDist,
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

    // Wordmark with lens hole FIRST. If the disc is drawn first, evenodd-hole
    // antialiasing fringes white into the circle and reads as a pale rim halo
    // over pure background. Disc on top covers that fringe.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, cssW, cssH);
    ctx.arc(lx, ly, lensR, 0, Math.PI * 2, true);
    ctx.clip("evenodd");
    ctx.drawImage(whiteWordmark, logoX, logoY, logoW, logoH);
    ctx.restore();

    const cxDev = lx * dpr;
    const cyDev = ly * dpr;
    const rDev = blitPx / 2;
    // No hard circle clip — clipping soft disc alpha makes a second crisp rim
    // (ghost edge). The disc already carries soft circular coverage.
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = workPx < blitPx;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(disc, cxDev - rDev, cyDev - rDev, blitPx, blitPx);
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
