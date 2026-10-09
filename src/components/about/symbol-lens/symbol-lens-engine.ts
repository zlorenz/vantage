/**
 * About hero symbol loupe. The disc is a WebGL warp of the photo collage.
 * 1. Inline glass symbol (crisp edge + inner rim) — the loupe canvas only draws the disc
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

import {buildGlassMarkSvg, GLASS_PAD_VB} from "./glass-mark-svg";
import {createLoupeGl, type LoupeGl} from "./loupe-gl";
import {
  SYMBOL_PATH_D,
  SYMBOL_VIEWBOX_H,
  SYMBOL_VIEWBOX_W,
} from "./symbol-path";

export type AboutLensEngine = {
  setSize: (cssWidth: number, cssHeight: number) => void;
  /** Inline SVG host for the glass mark. The loupe canvas stays above it. */
  setGlassHost: (host: HTMLElement | null) => void;
  /** Draw at a smoothed lens center (component owns lerp). */
  drawAt: (lx: number, ly: number, active: boolean) => void;
  destroy: () => void;
  getDpr: () => number;
};

/**
 * Placeholder-resolution photo collage (alpha-masked to the "A").
 * Expect a higher-res re-export before shipping — pipeline test asset only.
 */
const COLLAGE_SRC = "/about/symbol-lens/vantage-logo-photo-collage-01.webp";

/**
 * Loupe warp — collage-readable:
 * - Nearly flat zoom across most of the lens (one continuous curve, no seam)
 * - Gentle dome + CA only near the rim
 * (sampleDist = dist * zoom → lower zoom = stronger magnification)
 */
/** Center zoom (~2.2×). Confirmed; do not raise without re-checking collage. */
const ZOOM_CENTER = 0.45;
/** Rim zoom — 20% less dome than the 0.55 baseline. */
const ZOOM_EDGE = 0.53;
/**
 * Exponent for the zoom / rim falloff (u^N) across the whole radius.
 * Higher = flatter longer, then a quicker rise near the edge.
 */
const ZOOM_FALLOFF_EXP = 9;
/** Rim displacement as a fraction of the lens radius. 20% under the 0.02 baseline. */
const DISPLACE_FRAC = 0.016;
/** Soft chromatic split at the outer rim (fraction of lensR). */
const CA_FRAC = 0.01;
/**
 * Lens radius as fraction of symbol width.
 * Slightly larger than the wordmark loupe so the collage reads on a square mark.
 */
const LENS_R_FRAC = 0.213;
/**
 * Inner height of a Retina MacBook hero. The loupe is capped at the size it
 * has there. Beyond that the mark keeps growing with the viewport, which made
 * the disc much larger on a lower-res external display.
 */
const LENS_REF_VIEWPORT_CSS = 1000;
/** Inset used when fitting the mark to the hero. */
const LOGO_PAD_FRAC = 0.18;
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

function logoFit(cssW: number, cssH: number): {
  scale: number;
  logoW: number;
  logoH: number;
  logoX: number;
  logoY: number;
} {
  const fitW = cssW * (1 - LOGO_PAD_FRAC * 2);
  const fitH = cssH * (1 - LOGO_PAD_FRAC * 2);
  const scale = Math.min(fitW / SYMBOL_VIEWBOX_W, fitH / SYMBOL_VIEWBOX_H);
  const logoW = SYMBOL_VIEWBOX_W * scale;
  const logoH = SYMBOL_VIEWBOX_H * scale;
  return {
    scale,
    logoW,
    logoH,
    logoX: (cssW - logoW) / 2,
    logoY: (cssH - logoH) / 2,
  };
}

/** CSS radius. Never larger than the Retina MacBook hero; smaller viewports still shrink. */
function lensRadiusCss(logoW: number): number {
  const refLogoW = logoFit(LENS_REF_VIEWPORT_CSS, LENS_REF_VIEWPORT_CSS).logoW;
  return Math.min(logoW, refLogoW) * LENS_R_FRAC;
}

/** Public loupe radius for layers that clip to the same disc (e.g. hero quote cards). */
export function aboutLensRadiusCss(cssW: number, cssH: number): number {
  return lensRadiusCss(logoFit(cssW, cssH).logoW);
}

type Cache = {
  logoX: number;
  logoY: number;
  logoW: number;
  logoH: number;
  path2d: Path2D;
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
   * Additive-only hole bleed from buildCounterBleed: collage RGBA on real
   * counter overlaps (cusp seal + thin edge fringes excluded). Null alpha
   * outside. Path2D / geomMask stay unchanged — this is a separate source.
   */
  holeAllowanceData: ImageData;
};

/* -------------------------------------------------------------------------- */

