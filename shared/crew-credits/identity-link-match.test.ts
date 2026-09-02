/**
 * Confidence-gated identity link matching tests.
 *
 *   npx tsx shared/crew-credits/identity-link-match.test.ts
 */

import assert from 'node:assert/strict'

import {
  buildIdentityDepartmentUsageFromCredits,
  evaluateIdentityLinkConfidence,
  findIdentityByNameWithConfidence,
} from './identity-link-match'
import {
  identityLinkPolicyForDepartments,
  isStudioIdentityLinkedRoleKey,
  resolveIdentityLinksOnCredits,
} from '../../sanity/components/crew-credits/sync-credit-identities'

const usage = buildIdentityDepartmentUsageFromCredits([
  {
    crewCredits: [
      {
        department: 'production',
        roleKey: 'director',
        role: 'Director',
        people: [
          {
            name: 'Zacharia Lorenz',
            identity: {_type: 'reference', _ref: 'ci_zach', _weak: true},
          },
        ],
      },
      {
        department: 'post',
        roleKey: 'editor',
        role: 'Editor',
        people: [
          {
            name: 'Zacharia Lorenz',
            identity: {_type: 'reference', _ref: 'ci_zach', _weak: true},
          },
        ],
      },
      {
        department: 'camera',
        roleKey: 'dop',
        role: 'DOP',
        people: [
          {
            name: 'Minh Công Trang',
            identity: {_type: 'reference', _ref: 'ci_minh', _weak: true},
          },
        ],
      },
      {
        department: 'stills',
        roleKey: 'photographer',
        role: 'Photographer',
        people: [
          {
            name: 'Le Thanh Tung',
            identity: {_type: 'reference', _ref: 'ci_le_thanh', _weak: true},
          },
        ],
      },
      {
        department: 'stills',
        roleKey: 'photography_producer',
        role: 'Photography Producer',
        people: [
          {
            name: 'Tự Nguyễn',
            identity: {_type: 'reference', _ref: 'ci_tu_nguyen', _weak: true},
          },
        ],
      },
      {
        department: 'camera',
        roleKey: 'dop',
        role: 'DOP',
        people: [
          {
            name: 'Tung Bui',
            identity: {_type: 'reference', _ref: 'ci_tung_bui', _weak: true},
          },
        ],
      },
    ],
  },
])

const existing = [
  {_id: 'ci_zach', name: 'Zacharia Lorenz'},
  {_id: 'ci_minh', name: 'Minh Công Trang'},
  {_id: 'ci_le_thanh', name: 'Le Thanh Tung'},
  {_id: 'ci_duy', name: 'Duy Vk'},
  {_id: 'ci_tu_nguyen', name: 'Tự Nguyễn'},
  {_id: 'ci_tung_bui', name: 'Tung Bui'},
  {_id: 'ci_nhan', name: 'Nhan Nguyen'},
]

// --- findIdentityByNameWithConfidence unit branches --------------------------------

const exactCrossDept = findIdentityByNameWithConfidence('Zacharia Lorenz', existing, {
  slotDepartment: 'camera',
  identityDepartmentsById: usage,
})
assert.equal(exactCrossDept?.confidence, 'review')
assert.equal(exactCrossDept?.reviewReason, 'cross_department_exact')

const exactSameDept = findIdentityByNameWithConfidence('Zacharia Lorenz', existing, {
  slotDepartment: 'post',
  identityDepartmentsById: usage,
})
assert.equal(exactSameDept?.confidence, 'exact')

const orphanExact = findIdentityByNameWithConfidence(
  'Andrew Pigott',
  [{_id: 'ci_andrew', name: 'Andrew Pigott'}],
  {slotDepartment: 'post', identityDepartmentsById: new Map()},
)
assert.equal(orphanExact?.confidence, 'exact')

const alexCastingUsage = new Map<string, Set<string>>([['ci_alex', new Set(['casting'])]])
const alexPostExactReview = findIdentityByNameWithConfidence(
  'Alex',
  [{_id: 'ci_alex', name: 'Alex'}],
  {slotDepartment: 'post', identityDepartmentsById: alexCastingUsage},
)
assert.equal(alexPostExactReview?.confidence, 'review')
assert.equal(alexPostExactReview?.reviewReason, 'cross_department_exact')

const alexCasingCrossDept = findIdentityByNameWithConfidence(
  'alex',
  [{_id: 'ci_alex', name: 'Alex'}],
  {slotDepartment: 'post', identityDepartmentsById: alexCastingUsage},
)
assert.equal(alexCasingCrossDept?.confidence, 'safe_casing')

const casingOnly = findIdentityByNameWithConfidence('Duy VK', existing, {
  slotDepartment: 'camera',
  identityDepartmentsById: usage,
})
assert.equal(casingOnly?.confidence, 'safe_casing')

