/**
 * Unit checks for crew-credit CSV parse / map / merge / link memory.
 *   npm run test:crew-credits
 */

import assert from 'node:assert/strict'

import {
  CREW_ROLES_FLAT,
  buildNameCatalog,
  buildNameCatalogFromCredits,
  findNameMatch,
  findExactNameInCatalog,
  findRoleMatch,
  normalizeCreditToken,
  parseLegacyNamesHtml,
  resolveCustomRoleCanonical,
  resolveDepartment,
  resolveStandardRole,
  searchNameSuggestions,
} from '@crew-credits'

import {mapCrewCreditsCsvRows} from './csv-map'
import {buildRoleCatalogIndexes} from './name-catalog-index'
import {
  planTaxonomySyncFromCredits,
  resolveTaxonomyPatch,
  slugifyPersonName,
} from './sync-taxonomies-from-credits'
import {
  identityLinkPolicyForDepartments,
  planIdentitySyncFromCredits,
  resolveIdentityLinksOnCredits,
} from './sync-credit-identities'
import {mergeCrewCredits} from './csv-merge'
import {parseCrewCreditsCsv, stripBom} from './csv-parse'
import {buildCrewCreditsCsvTemplate} from './csv-template'
import {
  buildLinkMemory,
  enrichPeopleWithLinkMemory,
  mergeLinkMemories,
  normalizePersonName,
  applyPersonLinkToCredits,
  applyPersonRenameToCredits,
} from './link-memory'
import {
  attachNameDuplicates,
  collapseSameNamePeopleInField,
  confirmNameDuplicate,
  countPendingDuplicates,
  duplicateAlertLabel,
  skipNameDuplicate,
} from './name-duplicates'
import {
  attachRoleSuggestions,
  confirmRoleSuggestion,
  countPendingRoleSuggestions,
  skipRoleSuggestion,
} from './role-suggestions'
import {isKnownPreviewPerson, preparePreviewPeople} from './preview-people'

// --- catalog integrity ------------------------------------------------------

assert.equal(CREW_ROLES_FLAT.length, 70)

// --- normalize / aliases ----------------------------------------------------

assert.equal(normalizeCreditToken('  Hair & Makeup '), 'hair and makeup')
assert.equal(resolveStandardRole('DP')?.role.key, 'dop')
assert.equal(resolveStandardRole('DoP')?.role.key, 'dop')
assert.equal(resolveStandardRole('Director of Photography')?.role.key, 'dop')
assert.equal(resolveStandardRole('Client')?.role.key, 'brand')
assert.equal(resolveStandardRole('Executive Producer')?.role.key, 'ep')
assert.equal(resolveStandardRole('Exec Producer')?.role.key, 'ep')
assert.equal(resolveStandardRole('First Assistant Director')?.role.key, '1st_ad')
assert.equal(resolveStandardRole('Production Assistant')?.role.key, 'pa')
assert.equal(resolveStandardRole('PAs')?.role.key, 'pa')
assert.equal(resolveStandardRole('Runner')?.role.key, 'pa')
assert.equal(resolveStandardRole('Camera Operator')?.role.key, 'camera_op')
assert.equal(resolveStandardRole('Cam Op')?.role.key, 'camera_op')
assert.equal(resolveStandardRole('Steadicam Operator')?.role.key, 'steadicam_op')
assert.equal(resolveStandardRole('First Assistant Camera')?.role.key, '1st_ac')
assert.equal(resolveStandardRole('Second Assistant Camera')?.role.key, '2nd_ac')
assert.equal(resolveStandardRole('Moco')?.role.key, 'motion_control')
assert.equal(resolveStandardRole('Hair and Makeup')?.role.key, 'hair_makeup')
assert.equal(resolveStandardRole('HMU')?.role.key, 'hair_makeup')
assert.equal(resolveStandardRole('Makeup Artist')?.role.key, 'hair_makeup')
assert.equal(resolveStandardRole('Props')?.role.key, 'props_master')
assert.equal(resolveStandardRole('Prop Master')?.role.key, 'props_master')
assert.equal(resolveStandardRole('Assistant Editor')?.role.key, 'assistant_editors')
assert.equal(resolveStandardRole('Sound Design')?.role.key, 'sound_design_mix')
assert.equal(resolveStandardRole('Sound Mix')?.role.key, 'sound_design_mix')
assert.equal(resolveStandardRole('VO')?.role.key, 'voice_over')
assert.equal(resolveStandardRole('Voiceover')?.role.key, 'voice_over')
assert.equal(resolveStandardRole('3D')?.role.key, '3d_animation')
assert.equal(resolveStandardRole('3D Animator')?.role.key, '3d_animation')
assert.equal(resolveStandardRole('Creative Director')?.role.key, 'creative_director')
assert.equal(resolveStandardRole('Catering')?.role.key, 'catering')
assert.equal(resolveStandardRole('Soundman')?.role.key, 'sound_recordist')
assert.equal(resolveStandardRole('Spark')?.role.key, 'electrician')
assert.equal(resolveStandardRole('Juicer')?.role.key, 'electrician')
assert.equal(resolveStandardRole('Grip & Lighting')?.role.key, 'rental_house')
assert.equal(resolveStandardRole('Post Producer')?.role.key, 'post_supervisor')
assert.equal(resolveStandardRole('Motion Graphic Artist')?.role.key, 'motion_graphics')
assert.equal(resolveStandardRole('GFX')?.role.key, 'motion_graphics')
assert.equal(resolveStandardRole('Online Editor')?.role.key, 'online')
assert.equal(resolveStandardRole('Online')?.role.key, 'online')
assert.equal(resolveStandardRole('VFX')?.role.key, 'vfx')
assert.notEqual(resolveStandardRole('Online')?.role.key, 'vfx')
assert.equal(
  resolveStandardRole('Sound Engineer', {department: 'post'})?.role.key,
  'sound_design_mix',
)
assert.equal(
  resolveStandardRole('Sound Engineer', {department: 'production'})?.role.key,
  'sound_recordist',
)
assert.equal(resolveStandardRole('Sound Engineer')?.role.key, 'sound_design_mix')
assert.equal(resolveCustomRoleCanonical('boom operator'), 'Boom Op')
assert.equal(resolveCustomRoleCanonical('Boom Op'), null)
assert.equal(resolveCustomRoleCanonical('Medic On-set'), 'Medic')
assert.equal(resolveCustomRoleCanonical('Director Assistant'), "Director's Assistant")
assert.equal(resolveDepartment('G&E'), 'ge')
assert.equal(resolveDepartment('Post-Production'), 'post')
assert.equal(resolveDepartment('Stills'), 'stills')
assert.equal(findRoleMatch('boom operator')?.label, 'Boom Op')
assert.equal(findRoleMatch('Director')?.kind, undefined) // exact → null

