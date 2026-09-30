/**
 * Upload Dropbox project key-visual stills onto matching portfolioEntry docs.
 *
 * Appends only. Existing keyVisuals (including DJI Robomaster S1) stay in place.
 * Folders with no portfolio document are not listed here.
 *
 *   npx tsx scripts/migration/patch/upload-project-key-visuals.ts
 *   npx tsx scripts/migration/patch/upload-project-key-visuals.ts --apply
 *
 * Requires SANITY_API_WRITE_TOKEN or SANITY_API_TOKEN in .env.local.
 */

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { tagAssetAsKeyVisual } from '../../../shared/media-tags';
import {
  KEY_VISUAL_VIDEO_FORMAT_ID,
  ensureKeyVisualVideoFormat,
  isKeyVisualVideoFormatId,
} from '../../../shared/video-formats';
import '../config';
import { getWriteClient } from '../lib/sanity-client';

const SOURCE_ROOT = path.resolve(
  process.cwd(),
  '-temp-dropbox/project-key-visuals',
);

const JOBS: Array<{ folder: string; id: string }> = [
  { folder: 'Asmoke', id: 'portfolio-3256' },
  { folder: 'Gendome Home 3000', id: 'portfolio-3062' },
  { folder: 'Govee For Every Mood of Home', id: 'portfolio-4522' },
  { folder: 'Govee Halloween', id: 'portfolio-3519' },
  { folder: 'Govee Unstoppable Fun', id: 'portfolio-4a40079dd2' },
  { folder: 'Jackery Explorer 5000', id: 'portfolio-3282' },
  { folder: 'Mammotion Perimeter-Wire-Free Robot Lawn Mower', id: 'portfolio-3184' },
  { folder: 'Mammotion Luba 2 AWD Pro', id: 'portfolio-3451' },
  { folder: 'Mammotion Luba 3 AWD', id: 'portfolio-4449' },
  { folder: 'Mammotion Yuka Mini 2.0', id: 'portfolio-3619' },
  { folder: 'Parksible', id: 'portfolio-9fa07532e8' },
  { folder: 'The Westin Busy Resting', id: 'portfolio-3464' },
  { folder: 'Ulike', id: 'portfolio-3502' },
  { folder: 'Valerion VisionMax', id: 'portfolio-3275' },
  { folder: 'Vinamilk Probi', id: 'portfolio-3287' },
];

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

type ExistingVisual = {
  ref?: string;
  hash?: string;
  filename?: string;
};

type TargetDoc = {
  _id: string;
  title?: string;
  keyVisuals?: ExistingVisual[];
  videoFormats?: Array<{ _ref?: string } | null>;
};

function applyMode(): boolean {
  return process.argv.includes('--apply');
}

function newKey(): string {
  return (
    globalThis.crypto?.randomUUID?.().replace(/-/g, '').slice(0, 12) ??
    `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
  );
}

function mimeFromFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
}

function listImages(folder: string): string[] {
  const dir = path.join(SOURCE_ROOT, folder);
  if (!fs.existsSync(dir)) {
    throw new Error(`Missing source folder: ${dir}`);
  }
  return fs
    .readdirSync(dir)
    .filter((name) => {
      if (name.startsWith('.')) return false;
      return IMAGE_EXT.has(path.extname(name).toLowerCase());
    })
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

async function main() {
  const apply = applyMode();
  const client = getWriteClient();
  if (apply) {
    await ensureKeyVisualVideoFormat(client);
  }

  let uploaded = 0;
  let reused = 0;
  let skipped = 0;
  let appended = 0;

  for (const job of JOBS) {
    const files = listImages(job.folder);
    const doc = await client.fetch<TargetDoc | null>(
      `*[_id == $id][0]{
        _id,
        title,
        keyVisuals[]{
          "ref": asset._ref,
          "hash": asset->sha1hash,
          "filename": asset->originalFilename
        },
        videoFormats
      }`,
      { id: job.id },
    );

    if (!doc?._id) {
      throw new Error(`Portfolio document not found: ${job.id} (${job.folder})`);
    }

    const existingHashes = new Set(
      (doc.keyVisuals ?? [])
        .map((item) => item.hash)
        .filter((hash): hash is string => typeof hash === 'string' && hash.length > 0),
    );
    const existingNames = new Set(
      (doc.keyVisuals ?? [])
        .map((item) => item.filename)
        .filter((name): name is string => typeof name === 'string' && name.length > 0),
    );

    console.log(
      `\n${job.folder} → ${doc.title} (${doc._id})  existing=${doc.keyVisuals?.length ?? 0}  files=${files.length}`,
    );

    const toAppend: Array<{
      _key: string;
      _type: 'image';
      asset: { _type: 'reference'; _ref: string };
    }> = [];

    for (const filename of files) {
      const filePath = path.join(SOURCE_ROOT, job.folder, filename);
      const buffer = fs.readFileSync(filePath);
      const hash = createHash('sha1').update(buffer).digest('hex');

      if (existingHashes.has(hash) || existingNames.has(filename)) {
        skipped += 1;
        console.log(`  skip  ${filename}`);
        continue;
      }

      if (!apply) {
        appended += 1;
        console.log(`  plan  ${filename}  ${(buffer.length / 1024 / 1024).toFixed(1)} MB`);
        continue;
      }

      const existingAssetId = await client.fetch<string | null>(
        `*[_type == "sanity.imageAsset" && sha1hash == $hash][0]._id`,
        { hash },
      );

      let assetId = existingAssetId;
      if (assetId) {
        reused += 1;
        console.log(`  reuse ${filename} → ${assetId}`);
      } else {
        const asset = await client.assets.upload('image', buffer, {
          filename,
          contentType: mimeFromFilename(filename),
        });
        assetId = asset._id;
        uploaded += 1;
        console.log(`  upload ${filename} → ${assetId}`);
      }

      await tagAssetAsKeyVisual(client, assetId);
      existingHashes.add(hash);
      existingNames.add(filename);
      toAppend.push({
        _key: newKey(),
        _type: 'image',
        asset: { _type: 'reference', _ref: assetId },
      });
    }

    if (!apply) continue;

    const hasKeyVisualFormat = (doc.videoFormats ?? []).some((item) =>
      isKeyVisualVideoFormatId(item?._ref),
    );
    const formatToAppend = hasKeyVisualFormat
      ? []
      : [
          {
            _key: newKey(),
            _type: 'reference' as const,
            _ref: KEY_VISUAL_VIDEO_FORMAT_ID,
          },
        ];

    if (toAppend.length === 0 && formatToAppend.length === 0) {
      console.log('  nothing to patch');
      continue;
    }

    // append() inserts after `field[-1]`, which is a no-op when the array is
    // missing or empty. These galleries start empty, so write the list with set().
    const existingCount = doc.keyVisuals?.length ?? 0;
    let patch = client.patch(doc._id);
    if (toAppend.length > 0) {
      patch =
        existingCount === 0
          ? patch.set({ keyVisuals: toAppend })
          : patch.append('keyVisuals', toAppend);
    }
    if (formatToAppend.length > 0) {
      patch = patch.setIfMissing({ videoFormats: [] }).append('videoFormats', formatToAppend);
    }
    await patch.commit({ autoGenerateArrayKeys: false });
    appended += toAppend.length;
    console.log(
      `  patched +${toAppend.length} image(s)` +
        (formatToAppend.length > 0 ? ', added Key Visual format' : ''),
    );
  }

  console.log(
    `\n${apply ? 'Applied' : 'Dry run'}: uploaded=${uploaded} reused=${reused} skipped=${skipped} ${apply ? 'appended' : 'planned'}=${appended}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
