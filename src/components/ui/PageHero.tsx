/**
 * PageHero — full-width hero with background image and centred title.
 *
 * Server component. Used on pages where showHeroHeader is true.
 * Title supports <span class="vp-outline"> via dangerouslySetInnerHTML
 * (Sanity editor-controlled content, not user input).
 * Optional description matches homepage hero carousel logline styling.
 *
 * Uses CSS background-image (same approach as the WordPress theme) so the
 * hero fills reliably without depending on next/image `fill` sizing.
 */

import type { SanityImageSource } from '@sanity/image-url';
import { urlForImage } from '@/lib/sanity';

interface PageHeroProps {
  title: string;
  /** Optional logline under the title — same treatment as homepage hero carousel. */
  description?: string;
  backgroundImage?: SanityImageSource | null;
}

export function PageHero({ title, description, backgroundImage }: PageHeroProps) {
  const imageUrl = backgroundImage
    ? urlForImage(backgroundImage).width(1920).height(1080).fit('crop').url()
    : null;

  return (
    <section
      className="vp-page-hero relative w-full overflow-hidden bg-cover bg-center bg-no-repeat"
      style={imageUrl ? { backgroundImage: `url("${imageUrl}")` } : undefined}
    >
      <div
        className="vp-page-hero__overlay absolute inset-0"
        style={{ background: 'var(--vp-overlay-dark)' }}
        aria-hidden
      />
      <div className="vp-page-hero__inner relative z-[1] flex items-center justify-center px-4 py-[clamp(6rem,9vw,10rem)] pt-[clamp(8rem,12vw,13rem)]">
        <div className="container flex w-full flex-col items-center justify-center text-center text-white min-[1400px]:max-w-[1320px]">
          <h1
            className={`vp-page-hero__title m-0 text-[clamp(2.25rem,4vw,3.75rem)] font-bold uppercase leading-tight tracking-vp-heading${
              description ? ' mb-4' : ''
            }`}
            dangerouslySetInnerHTML={{ __html: title }}
          />
          {description ? (
            <p className="vp-page-hero__desc mx-auto max-w-2xl text-base font-light leading-relaxed text-white/90">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
