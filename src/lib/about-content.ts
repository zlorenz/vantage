import type { PortableTextBlock } from '@/types/sanity';

type PtSpan = { _type?: string; text?: string };

function getBlockPlainText(block: PortableTextBlock): string {
  if (block._type !== 'block' || !Array.isArray(block.children)) return '';
  return (block.children as PtSpan[])
    .filter((child) => child._type === 'span')
    .map((child) => child.text ?? '')
    .join('');
}

function normalizeHeading(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

function isOurTeamHeading(block: PortableTextBlock): boolean {
  if (block._type !== 'block') return false;
  const style = block.style as string | undefined;
  if (style !== 'h1' && style !== 'h2') return false;
  return normalizeHeading(getBlockPlainText(block)) === 'our team';
}

/** WP gallery migration collapsed founder captions into one concatenated paragraph. */
function isFounderGalleryArtifact(block: PortableTextBlock, founderNames: string[]): boolean {
  if (block._type !== 'block' || block.style !== 'normal' || !founderNames.length) {
    return false;
  }

  const compact = getBlockPlainText(block).replace(/\s+/g, '');
  const expected = founderNames.map((name) => name.replace(/\s+/g, '')).join('');
  if (compact === expected) return true;

  return founderNames.length > 1 && founderNames.every((name) => compact.includes(name.replace(/\s+/g, '')));
}

/**
 * Strip About-page body blocks that duplicate structured page sections.
 * Keeps "Who We Are" copy; removes migrated "Our Team" heading and name list
 * rendered separately by FounderCard grid.
 */
export function filterAboutBodyBlocks(
  blocks: PortableTextBlock[] | undefined,
  founderNames: string[] = []
): PortableTextBlock[] | undefined {
  if (!blocks?.length) return blocks;

  return blocks.filter((block) => {
    if (isOurTeamHeading(block)) return false;
    if (isFounderGalleryArtifact(block, founderNames)) return false;
    return true;
  });
}
