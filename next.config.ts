import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

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
      {
        source: '/portfolio/3612/',
        destination: '/portfolio/realme-c85-your-ultimate-outdoor-sidekick',
        permanent: true,
      },
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
    ],
  },
};

export default withNextIntl(nextConfig);
