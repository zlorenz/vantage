/**
 * Portfolio credits department configuration and rendering helpers.
 *
 * Structured `crewCredits` is the sole source for display and filters.
 */

import {
  CREW_DEPARTMENTS,
  CREW_ROLE_BY_KEY,
  canonicalCrewRoleLabel,
  getRoleDisplayLabel,
  type CrewCreditValue,
  type CrewDepartmentKey,
} from '@crew-credits';
import {
  lookupPhrase,
  phraseRecordToMap,
  type PhraseMap,
} from '@phrase-book';
import type { Locale } from '@/i18n/routing';
import { CREDIT_LABEL_ZH } from '@/lib/credits-labels-zh';
import type { CrewCredit, CrewPerson } from '@/types/sanity';

/** Localize a department or role label for the active locale. */
export function localizeCreditLabel(
  label: string,
  locale: Locale,
  phrases?: PhraseMap | Record<string, string> | null,
): string {
  if (locale !== 'zh') return label;
  const fromBook = lookupPhrase(phraseRecordToMap(phrases), label)
  if (fromBook) return fromBook
  return (
    CREDIT_LABEL_ZH[label] ??
    CREDIT_LABEL_ZH[canonicalCrewRoleLabel(label)] ??
    label
  )
}

export interface CreditPair {
  role: string;
  names: string;
  people?: CrewPerson[];
}

function sortStructuredCredits(credits: CrewCredit[]): CrewCredit[] {
  const deptOrder = CREW_DEPARTMENTS.map((dept) => dept.key);

  return [...credits].sort((a, b) => {
    const deptDiff = deptOrder.indexOf(a.department) - deptOrder.indexOf(b.department);
    if (deptDiff !== 0) return deptDiff;

    const aCustom = a.isCustomRole || !a.roleKey;
    const bCustom = b.isCustomRole || !b.roleKey;
    if (aCustom !== bCustom) return aCustom ? 1 : -1;

    const aSort = a.roleKey ? (CREW_ROLE_BY_KEY.get(a.roleKey)?.sortIndex ?? 9999) : 9999;
    const bSort = b.roleKey ? (CREW_ROLE_BY_KEY.get(b.roleKey)?.sortIndex ?? 9999) : 9999;
    if (aSort !== bSort) return aSort - bSort;

    return a.role.localeCompare(b.role, undefined, { sensitivity: 'base' });
  });
}

export interface StructuredDepartmentCredits {
  key: CrewDepartmentKey;
  label: string;
  pairs: CreditPair[];
}

/** Build ordered department rows from structured crewCredits. */
export function getStructuredDepartmentRows(
  crewCredits: CrewCredit[] | CrewCreditValue[] | undefined,
  locale: Locale = 'en',
  phrases?: PhraseMap | Record<string, string> | null,
): StructuredDepartmentCredits[] {
  if (!crewCredits?.length) return [];

  const sorted = sortStructuredCredits(crewCredits as CrewCredit[]);
  const byDept = new Map<CrewDepartmentKey, CreditPair[]>();

  for (const credit of sorted) {
    const people = (credit.people ?? []).filter((person) => person.name?.trim());
    if (!people.length) continue;

    const roleEn = getRoleDisplayLabel(credit.roleKey, credit.role, people.length);
    const pair: CreditPair = {
      role: localizeCreditLabel(roleEn, locale, phrases),
      names: people.map((person) => person.name).join(', '),
      people,
    };

    const list = byDept.get(credit.department) ?? [];
    list.push(pair);
    byDept.set(credit.department, list);
  }

  return CREW_DEPARTMENTS.flatMap((dept) => {
    const pairs = byDept.get(dept.key);
    if (!pairs?.length) return [];
    return [
      {
        key: dept.key,
        label: localizeCreditLabel(dept.label, locale, phrases),
        pairs,
      },
    ];
  });
}

/** Resolve department rows for portfolio credit display. */
export function resolveCreditsForDisplay(opts: {
  crewCredits?: CrewCredit[];
  locale?: Locale;
  phrases?: PhraseMap | Record<string, string> | null;
}): StructuredDepartmentCredits[] {
  return getStructuredDepartmentRows(
    opts.crewCredits,
    opts.locale ?? 'en',
    opts.phrases,
  );
}

/** Collect people names for a structured role key across departments. */
export function getStructuredRoleNames(
  crewCredits: CrewCredit[] | undefined,
  roleKey: string,
): string[] {
  if (!crewCredits?.length) return [];
  const names: string[] = [];
  for (const credit of crewCredits) {
    if (credit.roleKey !== roleKey) continue;
    for (const person of credit.people ?? []) {
      const name = person.name?.trim();
      if (name) names.push(name);
    }
  }
  return names;
}
