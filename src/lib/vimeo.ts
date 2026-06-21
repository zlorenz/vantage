/**
 * Extract numeric Vimeo video ID from a Vimeo URL string.
 */
export function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match?.[1] ?? null;
}
