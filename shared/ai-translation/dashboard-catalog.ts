/**
 * Static catalog of code-backed public strings (read-only in Translations dashboard v1).
 */

import type {DashboardRow, DashboardTabId} from './types'

type CodeEntry = {
  id: string
  tab: DashboardTabId
  english: string
  chinese: string
  where: string
  codePath: string
}

/** Minimal seed; Studio dashboard can extend by importing message JSONs at runtime. */
export const CODE_STRING_CATALOG: CodeEntry[] = [
  {
    id: 'code:nav.work',
    tab: 'ui-chrome',
    english: 'Work',
    chinese: '作品',
    where: 'Header nav · Work',
    codePath: 'messages/en.json → Nav.work',
  },
  {
    id: 'code:nav.about',
    tab: 'ui-chrome',
    english: 'About',
    chinese: '关于我们',
    where: 'Header nav · About',
    codePath: 'messages/en.json → Nav.about',
  },
  {
    id: 'code:filters.empty',
    tab: 'ui-chrome',
    english: 'No projects match these filters.',
    chinese: '',
    where: 'Work filters · empty state',
    codePath: 'messages/en.json → Filters.empty',
  },
  {
    id: 'code:portfolio.noVideo',
    tab: 'ui-chrome',
    english: 'Video unavailable',
    chinese: '',
    where: 'Portfolio embed · empty',
    codePath: 'messages/en.json → Portfolio.noVideo',
  },
  {
    id: 'code:campaign-brief.note',
    tab: 'campaign-brief',
    english: '(see campaign-brief-i18n.ts for full form catalog)',
    chinese: '',
    where: 'Campaign Brief form · all labels/validation',
    codePath: 'src/lib/campaign-brief-i18n.ts',
  },
  {
    id: 'code:credits-labels.note',
    tab: 'credits-labels',
    english: '(see credits-labels-zh.ts for department/role labels)',
    chinese: '',
    where: 'Portfolio credits · role/department labels',
    codePath: 'src/lib/credits-labels-zh.ts',
  },
  {
    id: 'code:routing.work',
    tab: 'slugs',
    english: '/work',
    chinese: '/工作',
    where: 'Hardcoded route prefix',
    codePath: 'src/i18n/routing.ts',
  },
  {
    id: 'code:routing.portfolio',
    tab: 'slugs',
    english: '/portfolio/[slug]',
    chinese: '/案例/[slug]',
    where: 'Hardcoded route prefix',
    codePath: 'src/i18n/routing.ts',
  },
]

export function codeCatalogAsDashboardRows(
  messagesEn?: Record<string, unknown>,
  messagesZh?: Record<string, unknown>,
): DashboardRow[] {
  const fromMessages: DashboardRow[] = []

  if (messagesEn && messagesZh) {
    flattenMessages(messagesEn, messagesZh, '', fromMessages)
  }

  const staticRows: DashboardRow[] = CODE_STRING_CATALOG.map((e) => ({
    id: e.id,
    tab: e.tab,
    english: e.english,
    chinese: e.chinese,
    where: e.where,
    source: 'code',
    editable: false,
    status: e.chinese.trim() ? 'present' : 'missing',
    codePath: e.codePath,
  }))

  return [...fromMessages, ...staticRows]
}

function flattenMessages(
  en: Record<string, unknown>,
  zh: Record<string, unknown>,
  prefix: string,
  out: DashboardRow[],
): void {
  for (const [key, value] of Object.entries(en)) {
    const path = prefix ? `${prefix}.${key}` : key
    const zhVal = zh[key]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenMessages(
        value as Record<string, unknown>,
        (zhVal && typeof zhVal === 'object' ? zhVal : {}) as Record<string, unknown>,
        path,
        out,
      )
      continue
    }
    if (typeof value !== 'string') continue
    const chinese = typeof zhVal === 'string' ? zhVal : ''
    out.push({
      id: `msg:${path}`,
      tab: 'ui-chrome',
      english: value,
      chinese,
      where: `UI message · ${path}`,
      source: 'code',
      editable: false,
      status: chinese.trim() ? 'present' : 'missing',
      codePath: `messages/*.json → ${path}`,
    })
  }
}

export const DASHBOARD_TABS: Array<{id: import('./types').DashboardTabId; title: string}> = [
  {id: 'gaps', title: 'Gaps'},
  {id: 'pages', title: 'Pages'},
  {id: 'portfolio', title: 'Portfolio'},
  {id: 'news', title: 'News'},
  {id: 'taxonomies', title: 'Taxonomies'},
  {id: 'seo', title: 'SEO'},
  {id: 'slugs', title: 'Slugs'},
  {id: 'brand-names', title: 'Brand names (China)'},
  {id: 'phrases', title: 'Phrases (EN→ZH)'},
  {id: 'ui-chrome', title: 'UI chrome (code)'},
  {id: 'campaign-brief', title: 'Campaign Brief (code)'},
  {id: 'credits-labels', title: 'Credits labels (code)'},
]
