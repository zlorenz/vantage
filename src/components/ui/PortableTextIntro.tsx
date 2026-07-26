/**
 * Simple Portable Text paragraph renderer for CMS body intros.
 * Server-only — renders block children as paragraphs with consistent spacing.
 */

export function PortableTextIntro({
  blocks,
  className = '',
}: {
  blocks?: readonly unknown[] | null;
  className?: string;
}) {
  if (!blocks?.length) return null;

  return (
    <div className={className}>
      {blocks.map((block, index) => {
        const row = block as {
          _type?: string;
          children?: { text?: string }[];
        };
        if (row._type !== 'block' || !Array.isArray(row.children)) return null;
        const text = row.children.map((child) => child.text ?? '').join('');
        if (!text.trim()) return null;
        return (
          <p key={index} className="mb-4 leading-relaxed last:mb-0">
            {text}
          </p>
        );
      })}
    </div>
  );
}
