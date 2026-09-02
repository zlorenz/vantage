/**
 * Phase 1: link Casting / Stills / G&E crew credits to creditIdentity refs.
 *
 * Dry-run by default (all target departments). Apply requires explicit flags:
 *   npx tsx scripts/migration/audit/link-casting-stills-identities-dry-run.ts
 *   npx tsx scripts/migration/audit/link-casting-stills-identities-dry-run.ts --department ge
 *   npx tsx scripts/migration/audit/link-casting-stills-identities-dry-run.ts --apply --department stills
 *
 * Dataset backup required before any --apply run.
 */

import type {CrewCreditValue, CrewDepartmentKey} from '../../../shared/crew-credits'
import {
  buildIdentityDepartmentUsageFromCredits,
  CREW_ROLE_BY_KEY,
  formatIdentityLinkReviewMessage,
  formatMatchReasons,
  matchReasonsBetween,
  normName,
} from '../../../shared/crew-credits'
import {
  identityLinkPolicyForDepartments,
  resolveIdentityLinksOnCredits,
  type CreditIdentityDoc,
  type LinkedPersonPatch,
  type ReviewLinkPersonPatch,
} from '../../../sanity/components/crew-credits/sync-credit-identities'
import {getWriteClient} from '../lib/sanity-client'
import '../config'

const TARGET_DEPARTMENTS = ['stills', 'casting', 'ge', 'camera', 'art'] as const satisfies readonly CrewDepartmentKey[]

type TargetDepartment = (typeof TARGET_DEPARTMENTS)[number]

const APPLY = process.argv.includes('--apply')

function parseDepartmentArg(): TargetDepartment | null {
  const eq = process.argv.find((arg) => arg.startsWith('--department='))
  if (eq) return eq.split('=')[1]?.trim() as TargetDepartment
  const idx = process.argv.indexOf('--department')
  if (idx >= 0 && process.argv[idx + 1]) {
    return process.argv[idx + 1]!.trim() as TargetDepartment
  }
  return null
}

function creditsNeedLink(
  before: CrewCreditValue[] | undefined,
  after: CrewCreditValue[],
): boolean {
  const left = before ?? []
  if (left.length !== after.length) return true
  for (let i = 0; i < left.length; i++) {
    const lp = left[i]?.people ?? []
    const rp = after[i]?.people ?? []
    if (lp.length !== rp.length) return true
    for (let j = 0; j < lp.length; j++) {
      if ((lp[j]?.identity?._ref ?? '') !== (rp[j]?.identity?._ref ?? '')) {
        return true
      }
    }
  }
  return false
}

type ApplyDepartmentResult = {
  department: TargetDepartment
  identitiesCreated: number
  portfoliosPatched: number
  refsAdded: number
  reviewSlotsSkipped: number
  portfoliosSkipped: number
  errors: Array<{documentId: string; label: string; error: string}>
}

interface PortfolioDoc {
  _id: string
  title?: string
  slug?: string
  crewCredits?: CrewCreditValue[]
}

type UnlinkedSlot = {
  name: string
  roleKey: string
  roleLabel: string
  portfolioId: string
  portfolioLabel: string
}

type DepartmentDryRunReport = {
  department: TargetDepartment
  policyRoleKeys: string[]
  standardCreditRows: number
  peopleSlots: number
  distinctUnlinkedNames: number
  portfoliosWithScope: number
  wouldCreateIdentities: Array<{name: string; _id: string}>
  wouldMatchExisting: Array<{name: string; _id: string; identityName: string}>
  reviewQueue: ReviewLinkPersonPatch[]
  refsWouldAdd: number
  refsByRoleKey: Record<string, number>
  withinDepartmentVariantGroups: Array<{names: string[]; reasons: string[]}>
}

function portfolioLabel(doc: PortfolioDoc): string {
  return doc.slug || doc.title || doc._id
}

function roleLabel(roleKey: string, fallback?: string): string {
  return CREW_ROLE_BY_KEY.get(roleKey)?.role.label ?? fallback ?? roleKey
}

function collectScopedCredits(
  credits: CrewCreditValue[] | undefined,
  department: TargetDepartment,
): CrewCreditValue[] {
  return (credits ?? []).filter(
    (credit) => credit.department === department && !credit.isCustomRole && credit.roleKey,
  )
}

