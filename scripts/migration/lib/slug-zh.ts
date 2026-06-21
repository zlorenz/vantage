/** Canonical Chinese page slugs from site-architecture.md */

export const PAGE_SLUG_ZH: Record<string, string> = {
  home: 'zh',
  about: '关于',
  work: '工作',
  news: '新闻',
  contact: '联系',
  'vietnam-production-service': '越南生产服务',
  'vietnam-location-guide': '越南旅游指南',
  'video-campaign-brief': '视频活动简介',
  'work-internal': 'work-internal',
};

export function pageSlugZh(enSlug: string): string | undefined {
  return PAGE_SLUG_ZH[enSlug];
}
