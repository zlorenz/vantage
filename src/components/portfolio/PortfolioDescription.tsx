/**
 * Plain-text portfolio description with paragraph spacing.
 * Blank lines in CMS text become separated paragraphs on the page.
 */

import { htmlDescriptionToPlain } from '@/lib/html-description';

type PortfolioDescriptionProps = {
  text: string | null | undefined;
  className?: string;
};

export function PortfolioDescription({
  text,
  className = 'mb-4 font-light text-vp-text-muted',
}: PortfolioDescriptionProps) {
  const plain = htmlDescriptionToPlain(text);
  if (!plain) return null;

  const paragraphs = plain
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length <= 1) {
    return (
      <div className={`${className} whitespace-pre-wrap`}>
        {paragraphs[0] ?? plain}
      </div>
    );
  }

  return (
    <div className={className}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="mb-4 whitespace-pre-wrap last:mb-0">
          {paragraph}
        </p>
      ))}
    </div>
  );
}
