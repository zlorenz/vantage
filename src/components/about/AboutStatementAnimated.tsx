'use client';

/**
 * About statement display — client shell for scroll animation (wired in later commits).
 * Receives pre-resolved line strings from the server parent.
 */

export type AboutStatementLines = {
  line1: string;
  line2: string;
  line3: string;
  line4: string;
  line5: string;
};

type AboutStatementAnimatedProps = AboutStatementLines;

const HEADING_CLASS =
  'm-0 font-vp-heading text-[clamp(2.375rem,5.5vw,4.5rem)] uppercase leading-[0.95] tracking-vp-heading';

export function AboutStatementAnimated({
  line1,
  line2,
  line3,
  line4,
  line5,
}: AboutStatementAnimatedProps) {
  const bodyLines = [line1, line2, line3, line4];

  return (
    <section className="vp-about-statement bg-vp-bg px-[var(--spacing-vp-gutter)] pb-[var(--vp-section-y)] pt-[var(--vp-section-y-header-condensed)] text-vp-text">
      <div className="mx-auto max-w-[1400px] text-center">
        <h1 className={HEADING_CLASS}>
          {bodyLines.map((line) => (
            <span key={line} className="block text-vp-text">
              {line}
            </span>
          ))}
          {/* Redesign orange #F37021 (design/.pen) — not yet the CSS --vp-orange token (#f04e23). */}
          <span className="block text-[#F37021]">{line5}</span>
        </h1>
      </div>
    </section>
  );
}
