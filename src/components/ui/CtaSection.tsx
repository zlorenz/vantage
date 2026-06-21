/**
 * CtaSection — shared call-to-action block for Home, About, and Vietnam pages.
 *
 * Server component. Copy passed via props or defaults from cta-content.ts.
 * Left-aligned on desktop, centred on mobile.
 */

import { VpButton } from '@/components/ui/VpButton';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import type { Locale } from '@/i18n/routing';
import {
  getStandardCtaContent,
  type CtaContent,
} from '@/lib/cta-content';

interface CtaSectionProps {
  locale: Locale;
  /** Full CTA content override — if omitted, uses standard copy. */
  content?: CtaContent;
  /** Optional heading HTML override (e.g. Vietnam variant). */
  headingHtml?: string;
}

export function CtaSection({ locale, content, headingHtml }: CtaSectionProps) {
  const cta = content ?? getStandardCtaContent(locale);
  const heading = headingHtml ?? cta.headingHtml;

  return (
    <SectionWrapper borderTop>
      <div className="container-fluid mx-auto max-w-[900px] px-3 text-center md:px-4 md:text-left">
        <h2
          className="vp-cta__heading mb-6 text-[clamp(1.75rem,2.5vw,2.25rem)] font-bold uppercase leading-tight tracking-vp-heading"
          dangerouslySetInnerHTML={{ __html: heading }}
        />
        <div className="vp-cta__body space-y-4 font-light text-vp-text-muted">
          {cta.paragraphs.map((paragraph, index) => (
            <p key={index} className="m-0">
              {paragraph}
            </p>
          ))}
        </div>
        <div className="vp-cta__action mt-8">
          <VpButton href="/video-campaign-brief">{cta.buttonLabel}</VpButton>
        </div>
      </div>
    </SectionWrapper>
  );
}
