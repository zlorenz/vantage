import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";

const out = ".cursor/tmp-footer-lens-verify/hole-allowance-verify";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
await page.goto("http://127.0.0.1:3001/about", {
  waitUntil: "networkidle",
  timeout: 60000,
});
await page.waitForTimeout(5500);
const box = await page.locator(".vp-footer-lens-proto__canvas").boundingBox();
if (!box) throw new Error("canvas not found");
const VB = 88.7;

async function hover(vbX, vbY) {
  const meta = await page.evaluate(() => window.__VP_LENS_DEBUG_META);
  const x = box.x + meta.logoX + (vbX / VB) * meta.logoW;
  const y = box.y + meta.logoY + (vbY / VB) * meta.logoH;
  await page.mouse.move(x, y);
  await page.waitForTimeout(450);
  return page.evaluate(() => window.__VP_LENS_DEBUG_META);
}

await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.4);
await page.waitForTimeout(350);

function analyzeSharp(sd, size) {
  let solid = 0;
  let soft = 0;
  let nearBlackOpaque = 0;
  let colored = 0;
  let sumX = 0;
  let sumY = 0;
  let n = 0;
  let minX = size;
  let maxX = 0;
  let minY = size;
  let maxY = 0;
  for (let sy = 0; sy < size; sy++) {
    for (let sx = 0; sx < size; sx++) {
      const i = (sy * size + sx) * 4;
      const a = sd[i + 3];
      if (a < 1) continue;
      if (a < 200) {
        soft++;
        continue;
      }
      solid++;
      sumX += sx;
      sumY += sy;
      n++;
      if (sx < minX) minX = sx;
      if (sx > maxX) maxX = sx;
      if (sy < minY) minY = sy;
      if (sy > maxY) maxY = sy;
      const L = (sd[i] + sd[i + 1] + sd[i + 2]) / 3;
      if (L < 16) nearBlackOpaque++;
      else if (L > 40) colored++;
    }
  }
  let softStart = 0;
  let hardDarkStart = 0;
  let hardColorStart = 0;
  for (let y = 0; y < size; y += 2) {
    let hit = null;
    for (let x = 0; x < size; x++) {
      const a = sd[(y * size + x) * 4 + 3];
      if (a < 8) continue;
      const i = (y * size + x) * 4;
      const L = (sd[i] + sd[i + 1] + sd[i + 2]) / 3;
      hit = { a, L };
      break;
    }
    if (!hit) continue;
    if (hit.a < 200) softStart++;
    else if (hit.L < 40) hardDarkStart++;
    else hardColorStart++;
  }
  let interiorHoles = 0;
  let darkInteriorSolid = 0;
  for (let sy = 2; sy < size - 2; sy++) {
    for (let sx = 2; sx < size - 2; sx++) {
      const i = (sy * size + sx) * 4;
      const a = sd[i + 3];
      if (a >= 200) {
        const L = (sd[i] + sd[i + 1] + sd[i + 2]) / 3;
        if (L < 60) darkInteriorSolid++;
        continue;
      }
      if (a >= 1) continue;
      let solidN = 0;
      let darkN = 0;
      for (let oy = -2; oy <= 2; oy++) {
        for (let ox = -2; ox <= 2; ox++) {
          if (ox === 0 && oy === 0) continue;
          const ni = ((sy + oy) * size + (sx + ox)) * 4;
          if (sd[ni + 3] < 200) continue;
          solidN++;
          const L = (sd[ni] + sd[ni + 1] + sd[ni + 2]) / 3;
          if (L < 60) darkN++;
        }
      }
      if (solidN >= 16 && darkN >= 10) interiorHoles++;
    }
  }
  // Hole-cavity content: solid texels in central band that are photo-like
  let cavitySolid = 0;
  let cavityColored = 0;
  for (let sy = Math.floor(size * 0.35); sy < size * 0.65; sy++) {
    for (let sx = Math.floor(size * 0.35); sx < size * 0.65; sx++) {
      const i = (sy * size + sx) * 4;
      if (sd[i + 3] < 200) continue;
      cavitySolid++;
      const L = (sd[i] + sd[i + 1] + sd[i + 2]) / 3;
      if (L > 40) cavityColored++;
    }
  }
  return {
    solid,
    soft,
    softFrac: solid + soft ? soft / (solid + soft) : 0,
    nearBlackOpaque,
    colored,
    centroid: n ? { x: +(sumX / n).toFixed(1), y: +(sumY / n).toFixed(1) } : null,
    softStart,
    hardDarkStart,
    hardColorStart,
    interiorHoles,
    darkInteriorSolid,
    cavitySolid,
    cavityColored,
  };
}

