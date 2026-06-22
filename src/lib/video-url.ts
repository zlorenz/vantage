import { extractVimeoId } from '@/lib/vimeo';
import { extractYouTubeId } from '@/lib/youtube';
import type { PortableTextBlock } from '@/types/sanity';

type PtSpan = { _type?: string; text?: string };

const VIDEO_URL_PATTERN =
  /https?:\/\/(?:www\.)?(?:vimeo\.com\/(?:video\/)?\d+(?:[?#][^\s]*)?|youtube\.com\/watch\?v=[\w-]+(?:[&?#][^\s]*)?|youtu\.be\/[\w-]+(?:[?#][^\s]*)?|youtube\.com\/embed\/[\w-]+(?:[?#][^\s]*)?)/gi;

export type VideoProvider = 'vimeo' | 'youtube';

export interface ParsedVideoUrl {
  url: string;
  provider: VideoProvider;
  id: string;
}

export function getPortableTextBlockPlainText(block: PortableTextBlock): string {
  if (block._type !== 'block' || !Array.isArray(block.children)) return '';
  return (block.children as PtSpan[])
    .filter((child) => child._type === 'span')
    .map((child) => child.text ?? '')
    .join('');
}

export function extractVideoUrls(text: string): string[] {
  return [...text.matchAll(VIDEO_URL_PATTERN)].map((match) => match[0]);
}

export function isVideoUrlOnlyText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  const urls = extractVideoUrls(trimmed);
  if (!urls.length) return false;

  const remainder = urls
    .reduce((acc, url) => acc.replace(url, ''), trimmed)
    .replace(/\s+/g, '')
    .trim();

  return !remainder;
}

export function parseVideoUrl(url: string): ParsedVideoUrl | null {
  const vimeoId = extractVimeoId(url);
  if (vimeoId) {
    return { url, provider: 'vimeo', id: vimeoId };
  }

  const youtubeId = extractYouTubeId(url);
  if (youtubeId) {
    return { url, provider: 'youtube', id: youtubeId };
  }

  return null;
}
