/**
 * Uploads Vietnam gallery images from live site into Sanity + id-map.
 *
 *   npx tsx scripts/migration/patch/vietnam-gallery-images-from-live.ts
 */

import { query, table } from '../db';
import { loadIdMap, saveIdMap, setAssetRef } from '../lib/id-map';
import { getWriteClient } from '../lib/sanity-client';

const LIVE_UPLOADS_BASE = 'https://vantage.pictures/wp-content/uploads';
const GALLERY_WP_IDS = [
  80, 79, 67, 73, 68, 66, 72, 82, 74, 78, 81, 83, 69, 71, 76, 75, 77, 70, 61, 65,
  63, 2948, 62, 64,
];

async function getAttachedFile(wpId: number): Promise<string | null> {
  const rows = await query<{ meta_value: string }[]>(
    `SELECT meta_value FROM ${table('postmeta')}
     WHERE post_id = ? AND meta_key = '_wp_attached_file' LIMIT 1`,
    [wpId],
  );
  return rows[0]?.meta_value?.trim() || null;
}

function mimeFromPath(filePath: string): string {
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

async function main() {
  const client = getWriteClient();
  const idMap = loadIdMap();
  let uploaded = 0;
  let skipped = 0;

  for (const wpId of GALLERY_WP_IDS) {
    if (idMap.assets[String(wpId)]) {
      skipped += 1;
      continue;
    }

    const relativePath = await getAttachedFile(wpId);
    if (!relativePath) {
      console.warn(`No attachment path for wp ${wpId}`);
      continue;
    }

    const url = `${LIVE_UPLOADS_BASE}/${relativePath}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch ${url}: ${response.status}`);
      continue;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const asset = await client.assets.upload('image', buffer, {
      filename: relativePath.split('/').pop() ?? `wp-${wpId}.jpg`,
      contentType: response.headers.get('content-type') ?? mimeFromPath(relativePath),
    });

    setAssetRef(idMap, wpId, asset._id);
    uploaded += 1;
    console.log(`Uploaded wp ${wpId} → ${asset._id}`);
  }

  saveIdMap(idMap);
  console.log(`Vietnam gallery images: ${uploaded} uploaded, ${skipped} skipped.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