function findOriginalPerson(
  credits: CrewCreditValue[] | undefined,
  link: LinkedPersonPatch,
): {name: string; hadIdentity: boolean} | undefined {
  for (const credit of credits ?? []) {
    if (credit.roleKey !== link.roleKey) continue
    for (const person of credit.people ?? []) {
      const matchesKey = link.personKey && person._key === link.personKey
      const matchesName = person.name?.trim() === link.name
      if (!matchesKey && !matchesName) continue
      return {
        name: person.name?.trim() ?? link.name,
        hadIdentity: Boolean(person.identity?._ref),
      }
    }
  }
  return undefined
}

function collectUnlinkedSlots(
  docs: PortfolioDoc[],
  department: TargetDepartment,
  policyRoleKeys: ReadonlySet<string>,
): UnlinkedSlot[] {
  const slots: UnlinkedSlot[] = []
  for (const doc of docs) {
    for (const credit of collectScopedCredits(doc.crewCredits, department)) {
      if (!credit.roleKey || !policyRoleKeys.has(credit.roleKey)) continue
      for (const person of credit.people ?? []) {
        const name = person.name?.trim()
        if (!name || person.identity?._ref) continue
        slots.push({
          name,
          roleKey: credit.roleKey,
          roleLabel: roleLabel(credit.roleKey, credit.role),
          portfolioId: doc._id,
          portfolioLabel: portfolioLabel(doc),
        })
      }
    }
  }
  return slots
}

function findVariantGroups(names: string[]): Array<{names: string[]; reasons: string[]}> {
  const unique = [...new Set(names.map((name) => name.trim()).filter(Boolean))]
  const groups: Array<{names: string[]; reasons: string[]}> = []
  const seen = new Set<string>()

  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      const left = unique[i]!
      const right = unique[j]!
      if (normName(left) === normName(right)) continue
      const reasons = matchReasonsBetween(left, right)
      if (!reasons.length) continue

      const key = [left, right].sort().join('|')
      if (seen.has(key)) continue
      seen.add(key)

      const existing = groups.find(
        (group) => group.names.includes(left) || group.names.includes(right),
      )
      if (existing) {
        if (!existing.names.includes(left)) existing.names.push(left)
        if (!existing.names.includes(right)) existing.names.push(right)
        for (const reason of reasons) {
          if (!existing.reasons.includes(reason)) existing.reasons.push(reason)
        }
        existing.names.sort((a, b) => a.localeCompare(b))
      } else {
        groups.push({
          names: [left, right].sort((a, b) => a.localeCompare(b)),
          reasons: [...reasons],
        })
      }
    }
  }

  return groups.sort((a, b) => a.names[0]!.localeCompare(b.names[0]!))
}

