/**
 * PortableTextContent — renders Sanity Portable Text with Vantage styling.
 *
 * Server component. Supports headings, links, images, and lists.
 */

import Image from 'next/image';
import {
  PortableText,
  type PortableTextComponents,
} from '@portabletext/react';
import { urlForImage } from '@/lib/sanity';
import type { PortableTextBlock as SanityPortableTextBlock, SanityImage } from '@/types/sanity';

const components: PortableTextComponents = {
  block: {
    h1: ({ children }) => (
      <h1 className="mb-6 text-[clamp(1.75rem,2.5vw,2.25rem)] font-bold uppercase leading-tight tracking-vp-heading">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mb-5 mt-8 text-[clamp(1.5rem,2vw,1.75rem)] font-bold uppercase leading-tight tracking-vp-heading">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-4 mt-6 text-[clamp(1.35rem,1.8vw,1.5rem)] font-bold leading-snug">
        {children}
      </h3>
    ),
    normal: ({ children }) => (
      <p className="mb-4 font-light leading-relaxed text-vp-text-muted last:mb-0">
        {children}
      </p>
    ),
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
      const image = value as SanityImage;
      if (!image?.asset) return null;
      const imageUrl = urlForImage(image).width(1200).url();
      return (
        <figure className="vp-pt-image my-6">
          <Image
            src={imageUrl}
            alt=""
            width={1200}
            height={675}
            className="h-auto w-full"
            sizes="(max-width: 992px) 100vw, 900px"
          />
        </figure>
      );
    },
  },
};

interface PortableTextContentProps {
  blocks?: SanityPortableTextBlock[];
  className?: string;
}

export function PortableTextContent({ blocks, className = '' }: PortableTextContentProps) {
  if (!blocks?.length) return null;

  return (
    <div className={`vp-portable-text ${className}`.trim()}>
      <PortableText value={blocks as never} components={components} />
    </div>
  );
}
