/**
 * Read-only inventory of distinct crew roles in Sanity portfolio crewCredits.
 *
 *   npx tsx scripts/migration/audit/crew-role-inventory.ts
 *
 * Writes migration-data/crew-role-inventory.json
 * Requires SANITY_API_WRITE_TOKEN or SANITY_API_TOKEN in .env.local.
 */

import fs from 'node:fs'
import path from 'node:path'
import {
  CREW_ROLE_BY_KEY,
  CREW_ROLES_FLAT,
  normalizeCreditToken,
  resolveStandardRole,
} from '../../../shared/crew-credits'
import {getWriteClient} from '../lib/sanity-client'
import {PATHS} from '../config'
import '../config'

interface CreditRow {
  department?: string
  role?: string
  roleKey?: string
  isCustomRole?: boolean
  people?: {name?: string}[]
}

interface PortfolioDoc {
  _id: string
  title?: string
  slug: string
  crewCredits?: CreditRow[]
}

interface RoleAgg {
  roleKey: string | null
  roleLabel: string
  isCustomRole: boolean
  department: string
  occurrenceCount: number
  entryIds: Set<string>
  sampleNames: string[]
  catalogLabel: string | null
  labelMatchesCatalog: boolean | null
  resolvedFromLabel: string | null
}

function jaccardTokens(a: string, b: string): number {
  const ta = new Set(a.split(' ').filter(Boolean))
  const tb = new Set(b.split(' ').filter(Boolean))
  if (ta.size === 0 || tb.size === 0) return 0
  let inter = 0
  for (const t of ta) if (tb.has(t)) inter++
  const union = ta.size + tb.size - inter
  return union === 0 ? 0 : inter / union
}

function shareToken(a: string, b: string): boolean {
  const ta = a.split(' ').filter((t) => t.length >= 3)
  const tb = new Set(b.split(' ').filter((t) => t.length >= 3))
  return ta.some((t) => tb.has(t))
}

function aggKey(row: {
  department: string
  roleKey: string | null
  roleLabel: string
  isCustomRole: boolean
}): string {
  if (!row.isCustomRole && row.roleKey) {
    return `std|${row.department}|${row.roleKey}|${normalizeCreditToken(row.roleLabel)}`
  }
  return `custom|${row.department}|${normalizeCreditToken(row.roleLabel) || '(empty)'}`
}

