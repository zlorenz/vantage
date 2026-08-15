export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/studio/', '/prototype/', '/zh/prototype/'],
    },
    sitemap: 'https://vantage.pictures/sitemap.xml',
  };
}
