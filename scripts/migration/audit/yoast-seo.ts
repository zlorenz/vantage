/**
 * Deep audit: WordPress Yoast SEO vs Sanity SEO fields.
 *
 * Checks postmeta + yoast_indexable (if present) for pages, posts, portfolio,
 * then diffs metaDescription against live Sanity documents.
 *
 *   npx tsx scripts/migration/audit/yoast-seo.ts
 */

import path from 'node:path'
import {PATHS} from '../config'
import {closePool, query, table} from '../db'
import {writeJson} from '../lib/fs'
import {blogPostId, pageId, portfolioId} from '../lib/ids'
import {getWriteClient} from '../lib/sanity-client'
import {fetchAllPostMeta, fetchPosts} from '../lib/wp-helpers'

const CONTENT_TYPES = [
  {
    wpType: 'page',
    sanityType: 'page',
    label: 'Pages',
    sanityId: (post: {ID: number; post_name: string}) => pageId(post.post_name),
  },
  {
    wpType: 'post',
    sanityType: 'blogPost',
    label: 'Blog Posts',
    sanityId: (post: {ID: number; post_name: string}) => blogPostId(post.ID),
  },
  {
    wpType: 'portfolio',
    sanityType: 'portfolioEntry',
    label: 'Portfolio',
    sanityId: (post: {ID: number; post_name: string}) => portfolioId(post.ID),
  },
] as const

/** Yoast keys that matter for SEO output / editorial (vs Yoast-internal scores). */
const USEFUL_YOAST_KEYS = new Set([
  '_yoast_wpseo_title',
  '_yoast_wpseo_metadesc',
  '_yoast_wpseo_focuskw',
  '_yoast_wpseo_focuskeywords',
  '_yoast_wpseo_canonical',
  '_yoast_wpseo_meta-robots-noindex',
  '_yoast_wpseo_meta-robots-nofollow',
  '_yoast_wpseo_meta-robots-adv',
  '_yoast_wpseo_opengraph-title',
  '_yoast_wpseo_opengraph-description',
  '_yoast_wpseo_opengraph-image',
  '_yoast_wpseo_opengraph-image-id',
  '_yoast_wpseo_twitter-title',
  '_yoast_wpseo_twitter-description',
  '_yoast_wpseo_twitter-image',
  '_yoast_wpseo_twitter-image-id',
  '_yoast_wpseo_schema_page_type',
  '_yoast_wpseo_schema_article_type',
  '_yoast_wpseo_bctitle',
])

const MIGRATED_KEYS = new Set([
  '_yoast_wpseo_metadesc',
])

function clean(value: string | null | undefined): string | undefined {
  const t = value?.replace(/\s+/g, ' ').trim()
  return t || undefined
}

