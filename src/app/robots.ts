export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/studio/'] },
    sitemap: 'https://vantage.pictures/sitemap.xml',
  };
}
