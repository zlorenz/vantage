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
  normalizeCreditToken,
  parseLegacyNamesHtml,
  resolveDepartment,
  resolveStandardRole,
  searchNameSuggestions,
} from '@crew-credits'

import {mapCrewCreditsCsvRows} from './csv-map'
import {buildRoleCatalogIndexes} from './name-catalog-index'
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
  confirmNameDuplicate,
  countPendingDuplicates,
  duplicateAlertLabel,
  skipNameDuplicate,
} from './name-duplicates'

// --- catalog integrity ------------------------------------------------------

assert.equal(CREW_ROLES_FLAT.length, 63)

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
assert.equal(resolveDepartment('G&E'), 'ge')
assert.equal(resolveDepartment('Post-Production'), 'post')
assert.equal(resolveDepartment('Stills'), 'stills')

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
assert.ok(mapped.previewRows.some((row) => row.isCustomRole && row.roleLabel === 'Creative Director'))
assert.ok(mapped.previewRows.some((row) => row.isCustomRole && row.roleLabel === 'Runner'))

const creative = mapped.previewRows.find((row) => row.roleLabel === 'Creative Director')
assert.ok(creative)
assert.equal(creative!.people.length, 2)
assert.equal(creative!.people[0].url, 'https://example.com/jane')

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
Production,Runner,Alex
Production,Runner,Alex
Production,Runner,Blake
`).rows,
)

const withCustom = mergeCrewCredits(
  [
    {
      _key: 'custom-1',
      _type: 'crewCredit',
      department: 'production',
      role: 'Runner',
      isCustomRole: true,
      people: [{_key: 'a', _type: 'crewPerson', name: 'Alex'}],
    },
  ],
  customPreview.previewRows,
  'fill',
)

const runner = withCustom.credits.find((c) => c.role === 'Runner')
assert.ok(runner)
assert.deepEqual(
  runner!.people.map((p) => p.name),
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

console.log('crew-credits-csv.test.ts: all assertions passed')
