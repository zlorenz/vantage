/**
 * Catch-all for locale URLs that match no real route.
 *
 * More specific pages (about, portfolio/[slug], [slug], and so on) take priority.
 * Anything left over calls notFound() so the localized 404 renders inside
 * the site header and footer instead of the framework blank page.
 */

import { notFound } from 'next/navigation';

export default function UnknownRoutePage() {
  notFound();
}
