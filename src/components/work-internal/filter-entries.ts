/**
 * Client-side filter pipeline for the internal work library.
 *
 * Filter values are opaque creditIdentity `_id`s (ci_…). Transitional
 * unlinked credits use `unlinked-{slug}` option ids matched by name.
 */

import {getStructuredRoleNames} from '@/lib/credits-config';
import type {
  CreditIdentityTerm,
  InternalLibraryEntry,
} from '@/types/sanity';
import {
  PEOPLE_FILTER_GROUPS,
  type PeopleFilterRoleKey,
  type PeopleLibraryFilterKey,
  peopleGroupByLibraryKey,
} from './people-filters';
import {DEFAULT_FILTERS, type LibraryFilters} from './types';

/** brand + people filter match keys (includes synthetic `vfx_online`). */
export type FilterRoleKey = 'brand' | PeopleFilterRoleKey;

const FILTER_ROLE_TO_LIBRARY_KEY: Record<
  FilterRoleKey,
  keyof LibraryFilters
> = {
  brand: 'client',
  director: 'director',
  dop: 'dop',
  art_director: 'art-director',
  editor: 'editor',
  producer: 'producer',
  line_producer: 'line-producer',
  colorist: 'colorist',
  sound_design_mix: 'sound-design-mix',
  composer: 'composer',
  '1st_ad': '1st-ad',
  vfx_online: 'vfx-online',
};

/** Optional name lookups for transitional unlinked / legacy slug matching. */
export interface LibraryFilterContext {
  nameByFilterId?: ReadonlyMap<string, string>;
  /** Precomputed lowercase search blobs keyed by entry `_id`. */
  searchTextByEntryId?: ReadonlyMap<string, string>;
}

function catalogRoleKeysForFilterRole(
  roleKey: FilterRoleKey,
): readonly string[] {
  if (roleKey === 'brand') return ['brand'];
  const group = PEOPLE_FILTER_GROUPS.find((g) => g.roleKey === roleKey);
  return group?.catalogRoleKeys ?? [roleKey];
}

function getProductionDesignerNames(entry: InternalLibraryEntry): string[] {
  return getStructuredRoleNames(entry.crewCredits, 'production_designer');
}

function getEditorNames(entry: InternalLibraryEntry): string[] {
  return getStructuredRoleNames(entry.crewCredits, 'editor');
}

function getBrandNames(entry: InternalLibraryEntry): string[] {
  return getStructuredRoleNames(entry.crewCredits, 'brand');
}

function getCreditRoleNames(
  entry: InternalLibraryEntry,
  roleKey: FilterRoleKey,
): string[] {
  if (roleKey === 'brand') return getBrandNames(entry);
  const names: string[] = [];
  for (const catalogKey of catalogRoleKeysForFilterRole(roleKey)) {
    names.push(...getStructuredRoleNames(entry.crewCredits, catalogKey));
  }
  return names;
}

