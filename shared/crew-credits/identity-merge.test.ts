/**
 * Unit checks for creditIdentity merge scan / plan / execute.
 *   npx tsx shared/crew-credits/identity-merge.test.ts
 */

import assert from 'node:assert/strict'

import type {CrewCreditValue} from './types'
import {
  computeIdentityFieldDiff,
  executeMerge,
  planMerge,
  repointIdentityInCredits,
  scanMergeReferencesFromPortfolios,
  type IdentityMergeClient,
  type MergePlan,
  type MergeScanPortfolio,
} from './identity-merge'

const DUPLICATE = 'ci_dup'
const CANONICAL = 'ci_canon'

function person(name: string, identityId?: string) {
  return {
    _key: `person-${name}`,
    name,
    ...(identityId
      ? {identity: {_type: 'reference' as const, _ref: identityId, _weak: true as const}}
      : {}),
  }
}

function credit(
  roleKey: string,
  role: string,
  people: ReturnType<typeof person>[],
): CrewCreditValue {
  return {
    _key: `credit-${roleKey}`,
    _type: 'crewCredit',
    department: 'production',
    roleKey,
    role,
    people,
  }
}

function portfolio(
  id: string,
  partial: Omit<MergeScanPortfolio, '_id'>,
): MergeScanPortfolio {
  return {_id: id, ...partial}
}

function testMultiRoleDuplicate() {
  const docs = [
    portfolio('p-multi', {
      title: 'Multi Role Spot',
      crewCredits: [
        credit('brand', 'Brand', [person('Acme Co', DUPLICATE)]),
        credit('director', 'Director', [person('Jane Doe', DUPLICATE)]),
      ],
    }),
  ]

  const hits = scanMergeReferencesFromPortfolios(docs, DUPLICATE)
  assert.equal(hits.length, 1)
  assert.equal(hits[0]!.matches.length, 2)
  assert.deepEqual(
    hits[0]!.matches.map((m) => m.roleKey).sort(),
    ['brand', 'director'],
  )
}

function testHiddenPortfolioIncluded() {
  const docs = [
    portfolio('p-hidden', {
      title: 'Hidden Project',
      isHidden: true,
      crewCredits: [credit('editor', 'Editor', [person('Hidden Editor', DUPLICATE)])],
    }),
  ]

  const hits = scanMergeReferencesFromPortfolios(docs, DUPLICATE)
  assert.equal(hits.length, 1)
  assert.equal(hits[0]!.isHidden, true)
}

function testDraftVariant() {
  const docs = [
    portfolio('drafts.p-draft', {
      title: 'Draft Only',
      crewCredits: [credit('dop', 'DOP', [person('Lens Person', DUPLICATE)])],
    }),
  ]

  const hits = scanMergeReferencesFromPortfolios(docs, DUPLICATE)
  assert.equal(hits.length, 1)
  assert.equal(hits[0]!.variant, 'draft')
  assert.equal(hits[0]!.publishedId, 'p-draft')
}

function testCanonicalUrlNotOverwritten() {
  const diff = computeIdentityFieldDiff(
    {_id: DUPLICATE, name: 'Dup', url: 'https://dup.example'},
    {_id: CANONICAL, name: 'Canon', url: 'https://canon.example'},
  )
  assert.deepEqual(diff, {})
}

function testCanonicalNameZhFilledFromDuplicate() {
  const diff = computeIdentityFieldDiff(
    {_id: DUPLICATE, name: 'Dup', nameZh: '副本'},
    {_id: CANONICAL, name: 'Canon'},
  )
  assert.deepEqual(diff, {nameZh: '副本'})
}

function testTrashedSeparatedFromRepointActions() {
  const docs = [
    portfolio('p-live', {
      title: 'Live',
      crewCredits: [credit('brand', 'Brand', [person('Live Brand', DUPLICATE)])],
    }),
    portfolio('p-trashed', {
      title: 'Trashed',
      trash: {trashedAt: '2026-01-01T00:00:00.000Z'},
      crewCredits: [credit('brand', 'Brand', [person('Trashed Brand', DUPLICATE)])],
    }),
  ]

  const hits = scanMergeReferencesFromPortfolios(docs, DUPLICATE)
  assert.equal(hits.length, 2)
  const trashed = hits.find((h) => h.isTrashed)
  const live = hits.find((h) => !h.isTrashed)
  assert.ok(trashed)
  assert.ok(live)

  const {credits, repointedPeople} = repointIdentityInCredits(
    live!.matches.length ? docs[0]!.crewCredits : [],
    DUPLICATE,
    CANONICAL,
  )
  assert.equal(repointedPeople, 1)
  assert.equal(credits[0]!.people[0]!.identity?._ref, CANONICAL)
}

