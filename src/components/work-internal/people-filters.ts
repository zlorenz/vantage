/**
 * People filter dimensions for /work-internal.
 *
 * Maps UI groups → LibraryFilters URL keys → crewCredits roleKey(s).
 * `vfx-online` is a filter-only OR bucket over catalog keys `vfx` | `online`.
 */

export type PeopleLibraryFilterKey =
  | 'director'
  | 'dop'
  | 'art-director'
  | 'editor'
  | 'producer'
  | 'line-producer'
  | 'colorist'
  | 'sound-design-mix'
  | 'composer'
  | '1st-ad'
  | 'vfx-online';

/** Internal match key used by filter-entries (underscored). */
export type PeopleFilterRoleKey =
  | 'director'
  | 'dop'
  | 'art_director'
  | 'editor'
  | 'producer'
  | 'line_producer'
  | 'colorist'
  | 'sound_design_mix'
  | 'composer'
  | '1st_ad'
  | 'vfx_online'

export interface PeopleFilterGroup {
  /** URL / LibraryFilters key. */
  libraryKey: PeopleLibraryFilterKey
  /** filter-entries match key. */
  roleKey: PeopleFilterRoleKey
  /** Panel section heading. */
  label: string
  /**
   * Catalog crewCredits.roleKey values this group reads.
   * Usually one; `vfx_online` unions two with OR matching.
   */
  catalogRoleKeys: readonly string[]
}

export const PEOPLE_FILTER_GROUPS: readonly PeopleFilterGroup[] = [
  {
    libraryKey: 'director',
    roleKey: 'director',
    label: 'Director',
    catalogRoleKeys: ['director'],
  },
  {
    libraryKey: 'dop',
    roleKey: 'dop',
    label: 'DOP',
    catalogRoleKeys: ['dop'],
  },
  {
    libraryKey: 'art-director',
    roleKey: 'art_director',
    label: 'Art Director',
    catalogRoleKeys: ['art_director'],
  },
  {
    libraryKey: 'editor',
    roleKey: 'editor',
    label: 'Editor',
    catalogRoleKeys: ['editor'],
  },
  {
    libraryKey: 'producer',
    roleKey: 'producer',
    label: 'Producer',
    catalogRoleKeys: ['producer'],
  },
  {
    libraryKey: 'line-producer',
    roleKey: 'line_producer',
    label: 'Line Producer',
    catalogRoleKeys: ['line_producer'],
  },
  {
    libraryKey: 'colorist',
    roleKey: 'colorist',
    label: 'Colorist',
    catalogRoleKeys: ['colorist'],
  },
  {
    libraryKey: 'sound-design-mix',
    roleKey: 'sound_design_mix',
    label: 'Sound Design & Mix',
    catalogRoleKeys: ['sound_design_mix'],
  },
  {
    libraryKey: 'composer',
    roleKey: 'composer',
    label: 'Composer',
    catalogRoleKeys: ['composer'],
  },
  {
    libraryKey: '1st-ad',
    roleKey: '1st_ad',
    label: '1st AD',
    catalogRoleKeys: ['1st_ad'],
  },
  {
    libraryKey: 'vfx-online',
    roleKey: 'vfx_online',
    label: 'VFX & Online',
    catalogRoleKeys: ['vfx', 'online'],
  },
] as const

export const PEOPLE_LIBRARY_FILTER_KEYS: readonly PeopleLibraryFilterKey[] =
  PEOPLE_FILTER_GROUPS.map((g) => g.libraryKey)

export function peopleGroupByLibraryKey(
  key: string,
): PeopleFilterGroup | undefined {
  return PEOPLE_FILTER_GROUPS.find((g) => g.libraryKey === key)
}

export function peopleGroupByRoleKey(
  roleKey: PeopleFilterRoleKey,
): PeopleFilterGroup | undefined {
  return PEOPLE_FILTER_GROUPS.find((g) => g.roleKey === roleKey)
}
