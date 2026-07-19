/**
 * Expand zh-slug-redirects.json into Next.js `redirects()` entries.
 * Kept free of `@/` imports so next.config.ts can load it.
 */

import redirectsFile from '../data/zh-slug-redirects.json';

export type ZhSlugRedirect = {
  source: string;
  destination: string;
  permanent: boolean;
};

function withSlashVariants(path: string): string[] {
  if (path === '/' || path === '/zh/') return [path];
  const trimmed = path.endsWith('/') ? path.slice(0, -1) : path;
  return [trimmed, `${trimmed}/`];
}

/** Permanent redirects: legacy live / interim ZH paths → improved Sanity slugs. */
export function buildZhSlugRedirects(): ZhSlugRedirect[] {
  const out: ZhSlugRedirect[] = [];
  const seen = new Set<string>();

  for (const row of redirectsFile.redirects) {
    const destination = withSlashVariants(row.destination)[0]!;

    for (const source of withSlashVariants(row.source)) {
      if (source === destination || source === `${destination}/`) continue;
      if (seen.has(source)) continue;
      seen.add(source);
      out.push({
        source,
        destination,
        permanent: true,
      });
    }
  }

  return out;
}
