import { stegaClean } from '@sanity/client/stega';
import type { PortableTextBlock } from '@/types/sanity';

type PtSpan = { _type?: string; text?: string };

function getBlockPlainText(block: PortableTextBlock): string {
  if (block._type !== 'block' || !Array.isArray(block.children)) return '';
  // stegaClean for filter compares only — blocks that pass through keep stega for overlays.
  return (block.children as PtSpan[])
    .filter((child) => child._type === 'span')
    .map((child) => stegaClean(child.text ?? ''))
    .join('');
}

function normalizeHeading(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

function isOurTeamHeading(block: PortableTextBlock): boolean {
  if (block._type !== 'block') return false;
  const style = block.style as string | undefined;
  if (style !== 'h1' && style !== 'h2') return false;
  const heading = normalizeHeading(getBlockPlainText(block));
  return heading === 'our team' || heading === '我们的团队';
}

/** WP gallery migration collapsed founder captions into one concatenated paragraph. */
function isFounderGalleryArtifact(block: PortableTextBlock, founderNames: string[]): boolean {
  if (block._type !== 'block' || block.style !== 'normal' || !founderNames.length) {
    return false;
  }

  const compact = getBlockPlainText(block).replace(/\s+/g, '');
  // Clean founder names for compare only — same draft-stega issue as body spans.
  const cleanedNames = founderNames.map((name) => stegaClean(name).replace(/\s+/g, ''));
  const expected = cleanedNames.join('');
  if (compact === expected) return true;

  return cleanedNames.length > 1 && cleanedNames.every((name) => compact.includes(name));
}

/**
 * Strip About-page body blocks that duplicate structured page sections.
 * Keeps "Who We Are" copy; removes migrated "Our Team" heading and name list
 * rendered separately by FounderCard grid.
 */
export function filterAboutBodyBlocks<T>(
  blocks: readonly T[] | null | undefined,
  founderNames: string[] = [],
): T[] | undefined {
  if (!blocks?.length) return undefined;

  return blocks.filter((block) => {
    const pt = block as PortableTextBlock;
    if (isOurTeamHeading(pt)) return false;
    if (isFounderGalleryArtifact(pt, founderNames)) return false;
    return true;
  });
}
