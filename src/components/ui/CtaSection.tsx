/**
 * CtaSection — shared call-to-action block for Home, About, and Vietnam pages.
 *
 * Server component. Copy from Site Settings `campaignCta` (code fallback if empty).
 */

import { VpButton } from '@/components/ui/VpButton';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import type { Locale } from '@/i18n/routing';
import {
  getCampaignCtaFromSettings,
  getStandardCtaContent,
  type CtaContent,
} from '@/lib/cta-content';
import { sanityClient } from '@/lib/sanity';
import { SITE_SETTINGS_QUERY } from '@/sanity/queries/global';
import type { SiteSettings } from '@/types/sanity';
import type { ComponentProps } from 'react';
import { Link } from '@/i18n/navigation';

type LinkHref = ComponentProps<typeof Link>['href'];

interface CtaSectionProps {
  locale: Locale;
  /** Full CTA content override — if omitted, loads Site Settings (with code fallback). */
  content?: CtaContent;
  /** Optional Site Settings already fetched by the page (avoids a second query). */
  siteSettings?: Pick<SiteSettings, 'campaignCta'> | null;
  /** Optional heading HTML override. */
  headingHtml?: string;
}

export async function CtaSection({
  locale,
  content,
  siteSettings,
  headingHtml,
}: CtaSectionProps) {
  let cta = content;
  if (!cta) {
    const settings =
      siteSettings ??
      (await sanityClient.fetch<SiteSettings | null>(SITE_SETTINGS_QUERY));
    cta = settings
      ? getCampaignCtaFromSettings(settings, locale)
      : getStandardCtaContent(locale);
  }
  const heading = headingHtml ?? cta.headingHtml;
  const href = (cta.buttonHref || '/video-campaign-brief') as LinkHref;

  return (
    <SectionWrapper borderTop>
      <div className="container-fluid mx-auto max-w-[900px] px-3 md:px-4">
        <h2
          className="vp-cta__heading mb-6 font-vp-heading text-[clamp(1.75rem,2.5vw,2.25rem)] font-bold uppercase leading-tight tracking-vp-heading"
          // Known NFC gap (future pass): CTA heading/paragraphs not NFC-normalized.
          dangerouslySetInnerHTML={{ __html: heading }}
        />
        <div className="vp-cta__body font-light text-vp-text-muted">
          {cta.paragraphs.map((paragraph, index) => (
            <p key={index} className="mb-4 leading-relaxed last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>
        <div className="vp-cta__action mt-8">
          <VpButton href={href}>{cta.buttonLabel}</VpButton>
        </div>
      </div>
    </SectionWrapper>
  );
}