const sameDeptSafeNorm = findIdentityByNameWithConfidence('Tùng Bùi', existing, {
  slotDepartment: 'camera',
  identityDepartmentsById: usage,
})
assert.equal(sameDeptSafeNorm?.confidence, 'safe_norm')

const sameDeptHomonymReview = findIdentityByNameWithConfidence('Tú Nguyễn', existing, {
  slotDepartment: 'stills',
  identityDepartmentsById: usage,
})
assert.equal(sameDeptHomonymReview?.confidence, 'review')

const asciiFirstHomonymReview = findIdentityByNameWithConfidence('Tu Nguyen', existing, {
  slotDepartment: 'stills',
  identityDepartmentsById: usage,
})
assert.equal(asciiFirstHomonymReview?.confidence, 'review')

const crossDeptNormReview = findIdentityByNameWithConfidence('Lê Thanh Tùng', existing, {
  slotDepartment: 'camera',
  identityDepartmentsById: usage,
})
assert.equal(crossDeptNormReview?.confidence, 'review')

// --- resolveIdentityLinksOnCredits integration -------------------------------------

const cameraPolicy = identityLinkPolicyForDepartments(['camera'])

const exactCrossDeptResolved = resolveIdentityLinksOnCredits(
  [
    {
      department: 'camera',
      roleKey: 'drone_op',
      role: 'Drone Op',
      people: [{name: 'Zacharia Lorenz'}],
    },
  ],
  existing,
  cameraPolicy,
  {identityDepartmentsById: usage},
)
assert.equal(exactCrossDeptResolved.reviewLinks.length, 1)
assert.equal(exactCrossDeptResolved.reviewLinks[0]?.reviewReason, 'cross_department_exact')
assert.equal(exactCrossDeptResolved.nextCredits[0]?.people[0]?.identity?._ref, undefined)

const casingResolved = resolveIdentityLinksOnCredits(
  [
    {
      department: 'camera',
      roleKey: 'focus_puller',
      role: 'Focus Puller',
      people: [{name: 'Duy VK'}],
    },
  ],
  existing,
  cameraPolicy,
  {identityDepartmentsById: usage},
)
assert.equal(casingResolved.reviewLinks.length, 0)
assert.equal(casingResolved.nextCredits[0]?.people[0]?.identity?._ref, 'ci_duy')
assert.equal(casingResolved.nextCredits[0]?.people[0]?.name, 'Duy Vk')

const sameDeptNormResolved = resolveIdentityLinksOnCredits(
  [
    {
      department: 'camera',
      roleKey: 'dop',
      role: 'DOP',
      people: [{name: 'Tùng Bùi'}],
    },
  ],
  existing,
  cameraPolicy,
  {identityDepartmentsById: usage},
)
assert.equal(sameDeptNormResolved.reviewLinks.length, 0)
assert.equal(sameDeptNormResolved.nextCredits[0]?.people[0]?.identity?._ref, 'ci_tung_bui')
assert.equal(sameDeptNormResolved.nextCredits[0]?.people[0]?.name, 'Tung Bui')

const alreadyLinkedUnchanged = resolveIdentityLinksOnCredits(
  [
    {
      department: 'camera',
      roleKey: 'dop',
      role: 'DOP',
      people: [
        {
          name: 'Tùng Bùi',
          identity: {_type: 'reference', _ref: 'ci_tung_bui', _weak: true},
        },
      ],
    },
  ],
  existing,
  cameraPolicy,
  {identityDepartmentsById: usage},
)
assert.equal(alreadyLinkedUnchanged.nextCredits[0]?.people[0]?.name, 'Tùng Bùi')
assert.equal(alreadyLinkedUnchanged.links[0]?.created, false)

const newIdentityKeepsSlotName = resolveIdentityLinksOnCredits(
  [
    {
      department: 'camera',
      roleKey: 'dop',
      role: 'DOP',
      people: [{name: 'Brand New Person'}],
    },
  ],
  existing,
  cameraPolicy,
  {identityDepartmentsById: usage},
)
assert.equal(newIdentityKeepsSlotName.createIdentities.length, 1)
assert.equal(newIdentityKeepsSlotName.nextCredits[0]?.people[0]?.name, 'Brand New Person')

const homonymSameDeptResolved = resolveIdentityLinksOnCredits(
  [
    {
      department: 'stills',
      roleKey: 'photographer',
      role: 'Photographer',
      people: [{name: 'Tú Nguyễn'}],
    },
  ],
  existing,
  identityLinkPolicyForDepartments(['stills']),
  {identityDepartmentsById: usage},
)
assert.equal(homonymSameDeptResolved.reviewLinks.length, 1)
assert.equal(homonymSameDeptResolved.reviewLinks[0]?.candidateIdentityId, 'ci_tu_nguyen')
assert.equal(homonymSameDeptResolved.reviewLinks[0]?.reviewReason, 'same_department_homonym')
assert.equal(homonymSameDeptResolved.nextCredits[0]?.people[0]?.identity?._ref, undefined)
assert.equal(homonymSameDeptResolved.createIdentities.length, 0)

