/**
 * Simple Portable Text paragraph renderer for CMS body intros.
 * Server-only — renders block children as centred paragraphs.
 */

import type { PortableTextBlock } from '@/types/sanity';

export function PortableTextIntro({
  blocks,
  className = '',
}: {
  blocks?: PortableTextBlock[];
  className?: string;
}) {
  if (!blocks?.length) return null;

  return (
    <div className={className}>
      {blocks.map((block, index) => {
        if (block._type !== 'block' || !Array.isArray(block.children)) return null;
        const text = (block.children as { text?: string }[])
          .map((child) => child.text ?? '')
          .join('');
        if (!text.trim()) return null;
        return (
          <p key={index} className="mb-0">
            {text}
          </p>
        );
      })}
    </div>
  );
}
