/**
 * One-off: patch homepage hero + recent-work Chinese display titles to match live.
 *
 *   npx tsx scripts/migration/patch/homepage-display-titles-zh.ts
 */

import { portfolioId } from '../lib/ids';
import { patchSet } from '../lib/sanity-client';

/**
 * Values sourced from vantage.pictures/zh/ carousel + portfolio pages (2026-07).
 * Preserves <span> / <br> structure used by EN ACF display fields.
 */
const PATCHES: Record<
  number,
  { headerTitleZh?: string; thumbTitleZh?: string; longTitleZh?: string }
> = {
  // Hero slide 1 + recent card
  4449: {
    headerTitleZh: '库犸科技 <span> 路霸 3 AWD </span>',
    thumbTitleZh: '库犸科技<br>路霸 3 AWD',
    longTitleZh: '库犸科技 <span> 路霸 3 AWD </span>',
  },
  // Hero slide 2 + recent card
  4453: {
    headerTitleZh: 'BRINC <span> 卫报 </span>',
    thumbTitleZh: 'BRINC<br>卫报',
    longTitleZh: 'BRINC 卫报 <span> 下一代响应 </span>',
  },
  // Hero slide 3 + recent card
  3519: {
    headerTitleZh: 'Govee <span> 万圣节 </span>',
    thumbTitleZh: 'Govee<br>万圣节',
  },
  // Hero slide 4 + recent card (already partially translated)
  3524: {
    headerTitleZh: '真我 <span> 15 系列 5G </span>',
    thumbTitleZh: '真我 15 系列 5G',
  },
  // Hero slide 5
  3276: {
    headerTitleZh: '真我 <span> 13+ 5G </span>',
    thumbTitleZh: '真我 13+ 5G',
  },
  // Hero slide 6
  3239: {
    headerTitleZh: '悦榕庄 <span> 更多发现 </span>',
    thumbTitleZh: '悦榕庄',
    longTitleZh: '悦榕庄 <span> 更多发现 </span>',
  },
  // Recent-work only
  3619: {
    thumbTitleZh: '库犸科技<br>YUKA Mini 2',
    headerTitleZh: '库犸科技 <span> YUKA Mini 2 </span>',
    longTitleZh: '库犸科技 <span> YUKA Mini 2 </span>',
  },
  3618: {
    thumbTitleZh: '比特<br>GetAgent',
    headerTitleZh: '比特 <span> GetAgent </span>',
    longTitleZh: '比特 GetAgent ft.Julián Álvarez',
  },
  3523: {
    thumbTitleZh: 'Govee<br>户外照明',
    headerTitleZh: 'Govee <span> 永久户外灯 </span>',
    longTitleZh: 'Govee 永久户外灯',
  },
  3518: {
    thumbTitleZh: '拓竹<br>Vortek',
    headerTitleZh: '拓竹 <span> Vortek </span>',
    longTitleZh: '拓竹 Vortek',
  },
  3612: {
    thumbTitleZh: '真我 C85',
  },
};

async function main() {
  let patched = 0;
  for (const [wpIdRaw, fields] of Object.entries(PATCHES)) {
    const wpId = Number(wpIdRaw);
    await patchSet(portfolioId(wpId), fields);
    patched += 1;
    console.log(`Patched portfolio-${wpId}:`, Object.keys(fields).join(', '));
  }
  console.log(`Done — ${patched} portfolio entries updated.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
