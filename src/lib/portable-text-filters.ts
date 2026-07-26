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

export function filterPdfDownloadArtifactBlocks<T>(
  blocks?: readonly T[] | null,
): T[] | undefined {
  if (!blocks?.length) return undefined;
  const filtered = blocks.filter(
    (block) => !isPdfDownloadArtifactBlock(block as PortableTextBlock),
  );
  return filtered.length ? filtered : undefined;
}

/** Gallery captions collapsed into one paragraph during failed migration. */
function isGalleryCaptionArtifact(block: PortableTextBlock): boolean {
  if (block._type !== 'block' || block.style !== 'normal') return false;
  const text = getPortableTextBlockPlainText(block).trim();
  if (!text) return false;

  // Collapsed caption dumps are usually English place/studio names glued together
  // without sentence punctuation (length can be under 120 for short studio rows).
  const looksGlued =
    /City[A-Z]|Vietnam[A-Z]|Studio[A-Z]|Island[A-Z]|Pass[A-Z]|Bay[A-Z]/i.test(text) ||
    (text.match(/Ho Chi Minh City/gi)?.length ?? 0) >= 2 ||
    (text.match(/\b(Studio|Cave|Island|Bridge|Pagoda|Museum|Peak|Bay)\b/gi)?.length ?? 0) >= 3;

  if (looksGlued && !/[.!?。]/.test(text)) return true;

  return (
    text.length > 100 &&
    !/[.!?。]/.test(text) &&
    /Studio|City|Vietnam|Cave|Island|Bridge|Pagoda|Museum/i.test(text)
  );
}

/** Sections rendered separately on vietnam-production-service page. */
export function filterVietnamProductionServiceBody<T>(
  blocks?: readonly T[] | null,
): T[] | undefined {
  if (!blocks?.length) return undefined;

  const filtered: T[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i] as PortableTextBlock;

    if (block._type === 'block') {
      const text = getPortableTextBlockPlainText(block).trim();
      if (!text) continue;
    }

    if (isGalleryCaptionArtifact(block)) continue;

    if (block._type === 'block' && block.style === 'h1') {
      const text = getPortableTextBlockPlainText(block).trim();
      if (/^shot\s+in\s+vietnam$/i.test(text)) continue;
      if (/^在越南拍摄$/.test(text.replace(/\s+/g, ''))) continue;

      if (/^plan your next production/i.test(text)) {
        const next = blocks[i + 1] as PortableTextBlock | undefined;
        if (next?._type === 'block' && next.style === 'normal') i += 1;
        continue;
      }
      if (/计划下一次制作/.test(text)) {
        const next = blocks[i + 1] as PortableTextBlock | undefined;
        if (next?._type === 'block' && next.style === 'normal') i += 1;
        continue;
      }
    }

    filtered.push(blocks[i]);
  }

  return filtered.length ? filtered : undefined;
}