export function toFilterSlug(name: string): string {
  return name
    .replace(/đ/gi, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function nameIdentityKey(name: string): string {
  return toFilterSlug(name);
}

function unlinkedOptionId(name: string): string {
  return `unlinked-${toFilterSlug(name)}`;
}

function isUnlinkedOptionId(id: string): boolean {
  return id.startsWith('unlinked-');
}

function peopleForRole(entry: InternalLibraryEntry, roleKey: FilterRoleKey) {
  const catalogKeys = new Set(catalogRoleKeysForFilterRole(roleKey));
  return (entry.crewCredits ?? [])
    .filter(
      (credit) =>
        Boolean(credit.roleKey) &&
        catalogKeys.has(credit.roleKey!) &&
        !credit.isCustomRole,
    )
    .flatMap((credit) => credit.people ?? []);
}

function namesMatchFilter(
  names: string[],
  filterId: string,
  displayName?: string,
): boolean {
  if (displayName) {
    const needle = displayName.trim().toLowerCase();
    if (names.some((part) => part.toLowerCase() === needle)) return true;
  }
  if (isUnlinkedOptionId(filterId)) {
    const slug = filterId.slice('unlinked-'.length);
    return names.some((name) => toFilterSlug(name) === slug);
  }
  // Legacy slug URL fallback (pre-identity).
  if (!filterId.startsWith('ci_')) {
    return names.some((name) => toFilterSlug(name) === filterId);
  }
  return false;
}

function matchesRoleFilter(
  entry: InternalLibraryEntry,
  roleKey: FilterRoleKey,
  filterId: string,
  nameByFilterId?: ReadonlyMap<string, string>,
): boolean {
  if (!filterId) return true;

  const people = peopleForRole(entry, roleKey);
  if (people.some((person) => person.identityId === filterId)) return true;

  const displayName = nameByFilterId?.get(filterId);
  if (
    namesMatchFilter(getCreditRoleNames(entry, roleKey), filterId, displayName)
  ) {
    return true;
  }

  // Art filter also matches Production Designer by display name.
  if (roleKey === 'art_director' && displayName) {
    const needle = displayName.trim().toLowerCase();
    if (
      getProductionDesignerNames(entry).some(
        (part) => part.toLowerCase() === needle,
      )
    ) {
      return true;
    }
  }

  // Legacy taxonomy slug arrays (until clients/crewMembers are retired).
  if (roleKey === 'brand' && entry.clients?.some((c) => c.slug === filterId)) {
    return true;
  }
  if (
    roleKey !== 'brand' &&
    roleKey !== 'editor' &&
    roleKey !== 'vfx_online' &&
    entry.crewMembers?.some(
      (m) =>
        m.slug === filterId &&
        (roleKey === 'art_director'
          ? m.role === 'art-director'
          : m.role === roleKey),
    )
  ) {
    return true;
  }

  return false;
}

/**
 * Build filter dropdown options for a role from linked identities + unlinked names.
 */
export function buildIdentityFilterOptions(
  entries: InternalLibraryEntry[],
  roleKey: FilterRoleKey,
  extraNames?: (entry: InternalLibraryEntry) => string[],
): CreditIdentityTerm[] {
  const byId = new Map<string, CreditIdentityTerm>();
  const byName = new Map<string, CreditIdentityTerm>();

  function addTerm(term: CreditIdentityTerm): void {
    const nameKey = nameIdentityKey(term.name);
    if (!term._id || !nameKey) return;
    if (byId.has(term._id) || byName.has(nameKey)) return;
    byId.set(term._id, term);
    byName.set(nameKey, term);
  }

  for (const entry of entries) {
    for (const person of peopleForRole(entry, roleKey)) {
      const name = (person.identityName || person.name || '').trim();
      if (!name) continue;
      if (person.identityId) {
        addTerm({_id: person.identityId, name});
      } else {
        addTerm({_id: unlinkedOptionId(name), name});
      }
    }
    if (extraNames) {
      for (const name of extraNames(entry)) {
        const trimmed = name.trim();
        if (!trimmed) continue;
        addTerm({_id: unlinkedOptionId(trimmed), name: trimmed});
      }
    }
  }

  return [...byId.values()].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, {sensitivity: 'base'}),
  );
}

export function buildClientFilterOptions(
  entries: InternalLibraryEntry[],
): CreditIdentityTerm[] {
  return buildIdentityFilterOptions(entries, 'brand');
}

export function buildDirectorFilterOptions(
  entries: InternalLibraryEntry[],
): CreditIdentityTerm[] {
  return buildIdentityFilterOptions(entries, 'director');
}

export function buildDopFilterOptions(
  entries: InternalLibraryEntry[],
): CreditIdentityTerm[] {
  return buildIdentityFilterOptions(entries, 'dop');
}

export function buildArtDirectorFilterOptions(
  entries: InternalLibraryEntry[],
): CreditIdentityTerm[] {
  return buildIdentityFilterOptions(
    entries,
    'art_director',
    getProductionDesignerNames,
  );
}

export function buildEditorFilterOptions(
  entries: InternalLibraryEntry[],
): CreditIdentityTerm[] {
  return buildIdentityFilterOptions(entries, 'editor');
}

export function buildPeopleFilterOptions(
  entries: InternalLibraryEntry[],
  roleKey: PeopleFilterRoleKey,
): CreditIdentityTerm[] {
  if (roleKey === 'art_director') {
    return buildArtDirectorFilterOptions(entries);
  }
  return buildIdentityFilterOptions(entries, roleKey);
}

