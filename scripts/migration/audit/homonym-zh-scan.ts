/**
 * Read-only: find where 后期制作 / 装片员 / 装载机 appear in Sanity content
 * to check for pre-existing wrong-sense autofills from Post/Loader phrases.
 */
import path from 'node:path'
import {config as loadEnv} from 'dotenv'
import {createClient} from '@sanity/client'

import {asPlainString, getAtPath} from '../../../shared/ai-translation/paths'

loadEnv({path: path.resolve(process.cwd(), '.env.local')})

const token =
  process.env.SANITY_API_READ_TOKEN ||
  process.env.SANITY_API_WRITE_TOKEN ||
  process.env.SANITY_API_TOKEN ||
  ''

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '7oesp86l',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token: token || undefined,
  useCdn: false,
})

const NEEDLES = ['后期制作', '装片员', '装载机'] as const

type Hit = {
  needle: string
  documentId: string
  documentType: string
  field: string
  en_nearby?: string
  zh_value: string
  assessment: string
}

function assess(needle: string, field: string, en?: string): string {
  const f = field.toLowerCase()
  const enN = (en ?? '').toLowerCase()

  if (needle === '后期制作') {
    // Expected: post-production crew role / department context
    if (f.includes('crewcredits') && f.includes('role')) {
      return 'likely OK — crew role field (post-production sense)'
    }
    if (enN === 'post' || enN.includes('post-production') || enN.includes('post production')) {
      return 'likely OK — EN suggests post-production'
    }
    if (f.includes('blogpost') || f.startsWith('blogpost.') || f.includes('title') || f.includes('excerpt')) {
      if (enN === 'post' || enN.includes('blog')) {
        return 'SUSPECT — blog/article context with post-production ZH?'
      }
      return 'review — appears in title/excerpt-like field'
    }
    return 'review — check context'
  }

  if (needle === '装片员') {
    if (f.includes('crewcredits') && f.includes('role')) {
      return 'likely OK — crew loader role'
    }
    if (enN === 'loader') {
      return f.includes('role')
        ? 'likely OK — Loader as crew role'
        : 'review — EN Loader but not clearly a role field'
    }
    return 'review — 装片员 outside obvious crew-role field'
  }

  // 装载机 — machinery sense (WP homonym); unlikely correct as crew role
  if (f.includes('crewcredits') && f.includes('role')) {
    return 'SUSPECT — machinery ZH in crew-role field'
  }
  if (enN === 'loader') {
    return 'SUSPECT — EN Loader with machinery ZH 装载机'
  }
  return 'review — 装载机 occurrence'
}

