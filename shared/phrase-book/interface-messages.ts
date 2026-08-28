/**
 * Flatten next-intl message catalogs + Campaign Brief form copy for code phrase rows.
 */

import enMessages from '../../messages/en.json'
import zhMessages from '../../messages/zh.json'
import {listCampaignBriefPhrasePairs} from '../../src/lib/campaign-brief-i18n'

import type {PhraseCategoryId} from './categories'

export type InterfaceCodeRow = {
  en: string
  zh: string
  codePath: string
  category: PhraseCategoryId
}

/**
 * Message paths that are editorial / page section copy (not product chrome).
 * Everything else in messages/*.json stays Interface.
 */
const PAGES_NEWS_MESSAGE_PATHS = new Set([
  'Home.workSection',
  'Home.workSectionOutline',
  'Home.aboutHeading',
  'Home.aboutHeadingFull',
  'Home.aboutHeadingOutline',
  'Home.aboutHeadingBrands',
  'Home.brands',
  'Home.brandsOutline',
  'Home.viewAllWork',
  'Home.learnMoreAboutUs',
  'About.team',
  'About.teamOutline',
  'About.statementLine1',
  'About.statementLine2',
  'About.statementLine3',
  'About.statementLine4',
  'About.statementLine5',
  'About.statementLine6',
  'About.productionServices',
  'About.productionServicesOutline',
  'About.productionServicesBody',
  'About.productionServicesBody2',
  'About.productionServicesCta',
  'About.moreAboutVantage',
  'About.moreAboutVietnamProductionService',
  'About.moreAboutOurIndustry',
  'About.moreAboutOurCompany',
  'About.moreAboutAwards',
  'About.aiWorkflowHeading',
  'About.aiWorkflowBody',
  'About.productionLogCtaHeading',
  'About.productionLogCtaBody',
  'About.productionLogCtaLink',
  'Vietnam.shotIn',
  'Vietnam.shotInOutline',
  'Blog.categories',
  'OurIndustry.industriesHeading',
  'OurIndustry.marketsHeading',
  'OurIndustry.videoFormatsHeading',
  'OurCompany.leadershipHeading',
  'OurCompany.corporateDetailsHeading',
  'OurCompany.corporateDetailsBody',
  'Contact.campaignBriefHeading',
  'Contact.campaignBriefBody',
  'Contact.campaignBriefCta',
])

function categoryForMessagePath(path: string): PhraseCategoryId {
  return PAGES_NEWS_MESSAGE_PATHS.has(path) ? 'pages-news' : 'interface'
}

function flattenMessages(
  en: Record<string, unknown>,
  zh: Record<string, unknown>,
  prefix: string,
  out: InterfaceCodeRow[],
): void {
  for (const [key, value] of Object.entries(en)) {
    const path = prefix ? `${prefix}.${key}` : key
    const zhVal = zh[key]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenMessages(
        value as Record<string, unknown>,
        (zhVal && typeof zhVal === 'object' ? zhVal : {}) as Record<
          string,
          unknown
        >,
        path,
        out,
      )
      continue
    }
    if (typeof value !== 'string') continue
    out.push({
      en: value,
      zh: typeof zhVal === 'string' ? zhVal : '',
      codePath: `messages/*.json → ${path}`,
      category: categoryForMessagePath(path),
    })
  }
}

export function interfaceCodeRows(): InterfaceCodeRow[] {
  const out: InterfaceCodeRow[] = []
  flattenMessages(
    enMessages as Record<string, unknown>,
    zhMessages as Record<string, unknown>,
    '',
    out,
  )

  const seen = new Set(out.map((r) => r.en.replace(/\s+/g, ' ').trim()))
  for (const pair of listCampaignBriefPhrasePairs()) {
    const en = pair.en.replace(/\s+/g, ' ').trim()
    if (!en || seen.has(en)) continue
    seen.add(en)
    out.push({
      en,
      zh: pair.zh,
      codePath: pair.codePath,
      category: 'interface',
    })
  }

  return out
}