/**
 * Reveal buffer from the photo collage, then destination-in against Path2D.
 * Collage is already alpha-masked to the "A"; Path2D intersect is intentional
 * (harmless when they agree; watch for thin double-edge / gap if they drift).
 * Drawn into the supersampled buffer (logoCss * dpr * REVEAL_SUPER).
 *
 * Optional holeMask: after Path2D destination-in + morphClose, copy opaque
 * mark RGBA 1–2 texels into holeMask cells only (never exterior). Those cells
 * stay geomMask==0 so sampleWarpedMark still nulls there — shelf is solely
 * so mark-edge bilinear neighbors are content instead of hard zero.
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
  holeMask?: Uint8Array,
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
  // Mark|hole seam shelf: holeMask only (excludes border-reachable exterior).
  if (holeMask) {
    dilateOpaqueIntoMask(data.data, dw, dh, holeMask, SEAM_SHELF_TEXELS);
    // Path2D destination-in leaves a soft AA fringe on the mark side of the
    // cut; bilinear there never reaches the hole shelf. Solidify alpha only
    // on mark texels that touch holeMask (RGB unchanged) so the junction is
    // opaque without widening silhouette into exterior.
    solidifyMarkAlphaTouchingHole(data.data, dw, dh, holeMask);
  }
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
 * Build-time geometric occupancy for the whole mark.
 * isPointInPath runs once per reveal rebuild.
 */
function buildGeomEdgeMaps(
  path2d: Path2D,
  logoX: number,
  logoY: number,
  logoW: number,
  logoH: number,
  dw: number,
  dh: number,
): Uint8Array {
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
  return geomMask;
}

/**
 * Cusp gap endpoints in viewBox (SYMBOL_PATH_D). Used only as a temporary
 * flood barrier when classifying the inner cavity — never mutates live Path2D.
 */
const CUSP_GAP_VB = { x0: 44.0, x1: 44.7, y: 33.16 } as const;
/**
 * Seal half-width in viewBox units for classification + allowance exclusion.
 * Validated brush was ~±0.2 vb at 10×; use 0.35 (wider) so the gap channel
 * stays out of allowanceMask.
 */
const CUSP_SEAL_HALF_VB = 0.35;
/**
 * Build-time mark|hole seam shelf width in reveal texels. Feeds bilinear
 * neighborhoods across the Path2D cut without reading as a second ring.
 * 2 texels: radius 1 left a residual magenta gap under loupe warp/DPR.
 */
const SEAM_SHELF_TEXELS = 2;

/**
 * Classify the enclosed counter (hole) vs border-reachable exterior.
 *
 * Temporarily seals the cusp gap as a flood barrier only — does not mutate
 * live Path2D / geomMask. sealFootprint marks the brush used for that barrier
 * and for allowance exclusion.
 */
function classifyHoleCavity(
  geomMask: Uint8Array,
  dw: number,
  dh: number,
): { exterior: Uint8Array; sealFootprint: Uint8Array; holeMask: Uint8Array } {
  const sealed = new Uint8Array(geomMask);
  const sealFootprint = new Uint8Array(dw * dh);
  const sx = dw / SYMBOL_VIEWBOX_W;
  const sy = dh / SYMBOL_VIEWBOX_H;
  const rTx = Math.max(3, Math.ceil(CUSP_SEAL_HALF_VB * sx));
  const rTy = Math.max(3, Math.ceil(CUSP_SEAL_HALF_VB * sy));
  const gapSpanPx = Math.max(1, Math.ceil((CUSP_GAP_VB.x1 - CUSP_GAP_VB.x0) * sx));
  const steps = Math.max(80, gapSpanPx * 2);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const vx = CUSP_GAP_VB.x0 + (CUSP_GAP_VB.x1 - CUSP_GAP_VB.x0) * t;
    const vy = CUSP_GAP_VB.y;
    const cx = Math.round(vx * sx - 0.5);
    const cy = Math.round(vy * sy - 0.5);
    for (let oy = -rTy; oy <= rTy; oy++) {
      for (let ox = -rTx; ox <= rTx; ox++) {
        const nx = cx + ox;
        const ny = cy + oy;
        if (nx < 0 || ny < 0 || nx >= dw || ny >= dh) continue;
        const idx = ny * dw + nx;
        sealed[idx] = 255;
        sealFootprint[idx] = 1;
      }
    }
  }

  const exterior = new Uint8Array(dw * dh);
  const q = new Int32Array(dw * dh);
  let qh = 0;
  let qt = 0;
  const trySeed = (x: number, y: number) => {
    const i = y * dw + x;
    if (sealed[i]! >= 128 || exterior[i]!) return;
    exterior[i] = 1;
    q[qt++] = i;
  };
  for (let x = 0; x < dw; x++) {
    trySeed(x, 0);
    trySeed(x, dh - 1);
  }
  for (let y = 0; y < dh; y++) {
    trySeed(0, y);
    trySeed(dw - 1, y);
  }
  while (qh < qt) {
    const i = q[qh++]!;
    const x = i % dw;
    const y = (i / dw) | 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        if (dx !== 0 && dy !== 0) continue; // 4-connected
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= dw || ny >= dh) continue;
        const ni = ny * dw + nx;
        if (sealed[ni]! >= 128 || exterior[ni]!) continue;
        exterior[ni] = 1;
        q[qt++] = ni;
      }
    }
  }

  const holeMask = new Uint8Array(dw * dh);
  for (let i = 0; i < dw * dh; i++) {
    if (geomMask[i]! < 128 && exterior[i]! === 0) holeMask[i] = 1;
  }
  return { exterior, sealFootprint, holeMask };
}

