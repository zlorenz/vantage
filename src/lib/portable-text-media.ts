/**
 * Merge Chinese Portable Text body text with English media blocks
 * (images, galleries, video-url-only paragraphs).
 *
 * TranslatePress / HTML→PT for bodyZh often drops `<!-- wp:image -->` comments,
 * so ZH bodies lose inline media while EN bodies keep it.
 */

import {
  getPortableTextBlockPlainText,
  isVideoUrlOnlyText,
} from '@/lib/video-url';

type PtBlock = {
  _type?: string;
  _key?: string;
  [key: string]: unknown;
};

function newKey(): string {
  return Math.random().toString(36).slice(2, 14);
}

export function isPortableTextMediaBlock(block: PtBlock | null | undefined): boolean {
  if (!block?._type) return false;
  if (block._type === 'image' || block._type === 'imageGallery') return true;
  if (block._type === 'block') {
    const text = getPortableTextBlockPlainText(
      block as Parameters<typeof getPortableTextBlockPlainText>[0],
    );
    return isVideoUrlOnlyText(text);
  }
  return false;
}

/**
 * Walk English body order: take media from EN, text from ZH (in order).
 */
export function mergeChineseBodyWithEnglishMedia(
  bodyZh: PtBlock[] | null | undefined,
  bodyEn: PtBlock[] | null | undefined,
): PtBlock[] {
  const zh = bodyZh?.length ? bodyZh : [];
  const en = bodyEn?.length ? bodyEn : [];
  if (!zh.length) return en;
  if (!en.some(isPortableTextMediaBlock)) return zh;

  const zhTextQueue = zh.filter((b) => !isPortableTextMediaBlock(b));
  let zi = 0;
  const out: PtBlock[] = [];

  for (const enBlock of en) {
    if (isPortableTextMediaBlock(enBlock)) {
      out.push({ ...enBlock, _key: newKey() });
      continue;
    }
    if (zi < zhTextQueue.length) {
      out.push({ ...zhTextQueue[zi]!, _key: newKey() });
      zi += 1;
    }
  }

  while (zi < zhTextQueue.length) {
    out.push({ ...zhTextQueue[zi]!, _key: newKey() });
    zi += 1;
  }

  return out.length ? out : zh;
}