// --- BOM + header aliases + blank rows --------------------------------------

const bomCsv = `\uFEFFDept,Position,People,Name URL
Production,Director,Paul Moore,https://example.com/paul
,DOP,Kelvin Chew,
Camera,,,
Production,Creative Director,"Jane Smith, John Doe","https://example.com/jane,https://example.com/john"
Production,Runner,Alex,
UnknownDept,Mystery Role,Nobody,
,Mystery Role Two,Somebody,
`

const parsed = parseCrewCreditsCsv(bomCsv)
assert.equal(parsed.errors.length, 0)
assert.equal(parsed.rows.length, 6)
assert.equal(stripBom('\uFEFFabc'), 'abc')

const mapped = mapCrewCreditsCsvRows(parsed.rows)
assert.ok(mapped.mappedCount >= 2)
assert.equal(mapped.blockingErrorCount, 2) // unknown dept + missing dept for custom
assert.ok(mapped.previewRows.some((row) => row.roleKey === 'director'))
assert.ok(mapped.previewRows.some((row) => row.roleKey === 'dop'))
assert.ok(mapped.previewRows.some((row) => row.roleKey === 'creative_director'))
assert.ok(mapped.previewRows.some((row) => row.roleKey === 'pa' && row.roleRaw === 'Runner'))

const creative = mapped.previewRows.find((row) => row.roleKey === 'creative_director')
assert.ok(creative)
assert.equal(creative!.people.length, 2)
assert.equal(creative!.people[0].url, 'https://example.com/jane')

// --- dept-scoped Sound Engineer + boom custom canonical ---------------------

const soundCsv = mapCrewCreditsCsvRows(
  parseCrewCreditsCsv(`Department,Role,Names
Post,Sound Engineer,Trung
Production,Sound Engineer,OnSet Mixer
Production,Boom Operator,Boom Person
`).rows,
)
assert.equal(
  soundCsv.previewRows.find((r) => r.roleRaw === 'Sound Engineer' && r.department === 'post')
    ?.roleKey,
  'sound_design_mix',
)
assert.equal(
  soundCsv.previewRows.find(
    (r) => r.roleRaw === 'Sound Engineer' && r.department === 'production',
  )?.roleKey,
  'sound_recordist',
)
const boomRow = soundCsv.previewRows.find((r) => r.roleRaw === 'Boom Operator')
assert.ok(boomRow?.isCustomRole)
assert.equal(boomRow?.roleLabel, 'Boom Op')

// --- role suggestion Confirm / Skip blocks apply gate -----------------------

const fuzzyCsv = mapCrewCreditsCsvRows(
  parseCrewCreditsCsv(`Department,Role,Names
Production,Agency Producer,Someone
`).rows,
)
const withRoleSuggestions = attachRoleSuggestions(fuzzyCsv.previewRows)
const agencyRow = withRoleSuggestions.find((r) => r.roleLabel === 'Agency Producer')
assert.ok(agencyRow?.isCustomRole)
// Agency Producer should stay custom without a forced standard suggestion in most cases;
// if a suggestion appears it must be pending until resolved.
if (agencyRow?.roleSuggestion?.status === 'pending') {
  assert.equal(countPendingRoleSuggestions(withRoleSuggestions), 1)
  const skipped = withRoleSuggestions.map((row) =>
    row.id === agencyRow.id ? skipRoleSuggestion(row) : row,
  )
  assert.equal(countPendingRoleSuggestions(skipped), 0)
}

