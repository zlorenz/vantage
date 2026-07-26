/**
 * Fill missing portfolio ZH display fields + additionalVideos from TranslatePress.
 * Brand-only titles without a TRP hit keep EN (clears missing_zh → info).
 *
 * Targets structured parts (displayTitleParts.*Zh, heroFilmTitleZh, videoTitleZh).
 *
 *   npx tsx scripts/migration/patch/portfolio-zh-from-trp.ts
 *
 * Requires local WP/TRP DB (MAMP). Re-run: npm run migrate:audit:portfolio-zh
 */

import { getWriteClient, patchSet } from '../lib/sanity-client';
import { translateEnhanced } from '../lib/translatepress';
import { htmlToPlainText } from '../lib/translation-text';

interface AdditionalVideo {
  vimeoUrl?: string;
  xinpianchangUrl?: string;
  videoTitle?: string;
  videoTitleZh?: string;
  description?: string;
  descriptionZh?: string;
}

interface DisplayTitleParts {
  brandName?: string;
  productName?: string;
  campaignTitle?: string;
  brandNameZh?: string;
  productNameZh?: string;
  campaignTitleZh?: string;
}

interface PortfolioDoc {
  _id: string;
  slug: string;
  title?: string;
  titleZh?: string;
  displayTitleParts?: DisplayTitleParts;
  heroFilmTitle?: string;
  heroFilmTitleZh?: string;
  description?: string;
  descriptionZh?: string;
  additionalVideos?: AdditionalVideo[];
}

/** Slug+field curated overrides (beat bad/missing TRP). Plain text for part fields. */
const CURATED: Record<string, Record<string, string>> = {
  'braun-x-dji': {
    'displayTitleParts.campaignTitleZh': '敢于与众不同',
  },
  'banyan-tree-theres-more-to-discovery': {
    titleZh: '悦榕庄 – 发现更多',
  },
  'bitget-elite-traders': {
    'displayTitleParts.campaignTitleZh': '精英交易员',
    heroFilmTitleZh: 'Matthew (AlphanumetriX)',
  },
  'bidv-smartbanking-hoa-nhi%cc%a3p-so%cc%82ng-tho%cc%82ng-minh': {
    'displayTitleParts.campaignTitleZh': '与智慧生活同频',
  },
  'vinamilk-probi-e%cc%82m-ruo%cc%a3%cc%82t-nuo%cc%a3%cc%82t-do%cc%9bi': {
    'displayTitleParts.campaignTitleZh': '肠胃舒适，一生顺畅',
  },
  'govee-lit-by-govee': {
    'displayTitleParts.campaignTitleZh': '闪耀由 Govee 点亮',
  },
  'indelb-go20': {
    titleZh: 'IndelB ICECO Go20 – 拥有不一样的夏天！',
  },
  'elewana-collection-loisaba-conservancy-safari': {
    titleZh: 'Elewana Collection - Loisaba 保护区 safari',
  },
  'valerion-visionmaster-max-hollywood-grade-home-cinema-experience': {
    titleZh: 'Valerion VisionMaster Max - 好莱坞级家庭影院体验',
  },
  'mammotion-luba-mini-awd-compact-powerful-ready-to-conquer-your-lawn': {
    titleZh: 'Mammotion LUBA Mini AWD – 小巧强劲，征服你的草坪',
  },
  'mammotion-let-luba-2-do-it': {
    'displayTitleParts.campaignTitleZh': '让 LUBA 2 来做',
  },
  'mammotion-luba-automated-robot-lawn-mower': {
    'displayTitleParts.campaignTitleZh': '自动割草机器人',
  },
  'roborock-s8': {
    'displayTitleParts.campaignTitleZh': '忘掉清洁吧，真的',
  },
  'ecoflow-river-600-customizable-backup-power': {
    'displayTitleParts.campaignTitleZh': '可定制的备用电源',
  },
  'dji-introducing-phantom-4-pro': {
    'displayTitleParts.campaignTitleZh': '介绍 Phantom 4 Pro',
  },
  'dji-introducing-zenmuse-x5-series': {
    'displayTitleParts.campaignTitleZh': '介绍 Zenmuse X5 系列',
  },
  'dji-introducing-flighthub': {
    'displayTitleParts.campaignTitleZh': '介绍 FlightHub',
  },
  'oppo-reno-6-pro-5g': {
    titleZh: 'OPPO Reno 6 Pro 5G',
  },
  'realme-c75-everything-proof': {
    'displayTitleParts.campaignTitleZh': '万无一失',
  },
  'oneplus-fast-smooth': {
    titleZh: '一加 10T – 快速流畅',
  },
  'realme-x7-fast-powerful': {
    titleZh: '真我 X7 – 快速强大',
    'displayTitleParts.campaignTitleZh': '快速强大',
  },
  'roborock-h7': {
    'displayTitleParts.campaignTitleZh': '出乎意料地轻巧',
  },
  'techcombank-inspire-why-not': {
    // Strip VN diacritics from proper name inside otherwise-good ZH
    descriptionZh:
      '生活是各种岔路口，每一次选择都将我们带向截然不同的旅程。是融入人群，还是全身心投入每一个瞬间？Why not一代的代表们毫不犹豫地选择了自己的答案。还有许多色彩斑斓的故事，是Techcombank与Thuy Tien一起在这部电影中寻找并记录下来的。这样，下次当身边的人或你自己质疑：为什么要做得不一样？为什么要去探索？为什么要与众不同？为什么要去冒险，走一条未知的道路？你就可以简单地回答：WHY NOT？',
  },
};

