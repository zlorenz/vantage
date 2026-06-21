/**
 * Temporary Sanity connection test route.
 *
 * Queries Sanity for a count of all documents and returns the result as JSON.
 * Used to verify the client configuration after Studio setup.
 * Remove once connection is confirmed and schemas are populated.
 */

import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';

export async function GET() {
  try {
    const count = await sanityClient.fetch<number>(
      'count(*[_type != "sanity.imageAsset" && _type != "sanity.fileAsset"])'
    );

    return NextResponse.json({
      ok: true,
      documentCount: count,
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
