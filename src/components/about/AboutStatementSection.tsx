/**
 * AboutStatementSection — full-bleed display statement at the top of /about.
 *
 * Static final-state layout only (no scroll animation in this pass).
 * Clears the fixed transparent nav via --vp-section-y-header-condensed
 * (same token used after PageHero removal on portfolio case studies).
 *
 * Note: there is no SectionWrapper "dark" variant yet — page chrome is
 * already vp-bg black; this section sets bg-vp-bg / text-vp-text explicitly.
 */

import { getTranslations } from 'next-intl/server';

export async function AboutStatementSection() {
  const t = await getTranslations('About');

  const lines = [
    t('statementLine1'),
    t('statementLine2'),
    t('statementLine3'),
    t('statementLine4'),
  ] as const;

  return (
    <section
      className="vp-about-statement bg-vp-bg px-[var(--spacing-vp-gutter)] pb-[var(--vp-section-y)] pt-[var(--vp-section-y-header-condensed)] text-vp-text"
    >
      <h1 className="m-0 max-w-none font-vp-heading text-[clamp(2.375rem,5.5vw,4.5rem)] font-bold uppercase leading-[0.95] tracking-vp-heading">
        {lines.map((line) => (
          <span key={line} className="block text-vp-text">
            {line}
          </span>
        ))}
        {/* Redesign orange #F37021 (design/.pen) — not yet the CSS --vp-orange token (#f04e23). */}
        <span className="block text-[#F37021]">{t('statementLine5')}</span>
      </h1>
    </section>
  );
}