function dryRunDepartment(
  department: TargetDepartment,
  docs: PortfolioDoc[],
  liveIdentities: CreditIdentityDoc[],
  identityDepartmentsById: ReadonlyMap<string, ReadonlySet<CrewDepartmentKey>>,
): DepartmentDryRunReport {
  const policy = identityLinkPolicyForDepartments([department])
  const existing = [...liveIdentities]
  const initialLiveIds = new Set(liveIdentities.map((row) => row._id))
  const reviewQueue: ReviewLinkPersonPatch[] = []

  const resolutionByNormName = new Map<
    string,
    {
      kind: 'existing' | 'new'
      identityId: string
      identityName: string
      slotNames: Set<string>
    }
  >()
  const refsByRoleKey: Record<string, number> = {}
  let refsWouldAdd = 0

  const portfoliosWithScope = new Set<string>()
  let standardCreditRows = 0
  let peopleSlots = 0

  for (const doc of docs) {
    const scopedCredits = collectScopedCredits(doc.crewCredits, department)
    if (!scopedCredits.length) continue

    standardCreditRows += scopedCredits.filter((credit) =>
      credit.roleKey ? policy.roleKeys.has(credit.roleKey) : false,
    ).length
    peopleSlots += scopedCredits.reduce(
      (sum, credit) =>
        credit.roleKey && policy.roleKeys.has(credit.roleKey)
          ? sum + (credit.people?.length ?? 0)
          : sum,
      0,
    )

    const resolved = resolveIdentityLinksOnCredits(doc.crewCredits, existing, policy, {
      identityDepartmentsById,
      portfolioId: doc._id,
      portfolioLabel: portfolioLabel(doc),
    })

    for (const review of resolved.reviewLinks) {
      if (review.department !== department) continue
      reviewQueue.push(review)
    }

    let docTouched = false
    for (const created of resolved.createIdentities) {
      existing.push({_id: created._id, name: created.name, url: created.url})
      docTouched = true
    }

    for (const link of resolved.links) {
      const original = findOriginalPerson(doc.crewCredits, link)
      if (original?.hadIdentity) continue

      docTouched = true
      refsWouldAdd += 1
      refsByRoleKey[link.roleKey] = (refsByRoleKey[link.roleKey] ?? 0) + 1

      const norm = normName(link.name)
      const identityName =
        liveIdentities.find((row) => row._id === link.identityId)?.name ??
        existing.find((row) => row._id === link.identityId)?.name ??
        link.name
      const kind = initialLiveIds.has(link.identityId) ? 'existing' : 'new'
      const current = resolutionByNormName.get(norm)
      if (!current) {
        resolutionByNormName.set(norm, {
          kind,
          identityId: link.identityId,
          identityName,
          slotNames: new Set([link.name]),
        })
      } else {
        current.slotNames.add(link.name)
        if (current.kind !== kind && kind === 'existing') {
          resolutionByNormName.set(norm, {
            kind: 'existing',
            identityId: link.identityId,
            identityName,
            slotNames: current.slotNames,
          })
        }
      }
    }

    if (docTouched) portfoliosWithScope.add(doc._id)
  }

  const unlinkedNames = collectUnlinkedSlots(docs, department, policy.roleKeys).map(
    (slot) => slot.name,
  )

  const wouldCreateIdentities = [...resolutionByNormName.values()]
    .filter((row) => row.kind === 'new')
    .map((row) => ({_id: row.identityId, name: row.identityName}))
    .sort((a, b) => a.name.localeCompare(b.name))

  const wouldMatchExisting = [...resolutionByNormName.values()]
    .filter((row) => row.kind === 'existing')
    .map((row) => ({
      _id: row.identityId,
      name: [...row.slotNames][0] ?? row.identityName,
      identityName: row.identityName,
    }))
    .sort((a, b) => a.identityName.localeCompare(b.identityName))

  return {
    department,
    policyRoleKeys: [...policy.roleKeys].sort(),
    standardCreditRows,
    peopleSlots,
    distinctUnlinkedNames: new Set(unlinkedNames.map(normName)).size,
    portfoliosWithScope: portfoliosWithScope.size,
    wouldCreateIdentities,
    wouldMatchExisting,
    reviewQueue,
    refsWouldAdd,
    refsByRoleKey,
    withinDepartmentVariantGroups: findVariantGroups(unlinkedNames),
  }
}

function findCrossDepartmentVariantGroups(
  castingNames: string[],
  stillsNames: string[],
): Array<{castingName: string; stillsName: string; reasons: string[]}> {
  const out: Array<{castingName: string; stillsName: string; reasons: string[]}> = []
  const castingUnique = [...new Set(castingNames.map((name) => name.trim()).filter(Boolean))]
  const stillsUnique = [...new Set(stillsNames.map((name) => name.trim()).filter(Boolean))]

  for (const castingName of castingUnique) {
    for (const stillsName of stillsUnique) {
      if (normName(castingName) === normName(stillsName)) continue
      const reasons = matchReasonsBetween(castingName, stillsName)
      if (!reasons.length) continue
      out.push({castingName, stillsName, reasons})
    }
  }

  return out.sort((a, b) => a.castingName.localeCompare(b.castingName))
}

