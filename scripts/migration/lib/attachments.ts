import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from '../config';
import { query, table } from '../db';

export interface AttachmentInfo {
  wpId: number;
  filePath: string;
  relativePath: string;
  mimeType?: string;
  alt?: string;
}

const attachmentCache = new Map<number, AttachmentInfo | null>();

export async function getAttachment(wpId: number): Promise<AttachmentInfo | null> {
  if (attachmentCache.has(wpId)) return attachmentCache.get(wpId) ?? null;
  if (!wpId) {
    attachmentCache.set(wpId, null);
    return null;
  }

  const rows = await query<
    { ID: number; guid: string; post_mime_type: string }[]
  >(
    `SELECT ID, guid, post_mime_type FROM ${table('posts')}
     WHERE ID = ? AND post_type = 'attachment' LIMIT 1`,
    [wpId]
  );

  if (!rows.length) {
    attachmentCache.set(wpId, null);
    return null;
  }

  const metaRows = await query<{ meta_key: string; meta_value: string }[]>(
    `SELECT meta_key, meta_value FROM ${table('postmeta')}
     WHERE post_id = ? AND meta_key IN ('_wp_attached_file', '_wp_attachment_metadata')`,
    [wpId]
  );

  const meta: Record<string, string> = {};
  for (const row of metaRows) meta[row.meta_key] = row.meta_value;

  const relativePath = meta['_wp_attached_file'] ?? '';
  const filePath = relativePath
    ? path.join(PATHS.uploads, relativePath)
    : guessPathFromGuid(rows[0].guid);

  const altRows = await query<{ meta_value: string }[]>(
    `SELECT meta_value FROM ${table('postmeta')}
     WHERE post_id = ? AND meta_key = '_wp_attachment_image_alt' LIMIT 1`,
    [wpId]
  );

  const info: AttachmentInfo = {
    wpId,
    filePath,
    relativePath,
    mimeType: rows[0].post_mime_type,
    alt: altRows[0]?.meta_value?.trim() || undefined,
  };

  attachmentCache.set(wpId, info);
  return info;
}

function guessPathFromGuid(guid: string): string {
  const uploadsIdx = guid.indexOf('/wp-content/uploads/');
  if (uploadsIdx === -1) return '';
  const relative = guid.slice(uploadsIdx + '/wp-content/uploads/'.length);
  return path.join(PATHS.uploads, relative);
}

export function attachmentExists(info: AttachmentInfo | null): boolean {
  return Boolean(info?.filePath && fs.existsSync(info.filePath));
}

export function extractWpImageIds(html: string): number[] {
  const ids = new Set<number>();
  const classPattern = /wp-image-(\d+)/g;
  let match: RegExpExecArray | null;
  while ((match = classPattern.exec(html)) !== null) {
    ids.add(Number(match[1]));
  }
  return [...ids];
}
