/**
 * PortableTextContent — renders Sanity Portable Text with Vantage styling.
 *
 * Server component. Supports headings, links, images, and lists.
 */

import type { ComponentProps } from 'react';
import Image from 'next/image';
import {
  PortableText,
  type PortableTextComponents,
} from '@portabletext/react';
import { ImageGalleryBlock } from '@/components/ui/ImageGalleryBlock';
import { PortableTextVideoEmbed } from '@/components/ui/PortableTextVideoEmbed';
import { Link } from '@/i18n/navigation';
import { normalizeInternalPath } from '@/lib/internal-url';
import { urlForImage } from '@/lib/sanity';
import {
  extractVideoUrls,
  getPortableTextBlockPlainText,
  isVideoUrlOnlyText,
} from '@/lib/video-url';
import type { GalleryImageItem } from '@/components/ui/ImageGalleryBlock';
import type { PortableTextBlock as SanityPortableTextBlock, SanityImage } from '@/types/sanity';

type LinkHref = ComponentProps<typeof Link>['href'];

function createComponents(relaxed = false): PortableTextComponents {
  const h1Class = relaxed
    ? 'mb-8 mt-10 text-[clamp(1.75rem,2.5vw,2.25rem)] font-bold uppercase leading-tight tracking-vp-heading first:mt-0'
    : 'mb-6 text-[clamp(1.75rem,2.5vw,2.25rem)] font-bold uppercase leading-tight tracking-vp-heading';
  const h2Class = relaxed
    ? 'mb-6 mt-10 text-[clamp(1.5rem,2vw,1.75rem)] font-bold uppercase leading-tight tracking-vp-heading'
    : 'mb-5 mt-8 text-[clamp(1.5rem,2vw,1.75rem)] font-bold uppercase leading-tight tracking-vp-heading';
  const pClass = relaxed
    ? 'mb-6 font-light leading-relaxed text-vp-text-muted last:mb-0'
    : 'mb-4 font-light leading-relaxed text-vp-text-muted last:mb-0';
  const ctaWrapClass = relaxed ? 'vp-pt-cta-button' : 'my-6';

  return {
  block: {
    h1: ({ children }) => (
      <h1 className={h1Class}>
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className={h2Class}>
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-4 mt-6 text-[clamp(1.35rem,1.8vw,1.5rem)] font-bold leading-snug">
        {children}
      </h3>
    ),
    normal: ({ children, value }) => {
      const text = getPortableTextBlockPlainText(value as unknown as SanityPortableTextBlock);

      if (isVideoUrlOnlyText(text)) {
        const urls = extractVideoUrls(text);
        return (
          <div className="vp-pt-videos my-6 space-y-6">
            {urls.map((url) => (
              <PortableTextVideoEmbed key={url} url={url} />
            ))}
          </div>
        );
      }

      return (
        <p className={pClass}>
          {children}
        </p>
      );
    },
    blockquote: ({ children }) => (
      <blockquote className="mb-4 border-l-2 border-vp-border pl-4 italic text-vp-text-soft">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mb-4 list-disc space-y-2 pl-6 font-light text-vp-text-muted">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="mb-4 list-decimal space-y-2 pl-6 font-light text-vp-text-muted">
        {children}
      </ol>
    ),
  },
  marks: {
    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    link: ({ children, value }) => {
      const href = value?.href as string | undefined;
      if (!href) return <>{children}</>;
      const isExternal = href.startsWith('http') || href.startsWith('mailto:');
      if (isExternal) {
        return (
          <a
            href={href}
            className="text-vp-link underline-offset-2 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        );
      }
      return (
        <a href={href} className="text-vp-link underline-offset-2 hover:underline">
          {children}
        </a>
      );
    },
  },
  types: {
    image: ({ value }) => {
      const image = value as SanityImage & { alt?: string };
      if (!image?.asset) return null;
      const imageUrl = urlForImage(image).width(1200).url();
      return (
        <figure className="vp-pt-image my-6">
          <Image
            src={imageUrl}
            alt={image.alt ?? ''}
            width={1200}
            height={675}
            className="h-auto w-full"
            sizes="(max-width: 992px) 100vw, 900px"
          />
        </figure>
      );
    },
    imageGallery: ({ value }) => {
      const gallery = value as {
        columns?: number;
        images?: GalleryImageItem[];
      };
      return (
        <ImageGalleryBlock
          columns={gallery.columns ?? 3}
          images={gallery.images ?? []}
        />
      );
    },
    ctaButton: ({ value }) => {
      const button = value as { label?: string; url?: string };
      if (!button.label || !button.url) return null;

      const path = normalizeInternalPath(button.url);
      const isExternal = /^https?:\/\//i.test(button.url);

      if (isExternal) {
        return (
          <p className={ctaWrapClass}>
            <a
              href={path}
              className="inline-block bg-vp-btn-primary-bg px-8 py-3 text-sm font-semibold uppercase tracking-vp-btn text-vp-btn-primary-text no-underline transition-colors duration-vp-default hover:bg-vp-btn-primary-hover-bg"
              target="_blank"
              rel="noopener noreferrer"
            >
              {button.label}
            </a>
          </p>
        );
      }

      return (
        <p className={ctaWrapClass}>
          <Link
            href={path as LinkHref}
            className="inline-block bg-vp-btn-primary-bg px-8 py-3 text-sm font-semibold uppercase tracking-vp-btn text-vp-btn-primary-text no-underline transition-colors duration-vp-default hover:bg-vp-btn-primary-hover-bg"
          >
            {button.label}
          </Link>
        </p>
      );
    },
  },
};
}

interface PortableTextContentProps {
  blocks?: SanityPortableTextBlock[];
  className?: string;
  /** Extra vertical rhythm for long-form CMS pages (e.g. Vietnam production service). */
  relaxed?: boolean;
}

export function PortableTextContent({
  blocks,
  className = '',
  relaxed = false,
}: PortableTextContentProps) {
  if (!blocks?.length) return null;

  const components = createComponents(relaxed);

  return (
    <div className={`vp-portable-text ${className}`.trim()}>
      <PortableText value={blocks as never} components={components} />
    </div>
  );
}