/** Options for every People panel group, keyed by LibraryFilters URL key. */
export function buildAllPeopleFilterOptions(
  entries: InternalLibraryEntry[],
): Record<PeopleLibraryFilterKey, CreditIdentityTerm[]> {
  const out = {} as Record<PeopleLibraryFilterKey, CreditIdentityTerm[]>;
  for (const group of PEOPLE_FILTER_GROUPS) {
    out[group.libraryKey] = buildPeopleFilterOptions(entries, group.roleKey);
  }
  return out;
}

export function identityNameById(
  terms: CreditIdentityTerm[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const term of terms) {
    map.set(term._id, term.name);
  }
  return map;
}

/** @deprecated Use identityNameById */
export function artDirectorNameBySlug(
  terms: CreditIdentityTerm[],
): Map<string, string> {
  return identityNameById(terms);
}

/** @deprecated Use identityNameById */
export function crewNameBySlug(
  terms: CreditIdentityTerm[],
): Map<string, string> {
  return identityNameById(terms);
}

/** @deprecated Use identityNameById */
export function clientNameBySlug(
  terms: CreditIdentityTerm[],
): Map<string, string> {
  return identityNameById(terms);
}

/** All crew names for a role, joined (comma-separated jobs show everyone). */
export function getCrewName(
  entry: InternalLibraryEntry,
  role: 'director' | 'dop' | 'art-director',
): string {
  const roleKey: FilterRoleKey =
    role === 'art-director' ? 'art_director' : role;
  const fromCredits = getCreditRoleNames(entry, roleKey);
  if (fromCredits.length) return fromCredits.join(', ');

  const fromTaxonomy = entry.crewMembers
    ?.filter((m) => m.role === role)
    .map((m) => m.name)
    .filter(Boolean);
  if (fromTaxonomy?.length) return fromTaxonomy.join(', ');
  return '—';
}

export function getPrimaryClientName(entry: InternalLibraryEntry): string {
  const brands = getBrandNames(entry);
  if (brands[0]) return brands[0];
  if (entry.clients?.[0]?.name) return entry.clients[0].name;
  return '—';
}

export function getEditorName(entry: InternalLibraryEntry): string {
  const names = getEditorNames(entry);
  return names.length ? names.join(', ') : '—';
}

/**
 * ART skim line: Production Designer when credited (regional head-of-art
 * title), otherwise Art Director from credits.
 */
export function getArtName(entry: InternalLibraryEntry): string {
  const pdNames = getProductionDesignerNames(entry);
  if (pdNames.length) return pdNames.join(', ');
  return getCrewName(entry, 'art-director');
}

/** Lowercase searchable blob for one entry (built once, reused per keystroke). */
export function buildSearchText(entry: InternalLibraryEntry): string {
  const editor = getEditorName(entry);
  const art = getArtName(entry);
  const parts = entry.displayTitleParts;
  const peopleNames = PEOPLE_FILTER_GROUPS.flatMap((group) =>
    getCreditRoleNames(entry, group.roleKey),
  );
  const haystacks: string[] = [
    entry.title,
    entry.titleZh ?? '',
    parts?.brandName ?? '',
    parts?.productName ?? '',
    parts?.campaignTitle ?? '',
    parts?.brandNameZh ?? '',
    parts?.productNameZh ?? '',
    parts?.campaignTitleZh ?? '',
    entry.heroFilmTitle ?? '',
    entry.heroFilmTitleZh ?? '',
    editor === '—' ? '' : editor,
    art === '—' ? '' : art,
    ...(entry.clients?.map((c) => c.name) ?? []),
    ...(entry.crewMembers?.map((m) => m.name) ?? []),
    ...getBrandNames(entry),
    ...peopleNames,
  ];
  return haystacks.join('\0').toLowerCase();
}

export function buildSearchTextByEntryId(
  entries: InternalLibraryEntry[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const entry of entries) {
    map.set(entry._id, buildSearchText(entry));
  }
  return map;
}

