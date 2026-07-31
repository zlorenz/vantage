/**
 * EN keys that must never be auto-created as translatedPhrase from WP export.
 *
 * Homonyms: one English string maps to conflicting ZH senses (e.g. film-crew
 * role vs machinery / department label). Phrase book is single-value per EN,
 * so these stay document/catalog-local only.
 *
 * Permanently exclude from any automated phrase-book harvest — not a one-off.
 */
export const PHRASE_HARVEST_EN_EXCLUSIONS = new Set([
  'Loader', // crew role vs loading vehicle (装载机)
  'Post', // Post department/role vs other senses
])

export function isPhraseHarvestExcluded(en: string): boolean {
  const key = en.replace(/\s+/g, ' ').trim()
  return PHRASE_HARVEST_EN_EXCLUSIONS.has(key)
}
