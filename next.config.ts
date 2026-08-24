import os from 'node:os';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

import { encodeRedirectRule } from './shared/redirect-encoding';
import { legacyZhRedirects } from './src/lib/legacy-zh-redirects';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** LAN IPs + Bonjour hostname so phone preview works after switching Wi-Fi. */
function lanDevOrigins(): string[] {
  const origins = new Set<string>(['127.0.0.1']);
  const hostname = os.hostname().replace(/\.local$/i, '');
  if (hostname) origins.add(`${hostname}.local`);

  for (const addrs of Object.values(os.networkInterfaces())) {
    for (const addr of addrs ?? []) {
      if (addr.internal) continue;
      if (addr.family !== 'IPv4' && addr.family !== 4) continue;
      origins.add(addr.address);
    }
  }

  return [...origins];
}

const nextConfig: NextConfig = {
  // Recomputed when `next dev` starts — restart after switching networks.
  allowedDevOrigins: lanDevOrigins(),
  async redirects() {
    return [
      // WordPress migration redirects — Milestone 8, 2026-06-22
      { source: '/wp-admin', destination: '/', permanent: true },
      { source: '/wp-admin/:path*', destination: '/', permanent: true },
      { source: '/wp-login.php', destination: '/', permanent: true },
      { source: '/feed', destination: '/', permanent: true },
      { source: '/feed/', destination: '/', permanent: true },
      { source: '/wp-json/:path*', destination: '/', permanent: true },
      { source: '/author/:path*', destination: '/', permanent: true },
      {
        source: '/portfolio/3612',
        destination: '/portfolio/realme-c85-your-ultimate-outdoor-sidekick',
        permanent: true,
      },
      // Portfolio slug QC — 2026-07-19
      // Pre-encoded NFC combining-mark sources — do NOT run through
      // encodeRedirectRule (would double-encode % → %25).
      {
        source:
          '/portfolio/bidv-smartbanking-hoa-nhi%cc%a3p-so%cc%82ng-tho%cc%82ng-minh',
        destination: '/portfolio/bidv-smartbanking-hoa-nhip-song-thong-minh',
        permanent: true,
      },
      {
        source:
          '/portfolio/vinamilk-probi-e%cc%82m-ruo%cc%a3%cc%82t-nuo%cc%a3%cc%82t-do%cc%9bi',
        destination: '/portfolio/vinamilk-probi-em-ruot-nuot-doi',
        permanent: true,
      },
      {
        source: '/portfolio/fujifilm-jouney-toward-more-accessible-medicine',
        destination:
          '/portfolio/fujifilm-journey-toward-more-accessible-medicine',
        permanent: true,
      },
      {
        source: '/portfolio/techombank-mobile',
        destination: '/portfolio/techcombank-mobile',
        permanent: true,
      },
      {
        source: '/portfolio/dji-meet-the-robomaster-s1',
        destination: '/portfolio/dji-robomaster-s1',
        permanent: true,
      },
      // Unicode sources/destinations — encode for Next redirects() matching
      // (vercel/next.js#33470). Pass raw strings only; see encodeRedirectRule.
      encodeRedirectRule({
        source: '/zh/案例/大疆故事',
        destination: '/zh/案例/大疆故事-切尔诺贝利失落之城',
        permanent: true,
      }),
      encodeRedirectRule({
        source: '/zh/案例/智云-weebill-3s-amp-crane-m-3s-便携式视觉叙事-2.0',
        destination:
          '/zh/案例/智云-weebill-3s-与-crane-m-3s-便携式视觉叙事-2.0',
        permanent: true,
      }),
      encodeRedirectRule({
        source: '/zh/作品',
        destination: '/zh/工作',
        permanent: true,
      }),
      encodeRedirectRule({
        source: '/zh/作品/',
        destination: '/zh/工作/',
        permanent: true,
      }),
      // Live WP ZH slug → current Sanity slugZh (see src/lib/legacy-zh-redirects.ts)
      ...legacyZhRedirects,
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'i.vimeocdn.com',
      },
      {
        protocol: 'https',
        hostname: 'vumbnail.com',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
