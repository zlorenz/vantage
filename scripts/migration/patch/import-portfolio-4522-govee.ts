/**
 * Import missing WP portfolio entry 4522 (Govee – For Every Mood of Home)
 * with featured image, Yoast SEO, and live ZH display fields.
 *
 *   npx tsx scripts/migration/patch/import-portfolio-4522-govee.ts
 */

import fs from 'node:fs'
import path from 'node:path'
import {PATHS} from '../config'
import {closePool, query, table} from '../db'
import {getMeta} from '../lib/acf'
import {getAttachment} from '../lib/attachments'
import {buildCredits} from '../lib/credits-config'
import {readJsonIfExists, writeJson} from '../lib/fs'
import {loadIdMap, saveIdMap, setAssetRef, imageField, docRef} from '../lib/id-map'
import {
  clientId,
  crewMemberId,
  industryId,
  marketId,
  portfolioId,
  videoFormatId,
} from '../lib/ids'
import {createOrReplace, getWriteClient} from '../lib/sanity-client'
import {fetchAllPostMeta, fetchPostTermSlugs} from '../lib/wp-helpers'
import {extractYoast} from '../lib/yoast'
import type {ExportedPortfolio} from '../export/portfolio'

const WP_ID = 4522
const LIVE_UPLOADS_BASE = 'https://vantage.pictures/wp-content/uploads'

/** Live ZH fields (TRP dictionary incomplete for this newer entry). */
const LIVE_ZH = {
  titleZh: 'Govee——满足家居的每种氛围',
  slugZh: '歌诗顿，随心打造居家氛围',
  thumbTitleZh: 'Govee<br>适合各种心情',
  headerTitleZh: 'Govee <span>适合各种心情</span>',
  longTitleZh: 'Govee <span>满足家居的每种氛围</span>',
  metaDescriptionZh:
    '由Vantage Pictures执导的Govee智能家居照明暖心广告片——以狗狗的视角展现家庭生活，以及能随不同心情自动调节的灯光效果。',
}

function slugField(slug: string) {
  return {_type: 'slug' as const, current: slug}
}

