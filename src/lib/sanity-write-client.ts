/**
 * Shared Sanity write client for server-side mutations (trash purge, brief uploads, etc.).
 * Requires SANITY_API_WRITE_TOKEN (or SANITY_API_TOKEN) — never import from client components.
 */

import {createClient, type SanityClient} from '@sanity/client'

export function getSanityWriteClient(): SanityClient {
  const token =
    process.env.SANITY_API_WRITE_TOKEN ?? process.env.SANITY_API_TOKEN ?? ''
  if (!token) {
    throw new Error('SANITY_API_WRITE_TOKEN is required for Sanity write operations')
  }
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
    apiVersion: '2025-02-19',
    token,
    useCdn: false,
    perspective: 'raw',
  })
}
