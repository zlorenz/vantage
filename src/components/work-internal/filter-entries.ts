/**
 * Client-side filter pipeline for the internal work library.
 */

import { getStructuredRoleNames } from '@/lib/credits-config';
import type { CrewMemberTerm, InternalLibraryEntry } from '@/types/sanity';
import { plainText } from './text';
import type { LibraryFilters } from './types';

type CrewRole = 'director' | 'dop' | 'art-director';

/** Optional lookups used by art-director filter (PD credit matching). */
export interface LibraryFilterContext {
  artDirectorNameBySlug?: ReadonlyMap<string, string>;
}

function hasCrewWithRoleSlug(
  entry: InternalLibraryEntry,
  role: CrewRole,
  slug: string,
): boolean {
  return (
    entry.crewMembers?.some((m) => m.role === role && m.slug === slug) ?? false
  );
}

/** Split a comma/semicolon credit string into individual names. */
function creditNameParts(raw: string): string[] {
  return plainText(raw)
    .split(/[,;/]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function getProductionDesignerNames(entry: InternalLibraryEntry): string[] {
  const structured = getStructuredRoleNames(
    entry.crewCredits,
    'production_designer',
  );
  if (structured.length) return structured;

  const raw = entry.credits?.art?.art_production_designer;
  if (typeof raw !== 'string' || !raw.trim()) return [];
  return creditNameParts(raw);
}

function getEditorNames(entry: InternalLibraryEntry): string[] {
  const structured = getStructuredRoleNames(entry.crewCredits, 'editor');
  if (structured.length) return structured;

  const raw = entry.credits?.post?.post_editor;
  if (typeof raw !== 'string' || !raw.trim()) return [];
  return creditNameParts(raw);
}

/**
 * Art filter: crewMember art-director slug, or Production Designer credit
 * matching that person's display name (regional head-of-art title).
 */
function matchesArtDirectorFilter(
  entry: InternalLibraryEntry,
  slug: string,
  nameBySlug?: ReadonlyMap<string, string>,
): boolean {
  if (hasCrewWithRoleSlug(entry, 'art-director', slug)) return true;

  const name = nameBySlug?.get(slug);
  if (!name) return false;

  const needle = name.trim().toLowerCase();
  return getProductionDesignerNames(entry).some(
    (part) => part.toLowerCase() === needle,
  );
}

function toFilterSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Art Director dropdown: taxonomy terms plus any Production Designer names
 * that are not already listed (so PD-only people are filterable).
 */
export function buildArtDirectorFilterOptions(
  artDirectors: CrewMemberTerm[],
  entries: InternalLibraryEntry[],
): CrewMemberTerm[] {
  const byNorm = new Map<string, CrewMemberTerm>();

  for (const term of artDirectors) {
    byNorm.set(term.name.trim().toLowerCase(), term);
  }

  for (const entry of entries) {
    for (const name of getProductionDesignerNames(entry)) {
      const key = name.toLowerCase();
      if (byNorm.has(key)) continue;
      const slug = toFilterSlug(name);
      if (!slug) continue;
      byNorm.set(key, {
        _id: `art-pd-${slug}`,
        name,
        slug,
        role: 'art-director',
      });
    }
  }

  return [...byNorm.values()].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  );
}

export function artDirectorNameBySlug(
  artDirectors: CrewMemberTerm[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const term of artDirectors) {
    map.set(term.slug, term.name);
  }
  return map;
}

/** All crew names for a role, joined (comma-separated jobs show everyone). */
export function getCrewName(
  entry: InternalLibraryEntry,
  role: CrewRole,
): string {
  const names = entry.crewMembers
    ?.filter((m) => m.role === role)
    .map((m) => m.name)
    .filter(Boolean);
  return names?.length ? names.join(', ') : '—';
}

export function getPrimaryClientName(entry: InternalLibraryEntry): string {
  return entry.clients?.[0]?.name ?? '—';
}

/** Editor(s) from post credits, not the crewMember taxonomy. */
export function getEditorName(entry: InternalLibraryEntry): string {
  const names = getEditorNames(entry);
  return names.length ? names.join(', ') : '—';
}

/**
 * ART skim line: Production Designer when credited (regional head-of-art
 * title), otherwise Art Director from the crewMember taxonomy.
 */
export function getArtName(entry: InternalLibraryEntry): string {
  const pdNames = getProductionDesignerNames(entry);
  if (pdNames.length) return pdNames.join(', ');
  return getCrewName(entry, 'art-director');
}

function matchesSearch(entry: InternalLibraryEntry, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase().trim();
  if (!needle) return true;

  const editor = getEditorName(entry);
  const art = getArtName(entry);
  const haystacks: string[] = [
    entry.title,
    entry.titleZh ?? '',
    plainText(entry.headerTitle),
    plainText(entry.headerTitleZh),
    plainText(entry.longTitle),
    plainText(entry.longTitleZh),
    plainText(entry.thumbTitle),
    plainText(entry.thumbTitleZh),
    editor === '—' ? '' : editor,
    art === '—' ? '' : art,
    ...(entry.clients?.map((c) => c.name) ?? []),
    ...(entry.crewMembers?.map((m) => m.name) ?? []),
  ];

  return haystacks.some((h) => h.toLowerCase().includes(needle));
}

export function matchesLibraryFilters(
  entry: InternalLibraryEntry,
  filters: LibraryFilters,
  ctx?: LibraryFilterContext,
): boolean {
  if (!matchesSearch(entry, filters.q)) return false;

  if (filters.visibility === 'public' && entry.isHidden) return false;
  if (filters.visibility === 'hidden' && !entry.isHidden) return false;

  if (
    filters.client &&
    !entry.clients?.some((c) => c.slug === filters.client)
  ) {
    return false;
  }

  if (
    filters.director &&
    !hasCrewWithRoleSlug(entry, 'director', filters.director)
  ) {
    return false;
  }

  if (filters.dop && !hasCrewWithRoleSlug(entry, 'dop', filters.dop)) {
    return false;
  }

  if (
    filters['art-director'] &&
    !matchesArtDirectorFilter(
      entry,
      filters['art-director'],
      ctx?.artDirectorNameBySlug,
    )
  ) {
    return false;
  }

  if (
    filters.format &&
    !entry.videoFormats?.some(
      (t) => t.slug === filters.format || t.slugZh === filters.format,
    )
  ) {
    return false;
  }

  if (
    filters.industry &&
    !entry.industries?.some(
      (t) => t.slug === filters.industry || t.slugZh === filters.industry,
    )
  ) {
    return false;
  }

  if (
    filters.market &&
    !entry.markets?.some(
      (t) => t.slug === filters.market || t.slugZh === filters.market,
    )
  ) {
    return false;
  }

  return true;
}

export function filterLibraryEntries(
  entries: InternalLibraryEntry[],
  filters: LibraryFilters,
  ctx?: LibraryFilterContext,
): InternalLibraryEntry[] {
  return entries.filter((entry) =>
    matchesLibraryFilters(entry, filters, ctx),
  );
}

/** Count how many entries match when a given filter key is set to `value`. */
export function countForFilterValue(
  entries: InternalLibraryEntry[],
  filters: LibraryFilters,
  key: keyof LibraryFilters,
  value: string,
  ctx?: LibraryFilterContext,
): number {
  const next: LibraryFilters = {
    ...filters,
    [key]:
      key === 'visibility'
        ? (value as LibraryFilters['visibility'])
        : value,
  };
  return filterLibraryEntries(entries, next, ctx).length;
}
