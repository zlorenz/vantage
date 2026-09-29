/**
 * Production Services / Production Log feature row.
 *
 * Below 1200px the original stacked markup is rendered as-is.
 * At lg a second tree shows the Figma row (image, copy, edge mosaic).
 * `hidden` / `lg:hidden` keep only one tree visible and exposed.
 */

import type { ComponentProps, ReactNode } from 'react';
import Image from 'next/image';
import { CornerFrame } from '@/components/ui/CornerFrame';
import { Link } from '@/i18n/navigation';
import { AboutFeatureMark } from '@/components/about/AboutFeatureMark';
import './about-feature-row.css';

type LinkHref = ComponentProps<typeof Link>['href'];

type AboutFeatureRowProps = {
  title: string;
  paragraphs: readonly string[];
  ctaLabel: string;
  ctaHref: LinkHref;
  imageSrc: string;
  imageAlt?: string;
  /** Services: image left, yellow bar, 0.2 wash. Log: image right, white bar, no wash. */
  mirrored?: boolean;
  tone: 'yellow' | 'white';
  wash?: boolean;
  mobile: ReactNode;
};

export function AboutFeatureRow({
  title,
  paragraphs,
  ctaLabel,
  ctaHref,
  imageSrc,
  imageAlt = '',
  mirrored = false,
  tone,
  wash = false,
  mobile,
}: AboutFeatureRowProps) {
  return (
    <div className={mirrored ? 'vp-about-feature vp-about-feature--mirrored' : 'vp-about-feature'}>
      <div className="lg:hidden">{mobile}</div>
      <div className="vp-about-feature__desktop hidden lg:flex">
        <div className="vp-about-feature__media">
          <div className="vp-about-feature__photo">
            <Image src={imageSrc} alt={imageAlt} fill sizes="640px" className="object-cover" />
            {wash ? <span className="vp-about-feature__wash" /> : null}
            <CornerFrame variant="dark" crosshair={{ size: 40, color: 'var(--vp-text)' }} />
          </div>
        </div>
        <div className="vp-about-feature__copy">
          <h2 className="vp-about-feature__title">{title}</h2>
          <div className="vp-about-feature__lower">
            <p className="vp-about-feature__body">{paragraphs.join(' ')}</p>
            <Link
              href={ctaHref}
              className={`vp-about-feature__cta vp-about-feature__cta--${tone}`}
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
        <div
          className={
            mirrored
              ? 'vp-about-feature__pattern vp-about-feature__pattern--start'
              : 'vp-about-feature__pattern vp-about-feature__pattern--end'
          }
        >
          <AboutFeatureMark mirrored={mirrored} />
        </div>
      </div>
    </div>
  );
}
