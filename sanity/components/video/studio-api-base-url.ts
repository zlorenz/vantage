/**
 * Resolve the Next.js origin for Studio-side API calls (Vimeo library, keyframes).
 */

const DEFAULT_SITE_URL = 'https://vantage.pictures';

export function getStudioApiBaseUrl(): string {
  const env = (import.meta as ImportMeta & {env?: Record<string, string | boolean>}).env;
  const fromEnv = env?.SANITY_STUDIO_SITE_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/$/, '');
  }
  if (env?.DEV) return 'http://localhost:3000';
  return DEFAULT_SITE_URL;
}

export function candidateStudioApiBaseUrls(): string[] {
  const primary = getStudioApiBaseUrl();
  const urls = [primary];
  const env = (import.meta as ImportMeta & {env?: {DEV?: boolean}}).env;
  if (env?.DEV && primary !== 'http://localhost:3001') {
    urls.push('http://localhost:3001');
  }
  return urls;
}
