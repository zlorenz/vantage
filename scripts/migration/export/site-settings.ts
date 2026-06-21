import path from 'node:path';
import { DEFAULT_OG_IMAGE_WP_ID, PATHS } from '../config';
import { writeJson } from '../lib/fs';
import { fetchAcfOptions } from '../lib/wp-helpers';

export interface ExportedSiteSettings {
  contactEmail: string;
  contactPhone?: string;
  contactWhatsapp?: string;
  contactAddress?: string;
  contactModalTitle?: string;
  contactModalIntro?: string;
  contactModalContentHtml?: string;
  contactCtaText?: string;
  contactCtaUrl?: string;
  socialVimeo?: string;
  socialInstagram?: string;
  socialFacebook?: string;
  socialLinkedin?: string;
  socialYoutube?: string;
  socialXinpianchang?: string;
  socialXiaohongshu?: string;
  defaultOgImageWpId?: number;
}

const ACF_FIELDS = [
  'contact_email',
  'contact_phone',
  'contact_whatsapp',
  'contact_address',
  'contact_modal_title',
  'contact_modal_intro',
  'contact_modal_content',
  'contact_cta_text',
  'contact_cta_url',
  'social_vimeo',
  'social_instagram',
  'social_facebook',
  'social_linkedin',
  'social_youtube',
  'social_xinpianchang',
  'social_xiaohongshu',
];

export async function exportSiteSettings(): Promise<ExportedSiteSettings> {
  const opts = await fetchAcfOptions(ACF_FIELDS);

  const settings: ExportedSiteSettings = {
    contactEmail: opts.contact_email?.trim() || 'info@vantage.pictures',
    contactPhone: opts.contact_phone?.trim() || undefined,
    contactWhatsapp: opts.contact_whatsapp?.trim() || undefined,
    contactAddress: opts.contact_address?.trim() || undefined,
    contactModalTitle: opts.contact_modal_title?.trim() || undefined,
    contactModalIntro: opts.contact_modal_intro?.trim() || undefined,
    contactModalContentHtml: opts.contact_modal_content?.trim() || undefined,
    contactCtaText: opts.contact_cta_text?.trim() || undefined,
    contactCtaUrl: opts.contact_cta_url?.trim() || undefined,
    socialVimeo: opts.social_vimeo?.trim() || undefined,
    socialInstagram: opts.social_instagram?.trim() || undefined,
    socialFacebook: opts.social_facebook?.trim() || undefined,
    socialLinkedin: opts.social_linkedin?.trim() || undefined,
    socialYoutube: opts.social_youtube?.trim() || undefined,
    socialXinpianchang: opts.social_xinpianchang?.trim() || undefined,
    socialXiaohongshu: opts.social_xiaohongshu?.trim() || undefined,
    defaultOgImageWpId: DEFAULT_OG_IMAGE_WP_ID,
  };

  writeJson(path.join(PATHS.migrationData, 'site-settings.json'), settings);
  return settings;
}