function scanDoc(doc: Record<string, unknown>, hits: Hit[]) {
  const type = String(doc._type ?? '')
  const id = String(doc._id ?? '').replace(/^drafts\./, '')

  const check = (
    field: string,
    zhRaw: unknown,
    enRaw?: unknown,
  ) => {
    const zh = asPlainString(zhRaw)
    if (!zh) return
    const en = enRaw != null ? asPlainString(enRaw) : undefined
    for (const needle of NEEDLES) {
      if (!zh.includes(needle)) continue
      hits.push({
        needle,
        documentId: id,
        documentType: type,
        field: `${type}.${field}`,
        en_nearby: en || undefined,
        zh_value: zh.length > 120 ? `${zh.slice(0, 120)}…` : zh,
        assessment: assess(needle, `${type}.${field}`, en),
      })
    }
  }

  // Common locale pairs
  const pairs: Array<[string, string]> = [
    ['title', 'titleZh'],
    ['excerpt', 'excerptZh'],
    ['description', 'descriptionZh'],
    ['heroFilmTitle', 'heroFilmTitleZh'],
    ['heroTitle', 'heroTitleZh'],
    ['contactAddress', 'contactAddressZh'],
    ['contactModalTitle', 'contactModalTitleZh'],
    ['contactModalIntro', 'contactModalIntroZh'],
    ['contactCtaText', 'contactCtaTextZh'],
  ]
  for (const [enPath, zhPath] of pairs) {
    check(zhPath, getAtPath(doc, zhPath), getAtPath(doc, enPath))
  }

  // displayTitleParts
  const parts = doc.displayTitleParts
  if (parts && typeof parts === 'object') {
    const p = parts as Record<string, unknown>
    for (const key of ['brandName', 'productName', 'campaignTitle'] as const) {
      check(
        `displayTitleParts.${key}Zh`,
        p[`${key}Zh`],
        p[key],
      )
    }
  }

  // SEO
  const seo = doc.seo
  if (seo && typeof seo === 'object') {
    const s = seo as Record<string, unknown>
    check('seo.metaDescriptionZh', s.metaDescriptionZh, s.metaDescription)
  }

  // PT bodies — search plain text
  for (const [enF, zhF] of [
    ['body', 'bodyZh'],
    ['contactModalContent', 'contactModalContentZh'],
  ] as const) {
    check(zhF, getAtPath(doc, zhF), getAtPath(doc, enF))
  }

  // additional videos
  const videos = doc.additionalVideos
  if (Array.isArray(videos)) {
    videos.forEach((row, i) => {
      if (!row || typeof row !== 'object') return
      const r = row as Record<string, unknown>
      check(
        `additionalVideos[${i}].videoTitleZh`,
        r.videoTitleZh,
        r.videoTitle,
      )
      check(
        `additionalVideos[${i}].descriptionZh`,
        r.descriptionZh,
        r.description,
      )
    })
  }

  // founders
  const founders = doc.founders
  if (Array.isArray(founders)) {
    founders.forEach((row, i) => {
      if (!row || typeof row !== 'object') return
      const r = row as Record<string, unknown>
      check(`founders[${i}].jobTitleZh`, r.jobTitleZh, r.jobTitle)
    })
  }

  // crew credits roles
  const credits = doc.crewCredits
  if (Array.isArray(credits)) {
    credits.forEach((row, i) => {
      if (!row || typeof row !== 'object') return
      const c = row as Record<string, unknown>
      // role may only have EN; also check any *Zh if present
      check(`crewCredits[${i}].role`, c.roleZh ?? c.role, c.role)
      if (typeof c.role === 'string') {
        for (const needle of NEEDLES) {
          if (c.role.includes(needle)) {
            hits.push({
              needle,
              documentId: id,
              documentType: type,
              field: `${type}.crewCredits[${i}].role`,
              en_nearby: String(c.roleKey ?? ''),
              zh_value: c.role,
              assessment: assess(
                needle,
                `${type}.crewCredits[${i}].role`,
                String(c.roleKey ?? c.role),
              ),
            })
          }
        }
      }
    })
  }

  // campaign CTA
  const cta = doc.campaignCta
  if (cta && typeof cta === 'object') {
    const c = cta as Record<string, unknown>
    check('campaignCta.headingZh', c.headingZh, c.heading)
    check('campaignCta.buttonLabelZh', c.buttonLabelZh, c.buttonLabel)
    if (Array.isArray(c.paragraphsZh)) {
      c.paragraphsZh.forEach((p, i) => {
        check(
          `campaignCta.paragraphsZh[${i}]`,
          p,
          Array.isArray(c.paragraphs) ? c.paragraphs[i] : undefined,
        )
      })
    }
  }

  // Also scan ALL string values shallowly for needles (catch unknowns)
  const walk = (val: unknown, pathStr: string) => {
    if (typeof val === 'string') {
      for (const needle of NEEDLES) {
        if (!val.includes(needle)) continue
        // skip if already recorded for same path
        if (hits.some((h) => h.documentId === id && h.field === `${type}.${pathStr}` && h.needle === needle)) {
          continue
        }
        hits.push({
          needle,
          documentId: id,
          documentType: type,
          field: `${type}.${pathStr}`,
          zh_value: val.length > 120 ? `${val.slice(0, 120)}…` : val,
          assessment: assess(needle, `${type}.${pathStr}`),
        })
      }
      return
    }
    if (Array.isArray(val)) {
      val.forEach((item, i) => walk(item, `${pathStr}[${i}]`))
      return
    }
    if (val && typeof val === 'object') {
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        if (k.startsWith('_')) continue
        walk(v, pathStr ? `${pathStr}.${k}` : k)
      }
    }
  }
  walk(doc, '')
}

