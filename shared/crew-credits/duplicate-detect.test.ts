/**
 * Potential-duplicate detection tests.
 *   npx tsx shared/crew-credits/duplicate-detect.test.ts
 */

import assert from 'node:assert/strict'

import {
  duplicatePairKey,
  findPotentialDuplicates,
} from './duplicate-detect'

function testPairKeyOrderIndependent() {
  assert.equal(duplicatePairKey('ci_b', 'ci_a'), 'ci_a|ci_b')
  assert.equal(duplicatePairKey('ci_a', 'ci_b'), 'ci_a|ci_b')
}

function testExactNameClusters() {
  const flags = findPotentialDuplicates([
    {_id: 'ci_alex_1', name: 'Alex'},
    {_id: 'ci_alex_2', name: 'Alex'},
    {_id: 'ci_alex_3', name: 'alex'},
    {_id: 'ci_solo', name: 'Unique Person'},
  ])

  assert.ok(flags.has('ci_alex_1'))
  assert.ok(flags.has('ci_alex_2'))
  assert.ok(flags.has('ci_alex_3'))
  assert.equal(flags.has('ci_solo'), false)

  const peers = flags.get('ci_alex_1')!.peers
  assert.equal(peers.length, 2)
  assert.ok(peers.every((p) => p.kind === 'exact_name'))
  assert.ok(peers.some((p) => p.identityId === 'ci_alex_2'))
  assert.ok(peers.some((p) => p.identityId === 'ci_alex_3'))
}

function testNearMissNicknameAndExactDiacritic() {
  const flags = findPotentialDuplicates([
    {_id: 'ci_grace', name: 'Grace Team'},
    {_id: 'ci_grace_full', name: 'Grace Team Sound & Lighting'},
    {_id: 'ci_huy_ascii', name: 'Huy Nguyen'},
    {_id: 'ci_huy_viet', name: 'Huy Nguyễn'},
    {_id: 'ci_unrelated', name: 'Zacharia Lorenz'},
  ])

  const grace = flags.get('ci_grace')
  assert.ok(grace)
  assert.ok(
    grace!.peers.some(
      (p) =>
        p.identityId === 'ci_grace_full' &&
        p.kind === 'near_miss' &&
        p.reasons.includes('nickname_prefix'),
    ),
  )

  // Same normalizeCreditToken → exact_name cluster (covers diacritic twins)
  const huy = flags.get('ci_huy_ascii')
  assert.ok(huy)
  assert.ok(
    huy!.peers.some(
      (p) => p.identityId === 'ci_huy_viet' && p.kind === 'exact_name',
    ),
  )

  assert.equal(flags.has('ci_unrelated'), false)
}

function testDismissedPairExcluded() {
  const dismissed = new Set([duplicatePairKey('ci_alex_1', 'ci_alex_2')])
  const flags = findPotentialDuplicates(
    [
      {_id: 'ci_alex_1', name: 'Alex'},
      {_id: 'ci_alex_2', name: 'Alex'},
      {_id: 'ci_grace', name: 'Grace Team'},
      {_id: 'ci_grace_full', name: 'Grace Team Sound & Lighting'},
    ],
    {dismissedPairKeys: dismissed},
  )

  assert.equal(flags.has('ci_alex_1'), false)
  assert.equal(flags.has('ci_alex_2'), false)
  assert.ok(flags.has('ci_grace'))
  assert.ok(flags.get('ci_grace')!.peers.some((p) => p.identityId === 'ci_grace_full'))
}

function testSpacingNearMiss() {
  const flags = findPotentialDuplicates([
    {_id: 'ci_nteam', name: 'NTeam'},
    {_id: 'ci_n_team', name: 'N Team'},
    {_id: 'ci_too', name: 'TooAwake'},
    {_id: 'ci_too_colon', name: 'Too:Awake'},
    {_id: 'ci_lamoi', name: 'Lamoi'},
    {_id: 'ci_lam_oi', name: 'Lam Ơi'},
    // Different names that only share letters if spaces removed incorrectly
    {_id: 'ci_an', name: 'An'},
    {_id: 'ci_anne', name: 'Anne'},
  ])

  const assertSpacing = (a: string, b: string) => {
    const peers = flags.get(a)?.peers ?? []
    const peer = peers.find((p) => p.identityId === b)
    assert.ok(peer, `expected ${a} ↔ ${b}`)
    assert.equal(peer!.kind, 'near_miss')
    assert.ok(peer!.reasons.includes('spacing'))
    assert.equal(peer!.confidence, 'high')
  }

  assertSpacing('ci_nteam', 'ci_n_team')
  assertSpacing('ci_too', 'ci_too_colon')
  assertSpacing('ci_lamoi', 'ci_lam_oi')

  // Space-strip alone must not invent matches between distinct names
  assert.equal(
    flags.get('ci_an')?.peers.some((p) => p.identityId === 'ci_anne'),
    undefined,
  )
  assert.equal(flags.has('ci_an'), false)
  assert.equal(flags.has('ci_anne'), false)
}

function testTypoStillNotFlagged() {
  // Typo detection deferred to a follow-up commit
  const flags = findPotentialDuplicates([
    {_id: 'ci_a', name: 'Alex Gornastaev'},
    {_id: 'ci_b', name: 'Alex Gornostaev'},
  ])
  assert.equal(flags.size, 0)
}

function testHkFilmSpacing() {
  const flags = findPotentialDuplicates([
    {_id: 'ci_c', name: 'HK Film'},
    {_id: 'ci_d', name: 'HKFilm'},
  ])
  const peer = flags.get('ci_c')?.peers.find((p) => p.identityId === 'ci_d')
  assert.ok(peer)
  assert.ok(peer!.reasons.includes('spacing'))
  assert.equal(peer!.confidence, 'high')
}

const tests = [
  testPairKeyOrderIndependent,
  testExactNameClusters,
  testNearMissNicknameAndExactDiacritic,
  testDismissedPairExcluded,
  testSpacingNearMiss,
  testHkFilmSpacing,
  testTypoStillNotFlagged,
]

for (const test of tests) {
  test()
  console.log(`ok ${test.name}`)
}

console.log(`\n${tests.length} passed`)
