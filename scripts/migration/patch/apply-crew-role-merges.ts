/**
 * Apply approved crew-role synonym merges across portfolio crewCredits.
 *
 * Hand-coded rules from the locked QC matrix (see plan).
 * Dry-run by default:
 *   npx tsx scripts/migration/patch/apply-crew-role-merges.ts
 *   npx tsx scripts/migration/patch/apply-crew-role-merges.ts --apply
 *
 * Requires SANITY_API_WRITE_TOKEN or SANITY_API_TOKEN in .env.local for --apply.
 */

import {
  CREW_ROLE_BY_KEY,
  creditIdentityKey,
  normalizeCreditToken,
  resolveCustomRoleCanonical,
  type CrewCreditValue,
  type CrewDepartmentKey,
  type CrewPersonValue,
} from '../../../shared/crew-credits'
import {getWriteClient} from '../lib/sanity-client'
import '../config'

interface PortfolioDoc {
  _id: string
  title?: string
  slug: string
  crewCredits?: CrewCreditValue[]
}

type MergeTarget =
  | {kind: 'standard'; roleKey: string}
  | {kind: 'custom'; role: string}

interface LabelRule {
  /** Match when normalizeCreditToken(credit.role) is in this set. */
  fromLabels: string[]
  /** Optional department constraint. */
  department?: CrewDepartmentKey
  target: MergeTarget
}

/** Curated remap rules (custom labels → standard or canonical custom). */
const LABEL_RULES: LabelRule[] = [
  // Promotions / synonym → standard
  {fromLabels: ['catering'], target: {kind: 'standard', roleKey: 'catering'}},
  {
    fromLabels: ['creative director', 'cd'],
    target: {kind: 'standard', roleKey: 'creative_director'},
  },
  {
    fromLabels: ['soundman', 'sound man', 'sound recorder'],
    department: 'production',
    target: {kind: 'standard', roleKey: 'sound_recordist'},
  },
  {
    fromLabels: ['sound engineer'],
    department: 'post',
    target: {kind: 'standard', roleKey: 'sound_design_mix'},
  },
  {
    fromLabels: ['sound engineer'],
    department: 'production',
    target: {kind: 'standard', roleKey: 'sound_recordist'},
  },
  {
    fromLabels: ['post producer', 'post-producer'],
    target: {kind: 'standard', roleKey: 'post_supervisor'},
  },
  {
    fromLabels: ['post house', 'post facility'],
    target: {kind: 'standard', roleKey: 'post_house'},
  },
  {
    fromLabels: ['wardrobe assistant', 'wardrobe asst', 'costume assistant'],
    target: {kind: 'standard', roleKey: 'wardrobe_assistant'},
  },
  {
    fromLabels: ['camera assistants', 'camera assistant', 'cam assistants'],
    target: {kind: 'standard', roleKey: 'camera_assistants'},
  },
  {
    fromLabels: ['grip and lighting', 'grip & lighting'],
    target: {kind: 'standard', roleKey: 'rental_house'},
  },
  {
    fromLabels: ['runner', 'runners'],
    target: {kind: 'standard', roleKey: 'pa'},
  },
  {
    fromLabels: [
      'motion graphic artist',
      'motion graphics artist',
      'motion graphics',
      'motion graphic',
      'graphic design',
      'gfx',
    ],
    target: {kind: 'standard', roleKey: 'motion_graphics'},
  },
  // Custom → custom
  {
    fromLabels: ['medic on-set', 'medic on set', 'medic onset'],
    target: {kind: 'custom', role: 'Medic'},
  },
  {
    fromLabels: ["director's assistant", 'directors assistant', 'director assistant'],
    target: {kind: 'custom', role: "Director's Assistant"},
  },
  {
    fromLabels: ['boom operator', 'boom op', 'boom'],
    target: {kind: 'custom', role: 'Boom Op'},
  },
]

function newKey(): string {
  return Math.random().toString(36).slice(2, 14)
}

function normalizePersonName(name: string): string {
  return normalizeCreditToken(name)
}

function clonePeople(people: CrewPersonValue[] | undefined): CrewPersonValue[] {
  return (people ?? []).map((person) => ({
    ...person,
    _type: 'crewPerson' as const,
    _key: person._key || newKey(),
  }))
}

function mergePeopleLists(
  primary: CrewPersonValue[],
  secondary: CrewPersonValue[],
): CrewPersonValue[] {
  const seen = new Set(primary.map((p) => normalizePersonName(p.name)))
  const next = clonePeople(primary)
  for (const person of secondary) {
    const key = normalizePersonName(person.name)
    if (seen.has(key)) continue
    seen.add(key)
    next.push({
      ...person,
      _type: 'crewPerson',
      _key: person._key || newKey(),
    })
  }
  return next
}

function findRule(credit: CrewCreditValue): LabelRule | null {
  const labelNorm = normalizeCreditToken(credit.role ?? '')
  if (!labelNorm) return null
  const dept = credit.department as CrewDepartmentKey | undefined

  for (const rule of LABEL_RULES) {
    if (rule.department && rule.department !== dept) continue
    if (!rule.fromLabels.some((label) => normalizeCreditToken(label) === labelNorm)) {
      continue
    }

    if (rule.target.kind === 'standard') {
      if (credit.roleKey === rule.target.roleKey && credit.isCustomRole !== true) {
        continue
      }
      return rule
    }

    if (credit.isCustomRole && !credit.roleKey && credit.role === rule.target.role) {
      continue
    }
    return rule
  }
  return null
}