async function main() {
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
        isCustomRole,
        people[]{ name }
      }
    }
  `)

  const byKey = new Map<string, RoleAgg>()
  let totalCreditRows = 0
  let docsWithOnline = 0
  let docsWithVfx = 0
  let docsWithBothOnlineVfx = 0
  let docsWithEitherOnlineVfx = 0
  let docsWithOnlineOnly = 0
  let docsWithVfxOnly = 0

  for (const doc of docs) {
    const roleKeysInDoc = new Set<string>()
    const labelsInDoc = new Set<string>()

    for (const credit of doc.crewCredits ?? []) {
      totalCreditRows++
      const department = (credit.department ?? '').trim() || '(none)'
      const roleLabel = (credit.role ?? '').trim()
      const roleKey = credit.roleKey?.trim() || null
      // Treat as custom if flagged, or if no roleKey (legacy / freeform)
      const isCustomRole =
        credit.isCustomRole === true || (!roleKey && Boolean(roleLabel))

      const catalog = roleKey ? CREW_ROLE_BY_KEY.get(roleKey) : undefined
      const catalogLabel = catalog?.role.label ?? null
      const labelMatchesCatalog =
        catalogLabel == null
          ? null
          : normalizeCreditToken(roleLabel) === normalizeCreditToken(catalogLabel) ||
            normalizeCreditToken(roleLabel) ===
              normalizeCreditToken(catalog.role.pluralLabel)

      const resolved = resolveStandardRole(roleLabel)
      const resolvedFromLabel = resolved
        ? `${resolved.departmentKey}:${resolved.role.key}`
        : null

      const key = aggKey({department, roleKey, roleLabel, isCustomRole})
      let agg = byKey.get(key)
      if (!agg) {
        agg = {
          roleKey: isCustomRole ? null : roleKey,
          roleLabel: roleLabel || '(empty)',
          isCustomRole,
          department,
          occurrenceCount: 0,
          entryIds: new Set(),
          sampleNames: [],
          catalogLabel,
          labelMatchesCatalog,
          resolvedFromLabel,
        }
        byKey.set(key, agg)
      }
      agg.occurrenceCount++
      agg.entryIds.add(doc._id)

      for (const person of credit.people ?? []) {
        const name = person.name?.trim()
        if (!name) continue
        if (agg.sampleNames.length < 3 && !agg.sampleNames.includes(name)) {
          agg.sampleNames.push(name)
        }
      }

      if (roleKey) roleKeysInDoc.add(roleKey)
      if (roleLabel) labelsInDoc.add(normalizeCreditToken(roleLabel))
    }

    const hasOnline =
      roleKeysInDoc.has('online') || labelsInDoc.has(normalizeCreditToken('online'))
    const hasVfx =
      roleKeysInDoc.has('vfx') ||
      labelsInDoc.has(normalizeCreditToken('vfx')) ||
      labelsInDoc.has(normalizeCreditToken('visual effects'))

    if (hasOnline) docsWithOnline++
    if (hasVfx) docsWithVfx++
    if (hasOnline && hasVfx) docsWithBothOnlineVfx++
    if (hasOnline || hasVfx) docsWithEitherOnlineVfx++
    if (hasOnline && !hasVfx) docsWithOnlineOnly++
    if (hasVfx && !hasOnline) docsWithVfxOnly++
  }

  const allRoles = [...byKey.values()].map((a) => ({
    roleKey: a.roleKey,
    roleLabel: a.roleLabel,
    isCustomRole: a.isCustomRole,
    department: a.department,
    occurrenceCount: a.occurrenceCount,
    entryCount: a.entryIds.size,
    sampleNames: a.sampleNames,
    catalogLabel: a.catalogLabel,
    labelMatchesCatalog: a.labelMatchesCatalog,
    resolvedFromLabel: a.resolvedFromLabel,
  }))

  allRoles.sort(
    (a, b) =>
      b.occurrenceCount - a.occurrenceCount ||
      a.department.localeCompare(b.department) ||
      a.roleLabel.localeCompare(b.roleLabel),
  )

  const customRoles = allRoles.filter((r) => r.isCustomRole)
  const standardRoles = allRoles.filter((r) => !r.isCustomRole)

  // Aggregate standard by roleKey across label variants
  const standardByRoleKey = new Map<
    string,
    {
      roleKey: string
      catalogLabel: string | null
      department: string
      occurrenceCount: number
      entryCount: number
      labelVariants: {label: string; occurrenceCount: number; entryCount: number}[]
    }
  >()
  for (const r of standardRoles) {
    const rk = r.roleKey || '(missing)'
    const catalog = CREW_ROLE_BY_KEY.get(rk)
    const dept = catalog?.departmentKey ?? r.department
    let bucket = standardByRoleKey.get(rk)
    if (!bucket) {
      bucket = {
        roleKey: rk,
        catalogLabel: catalog?.role.label ?? r.catalogLabel,
        department: dept,
        occurrenceCount: 0,
        entryCount: 0,
        labelVariants: [],
      }
      standardByRoleKey.set(rk, bucket)
    }
    bucket.occurrenceCount += r.occurrenceCount
    // entryCount can't simply sum — approximate via max of variants later; recompute below
    bucket.labelVariants.push({
      label: r.roleLabel,
      occurrenceCount: r.occurrenceCount,
      entryCount: r.entryCount,
    })
  }

  // Recompute entry counts for standard roleKeys from raw docs
  const stdEntrySets = new Map<string, Set<string>>()
  for (const doc of docs) {
    for (const credit of doc.crewCredits ?? []) {
      const roleKey = credit.roleKey?.trim()
      const isCustom =
        credit.isCustomRole === true || (!roleKey && Boolean(credit.role?.trim()))
      if (isCustom || !roleKey) continue
      const set = stdEntrySets.get(roleKey) ?? new Set()
      set.add(doc._id)
      stdEntrySets.set(roleKey, set)
    }
  }
  for (const [rk, bucket] of standardByRoleKey) {
    bucket.entryCount = stdEntrySets.get(rk)?.size ?? 0
    bucket.labelVariants.sort((a, b) => b.occurrenceCount - a.occurrenceCount)
  }

  const unexpectedLabels = standardRoles.filter((r) => r.labelMatchesCatalog === false)

  // Near-duplicate groups within same department
  type DupMember = {
    roleKey: string | null
    roleLabel: string
    isCustomRole: boolean
    occurrenceCount: number
    entryCount: number
    normalized: string
  }
  const byDept = new Map<string, DupMember[]>()
  for (const r of allRoles) {
    const list = byDept.get(r.department) ?? []
    list.push({
      roleKey: r.roleKey,
      roleLabel: r.roleLabel,
      isCustomRole: r.isCustomRole,
      occurrenceCount: r.occurrenceCount,
      entryCount: r.entryCount,
      normalized: normalizeCreditToken(r.roleLabel),
    })
    byDept.set(r.department, list)
  }

  const synonymGroups: {
    department: string
    reason: string
    members: DupMember[]
  }[] = []

  for (const [department, members] of byDept) {
    // Union-find by close normalized tokens
    const parent = new Map<string, string>()
    const find = (x: string): string => {
      const p = parent.get(x) ?? x
      if (p !== x) {
        const r = find(p)
        parent.set(x, r)
        return r
      }
      parent.set(x, x)
      return x
    }
    const union = (a: string, b: string) => {
      const ra = find(a)
      const rb = find(b)
      if (ra !== rb) parent.set(ra, rb)
    }

    const ids = members.map((_, i) => String(i))
    for (const id of ids) find(id)

    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const a = members[i]!
        const b = members[j]!
        if (!a.normalized || !b.normalized) continue
        if (a.normalized === b.normalized) {
          union(String(i), String(j))
          continue
        }
        // one contains the other as whole-token phrase
        if (
          a.normalized.includes(b.normalized) ||
          b.normalized.includes(a.normalized)
        ) {
          union(String(i), String(j))
          continue
        }
        const jac = jaccardTokens(a.normalized, b.normalized)
        if (jac >= 0.5 || (jac >= 0.33 && shareToken(a.normalized, b.normalized))) {
          union(String(i), String(j))
        }
      }
    }

    const groups = new Map<string, number[]>()
    for (let i = 0; i < members.length; i++) {
      const root = find(String(i))
      const list = groups.get(root) ?? []
      list.push(i)
      groups.set(root, list)
    }

    for (const idxs of groups.values()) {
      if (idxs.length < 2) continue
      const groupMembers = idxs.map((i) => members[i]!)
      // Skip if all are identical roleKey standards with same label
      const uniqueKeys = new Set(
        groupMembers.map((m) =>
          m.isCustomRole ? `c:${m.normalized}` : `s:${m.roleKey}:${m.normalized}`,
        ),
      )
      if (uniqueKeys.size < 2) continue

      synonymGroups.push({
        department,
        reason: 'same department; close normalizeCreditToken / shared tokens',
        members: groupMembers.sort((a, b) => b.occurrenceCount - a.occurrenceCount),
      })
    }
  }

  synonymGroups.sort((a, b) => {
    const sa = a.members.reduce((n, m) => n + m.occurrenceCount, 0)
    const sb = b.members.reduce((n, m) => n + m.occurrenceCount, 0)
    return sb - sa
  })

  // Interest keyword clusters for planning
  const interestPatterns: {name: string; pattern: RegExp}[] = [
    {name: 'sound', pattern: /\b(sound|boom|mixer|audio|recordist|dialogue|adr|foley)\b/i},
    {
      name: 'lighting_electric',
      pattern: /\b(gaffer|spark|electric|lighting|best boy|lamp|rigging gaffer)\b/i,
    },
    {name: 'grip', pattern: /\b(grip|key grip|dolly|crane)\b/i},
    {
      name: 'post_online_vfx',
      pattern: /\b(online|offline|vfx|visual effects|composit|finish|grade|color|colour|editor|edit)\b/i,
    },
    {
      name: 'producer_variants',
      pattern: /\b(producer|producing|ep\b|executive|line producer|production manager|pm\b)\b/i,
    },
  ]

  const interestClusters = interestPatterns.map(({name, pattern}) => ({
    cluster: name,
    roles: allRoles.filter(
      (r) =>
        pattern.test(r.roleLabel) ||
        (r.roleKey && pattern.test(r.roleKey.replace(/_/g, ' '))),
    ),
  }))

  const catalogUnused = CREW_ROLES_FLAT.filter(
    (e) => !standardByRoleKey.has(e.role.key),
  ).map((e) => ({
    department: e.departmentKey,
    roleKey: e.role.key,
    label: e.role.label,
  }))

  const report = {
    generatedAt: new Date().toISOString(),
    source: 'sanity',
    totals: {
      portfolioDocsWithCredits: docs.length,
      totalCreditRows,
      distinctRoleAggregates: allRoles.length,
      distinctCustomRoles: customRoles.length,
      distinctStandardRoleKeys: standardByRoleKey.size,
      catalogRoleCount: CREW_ROLES_FLAT.length,
      unusedCatalogRoles: catalogUnused.length,
    },
    onlineVsVfx: {
      docsWithOnline,
      docsWithVfx,
      docsWithBoth: docsWithBothOnlineVfx,
      docsWithEither: docsWithEitherOnlineVfx,
      docsWithOnlineOnly,
      docsWithVfxOnly,
      docsWithNeither: docs.length - docsWithEitherOnlineVfx,
    },
    customRoles,
    standardRolesByKey: [...standardByRoleKey.values()].sort(
      (a, b) => b.occurrenceCount - a.occurrenceCount,
    ),
    standardRolesUnexpectedLabels: unexpectedLabels,
    synonymGroups,
    interestClusters,
    unusedCatalogRoles: catalogUnused,
    allRoleAggregates: allRoles,
  }

  const outPath = path.join(PATHS.migrationData, 'crew-role-inventory.json')
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2))

  // Console summary
  console.log('=== Crew role inventory (read-only) ===')
  console.log(JSON.stringify(report.totals, null, 2))
  console.log('\n--- online vs vfx ---')
  console.log(JSON.stringify(report.onlineVsVfx, null, 2))

  console.log(`\n--- Custom roles (all ${customRoles.length}) ---`)
  for (const r of customRoles) {
    console.log(
      `${String(r.occurrenceCount).padStart(4)} rows | ${String(r.entryCount).padStart(3)} docs | [${r.department}] ${r.roleLabel}` +
        (r.resolvedFromLabel ? `  (resolves→ ${r.resolvedFromLabel})` : '') +
        (r.sampleNames.length ? `  e.g. ${r.sampleNames.join(', ')}` : ''),
    )
  }

  console.log(`\n--- Standard roles by roleKey (${standardByRoleKey.size}) ---`)
  for (const r of report.standardRolesByKey) {
    const variants =
      r.labelVariants.length > 1
        ? `  labels: ${r.labelVariants.map((v) => `${v.label}×${v.occurrenceCount}`).join('; ')}`
        : r.labelVariants[0]
          ? `  label: ${r.labelVariants[0].label}`
          : ''
    console.log(
      `${String(r.occurrenceCount).padStart(4)} rows | ${String(r.entryCount).padStart(3)} docs | [${r.department}] ${r.roleKey} (${r.catalogLabel})${variants}`,
    )
  }

  console.log(
    `\n--- Unexpected labels on standard roles (${unexpectedLabels.length}) ---`,
  )
  for (const r of unexpectedLabels) {
    console.log(
      `${String(r.occurrenceCount).padStart(4)} | [${r.department}] key=${r.roleKey} catalog="${r.catalogLabel}" stored="${r.roleLabel}"`,
    )
  }

  console.log(`\n--- Synonym / near-duplicate groups (${synonymGroups.length}) ---`)
  for (const g of synonymGroups) {
    console.log(`\n[${g.department}]`)
    for (const m of g.members) {
      console.log(
        `  ${m.occurrenceCount}× ${m.isCustomRole ? 'CUSTOM' : 'STD:' + m.roleKey} "${m.roleLabel}" (norm=${m.normalized})`,
      )
    }
  }

  console.log('\n--- Interest clusters ---')
  for (const c of interestClusters) {
    console.log(`\n# ${c.cluster} (${c.roles.length})`)
    for (const r of c.roles) {
      console.log(
        `  ${r.occurrenceCount}× [${r.department}] ${r.isCustomRole ? 'CUSTOM' : r.roleKey} "${r.roleLabel}"`,
      )
    }
  }

  console.log(`\nWrote ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