/**
 * Force opaque alpha on mark-side texels that touch holeMask. Leaves exterior
 * and interior soft AA alone — only the mark|hole interface.
 */
function solidifyMarkAlphaTouchingHole(
  rgba: Uint8ClampedArray,
  dw: number,
  dh: number,
  holeMask: Uint8Array,
): void {
  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      const i = y * dw + x;
      if (holeMask[i]!) continue;
      const p = i * 4;
      const a = rgba[p + 3]!;
      if (a < 1 || a >= 255) continue;
      let touchesHole = false;
      for (let oy = -1; oy <= 1 && !touchesHole; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          if (ox === 0 && oy === 0) continue;
          const nx = x + ox;
          const ny = y + oy;
          if (nx < 0 || ny < 0 || nx >= dw || ny >= dh) continue;
          if (holeMask[ny * dw + nx]!) {
            touchesHole = true;
            break;
          }
        }
      }
      if (touchesHole) rgba[p + 3] = 255;
    }
  }
}

/**
 * Build-time morphological dilate of opaque RGBA into targetMask cells.
 * forbidMask cells are never written and never used as copy sources (cusp
 * seal + exterior for the allowance shelf).
 */
function dilateOpaqueIntoMask(
  rgba: Uint8ClampedArray,
  dw: number,
  dh: number,
  targetMask: Uint8Array,
  radius: number,
  forbidMask?: Uint8Array,
): void {
  if (radius < 1) return;
  const tmp = new Uint8ClampedArray(rgba.length);
  for (let iter = 0; iter < radius; iter++) {
    tmp.set(rgba);
    for (let y = 0; y < dh; y++) {
      for (let x = 0; x < dw; x++) {
        const i = y * dw + x;
        if (targetMask[i]! === 0) continue;
        if (forbidMask && forbidMask[i]!) continue;
        const p = i * 4;
        if (rgba[p + 3]! > 0) continue;
        let bestA = 0;
        let br = 0;
        let bg = 0;
        let bb = 0;
        let ba = 0;
        for (let oy = -1; oy <= 1; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            if (ox === 0 && oy === 0) continue;
            const nx = x + ox;
            const ny = y + oy;
            if (nx < 0 || ny < 0 || nx >= dw || ny >= dh) continue;
            const ni = ny * dw + nx;
            if (forbidMask && forbidMask[ni]!) continue;
            const np = ni * 4;
            const a = rgba[np + 3]!;
            if (a <= bestA) continue;
            bestA = a;
            br = rgba[np]!;
            bg = rgba[np + 1]!;
            bb = rgba[np + 2]!;
            ba = a;
          }
        }
        if (bestA < 1) continue;
        tmp[p] = br;
        tmp[p + 1] = bg;
        tmp[p + 2] = bb;
        tmp[p + 3] = ba;
      }
    }
    rgba.set(tmp);
  }
}

type HoleClassification = {
  exterior: Uint8Array;
  sealFootprint: Uint8Array;
  holeMask: Uint8Array;
};

/**
 * Mark texels within this many texels of the counter get opaque collage
 * colour. Path AA at ~50% coverage leaves some geom-inside texels at alpha 0
 * after morph-close; sampled through the geom gate they read as a dotted
 * line of missing / darkened pixels along every counter edge.
 */
const COUNTER_EDGE_ZONE_TEXELS = 2;
/**
 * Counter-edge repair skips texels this close to the border-reachable
 * exterior, so outer silhouette edges and the cusp gap corners keep the
 * original reveal pipeline exactly.
 */
const COUNTER_EXTERIOR_GUARD_TEXELS = 3;
/**
 * Hole bleed must reach deeper than this (texels from the mark) to count as
 * a real overlap. Shallower collage content is the collage's own AA fringe
 * hugging the path edge and is dropped unless it touches a deeper overlap.
 */
const HOLE_BLEED_MIN_DEPTH_TEXELS = 3;
const HOLE_BLEED_CORE_ALPHA = 64;
/**
 * The collage was authored on the pinched apex (both counter slants meeting
 * at the gap midpoint), so it overhangs the opened path by a thin wedge on
 * each slant. Wedge texels only bleed where they attach to a real overlap.
 */
const CUSP_STRIP_MARGIN_TEXELS = 2;
/** Counter base vertices from SYMBOL_PATH_D (left slant foot, right slant foot). */
const COUNTER_FOOT_LEFT_VB = { x: 28.48, y: 76.73 } as const;
const COUNTER_FOOT_RIGHT_VB = { x: 56.5, y: 66.53 } as const;

