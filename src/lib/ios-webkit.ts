/**
 * iOS WebKit detection.
 *
 * This is a platform check, not a browser-brand check: Apple requires every
 * iOS/iPadOS browser to use WebKit, so Chrome and Firefox on an iPhone hit the
 * same engine — and the same progressive-MP4 range-seek limitation — as Safari.
 * Confirmed on-device: the carousel's trimmed previews fail in both Safari and
 * Chrome on iPhone, and in neither on desktop.
 */

/**
 * iPadOS 13+ requests desktop sites by default and reports a Macintosh UA with
 * no iPad token, so the UA alone cannot tell an iPad from a Mac. Touch points
 * are the separator — a real Mac reports 0, including Safari on Apple Silicon.
 */
function isIpadInDesktopMode(userAgent: string, maxTouchPoints: number): boolean {
  return /Macintosh/i.test(userAgent) && maxTouchPoints > 1;
}

/** Testable core — takes the two navigator values rather than reading globals. */
export function isIOSWebKitUserAgent(userAgent: string, maxTouchPoints: number): boolean {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return true;
  return isIpadInDesktopMode(userAgent, maxTouchPoints);
}

/**
 * Call from an effect or event handler, never during render — this returns
 * false on the server, so branching on it while rendering would desync
 * hydration on the very devices it is meant to detect.
 */
export function isIOSWebKit(): boolean {
  if (typeof navigator === 'undefined') return false;
  return isIOSWebKitUserAgent(navigator.userAgent, navigator.maxTouchPoints ?? 0);
}
