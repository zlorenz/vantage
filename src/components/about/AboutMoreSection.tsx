/**
 * More About Vantage.
 * Mobile + desktop share the dashed frame; desktop adds the five-cell row.
 * Figma mobile 2602:27387 (keep black — product tweak).
 */

import type { ComponentProps } from 'react';
import { CornerFrame } from '@/components/ui/CornerFrame';
import { Link } from '@/i18n/navigation';
import './about-more.css';

type LinkHref = ComponentProps<typeof Link>['href'];

export type AboutMoreLink = {
  label: string;
  href: LinkHref;
};

type AboutMoreSectionProps = {
  title: string;
  body: string;
  links: readonly AboutMoreLink[];
};

export function AboutMoreSection({ title, body, links }: AboutMoreSectionProps) {
  return (
    <div className="vp-about-more">
      <div className="vp-about-more__frame">
        <CornerFrame
          variant="dark"
          rulers={{ top: true, bottom: true }}
          crosshair={{ size: 60, color: 'var(--vp-link)' }}
        />
        <div className="vp-about-more__inner">
          <div className="vp-about-more__intro">
            <h2 className="vp-about-more__title">{title}</h2>
            <p className="vp-about-more__dek">{body}</p>
          </div>
          {/* Mobile: in-flow plus. Desktop uses the CornerFrame crosshair in the tall gap. */}
          <span className="vp-about-more__plus" aria-hidden="true" />
          <nav className="vp-about-more__links" aria-label={title}>
            {links.map((link) => (
              <Link key={link.label} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
