/**
 * Lightweight oEmbed title fetch for Studio videoEmbed (browser-side).
 * Kept separate from index to avoid circular imports.
 */

type OEmbedPayload = {title?: string}

function primaryOEmbedEndpoint(url: string): string | null {
  if (/youtube\.com|youtu\.be/i.test(url)) {
    return `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
  }
  if (/vimeo\.com/i.test(url)) {
    return `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`
  }
  return null
}

async function readTitle(endpoint: string): Promise<string | null> {
  try {
    const res = await fetch(endpoint)
    if (!res.ok) return null
    const data = (await res.json()) as OEmbedPayload
    const title = typeof data.title === 'string' ? data.title.trim() : ''
    return title || null
  } catch {
    return null
  }
}

/**
 * Resolve a display title for a Vimeo/YouTube URL.
 * Tries provider oEmbed first, then noembed.com as a CORS-friendly fallback.
 */
export async function fetchVideoOEmbedTitle(url: string): Promise<string | null> {
  const trimmed = url.trim()
  if (!trimmed) return null

  const primary = primaryOEmbedEndpoint(trimmed)
  if (primary) {
    const title = await readTitle(primary)
    if (title) return title
  }

  // Fallback when provider oEmbed is blocked / CORS-fails in Studio.
  return readTitle(`https://noembed.com/embed?url=${encodeURIComponent(trimmed)}`)
}