const DIST_UNREACHED = 255;

/**
 * Capped 8-connected BFS distance (Chebyshev steps) from seed cells, limited
 * to a bbox. passable (optional) restricts which non-seed cells can be
 * entered. Unreached / out-of-bbox cells stay DIST_UNREACHED.
 */
function bfsDistanceCapped(
  dw: number,
  bbox: { x0: number; y0: number; x1: number; y1: number },
  isSeed: Uint8Array,
  cap: number,
  passable?: Uint8Array,
): Uint8Array {
  const dist = new Uint8Array(isSeed.length);
  dist.fill(DIST_UNREACHED);
  const q = new Int32Array((bbox.x1 - bbox.x0 + 1) * (bbox.y1 - bbox.y0 + 1));
  let qh = 0;
  let qt = 0;
  for (let y = bbox.y0; y <= bbox.y1; y++) {
    for (let x = bbox.x0; x <= bbox.x1; x++) {
      const i = y * dw + x;
      if (!isSeed[i]) continue;
      dist[i] = 0;
      q[qt++] = i;
    }
  }
  while (qh < qt) {
    const i = q[qh++]!;
    const d = dist[i]!;
    if (d >= cap) continue;
    const x = i % dw;
    const y = (i / dw) | 0;
    for (let oy = -1; oy <= 1; oy++) {
      const ny = y + oy;
      if (ny < bbox.y0 || ny > bbox.y1) continue;
      for (let ox = -1; ox <= 1; ox++) {
        const nx = x + ox;
        if (nx < bbox.x0 || nx > bbox.x1) continue;
        const ni = ny * dw + nx;
        if (dist[ni]! <= d + 1) continue;
        if (passable && !passable[ni]) continue;
        dist[ni] = d + 1;
        q[qt++] = ni;
      }
    }
  }
  return dist;
}

function distToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const vx = bx - ax;
  const vy = by - ay;
  const len2 = vx * vx + vy * vy;
  const t = len2 > 0 ? Math.min(1, Math.max(0, ((px - ax) * vx + (py - ay) * vy) / len2)) : 0;
  return Math.hypot(px - (ax + vx * t), py - (ay + vy * t));
}

/** Point in (or within margin of) a triangle, all in the same units. */
function nearTriangle(
  px: number,
  py: number,
  t: ReadonlyArray<readonly [number, number]>,
  margin: number,
): boolean {
  const [a, b, c] = t as [readonly [number, number], readonly [number, number], readonly [number, number]];
  const s1 = (b[0] - a[0]) * (py - a[1]) - (b[1] - a[1]) * (px - a[0]);
  const s2 = (c[0] - b[0]) * (py - b[1]) - (c[1] - b[1]) * (px - b[0]);
  const s3 = (a[0] - c[0]) * (py - c[1]) - (a[1] - c[1]) * (px - c[0]);
  if ((s1 >= 0 && s2 >= 0 && s3 >= 0) || (s1 <= 0 && s2 <= 0 && s3 <= 0)) return true;
  return (
    distToSegment(px, py, a[0], a[1], b[0], b[1]) <= margin ||
    distToSegment(px, py, b[0], b[1], c[0], c[1]) <= margin ||
    distToSegment(px, py, c[0], c[1], a[0], a[1]) <= margin
  );
}

/** Collage at reveal resolution, same draw as buildRevealBuffer (pre-clip). */
function drawCollagePixels(
  collage: CanvasImageSource,
  dw: number,
  dh: number,
): ImageData {
  const c = document.createElement("canvas");
  c.width = dw;
  c.height = dh;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(collage, 0, 0, dw, dh);
  return ctx.getImageData(0, 0, dw, dh);
}

/**
 * Counter (A hole) edge repair + additive hole-bleed buffer, both confined to
 * the counter bbox and kept COUNTER_EXTERIOR_GUARD_TEXELS away from the
 * exterior.
 *
 * Reveal (mutated in place):
 * - Mark texels within COUNTER_EDGE_ZONE_TEXELS of the hole → opaque collage.
 * - Hole texels within SEAM_SHELF_TEXELS of the mark → opaque shelf (collage
 *   continuation, else nearest mark colour). Never sampled directly — the
 *   geom gate nulls hole texels — only feeds mark-edge bilinear.
 *
 * Allowance (returned): collage RGBA on hole texels that belong to a real
 * overlap (deeper than HOLE_BLEED_MIN_DEPTH_TEXELS, plus anything attached to
 * it), with the cusp wedge only where it touches such an overlap. Its shelf
 * into the mark copies the repaired reveal, so overlaps cross the path edge
 * with one continuous colour field. Seal + exterior stay empty.
 *
 * Does not modify geomMask, SYMBOL_PATH_D, or the Path2D reveal clip.
 */
