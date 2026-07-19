/**
 * Batch-fill portfolio thumbTitleZh / headerTitleZh / longTitleZh from live ZH Work AJAX.
 * Also patches Work page heroTitleZh to match live.
 *
 * Parses per-card (avoids cross-card title bleed when class="vp-card__title translation-block").
 *
 *   npx tsx scripts/migration/patch/portfolio-display-titles-from-live.ts
 */

import path from 'node:path';
import { PATHS } from '../config';
import type { ExportedPortfolio } from '../export/portfolio';
import { readJson, writeJson } from '../lib/fs';
import { pageId, portfolioId } from '../lib/ids';
import { patchSet } from '../lib/sanity-client';

const LIVE_AJAX = 'https://vantage.pictures/wp-admin/admin-ajax.php';
const LIVE_WORK = 'https://vantage.pictures/zh/%E5%B7%A5%E4%BD%9C/';

type LiveCard = { slugEn: string; titleZhHtml: string; titleZhPlain: string };

function extractEnSlug(href: string): string | null {
  try {
    const url = new URL(href);
    const parts = url.pathname.split('/').filter(Boolean);
    const portfolioIdx = parts.findIndex(
      (p) => p === 'portfolio' || decodeURIComponent(p) === '投资组合',
    );
    if (portfolioIdx >= 0 && parts[portfolioIdx + 1]) {
      return decodeURIComponent(parts[portfolioIdx + 1]);
    }
    return parts.length ? decodeURIComponent(parts[parts.length - 1]) : null;
  } catch {
    return null;
  }
}

function formatThumbTitleZh(liveHtml: string, enThumb: string): string {
  const hasBr = /<br\s*\/?>/i.test(liveHtml) || /<br\s*\/?>/i.test(enThumb);
  // Prefer live HTML <br> if present; otherwise reconstruct from plain + EN structure
  if (/<br\s*\/?>/i.test(liveHtml)) {
    return liveHtml.replace(/\s+/g, ' ').replace(/>\s+/g, '>').replace(/\s+</g, '<').trim();
  }
  const plain = liveHtml
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (hasBr) {
    const parts = plain.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]}<br>${parts.slice(1).join(' ')}`;
    }
  }
  return plain;
}

function formatHeaderTitleZh(plain: string, enHeader: string): string {
  const zh = plain.trim().replace(/\s+/g, ' ');
  if (!zh) return zh;
  if (/<span\b/i.test(enHeader)) {
    const parts = zh.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]} <span> ${parts.slice(1).join(' ')} </span>`;
    }
  }
  return zh;
}

function parseCards(html: string): LiveCard[] {
  const cards: LiveCard[] = [];
  const chunks = html.split(/(?=<a class="vp-card)/);
  for (const chunk of chunks) {
    if (!chunk.includes('vp-card')) continue;
    const href = chunk.match(/href="([^"]+)"/)?.[1];
    // class may be "vp-card__title" or "vp-card__title translation-block"
    const titleHtml = chunk.match(
      /<div class="vp-card__title[^"]*">\s*([\s\S]*?)\s*<\/div>/,
    )?.[1];
    if (!href || titleHtml == null) continue;
    const slugEn = extractEnSlug(href);
    const titleZhPlain = titleHtml
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (slugEn && titleZhPlain) {
      cards.push({
        slugEn,
        titleZhHtml: titleHtml.trim(),
        titleZhPlain,
      });
    }
  }
  return cards;
}

async function fetchNonce(): Promise<string> {
  const res = await fetch(LIVE_WORK);
  const html = await res.text();
  const m = html.match(/"nonce"\s*:\s*"([a-f0-9]+)"/);
  if (!m) throw new Error('Could not find vpLoadMore nonce on live Work page');
  return m[1];
}

async function fetchLivePage(
  nonce: string,
  page: number,
): Promise<{ cards: LiveCard[]; hasMore: boolean; nextPage: number | null }> {
  const body = new URLSearchParams({
    action: 'vp_portfolio_load_more',
    nonce,
    page: String(page),
  });
  const res = await fetch(LIVE_AJAX, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Referer: LIVE_WORK,
      Cookie: 'trp_language=zh_CN',
    },
    body,
  });
  const json = (await res.json()) as {
    success?: boolean;
    data?: { html?: string; has_more?: boolean; next_page?: number };
  };
  const html = json.data?.html ?? '';
  return {
    cards: parseCards(html),
    hasMore: Boolean(json.data?.has_more),
    nextPage: json.data?.next_page ?? null,
  };
}

