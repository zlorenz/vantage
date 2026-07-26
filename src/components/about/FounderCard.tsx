/**
 * FounderCard — About page team member portrait with name and job title.
 * Name typography matches portfolio thumbnail titles (`.vp-card__title`).
 */

import Image from 'next/image';
import { pickLocaleFieldWithPhrases } from '@/lib/locale-field';
import { urlForImage } from '@/lib/sanity';
import type { Locale } from '@/i18n/routing';
import type { Founder } from '@/types/sanity';

interface FounderCardProps {
  founder: Founder;
  locale?: Locale;
  phrases?: Record<string, string>;
}

export function FounderCard({ founder, locale = 'en', phrases }: FounderCardProps) {
  const imageUrl = urlForImage(founder.image).width(600).height(750).fit('crop').url();
  const jobTitle = pickLocaleFieldWithPhrases(
    locale,
    founder.jobTitle,
    founder.jobTitleZh,
    phrases,
  );

  return (
    <article className="vp-founder-card relative aspect-[3/4] overflow-hidden">
      <Image
        src={imageUrl}
        alt={founder.name}
        fill
        className="object-cover"
        sizes="(max-width: 767px) 50vw, 25vw"
      />
      <div className="vp-card__overlay" aria-hidden />
      <div className="vp-founder-card__caption absolute inset-x-0 bottom-0 z-[2] w-full px-[1em] pb-[0.75em] pt-[1.25em] text-center pointer-events-none">
        <h3 className="vp-founder-card__name m-0 font-bold uppercase leading-[1.1] tracking-[0.0625rem] text-white">
          {founder.name}
        </h3>
        {jobTitle ? (
          <p className="vp-founder-card__role m-0 mt-1.5 text-[0.875rem] font-light leading-snug text-white/90">
            {jobTitle}
          </p>
        ) : null}
      </div>
    </article>
  );
}
