import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

import { legacyZhRedirects } from './src/lib/legacy-zh-redirects';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // WordPress migration redirects — Milestone 8, 2026-06-22
      { source: '/wp-admin', destination: '/', permanent: true },
      { source: '/wp-admin/:path*', destination: '/', permanent: true },
      { source: '/wp-login.php', destination: '/', permanent: true },
      { source: '/feed', destination: '/', permanent: true },
      { source: '/feed/', destination: '/', permanent: true },
      { source: '/wp-json/:path*', destination: '/', permanent: true },
      {
        source: '/portfolio/3612',
        destination: '/portfolio/realme-c85-your-ultimate-outdoor-sidekick',
        permanent: true,
      },
      // Portfolio slug QC — 2026-07-19
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
      {
        source: '/zh/投资组合/大疆故事',
        destination: '/zh/投资组合/大疆故事-切尔诺贝利失落之城',
        permanent: true,
      },
      {
        source: '/zh/投资组合/智云-weebill-3s-amp-crane-m-3s-便携式视觉叙事-2.0',
        destination:
          '/zh/投资组合/智云-weebill-3s-与-crane-m-3s-便携式视觉叙事-2.0',
        permanent: true,
      },
      {
        source: '/zh/作品',
        destination: '/zh/工作',
        permanent: true,
      },
      {
        source: '/zh/作品/',
        destination: '/zh/工作/',
        permanent: true,
      },
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
