/**
 * More About Vantage.
 * Below 1200px: centered heading and wrapping text links.
 * At lg: dashed frame, rulers, yellow crosshair, and a five-cell row.
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

const linkClassName =
  'text-vp-link no-underline transition-colors duration-vp-default hover:text-vp-link-hover';

type AboutMoreSectionProps = {
  title: string;
  body: string;
  links: readonly AboutMoreLink[];
};

export function AboutMoreSection({ title, body, links }: AboutMoreSectionProps) {
  return (
    <>
      <div className="text-center lg:hidden">
        <h2 className="mb-3 font-vp-heading text-[clamp(1.75rem,2.5vw,2.25rem)] font-bold uppercase leading-tight tracking-vp-heading text-white">
          {title}
        </h2>
        <p className="m-0 font-light leading-relaxed text-vp-text-muted">{body}</p>
        <p className="m-0 mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-normal">
          {links.map((link) => (
            <Link key={link.label} href={link.href} className={linkClassName}>
              {link.label}
            </Link>
          ))}
        </p>
      </div>

      <div className="vp-about-more__desktop hidden lg:flex">
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
    </>
  );
}
