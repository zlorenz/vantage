import fs from 'node:fs';
import path from 'node:path';
import '../config';
import { PATHS } from '../config';
import type { MediaInventoryEntry } from '../export/media-inventory';
import { readJson } from '../lib/fs';
import { loadIdMap, saveIdMap, setAssetRef } from '../lib/id-map';
import { getWriteClient } from '../lib/sanity-client';

const UPLOAD_DELAY_MS = 100;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function uploadMedia(): Promise<{ uploaded: number; skipped: number; failed: number }> {
  const inventory = readJson<MediaInventoryEntry[]>(
    path.join(PATHS.migrationData, 'media-inventory.json')
  );
  const client = getWriteClient();
  const idMap = loadIdMap();

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const entry of inventory) {
    const existing = idMap.assets[String(entry.wpId)];
    if (existing) {
      skipped++;
      continue;
    }

    if (!entry.exists || !fs.existsSync(entry.filePath)) {
      console.warn(`Missing file for wp attachment ${entry.wpId}: ${entry.filePath}`);
      failed++;
      continue;
    }

    try {
      const buffer = fs.readFileSync(entry.filePath);
      const filename = path.basename(entry.filePath);
      const asset = await client.assets.upload('image', buffer, {
        filename,
        contentType: entry.mimeType || undefined,
      });
      setAssetRef(idMap, entry.wpId, asset._id);
      uploaded++;
      if (uploaded % 25 === 0) {
        saveIdMap(idMap);
        console.log(`Uploaded ${uploaded} assets…`);
      }
      await sleep(UPLOAD_DELAY_MS);
    } catch (err) {
      console.error(`Failed to upload wp ${entry.wpId}:`, err);
      failed++;
    }
  }

  saveIdMap(idMap);
  console.log(`Media upload complete: ${uploaded} uploaded, ${skipped} skipped, ${failed} failed`);
  return { uploaded, skipped, failed };
}