const crossDeptNormResolved = resolveIdentityLinksOnCredits(
  [
    {
      department: 'camera',
      roleKey: 'steadicam_op',
      role: 'Steadicam Op',
      people: [{name: 'Lê Thanh Tùng'}],
    },
  ],
  existing,
  cameraPolicy,
  {
    identityDepartmentsById: usage,
    portfolioId: 'portfolio-herbalife',
    portfolioLabel: 'herbalife-nutrition',
  },
)
assert.equal(crossDeptNormResolved.reviewLinks.length, 1)
assert.equal(crossDeptNormResolved.reviewLinks[0]?.reviewReason, 'cross_department_spelling')
assert.equal(crossDeptNormResolved.reviewLinks[0]?.name, 'Lê Thanh Tùng')
assert.equal(crossDeptNormResolved.reviewLinks[0]?.candidateIdentityName, 'Le Thanh Tung')
assert.equal(crossDeptNormResolved.reviewLinks[0]?.portfolioLabel, 'herbalife-nutrition')
assert.equal(crossDeptNormResolved.nextCredits[0]?.people[0]?.identity?._ref, undefined)
assert.equal(crossDeptNormResolved.createIdentities.length, 0)

const minhCongTrangResolved = resolveIdentityLinksOnCredits(
  [
    {
      department: 'camera',
      roleKey: 'focus_puller',
      role: 'Focus Puller',
      people: [{name: 'Minh Công Trang'}],
    },
  ],
  existing,
  cameraPolicy,
  {identityDepartmentsById: usage},
)
assert.equal(minhCongTrangResolved.reviewLinks.length, 0)
assert.equal(minhCongTrangResolved.nextCredits[0]?.people[0]?.identity?._ref, 'ci_minh')

const evaluateCrossDept = evaluateIdentityLinkConfidence(
  'Lê Thanh Tùng',
  'ci_le_thanh',
  existing,
  {slotDepartment: 'camera', identityDepartmentsById: usage},
)
assert.equal(evaluateCrossDept, 'review')

const evaluateAsciiTuStills = evaluateIdentityLinkConfidence(
  'Tu Nguyen',
  'ci_tu_nguyen',
  existing,
  {slotDepartment: 'stills', identityDepartmentsById: usage},
)
assert.equal(evaluateAsciiTuStills, 'review')

const evaluateCastingCrossDeptTu = evaluateIdentityLinkConfidence(
  'Tu Nguyen',
  'ci_tu_nguyen',
  existing,
  {slotDepartment: 'casting', identityDepartmentsById: usage},
)
assert.equal(evaluateCastingCrossDeptTu, 'review')

// --- studio inline identity-link scope (all linked departments) ---------------

assert.ok(isStudioIdentityLinkedRoleKey('dop'))
assert.ok(isStudioIdentityLinkedRoleKey('photographer'))
assert.ok(isStudioIdentityLinkedRoleKey('casting_director'))
assert.ok(isStudioIdentityLinkedRoleKey('gaffer'))
assert.ok(isStudioIdentityLinkedRoleKey('steadicam_op'))
assert.ok(!isStudioIdentityLinkedRoleKey('producer'))
assert.ok(!isStudioIdentityLinkedRoleKey(undefined))

const gePolicy = identityLinkPolicyForDepartments(['ge'])
const geLeThanhStillsOnly = new Map<string, Set<string>>([
  ['ci_le_thanh', new Set(['stills'])],
])
const geCrossDeptReview = resolveIdentityLinksOnCredits(
  [
    {
      department: 'ge',
      roleKey: 'gaffer',
      role: 'Gaffer',
      people: [{name: 'Lê Thanh Tùng'}],
    },
  ],
  existing,
  gePolicy,
  {identityDepartmentsById: geLeThanhStillsOnly},
)
assert.equal(geCrossDeptReview.reviewLinks.length, 1)
assert.equal(geCrossDeptReview.reviewLinks[0]?.roleKey, 'gaffer')
assert.equal(geCrossDeptReview.nextCredits[0]?.people[0]?.identity?._ref, undefined)

// buildIdentityDepartmentUsageFromCredits collects departments per identity
const minhDepts = usage.get('ci_minh')
assert.ok(minhDepts?.has('camera'))
assert.equal(minhDepts?.size, 1)

const zachDepts = usage.get('ci_zach')
assert.ok(zachDepts?.has('production'))
assert.ok(zachDepts?.has('post'))

console.log('identity-link-match.test.ts: all assertions passed')
