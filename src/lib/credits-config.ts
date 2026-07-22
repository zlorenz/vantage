/**
 * Portfolio credits department configuration and rendering helpers.
 *
 * Structured `crewCredits` is preferred. Legacy `credits` department objects
 * remain supported for dual-read until migration backfill completes.
 */

import {
  CREW_DEPARTMENTS,
  CREW_ROLE_BY_KEY,
  getRoleDisplayLabel,
  type CrewCreditValue,
  type CrewDepartmentKey,
} from '@crew-credits';
import type { Locale } from '@/i18n/routing';
import { CREDIT_LABEL_ZH } from '@/lib/credits-labels-zh';
import type {
  CreditsAdditionalRow,
  CrewCredit,
  CrewPerson,
  PortfolioCredits,
} from '@/types/sanity';

export interface CreditFieldConfig {
  slug: string;
  label: string;
  roleKey: string;
}

export interface CreditDepartmentConfig {
  key: CrewDepartmentKey;
  label: string;
  fields: CreditFieldConfig[];
  repeater: string;
}

export const DEPARTMENT_LABELS = Object.fromEntries(
  CREW_DEPARTMENTS.map((dept) => [dept.key, dept.label]),
) as Record<CrewDepartmentKey, string>;

/** Legacy-compatible config derived from the shared catalog. */
export const CREDITS_CONFIG: CreditDepartmentConfig[] = CREW_DEPARTMENTS.map((dept) => ({
  key: dept.key,
  label: dept.label,
  repeater: dept.legacyRepeater,
  fields: dept.roles.map((role) => ({
    slug: role.legacyField,
    label: role.label,
    roleKey: role.key,
  })),
}));

/** Localize a department or role label for the active locale. */
export function localizeCreditLabel(label: string, locale: Locale): string {
  if (locale !== 'zh') return label;
  return CREDIT_LABEL_ZH[label] ?? label;
}

/** Pluralize role label when names contain multiple comma-separated entries. */
export function pluralizeCreditRole(role: string, names: string): string {
  if (!names.includes(',')) return role;

  const fromCatalog = CREW_DEPARTMENTS.flatMap((dept) => dept.roles).find(
    (entry) => entry.label === role || entry.pluralLabel === role,
  );
  if (fromCatalog) return fromCatalog.pluralLabel;

  const irregular: Record<string, string> = {
    'Production Company': 'Production Companies',
    'Production Service': 'Production Services',
    Agency: 'Agencies',
    Talent: 'Talent',
    Transport: 'Transport',
    'G&E': 'G&E',
    BTS: 'BTS',
    'Hair & Makeup': 'Hair & Makeup',
    VFX: 'VFX',
    Storyboards: 'Storyboards',
    'Assistant Editors': 'Assistant Editors',
    'Sound Design & Mix': 'Sound Design & Mix',
    Wardrobe: 'Wardrobe',
    '3D Animation': '3D Animations',
    'Product Technician': 'Product Technicians',
    Chaperone: 'Chaperones',
  };
  if (irregular[role]) return irregular[role];

  const abbrevPlural: Record<string, string> = {
    '1st AD': '1st ADs',
    '2nd AD': '2nd ADs',
    PA: 'PAs',
    EP: 'EPs',
    DOP: 'DOPs',
    '1st AC': '1st ACs',
    '2nd AC': '2nd ACs',
    DIT: 'DITs',
  };
  if (abbrevPlural[role]) return abbrevPlural[role];

  if (/s$|x$|ch$|sh$/i.test(role)) return role;
  return `${role}s`;
}

export interface CreditPair {
  role: string;
  names: string;
  people?: CrewPerson[];
}

export function getDepartmentCreditPairs(
  department: Record<string, string | CreditsAdditionalRow[] | undefined> | undefined,
  config: CreditDepartmentConfig,
  locale: Locale = 'en',
): CreditPair[] {
  if (!department) return [];

  const pairs: CreditPair[] = [];

  for (const field of config.fields) {
    const val = String(department[field.slug] ?? '').trim();
    if (val) {
      const roleEn = pluralizeCreditRole(field.label, val);
      pairs.push({
        role: localizeCreditLabel(roleEn, locale),
        names: val,
      });
    }
  }

  // Sanity schema uses `additional`; legacy WP ACF keys were prod_additional, etc.
  const additional = department.additional ?? department[config.repeater];
  if (Array.isArray(additional)) {
    for (const row of additional) {
      const role = String(row.role ?? '').trim();
      const names = String(row.names ?? '').trim();
      if (role && names) {
        pairs.push({ role: localizeCreditLabel(role, locale), names });
      }
    }
  }

  return pairs;
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
): StructuredDepartmentCredits[] {
  if (!crewCredits?.length) return [];

  const sorted = sortStructuredCredits(crewCredits as CrewCredit[]);
  const byDept = new Map<CrewDepartmentKey, CreditPair[]>();

  for (const credit of sorted) {
    const people = (credit.people ?? []).filter((person) => person.name?.trim());
    if (!people.length) continue;

    const roleEn = getRoleDisplayLabel(credit.roleKey, credit.role, people.length);
    const pair: CreditPair = {
      role: localizeCreditLabel(roleEn, locale),
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
        label: localizeCreditLabel(dept.label, locale),
        pairs,
      },
    ];
  });
}

/** Prefer non-empty structured credits; fall back to legacy department objects. */
export function resolveCreditsForDisplay(opts: {
  crewCredits?: CrewCredit[];
  credits?: PortfolioCredits;
  locale?: Locale;
}): StructuredDepartmentCredits[] {
  const locale = opts.locale ?? 'en';
  const structured = getStructuredDepartmentRows(opts.crewCredits, locale);
  if (structured.length) return structured;

  if (!opts.credits) return [];

  return CREDITS_CONFIG.flatMap((config) => {
    const pairs = getDepartmentCreditPairs(opts.credits?.[config.key], config, locale);
    if (!pairs.length) return [];
    return [
      {
        key: config.key,
        label: localizeCreditLabel(config.label, locale),
        pairs,
      },
    ];
  });
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