// Force a confirm path via a near-standard custom that findRoleMatch can hit
const nearMatchRows = attachRoleSuggestions(
  mapCrewCreditsCsvRows(
    parseCrewCreditsCsv(`Department,Role,Names
G&E,Sparks,Sparky
`).rows,
  ).previewRows,
)
// "Sparks" exact-aliases to electrician via catalog — should auto-map, no suggestion
assert.ok(nearMatchRows.some((r) => r.roleKey === 'electrician'))
assert.equal(countPendingRoleSuggestions(nearMatchRows), 0)

const confirmDemo = attachRoleSuggestions([
  {
    id: 'demo',
    lineNumbers: [1],
    department: 'production',
    departmentRaw: 'Production',
    roleRaw: 'Prod Manager',
    roleLabel: 'Prod Manager',
    isCustomRole: true,
    people: [{name: 'Pat'}],
    status: 'custom' as const,
    existingPeople: [],
  },
])
if (confirmDemo[0]?.roleSuggestion?.status === 'pending') {
  const confirmed = confirmRoleSuggestion(confirmDemo[0])
  assert.equal(confirmed.isCustomRole, false)
  assert.ok(confirmed.roleKey)
  assert.equal(confirmed.roleSuggestion?.status, 'confirmed')
  assert.equal(countPendingRoleSuggestions([confirmed]), 0)
}
// --- names-only CSV (no URL column) ----------------------------------------

const namesOnly = parseCrewCreditsCsv(`Department,Role,Names
Production,Brand,Govee
Production,Production Company,Vantage Pictures
Camera,DOP,Kelvin Chew
`)
assert.equal(namesOnly.errors.length, 0)
assert.equal(namesOnly.rows.length, 3)
assert.ok(namesOnly.rows.every((row) => row.url === ''))

// --- repeated standard roles combine ----------------------------------------

const repeated = parseCrewCreditsCsv(`Role,Names
Director,Ada
Director,Bea
`)
const repeatedMapped = mapCrewCreditsCsvRows(repeated.rows)
const director = repeatedMapped.previewRows.find((row) => row.roleKey === 'director')
assert.ok(director)
assert.deepEqual(
  director!.people.map((p) => p.name),
  ['Ada', 'Bea'],
)

// --- merge fill preserves existing standard roles ---------------------------

const existing = [
  {
    _key: 'keep-me',
    _type: 'crewCredit' as const,
    department: 'production' as const,
    roleKey: 'director',
    role: 'Director',
    isCustomRole: false,
    people: [{_key: 'p1', _type: 'crewPerson' as const, name: 'Existing Director'}],
  },
]

const fill = mergeCrewCredits(existing, repeatedMapped.previewRows, 'fill')
assert.equal(fill.skippedPreserved, 1)
assert.equal(fill.credits.find((c) => c._key === 'keep-me')?.people[0].name, 'Existing Director')
assert.equal(fill.linksEnriched, 0)

const replace = mergeCrewCredits(existing, repeatedMapped.previewRows, 'replace')
assert.equal(replace.updated, 1)
assert.deepEqual(
  replace.credits.find((c) => c.roleKey === 'director')?.people.map((p) => p.name),
  ['Ada', 'Bea'],
)
assert.equal(replace.credits.find((c) => c.roleKey === 'director')?._key, 'keep-me')

// --- custom roles append without duplicates ---------------------------------

const customPreview = mapCrewCreditsCsvRows(
  parseCrewCreditsCsv(`Department,Role,Names
Production,Agency Producer,Alex
Production,Agency Producer,Alex
Production,Agency Producer,Blake
`).rows,
)

const withCustom = mergeCrewCredits(
  [
    {
      _key: 'custom-1',
      _type: 'crewCredit',
      department: 'production',
      role: 'Agency Producer',
      isCustomRole: true,
      people: [{_key: 'a', _type: 'crewPerson', name: 'Alex'}],
    },
  ],
  customPreview.previewRows,
  'fill',
)

const agencyProducer = withCustom.credits.find((c) => c.role === 'Agency Producer')
assert.ok(agencyProducer)
assert.deepEqual(
  agencyProducer!.people.map((p) => p.name),
  ['Alex', 'Blake'],
)

// --- template is names-only (no URL column) ---------------------------------

