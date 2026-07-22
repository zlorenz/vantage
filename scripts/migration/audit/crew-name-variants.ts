/**
 * Scan Sanity portfolio crewCredits for person names that likely refer to the
 * same individual but were entered with spelling / ordering / diacritic variants.
 *
 * Read-only audit — does not modify the database.
 *
 *   npx tsx scripts/migration/audit/crew-name-variants.ts
 *   npx tsx scripts/migration/audit/crew-name-variants.ts --json
 *
 * Requires SANITY_API_WRITE_TOKEN or SANITY_API_TOKEN in .env.local.
 */

import {
  confidenceForReasons,
  hyphenSpacingKey,
  isNicknamePrefix,
  isNicknameSuffix,
  normalizeUrl,
  normName,
  pickCanonical,
  wordKey,
  type MatchReason,
  type NameStats,
} from '../../../shared/crew-credits'
import {getWriteClient} from '../lib/sanity-client'
import '../config'

interface PersonOccurrence {
  name: string
  url?: string
  entrySlug: string
  department: string
  role: string
  roleKey?: string
  positionKey: string
}

interface PortfolioDoc {
  _id: string
  title?: string
  slug: string
  crewCredits?: {
    department?: string
    role?: string
    roleKey?: string
    people?: {name?: string; url?: string; linkTitle?: string}[]
  }[]
}

interface CrewPosition {
  department: string
  role: string
  roleKey?: string
}

interface VariantGroup {
  position: CrewPosition
  reasons: MatchReason[]
  confidence: 'high' | 'medium' | 'review'
  note?: string
  suggestedCanonical: string
  variants: NameStats[]
  totalOccurrences: number
}

class UnionFind {
  private parent = new Map<string, string>()

  find(x: string): string {
    const p = this.parent.get(x) ?? x
    if (p !== x) {
      const root = this.find(p)
      this.parent.set(x, root)
      return root
    }
    this.parent.set(x, x)
    return x
  }

  union(a: string, b: string) {
    this.unionFind(a)
    this.unionFind(b)
    const ra = this.find(a)
    const rb = this.find(b)
    if (ra !== rb) this.parent.set(rb, ra)
  }

  private unionFind(x: string) {
    if (!this.parent.has(x)) this.parent.set(x, x)
  }

  groups(): Map<string, string[]> {
    const buckets = new Map<string, string[]>()
    for (const name of this.parent.keys()) {
      const root = this.find(name)
      const bucket = buckets.get(root) ?? []
      bucket.push(name)
      buckets.set(root, bucket)
    }
    return buckets
  }

  add(name: string) {
    this.unionFind(name)
  }
}

function buildPositionKey(department: string, role: string, roleKey?: string): string {
  const dept = department.trim() || 'unknown'
  const roleId = roleKey?.trim() || normName(role) || 'unknown'
  return `${dept}|${roleId}`
}

function positionFromOccurrence(occ: PersonOccurrence): CrewPosition {
  return {
    department: occ.department,
    role: occ.role,
    roleKey: occ.roleKey,
  }
}

function formatPosition(position: CrewPosition): string {
  return `${position.department} / ${position.role}`
}

function buildNameStats(occurrences: PersonOccurrence[]): Map<string, NameStats> {
  const byName = new Map<string, NameStats>()
  for (const occ of occurrences) {
    const existing = byName.get(occ.name)
    if (!existing) {
      byName.set(occ.name, {
        name: occ.name,
        count: 1,
        urls: occ.url ? [occ.url] : [],
        entries: [occ.entrySlug],
      })
      continue
    }
    existing.count++
    if (occ.url && !existing.urls.includes(occ.url)) existing.urls.push(occ.url)
    if (!existing.entries.includes(occ.entrySlug)) existing.entries.push(occ.entrySlug)
  }
  return byName
}

