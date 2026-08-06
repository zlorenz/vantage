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
import { isAppExternalUrl, normalizeInternalPath } from '@/lib/internal-url';
import { urlForImage } from '@/lib/sanity';
import {
  extractVideoUrls,
  getPortableTextBlockPlainText,
  isVideoUrlOnlyText,
} from '@/lib/video-url';
import type { GalleryImageItem } from '@/components/ui/ImageGalleryBlock';
import type { PortableTextBlock as SanityPortableTextBlock, SanityImage } from '@/types/sanity';

type LinkHref = ComponentProps<typeof Link>['href'];

/** NFC span.text so NFD Vietnamese in CMS bodies hits precomposed font glyphs. */
function normalizePortableTextSpans(
  blocks: readonly unknown[],
): unknown[] {
  return blocks.map((block) => {
    if (!block || typeof block !== 'object') return block;
    const row = block as Record<string, unknown>;
    if (!Array.isArray(row.children)) return block;
    return {
      ...row,
      children: row.children.map((child) => {
        if (!child || typeof child !== 'object') return child;
        const span = child as Record<string, unknown>;
        if (typeof span.text !== 'string') return child;
        return { ...span, text: span.text.normalize('NFC') };
      }),
    };
  });
}

function createComponents(relaxed = false): PortableTextComponents {
  const h1Class = relaxed
    ? 'mb-8 mt-10 font-vp-heading text-[clamp(1.75rem,2.5vw,2.25rem)] font-bold uppercase leading-tight tracking-vp-heading first:mt-0'
    : 'mb-6 font-vp-heading text-[clamp(1.75rem,2.5vw,2.25rem)] font-bold uppercase leading-tight tracking-vp-heading';
  const h2Class = relaxed
    ? 'mb-6 mt-10 font-vp-heading text-[clamp(1.5rem,2vw,1.75rem)] font-bold uppercase leading-tight tracking-vp-heading'
    : 'mb-5 mt-8 font-vp-heading text-[clamp(1.5rem,2vw,1.75rem)] font-bold uppercase leading-tight tracking-vp-heading';
  const pClass = relaxed
    ? 'mb-6 font-normal leading-relaxed text-vp-text-muted last:mb-0'
    : 'mb-4 font-normal leading-relaxed text-vp-text-muted last:mb-0';
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
      <h3 className="mb-4 mt-6 font-vp-heading text-[clamp(1.5rem,2.2vw,1.75rem)] font-bold uppercase leading-snug tracking-vp-heading">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="mb-3 mt-5 font-vp-heading text-[clamp(1.15rem,1.4vw,1.25rem)] font-bold uppercase leading-snug tracking-vp-heading">
        {children}
      </h4>
    ),
    normal: ({ children, value }) => {
      const text = getPortableTextBlockPlainText(value as unknown as SanityPortableTextBlock);

      if (isVideoUrlOnlyText(text)) {
        const urls = extractVideoUrls(text);
        return (
          <div className="vp-pt-videos my-6 space-y-6">
            {urls.map((url, index) => (
              <PortableTextVideoEmbed key={index} url={url} />
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
      <blockquote className="mb-4 border-l-2 border-vp-border pl-4 text-base font-light italic text-vp-text-soft">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mb-4 list-disc space-y-2 pl-6 font-normal text-vp-text-muted">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="mb-4 list-decimal space-y-2 pl-6 font-normal text-vp-text-muted">
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

      if (isAppExternalUrl(href)) {
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

      const path = normalizeInternalPath(href);
      return (
        <Link
          href={path as LinkHref}
          className="text-vp-link underline-offset-2 hover:underline"
        >
          {children}
        </Link>
      );
    },
  },
  types: {
    videoEmbed: ({ value }) => {
      const url = (value as { url?: string })?.url;
      if (!url) return null;
      return (
        <div className="vp-pt-videos my-6">
          <PortableTextVideoEmbed url={url} />
        </div>
      );
    },
    image: ({ value }) => {
      const image = value as SanityImage & {
        alt?: string;
        caption?: string;
        asset?: {
          _ref?: string;
          _id?: string;
          altText?: string | null;
          description?: string | null;
        };
      };
      if (!image?.asset) return null;
      const imageUrl = urlForImage(image).width(1200).url();
      // Block fields are optional per-instance overrides; Media metadata is the default.
      const alt =
        image.alt?.trim() || image.asset.altText?.trim() || '';
      const caption =
        image.caption?.trim() || image.asset.description?.trim() || '';
      return (
        <figure className="vp-pt-image my-6">
          <Image
            src={imageUrl}
            alt={alt}
            width={1200}
            height={675}
            className="h-auto w-full"
            sizes="(max-width: 992px) 100vw, 900px"
          />
          {caption ? (
            <figcaption className="mt-2 text-sm font-light text-vp-text-soft">
              {caption}
            </figcaption>
          ) : null}
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
      const ctaClassName =
        'inline-block bg-vp-btn-primary-bg px-8 py-3 text-sm font-semibold uppercase tracking-vp-btn text-vp-btn-primary-text no-underline transition-colors duration-vp-default hover:bg-vp-btn-primary-hover-bg';

      if (isAppExternalUrl(button.url)) {
        return (
          <p className={ctaWrapClass}>
            <a
              href={button.url}
              className={ctaClassName}
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
          <Link href={path as LinkHref} className={ctaClassName}>
            {button.label}
          </Link>
        </p>
      );
    },
  },
};
}

interface PortableTextContentProps {
  // Accept TypeGen body unions as well as hand-typed PortableTextBlock[].
  blocks?: readonly unknown[] | null;
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
  const normalizedBlocks = normalizePortableTextSpans(blocks);

  return (
    <div className={`vp-portable-text ${className}`.trim()}>
      <PortableText value={normalizedBlocks as never} components={components} />
    </div>
  );
}