const template = buildCrewCreditsCsvTemplate()
assert.ok(template.startsWith('\uFEFF'))
assert.match(template, /Department,Role,Names/)
assert.doesNotMatch(template, /Department,Role,Names,URL/)
assert.match(template, /Production,Brand,/)
assert.match(template, /Camera,DOP,/)
assert.match(template, /Post,3D Animation,/)
// New standards from role-merge promote pass
assert.match(template, /Production,Creative Director,/)
assert.match(template, /Production,Catering,/)
assert.match(template, /Production,Sound Recordist,/)
assert.match(template, /Camera,Camera Assistants,/)
assert.match(template, /Art,Wardrobe Assistant,/)
assert.match(template, /Post,Post House,/)
assert.match(template, /Post,Motion Graphics,/)
assert.match(template, /Post,Online,/)
assert.match(template, /Post,VFX,/)
// Recurring customs (kept out of catalog)
assert.match(template, /Production,Boom Op,/)
assert.match(template, /Production,Agency Producer,/)
assert.match(template, /Production,Director's Assistant,/)
assert.match(template, /Production,Medic,/)
assert.match(template, /G&E,Best Boy Electric,/)
assert.match(template, /Camera,Live-Stream Technician,/)
assert.match(template, /Post,Post PA,/)
const templateDataRows = template
  .replace(/^\uFEFF/, '')
  .trim()
  .split('\n')
  .slice(1)
assert.equal(templateDataRows.length, 70 + 11) // standards + recurring customs

// --- quoted Excel-style fields ----------------------------------------------

const quoted = parseCrewCreditsCsv(`Role,Names
"Director","Moore, Paul"
`)
assert.equal(quoted.rows[0].names, 'Moore, Paul')

// --- legacy HTML in CSV Names column ----------------------------------------

const htmlCsv = mapCrewCreditsCsvRows(
  parseCrewCreditsCsv(`Department,Role,Names
Production,Brand,"<a href=""https://fun-tech-lab.com/"" title=""Fun-Tech-Lab | Innovative Displays"" target=""_blank"" rel=""noopener"">Fun-Tech Lab</a>"
Production,Production Company,"<a href=""/"" title=""Vantage Pictures | Commercial Film Production Company"">Vantage Pictures</a>"
`).rows,
)
const htmlBrand = htmlCsv.previewRows.find((r) => r.roleKey === 'brand')
assert.equal(htmlBrand?.people[0].name, 'Fun-Tech Lab')
assert.equal(htmlBrand?.people[0].url, 'https://fun-tech-lab.com/')
assert.equal(htmlBrand?.people[0].linkTitle, 'Fun-Tech-Lab | Innovative Displays')
const htmlProd = htmlCsv.previewRows.find((r) => r.roleKey === 'production_company')
assert.equal(htmlProd?.people[0].name, 'Vantage Pictures')
assert.equal(htmlProd?.people[0].url, 'https://vantage.pictures/')
assert.equal(
  htmlProd?.people[0].linkTitle,
  'Vantage Pictures | Commercial Film Production Company',
)

// --- legacy HTML parse (relative + title) -----------------------------------

const legacyPeople = parseLegacyNamesHtml(
  `<a href="/" title="Vantage Pictures | A Global Video Production Company">Vantage Pictures</a>, Jane Doe`,
)
assert.equal(legacyPeople.length, 2)
assert.equal(legacyPeople[0].name, 'Vantage Pictures')
assert.equal(legacyPeople[0].url, 'https://vantage.pictures/')
assert.equal(legacyPeople[0].linkTitle, 'Vantage Pictures | A Global Video Production Company')
assert.equal(legacyPeople[1].name, 'Jane Doe')
assert.equal(legacyPeople[1].url, undefined)

// --- link memory ------------------------------------------------------------

assert.equal(normalizePersonName('  Vantage Pictures '), 'vantage pictures')

const memory = buildLinkMemory([
  {
    _type: 'crewCredit',
    department: 'production',
    roleKey: 'brand',
    role: 'Brand',
    people: [
      {
        name: 'Govee',
        url: 'https://us.govee.com/',
        linkTitle: 'Govee Smart Lighting',
      },
    ],
  },
  {
    _type: 'crewCredit',
    department: 'production',
    roleKey: 'production_company',
    role: 'Production Company',
    people: [
      {
        name: 'Vantage Pictures',
        url: 'https://vantage.pictures/',
        linkTitle: 'Vantage Pictures | A Global Video Production Company',
      },
    ],
  },
  {
    _type: 'crewCredit',
    department: 'production',
    roleKey: 'brand',
    role: 'Brand',
    people: [{name: 'Govee', url: 'https://us.govee.com/'}],
  },
])

assert.equal(memory.get('govee')?.url, 'https://us.govee.com/')
assert.equal(memory.get('govee')?.linkTitle, 'Govee Smart Lighting')
assert.equal(memory.get('vantage pictures')?.url, 'https://vantage.pictures/')

const docMemory = buildLinkMemory([
  {
    _type: 'crewCredit',
    department: 'production',
    roleKey: 'brand',
    role: 'Brand',
    people: [{name: 'Govee', url: 'https://example.com/override'}],
  },
])
const mergedMemory = mergeLinkMemories(memory, docMemory)
assert.equal(mergedMemory.get('govee')?.url, 'https://example.com/override')

const enriched = enrichPeopleWithLinkMemory(
  [{_type: 'crewPerson', name: 'Govee'}, {_type: 'crewPerson', name: 'Unknown Person'}],
  memory,
)
assert.equal(enriched.enriched, 1)
assert.equal(enriched.people[0].url, 'https://us.govee.com/')
assert.equal(enriched.people[0].linkTitle, 'Govee Smart Lighting')
assert.equal(enriched.people[1].url, undefined)

// Existing URL must not be overwritten
const keepUrl = enrichPeopleWithLinkMemory(
  [{_type: 'crewPerson', name: 'Govee', url: 'https://already.set/'}],
  memory,
)
assert.equal(keepUrl.enriched, 0)
assert.equal(keepUrl.people[0].url, 'https://already.set/')

// --- site-wide link apply to matching names ---------------------------------

const propagateTarget = applyPersonLinkToCredits(
  [
    {
      _type: 'crewCredit',
      department: 'production',
      roleKey: 'production_company',
      role: 'Production Company',
      people: [
        {_type: 'crewPerson', name: 'Vantage Pictures'},
        {_type: 'crewPerson', name: 'Other Co'},
      ],
    },
    {
      _type: 'crewCredit',
      department: 'production',
      roleKey: 'brand',
      role: 'Brand',
      people: [{_type: 'crewPerson', name: 'vantage pictures', url: 'https://old.example/'}],
    },
  ],
  {name: 'Vantage Pictures', url: 'https://vantage.pictures/', linkTitle: 'Vantage Pictures'},
)
assert.equal(propagateTarget.peopleUpdated, 2)
assert.equal(propagateTarget.credits[0].people[0].url, 'https://vantage.pictures/')
assert.equal(propagateTarget.credits[0].people[1].url, undefined)
assert.equal(propagateTarget.credits[1].people[0].url, 'https://vantage.pictures/')
assert.equal(propagateTarget.credits[1].people[0].linkTitle, 'Vantage Pictures')

const alreadyLinked = applyPersonLinkToCredits(propagateTarget.credits, {
  name: 'Vantage Pictures',
  url: 'https://vantage.pictures/',
})
assert.equal(alreadyLinked.peopleUpdated, 0)

// --- site-wide rename apply to matching names -------------------------------

const renameTarget = applyPersonRenameToCredits(
  [
    {
      _type: 'crewCredit',
      department: 'production',
      roleKey: 'pa',
      role: 'PA',
      people: [
        {_type: 'crewPerson', name: 'Minh Thuan', url: 'https://example.com/minh'},
        {_type: 'crewPerson', name: 'Other Person'},
      ],
    },
    {
      _type: 'crewCredit',
      department: 'production',
      roleKey: 'line_producer',
      role: 'Line Producer',
      people: [{_type: 'crewPerson', name: 'minh thuan'}],
    },
  ],
  {fromName: 'Minh Thuan', toName: 'Minh Thuận'},
)
assert.equal(renameTarget.peopleUpdated, 2)
assert.equal(renameTarget.credits[0].people[0].name, 'Minh Thuận')
assert.equal(renameTarget.credits[0].people[0].url, 'https://example.com/minh')
assert.equal(renameTarget.credits[0].people[1].name, 'Other Person')
assert.equal(renameTarget.credits[1].people[0].name, 'Minh Thuận')

const alreadyRenamed = applyPersonRenameToCredits(renameTarget.credits, {
  fromName: 'Minh Thuan',
  toName: 'Minh Thuận',
})
assert.equal(alreadyRenamed.peopleUpdated, 0)

// --- rename by identity id (preferred over name matching) -------------------

const identityRename = applyPersonRenameToCredits(
  [
    {
      _type: 'crewCredit',
      department: 'camera',
      roleKey: 'dop',
      role: 'DOP',
      people: [
        {
          _type: 'crewPerson',
          name: 'Old Spelling',
          identity: {_type: 'reference', _ref: 'ci_testperson'},
        },
        {_type: 'crewPerson', name: 'Old Spelling'},
      ],
    },
  ],
  {fromName: 'Old Spelling', toName: 'New Spelling', identityId: 'ci_testperson'},
)
assert.equal(identityRename.peopleUpdated, 1)
assert.equal(identityRename.credits[0].people[0].name, 'New Spelling')
assert.equal(identityRename.credits[0].people[1].name, 'Old Spelling')

// --- merge applies link memory on CSV names ---------------------------------

const brandCsv = mapCrewCreditsCsvRows(
  parseCrewCreditsCsv(`Department,Role,Names
Production,Brand,Govee
Production,Production Company,Vantage Pictures
`).rows,
)

const linkedImport = mergeCrewCredits([], brandCsv.previewRows, 'fill', memory)
assert.equal(linkedImport.added, 2)
assert.ok(linkedImport.linksEnriched >= 2)
const brand = linkedImport.credits.find((c) => c.roleKey === 'brand')
assert.equal(brand?.people[0].url, 'https://us.govee.com/')
assert.equal(brand?.people[0].linkTitle, 'Govee Smart Lighting')
const prodCo = linkedImport.credits.find((c) => c.roleKey === 'production_company')
assert.equal(prodCo?.people[0].url, 'https://vantage.pictures/')

// --- missing Role / Names headers are blocking ------------------------------

const badHeaders = parseCrewCreditsCsv(`Foo,Bar
a,b
`)
assert.ok(badHeaders.errors.length >= 2)

// --- name duplicate matching ------------------------------------------------

const catalog = buildNameCatalog([
  {name: 'Tuyển Trần', url: 'https://example.com/tuyen', linkTitle: 'Tuyển Trần'},
  {name: 'Tuyển Trần'},
  {name: 'Tuyển Trần'},
  {name: 'Mate Toth Widamon'},
  {name: 'Mate Toth Widamon'},
  {name: 'Paul Moore'},
])

const roleCatalog = buildNameCatalogFromCredits([
  {
    roleKey: 'editor',
    people: [
      {name: 'Tuyển Trần', url: 'https://example.com/tuyen', linkTitle: 'Tuyển Trần'},
      {name: 'Tuyển Trần'},
    ],
  },
  {
    roleKey: 'dop',
    people: [{name: 'Tuyển Trần'}],
  },
  {
    roleKey: 'producer',
    people: [{name: 'Quyên Nguyễn'}],
  },
])

const diacriticMatch = findNameMatch('Tuyen Tran', roleCatalog)
assert.ok(diacriticMatch)
assert.equal(diacriticMatch!.canonical, 'Tuyển Trần')
assert.ok(diacriticMatch!.reasons.includes('diacritic'))
assert.equal(diacriticMatch!.url, 'https://example.com/tuyen')
assert.deepEqual(diacriticMatch!.roles, ['DOP', 'Editor'])

const wordOrderMatch = findNameMatch('Toth Widamon Mate', catalog)
assert.ok(wordOrderMatch)
assert.equal(wordOrderMatch!.canonical, 'Mate Toth Widamon')
assert.ok(wordOrderMatch!.reasons.includes('word_order'))

assert.equal(findNameMatch('Paul Moore', catalog), null)
assert.equal(findNameMatch('Totally Unknown Person', catalog), null)

const exactHyundai = findExactNameInCatalog('Hyundai', [
  {name: 'Hyundai', count: 5, url: 'https://hyundai.com'},
  {name: 'Paul Moore', count: 2},
])
assert.ok(exactHyundai)
assert.equal(exactHyundai!.url, 'https://hyundai.com')
assert.equal(findExactNameInCatalog('hyundai', [{name: 'Hyundai', count: 1}])?.name, 'Hyundai')
assert.equal(findExactNameInCatalog('Brand New Co', catalog), null)

const previewEnriched = preparePreviewPeople(
  [{name: 'Hyundai'}, {name: 'Brand New Co'}, {name: 'Moore Paul'}],
  [
    {name: 'Hyundai', count: 12, url: 'https://hyundai.com'},
    {name: 'Paul Moore', count: 4, url: 'https://paul.example'},
  ],
  buildLinkMemory([
    {
      _type: 'crewCredit',
      department: 'production',
      role: 'Brand',
      people: [{name: 'Hyundai', url: 'https://hyundai.com'}],
    },
  ]),
)
assert.equal(previewEnriched[0].url, 'https://hyundai.com')
assert.equal(previewEnriched[1].url, undefined)
assert.equal(previewEnriched[2].duplicate?.status, 'pending')
assert.ok(
  isKnownPreviewPerson(
    previewEnriched[0],
    [{name: 'Hyundai', count: 12, url: 'https://hyundai.com'}],
    new Map(),
  ),
)
assert.equal(
  isKnownPreviewPerson(previewEnriched[1], [{name: 'Hyundai', count: 12}], new Map()),
  false,
)

const attached = attachNameDuplicates(
  [{name: 'Tuyen Tran'}, {name: 'Paul Moore'}],
  roleCatalog,
)
assert.equal(attached[0].duplicate?.status, 'pending')
assert.equal(attached[0].duplicate?.candidate, 'Tuyển Trần')
assert.deepEqual(attached[0].duplicate?.roles, ['DOP', 'Editor'])
assert.equal(
  duplicateAlertLabel(attached[0].duplicate!),
  '“Tuyen Tran” may be “Tuyển Trần” (3 uses · DOP, Editor)',
)
assert.equal(attached[1].duplicate, undefined)
assert.equal(countPendingDuplicates([{people: attached}]), 1)

const confirmed = confirmNameDuplicate(attached[0])
assert.equal(confirmed.name, 'Tuyển Trần')
assert.equal(confirmed.url, 'https://example.com/tuyen')
assert.equal(confirmed.linkTitle, 'Tuyển Trần')
assert.equal(confirmed.duplicate?.status, 'confirmed')
assert.equal(countPendingDuplicates([{people: [confirmed, attached[1]]}]), 0)

// Confirm merge beside an existing same-field canonical → one pill
const fieldWithVariant = attachNameDuplicates(
  [
    {name: 'Paul Moore', url: 'https://paul.example'},
    {name: 'Moore Paul'},
  ],
  [{name: 'Paul Moore', count: 51, url: 'https://paul.example', roles: ['Director']}],
)
assert.equal(fieldWithVariant[1].duplicate?.status, 'pending')
const afterConfirm = collapseSameNamePeopleInField([
  fieldWithVariant[0],
  confirmNameDuplicate(fieldWithVariant[1]),
])
assert.equal(afterConfirm.length, 1)
assert.equal(afterConfirm[0].name, 'Paul Moore')
assert.equal(afterConfirm[0].url, 'https://paul.example')
assert.equal(afterConfirm[0].duplicate?.status, 'confirmed')

// Exact identical names in one field collapse on prepare
const exactDupes = preparePreviewPeople(
  [{name: 'Hyundai'}, {name: 'Hyundai'}, {name: 'VeryBig'}],
  [{name: 'Hyundai', count: 3, url: 'https://hyundai.com'}],
  new Map(),
)
assert.equal(exactDupes.length, 2)
assert.equal(exactDupes[0].name, 'Hyundai')
assert.equal(exactDupes[0].url, 'https://hyundai.com')

const skipped = skipNameDuplicate(attached[0])
assert.equal(skipped.name, 'Tuyen Tran')
assert.equal(skipped.duplicate?.status, 'skipped')
assert.equal(countPendingDuplicates([{people: [skipped]}]), 0)

const preservedSkip = attachNameDuplicates([skipped], roleCatalog)
assert.equal(preservedSkip[0].duplicate?.status, 'skipped')
assert.equal(preservedSkip[0].name, 'Tuyen Tran')

// --- name autocomplete search ------------------------------------------------

const autocompleteCatalog = buildNameCatalog([
  {name: 'Tóth Widamon Máté'},
  {name: 'Tóth Widamon Máté'},
  {name: 'Paul Moore'},
  {name: 'Jane Director'},
])

const tothHits = searchNameSuggestions('toth', {
  siteCatalog: autocompleteCatalog,
  roleCatalog: [{name: 'Tóth Widamon Máté', count: 2}],
})
assert.ok(tothHits.some((hit) => hit.name === 'Tóth Widamon Máté'))
assert.equal(tothHits[0]?.name, 'Tóth Widamon Máté')
assert.equal(tothHits[0]?.inRole, true)

const mateHits = searchNameSuggestions('mate', {siteCatalog: autocompleteCatalog})
assert.ok(mateHits.some((hit) => hit.name === 'Tóth Widamon Máté'))

const excluded = searchNameSuggestions('paul', {
  siteCatalog: autocompleteCatalog,
  excludeNames: ['Paul Moore'],
})
assert.equal(excluded.length, 0)

const rolePriority = searchNameSuggestions('jane', {
  siteCatalog: autocompleteCatalog,
  roleCatalog: [{name: 'Jane Director', count: 1}],
})
assert.equal(rolePriority[0]?.name, 'Jane Director')
assert.equal(rolePriority[0]?.inRole, true)

// Search-only Đ/đ fold (must not change normalizeCreditToken / normName)
const strokeDCatalog = buildNameCatalog([
  {name: 'Cam Đg'},
  {name: 'Nguyễn Thúc Thùy Tiên'},
  {name: 'Chú Hải PS'},
])
const camDgHits = searchNameSuggestions('Cam Dg', {siteCatalog: strokeDCatalog})
assert.ok(camDgHits.some((hit) => hit.name === 'Cam Đg'))
assert.equal(camDgHits[0]?.matchKind, 'exact')
const camStrokeHits = searchNameSuggestions('Cam Đg', {siteCatalog: strokeDCatalog})
assert.ok(camStrokeHits.some((hit) => hit.name === 'Cam Đg'))
const nguyenHits = searchNameSuggestions('Nguyen', {siteCatalog: strokeDCatalog})
assert.ok(nguyenHits.some((hit) => hit.name === 'Nguyễn Thúc Thùy Tiên'))
const chuHaiHits = searchNameSuggestions('Chu Hai', {siteCatalog: strokeDCatalog})
assert.ok(chuHaiHits.some((hit) => hit.name === 'Chú Hải PS'))
assert.equal(normalizeCreditToken('Cam Đg'), 'cam g')
assert.equal(normalizeCreditToken('Cam Dg'), 'cam dg')
assert.notEqual(normalizeCreditToken('Cam Đg'), normalizeCreditToken('Cam Dg'))

const roleIndexes = buildRoleCatalogIndexes([
  {
    department: 'camera',
    roleKey: 'dop',
    people: [{name: 'Tóth Widamon Máté'}],
  },
  {
    department: 'camera',
    roleKey: 'camera_op',
    people: [{name: 'Paul Moore'}],
  },
])
assert.ok(roleIndexes.roleCatalogByKey.get('dop')?.some((entry) => entry.name === 'Tóth Widamon Máté'))
assert.ok(roleIndexes.deptCatalogByKey.get('camera')?.some((entry) => entry.name === 'Paul Moore'))

const roleIndexesWithIdentity = buildRoleCatalogIndexes([
  {
    department: 'stills',
    roleKey: 'photographer',
    role: 'Photographer',
    people: [{name: 'Jane Photo', identity: {_ref: 'ci_jane_photo'}}],
  },
])
assert.equal(
  roleIndexesWithIdentity.roleCatalogByKey.get('photographer')?.[0]?.identityId,
  'ci_jane_photo',
)

// --- taxonomy sync from Brand / Director / DOP / Art Director ---------------

assert.equal(slugifyPersonName('Zacharia Lorenz'), 'zacharia-lorenz')
assert.equal(slugifyPersonName('Minh Thuận'), 'minh-thuan')
assert.equal(slugifyPersonName('Nguyễn Đức Hải'), 'nguyen-duc-hai')

const taxonomyPlan = planTaxonomySyncFromCredits([
  {
    _type: 'crewCredit',
    department: 'production',
    roleKey: 'brand',
    role: 'Brand',
    people: [
      {_type: 'crewPerson', name: 'Mammotion'},
      {_type: 'crewPerson', name: 'Mammotion'},
    ],
  },
  {
    _type: 'crewCredit',
    department: 'production',
    roleKey: 'director',
    role: 'Director',
    people: [
      {_type: 'crewPerson', name: 'Zacharia Lorenz'},
      {_type: 'crewPerson', name: 'Paul Moore'},
    ],
  },
  {
    _type: 'crewCredit',
    department: 'camera',
    roleKey: 'dop',
    role: 'DOP',
    people: [{_type: 'crewPerson', name: 'Robin Taylor'}],
  },
  {
    _type: 'crewCredit',
    department: 'art',
    roleKey: 'art_director',
    role: 'Art Director',
    people: [{_type: 'crewPerson', name: 'Deen Abrahams'}],
  },
])

assert.deepEqual(taxonomyPlan.clientNames, ['Mammotion'])
assert.deepEqual(taxonomyPlan.crewByRole.director, ['Zacharia Lorenz', 'Paul Moore'])
assert.deepEqual(taxonomyPlan.crewByRole.dop, ['Robin Taylor'])
assert.deepEqual(taxonomyPlan.crewByRole['art-director'], ['Deen Abrahams'])

const taxonomyPatch = resolveTaxonomyPatch(
  taxonomyPlan,
  [{_id: 'client-mammotion', name: 'Mammotion', slug: 'mammotion'}],
  [
    {
      _id: 'crew-director-paul-moore',
      name: 'Paul Moore',
      slug: 'paul-moore',
      role: 'director',
    },
  ],
)
assert.equal(taxonomyPatch.clients.length, 1)
assert.equal(taxonomyPatch.clients[0]._ref, 'client-mammotion')
assert.equal(taxonomyPatch.createClients.length, 0)
assert.equal(taxonomyPatch.crewMembers.length, 4)
assert.equal(taxonomyPatch.createCrewMembers.length, 3)
assert.ok(
  taxonomyPatch.crewMembers.some((ref) => ref._ref === 'crew-director-paul-moore'),
)
assert.ok(
  taxonomyPatch.createCrewMembers.some(
    (doc) => doc.name === 'Zacharia Lorenz' && doc.role === 'director',
  ),
)

// --- creditIdentity link resolve --------------------------------------------

const identityPlan = planIdentitySyncFromCredits([
  {
    _type: 'crewCredit',
    department: 'production',
    roleKey: 'brand',
    role: 'Brand',
    people: [{_type: 'crewPerson', name: 'Mammotion'}],
  },
  {
    _type: 'crewCredit',
    department: 'post',
    roleKey: 'editor',
    role: 'Editor',
    people: [{_type: 'crewPerson', name: 'Jane Editor'}],
  },
])
assert.deepEqual(identityPlan.namesByRole.brand, ['Mammotion'])
assert.deepEqual(identityPlan.namesByRole.editor, ['Jane Editor'])

const identityLinks = resolveIdentityLinksOnCredits(
  [
    {
      _type: 'crewCredit',
      department: 'camera',
      roleKey: 'dop',
      role: 'DOP',
      people: [{_type: 'crewPerson', name: 'Nguyễn Đức Hải'}],
    },
    {
      _type: 'crewCredit',
      department: 'production',
      roleKey: 'director',
      role: 'Director',
      people: [{_type: 'crewPerson', name: 'Nguyễn Đức Hải'}],
    },
  ],
  [],
)
assert.equal(identityLinks.createIdentities.length, 1)
assert.equal(identityLinks.links.length, 2)
assert.equal(
  identityLinks.nextCredits[0].people[0].identity?._ref,
  identityLinks.createIdentities[0]._id,
)
assert.equal(
  identityLinks.nextCredits[1].people[0].identity?._ref,
  identityLinks.createIdentities[0]._id,
)

const castingPolicyLinks = resolveIdentityLinksOnCredits(
  [
    {
      _type: 'crewCredit',
      department: 'casting',
      roleKey: 'casting_director',
      role: 'Casting Director',
      people: [{_type: 'crewPerson', name: 'Casting Lead'}],
    },
    {
      _type: 'crewCredit',
      department: 'camera',
      roleKey: 'dop',
      role: 'DOP',
      people: [{_type: 'crewPerson', name: 'Ignored DOP'}],
    },
  ],
  [],
  identityLinkPolicyForDepartments(['casting']),
)
assert.equal(castingPolicyLinks.createIdentities.length, 1)
assert.equal(castingPolicyLinks.createIdentities[0]?.name, 'Casting Lead')
assert.equal(castingPolicyLinks.links.length, 1)
assert.equal(castingPolicyLinks.nextCredits[1].people[0].identity?._ref, undefined)

const customRoleSkipped = resolveIdentityLinksOnCredits(
  [
    {
      _type: 'crewCredit',
      department: 'casting',
      roleKey: 'casting_director',
      role: 'Casting Assistant',
      isCustomRole: true,
      people: [{_type: 'crewPerson', name: 'Custom Casting Name'}],
    },
  ],
  [],
  identityLinkPolicyForDepartments(['casting']),
)
assert.equal(customRoleSkipped.createIdentities.length, 0)
assert.equal(customRoleSkipped.links.length, 0)

console.log('crew-credits-csv.test.ts: all assertions passed')
