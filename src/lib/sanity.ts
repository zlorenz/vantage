/**
 * Sanity CMS client configuration for Vantage Pictures.
 *
 * This module provides the read-only Sanity client and image URL builder
 * used by Next.js server components and API routes at build/request time.
 *
 * Environment variables (set in .env.local):
 *   NEXT_PUBLIC_SANITY_PROJECT_ID — Sanity project ID
 *   NEXT_PUBLIC_SANITY_DATASET     — Dataset name (e.g. "production")
 *
 * Never import this module into client components — all Sanity queries
 * run server-side per stack guardrails.
 */

import { createClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url';

/**
 * Read-only Sanity client instance.
 * CDN in production for speed; bypass in development so Studio/migration
 * patches show up on hard-refresh without waiting for CDN TTL.
 */
export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: process.env.NODE_ENV === 'production',
});

/**
 * Image URL builder bound to the Sanity client.
 * Chain .width(), .height(), .format(), etc. before calling .url().
 * Never use raw Sanity CDN URLs in components.
 */
export const sanityImageBuilder = createImageUrlBuilder(sanityClient);

/**
 * Builds a Sanity image URL from an image source reference.
 *
 * @param source — Sanity image field value (asset ref or image object)
 * @returns Configured image URL builder for chaining
 */
export function urlForImage(source: SanityImageSource) {
  return sanityImageBuilder.image(source);
}