function buildTargetCredit(
  credit: CrewCreditValue,
  target: MergeTarget,
): CrewCreditValue {
  if (target.kind === 'standard') {
    const resolved = CREW_ROLE_BY_KEY.get(target.roleKey)
    if (!resolved) {
      throw new Error(`Unknown roleKey ${target.roleKey}`)
    }
    return {
      ...credit,
      _type: 'crewCredit',
      _key: credit._key || newKey(),
      department: resolved.departmentKey,
      roleKey: resolved.role.key,
      role: resolved.role.label,
      isCustomRole: false,
      people: clonePeople(credit.people),
    }
  }

  return {
    ...credit,
    _type: 'crewCredit',
    _key: credit._key || newKey(),
    role: target.role,
    roleKey: undefined,
    isCustomRole: true,
    people: clonePeople(credit.people),
  }
}

function identityOf(credit: CrewCreditValue): string {
  return creditIdentityKey({
    department: credit.department,
    roleKey: credit.roleKey,
    role: credit.role,
    isCustomRole: credit.isCustomRole,
  })
}

function applyMergesToDoc(doc: PortfolioDoc): {next: CrewCreditValue[]; changes: string[]} {
  const credits = structuredClone(doc.crewCredits ?? []) as CrewCreditValue[]
  const changes: string[] = []

  // First pass: apply custom canonical via shared helper when no LABEL_RULE matched dept-scoped
  for (let i = 0; i < credits.length; i++) {
    const credit = credits[i]
    if (!credit.isCustomRole && credit.roleKey) continue
    const canonical = resolveCustomRoleCanonical(credit.role)
    if (canonical && credit.role !== canonical) {
      changes.push(`${credit.department} / "${credit.role}" → custom "${canonical}"`)
      credits[i] = {
        ...credit,
        role: canonical,
        roleKey: undefined,
        isCustomRole: true,
      }
    }
  }

  // Second pass: label rules → remapped rows (may create duplicate identities)
  const remapped: CrewCreditValue[] = []
  for (const credit of credits) {
    const rule = findRule(credit)
    if (!rule) {
      remapped.push(credit)
      continue
    }

    const next = buildTargetCredit(credit, rule.target)
    const from = `${credit.department}/${credit.isCustomRole ? 'custom' : credit.roleKey}:${credit.role}`
    const to =
      rule.target.kind === 'standard'
        ? `standard:${rule.target.roleKey}`
        : `custom:${rule.target.role}`
    changes.push(`${from} → ${to}`)
    remapped.push(next)
  }

  // Third pass: collapse duplicate identities, merging people (keep first row's order)
  const byIdentity = new Map<string, number>()
  const collapsed: CrewCreditValue[] = []

  for (const credit of remapped) {
    const id = identityOf(credit)
    const existingIndex = byIdentity.get(id)
    if (existingIndex === undefined) {
      byIdentity.set(id, collapsed.length)
      collapsed.push(credit)
      continue
    }

    const existing = collapsed[existingIndex]
    const mergedPeople = mergePeopleLists(existing.people ?? [], credit.people ?? [])
    collapsed[existingIndex] = {...existing, people: mergedPeople}
    changes.push(`merged people into ${id} (${credit.people?.length ?? 0} from duplicate row)`)
  }

  return {next: collapsed, changes}
}

async function main() {
  const apply = process.argv.includes('--apply')

  console.log('=== Apply crew role merges ===\n')
  console.log(`Mode: ${apply ? 'APPLY' : 'DRY-RUN'}`)
  console.log(`Rules: ${LABEL_RULES.length}\n`)

  const client = getWriteClient()
  const docs = await client.fetch<PortfolioDoc[]>(`
    *[_type == "portfolioEntry" && defined(crewCredits) && count(crewCredits) > 0]{
      _id,
      title,
      "slug": slug.current,
      crewCredits[]{
        _key,
        _type,
        department,
        role,
        roleKey,
        isCustomRole,
        people[]{ _key, _type, name, url, linkTitle, identity }
      }
    }
  `)

  let docsTouched = 0
  let changeCount = 0

  for (const doc of docs) {
    const {next, changes} = applyMergesToDoc(doc)
    if (!changes.length) continue

    // Skip no-op identity (same JSON roles)
    const before = JSON.stringify(doc.crewCredits ?? [])
    const after = JSON.stringify(next)
    if (before === after) continue

    docsTouched++
    changeCount += changes.length
    console.log(`${apply ? '✓' : '·'} ${doc.slug}`)
    for (const change of changes) {
      console.log(`    ${change}`)
    }

    if (apply) {
      await client.patch(doc._id).set({crewCredits: next}).commit()
    }
  }

  console.log('\n--- Summary ---')
  console.log(`Portfolio entries ${apply ? 'updated' : 'would update'}: ${docsTouched}`)
  console.log(`Change lines: ${changeCount}`)
  if (!apply) {
    console.log('\nRe-run with --apply to write patches.')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
