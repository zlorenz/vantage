/**
 * Production Services / Production Log feature row.
 * Mobile: Figma 2602:27835 stacked image → copy → CTA.
 * Desktop: image, copy, edge mosaic at lg.
 */

import type { ComponentProps } from 'react';
import { CornerFrame } from '@/components/ui/CornerFrame';
import { Link } from '@/i18n/navigation';
import { AboutFeatureMark } from '@/components/about/AboutFeatureMark';
import { AboutPreviewMedia } from '@/components/about/AboutPreviewMedia';
import './about-feature-row.css';

type LinkHref = ComponentProps<typeof Link>['href'];

type AboutFeatureRowProps = {
  title: string;
  paragraphs: readonly string[];
  ctaLabel: string;
  ctaHref: LinkHref;
  imageSrc: string;
  imageAlt?: string;
  previewVimeoUrl?: string | null;
  previewStartSeconds?: number | null;
  previewEndSeconds?: number | null;
  /** Services: image left, yellow bar, 0.2 wash. Log: image right, white bar, no wash. */
  mirrored?: boolean;
  tone: 'yellow' | 'white';
  wash?: boolean;
};

export function AboutFeatureRow({
  title,
  paragraphs,
  ctaLabel,
  ctaHref,
  imageSrc,
  imageAlt = '',
  previewVimeoUrl = null,
  previewStartSeconds = null,
  previewEndSeconds = null,
  mirrored = false,
  tone,
  wash = false,
}: AboutFeatureRowProps) {
  return (
    <div className={mirrored ? 'vp-about-feature vp-about-feature--mirrored' : 'vp-about-feature'}>
      <div className="vp-about-feature__row">
        <div className="vp-about-feature__media">
          <div className="vp-about-feature__photo">
            <div className="vp-about-feature__photo-clip">
              <AboutPreviewMedia
                imageSrc={imageSrc}
                imageAlt={imageAlt}
                previewVimeoUrl={previewVimeoUrl}
                previewStartSeconds={previewStartSeconds}
                previewEndSeconds={previewEndSeconds}
                sizes="(max-width: 991px) 100vw, (max-width: 1199px) 50vw, 640px"
                wash={wash}
              />
            </div>
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
          aria-hidden="true"
        >
          <AboutFeatureMark mirrored={mirrored} />
        </div>
      </div>
    </div>
  );
}
