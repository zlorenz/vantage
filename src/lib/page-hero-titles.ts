/**
 * Hardcoded PageHero / schema titles formerly stored as page.heroTitle*.
 * Kept in code so editors cannot (and need not) maintain outline HTML in Studio.
 */

import type {Locale} from '@/i18n/routing';

const TITLES = {
  awards: {
    en: 'Our <span class="vp-outline">Awards</span>',
    zh: 'Our <span class="vp-outline">Awards</span>',
  },
  'our-company': {
    en: 'Our <span class="vp-outline">Company</span>',
    zh: 'Our <span class="vp-outline">Company</span>',
  },
  'our-industry': {
    en: 'Our <span class="vp-outline">Industry</span>',
    zh: 'Our <span class="vp-outline">Industry</span>',
  },
  work: {
    en: '<span class="vp-outline">Our</span> Work',
    zh: '<span class="vp-outline">我们的</span> 视频作品集',
  },
} as const;

export type PageHeroTitleKey = keyof typeof TITLES;

export function pageHeroTitle(key: PageHeroTitleKey, locale: Locale): string {
  const pair = TITLES[key];
  return locale === 'zh' ? pair.zh : pair.en;
}
