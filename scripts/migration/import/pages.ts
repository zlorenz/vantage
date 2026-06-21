import path from 'node:path';
import { PATHS } from '../config';
import type { ExportedPage } from '../export/pages';
import { readJson } from '../lib/fs';
import { htmlToPortableText } from '../lib/html-to-pt';
import { docRef, imageField, loadIdMap } from '../lib/id-map';
import { pageId, portfolioId } from '../lib/ids';
import { createOrReplace } from '../lib/sanity-client';

function slugField(slug: string) {
  return { _type: 'slug' as const, current: slug };
}

export async function importPages(): Promise<number> {
  const items = readJson<ExportedPage[]>(path.join(PATHS.migrationData, 'pages.json'));
  const idMap = loadIdMap();

  for (const item of items) {
    const doc: Record<string, unknown> = {
      _id: pageId(item.slug),
      _type: 'page',
      title: item.title,
      slug: slugField(item.slug),
      showHeroHeader: item.showHeroHeader,
      body: htmlToPortableText(item.bodyHtml),
      noIndex: item.noIndex,
    };

    if (item.titleZh) doc.titleZh = item.titleZh;
    if (item.slugZh) doc.slugZh = slugField(item.slugZh);
    if (item.heroTitle) doc.heroTitle = item.heroTitle;
    if (item.heroTitleZh) doc.heroTitleZh = item.heroTitleZh;
    if (item.bodyHtmlZh) doc.bodyZh = htmlToPortableText(item.bodyHtmlZh);

    const featuredImage = imageField(idMap, item.featuredImageWpId);
    if (featuredImage) doc.featuredImage = featuredImage;

    if (item.heroSlides?.length) {
      doc.heroSlides = item.heroSlides.map((slide) => ({
        _type: 'heroSlide',
        portfolioRef: docRef(portfolioId(slide.portfolioWpId)),
        buttonLabel: slide.buttonLabel,
        ...(slide.buttonLabelZh ? { buttonLabelZh: slide.buttonLabelZh } : {}),
      }));
    }

    if (item.founders?.length) {
      doc.founders = item.founders.map((f) => {
        const image = imageField(idMap, f.imageWpId);
        return {
          _type: 'founder',
          name: f.name,
          jobTitle: f.jobTitle,
          bio: f.bio,
          ...(image ? { image } : {}),
          ...(f.sameAs.length ? { sameAs: f.sameAs } : {}),
        };
      });
    }

    const seo: Record<string, string> = {};
    if (item.seo.metaDescription) seo.metaDescription = item.seo.metaDescription;
    if (item.seo.metaDescriptionZh) seo.metaDescriptionZh = item.seo.metaDescriptionZh;
    if (item.seo.focusKeyword) seo.focusKeyword = item.seo.focusKeyword;
    if (Object.keys(seo).length) doc.seo = seo;

    await createOrReplace(doc);
  }

  console.log(`Imported ${items.length} pages`);
  return items.length;
}
