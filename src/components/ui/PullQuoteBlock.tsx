/**
 * PullQuoteBlock — blog body pull-quote (Figma Quotes 2281:13297 / 2281:13345).
 * Optional headshot keeps natural aspect; fixed display height, width scales.
 */

import Image from 'next/image';
import type {SanityImageSource} from '@sanity/image-url';
import {urlForImage} from '@/lib/sanity';
import './pull-quote.css';

export type PullQuoteValue = {
  text?: string | null;
  attribution?: string | null;
  headshot?: (SanityImageSource & {
    asset?: {
      metadata?: {
        dimensions?: {
          width?: number | null;
          height?: number | null;
        } | null;
      } | null;
    } | null;
  }) | null;
};

type PullQuoteBlockProps = {
  value: PullQuoteValue;
};

/** Display height (2× for CDN). Width follows intrinsic aspect. */
const HEADSHOT_HEIGHT = 240;
const HEADSHOT_FALLBACK = {width: 648, height: 648} as const;

function headshotIntrinsicSize(headshot: NonNullable<PullQuoteValue['headshot']>) {
  const width = headshot.asset?.metadata?.dimensions?.width;
  const height = headshot.asset?.metadata?.dimensions?.height;
  if (width && height && width > 0 && height > 0) {
    return {width: Math.round(width), height: Math.round(height)};
  }
  return HEADSHOT_FALLBACK;
}

export function PullQuoteBlock({value}: PullQuoteBlockProps) {
  const text = value.text?.trim();
  if (!text) return null;

  const attribution = value.attribution?.trim();
  const headshot = value.headshot;
  const intrinsic = headshot ? headshotIntrinsicSize(headshot) : null;
  const headshotUrl =
    headshot && intrinsic
      ? urlForImage(headshot).height(HEADSHOT_HEIGHT * 2).fit('max').url()
      : null;

  return (
    <figure
      className={
        headshotUrl
          ? 'vp-pull-quote vp-pull-quote--with-headshot'
          : 'vp-pull-quote'
      }
    >
      <div className="vp-pull-quote__brackets" aria-hidden="true">
        <span className="vp-pull-quote__bracket vp-pull-quote__bracket--tl" />
        <span className="vp-pull-quote__bracket vp-pull-quote__bracket--tr" />
        <span className="vp-pull-quote__bracket vp-pull-quote__bracket--br" />
        <span className="vp-pull-quote__bracket vp-pull-quote__bracket--bl" />
      </div>

      <div className="vp-pull-quote__panel">
        {headshotUrl && intrinsic ? (
          <div
            className="vp-pull-quote__headshot"
            style={{
              aspectRatio: `${intrinsic.width} / ${intrinsic.height}`,
            }}
          >
            <Image
              src={headshotUrl}
              alt={attribution || ''}
              width={intrinsic.width}
              height={intrinsic.height}
              className="vp-pull-quote__headshot-img"
              sizes="(max-width: 767px) 100vw, 260px"
            />
          </div>
        ) : null}

        <div className="vp-pull-quote__copy">
          <blockquote className="vp-pull-quote__text">{text}</blockquote>
          {attribution ? (
            <figcaption className="vp-pull-quote__attribution">
              <span aria-hidden="true">–  </span>
              {attribution}
            </figcaption>
          ) : null}
        </div>
      </div>
    </figure>
  );
}
