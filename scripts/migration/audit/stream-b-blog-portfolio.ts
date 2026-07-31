/**
 * Read-only Stream B recon: WP TranslatePress body strings ↔ Sanity
 *   Part A — blogPost.body (PT blocks) vs WP dictionary paragraphs
 *   Part B — portfolioEntry.description/excerpt (plain text) vs long WP strings
 *
 * Output: migration-data/wp-translation-audit/stream-b-blog-portfolio-report.json
 * Does not write to Sanity or WordPress.
 *
 * Usage: npx tsx scripts/migration/audit/stream-b-blog-portfolio.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import {createClient} from '@sanity/client'
import type {RowDataPacket} from 'mysql2'

import {PATHS, SANITY} from '../config'
import {closePool, query, table} from '../db'
import {
  cleanTrpArtifacts,
  normalizeWhitespace,
} from '../lib/translation-text'

const OUT_PATH = path.join(
  PATHS.migrationData,
  'wp-translation-audit',
  'stream-b-blog-portfolio-report.json',
)

const FUZZY_THRESHOLD = 0.9
/** Min normalized length for a portfolio "description" candidate. */
const DESC_MIN_LEN = 80
/** Min length for a secondary excerpt-ish candidate (if not exact-matching excerpt). */
const EXCERPT_CANDIDATE_MIN_LEN = 40

type DictRow = RowDataPacket & {
  id: number
  original_id: number
  original: string
  translated: string
  status: number
  post_id: number
  post_cnt: number
}

type PtBlock = {
  _type?: string
  style?: string
  children?: Array<{_type?: string; text?: string}>
}

type SanityBlog = {
  _id: string
  title?: string | null
  excerpt?: string | null
  slug?: string | null
  body?: PtBlock[] | null
  bodyZh?: PtBlock[] | null
}

type SanityPortfolio = {
  _id: string
  title?: string | null
  excerpt?: string | null
  excerptZh?: string | null
  description?: string | null
  descriptionZh?: string | null
  slug?: string | null
  displayTitleParts?: {
    brandName?: string | null
    productName?: string | null
    campaignTitle?: string | null
  } | null
}

type ZhBucket = 'empty_safe_to_fill' | 'already_has_value_matches' | 'already_has_value_differs'

// —— text helpers ————————————————————————————————————————————————

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&hellip;/gi, '…')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => {
      const cp = parseInt(h, 16)
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : _
    })
    .replace(/&#(\d+);/g, (_, n: string) => {
      const cp = Number(n)
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : _
    })
}

/** Decode entities, unify quotes/dashes, collapse whitespace. Case preserved. */
function normalizeMatchText(s: string): string {
  return normalizeWhitespace(
    decodeHtmlEntities(s)
      .replace(/\u00a0/g, ' ')
      .replace(/[\u2018\u2019\u201A\u2032\u0060]/g, "'")
      .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
      .replace(/[–—]/g, '-')
      .replace(/\u2026/g, '…'),
  )
}

function zhEqual(a: string, b: string): boolean {
  return (
    normalizeMatchText(cleanTrpArtifacts(a)) ===
    normalizeMatchText(cleanTrpArtifacts(b))
  )
}

function blockPlainText(block: PtBlock): string {
  if (block._type !== 'block') return ''
  return (block.children || [])
    .filter((c) => c && c._type === 'span')
    .map((c) => c.text || '')
    .join('')
}

type TextBlock = {
  bodyIndex: number
  textOrdinal: number
  style: string
  text: string
  normalized: string
}

function extractTextBlocks(body: PtBlock[] | null | undefined): TextBlock[] {
  if (!Array.isArray(body)) return []
  const out: TextBlock[] = []
  let textOrdinal = 0
  body.forEach((b, bodyIndex) => {
    if (!b || b._type !== 'block') return
    const text = blockPlainText(b)
    const normalized = normalizeMatchText(text)
    if (!normalized) return
    out.push({
      bodyIndex,
      textOrdinal: textOrdinal++,
      style: b.style || 'normal',
      text,
      normalized,
    })
  })
  return out
}

