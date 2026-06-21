import path from 'node:path';
import { PATHS } from '../config';
import type { ExportedPortfolio } from '../export/portfolio';
import { readJson } from '../lib/fs';
import {
  clientId,
  crewMemberId,
  industryId,
  marketId,
  platformId,
  portfolioId,
  videoFormatId,
} from '../lib/ids';
import { docRef, imageField, loadIdMap } from '../lib/id-map';
import { createOrReplace } from '../lib/sanity-client';

function slugField(slug: string) {
  return { _type: 'slug' as const, current: slug };
}

export async function importPortfolio(): Promise<number> {
  const items = readJson<ExportedPortfolio[]>(
    path.join(PATHS.migrationData, 'portfolio.json')
  );
  const idMap = loadIdMap();

  for (const item of items) {
    const featuredImage = imageField(idMap, item.featuredImageWpId);
    if (!featuredImage) {
      console.warn(`Portfolio ${item.wpId} missing uploaded featured image (wp ${item.featuredImageWpId})`);
    }

    const doc: Record<string, unknown> = {
      _id: portfolioId(item.wpId),
      _type: 'portfolioEntry',
      title: item.title,
      slug: slugField(item.slug),
      thumbTitle: item.thumbTitle,
      headerTitle: item.headerTitle,
      longTitle: item.longTitle,
      description: item.description,
      vimeoUrl: item.vimeoUrl.includes('placeholder') ? undefined : item.vimeoUrl,
      isHidden: item.isHidden,
    };

    if (item.titleZh) doc.titleZh = item.titleZh;
    if (item.slugZh) doc.slugZh = slugField(item.slugZh);
    if (item.descriptionZh) doc.descriptionZh = item.descriptionZh;
    if (item.xinpianchangUrl) doc.xinpianchangUrl = item.xinpianchangUrl;
    if (featuredImage) doc.featuredImage = featuredImage;

    if (!doc.vimeoUrl && item.xinpianchangUrl) {
      doc.vimeoUrl = 'https://vimeo.com/1';
    }
    if (!doc.vimeoUrl) {
      doc.vimeoUrl = 'https://vimeo.com/1';
    }

    if (item.additionalVideos?.length) {
      doc.additionalVideos = item.additionalVideos;
    }

    doc.videoFormats = item.taxonomies.videoFormats.map((s) =>
      docRef(videoFormatId(s))
    );
    doc.industries = item.taxonomies.industries.map((s) => docRef(industryId(s)));
    doc.markets = item.taxonomies.markets.map((s) => docRef(marketId(s)));
    doc.clients = item.taxonomies.clients.map((s) => docRef(clientId(s)));
    doc.crewMembers = item.taxonomies.crewMembers.map((c) =>
      docRef(crewMemberId(c.role, c.slug))
    );
    doc.platforms = item.taxonomies.platforms.map((s) => docRef(platformId(s)));

    if (Object.keys(item.credits).length) {
      doc.credits = item.credits;
    }

    const seo: Record<string, string> = {};
    if (item.seo.metaDescription) seo.metaDescription = item.seo.metaDescription;
    if (item.seo.metaDescriptionZh) seo.metaDescriptionZh = item.seo.metaDescriptionZh;
    if (item.seo.focusKeyword) seo.focusKeyword = item.seo.focusKeyword;
    if (Object.keys(seo).length) doc.seo = seo;

    await createOrReplace(doc);
  }

  console.log(`Imported ${items.length} portfolio entries`);
  return items.length;
}