function createMockClient(
  portfolios: MergeScanPortfolio[],
  identities: Array<{_id: string; name: string; nameZh?: string; url?: string}>,
) {
  const patches: Array<{id: string; set: Record<string, unknown>}> = []
  const deletes: string[] = []
  let portfolioState = portfolios.map((doc) => structuredClone(doc))

  const client: IdentityMergeClient = {
    fetch: async (query, params) => {
      if (query.includes('creditIdentity')) {
        const ids = (params?.ids as string[]) ?? []
        return identities.filter((row) => ids.includes(row._id))
      }
      if (query.includes('portfolioEntry')) {
        const duplicateId = String(params?.duplicateId ?? '')
        return portfolioState.filter((doc) =>
          (doc.crewCredits ?? []).some((credit) =>
            (credit.people ?? []).some((p) => p.identity?._ref === duplicateId),
          ),
        )
      }
      return []
    },
    patch: (id) => ({
      set: (fields) => ({
        commit: async () => {
          patches.push({id, set: fields})
          const doc = portfolioState.find((row) => row._id === id)
          if (doc && fields.crewCredits) {
            doc.crewCredits = structuredClone(fields.crewCredits as CrewCreditValue[])
          }
          const identity = identities.find((row) => row._id === id)
          if (identity) {
            if (typeof fields.nameZh === 'string') identity.nameZh = fields.nameZh
            if (typeof fields.url === 'string') identity.url = fields.url
          }
        },
      }),
    }),
    delete: async (id) => {
      deletes.push(id)
    },
  }

  return {client, patches, deletes, getPortfolioState: () => portfolioState}
}

async function testPlanMergeBuildsRepointActions() {
  const portfolios = [
    portfolio('p1', {
      title: 'Project One',
      crewCredits: [credit('brand', 'Brand', [person('Acme', DUPLICATE)])],
    }),
  ]
  const identities = [
    {_id: DUPLICATE, name: 'Acme Duplicate', nameZh: '亚克米'},
    {_id: CANONICAL, name: 'Acme Canonical'},
  ]
  const {client} = createMockClient(portfolios, identities)

  const plan = await planMerge(client, DUPLICATE, CANONICAL)
  assert.equal(plan.repointActions.length, 1)
  assert.equal(plan.repointActions[0]!.documentId, 'p1')
  assert.equal(plan.repointActions[0]!.crewCredits[0]!.people[0]!.identity?._ref, CANONICAL)
  assert.deepEqual(plan.fieldDiff, {nameZh: '亚克米'})
  assert.equal(plan.trashedReferences.length, 0)
}

async function testExecuteMergeDryRunWritesNothing() {
  const portfolios = [
    portfolio('p1', {
      title: 'Project One',
      crewCredits: [credit('brand', 'Brand', [person('Acme', DUPLICATE)])],
    }),
  ]
  const identities = [
    {_id: DUPLICATE, name: 'Acme Duplicate'},
    {_id: CANONICAL, name: 'Acme Canonical'},
  ]
  const {client, patches, deletes} = createMockClient(portfolios, identities)
  const plan = await planMerge(client, DUPLICATE, CANONICAL)

  const result = await executeMerge(client, DUPLICATE, CANONICAL, plan)
  assert.equal(result.dryRun, true)
  assert.equal(result.repointedDocuments, 1)
  assert.equal(patches.length, 0)
  assert.equal(deletes.length, 0)
}

async function testExecuteMergeApplyRepointsVerifiesAndDeletes() {
  const portfolios = [
    portfolio('p1', {
      title: 'Project One',
      crewCredits: [credit('brand', 'Brand', [person('Acme', DUPLICATE)])],
    }),
  ]
  const identities = [
    {_id: DUPLICATE, name: 'Acme Duplicate', url: 'https://acme.example'},
    {_id: CANONICAL, name: 'Acme Canonical'},
  ]
  const {client, patches, deletes} = createMockClient(portfolios, identities)
  const plan = await planMerge(client, DUPLICATE, CANONICAL)

  const result = await executeMerge(client, DUPLICATE, CANONICAL, plan, {apply: true})
  assert.equal(result.dryRun, false)
  assert.equal(result.verifiedClean, true)
  assert.equal(result.duplicateDeleted, true)
  assert.equal(result.repointedDocuments, 1)
  assert.equal(result.canonicalFieldsPatched, true)
  assert.equal(patches.length, 2)
  assert.deepEqual(deletes, [DUPLICATE])
}

async function testExecuteMergeVerificationFailureSkipsDelete() {
  const portfolios = [
    portfolio('p1', {
      title: 'Project One',
      crewCredits: [credit('brand', 'Brand', [person('Acme', DUPLICATE)])],
    }),
  ]
  const identities = [
    {_id: DUPLICATE, name: 'Acme Duplicate'},
    {_id: CANONICAL, name: 'Acme Canonical'},
  ]
  const {client, deletes} = createMockClient(portfolios, identities)
  const plan: MergePlan = {
  ...(await planMerge(client, DUPLICATE, CANONICAL)),
  }

  // Simulate a stale plan: repoint payload still references duplicate.
  plan.repointActions[0]!.crewCredits = structuredClone(portfolios[0]!.crewCredits!)

  const result = await executeMerge(client, DUPLICATE, CANONICAL, plan, {apply: true})
  assert.equal(result.verifiedClean, false)
  assert.equal(result.duplicateDeleted, false)
  assert.ok(result.stillReferencing?.length)
  assert.equal(deletes.length, 0)
}

async function main() {
  testMultiRoleDuplicate()
  testHiddenPortfolioIncluded()
  testDraftVariant()
  testCanonicalUrlNotOverwritten()
  testCanonicalNameZhFilledFromDuplicate()
  testTrashedSeparatedFromRepointActions()
  await testPlanMergeBuildsRepointActions()
  await testExecuteMergeDryRunWritesNothing()
  await testExecuteMergeApplyRepointsVerifiesAndDeletes()
  await testExecuteMergeVerificationFailureSkipsDelete()
  console.log('identity-merge.test.ts: all checks passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
