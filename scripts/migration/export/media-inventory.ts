import path from 'node:path';
import fs from 'node:fs';
import { PATHS } from '../config';
import { writeJson } from '../lib/fs';
import { readJson } from '../lib/fs';
import type { ExportedBlogPost } from './blog-posts';
import type { ExportedPage } from './pages';
import type { ExportedPortfolio } from './portfolio';
import type { ExportedSiteSettings } from './site-settings';
import { getAttachment, attachmentExists, type AttachmentInfo } from '../lib/attachments';

export interface MediaInventoryEntry {
  wpId: number;
  relativePath: string;
  filePath: string;
  mimeType?: string;
  alt?: string;
  exists: boolean;
  usedBy: string[];
}

export async function exportMediaInventory(): Promise<MediaInventoryEntry[]> {
  const wpIds = new Map<number, Set<string>>();

  function track(wpId: number | undefined, ref: string) {
    if (!wpId) return;
    if (!wpIds.has(wpId)) wpIds.set(wpId, new Set());
    wpIds.get(wpId)!.add(ref);
  }

  const portfolio = readJson<ExportedPortfolio[]>(
    path.join(PATHS.migrationData, 'portfolio.json')
  );
  const blogPosts = readJson<ExportedBlogPost[]>(
    path.join(PATHS.migrationData, 'blog-posts.json')
  );
  const pages = readJson<ExportedPage[]>(path.join(PATHS.migrationData, 'pages.json'));
  const siteSettings = readJson<ExportedSiteSettings>(
    path.join(PATHS.migrationData, 'site-settings.json')
  );

  for (const p of portfolio) {
    track(p.featuredImageWpId, `portfolio:${p.wpId}`);
  }
  for (const p of blogPosts) {
    track(p.featuredImageWpId, `blogPost:${p.wpId}`);
    for (const id of p.inlineImageWpIds) track(id, `blogPost:${p.wpId}:inline`);
  }
  for (const p of pages) {
    track(p.featuredImageWpId, `page:${p.slug}`);
    for (const f of p.founders ?? []) track(f.imageWpId, `page:${p.slug}:founder`);
  }
  track(siteSettings.defaultOgImageWpId, 'siteSettings:defaultOgImage');

  const inventory: MediaInventoryEntry[] = [];

  for (const [wpId, usedBy] of wpIds) {
    const info = await getAttachment(wpId);
    if (!info) continue;
    inventory.push({
      wpId,
      relativePath: info.relativePath,
      filePath: info.filePath,
      mimeType: info.mimeType,
      alt: info.alt,
      exists: attachmentExists(info),
      usedBy: [...usedBy],
    });
  }

  writeJson(path.join(PATHS.migrationData, 'media-inventory.json'), inventory);
  return inventory;
}
