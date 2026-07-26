/**
 * Standard CTA section copy — fallback when Site Settings `campaignCta` is empty.
 *
 * Live copy is edited in Sanity Site Settings → Campaign CTA.
 * Source historically: WordPress reusable block (WP ID 3781).
 */

import type { Locale } from '@/i18n/routing';
import type { CampaignCta, SiteSettings } from '@/types/sanity';

export interface CtaContent {
  headingHtml: string;
  paragraphs: string[];
  buttonLabel: string;
  buttonHref: string;
}

const DEFAULT_BUTTON_HREF = '/video-campaign-brief';

const STANDARD_CTA_EN: CtaContent = {
  headingHtml:
    '<span class="vp-outline">LET\'S BRING</span> <strong>YOUR VISION</strong> <span class="vp-outline">TO LIFE!</span>',
  paragraphs: [
    'Got a commercial, branded video or product campaign in mind? Every great idea starts with a clear vision.',
    'Start the conversation by filling out our client briefing form, which helps us gather all the details we need to build an accurate quote and production plan tailored to your next project!',
  ],
  buttonLabel: 'TELL US ABOUT YOUR CAMPAIGN',
  buttonHref: DEFAULT_BUTTON_HREF,
};

const STANDARD_CTA_ZH: CtaContent = {
  headingHtml: '让我们一起把创意变成影像',
  paragraphs: [
    '有广告或品牌影片项目的想法吗？好的创意始于清晰的方向。',
    '请填写我们的项目简报表，开启合作沟通。这将帮助我们收集必要信息，为您的下一个项目制定准确的报价与制作计划。',
  ],
  buttonLabel: '提交您的项目需求',
  buttonHref: DEFAULT_BUTTON_HREF,
};

/** Code fallback when Site Settings CTA is missing. */
export function getStandardCtaContent(locale: Locale): CtaContent {
  return locale === 'zh' ? STANDARD_CTA_ZH : STANDARD_CTA_EN;
}

/** Resolve CTA from Site Settings with locale + code fallback. */
export function resolveCampaignCta(
  campaignCta: CampaignCta | null | undefined,
  locale: Locale,
): CtaContent {
  const fallback = getStandardCtaContent(locale);
  if (!campaignCta) return fallback;

  const headingHtml =
    locale === 'zh' && campaignCta.headingZh?.trim()
      ? campaignCta.headingZh
      : campaignCta.heading?.trim() || fallback.headingHtml;

  const paragraphsRaw =
    locale === 'zh' && campaignCta.paragraphsZh?.length
      ? campaignCta.paragraphsZh
      : campaignCta.paragraphs;
  const paragraphs = (paragraphsRaw ?? [])
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter(Boolean);
  const resolvedParagraphs = paragraphs.length ? paragraphs : fallback.paragraphs;

  const buttonLabel =
    locale === 'zh' && campaignCta.buttonLabelZh?.trim()
      ? campaignCta.buttonLabelZh
      : campaignCta.buttonLabel?.trim() || fallback.buttonLabel;

  const buttonHref = campaignCta.buttonHref?.trim() || fallback.buttonHref;

  return {
    headingHtml,
    paragraphs: resolvedParagraphs,
    buttonLabel,
    buttonHref,
  };
}

/** Convenience: resolve from full Site Settings document. */
export function getCampaignCtaFromSettings(
  settings: Pick<SiteSettings, 'campaignCta'> | null | undefined,
  locale: Locale,
): CtaContent {
  return resolveCampaignCta(settings?.campaignCta, locale);
}
