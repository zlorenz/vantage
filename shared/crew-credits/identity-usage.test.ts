/**
 * Unit checks for creditIdentity usage counting (Studio ↔ work-internal parity).
 *   npx tsx shared/crew-credits/identity-usage.test.ts
 */

import assert from 'node:assert/strict'

import {
  portfolioMatchesIdentityRole,
  resolveUsageForIdentities,
  type IdentityUsagePortfolio,
} from './identity-usage'

const KELVIN = 'ci_kelvin'
const MARTIN = 'ci_martin'

function entry(
  id: string,
  partial: Omit<IdentityUsagePortfolio, '_id'>,
): IdentityUsagePortfolio {
  return {_id: id, ...partial}
}

function testIdentityLinkCounts() {
  const portfolios = [
    entry('p1', {
      crewCredits: [
        {
          roleKey: 'director',
          people: [{name: 'Kelvin Chew', identityId: KELVIN}],
        },
      ],
    }),
    entry('p2', {
      crewCredits: [
        {
          roleKey: 'director',
          people: [{name: 'Kelvin Chew', identityId: KELVIN}],
        },
      ],
    }),
  ]

  const usage = resolveUsageForIdentities(
    [{_id: KELVIN, name: 'Kelvin Chew'}],
    portfolios,
  ).get(KELVIN)!

  assert.equal(usage.usage, 2)
  assert.equal(usage.usageByRole.director, 2)
  assert.deepEqual(usage.roleKeys, ['director'])
}

function testNameFallbackCountsUnlinkedCredits() {
  // Kelvin: 2 linked + 2 name-only → 4 (mirrors Studio undercount case)
  const portfolios = [
    entry('linked-1', {
      crewCredits: [
        {
          roleKey: 'director',
          people: [{name: 'Kelvin Chew', identityId: KELVIN}],
        },
      ],
    }),
    entry('linked-2', {
      crewCredits: [
        {
          roleKey: 'director',
          people: [{name: 'Kelvin Chew', identityId: KELVIN}],
        },
      ],
    }),
    entry('name-only-1', {
      crewCredits: [
        {
          roleKey: 'director',
          people: [{name: 'Kelvin Chew'}],
        },
      ],
    }),
    entry('name-only-2', {
      crewCredits: [
        {
          roleKey: 'director',
          people: [{name: 'Kelvin Chew'}],
        },
      ],
    }),
  ]

  const usage = resolveUsageForIdentities(
    [{_id: KELVIN, name: 'Kelvin Chew'}],
    portfolios,
  ).get(KELVIN)!

  assert.equal(usage.usage, 4)
  assert.equal(usage.usageByRole.director, 4)
}

function testDraftIdsAreDeduped() {
  // Same published entry should not double-count if a draft id sneaks in.
  const portfolios = [
    entry('portfolio-1', {
      crewCredits: [
        {
          roleKey: 'dop',
          people: [{name: 'Martin Buzora', identityId: MARTIN}],
        },
      ],
    }),
    entry('drafts.portfolio-1', {
      crewCredits: [
        {
          roleKey: 'dop',
          people: [{name: 'Martin Buzora', identityId: MARTIN}],
        },
      ],
    }),
  ]

  const usage = resolveUsageForIdentities(
    [{_id: MARTIN, name: 'Martin Buzora'}],
    portfolios,
  ).get(MARTIN)!

  assert.equal(usage.usage, 1)
  assert.equal(usage.usageByRole.dop, 1)
}

function testAllTabUnionsRolesWithoutDoubleCounting() {
  const portfolios = [
    entry('both-roles', {
      crewCredits: [
        {
          roleKey: 'director',
          people: [{name: 'Martin Buzora', identityId: MARTIN}],
        },
        {
          roleKey: 'dop',
          people: [{name: 'Martin Buzora', identityId: MARTIN}],
        },
      ],
    }),
    entry('dop-only', {
      crewCredits: [
        {
          roleKey: 'dop',
          people: [{name: 'Martin Buzora', identityId: MARTIN}],
        },
      ],
    }),
  ]

  const usage = resolveUsageForIdentities(
    [{_id: MARTIN, name: 'Martin Buzora'}],
    portfolios,
  ).get(MARTIN)!

  assert.equal(usage.usageByRole.director, 1)
  assert.equal(usage.usageByRole.dop, 2)
  assert.equal(usage.usage, 2)
  assert.deepEqual(usage.roleKeys, ['director', 'dop'])
}

