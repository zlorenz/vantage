/**
 * Slug QC hard fixes (EN typos / percent-encoded Vietnamese / ZH cleanup).
 *
 *   npx tsx scripts/migration/patch/portfolio-slug-qc-fixes.ts
 */

import { getWriteClient, patchSet } from '../lib/sanity-client';

type SlugPatch = {
  matchSlug: string;
  set: {
    slug?: { _type: 'slug'; current: string };
    slugZh?: { _type: 'slug'; current: string };
  };
};

const PATCHES: SlugPatch[] = [
  {
    matchSlug:
      'bidv-smartbanking-hoa-nhi%cc%a3p-so%cc%82ng-tho%cc%82ng-minh',
    set: {
      slug: {
        _type: 'slug',
        current: 'bidv-smartbanking-hoa-nhip-song-thong-minh',
      },
    },
  },
  {
    matchSlug:
      'vinamilk-probi-e%cc%82m-ruo%cc%a3%cc%82t-nuo%cc%a3%cc%82t-do%cc%9bi',
    set: {
      slug: {
        _type: 'slug',
        current: 'vinamilk-probi-em-ruot-nuot-doi',
      },
    },
  },
  {
    matchSlug: 'fujifilm-jouney-toward-more-accessible-medicine',
    set: {
      slug: {
        _type: 'slug',
        current: 'fujifilm-journey-toward-more-accessible-medicine',
      },
    },
  },
  {
    matchSlug: 'techombank-mobile',
    set: {
      slug: {
        _type: 'slug',
        current: 'techcombank-mobile',
      },
    },
  },
  {
    matchSlug: 'dji-stories-the-lost-city-of-chernobyl',
    set: {
      slugZh: {
        _type: 'slug',
        current: '大疆故事-切尔诺贝利失落之城',
      },
    },
  },
  {
    matchSlug: 'zhiyun-weebill-3s-crane-3s',
    set: {
      slugZh: {
        _type: 'slug',
        current: '智云-weebill-3s-与-crane-m-3s-便携式视觉叙事-2.0',
      },
    },
  },
];

async function main() {
  const client = getWriteClient();

  for (const entry of PATCHES) {
    const doc = await client.fetch<{ _id: string } | null>(
      `*[_type=="portfolioEntry" && slug.current==$slug][0]{_id}`,
      { slug: entry.matchSlug },
    );
    if (!doc?._id) {
      console.error(`Missing: ${entry.matchSlug}`);
      continue;
    }

    await patchSet(doc._id, entry.set);
    const changes = Object.entries(entry.set)
      .map(([k, v]) => `${k}→${v.current}`)
      .join(', ');
    console.log(`Patched ${entry.matchSlug}: ${changes}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