function buildCounterBleed(
  geomMask: Uint8Array,
  dw: number,
  dh: number,
  collagePx: ImageData,
  classified: HoleClassification,
  reveal: Uint8ClampedArray,
): ImageData {
  const { exterior, sealFootprint, holeMask } = classified;
  const col = collagePx.data;
  const allowance = new ImageData(dw, dh);
  const out = allowance.data;
  const n = dw * dh;

  let minX = dw;
  let minY = dh;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < dh; y++) {
    const row = y * dw;
    for (let x = 0; x < dw; x++) {
      if (!holeMask[row + x]) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return allowance;
  const margin = COUNTER_EXTERIOR_GUARD_TEXELS + COUNTER_EDGE_ZONE_TEXELS + 4;
  const bbox = {
    x0: Math.max(0, minX - margin),
    y0: Math.max(0, minY - margin),
    x1: Math.min(dw - 1, maxX + margin),
    y1: Math.min(dh - 1, maxY + margin),
  };

  const mark = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (geomMask[i]! >= 128) mark[i] = 1;

  const distHole = bfsDistanceCapped(dw, bbox, holeMask, COUNTER_EDGE_ZONE_TEXELS);
  const distExt = bfsDistanceCapped(dw, bbox, exterior, COUNTER_EXTERIOR_GUARD_TEXELS);
  const distMark = bfsDistanceCapped(
    dw,
    bbox,
    mark,
    Math.max(HOLE_BLEED_MIN_DEPTH_TEXELS + 1, SEAM_SHELF_TEXELS),
  );

  // --- Reveal: opaque mark edge + opaque hole-side shelf -------------------
  const resolved = new Uint8Array(n);
  const pending: number[] = [];
  for (let y = bbox.y0; y <= bbox.y1; y++) {
    for (let x = bbox.x0; x <= bbox.x1; x++) {
      const i = y * dw + x;
      if (sealFootprint[i]) continue;
      if (distExt[i]! <= COUNTER_EXTERIOR_GUARD_TEXELS) continue;
      const markZone = mark[i] && distHole[i]! <= COUNTER_EDGE_ZONE_TEXELS;
      const holeShelf = holeMask[i] && distMark[i]! <= SEAM_SHELF_TEXELS;
      const p = i * 4;
      if (!markZone && !holeShelf) {
        if (reveal[p + 3] === 255) resolved[i] = 1;
        continue;
      }
      if (col[p + 3]! >= ALPHA_SOLID) {
        reveal[p] = col[p]!;
        reveal[p + 1] = col[p + 1]!;
        reveal[p + 2] = col[p + 2]!;
        reveal[p + 3] = 255;
        resolved[i] = 1;
      } else {
        pending.push(i);
      }
    }
  }
  for (let pass = 0; pass < COUNTER_EDGE_ZONE_TEXELS + SEAM_SHELF_TEXELS + 2 && pending.length; pass++) {
    const filled: Array<[number, number, number, number]> = [];
    for (let k = pending.length - 1; k >= 0; k--) {
      const i = pending[k]!;
      const x = i % dw;
      const y = (i / dw) | 0;
      let r = 0;
      let g = 0;
      let b = 0;
      let c = 0;
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          if (ox === 0 && oy === 0) continue;
          const nx = x + ox;
          const ny = y + oy;
          if (nx < 0 || ny < 0 || nx >= dw || ny >= dh) continue;
          const ni = ny * dw + nx;
          if (!resolved[ni]) continue;
          const np = ni * 4;
          r += reveal[np]!;
          g += reveal[np + 1]!;
          b += reveal[np + 2]!;
          c++;
        }
      }
      if (c === 0) continue;
      filled.push([i, r / c, g / c, b / c]);
      pending[k] = pending[pending.length - 1]!;
      pending.pop();
    }
    for (const [i, r, g, b] of filled) {
      const p = i * 4;
      reveal[p] = Math.round(r);
      reveal[p + 1] = Math.round(g);
      reveal[p + 2] = Math.round(b);
      reveal[p + 3] = 255;
      resolved[i] = 1;
    }
  }
  // Mark texels must be opaque even if no colour source was found nearby.
  for (const i of pending) {
    if (mark[i]) reveal[i * 4 + 3] = 255;
  }

  // --- Allowance: real overlaps only ---------------------------------------
  const sx = dw / SYMBOL_VIEWBOX_W;
  const sy = dh / SYMBOL_VIEWBOX_H;
  const pinchX = (CUSP_GAP_VB.x0 + CUSP_GAP_VB.x1) / 2;
  const tri = (pts: ReadonlyArray<readonly [number, number]>) =>
    pts.map(([vx, vy]) => [vx * sx, vy * sy] as const);
  const wedgeLeft = tri([
    [CUSP_GAP_VB.x0, CUSP_GAP_VB.y],
    [pinchX, CUSP_GAP_VB.y],
    [COUNTER_FOOT_LEFT_VB.x, COUNTER_FOOT_LEFT_VB.y],
  ]);
  const wedgeRight = tri([
    [pinchX, CUSP_GAP_VB.y],
    [CUSP_GAP_VB.x1, CUSP_GAP_VB.y],
    [COUNTER_FOOT_RIGHT_VB.x, COUNTER_FOOT_RIGHT_VB.y],
  ]);

  const base = new Uint8Array(n);
  const wedge = new Uint8Array(n);
  const open = new Uint8Array(n);
  const core = new Uint8Array(n);
  for (let y = bbox.y0; y <= bbox.y1; y++) {
    for (let x = bbox.x0; x <= bbox.x1; x++) {
      const i = y * dw + x;
      if (!holeMask[i] || sealFootprint[i] || exterior[i]) continue;
      const a = col[i * 4 + 3]!;
      if (a < 1) continue;
      base[i] = 1;
      const cx = x + 0.5;
      const cy = y + 0.5;
      if (
        nearTriangle(cx, cy, wedgeLeft, CUSP_STRIP_MARGIN_TEXELS) ||
        nearTriangle(cx, cy, wedgeRight, CUSP_STRIP_MARGIN_TEXELS)
      ) {
        wedge[i] = 1;
        continue;
      }
      open[i] = 1;
      if (a >= HOLE_BLEED_CORE_ALPHA && distMark[i]! > HOLE_BLEED_MIN_DEPTH_TEXELS) {
        core[i] = 1;
      }
    }
  }
  const openDist = bfsDistanceCapped(dw, bbox, core, HOLE_BLEED_MIN_DEPTH_TEXELS + 2, open);
  const openAllow = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (openDist[i] !== DIST_UNREACHED) openAllow[i] = 1;
  const wedgeReach =
    Math.ceil(((CUSP_GAP_VB.x1 - CUSP_GAP_VB.x0) / 2) * sx) + CUSP_STRIP_MARGIN_TEXELS + 2;
  const wedgeDist = bfsDistanceCapped(dw, bbox, openAllow, wedgeReach, wedge);

  const allow = new Uint8Array(n);
  for (let y = bbox.y0; y <= bbox.y1; y++) {
    for (let x = bbox.x0; x <= bbox.x1; x++) {
      const i = y * dw + x;
      if (!base[i]) continue;
      if (!openAllow[i] && wedgeDist[i] === DIST_UNREACHED) continue;
      allow[i] = 1;
      const p = i * 4;
      out[p] = col[p]!;
      out[p + 1] = col[p + 1]!;
      out[p + 2] = col[p + 2]!;
      out[p + 3] = col[p + 3]!;
    }
  }

  // Shelf into the mark: same pixels as the repaired reveal.
  const shelfDist = bfsDistanceCapped(dw, bbox, allow, SEAM_SHELF_TEXELS, mark);
  for (let y = bbox.y0; y <= bbox.y1; y++) {
    for (let x = bbox.x0; x <= bbox.x1; x++) {
      const i = y * dw + x;
      if (!mark[i] || shelfDist[i] === DIST_UNREACHED) continue;
      if (sealFootprint[i] || exterior[i]) continue;
      const p = i * 4;
      if (reveal[p + 3]! < 1) continue;
      out[p] = reveal[p]!;
      out[p + 1] = reveal[p + 1]!;
      out[p + 2] = reveal[p + 2]!;
      out[p + 3] = 255;
    }
  }
  return allowance;
}

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