function matchesSearch(
  entry: InternalLibraryEntry,
  q: string,
  ctx?: LibraryFilterContext,
): boolean {
  if (!q) return true;
  const needle = q.toLowerCase().trim();
  if (!needle) return true;

  const hay =
    ctx?.searchTextByEntryId?.get(entry._id) ?? buildSearchText(entry);
  return hay.includes(needle);
}

function matchesTaxonomySlug(
  terms: {slug: string; slugZh?: string}[] | undefined,
  slug: string,
): boolean {
  return Boolean(terms?.some((t) => t.slug === slug || t.slugZh === slug));
}

function libraryKeyToFilterRole(
  key: keyof LibraryFilters,
): FilterRoleKey | null {
  if (key === 'client') return 'brand';
  const group = peopleGroupByLibraryKey(key);
  return group?.roleKey ?? null;
}

/** Whether `entry` satisfies a single filter dimension (not search/visibility). */
function matchesFilterKey(
  entry: InternalLibraryEntry,
  key: keyof LibraryFilters,
  value: string,
  ctx?: LibraryFilterContext,
): boolean {
  if (!value) return true;
  const nameById = ctx?.nameByFilterId;

  switch (key) {
    case 'q':
      return matchesSearch(entry, value, ctx);
    case 'visibility':
      if (value === 'public') return !entry.isHidden;
      if (value === 'hidden') return Boolean(entry.isHidden);
      return true;
    case 'format':
      return matchesTaxonomySlug(entry.videoFormats, value);
    case 'industry':
      return matchesTaxonomySlug(entry.industries, value);
    case 'market':
      return matchesTaxonomySlug(entry.markets, value);
    default: {
      const roleKey = libraryKeyToFilterRole(key);
      if (!roleKey) return true;
      return matchesRoleFilter(entry, roleKey, value, nameById);
    }
  }
}

export function matchesLibraryFilters(
  entry: InternalLibraryEntry,
  filters: LibraryFilters,
  ctx?: LibraryFilterContext,
): boolean {
  if (!matchesSearch(entry, filters.q, ctx)) return false;

  if (filters.visibility === 'public' && entry.isHidden) return false;
  if (filters.visibility === 'hidden' && !entry.isHidden) return false;

  for (const key of Object.keys(filters) as (keyof LibraryFilters)[]) {
    if (key === 'q' || key === 'visibility') continue;
    const value = filters[key];
    if (!value) continue;
    if (!matchesFilterKey(entry, key, value, ctx)) return false;
  }

  return true;
}

export function filterLibraryEntries(
  entries: InternalLibraryEntry[],
  filters: LibraryFilters,
  ctx?: LibraryFilterContext,
): InternalLibraryEntry[] {
  return entries.filter((entry) => matchesLibraryFilters(entry, filters, ctx));
}

function clearedFiltersForKey(
  filters: LibraryFilters,
  key: keyof LibraryFilters,
): LibraryFilters {
  if (key === 'visibility') {
    return {...filters, visibility: DEFAULT_FILTERS.visibility};
  }
  return {...filters, [key]: ''};
}

/**
 * Facet counts for every option of one filter key.
 *
 * Filters the library once with that key cleared, then scores each option
 * against the reduced set (avoids O(options × full library) full passes).
 */
export function countFacetOptions(
  entries: InternalLibraryEntry[],
  filters: LibraryFilters,
  key: keyof LibraryFilters,
  optionValues: readonly string[],
  ctx?: LibraryFilterContext,
): Map<string, number> {
  const base = filterLibraryEntries(
    entries,
    clearedFiltersForKey(filters, key),
    ctx,
  );
  const counts = new Map<string, number>();
  for (const value of optionValues) {
    let n = 0;
    for (const entry of base) {
      if (matchesFilterKey(entry, key, value, ctx)) n += 1;
    }
    counts.set(value, n);
  }
  return counts;
}

/** Count how many entries match when a given filter key is set to `value`. */
export function countForFilterValue(
  entries: InternalLibraryEntry[],
  filters: LibraryFilters,
  key: keyof LibraryFilters,
  value: string,
  ctx?: LibraryFilterContext,
): number {
  return (
    countFacetOptions(entries, filters, key, [value], ctx).get(value) ?? 0
  );
}

export {FILTER_ROLE_TO_LIBRARY_KEY};
