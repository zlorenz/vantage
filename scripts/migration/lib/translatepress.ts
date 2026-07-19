import { query, table } from '../db';
import {
  buildTranslatedBodyHtml,
  distinctTranslation,
  lookupInDictionary,
} from './translation-text';

let dictionary: Map<string, string> | null = null;

export async function loadDictionary(): Promise<Map<string, string>> {
  if (dictionary) return dictionary;

  const rows = await query<{ original: string; translated: string }[]>(
    `SELECT original, translated FROM ${table('trp_dictionary_en_us_zh_cn')} WHERE status != 0`
  );

  dictionary = new Map();
  for (const row of rows) {
    if (row.translated?.trim()) {
      dictionary.set(row.original, row.translated);
    }
  }
  return dictionary;
}

export async function translate(original: string | undefined | null): Promise<string | undefined> {
  if (!original?.trim()) return undefined;
  const dict = await loadDictionary();
  const hit = dict.get(original);
  if (!hit?.trim()) return undefined;
  return distinctTranslation(original, hit);
}

/**
 * Enhanced TRP lookup — tries exact key, plain text, and HTML segment variants.
 * Use for ACF display fields and hero titles where raw HTML breaks exact match.
 */
export async function translateEnhanced(
  original: string | undefined | null,
): Promise<string | undefined> {
  if (!original?.trim()) return undefined;
  const dict = await loadDictionary();
  const result = lookupInDictionary(dict, original);
  return distinctTranslation(original, result.translated);
}

/**
 * Translate page/post body HTML by translating each block-level segment.
 * Returns simplified HTML suitable for htmlToPortableText on import.
 */
export async function translateBodyHtml(
  html: string | undefined | null,
): Promise<string | undefined> {
  if (!html?.trim()) return undefined;
  const dict = await loadDictionary();
  const translated = buildTranslatedBodyHtml(html, dict);
  if (!translated) return undefined;
  const plainOrig = html.replace(/<!--[\s\S]*?-->/g, '').trim();
  if (translated === plainOrig) return undefined;
  return translated;
}

export async function translateBatch(
  originals: string[]
): Promise<Map<string, string>> {
  const dict = await loadDictionary();
  const result = new Map<string, string>();
  for (const o of originals) {
    const hit = dict.get(o);
    if (hit?.trim()) result.set(o, hit);
  }
  return result;
}

/** Chinese slug translations from TranslatePress slug originals (sparse). */
let slugTranslations: Map<string, string> | null = null;

export async function loadSlugTranslations(): Promise<Map<string, string>> {
  if (slugTranslations) return slugTranslations;

  // TRP stores English originals; translated slugs appear in dictionary when customized
  slugTranslations = new Map();
  const rows = await query<{ original: string; type: string }[]>(
    `SELECT original, type FROM ${table('trp_slug_originals')} WHERE type IN ('post', 'term')`
  );

  const dict = await loadDictionary();
  for (const row of rows) {
    const translated = dict.get(row.original);
    if (translated && translated !== row.original) {
      slugTranslations.set(row.original, slugify(translated));
    }
  }
  return slugTranslations;
}

export async function translateSlug(enSlug: string): Promise<string | undefined> {
  const map = await loadSlugTranslations();
  return map.get(enSlug);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function resetDictionaryCache(): void {
  dictionary = null;
  slugTranslations = null;
}