/** Sub-pixel holds skip the blit. Kept well under the follow step so the ease can finish. */
const HOLD_PX = 0.02;

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
  const outer = lensR;
  const inner = lensR * 0.9;

  // Glass edge wash stays inside the circle so it cannot halo past the rim.
  const ring = ctx.createRadialGradient(lx, ly, inner, lx, ly, outer);
  ring.addColorStop(0, "rgba(255,255,255,0)");
  ring.addColorStop(0.62, "rgba(255,255,255,0.1)");
  ring.addColorStop(1, "rgba(255,255,255,0)");
  ctx.save();
  ctx.beginPath();
  ctx.arc(lx, ly, lensR, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = ring;
  ctx.fill();
  ctx.restore();

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

  // Reflective rim: bright where it faces the light (lower-left), dark opposite.
  // Replaces the flat white+black hairlines, which stacked into a gray ring.
  const highlight = Math.PI * 0.75;
  const rimWidth = Math.max(1.35, lensR * 0.014);
  ctx.lineWidth = rimWidth;
  ctx.lineJoin = "round";
  if (typeof ctx.createConicGradient === "function") {
    const rim = ctx.createConicGradient(highlight, lx, ly);
    rim.addColorStop(0, "rgba(255,255,255,0.92)");
    rim.addColorStop(0.08, "rgba(255,255,255,0.5)");
    rim.addColorStop(0.18, "rgba(255,255,255,0.12)");
    rim.addColorStop(0.36, "rgba(255,255,255,0.02)");
    rim.addColorStop(0.5, "rgba(0,0,0,0.4)");
    rim.addColorStop(0.64, "rgba(255,255,255,0.02)");
    rim.addColorStop(0.82, "rgba(255,255,255,0.14)");
    rim.addColorStop(0.92, "rgba(255,255,255,0.55)");
    rim.addColorStop(1, "rgba(255,255,255,0.92)");
    ctx.strokeStyle = rim;
  } else {
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
  }
  ctx.beginPath();
  ctx.arc(lx, ly, lensR, 0, Math.PI * 2);
  ctx.stroke();
}