function detectVariantGroups(byName: Map<string, NameStats>): VariantGroup[] {
  const stats = [...byName.values()]
  const uf = new UnionFind()
  const reasonsByPair = new Map<string, Set<MatchReason>>()

  function pairKey(a: string, b: string) {
    return [a, b].sort().join('\0')
  }

  function link(a: string, b: string, reason: MatchReason) {
    if (a === b) return
    uf.add(a)
    uf.add(b)
    uf.union(a, b)
    const key = pairKey(a, b)
    const set = reasonsByPair.get(key) ?? new Set<MatchReason>()
    set.add(reason)
    reasonsByPair.set(key, set)
  }

  for (const item of stats) uf.add(item.name)

  const byNorm = new Map<string, NameStats[]>()
  for (const item of stats) {
    const bucket = byNorm.get(normName(item.name)) ?? []
    bucket.push(item)
    byNorm.set(normName(item.name), bucket)
  }
  for (const bucket of byNorm.values()) {
    if (bucket.length < 2) continue
    for (let i = 0; i < bucket.length; i++) {
      for (let j = i + 1; j < bucket.length; j++) {
        link(bucket[i]!.name, bucket[j]!.name, 'diacritic')
      }
    }
  }

  const byWordKey = new Map<string, NameStats[]>()
  for (const item of stats) {
    const words = normName(item.name).split(/\s+/).filter(Boolean)
    if (words.length < 2) continue
    const bucket = byWordKey.get(wordKey(item.name)) ?? []
    bucket.push(item)
    byWordKey.set(wordKey(item.name), bucket)
  }
  for (const bucket of byWordKey.values()) {
    const unique = [...new Set(bucket.map((b) => b.name))]
    if (unique.length < 2) continue
    for (let i = 0; i < unique.length; i++) {
      for (let j = i + 1; j < unique.length; j++) {
        if (normName(unique[i]!) === normName(unique[j]!)) continue
        link(unique[i]!, unique[j]!, 'word_order')
      }
    }
  }

  const byHyphen = new Map<string, NameStats[]>()
  for (const item of stats) {
    if (!/[-\s]/.test(item.name)) continue
    const bucket = byHyphen.get(hyphenSpacingKey(item.name)) ?? []
    bucket.push(item)
    byHyphen.set(hyphenSpacingKey(item.name), bucket)
  }
  for (const bucket of byHyphen.values()) {
    const unique = [...new Set(bucket.map((b) => b.name))]
    if (unique.length < 2) continue
    for (let i = 0; i < unique.length; i++) {
      for (let j = i + 1; j < unique.length; j++) {
        if (normName(unique[i]!) === normName(unique[j]!)) continue
        link(unique[i]!, unique[j]!, 'hyphen_spacing')
      }
    }
  }

  const byUrl = new Map<string, NameStats[]>()
  for (const item of stats) {
    for (const url of item.urls) {
      const key = normalizeUrl(url)
      if (!key) continue
      const bucket = byUrl.get(key) ?? []
      bucket.push(item)
      byUrl.set(key, bucket)
    }
  }
  for (const bucket of byUrl.values()) {
    const unique = [...new Map(bucket.map((b) => [b.name, b])).values()]
    if (unique.length < 2) continue
    for (let i = 0; i < unique.length; i++) {
      for (let j = i + 1; j < unique.length; j++) {
        link(unique[i]!.name, unique[j]!.name, 'shared_url')
      }
    }
  }

  for (const a of stats) {
    for (const b of stats) {
      if (a.name === b.name) continue
      const shorter = a.name.length <= b.name.length ? a : b
      const longer = a.name.length > b.name.length ? a : b
      const prefix = isNicknamePrefix(shorter.name, longer.name)
      const suffix = isNicknameSuffix(shorter.name, longer.name)
      if (!prefix && !suffix) continue

      const minCount = Math.min(shorter.count, longer.count)
      const total = shorter.count + longer.count
      const hasParenthetical = longer.name.includes('(')
      const shortIsSingleWord = normName(shorter.name).split(/\s+/).length === 1

      if (shortIsSingleWord && !hasParenthetical && minCount < 2 && total < 5) continue
      if (shortIsSingleWord && !prefix && suffix && total < 4) continue
      if (shortIsSingleWord && prefix && !hasParenthetical && longer.name.split(/\s+/).length > 3) {
        if (normName(shorter.name).length < 4 && total < 6) continue
      }

      link(shorter.name, longer.name, prefix ? 'nickname_prefix' : 'nickname_suffix')
    }
  }

  const grouped = uf.groups()
  const result: VariantGroup[] = []

  for (const names of grouped.values()) {
    if (names.length < 2) continue
    const variants = names.map((name) => byName.get(name)!).sort((a, b) => b.count - a.count)

    const reasons = new Set<MatchReason>()
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const key = pairKey(names[i]!, names[j]!)
        for (const r of reasonsByPair.get(key) ?? []) reasons.add(r)
      }
    }

    const reasonList = [...reasons]
    const confidence = confidenceForReasons(reasonList, variants)
    let note: string | undefined
    if (confidence === 'review') {
      note =
        'Same when diacritics removed — first names may differ (e.g. Tú vs Tự). Confirm before merging.'
    }

    result.push({
      reasons: reasonList.sort(),
      confidence,
      note,
      suggestedCanonical: pickCanonical(variants),
      variants,
      totalOccurrences: variants.reduce((sum, v) => sum + v.count, 0),
    })
  }

  return result.sort(
    (a, b) =>
      ({high: 0, medium: 1, review: 2}[a.confidence] - {high: 0, medium: 1, review: 2}[b.confidence]) ||
      b.totalOccurrences - a.totalOccurrences ||
      b.variants.length - a.variants.length,
  )
}