function printDepartmentReport(report: DepartmentDryRunReport) {
  const title = report.department.toUpperCase()
  console.log('')
  console.log('='.repeat(72))
  console.log(`${title} — identity link dry-run (Phase 1)`)
  console.log('='.repeat(72))
  console.log(`Role keys in scope: ${report.policyRoleKeys.join(', ')}`)
  console.log(`Standard credit rows scanned: ${report.standardCreditRows}`)
  console.log(`People slots scanned: ${report.peopleSlots}`)
  console.log(`Distinct unlinked names: ${report.distinctUnlinkedNames}`)
  console.log(`Portfolios with linkable slots: ${report.portfoliosWithScope}`)
  console.log('')

  console.log(
    `Would CREATE ${report.wouldCreateIdentities.length} new creditIdentity document(s):`,
  )
  if (!report.wouldCreateIdentities.length) {
    console.log('  (none)')
  } else {
    for (const row of report.wouldCreateIdentities) {
      console.log(`  • ${row.name}`)
    }
  }
  console.log('')

  console.log(
    `Would MATCH ${report.wouldMatchExisting.length} existing creditIdentity document(s) by normalized name:`,
  )
  if (!report.wouldMatchExisting.length) {
    console.log('  (none)')
  } else {
    for (const row of report.wouldMatchExisting) {
      console.log(`  • ${row.identityName} ← slot name "${row.name}" (${row._id})`)
    }
  }
  console.log('')

  console.log(`REVIEW QUEUE (${report.reviewQueue.length} slot(s) — not linked, not created):`)
  if (!report.reviewQueue.length) {
    console.log('  (none)')
  } else {
    for (const row of report.reviewQueue) {
      const candidateDepts =
        row.candidateIdentityDepartments.length > 0
          ? row.candidateIdentityDepartments.join(', ')
          : '(no linked usage yet)'
      const reviewNote = formatIdentityLinkReviewMessage(row.reviewReason, {
        slotName: row.name,
        candidateName: row.candidateIdentityName,
        candidateDepartments: row.candidateIdentityDepartments,
      })
      console.log(
        `  • "${row.name}" [${row.department}/${row.roleKey}] on ${row.portfolioLabel ?? row.portfolioId ?? '?'} ` +
          `→ candidate "${row.candidateIdentityName}" (${row.candidateIdentityId}, depts: ${candidateDepts})`,
      )
      console.log(`      ${reviewNote}`)
    }
  }
  console.log('')

  console.log(`Would ADD ${report.refsWouldAdd} crewPerson.identity ref(s):`)
  const roleKeys = Object.keys(report.refsByRoleKey).sort()
  if (!roleKeys.length) {
    console.log('  (none)')
  } else {
    for (const roleKey of roleKeys) {
      console.log(`  • ${roleLabel(roleKey)} [${roleKey}]: ${report.refsByRoleKey[roleKey]}`)
    }
  }
  console.log('')

  console.log('Within-department spelling variant groups (review — not auto-merged):')
  if (!report.withinDepartmentVariantGroups.length) {
    console.log('  (none flagged)')
  } else {
    for (const group of report.withinDepartmentVariantGroups) {
      console.log(`  • ${group.names.join(' / ')} — ${formatMatchReasons(group.reasons)}`)
    }
  }
}