function loadCollageImage(): Promise<HTMLImageElement> {
  const img = new Image();
  img.decoding = "async";
  img.src = COLLAGE_SRC;
  // decode() resolves only once the bitmap is safe to drawImage. onload can
  // fire earlier under decoding:"async", which paints an empty reveal.
  return img.decode().then(() => img).catch((err: unknown) => {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to load collage: ${COLLAGE_SRC} (${reason})`);
  });
}

export function createAboutLensEngine(canvas: HTMLCanvasElement): AboutLensEngine {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    throw new Error("2d context unavailable");
  }

  let dpr = 1;
  let cssW = 0;
  let cssH = 0;
  let cache: Cache | null = null;
  let path2d: Path2D | null = null;
  let collage: HTMLImageElement | null = null;
  let destroyed = false;
  let lastActive = false;
  let lastLx = 0;
  let lastLy = 0;
  /** Last circle composited onto the hero canvas. NaN after a full clear. */
  let paintedLx = Number.NaN;
  let paintedLy = Number.NaN;
  let cacheStamp = 0;
  let loupeGl: LoupeGl | null = null;
  let loupeGlFailed = false;
  let glassHost: HTMLElement | null = null;
  let glassKey = "";

  const ensurePath = () => {
    if (!path2d) path2d = new Path2D(SYMBOL_PATH_D);
    return path2d;
  };

  const rebuildCache = () => {
    if (cssW < 8 || cssH < 8 || !collage) {
      cache = null;
      return;
    }

    try {
      rebuildCacheFromCollage();
    } catch (err) {
      console.error("[about-lens] cache rebuild failed", err);
      cache = null;
    }
  };

  const rebuildCacheFromCollage = () => {
    if (!collage) return;

    const path = ensurePath();
    // Large symbol (still above About hero's 48vmin/28rem), dialed back 30%
    // from the near-fullscreen fit so the loupe has breathing room.
    const {scale, logoW, logoH, logoX, logoY} = logoFit(cssW, cssH);

    const scaled = new Path2D();
    const m = new DOMMatrix().translate(logoX, logoY).scale(scale);
    scaled.addPath(path, m);

    const revealW = Math.max(1, Math.round(logoW * dpr * REVEAL_SUPER));
    const revealH = Math.max(1, Math.round(logoH * dpr * REVEAL_SUPER));
    const geomMask = buildGeomEdgeMaps(
      scaled,
      logoX,
      logoY,
      logoW,
      logoH,
      revealW,
      revealH,
    );
    const holeClassified = classifyHoleCavity(geomMask, revealW, revealH);
    const { canvas: reveal, data: revealData } = buildRevealBuffer(
      scaled,
      logoX,
      logoY,
      logoW,
      logoH,
      revealW,
      revealH,
      collage,
      holeClassified.holeMask,
    );
    const holeAllowanceData = buildCounterBleed(
      geomMask,
      revealW,
      revealH,
      drawCollagePixels(collage, revealW, revealH),
      holeClassified,
      revealData.data,
    );
    reveal.getContext("2d")!.putImageData(revealData, 0, 0);

    cache = {
      logoX,
      logoY,
      logoW,
      logoH,
      path2d: scaled,
      reveal,
      revealData,
      revealDw: revealW,
      revealDh: revealH,
      geomMask,
      holeAllowanceData,
    };
    cacheStamp += 1;
  };

  const clear = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paintedLx = Number.NaN;
    paintedLy = Number.NaN;
  };

  /** Device-pixel box covering the disc plus the rim stroke. */
  const clearDisc = (lx: number, ly: number, lensR: number) => {
    const pad = Math.max(4, lensR * 0.03);
    const r = lensR + pad;
    ctx.clearRect((lx - r) * dpr, (ly - r) * dpr, r * 2 * dpr, r * 2 * dpr);
  };

  const glassPadCss = (logoW: number) => (logoW * GLASS_PAD_VB) / SYMBOL_VIEWBOX_W;

  const syncGlass = (hole: {x: number; y: number; r: number} | null) => {
    const host = glassHost;
    if (!host) return;
    if (!cache) {
      host.replaceChildren();
      glassKey = "";
      return;
    }
    const {logoX, logoY, logoW, logoH} = cache;
    const pad = glassPadCss(logoW);
    const key = `${logoW.toFixed(2)}x${logoH.toFixed(2)}`;
    host.style.left = `${logoX - pad}px`;
    host.style.top = `${logoY - pad}px`;
    host.style.width = `${logoW + pad * 2}px`;
    host.style.height = `${logoH + pad * 2}px`;
    if (glassKey !== key) {
      glassKey = key;
      host.innerHTML = buildGlassMarkSvg();
    }
    if (!hole) {
      host.style.maskImage = "";
      host.style.setProperty("-webkit-mask-image", "");
      return;
    }
    const cx = hole.x - (logoX - pad);
    const cy = hole.y - (logoY - pad);
    const mask = `radial-gradient(circle ${hole.r}px at ${cx}px ${cy}px, transparent ${Math.max(0, hole.r - 1)}px, #000 ${hole.r + 1}px)`;
    host.style.maskImage = mask;
    host.style.setProperty("-webkit-mask-image", mask);
  };

  const drawIdle = () => {
    if (!cache) return;
    clear();
    syncGlass(null);
  };

  const drawActive = (lx: number, ly: number) => {
    if (!cache) return;
    const { logoW } = cache;
    const lensR = lensRadiusCss(logoW);
    const blitPx = lensDiscDiameterPx(lensR, dpr);
    // Cap warp raster; blit still fills the full device-pixel disc.
    let workPx = Math.min(blitPx, MAX_LOUPE_WORK_PX);
    if (workPx % 2 !== 0) workPx -= 1;
    workPx = Math.max(2, workPx);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (Number.isFinite(paintedLx)) clearDisc(paintedLx, paintedLy, lensR);
    clearDisc(lx, ly, lensR);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    syncGlass({x: lx, y: ly, r: lensR});
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    let usedGpu = false;
    if (!loupeGlFailed) {
      try {
        if (!loupeGl) loupeGl = createLoupeGl();
        loupeGl.sync({
          reveal: cache.reveal,
          hole: cache.holeAllowanceData.data,
          geom: cache.geomMask,
          dw: cache.revealDw,
          dh: cache.revealDh,
          stamp: cacheStamp,
        });
        const discCss = workPx / ((workPx / blitPx) * dpr);
        loupeGl.draw({
          size: workPx,
          dpr: (workPx / blitPx) * dpr,
          lensR,
          originX: lx - discCss / 2,
          originY: ly - discCss / 2,
          logoX: cache.logoX,
          logoY: cache.logoY,
          scaleX: cache.revealDw / cache.logoW,
          scaleY: cache.revealDh / cache.logoH,
          zoomCenter: ZOOM_CENTER,
          zoomEdge: ZOOM_EDGE,
          falloffExp: ZOOM_FALLOFF_EXP,
          displaceFrac: DISPLACE_FRAC,
          caFrac: CA_FRAC,
        });
        usedGpu = true;
      } catch (err) {
        console.warn('[about-lens] GPU loupe unavailable', err);
        loupeGlFailed = true;
        loupeGl?.destroy();
        loupeGl = null;
      }
    }

    if (usedGpu && loupeGl) {
      const cxDev = lx * dpr;
      const cyDev = ly * dpr;
      const rDev = blitPx / 2;
      // Hard clip at the circle. The rim blur reaches this boundary on purpose;
      // without the clip its smear would read as an outer halo.
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.beginPath();
      ctx.arc(cxDev, cyDev, rDev, 0, Math.PI * 2);
      ctx.clip();
      ctx.imageSmoothingEnabled = workPx < blitPx;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(loupeGl.canvas, cxDev - rDev, cyDev - rDev, blitPx, blitPx);
      ctx.restore();
    }

    paintGlassOverlay(ctx, lx, ly, lensR);
    paintedLx = lx;
    paintedLy = ly;
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
      console.error("[about-lens]", err);
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
    setGlassHost(host) {
      glassHost = host;
      glassKey = "";
      if (lastActive && cache) syncGlass({x: lastLx, y: lastLy, r: lensRadiusCss(cache.logoW)});
      else syncGlass(null);
    },
    drawAt(lx, ly, active) {
      if (!active || !cache) {
        lastLx = lx;
        lastLy = ly;
        lastActive = active;
        drawIdle();
        return;
      }
      const step = Math.hypot(lx - lastLx, ly - lastLy);
      lastLx = lx;
      lastLy = ly;
      lastActive = true;
      if (
        step < HOLD_PX &&
        Number.isFinite(paintedLx) &&
        Math.hypot(lx - paintedLx, ly - paintedLy) < HOLD_PX
      ) {
        return;
      }
      drawActive(lx, ly);
    },
    destroy() {
      destroyed = true;
      cache = null;
      path2d = null;
      collage = null;
      if (glassHost) glassHost.replaceChildren();
      glassHost = null;
      glassKey = "";
      loupeGl?.destroy();
      loupeGl = null;
    },
    getDpr() {
      return dpr;
    },
  };
}
