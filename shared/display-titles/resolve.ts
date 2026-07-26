import {compileDisplayTitles, hasDisplayTitleParts, trimPart} from './compile'
import type {
  CompiledDisplayTitles,
  DisplayTitleOverrides,
  DisplayTitleParts,
  DisplayTitlePartsLocalized,
} from './types'

export type DisplayTitleLocale = 'en' | 'zh'

export type PhraseLookup = ReadonlyMap<string, string>

export interface ResolveDisplayTitlesInput
  extends DisplayTitlePartsLocalized, DisplayTitleOverrides {}

function lookupZh(
  phrases: PhraseLookup | null | undefined,
  en: string,
  docZh: string | null | undefined,
): string {
  const key = trimPart(en)
  if (key && phrases?.size) {
    const fromBook = phrases.get(key)
    if (fromBook) return fromBook
  }
  return trimPart(docZh)
}

function partsForLocale(
  input: DisplayTitlePartsLocalized,
  locale: DisplayTitleLocale,
  phrases?: PhraseLookup | null,
): DisplayTitleParts {
  if (locale === 'zh') {
    const brandEn = trimPart(input.brandName)
    const productEn = trimPart(input.productName)
    const campaignEn = trimPart(input.campaignTitle)
    const heroEn = trimPart(input.heroFilmTitle)
    const brand =
      lookupZh(phrases, brandEn, input.brandNameZh) || brandEn
    const product = lookupZh(phrases, productEn, input.productNameZh) || undefined
    const campaign =
      lookupZh(phrases, campaignEn, input.campaignTitleZh) || undefined
    const heroFilmTitle =
      lookupZh(phrases, heroEn, input.heroFilmTitleZh) || undefined
    return {
      brandName: brand,
      productName: product || undefined,
      campaignTitle: campaign || undefined,
      heroFilmTitle: heroFilmTitle || undefined,
    }
  }
  return {
    brandName: input.brandName,
    productName: input.productName,
    campaignTitle: input.campaignTitle,
    heroFilmTitle: input.heroFilmTitle,
  }
}

function overridesForLocale(
  input: DisplayTitleOverrides,
  locale: DisplayTitleLocale,
): Partial<CompiledDisplayTitles> {
  if (locale === 'zh') {
    return {
      thumbTitle: trimPart(input.thumbTitleOverrideZh) || undefined,
      headerTitle: trimPart(input.headerTitleOverrideZh) || undefined,
      longTitle: trimPart(input.longTitleOverrideZh) || undefined,
    }
  }
  return {
    thumbTitle: trimPart(input.thumbTitleOverride) || undefined,
    headerTitle: trimPart(input.headerTitleOverride) || undefined,
    longTitle: trimPart(input.longTitleOverride) || undefined,
  }
}

/**
 * Resolve titles for a locale: override → compile(parts).
 * When `phrases` is provided, ZH parts prefer phrase-book hits over doc Zh.
 */
export function resolveDisplayTitles(
  input: ResolveDisplayTitlesInput,
  locale: DisplayTitleLocale = 'en',
  phrases?: PhraseLookup | null,
): CompiledDisplayTitles {
  const parts = partsForLocale(input, locale, phrases)
  const overrides = overridesForLocale(input, locale)

  const compiled = hasDisplayTitleParts(parts)
    ? compileDisplayTitles(parts)
    : {
        thumbTitle: '',
        headerTitle: '',
        longTitle: '',
        documentTitle: '',
      }

  return {
    thumbTitle: overrides.thumbTitle || compiled.thumbTitle || '',
    headerTitle: overrides.headerTitle || compiled.headerTitle || '',
    longTitle: overrides.longTitle || compiled.longTitle || '',
    documentTitle: compiled.documentTitle,
  }
}