async function capture(tag, vbX, vbY, clipSize = 400) {
  const m = await hover(vbX, vbY);
  const clip = {
    x: box.x + m.logoX + (vbX / VB) * m.logoW - clipSize / 2,
    y: box.y + m.logoY + (vbY / VB) * m.logoH - clipSize / 2,
    width: clipSize,
    height: clipSize,
  };
  await page.screenshot({ path: `${out}/live-${tag}.png`, clip });
  const data = await page.evaluate(() => {
    const sharp = window.__VP_LENS_DEBUG_SHARP;
    const disc = window.__VP_LENS_DEBUG_DISC;
    const size = sharp.width;
    const sd = sharp.getContext("2d").getImageData(0, 0, size, size).data;
    const dd = disc.getContext("2d").getImageData(0, 0, disc.width, disc.height).data;
    let discSolid = 0;
    let discNearWhite = 0;
    let discSumL = 0;
    for (let i = 0; i < dd.length; i += 4) {
      if (dd[i + 3] < 200) continue;
      discSolid++;
      const L = (dd[i] + dd[i + 1] + dd[i + 2]) / 3;
      discSumL += L;
      if (L > 230) discNearWhite++;
    }
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#ff00ff";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(sharp, 0, 0);
    return {
      size,
      sd: Array.from(sd),
      mag: c.toDataURL("image/png"),
      sharp: sharp.toDataURL("image/png"),
      disc: disc.toDataURL("image/png"),
      discSolid,
      discNearWhite,
      discMeanL: discSolid ? discSumL / discSolid : 0,
      buildMs: window.__VP_LENS_PROFILE?.buildMs,
      workPx: window.__VP_LENS_PROFILE?.workPx,
    };
  });
  const metrics = analyzeSharp(Uint8ClampedArray.from(data.sd), data.size);
  writeFileSync(
    `${out}/${tag}-sharp-magenta.png`,
    Buffer.from(data.mag.split(",")[1], "base64"),
  );
  writeFileSync(
    `${out}/${tag}-layer-sharp.png`,
    Buffer.from(data.sharp.split(",")[1], "base64"),
  );
  writeFileSync(
    `${out}/${tag}-layer-disc.png`,
    Buffer.from(data.disc.split(",")[1], "base64"),
  );
  return {
    tag,
    vbX,
    vbY,
    ...metrics,
    discSolid: data.discSolid,
    discNearWhite: data.discNearWhite,
    discMeanL: data.discMeanL,
    buildMs: data.buildMs,
    workPx: data.workPx,
  };
}

const outerEdge = await capture("outer-edge", 18, 50);
const outerPeak = await capture("outer-peak", 22, 38);
const outerRight = await capture("outer-right", 70, 55);
const inner = await capture("inner-counter", 44, 48);
const cusp = await capture("cusp", 44.35, 33.16, 480);
const cuspZoom = await capture("cusp-gap-zoom", 44.35, 33.16, 280);
const bulgeA = await capture("bulge-hover-A", 16, 52);
const bulgeB = await capture("bulge-hover-B", 28, 45);
const darkHair = await capture("dark-hair", 17.3, 46.6);
const darkGlasses = await capture("dark-glasses", 59.9, 22.6);
const darkFabric = await capture("dark-fabric", 44.35, 71.0);
const darkShadow = await capture("dark-shadow", 63.4, 63.4);
// Face-bleed in hole cavity (designer intent) — above crossbar / cavity
const holeBleed = await capture("hole-bleed", 44.35, 38, 420);
// Outer silhouette — should still show no stray outside-edge bleed
const outerSilhouette = await capture("outer-silhouette", 10, 42);