/** Classic Levenshtein; fine for ~500-char paragraphs × small corpora. */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  const prev = new Array<number>(b.length + 1)
  const curr = new Array<number>(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    const ca = a.charCodeAt(i - 1)
    for (let j = 1; j <= b.length; j++) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1
      curr[j] = Math.min(
        (prev[j] ?? 0) + 1,
        (curr[j - 1] ?? 0) + 1,
        (prev[j - 1] ?? 0) + cost,
      )
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j] ?? 0
  }
  return prev[b.length] ?? 0
}

function similarityRatio(a: string, b: string): number {
  if (!a && !b) return 1
  if (!a || !b) return 0
  const dist = levenshtein(a, b)
  return 1 - dist / Math.max(a.length, b.length)
}

function slugToLooseText(slug: string): string {
  return normalizeMatchText(slug.replace(/-/g, ' ').toLowerCase())
}

function isTitleExcerptOrSeo(
  wpNorm: string,
  title: string | null | undefined,
  excerpt: string | null | undefined,
  slug: string | null | undefined,
): 'title' | 'excerpt' | 'seo_slug' | null {
  const titleN = normalizeMatchText(title || '')
  const excerptN = normalizeMatchText(excerpt || '')
  const slugN = slug ? slugToLooseText(slug) : ''
  const titleLoose = titleN.toLowerCase()
  const wpLower = wpNorm.toLowerCase()

  if (titleN && wpNorm === titleN) return 'title'
  if (titleLoose && wpLower === titleLoose) return 'title'
  if (excerptN && wpNorm === excerptN) return 'excerpt'
  if (slugN && wpLower === slugN) return 'seo_slug'
  // SEO-ish: lowercase title with punctuation stripped to spaces
  if (titleLoose) {
    const titleSeo = titleLoose
      .replace(/[^a-z0-9\u4e00-\u9fff]+/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const wpSeo = wpLower
      .replace(/[^a-z0-9\u4e00-\u9fff]+/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (titleSeo && wpSeo === titleSeo) return 'seo_slug'
  }
  return null
}

function classifyZh(zhSanity: string | null | undefined, zhWp: string): {
  bucket: ZhBucket
  zh_sanity_current: string
} {
  const current = (zhSanity ?? '').trim()
  if (!current) {
    return {bucket: 'empty_safe_to_fill', zh_sanity_current: ''}
  }
  if (zhEqual(current, zhWp)) {
    return {bucket: 'already_has_value_matches', zh_sanity_current: current}
  }
  return {bucket: 'already_has_value_differs', zh_sanity_current: current}
}

function parseWpIdFromDocId(id: string, prefix: string): number | null {
  if (!id.startsWith(prefix)) return null
  const n = Number(id.slice(prefix.length))
  return Number.isFinite(n) ? n : null
}

// —— main ————————————————————————————————————————————————————————

async function main() {
  const client = createClient({
    projectId: SANITY.projectId,
    dataset: SANITY.dataset,
    apiVersion: SANITY.apiVersion,
    token: SANITY.token || undefined,
    useCdn: false,
  })

  const blogs = await client.fetch<SanityBlog[]>(
    `*[_type == "blogPost" && !defined(trash.trashedAt) && !(_id in path("drafts.**"))]{
      _id, title, excerpt, "slug": slug.current, body, bodyZh
    }`,
  )

  const portfolios = await client.fetch<SanityPortfolio[]>(
    `*[_type == "portfolioEntry" && !defined(trash.trashedAt) && !(_id in path("drafts.**"))]{
      _id, title, excerpt, excerptZh, description, descriptionZh,
      "slug": slug.current, displayTitleParts
    }`,
  )

  const dictTable = table('trp_dictionary_en_us_zh_cn')
  const metaTable = table('trp_original_meta')

  // All translated dict rows linked to at least one post, with that post's
  // distinct parent count (for Part B eligibility filter).
  const linkedRows = await query<DictRow[]>(
    `SELECT d.id, d.original_id, d.original, d.translated, d.status,
            CAST(om.meta_value AS UNSIGNED) AS post_id,
            lc.post_cnt
     FROM ${dictTable} d
     INNER JOIN ${metaTable} om
       ON om.original_id = d.original_id AND om.meta_key = 'post_parent_id'
     INNER JOIN (
       SELECT original_id,
              COUNT(DISTINCT CAST(meta_value AS UNSIGNED)) AS post_cnt
       FROM ${metaTable}
       WHERE meta_key = 'post_parent_id'
         AND meta_value IS NOT NULL AND meta_value <> ''
         AND CAST(meta_value AS UNSIGNED) > 0
       GROUP BY original_id
     ) lc ON lc.original_id = d.original_id
     WHERE d.status IN (1, 2)
       AND d.translated IS NOT NULL
       AND d.translated <> ''
       AND CAST(om.meta_value AS UNSIGNED) > 0`,
  )

  const byPostId = new Map<number, DictRow[]>()
  for (const row of linkedRows) {
    const list = byPostId.get(row.post_id) || []
    list.push(row)
    byPostId.set(row.post_id, list)
  }

  // ——— Part A: blog ———
  type BlogExactRow = {
    sanity_id: string
    wp_id: number
    block_index: number
    text_ordinal: number
    style: string
    en_sanity: string
    en_wp: string
    zh_wp: string
    zh_sanity_current: string
    wp_dict_id: number
    /** When ZH for this EN lives at a different bodyZh text-ordinal. */
    zh_found_at_text_ordinal?: number | null
  }

  type BlogFuzzyRow = {
    sanity_id: string
    wp_id: number
    block_index: number
    text_ordinal: number
    style: string
    en_sanity: string
    en_wp: string
    zh_wp: string
    ratio: number
    wp_dict_id: number
  }

  type BlogOrphanRow = {
    sanity_id: string
    wp_id: number
    en_wp: string
    zh_wp: string
    wp_dict_id: number
    reason: string
  }

  type BlogUnmatchedBlock = {
    sanity_id: string
    wp_id: number
    block_index: number
    text_ordinal: number
    style: string
    en_sanity: string
  }

  const blog_exact = {
    empty_safe_to_fill: [] as BlogExactRow[],
    already_has_value_matches: [] as BlogExactRow[],
    already_has_value_differs: [] as BlogExactRow[],
    /** WP ZH exists in bodyZh but not at the EN block's text-ordinal (structure skew). */
    already_has_value_wrong_ordinal: [] as BlogExactRow[],
  }
  const blog_fuzzy: BlogFuzzyRow[] = []
  const blog_orphans: BlogOrphanRow[] = []
  const blog_unmatched_blocks: BlogUnmatchedBlock[] = []
  const blog_meta = {
    documents: 0,
    documents_with_wp_id: 0,
    documents_missing_wp_mapping: [] as string[],
    text_blocks_total: 0,
    text_blocks_exact: 0,
    text_blocks_fuzzy: 0,
    text_blocks_unmatched: 0,
    wp_strings_total: 0,
    wp_strings_excluded_title_excerpt_seo: 0,
    wp_strings_orphans: 0,
  }

  for (const doc of blogs) {
    blog_meta.documents += 1
    const wpId = parseWpIdFromDocId(doc._id, 'blogPost-')
    if (wpId == null) {
      blog_meta.documents_missing_wp_mapping.push(doc._id)
      continue
    }
    blog_meta.documents_with_wp_id += 1

    const enBlocks = extractTextBlocks(doc.body)
    const zhBlocks = extractTextBlocks(doc.bodyZh)
    blog_meta.text_blocks_total += enBlocks.length

    const wpAll = byPostId.get(wpId) || []
    // Dedupe by dict id (a string can appear once per link edge)
    const seenDict = new Set<number>()
    const wpStrings: Array<{
      id: number
      original: string
      translated: string
      normalized: string
      used: boolean
      excludedAs: 'title' | 'excerpt' | 'seo_slug' | null
    }> = []
    for (const r of wpAll) {
      if (seenDict.has(r.id)) continue
      seenDict.add(r.id)
      const normalized = normalizeMatchText(r.original || '')
      if (!normalized) continue
      const excludedAs = isTitleExcerptOrSeo(
        normalized,
        doc.title,
        doc.excerpt,
        doc.slug,
      )
      wpStrings.push({
        id: r.id,
        original: r.original,
        translated: cleanTrpArtifacts(r.translated || ''),
        normalized,
        used: false,
        excludedAs,
      })
    }
    blog_meta.wp_strings_total += wpStrings.length
    blog_meta.wp_strings_excluded_title_excerpt_seo += wpStrings.filter(
      (s) => s.excludedAs,
    ).length

    const exactByNorm = new Map<string, typeof wpStrings>()
    for (const s of wpStrings) {
      if (s.excludedAs) continue
      const list = exactByNorm.get(s.normalized) || []
      list.push(s)
      exactByNorm.set(s.normalized, list)
    }

    for (const block of enBlocks) {
      const candidates = exactByNorm.get(block.normalized) || []
      const hit = candidates.find((c) => !c.used)
      if (hit) {
        hit.used = true
        blog_meta.text_blocks_exact += 1
        const zhCounterpart = zhBlocks[block.textOrdinal]
        const zhSanity = zhCounterpart?.text ?? ''
        const row: BlogExactRow = {
          sanity_id: doc._id,
          wp_id: wpId,
          block_index: block.bodyIndex,
          text_ordinal: block.textOrdinal,
          style: block.style,
          en_sanity: block.text,
          en_wp: hit.original,
          zh_wp: hit.translated,
          zh_sanity_current: zhSanity,
          wp_dict_id: hit.id,
          zh_found_at_text_ordinal: null,
        }
        if (!zhSanity.trim()) {
          blog_exact.empty_safe_to_fill.push(row)
        } else if (zhEqual(zhSanity, hit.translated)) {
          blog_exact.already_has_value_matches.push(row)
        } else {
          const elsewhere = zhBlocks.findIndex(
            (z) => z.textOrdinal !== block.textOrdinal && zhEqual(z.text, hit.translated),
          )
          if (elsewhere >= 0) {
            row.zh_found_at_text_ordinal = zhBlocks[elsewhere]!.textOrdinal
            blog_exact.already_has_value_wrong_ordinal.push(row)
          } else {
            blog_exact.already_has_value_differs.push(row)
          }
        }
        continue
      }

      // Fuzzy against unused, non-excluded WP strings
      let best: {s: (typeof wpStrings)[0]; ratio: number} | null = null
      for (const s of wpStrings) {
        if (s.used || s.excludedAs) continue
        // Skip tiny strings for fuzzy — too noisy
        if (s.normalized.length < 20 || block.normalized.length < 20) continue
        const ratio = similarityRatio(block.normalized, s.normalized)
        if (ratio < FUZZY_THRESHOLD) continue
        if (!best || ratio > best.ratio) best = {s, ratio}
      }
      if (best) {
        best.s.used = true
        blog_meta.text_blocks_fuzzy += 1
        blog_fuzzy.push({
          sanity_id: doc._id,
          wp_id: wpId,
          block_index: block.bodyIndex,
          text_ordinal: block.textOrdinal,
          style: block.style,
          en_sanity: block.text,
          en_wp: best.s.original,
          zh_wp: best.s.translated,
          ratio: Math.round(best.ratio * 1000) / 1000,
          wp_dict_id: best.s.id,
        })
        continue
      }

      blog_meta.text_blocks_unmatched += 1
      blog_unmatched_blocks.push({
        sanity_id: doc._id,
        wp_id: wpId,
        block_index: block.bodyIndex,
        text_ordinal: block.textOrdinal,
        style: block.style,
        en_sanity: block.text,
      })
    }

    for (const s of wpStrings) {
      if (s.used || s.excludedAs) continue
      blog_meta.wp_strings_orphans += 1
      blog_orphans.push({
        sanity_id: doc._id,
        wp_id: wpId,
        en_wp: s.original,
        zh_wp: s.translated,
        wp_dict_id: s.id,
        reason: 'not matched to any body text block (and not title/excerpt/seo)',
      })
    }
  }

  // ——— Part B: portfolio ———
  type PortfolioFieldRow = {
    sanity_id: string
    wp_id: number
    field: 'description' | 'excerpt'
    en_sanity: string
    en_wp: string
    zh_wp: string
    zh_sanity_current: string
    wp_dict_id: number
  }

  type NoBodyCandidate = {
    sanity_id: string
    wp_id: number
    title: string
    linked_eligible_string_count: number
    longest_en_len: number
    longest_en_preview: string
    note: string
  }

  const portfolio_exact = {
    description: {
      empty_safe_to_fill: [] as PortfolioFieldRow[],
      already_has_value_matches: [] as PortfolioFieldRow[],
      already_has_value_differs: [] as PortfolioFieldRow[],
    },
    excerpt: {
      empty_safe_to_fill: [] as PortfolioFieldRow[],
      already_has_value_matches: [] as PortfolioFieldRow[],
      already_has_value_differs: [] as PortfolioFieldRow[],
    },
  }
  const portfolio_no_body_candidate: NoBodyCandidate[] = []
  const portfolio_description_en_mismatch: Array<{
    sanity_id: string
    wp_id: number
    en_sanity: string
    en_wp: string
    zh_wp: string
    ratio: number
    note: string
  }> = []
  const portfolio_meta = {
    documents: 0,
    documents_with_eligible_links: 0,
    documents_no_eligible_links: 0,
    with_description_candidate: 0,
    no_body_candidate: 0,
    description_exact_en_match: 0,
    description_en_differs: 0,
    excerpt_candidates: 0,
  }

  function isPortfolioNonBody(
    wpNorm: string,
    doc: SanityPortfolio,
  ): boolean {
    if (
      isTitleExcerptOrSeo(wpNorm, doc.title, doc.excerpt, doc.slug)
    ) {
      return true
    }
    const parts = doc.displayTitleParts
    if (parts) {
      for (const v of [
        parts.brandName,
        parts.productName,
        parts.campaignTitle,
      ]) {
        const n = normalizeMatchText(v || '')
        if (n && (wpNorm === n || wpNorm.toLowerCase() === n.toLowerCase())) {
          return true
        }
      }
      // Combined "Brand – Campaign" style titles
      const brand = normalizeMatchText(parts.brandName || '')
      const campaign = normalizeMatchText(parts.campaignTitle || '')
      const product = normalizeMatchText(parts.productName || '')
      const combos = [
        [brand, product, campaign].filter(Boolean).join(' – '),
        [brand, product, campaign].filter(Boolean).join(' - '),
        [brand, campaign].filter(Boolean).join(' – '),
        [brand, campaign].filter(Boolean).join(' - '),
      ]
      for (const c of combos) {
        if (c && normalizeMatchText(c) === wpNorm) return true
      }
    }
    return false
  }

  for (const doc of portfolios) {
    portfolio_meta.documents += 1
    const wpId = parseWpIdFromDocId(doc._id, 'portfolio-')
    if (wpId == null) continue

    const allLinked = byPostId.get(wpId) || []
    // Eligible = post-specific (1–3 parents), unique by dict id
    const seen = new Set<number>()
    const eligible: Array<{
      id: number
      original: string
      translated: string
      normalized: string
      len: number
    }> = []
    for (const r of allLinked) {
      if (r.post_cnt < 1 || r.post_cnt > 3) continue
      if (seen.has(r.id)) continue
      seen.add(r.id)
      const normalized = normalizeMatchText(r.original || '')
      if (!normalized) continue
      eligible.push({
        id: r.id,
        original: r.original,
        translated: cleanTrpArtifacts(r.translated || ''),
        normalized,
        len: normalized.length,
      })
    }

    if (!eligible.length) {
      portfolio_meta.documents_no_eligible_links += 1
      continue
    }
    portfolio_meta.documents_with_eligible_links += 1

    const bodyish = eligible
      .filter((s) => !isPortfolioNonBody(s.normalized, doc))
      .filter((s) => s.len >= DESC_MIN_LEN)
      .sort((a, b) => b.len - a.len)

    const descCandidate = bodyish[0] || null

    if (!descCandidate) {
      portfolio_meta.no_body_candidate += 1
      const longest = [...eligible].sort((a, b) => b.len - a.len)[0]
      portfolio_no_body_candidate.push({
        sanity_id: doc._id,
        wp_id: wpId,
        title: doc.title || '',
        linked_eligible_string_count: eligible.length,
        longest_en_len: longest?.len ?? 0,
        longest_en_preview: (longest?.original || '').slice(0, 120),
        note:
          'No linked eligible string ≥80 chars that is not title/excerpt/SEO/displayTitleParts',
      })
      continue
    }

    portfolio_meta.with_description_candidate += 1
    const descSanity = doc.description || ''
    const descSanityN = normalizeMatchText(descSanity)
    const descRatio = descSanityN
      ? similarityRatio(descSanityN, descCandidate.normalized)
      : 0

    if (descSanityN && descSanityN === descCandidate.normalized) {
      portfolio_meta.description_exact_en_match += 1
      const {bucket, zh_sanity_current} = classifyZh(
        doc.descriptionZh,
        descCandidate.translated,
      )
      portfolio_exact.description[bucket].push({
        sanity_id: doc._id,
        wp_id: wpId,
        field: 'description',
        en_sanity: descSanity,
        en_wp: descCandidate.original,
        zh_wp: descCandidate.translated,
        zh_sanity_current,
        wp_dict_id: descCandidate.id,
      })
    } else {
      // EN empty or drifted — ZH reconciliation does not apply until EN aligns
      portfolio_meta.description_en_differs += 1
      portfolio_description_en_mismatch.push({
        sanity_id: doc._id,
        wp_id: wpId,
        en_sanity: descSanity,
        en_wp: descCandidate.original,
        zh_wp: descCandidate.translated,
        ratio: Math.round(descRatio * 1000) / 1000,
        note: !descSanityN
          ? 'Sanity description empty; WP has long candidate (structure/content drift)'
          : descRatio >= FUZZY_THRESHOLD
            ? 'EN near-match but not exact — do not auto-fill ZH onto drifted EN'
            : 'WP long string does not match Sanity description EN',
      })
    }

    // Excerpt: remaining strings — prefer exact EN match to excerpt, else
    // second long-ish bodyish candidate.
    const usedIds = new Set([descCandidate.id])
    const excerptSanity = doc.excerpt || ''
    const excerptSanityN = normalizeMatchText(excerptSanity)
    let excerptCandidate:
      | (typeof eligible)[0]
      | null = null

    if (excerptSanityN) {
      excerptCandidate =
        eligible.find(
          (s) =>
            !usedIds.has(s.id) &&
            !isPortfolioNonBody(s.normalized, doc) &&
            s.normalized === excerptSanityN,
        ) || null
    }
    if (!excerptCandidate) {
      excerptCandidate =
        bodyish.find(
          (s) =>
            !usedIds.has(s.id) &&
            s.len >= EXCERPT_CANDIDATE_MIN_LEN &&
            s.len < DESC_MIN_LEN,
        ) ||
        bodyish.find((s) => !usedIds.has(s.id)) ||
        null
      // Only accept second bodyish as excerpt if Sanity excerpt is empty or matches
      if (
        excerptCandidate &&
        excerptSanityN &&
        excerptCandidate.normalized !== excerptSanityN
      ) {
        const r = similarityRatio(excerptSanityN, excerptCandidate.normalized)
        if (r < FUZZY_THRESHOLD) excerptCandidate = null
      }
    }

    if (excerptCandidate) {
      portfolio_meta.excerpt_candidates += 1
      if (excerptSanityN && excerptCandidate.normalized === excerptSanityN) {
        const {bucket, zh_sanity_current} = classifyZh(
          doc.excerptZh,
          excerptCandidate.translated,
        )
        portfolio_exact.excerpt[bucket].push({
          sanity_id: doc._id,
          wp_id: wpId,
          field: 'excerpt',
          en_sanity: excerptSanity,
          en_wp: excerptCandidate.original,
          zh_wp: excerptCandidate.translated,
          zh_sanity_current,
          wp_dict_id: excerptCandidate.id,
        })
      }
    }
  }

  // Sort stables
  const byId = <T extends {sanity_id: string}>(a: T, b: T) =>
    a.sanity_id.localeCompare(b.sanity_id) || 0
  for (const key of [
    'empty_safe_to_fill',
    'already_has_value_matches',
    'already_has_value_differs',
    'already_has_value_wrong_ordinal',
  ] as const) {
    blog_exact[key].sort(byId)
  }
  blog_fuzzy.sort((a, b) => b.ratio - a.ratio || byId(a, b))
  blog_orphans.sort(byId)
  portfolio_no_body_candidate.sort(byId)
  for (const field of ['description', 'excerpt'] as const) {
    for (const key of Object.keys(portfolio_exact[field]) as ZhBucket[]) {
      portfolio_exact[field][key].sort(byId)
    }
  }
  portfolio_description_en_mismatch.sort(byId)

  const output = {
    generated_at: new Date().toISOString(),
    notes: {
      bodyZh_structure:
        'Separate portableTextBody field bodyZh (not per-block locale). ZH counterpart for an EN text block is checked at the same text-ordinal within bodyZh (non-text blocks skipped). If WP ZH text exists elsewhere in bodyZh, classified as already_has_value_wrong_ordinal (structure skew — common when bodyZh was imported with different block boundaries).',
      normalize:
        'HTML entities decoded (&amp;, &#8230;, etc.), curly quotes/dashes unified, whitespace collapsed; case preserved for EN equality.',
      fuzzy_threshold: FUZZY_THRESHOLD,
      fuzzy_policy: 'Reported only; not placed in the three ZH buckets.',
      portfolio_eligible:
        'Dictionary strings with 1–3 distinct post_parent_id links, status IN (1,2), translated non-empty.',
      description_candidate_min_len: DESC_MIN_LEN,
    },
    blog: {
      counts: {
        ...blog_meta,
        exact_empty_safe_to_fill: blog_exact.empty_safe_to_fill.length,
        exact_already_has_value_matches:
          blog_exact.already_has_value_matches.length,
        exact_already_has_value_differs:
          blog_exact.already_has_value_differs.length,
        exact_already_has_value_wrong_ordinal:
          blog_exact.already_has_value_wrong_ordinal.length,
        fuzzy_matches: blog_fuzzy.length,
        orphans: blog_orphans.length,
        unmatched_en_blocks: blog_unmatched_blocks.length,
      },
      exact: blog_exact,
      fuzzy: blog_fuzzy,
      orphans: blog_orphans,
      unmatched_en_blocks: blog_unmatched_blocks,
    },
    portfolio: {
      counts: {
        ...portfolio_meta,
        description_empty_safe_to_fill:
          portfolio_exact.description.empty_safe_to_fill.length,
        description_already_has_value_matches:
          portfolio_exact.description.already_has_value_matches.length,
        description_already_has_value_differs:
          portfolio_exact.description.already_has_value_differs.length,
        excerpt_empty_safe_to_fill:
          portfolio_exact.excerpt.empty_safe_to_fill.length,
        excerpt_already_has_value_matches:
          portfolio_exact.excerpt.already_has_value_matches.length,
        excerpt_already_has_value_differs:
          portfolio_exact.excerpt.already_has_value_differs.length,
        no_body_candidate: portfolio_no_body_candidate.length,
        description_en_mismatch: portfolio_description_en_mismatch.length,
      },
      description: portfolio_exact.description,
      excerpt: portfolio_exact.excerpt,
      no_body_candidate: portfolio_no_body_candidate,
      description_en_mismatch: portfolio_description_en_mismatch,
    },
  }

  fs.mkdirSync(path.dirname(OUT_PATH), {recursive: true})
  fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2), 'utf8')
  console.log(`Wrote ${OUT_PATH}`)
  console.log(JSON.stringify({blog: output.blog.counts, portfolio: output.portfolio.counts}, null, 2))

  await closePool()
}

main().catch(async (err) => {
  console.error(err)
  await closePool().catch(() => {})
  process.exit(1)
})
