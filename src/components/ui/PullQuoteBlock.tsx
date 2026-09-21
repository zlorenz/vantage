/**
 * PullQuoteBlock — blog body pull-quote (Figma Quotes 2281:13297 / 2281:13345).
 * Optional square headshot; layout stays text-only when absent.
 */

import Image from 'next/image';
import type {SanityImageSource} from '@sanity/image-url';
import {urlForImage} from '@/lib/sanity';
import './pull-quote.css';

export type PullQuoteValue = {
  text?: string | null;
  attribution?: string | null;
  headshot?: SanityImageSource | null;
};

type PullQuoteBlockProps = {
  value: PullQuoteValue;
};

export function PullQuoteBlock({value}: PullQuoteBlockProps) {
  const text = value.text?.trim();
  if (!text) return null;

  const attribution = value.attribution?.trim();
  const headshot = value.headshot;
  const headshotUrl = headshot
    ? urlForImage(headshot).width(648).height(648).fit('crop').url()
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
        {headshotUrl ? (
          <div className="vp-pull-quote__headshot">
            <Image
              src={headshotUrl}
              alt={attribution || ''}
              width={648}
              height={648}
              className="vp-pull-quote__headshot-img"
              sizes="(max-width: 767px) 100vw, 324px"
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