async function main() {
  // GROQ prefilter: any doc containing the needles as substrings in string fields
  const docs = await client.fetch<Array<Record<string, unknown>>>(
    `*[
      !(_id in path("drafts.**")) &&
      !(_id in path("versions.**")) &&
      _type != "translatedPhrase" &&
      (
        pt::text(bodyZh) match "*后期制作*" ||
        pt::text(bodyZh) match "*装片员*" ||
        pt::text(bodyZh) match "*装载机*" ||
        pt::text(body) match "*后期制作*" ||
        pt::text(contactModalContentZh) match "*后期制作*" ||
        titleZh match "*后期制作*" ||
        titleZh match "*装片员*" ||
        titleZh match "*装载机*" ||
        excerptZh match "*后期制作*" ||
        excerptZh match "*装片员*" ||
        excerptZh match "*装载机*" ||
        descriptionZh match "*后期制作*" ||
        descriptionZh match "*装片员*" ||
        descriptionZh match "*装载机*" ||
        heroFilmTitleZh match "*后期制作*" ||
        heroFilmTitleZh match "*装片员*" ||
        heroFilmTitleZh match "*装载机*" ||
        seo.metaDescriptionZh match "*后期制作*" ||
        seo.metaDescriptionZh match "*装片员*" ||
        seo.metaDescriptionZh match "*装载机*" ||
        contactModalTitleZh match "*后期制作*" ||
        contactCtaTextZh match "*后期制作*" ||
        displayTitleParts.brandNameZh match "*后期制作*" ||
        displayTitleParts.productNameZh match "*后期制作*" ||
        displayTitleParts.campaignTitleZh match "*后期制作*" ||
        displayTitleParts.brandNameZh match "*装片员*" ||
        displayTitleParts.productNameZh match "*装片员*" ||
        displayTitleParts.campaignTitleZh match "*装片员*" ||
        displayTitleParts.brandNameZh match "*装载机*" ||
        displayTitleParts.productNameZh match "*装载机*" ||
        displayTitleParts.campaignTitleZh match "*装载机*" ||
        count(crewCredits[role match "*后期制作*" || role match "*装片员*" || role match "*装载机*"]) > 0 ||
        count(additionalVideos[videoTitleZh match "*后期制作*" || descriptionZh match "*后期制作*" || videoTitleZh match "*装片员*" || descriptionZh match "*装片员*" || videoTitleZh match "*装载机*" || descriptionZh match "*装载机*"]) > 0 ||
        campaignCta.headingZh match "*后期制作*" ||
        campaignCta.buttonLabelZh match "*后期制作*" ||
        campaignCta.headingZh match "*装片员*" ||
        campaignCta.buttonLabelZh match "*装片员*" ||
        campaignCta.headingZh match "*装载机*" ||
        campaignCta.buttonLabelZh match "*装载机*"
      )
    ]{
      ...,
      "slug": slug.current
    }`,
  )

  // Also fetch portfolio entries that have Loader/Post as crew role EN
  // (role ZH may live only via phrase book at render time — check EN role)
  const roleDocs = await client.fetch<Array<Record<string, unknown>>>(
    `*[_type == "portfolioEntry" && !defined(trash.trashedAt) && !(_id in path("drafts.**")) &&
      count(crewCredits[role == "Post" || role == "Loader" || role match "*Post*" || role match "*Loader*"]) > 0
    ]{_id, _type, title, crewCredits[]{role, roleKey, department}}`,
  )

  const hits: Hit[] = []
  for (const doc of docs) {
    scanDoc(doc, hits)
  }

  // Deduplicate hits
  const seen = new Set<string>()
  const unique = hits.filter((h) => {
    const k = `${h.needle}|${h.documentId}|${h.field}|${h.zh_value}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })

  console.log(
    JSON.stringify(
      {
        groq_prefilter_docs: docs.length,
        content_hits: unique,
        content_hit_count: unique.length,
        suspect_or_review: unique.filter(
          (h) =>
            h.assessment.startsWith('SUSPECT') ||
            h.assessment.startsWith('review'),
        ),
        portfolio_with_post_or_loader_role_en: roleDocs.map((d) => ({
          _id: d._id,
          title: d.title,
          roles: (Array.isArray(d.crewCredits) ? d.crewCredits : [])
            .filter(
              (c: {role?: string}) =>
                typeof c?.role === 'string' &&
                (/post|loader/i.test(c.role)),
            )
            .map((c: {role?: string; roleKey?: string; department?: string}) => ({
              role: c.role,
              roleKey: c.roleKey,
              department: c.department,
            })),
        })),
      },
      null,
      2,
    ),
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