async function applyDepartment(
  department: TargetDepartment,
  docs: PortfolioDoc[],
  liveIdentities: CreditIdentityDoc[],
  identityDepartmentsById: ReadonlyMap<string, ReadonlySet<CrewDepartmentKey>>,
): Promise<ApplyDepartmentResult> {
  const client = getWriteClient()
  const policy = identityLinkPolicyForDepartments([department])
  const existing = [...liveIdentities]

  let identitiesCreated = 0
  let portfoliosPatched = 0
  let refsAdded = 0
  let reviewSlotsSkipped = 0
  let portfoliosSkipped = 0
  const errors: ApplyDepartmentResult['errors'] = []

  console.log('')
  console.log('='.repeat(72))
  console.log(`${department.toUpperCase()} — identity link APPLY (live writes)`)
  console.log('='.repeat(72))

  for (const doc of docs) {
    const scopedCredits = collectScopedCredits(doc.crewCredits, department)
    if (!scopedCredits.length) continue

    const hasUnlinked = scopedCredits.some(
      (credit) =>
        credit.roleKey &&
        policy.roleKeys.has(credit.roleKey) &&
        (credit.people ?? []).some((person) => person.name?.trim() && !person.identity?._ref),
    )
    if (!hasUnlinked) continue

    const label = portfolioLabel(doc)
    const resolved = resolveIdentityLinksOnCredits(doc.crewCredits, existing, policy, {
      identityDepartmentsById,
      portfolioId: doc._id,
      portfolioLabel: label,
    })

    reviewSlotsSkipped += resolved.reviewLinks.filter(
      (review) => review.department === department,
    ).length

    for (const created of resolved.createIdentities) {
      existing.push({_id: created._id, name: created.name, url: created.url})
    }

    const newRefs = resolved.links.filter((link) => {
      const original = findOriginalPerson(doc.crewCredits, link)
      return !original?.hadIdentity
    }).length

    if (!creditsNeedLink(doc.crewCredits, resolved.nextCredits)) {
      portfoliosSkipped += 1
      continue
    }

    try {
      for (const identity of resolved.createIdentities) {
        await client.createIfNotExists(identity)
        identitiesCreated += 1
      }
      await client
        .patch(doc._id)
        .set({crewCredits: resolved.nextCredits})
        .commit({returnDocuments: false})

      portfoliosPatched += 1
      refsAdded += newRefs
      console.log(
        `PATCH ${label} — create=${resolved.createIdentities.length} refsAdded=${newRefs}`,
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push({documentId: doc._id, label, error: message})
      console.error(`ERROR ${label} (${doc._id}): ${message}`)
    }
  }

  console.log('')
  console.log(
    `Apply complete: identitiesCreated=${identitiesCreated}, portfoliosPatched=${portfoliosPatched}, refsAdded=${refsAdded}, reviewSkipped=${reviewSlotsSkipped}, skipped=${portfoliosSkipped}, errors=${errors.length}`,
  )

  return {
    department,
    identitiesCreated,
    portfoliosPatched,
    refsAdded,
    reviewSlotsSkipped,
    portfoliosSkipped,
    errors,
  }
}

async function main() {
  const applyDepartmentArg = parseDepartmentArg()

  if (APPLY) {
    if (!applyDepartmentArg || !TARGET_DEPARTMENTS.includes(applyDepartmentArg)) {
      console.error(
        'Apply requires exactly one --department stills|casting|ge|camera|art (one department per run).',
      )
      process.exit(1)
    }
  }

  const client = getWriteClient()
  const [liveIdentities, docs] = await Promise.all([
    client.fetch<CreditIdentityDoc[]>(`*[_type == "creditIdentity"]{ _id, name, url }`),
    client.fetch<PortfolioDoc[]>(
      `*[_type == "portfolioEntry" && defined(crewCredits) && count(crewCredits) > 0 && !(_id in path("drafts.**"))]{
        _id,
        title,
        "slug": slug.current,
        crewCredits
      }`,
    ),
  ])

  const identityDepartmentsById = buildIdentityDepartmentUsageFromCredits(docs ?? [])

  if (APPLY) {
    console.log('creditIdentity linking APPLY — live production dataset')
    console.log(`Department scope: ${applyDepartmentArg}`)
    console.log(`Live creditIdentity documents (before): ${(liveIdentities ?? []).length}`)
    console.log(`Portfolio documents scanned: ${(docs ?? []).length}`)

    const result = await applyDepartment(
      applyDepartmentArg!,
      docs ?? [],
      liveIdentities ?? [],
      identityDepartmentsById,
    )
    if (result.errors.length) {
      process.exit(1)
    }
    return
  }

  const dryRunDepartmentArg = parseDepartmentArg()
  if (process.argv.includes('--department')) {
    if (!dryRunDepartmentArg || !TARGET_DEPARTMENTS.includes(dryRunDepartmentArg)) {
      console.error(
        'Dry-run --department must be one of: stills, casting, ge, camera, art (or omit for all departments).',
      )
      process.exit(1)
    }
  }

  console.log('creditIdentity linking dry-run — Casting / Stills / G&E (Phase 1)')
  console.log(`Live creditIdentity documents: ${(liveIdentities ?? []).length}`)
  console.log(`Portfolio documents scanned: ${(docs ?? []).length}`)
  console.log('Mode: DRY RUN ONLY — no writes performed')

  const departmentsToRun = dryRunDepartmentArg
    ? [dryRunDepartmentArg]
    : [...TARGET_DEPARTMENTS]

  for (const department of departmentsToRun) {
    printDepartmentReport(
      dryRunDepartment(department, docs ?? [], liveIdentities ?? [], identityDepartmentsById),
    )
  }

  if (!dryRunDepartmentArg) {
    const castingNames = collectUnlinkedSlots(
      docs ?? [],
      'casting',
      identityLinkPolicyForDepartments(['casting']).roleKeys,
    ).map((slot) => slot.name)
    const stillsNames = collectUnlinkedSlots(
      docs ?? [],
      'stills',
      identityLinkPolicyForDepartments(['stills']).roleKeys,
    ).map((slot) => slot.name)
    const crossDepartment = findCrossDepartmentVariantGroups(castingNames, stillsNames)

    console.log('')
    console.log('='.repeat(72))
    console.log('CROSS-DEPARTMENT spelling variant flags (Casting ↔ Stills)')
    console.log('='.repeat(72))
    if (!crossDepartment.length) {
      console.log('(none flagged)')
    } else {
      for (const row of crossDepartment) {
        console.log(
          `  • Casting "${row.castingName}" ↔ Stills "${row.stillsName}" — ${formatMatchReasons(row.reasons)}`,
        )
      }
    }
  }

  console.log('')
  console.log('Dry-run complete. No creditIdentity documents created, no portfolio patches written.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