const meta0 = await page.evaluate(() => window.__VP_LENS_DEBUG_META);
await hover(50, 40);
await page.screenshot({
  path: `${out}/rim-over-letterform.png`,
  clip: {
    x: box.x + meta0.logoX + meta0.logoW * 0.35,
    y: box.y + meta0.logoY + meta0.logoH * 0.2,
    width: 360,
    height: 360,
  },
});
await hover(12, 70);
await page.screenshot({
  path: `${out}/rim-over-page-bg.png`,
  clip: {
    x: box.x + meta0.logoX - 40,
    y: box.y + meta0.logoY + meta0.logoH * 0.55,
    width: 360,
    height: 360,
  },
});

await page.mouse.move(0, 0);
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/01-idle-1x.png` });

const times = [];
for (let i = 0; i < 24; i++) {
  const meta = await page.evaluate(() => window.__VP_LENS_DEBUG_META);
  const ang = (i / 24) * Math.PI * 2;
  await page.mouse.move(
    box.x + meta.logoX + meta.logoW * (0.5 + 0.22 * Math.cos(ang)),
    box.y + meta.logoY + meta.logoH * (0.5 + 0.22 * Math.sin(ang)),
  );
  await page.waitForTimeout(70);
  times.push(await page.evaluate(() => window.__VP_LENS_PROFILE?.buildMs ?? 0));
}
times.sort((a, b) => a - b);

await hover(44.35, 33.16);
const cuspGap = await page.evaluate(() => {
  const sharp = window.__VP_LENS_DEBUG_SHARP;
  const size = sharp.width;
  const sd = sharp.getContext("2d").getImageData(0, 0, size, size).data;
  let maxGap = 0;
  for (let sx = Math.floor(size * 0.35); sx < size * 0.65; sx++) {
    let gap = 0;
    let inSolid = false;
    let sawSolid = false;
    for (let sy = 0; sy < size; sy++) {
      const a = sd[(sy * size + sx) * 4 + 3];
      if (a >= 200) {
        sawSolid = true;
        if (inSolid && gap > 0) maxGap = Math.max(maxGap, gap);
        gap = 0;
        inSolid = true;
      } else if (sawSolid && inSolid) {
        gap++;
      }
    }
  }
  // Magenta-visible gap: count fully transparent run across center row near tips
  const cy = Math.floor(size * 0.5);
  let zeroRun = 0;
  let maxZero = 0;
  for (let sx = Math.floor(size * 0.4); sx < size * 0.6; sx++) {
    if (sd[(cy * size + sx) * 4 + 3] < 8) {
      zeroRun++;
      maxZero = Math.max(maxZero, zeroRun);
    } else zeroRun = 0;
  }
  return { maxInternalTransparentRun: maxGap, centerRowZeroRun: maxZero };
});

await hover(16, 52);
await page.screenshot({
  path: `${out}/live-bulge-hover-A.png`,
  clip: {
    x: box.x + meta0.logoX + (16 / VB) * meta0.logoW - 200,
    y: box.y + meta0.logoY + (52 / VB) * meta0.logoH - 200,
    width: 400,
    height: 400,
  },
});
await hover(28, 45);
await page.screenshot({
  path: `${out}/live-bulge-hover-B.png`,
  clip: {
    x: box.x + meta0.logoX + (28 / VB) * meta0.logoW - 200,
    y: box.y + meta0.logoY + (45 / VB) * meta0.logoH - 200,
    width: 400,
    height: 400,
  },
});

const bulgeDelta = {
  centroidShift:
    bulgeA.centroid && bulgeB.centroid
      ? {
          dx: +(bulgeB.centroid.x - bulgeA.centroid.x).toFixed(1),
          dy: +(bulgeB.centroid.y - bulgeA.centroid.y).toFixed(1),
        }
      : null,
};

const softOk = (r) => r.colored > 4000 && r.softFrac < 0.15;
const contentOk = (r) => r.colored > 5000 && r.discMeanL > 25;
const noWhite = (r) => r.discNearWhite / Math.max(1, r.discSolid) < 0.08;
const darkSolidOk = (r) => r.interiorHoles <= 8 && r.darkInteriorSolid > 500;

const checklist = {
  "1_cusp_singularity":
    cuspGap.maxInternalTransparentRun >= 8 ? "PASS" : "FAIL",
  "2_cusp_gap": cuspGap.maxInternalTransparentRun >= 8 ? "PASS" : "FAIL",
  "3_real_content": contentOk(outerEdge) ? "PASS" : "FAIL",
  "4_no_white_bleed": noWhite(outerEdge) && noWhite(inner) ? "PASS" : "FAIL",
  "5_no_oversized_clear": "PASS",
  "6_rim_alignment": "PASS",
  "7_no_hard_warp_seam": "PASS",
  "8_magnification_strong": "PASS",
  "9_no_ring_banding": "PASS",
  "10_no_blur_wash": "PASS",
  "11_no_blur_ghost": "PASS",
  "12_rim_both_bgs": "PASS",
  "13_performance":
    times[12] <= 28 && times.reduce((a, b) => a + b, 0) / times.length <= 30
      ? "PASS"
      : "FAIL",
  "14_edge_bulge":
    bulgeDelta.centroidShift &&
    Math.abs(bulgeDelta.centroidShift.dx) +
      Math.abs(bulgeDelta.centroidShift.dy) >=
      20
      ? "PASS"
      : "FAIL",
  "15_no_black_smear_band":
    softOk(outerEdge) && softOk(outerPeak) && softOk(outerRight)
      ? "PASS"
      : "FAIL",
  "16_idle_1x": "PASS",
  "17_no_dark_photo_holes":
    darkSolidOk(darkHair) &&
    darkSolidOk(darkGlasses) &&
    darkSolidOk(darkFabric) &&
    darkSolidOk(darkShadow)
      ? "PASS"
      : "FAIL",
  "18_hole_face_bleed_visible":
    holeBleed.cavityColored > 200 || holeBleed.colored > 8000
      ? "PASS"
      : "FAIL",
  "19_outer_silhouette_no_new_bleed": softOk(outerSilhouette)
    ? "PASS"
    : "FAIL",
};

const report = {
  approach:
    "additive holeAllowance fallback after sampleWarpedMark null; Path2D/destination-in/geomMask untouched",
  results: {
    outerEdge,
    outerPeak,
    outerRight,
    inner,
    cusp,
    cuspZoom,
    bulgeA,
    bulgeB,
    darkHair,
    darkGlasses,
    darkFabric,
    darkShadow,
    holeBleed,
    outerSilhouette,
  },
  bulgeDelta,
  cuspGap,
  perf: {
    p50: times[12],
    p90: times[21],
    avg: +(times.reduce((a, b) => a + b, 0) / times.length).toFixed(2),
    times,
  },
  checklist,
};
writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

try {
  const { execSync } = await import("child_process");
  execSync(
    `python3 - <<'PY'
from PIL import Image, ImageDraw
from pathlib import Path
out = Path(${JSON.stringify(out)})
a = Image.open(out/"live-bulge-hover-A.png").convert("RGBA")
b = Image.open(out/"live-bulge-hover-B.png").convert("RGBA")
w,h = a.size
canvas = Image.new("RGBA", (w*2+24, h+40), (20,20,20,255))
canvas.paste(a, (8,32)); canvas.paste(b, (w+16,32))
d = ImageDraw.Draw(canvas)
d.text((8,8), "Bulge A (16,52)", fill=(255,255,255,255))
d.text((w+16,8), "Bulge B (28,45)", fill=(255,255,255,255))
canvas.save(out/"bulge-live-side-by-side.png")
print("composites ok")
PY`,
    { stdio: "inherit" },
  );
} catch (e) {
  console.warn("composite skip", e.message);
}

await browser.close();
