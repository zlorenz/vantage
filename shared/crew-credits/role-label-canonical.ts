/**
 * Canonicalize crew-role EN labels: plural → singular for phrase-book identity.
 *
 * Explicit pairs only (catalog + CREDIT_LABEL_ZH), not naive English morphology.
 */

import {CREW_DEPARTMENTS} from './catalog'
import {CREDIT_LABEL_ZH} from './labels-zh'

function normalizeKey(en: string | null | undefined): string {
  return (en ?? '').replace(/\s+/g, ' ').trim()
}

/**
 * Known plural display labels → canonical singular (catalog `label`).
 *
 * Custom CREDIT_LABEL_ZH pairs (e.g. Translator / Translators) are included when
 * both keys exist, unless the plural form is already a catalog canonical label
 * (e.g. Camera Assistants) — those must not collapse to a shorter non-catalog form.
 *
 * Note: Production Service / Production Services historically had different ZH in
 * CREDIT_LABEL_ZH (制片服务 vs 制作服务); canonical singular prefers 制片服务.
 */
function buildPluralToSingular(): Map<string, string> {
  const map = new Map<string, string>()
  const catalogCanonical = new Set<string>()

  for (const dept of CREW_DEPARTMENTS) {
    catalogCanonical.add(normalizeKey(dept.label))
    for (const role of dept.roles) {
      const singular = normalizeKey(role.label)
      catalogCanonical.add(singular)
      const plural = normalizeKey(role.pluralLabel)
      if (plural && plural !== singular) {
        map.set(plural, singular)
      }
    }
  }

  const zhKeys = Object.keys(CREDIT_LABEL_ZH).map(normalizeKey)
  const zhKeySet = new Set(zhKeys)

  for (const plural of zhKeys) {
    if (map.has(plural)) continue
    // Keep catalog invariant / already-plural labels as canonical.
    if (catalogCanonical.has(plural)) continue

    const singular = inferSingularSibling(plural, zhKeySet)
    if (singular && singular !== plural) {
      map.set(plural, singular)
    }
  }

  return map
}

/** When both keys exist in CREDIT_LABEL_ZH, pick the singular sibling of `plural`. */
function inferSingularSibling(
  plural: string,
  keys: Set<string>,
): string | null {
  if (plural.endsWith('ies')) {
    const y = `${plural.slice(0, -3)}y`
    if (keys.has(y)) return y
  }
  if (plural.endsWith('es')) {
    const base = plural.slice(0, -2)
    if (keys.has(base)) return base
  }
  if (plural.endsWith('s') && !plural.endsWith('ss')) {
    const base = plural.slice(0, -1)
    if (keys.has(base)) return base
  }
  return null
}

const PLURAL_TO_SINGULAR = buildPluralToSingular()

/** Plural → singular map (normalized keys). */
export function crewRolePluralToSingular(): ReadonlyMap<string, string> {
  return PLURAL_TO_SINGULAR
}

/**
 * Canonical crew-role EN for the phrase book.
 * Known plurals map to singular; everything else is returned unchanged.
 */
export function canonicalCrewRoleLabel(
  en: string | null | undefined,
): string {
  const key = normalizeKey(en)
  if (!key) return ''
  return PLURAL_TO_SINGULAR.get(key) ?? key
}

/** True when `en` is a known plural alias of a different singular label. */
export function isCrewRolePluralAlias(en: string | null | undefined): boolean {
  const key = normalizeKey(en)
  if (!key) return false
  const canonical = PLURAL_TO_SINGULAR.get(key)
  return Boolean(canonical && canonical !== key)
}