const BAD_GLOSS_RE = /城规银行/;

function plain(html: string | undefined | null): string {
  return (
    htmlToPlainText(String(html ?? '')) ||
    String(html ?? '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function hasCjk(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text);
}

function looksBrandOnly(text: string): boolean {
  const p = plain(text);
  if (!p || hasCjk(p)) return false;
  const words = p.match(/[A-Za-z0-9+]+/g) ?? [];
  // Pure product codes / short brand stacks only
  return (
    words.length <= 3 &&
    !/[.!?…]/.test(p) &&
    !/\b(Introducing|Dare|Forget|Enjoy|Custom|Automated|Ready|Compact|Powerful|Summer|Discovery|Experience|Proof|Lightweight|Campaign)\b/i.test(
      p,
    )
  );
}

function stripDescHtml(html: string): string {
  return html
    .replace(/<\/?p\b[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Translate a plain title part (no HTML wrappers). */
async function translatePlainPart(en: string): Promise<string | undefined> {
  const zh = await translateEnhanced(en);
  if (!zh || BAD_GLOSS_RE.test(zh)) return undefined;
  if (plain(zh) && plain(zh) !== plain(en)) return plain(zh) || zh;
  return undefined;
}

async function fillField(
  en: string | undefined,
  existingZh: string | undefined,
  curated?: string,
): Promise<string | undefined> {
  if (curated?.trim()) return curated;
  if (!plain(en)) return undefined;
  if (plain(existingZh)) return undefined; // already filled

  const fromTrp = await translatePlainPart(en!);
  if (fromTrp) return fromTrp;

  // Brand-only: copy EN so ZH page doesn't fall back oddly / audit missing_zh clears
  if (looksBrandOnly(en!)) return en;

  return undefined;
}

async function fillDescription(
  en: string | undefined,
  existingZh: string | undefined,
  curated?: string,
): Promise<string | undefined> {
  if (curated?.trim()) return curated;
  if (!plain(en)) return undefined;
  if (plain(existingZh)) return undefined;

  const stripped = stripDescHtml(en!);
  const zh = await translateEnhanced(stripped);
  if (zh && hasCjk(zh) && !BAD_GLOSS_RE.test(zh)) return stripDescHtml(zh);

  // No Chinese available — leave missing (don't copy long EN prose as ZH)
  return undefined;
}

async function main() {
  console.log('Portfolio ZH fill from TRP\n');
  // Warm dictionary once
  await translateEnhanced('Director');

  const client = getWriteClient();
  const docs = await client.fetch<PortfolioDoc[]>(`
    *[_type == "portfolioEntry"] | order(title asc) {
      _id,
      "slug": slug.current,
      title, titleZh,
      displayTitleParts{
        brandName,
        productName,
        campaignTitle,
        brandNameZh,
        productNameZh,
        campaignTitleZh
      },
      heroFilmTitle, heroFilmTitleZh,
      description, descriptionZh,
      additionalVideos
    }
  `);

  let patchedDocs = 0;
  let fieldWrites = 0;

  for (const doc of docs) {
    const curated = CURATED[doc.slug] ?? {};
    const set: Record<string, unknown> = {};
    const parts = doc.displayTitleParts ?? {};

    const titleFilled = await fillField(doc.title, doc.titleZh, curated.titleZh);
    if (titleFilled !== undefined) {
      set.titleZh = titleFilled;
      fieldWrites += 1;
    }

    const partPairs: Array<{
      enKey: keyof DisplayTitleParts;
      zhKey: keyof DisplayTitleParts;
      path: string;
    }> = [
      {
        enKey: 'brandName',
        zhKey: 'brandNameZh',
        path: 'displayTitleParts.brandNameZh',
      },
      {
        enKey: 'productName',
        zhKey: 'productNameZh',
        path: 'displayTitleParts.productNameZh',
      },
      {
        enKey: 'campaignTitle',
        zhKey: 'campaignTitleZh',
        path: 'displayTitleParts.campaignTitleZh',
      },
    ];

    for (const { enKey, zhKey, path } of partPairs) {
      const filled = await fillField(parts[enKey], parts[zhKey], curated[path]);
      if (filled !== undefined) {
        set[path] = filled;
        fieldWrites += 1;
      }
    }

    const heroFilled = await fillField(
      doc.heroFilmTitle,
      doc.heroFilmTitleZh,
      curated.heroFilmTitleZh,
    );
    if (heroFilled !== undefined) {
      set.heroFilmTitleZh = heroFilled;
      fieldWrites += 1;
    }

    // descriptionZh — always prefer curated / TRP; also overwrite if curated techcombank
    if (curated.descriptionZh) {
      set.descriptionZh = curated.descriptionZh;
      fieldWrites += 1;
    } else {
      const descZh = await fillDescription(doc.description, doc.descriptionZh);
      if (descZh !== undefined) {
        set.descriptionZh = descZh;
        fieldWrites += 1;
      }
    }

    if (doc.additionalVideos?.length) {
      let avChanged = false;
      const next = [];
      for (const video of doc.additionalVideos) {
        const row = { ...video };
        if (plain(video.videoTitle) && !plain(video.videoTitleZh)) {
          const t = await translatePlainPart(video.videoTitle!);
          if (t) {
            row.videoTitleZh = t;
            avChanged = true;
            fieldWrites += 1;
          } else if (looksBrandOnly(video.videoTitle!)) {
            row.videoTitleZh = plain(video.videoTitle!);
            avChanged = true;
            fieldWrites += 1;
          }
        }
        if (plain(video.description) && !plain(video.descriptionZh)) {
          const d = await fillDescription(video.description, video.descriptionZh);
          if (d) {
            row.descriptionZh = d;
            avChanged = true;
            fieldWrites += 1;
          }
        }
        next.push(row);
      }
      if (avChanged) set.additionalVideos = next;
    }

    if (!Object.keys(set).length) continue;

    await patchSet(doc._id, set);
    patchedDocs += 1;
    console.log(`Patched ${doc.slug}: ${Object.keys(set).join(', ')}`);
  }

  console.log(`\nDone. Docs patched: ${patchedDocs}, fields written: ${fieldWrites}`);
  console.log('Next: npm run migrate:audit:portfolio-zh');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