function cleanHtmlTitle(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function uploadFeaturedImage(
  wpAttachmentId: number,
): Promise<string | undefined> {
  const idMap = loadIdMap()
  if (idMap.assets[String(wpAttachmentId)]) {
    return idMap.assets[String(wpAttachmentId)]
  }

  const info = await getAttachment(wpAttachmentId)
  if (!info?.relativePath) {
    throw new Error(`No attached file for wp ${wpAttachmentId}`)
  }

  let buffer: Buffer
  let contentType = info.mimeType || 'image/jpeg'

  if (info.filePath && fs.existsSync(info.filePath)) {
    buffer = fs.readFileSync(info.filePath)
  } else {
    const url = `${LIVE_UPLOADS_BASE}/${info.relativePath}`
    console.log(`Fetching featured image from ${url}`)
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`)
    }
    buffer = Buffer.from(await response.arrayBuffer())
    contentType = response.headers.get('content-type') || contentType

    // Cache into local uploads for future runs
    fs.mkdirSync(path.dirname(info.filePath), {recursive: true})
    fs.writeFileSync(info.filePath, buffer)
  }

  const client = getWriteClient()
  const filename = path.basename(info.relativePath)
  const asset = await client.assets.upload('image', buffer, {
    filename,
    contentType,
  })

  // SEO metadata from WP attachment
  const attRows = await query<
    {post_title: string; post_excerpt: string; post_content: string}[]
  >(
    `SELECT post_title, post_excerpt, post_content FROM ${table('posts')}
     WHERE ID = ? LIMIT 1`,
    [wpAttachmentId],
  )
  const altRows = await query<{meta_value: string}[]>(
    `SELECT meta_value FROM ${table('postmeta')}
     WHERE post_id = ? AND meta_key = '_wp_attachment_image_alt' LIMIT 1`,
    [wpAttachmentId],
  )

  const title = cleanHtmlTitle(attRows[0]?.post_title ?? '') || undefined
  const alt = altRows[0]?.meta_value?.trim() || undefined
  const description =
    attRows[0]?.post_excerpt?.trim() ||
    attRows[0]?.post_content?.trim() ||
    undefined

  const set: Record<string, string> = {}
  if (title) set.title = title
  if (alt) set.altText = alt
  if (description) set.description = description
  // Fallback title from filename stem when WP title empty beyond brand name
  if (!set.title && filename) {
    set.title = filename.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
  }
  if (Object.keys(set).length) {
    await client.patch(asset._id).set(set).commit()
  }

  setAssetRef(idMap, wpAttachmentId, asset._id)
  saveIdMap(idMap)
  console.log(`Uploaded asset wp ${wpAttachmentId} → ${asset._id}`, set)
  return asset._id
}

async function main() {
  const posts = await query<
    {
      ID: number
      post_title: string
      post_name: string
      post_content: string
      post_excerpt: string
      post_date: string
    }[]
  >(
    `SELECT ID, post_title, post_name, post_content, post_excerpt, post_date
     FROM ${table('posts')} WHERE ID = ? AND post_type = 'portfolio' LIMIT 1`,
    [WP_ID],
  )
  const post = posts[0]
  if (!post) throw new Error(`WP portfolio ${WP_ID} not found`)

  const meta = (await fetchAllPostMeta([WP_ID])).get(WP_ID) ?? {}
  const terms =
    (
      await fetchPostTermSlugs([WP_ID], [
        'video-format',
        'industry',
        'market',
        'client',
        'director',
        'dop',
        'art-director',
        'platform',
      ])
    ).get(WP_ID) ?? {}

  const yoast = extractYoast(meta)
  const thumbnailId = Number(meta['_thumbnail_id'] ?? 0) || undefined
  if (!thumbnailId) throw new Error('Missing featured image')

  await uploadFeaturedImage(thumbnailId)
  const idMap = loadIdMap()

  const thumbTitle =
    getMeta(meta, 'thumb_title') || getMeta(meta, 'header_title') || post.post_title
  const headerTitle =
    getMeta(meta, 'header_title') || getMeta(meta, 'thumb_title') || post.post_title
  const longTitle =
    getMeta(meta, 'long_title') || getMeta(meta, 'header_title') || post.post_title
  const description = getMeta(meta, 'description') || post.post_content
  const excerpt = (post.post_excerpt ?? '').trim()
  const vimeoUrl = getMeta(meta, 'vimeo_link')

  const crewMembers: {role: string; slug: string; name: string}[] = []
  for (const [tax, role] of [
    ['director', 'director'],
    ['dop', 'dop'],
    ['art-director', 'art-director'],
  ] as const) {
    for (const s of terms[tax] ?? []) {
      const nameRows = await query<{name: string}[]>(
        `SELECT t.name FROM ${table('terms')} t
         JOIN ${table('term_taxonomy')} tt ON t.term_id = tt.term_id
         WHERE t.slug = ? AND tt.taxonomy = ? LIMIT 1`,
        [s, tax],
      )
      crewMembers.push({
        role,
        slug: s,
        name: nameRows[0]?.name ?? s,
      })
    }
  }

  const client = getWriteClient()
  for (const c of crewMembers) {
    const _id = crewMemberId(c.role, c.slug)
    const exists = await client.fetch<string | null>(`*[_id==$_id][0]._id`, {_id})
    if (!exists) {
      await createOrReplace({
        _id,
        _type: 'crewMember',
        name: c.name,
        slug: slugField(c.slug),
        role: c.role,
      })
      console.log(`Created missing crew ${ _id }`)
    }
  }

  const exported: ExportedPortfolio = {
    wpId: WP_ID,
    title: post.post_title,
    titleZh: LIVE_ZH.titleZh,
    slug: post.post_name,
    slugZh: LIVE_ZH.slugZh,
    publishedAt: post.post_date,
    thumbTitle,
    thumbTitleZh: LIVE_ZH.thumbTitleZh,
    headerTitle,
    headerTitleZh: LIVE_ZH.headerTitleZh,
    longTitle,
    longTitleZh: LIVE_ZH.longTitleZh,
    excerpt,
    description,
    featuredImageWpId: thumbnailId,
    vimeoUrl: vimeoUrl || 'https://vimeo.com/1',
    taxonomies: {
      videoFormats: terms['video-format'] ?? [],
      industries: terms.industry ?? [],
      markets: terms.market ?? [],
      clients: terms.client ?? [],
      crewMembers: crewMembers.map(({role, slug}) => ({role, slug})),
      platforms: terms.platform ?? [],
    },
    isHidden: false,
    credits: buildCredits(meta),
    seo: {
      metaDescription: yoast.metaDescription,
      metaDescriptionZh: LIVE_ZH.metaDescriptionZh,
      focusKeyword: yoast.focusKeyword,
    },
  }

  const featuredImage = imageField(idMap, thumbnailId)
  const doc: Record<string, unknown> = {
    _id: portfolioId(WP_ID),
    _type: 'portfolioEntry',
    title: exported.title,
    titleZh: exported.titleZh,
    slug: slugField(exported.slug),
    slugZh: slugField(exported.slugZh!),
    thumbTitle: exported.thumbTitle,
    thumbTitleZh: exported.thumbTitleZh,
    headerTitle: exported.headerTitle,
    headerTitleZh: exported.headerTitleZh,
    longTitle: exported.longTitle,
    longTitleZh: exported.longTitleZh,
    excerpt: exported.excerpt,
    description: exported.description,
    vimeoUrl: exported.vimeoUrl,
    isHidden: false,
    publishedAt: new Date(exported.publishedAt).toISOString(),
    featuredImage,
    videoFormats: exported.taxonomies.videoFormats.map((s) =>
      docRef(videoFormatId(s)),
    ),
    industries: exported.taxonomies.industries.map((s) => docRef(industryId(s))),
    markets: exported.taxonomies.markets.map((s) => docRef(marketId(s))),
    clients: exported.taxonomies.clients.map((s) => docRef(clientId(s))),
    crewMembers: exported.taxonomies.crewMembers.map((c) =>
      docRef(crewMemberId(c.role, c.slug)),
    ),
    platforms: exported.taxonomies.platforms.map((s) => docRef(platformId(s))),
    credits: exported.credits,
    seo: {
      metaDescription: exported.seo.metaDescription,
      metaDescriptionZh: exported.seo.metaDescriptionZh,
      focusKeyword: exported.seo.focusKeyword,
    },
  }

  await createOrReplace(doc)
  console.log(`Created ${doc._id}`)

  // Keep migration-data/portfolio.json in sync
  const portfolioPath = path.join(PATHS.migrationData, 'portfolio.json')
  const existing =
    readJsonIfExists<ExportedPortfolio[]>(portfolioPath) ?? []
  const without = existing.filter((p) => p.wpId !== WP_ID)
  without.push(exported)
  without.sort((a, b) => a.wpId - b.wpId)
  writeJson(portfolioPath, without)
  console.log(`Updated ${portfolioPath} (${without.length} entries)`)

  await closePool()
}

main().catch(async (err) => {
  console.error(err)
  await closePool().catch(() => undefined)
  process.exit(1)
})