function norm(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

async function tableExists(name: string): Promise<boolean> {
  const rows = await query<{cnt: number}[]>(
    `SELECT COUNT(*) AS cnt FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = ?`,
    [name],
  )
  return Number(rows[0]?.cnt) > 0
}

async function main() {
  const client = getWriteClient()

  // --- Discover Yoast postmeta key usage across content types ---
  const keyUsageRows = await query<
    {meta_key: string; post_type: string; filled: number; total: number}[]
  >(
    `SELECT pm.meta_key, p.post_type,
            SUM(CASE WHEN pm.meta_value IS NOT NULL AND TRIM(pm.meta_value) <> '' THEN 1 ELSE 0 END) AS filled,
            COUNT(*) AS total
     FROM ${table('postmeta')} pm
     JOIN ${table('posts')} p ON p.ID = pm.post_id
     WHERE pm.meta_key LIKE '\\_yoast_wpseo_%'
       AND p.post_type IN ('page', 'post', 'portfolio')
       AND p.post_status = 'publish'
     GROUP BY pm.meta_key, p.post_type
     ORDER BY pm.meta_key, p.post_type`,
  )

  const keySummary: Record<
    string,
    {byType: Record<string, {filled: number; total: number}>; useful: boolean; migrated: boolean}
  > = {}
  for (const row of keyUsageRows) {
    if (!keySummary[row.meta_key]) {
      keySummary[row.meta_key] = {
        byType: {},
        useful: USEFUL_YOAST_KEYS.has(row.meta_key),
        migrated: MIGRATED_KEYS.has(row.meta_key),
      }
    }
    keySummary[row.meta_key].byType[row.post_type] = {
      filled: Number(row.filled),
      total: Number(row.total),
    }
  }

  // --- Indexables table ---
  const indexableTable = table('yoast_indexable')
  const hasIndexables = await tableExists(indexableTable)
  let indexableSample: unknown[] = []
  let indexableStats: Record<string, unknown> | null = null

  if (hasIndexables) {
    const stats = await query<Record<string, number>[]>(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN object_type = 'post' THEN 1 ELSE 0 END) AS posts,
         SUM(CASE WHEN description IS NOT NULL AND TRIM(description) <> '' THEN 1 ELSE 0 END) AS with_description,
         SUM(CASE WHEN title IS NOT NULL AND TRIM(title) <> '' THEN 1 ELSE 0 END) AS with_title,
         SUM(CASE WHEN primary_focus_keyword IS NOT NULL AND TRIM(primary_focus_keyword) <> '' THEN 1 ELSE 0 END) AS with_focuskw,
         SUM(CASE WHEN open_graph_image IS NOT NULL AND TRIM(open_graph_image) <> '' THEN 1 ELSE 0 END) AS with_og_image,
         SUM(CASE WHEN twitter_image IS NOT NULL AND TRIM(twitter_image) <> '' THEN 1 ELSE 0 END) AS with_twitter_image,
         SUM(CASE WHEN canonical IS NOT NULL AND TRIM(canonical) <> '' THEN 1 ELSE 0 END) AS with_canonical,
         SUM(CASE WHEN is_robots_noindex = 1 THEN 1 ELSE 0 END) AS noindex,
         SUM(CASE WHEN schema_page_type IS NOT NULL AND TRIM(schema_page_type) <> '' THEN 1 ELSE 0 END) AS with_schema_page,
         SUM(CASE WHEN schema_article_type IS NOT NULL AND TRIM(schema_article_type) <> '' THEN 1 ELSE 0 END) AS with_schema_article
       FROM ${indexableTable}
       WHERE object_type = 'post'
         AND object_sub_type IN ('page', 'post', 'portfolio')`,
    )
    indexableStats = stats[0] ?? null

    indexableSample = await query(
      `SELECT object_id, object_sub_type, title, description, primary_focus_keyword,
              open_graph_title, open_graph_description, open_graph_image,
              twitter_title, twitter_description, twitter_image,
              canonical, is_robots_noindex, schema_page_type, schema_article_type
       FROM ${indexableTable}
       WHERE object_type = 'post'
         AND object_sub_type IN ('page', 'post', 'portfolio')
         AND (
           (title IS NOT NULL AND TRIM(title) <> '' AND title NOT LIKE '%%title%%' AND title NOT LIKE '%%sitename%%') OR
           (open_graph_title IS NOT NULL AND TRIM(open_graph_title) <> '') OR
           (canonical IS NOT NULL AND TRIM(canonical) <> '') OR
           is_robots_noindex = 1 OR
           (schema_page_type IS NOT NULL AND TRIM(schema_page_type) <> '') OR
           (schema_article_type IS NOT NULL AND TRIM(schema_article_type) <> '')
         )
       LIMIT 50`,
    )
  }

  // --- Per-document WP vs Sanity SEO diff ---
  const sanityDocs = await client.fetch<
    Array<{
      _id: string
      _type: string
      title?: string
      slug?: string
      noIndex?: boolean
      isHidden?: boolean
      seo?: {
        metaDescription?: string
        metaDescriptionZh?: string
      }
    }>
  >(`*[_type in ["page", "blogPost", "portfolioEntry"]]{
    _id, _type, title, "slug": slug.current, noIndex, isHidden,
    seo { metaDescription, metaDescriptionZh }
  }`)

  const sanityById = new Map(sanityDocs.map((d) => [d._id, d]))

  const mismatches: unknown[] = []
  const missingInSanity: unknown[] = []
  const missingMetadesc: unknown[] = []
  const usefulUnmigratedExamples: unknown[] = []
  const typeSummaries: Record<string, unknown> = {}

  for (const {wpType, label, sanityId} of CONTENT_TYPES) {
    const posts = await fetchPosts(wpType)
    const metaMap = await fetchAllPostMeta(posts.map((p) => p.ID))

    let wpMetadesc = 0
    let matched = 0
    let metadescOk = 0
    let metadescMismatch = 0
    let sanityMissing = 0

    for (const post of posts) {
      const meta = metaMap.get(post.ID) ?? {}
      const wpMetadescVal = clean(meta['_yoast_wpseo_metadesc'])
      const wpTitle = clean(meta['_yoast_wpseo_title'])
      const wpCanonical = clean(meta['_yoast_wpseo_canonical'])
      const wpOgTitle = clean(meta['_yoast_wpseo_opengraph-title'])
      const wpOgDesc = clean(meta['_yoast_wpseo_opengraph-description'])
      const wpOgImage = clean(meta['_yoast_wpseo_opengraph-image'])
      const wpNoindex = clean(meta['_yoast_wpseo_meta-robots-noindex'])
      const wpSchemaPage = clean(meta['_yoast_wpseo_schema_page_type'])
      const wpSchemaArticle = clean(meta['_yoast_wpseo_schema_article_type'])

      if (wpMetadescVal) wpMetadesc++

      // Collect interesting unmigrated SEO fields that actually have values
      // (skip pure Yoast %%variable%% title templates — those are regenerated in Next)
      const titleIsTemplate = Boolean(wpTitle && /%%\w+%%/.test(wpTitle))
      if (
        (wpTitle && !titleIsTemplate) ||
        wpCanonical ||
        wpOgTitle ||
        wpOgDesc ||
        wpOgImage ||
        (wpNoindex && wpNoindex !== '0') ||
        wpSchemaPage ||
        wpSchemaArticle
      ) {
        usefulUnmigratedExamples.push({
          wpId: post.ID,
          type: wpType,
          slug: post.post_name,
          title: wpTitle,
          titleIsTemplate,
          canonical: wpCanonical,
          ogTitle: wpOgTitle,
          ogDesc: wpOgDesc,
          ogImage: wpOgImage,
          noindex: wpNoindex,
          schemaPage: wpSchemaPage,
          schemaArticle: wpSchemaArticle,
        })
      } else if (wpTitle && titleIsTemplate) {
        usefulUnmigratedExamples.push({
          wpId: post.ID,
          type: wpType,
          slug: post.post_name,
          title: wpTitle,
          titleIsTemplate: true,
          note: 'Yoast title template — intentionally generated in Next.js',
        })
      }

      const sanity = sanityById.get(sanityId(post))

      if (!sanity) {
        sanityMissing++
        missingInSanity.push({
          wpId: post.ID,
          type: wpType,
          slug: post.post_name,
          expectedSanityId: sanityId(post),
          title: post.post_title,
          hasMetadesc: Boolean(wpMetadescVal),
        })
        continue
      }

      matched++
      const sMetadesc = clean(sanity.seo?.metaDescription)

      if (wpMetadescVal) {
        if (norm(sMetadesc) === norm(wpMetadescVal)) metadescOk++
        else {
          metadescMismatch++
          mismatches.push({
            field: 'metaDescription',
            wpId: post.ID,
            type: wpType,
            slug: post.post_name,
            sanityId: sanity._id,
            wp: wpMetadescVal,
            sanity: sMetadesc ?? null,
          })
        }
      } else if (!sMetadesc) {
        missingMetadesc.push({
          wpId: post.ID,
          type: wpType,
          slug: post.post_name,
          sanityId: sanity._id,
          note: 'No Yoast metadesc in WP and none in Sanity',
        })
      }
    }

    typeSummaries[label] = {
      wpPublished: posts.length,
      matchedInSanity: matched,
      missingInSanity: sanityMissing,
      wpWithMetadesc: wpMetadesc,
      metadescExactMatch: metadescOk,
      metadescMismatch,
    }
  }

  // Sanity docs missing SEO even if WP had nothing useful to say
  const sanityWithoutMetadesc = sanityDocs.filter(
    (d) => !clean(d.seo?.metaDescription),
  )
  const sanityWithoutZh = sanityDocs.filter(
    (d) => clean(d.seo?.metaDescription) && !clean(d.seo?.metaDescriptionZh),
  )

  const usefulKeysWithData = Object.entries(keySummary)
    .filter(([, v]) => {
      const filled = Object.values(v.byType).reduce((n, t) => n + t.filled, 0)
      return v.useful && filled > 0
    })
    .map(([key, v]) => ({
      key,
      migrated: v.migrated,
      byType: v.byType,
      filledTotal: Object.values(v.byType).reduce((n, t) => n + t.filled, 0),
    }))

  const report = {
    generatedAt: new Date().toISOString(),
    design: {
      migratedFields: ['_yoast_wpseo_metadesc'],
      intentionallyNotMigrated:
        'Focus keyword, SEO titles, OG/Twitter, canonical, robots, schema types — focus keyword was Yoast-internal; titles/OG/etc. are generated in Next.js per content-schema.md §7',
    },
    yoastPostmetaKeys: keySummary,
    usefulKeysWithData,
    indexables: {
      tableExists: hasIndexables,
      stats: indexableStats,
      interestingRows: indexableSample,
    },
    byType: typeSummaries,
    mismatches,
    missingInSanity,
    missingMetadesc,
    usefulUnmigratedExamples: usefulUnmigratedExamples.slice(0, 100),
    sanityGaps: {
      withoutMetaDescription: sanityWithoutMetadesc.map((d) => ({
        _id: d._id,
        _type: d._type,
        slug: d.slug,
        title: d.title,
        noIndex: d.noIndex,
        isHidden: d.isHidden,
      })),
      withEnButMissingZh: sanityWithoutZh.map((d) => ({
        _id: d._id,
        _type: d._type,
        slug: d.slug,
      })),
    },
  }

  const outPath = path.join(PATHS.migrationData, 'yoast-seo-audit.json')
  writeJson(outPath, report)

  console.log('=== Yoast SEO Audit ===\n')
  console.log('Useful Yoast keys with data:')
  for (const k of usefulKeysWithData) {
    console.log(
      `  ${k.migrated ? '✓ MIGRATED' : '· not migrated'}  ${k.key}  (filled ${k.filledTotal})`,
      k.byType,
    )
  }

  console.log('\nIndexables table:', hasIndexables ? 'present' : 'absent')
  if (indexableStats) console.log('  stats:', indexableStats)

  console.log('\nPer-type WP ↔ Sanity:')
  for (const [label, summary] of Object.entries(typeSummaries)) {
    console.log(`  ${label}:`, summary)
  }

  console.log(`\nMismatches: ${mismatches.length}`)
  console.log(`Missing in Sanity: ${missingInSanity.length}`)
  console.log(`No metadesc (WP+Sanity): ${missingMetadesc.length}`)
  console.log(
    `Sanity docs without metaDescription: ${sanityWithoutMetadesc.length}`,
  )
  console.log(`EN metadesc missing ZH: ${sanityWithoutZh.length}`)
  console.log(
    `Useful unmigrated field examples: ${usefulUnmigratedExamples.length}`,
  )
  console.log(`\nWrote ${outPath}`)

  await closePool()
}

main().catch(async (err) => {
  console.error(err)
  await closePool().catch(() => undefined)
  process.exit(1)
})