function testArtDirectorMatchesProductionDesignerByName() {
  const portfolios = [
    entry('pd', {
      crewCredits: [
        {
          roleKey: 'production_designer',
          people: [{name: 'Alex Art'}],
        },
      ],
    }),
  ]

  assert.equal(
    portfolioMatchesIdentityRole(
      portfolios[0]!,
      'ci_alex',
      'Alex Art',
      'art_director',
    ),
    true,
  )

  const usage = resolveUsageForIdentities(
    [{_id: 'ci_alex', name: 'Alex Art'}],
    portfolios,
  ).get('ci_alex')!

  assert.equal(usage.usageByRole.art_director, 1)
  assert.equal(usage.usage, 1)
}

function testCaseInsensitiveNameMatch() {
  const portfolios = [
    entry('case', {
      crewCredits: [
        {
          roleKey: 'brand',
          people: [{name: 'govee'}],
        },
      ],
    }),
  ]

  assert.equal(
    portfolioMatchesIdentityRole(portfolios[0]!, 'ci_govee', 'Govee', 'brand'),
    true,
  )
}

function testStillsPhotographerWhenRoleKeysIncludeStills() {
  const GERALD = 'ci_gerald'
  const STILLS_ROLE_KEYS = [
    ...(['brand', 'director', 'dop', 'art_director', 'editor'] as const),
    'photographer',
    'photography_assistant',
    'photography_producer',
    'kv_art_director',
  ]

  const portfolios = [
    entry('stills-1', {
      crewCredits: [
        {
          roleKey: 'photographer',
          people: [{name: 'Gerald Goh', identityId: GERALD}],
        },
      ],
    }),
    entry('stills-2', {
      crewCredits: [
        {
          roleKey: 'photographer',
          people: [{name: 'Gerald Goh', identityId: GERALD}],
        },
      ],
    }),
  ]

  const usageDefault = resolveUsageForIdentities(
    [{_id: GERALD, name: 'Gerald Goh'}],
    portfolios,
  ).get(GERALD)!

  assert.equal(usageDefault.usage, 0)
  assert.deepEqual(usageDefault.roleKeys, [])

  const usage = resolveUsageForIdentities(
    [{_id: GERALD, name: 'Gerald Goh'}],
    portfolios,
    {roleKeys: STILLS_ROLE_KEYS},
  ).get(GERALD)!

  assert.equal(usage.usage, 2)
  assert.equal(usage.usageByRole.photographer, 2)
  assert.deepEqual(usage.roleKeys, ['photographer'])
}

function testCustomRolesAreIgnoredForIdentityLink() {
  // Identity on a custom-role row is ignored (peopleForRole excludes isCustomRole).
  // Use a denormalized name that does not equal the identity display name so
  // the transitional name fallback does not re-match.
  const portfolios = [
    entry('custom', {
      crewCredits: [
        {
          roleKey: 'director',
          isCustomRole: true,
          people: [{name: 'K. Chew (alias)', identityId: KELVIN}],
        },
      ],
    }),
  ]

  assert.equal(
    portfolioMatchesIdentityRole(
      portfolios[0]!,
      KELVIN,
      'Kelvin Chew',
      'director',
    ),
    false,
  )
}

const tests = [
  testIdentityLinkCounts,
  testNameFallbackCountsUnlinkedCredits,
  testDraftIdsAreDeduped,
  testAllTabUnionsRolesWithoutDoubleCounting,
  testArtDirectorMatchesProductionDesignerByName,
  testCaseInsensitiveNameMatch,
  testStillsPhotographerWhenRoleKeysIncludeStills,
  testCustomRolesAreIgnoredForIdentityLink,
]

for (const test of tests) {
  test()
  console.log(`ok ${test.name}`)
}

console.log(`\n${tests.length} passed`)