async function scrapeAllLiveCards(): Promise<Map<string, LiveCard>> {
  const nonce = await fetchNonce();
  const map = new Map<string, LiveCard>();
  let page = 1;

  for (let i = 0; i < 40; i++) {
    const { cards, hasMore, nextPage } = await fetchLivePage(nonce, page);
    if (!cards.length) {
      console.log(`Live page ${page}: empty — stop`);
      break;
    }
    for (const c of cards) {
      if (!map.has(c.slugEn)) map.set(c.slugEn, c);
    }
    console.log(
      `Live page ${page}: +${cards.length} cards (unique total ${map.size}) has_more=${hasMore} next=${nextPage}`,
    );
    if (!hasMore || !nextPage) break;
    page = nextPage;
    await new Promise((r) => setTimeout(r, 200));
  }
  return map;
}

async function main() {
  const portfolio = readJson<ExportedPortfolio[]>(
    path.join(PATHS.migrationData, 'portfolio.json'),
  );

  console.log('Scraping live Chinese Work grid…');
  const liveTitles = await scrapeAllLiveCards();
  console.log(`Scraped ${liveTitles.size} unique live titles`);

  // Sanity check known pairing that previously bled
  const hyundai = liveTitles.get('hyundai-progress-for-humanity');
  const zhiyun = liveTitles.get('zhiyun-smooth-q3');
  console.log('CHECK hyundai →', hyundai?.titleZhPlain);
  console.log('CHECK zhiyun-smooth-q3 →', zhiyun?.titleZhPlain);
  if (hyundai && /智云|顺滑/.test(hyundai.titleZhPlain)) {
    throw new Error('Parser still mis-pairs Hyundai with Zhiyun title — aborting');
  }

  const ourSlugs = new Set(portfolio.map((p) => p.slug));
  const liveOnly = [...liveTitles.keys()].filter((s) => !ourSlugs.has(s));
  if (liveOnly.length) {
    console.log(`Live-only slugs not in migration (${liveOnly.length}):`, liveOnly);
  }

  let patched = 0;
  let unchanged = 0;
  const stillMissing: string[] = [];

  for (const item of portfolio) {
    if (item.isHidden) continue;

    const live = liveTitles.get(item.slug);
    if (!live) {
      if (!item.thumbTitleZh) stillMissing.push(item.slug);
      continue;
    }

    const fields: Record<string, string> = {};
    const thumbZh = formatThumbTitleZh(live.titleZhHtml, item.thumbTitle);
    const headerZh = formatHeaderTitleZh(live.titleZhPlain, item.headerTitle);

    if (thumbZh && thumbZh !== item.thumbTitle) fields.thumbTitleZh = thumbZh;
    if (headerZh && headerZh !== item.headerTitle) fields.headerTitleZh = headerZh;
    if (headerZh && headerZh !== item.longTitle) {
      // Refresh longTitleZh from live card label when we have a good match
      fields.longTitleZh = headerZh;
    }

    const alreadySame =
      (!fields.thumbTitleZh || fields.thumbTitleZh === item.thumbTitleZh) &&
      (!fields.headerTitleZh || fields.headerTitleZh === item.headerTitleZh) &&
      (!fields.longTitleZh || fields.longTitleZh === item.longTitleZh);

    if (!Object.keys(fields).length || alreadySame) {
      unchanged += 1;
      continue;
    }

    Object.assign(item, fields);
    await patchSet(portfolioId(item.wpId), fields);
    patched += 1;
    if (patched <= 50 || patched % 15 === 0) {
      console.log(`✓ ${item.slug} → ${fields.thumbTitleZh || fields.headerTitleZh}`);
    }
  }

  writeJson(path.join(PATHS.migrationData, 'portfolio.json'), portfolio);

  await patchSet(pageId('work'), {
    heroTitleZh: '<span class="vp-outline">我们的</span> 视频作品集',
  });
  console.log('✓ page-work heroTitleZh → 我们的 视频作品集');

  const pagesPath = path.join(PATHS.migrationData, 'pages.json');
  const pages = readJson<Array<Record<string, unknown>>>(pagesPath);
  for (const page of pages) {
    if (page.slug === 'work') {
      page.heroTitleZh = '<span class="vp-outline">我们的</span> 视频作品集';
    }
  }
  writeJson(pagesPath, pages);

  const withThumb = portfolio.filter((p) => !p.isHidden && p.thumbTitleZh).length;
  const publicCount = portfolio.filter((p) => !p.isHidden).length;

  console.log(
    JSON.stringify(
      {
        liveTitles: liveTitles.size,
        patched,
        unchanged,
        publicWithThumbZh: `${withThumb}/${publicCount}`,
        stillMissingCount: stillMissing.length,
        stillMissingSample: stillMissing.slice(0, 30),
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