function detectVariantGroupsForAllPositions(occurrences: PersonOccurrence[]): VariantGroup[] {
  const byPosition = new Map<string, PersonOccurrence[]>()
  for (const occ of occurrences) {
    const bucket = byPosition.get(occ.positionKey) ?? []
    bucket.push(occ)
    byPosition.set(occ.positionKey, bucket)
  }

  const allGroups: VariantGroup[] = []
  for (const occs of byPosition.values()) {
    const byName = buildNameStats(occs)
    const groups = detectVariantGroups(byName)
    const position = positionFromOccurrence(occs[0]!)
    for (const group of groups) {
      allGroups.push({...group, position})
    }
  }

  return allGroups.sort(
    (a, b) =>
      ({high: 0, medium: 1, review: 2}[a.confidence] - {high: 0, medium: 1, review: 2}[b.confidence]) ||
      b.totalOccurrences - a.totalOccurrences ||
      formatPosition(a.position).localeCompare(formatPosition(b.position)) ||
      b.variants.length - a.variants.length,
  )
}

function formatGroup(group: VariantGroup, index: number): string {
  const lines: string[] = []
  lines.push(
    `${index + 1}. [${group.confidence.toUpperCase()}] ${formatPosition(group.position)} — ${group.reasons.join(' + ')}`,
  )
  lines.push(`   Suggested canonical: "${group.suggestedCanonical}"`)
  if (group.note) lines.push(`   ⚠ ${group.note}`)
  lines.push(`   ${group.totalOccurrences} slot(s), ${group.variants.length} spelling(s):`)
  for (const v of group.variants) {
    const urlNote = v.urls.length ? ` · ${v.urls.length} URL(s)` : ''
    lines.push(`   • "${v.name}" — ${v.count}× · ${v.entries.length} portfolio(s)${urlNote}`)
    const preview =
      v.entries.length <= 6
        ? v.entries.join(', ')
        : `${v.entries.slice(0, 5).join(', ')} … +${v.entries.length - 5} more`
    lines.push(`     ${preview}`)
  }
  return lines.join('\n')
}

async function main() {
  const jsonOut = process.argv.includes('--json')
  const client = getWriteClient()

  const docs = await client.fetch<PortfolioDoc[]>(`
    *[_type == "portfolioEntry" && defined(crewCredits) && count(crewCredits) > 0]{
      _id,
      title,
      "slug": slug.current,
      crewCredits[]{
        department,
        role,
        roleKey,
        people[]{ name, url, linkTitle }
      }
    }
  `)

  const occurrences: PersonOccurrence[] = []
  for (const doc of docs) {
    for (const credit of doc.crewCredits ?? []) {
      for (const person of credit.people ?? []) {
        const name = person.name?.trim()
        if (!name) continue
        const department = credit.department ?? ''
        const role = credit.role ?? ''
        const roleKey = credit.roleKey?.trim() || undefined
        occurrences.push({
          name,
          url: person.url?.trim() || undefined,
          entrySlug: doc.slug,
          department,
          role,
          roleKey,
          positionKey: buildPositionKey(department, role, roleKey),
        })
      }
    }
  }

  const byName = buildNameStats(occurrences)
  const groups = detectVariantGroupsForAllPositions(occurrences)

  const summary = {
    portfolioEntriesScanned: docs.length,
    uniqueNames: byName.size,
    personOccurrences: occurrences.length,
    variantGroups: groups.length,
    mergeRule: 'Names merge only within the same crew position (department + role).',
    byConfidence: {
      high: groups.filter((g) => g.confidence === 'high').length,
      medium: groups.filter((g) => g.confidence === 'medium').length,
      review: groups.filter((g) => g.confidence === 'review').length,
    },
    groups: groups.map((g) => ({
      position: g.position,
      positionLabel: formatPosition(g.position),
      reasons: g.reasons,
      confidence: g.confidence,
      note: g.note,
      suggestedCanonical: g.suggestedCanonical,
      totalOccurrences: g.totalOccurrences,
      variants: g.variants.map((v) => ({
        name: v.name,
        count: v.count,
        portfolioCount: v.entries.length,
        portfolios: v.entries,
        urls: v.urls,
      })),
    })),
  }

  if (jsonOut) {
    console.log(JSON.stringify(summary, null, 2))
    return
  }

  console.log('=== Crew name variant audit (crewCredits) ===\n')
  console.log(`Portfolio entries scanned: ${summary.portfolioEntriesScanned}`)
  console.log(`Unique person names:       ${summary.uniqueNames}`)
  console.log(`Total person slots:        ${summary.personOccurrences}`)
  console.log(`Merge rule:                ${summary.mergeRule}`)
  console.log(
    `Potential merge groups:    ${summary.variantGroups} (${summary.byConfidence.high} high · ${summary.byConfidence.medium} medium · ${summary.byConfidence.review} needs review)\n`,
  )

  if (!groups.length) {
    console.log('No likely duplicate name variants found.')
    return
  }

  for (let i = 0; i < groups.length; i++) {
    console.log(formatGroup(groups[i]!, i))
    console.log('')
  }

  console.log('---')
  console.log('Read-only audit. Tell me which groups to merge and the canonical spelling for each.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
