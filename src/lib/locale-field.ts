/**
 * Pick the locale-appropriate CMS string (English default, Chinese when present).
 * Optional phrase book wins over document Zh for exact EN matches.
 */

import {
  phraseRecordToMap,
  resolveLocalizedString,
  type PhraseMap,
} from '@phrase-book';
import type { Locale } from '@/i18n/routing';

export function pickLocaleField(
  locale: Locale,
  en: string | undefined,
  zh?: string | null,
): string {
  if (locale === 'zh' && zh?.trim()) return zh;
  return en ?? '';
}

export function pickLocaleFieldWithPhrases(
  locale: Locale,
  en: string | undefined,
  zh: string | null | undefined,
  phrases?: PhraseMap | Record<string, string> | null,
): string {
  return resolveLocalizedString({
    locale: locale === 'zh' ? 'zh' : 'en',
    en,
    zh,
    phrases: toPhraseMap(phrases),
  });
}

function toPhraseMap(
  phrases?: PhraseMap | Record<string, string> | null,
): PhraseMap | undefined {
  if (!phrases) return undefined;
  if (phrases instanceof Map) return phrases;
  return phraseRecordToMap(phrases as Record<string, string>);
}
