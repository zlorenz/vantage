/**
 * Standard CTA section copy — shared across Home, About, and Vietnam pages.
 *
 * Source: WordPress reusable block (WP ID 3781) on vantage.pictures.
 * Not reliably stored in Sanity Portable Text after migration.
 */

import type { Locale } from '@/i18n/routing';

export interface CtaContent {
  headingHtml: string;
  paragraphs: [string, string];
  buttonLabel: string;
}

const STANDARD_CTA_EN: CtaContent = {
  headingHtml:
    '<span class="vp-outline">LET\'S BRING</span> <strong>YOUR VISION</strong> <span class="vp-outline">TO LIFE!</span>',
  paragraphs: [
    'Got a commercial, branded video or product campaign in mind? Every great idea starts with a clear vision.',
    'Start the conversation by filling out our client briefing form, which helps us gather all the details we need to build an accurate quote and production plan tailored to your next project!',
  ],
  buttonLabel: 'TELL US ABOUT YOUR CAMPAIGN',
};

const STANDARD_CTA_ZH: CtaContent = {
  headingHtml:
    '<span class="vp-outline">让我们</span> <strong>将您的愿景</strong> <span class="vp-outline">变为现实！</span>',
  paragraphs: [
    '有商业广告、品牌视频或产品宣传片的想法吗？每一个伟大的创意都始于清晰的愿景。',
    '请填写我们的客户简报表开始对话，帮助我们收集所需信息，为您的下一个项目制定准确的报价和生产计划！',
  ],
  buttonLabel: '告诉我们您的活动计划',
};

export const VIETNAM_CTA_EN: CtaContent = {
  headingHtml:
    'PLAN YOUR NEXT PRODUCTION <span class="vp-outline">IN VIETNAM</span>',
  paragraphs: [
    'If you are planning a commercial shoot, brand film, or documentary in Vietnam, contact Vantage Pictures to discuss your project requirements.',
    'Our team will provide detailed production guidance, budgeting support, and on-the-ground expertise tailored to your timeline and objectives.',
  ],
  buttonLabel: 'TELL US ABOUT YOUR CAMPAIGN',
};

export const VIETNAM_CTA_ZH: CtaContent = {
  headingHtml:
    '在越南<span class="vp-outline">规划您的下一次拍摄</span>',
  paragraphs: [
    '如果您正在越南计划商业拍摄、品牌影片或纪录片，请联系 Vantage Pictures 讨论您的项目需求。',
    '我们的团队将提供详细的生产指导、预算支持和针对您时间表的现场专业知识。',
  ],
  buttonLabel: '告诉我们您的活动计划',
};

/** Returns standard CTA copy for the given locale. */
export function getStandardCtaContent(locale: Locale): CtaContent {
  return locale === 'zh' ? STANDARD_CTA_ZH : STANDARD_CTA_EN;
}

/** Returns Vietnam-specific CTA copy for the given locale. */
export function getVietnamCtaContent(locale: Locale): CtaContent {
  return locale === 'zh' ? VIETNAM_CTA_ZH : VIETNAM_CTA_EN;
}
