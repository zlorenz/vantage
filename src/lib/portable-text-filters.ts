/**
 * Portable Text block filters — strip migration artifacts superseded by structured fields.
 */

import { getPortableTextBlockPlainText } from '@/lib/video-url';
import type { PortableTextBlock } from '@/types/sanity';

/** wp:file blocks collapsed to "filename.pdfDownload" plain-text paragraphs. */
export function isPdfDownloadArtifactBlock(block: PortableTextBlock): boolean {
  if (block._type !== 'block') return false;
  const compact = getPortableTextBlockPlainText(block).replace(/\s+/g, '');
  return /\.pdfdownload$/i.test(compact);
}

export function filterPdfDownloadArtifactBlocks(
  blocks?: PortableTextBlock[],
): PortableTextBlock[] | undefined {
  if (!blocks?.length) return blocks;
  const filtered = blocks.filter((block) => !isPdfDownloadArtifactBlock(block));
  return filtered.length ? filtered : undefined;
}

/** Gallery captions collapsed into one paragraph during failed migration. */
function isGalleryCaptionArtifact(block: PortableTextBlock): boolean {
  if (block._type !== 'block' || block.style !== 'normal') return false;
  const text = getPortableTextBlockPlainText(block).trim();
  return text.length > 120 && !/[.!?]/.test(text) && /Studio|City|Vietnam|Cave|Island/i.test(text);
}

/** Sections rendered separately on vietnam-production-service page. */
export function filterVietnamProductionServiceBody(
  blocks?: PortableTextBlock[],
): PortableTextBlock[] | undefined {
  if (!blocks?.length) return blocks;

  const filtered: PortableTextBlock[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    if (block._type === 'block') {
      const text = getPortableTextBlockPlainText(block).trim();
      if (!text) continue;
    }

    if (isGalleryCaptionArtifact(block)) continue;

    if (block._type === 'block' && block.style === 'h1') {
      const text = getPortableTextBlockPlainText(block).trim();
      if (/^shot\s+in\s+vietnam$/i.test(text)) continue;

      if (/^plan your next production/i.test(text)) {
        const next = blocks[i + 1];
        if (next?._type === 'block' && next.style === 'normal') i += 1;
        continue;
      }
    }

    filtered.push(block);
  }

  return filtered.length ? filtered : undefined;
}
