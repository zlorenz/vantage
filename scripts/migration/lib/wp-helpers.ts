import { query, table } from '../db';
import type { PostMeta } from './acf';

export interface WpPost {
  ID: number;
  post_title: string;
  post_name: string;
  post_content: string;
  post_excerpt: string;
  post_date: string;
  post_type: string;
}

export async function fetchPosts(
  postType: string,
  status = 'publish'
): Promise<WpPost[]> {
  return query<WpPost[]>(
    `SELECT ID, post_title, post_name, post_content, post_excerpt, post_date, post_type
     FROM ${table('posts')}
     WHERE post_type = ? AND post_status = ?
     ORDER BY ID ASC`,
    [postType, status]
  );
}

export async function fetchAllPostMeta(
  postIds: number[]
): Promise<Map<number, PostMeta>> {
  const result = new Map<number, PostMeta>();
  if (!postIds.length) return result;

  const chunkSize = 100;
  for (let i = 0; i < postIds.length; i += chunkSize) {
    const chunk = postIds.slice(i, i + chunkSize);
    const placeholders = chunk.map(() => '?').join(',');
    const rows = await query<{ post_id: number; meta_key: string; meta_value: string }[]>(
      `SELECT post_id, meta_key, meta_value FROM ${table('postmeta')}
       WHERE post_id IN (${placeholders})`,
      chunk
    );
    for (const row of rows) {
      if (!result.has(row.post_id)) result.set(row.post_id, {});
      result.get(row.post_id)![row.meta_key] = row.meta_value;
    }
  }
  return result;
}

export interface TermRef {
  termId: number;
  name: string;
  slug: string;
  taxonomy: string;
}

export async function fetchTerms(taxonomies: string[]): Promise<TermRef[]> {
  const placeholders = taxonomies.map(() => '?').join(',');
  return query<TermRef[]>(
    `SELECT t.term_id AS termId, t.name, t.slug, tt.taxonomy
     FROM ${table('terms')} t
     JOIN ${table('term_taxonomy')} tt ON t.term_id = tt.term_id
     WHERE tt.taxonomy IN (${placeholders})
     ORDER BY t.name ASC`,
    taxonomies
  );
}

export async function fetchPostTermSlugs(
  postIds: number[],
  taxonomies: string[]
): Promise<Map<number, Record<string, string[]>>> {
  const result = new Map<number, Record<string, string[]>>();
  if (!postIds.length) return result;

  const taxPlaceholders = taxonomies.map(() => '?').join(',');
  const idPlaceholders = postIds.map(() => '?').join(',');

  const rows = await query<
    { object_id: number; taxonomy: string; slug: string }[]
  >(
    `SELECT tr.object_id, tt.taxonomy, t.slug
     FROM ${table('term_relationships')} tr
     JOIN ${table('term_taxonomy')} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
     JOIN ${table('terms')} t ON tt.term_id = t.term_id
     WHERE tr.object_id IN (${idPlaceholders})
       AND tt.taxonomy IN (${taxPlaceholders})`,
    [...postIds, ...taxonomies]
  );

  for (const row of rows) {
    if (!result.has(row.object_id)) result.set(row.object_id, {});
    const map = result.get(row.object_id)!;
    if (!map[row.taxonomy]) map[row.taxonomy] = [];
    map[row.taxonomy].push(row.slug);
  }
  return result;
}

export async function fetchOptions(keys: string[]): Promise<Record<string, string>> {
  const placeholders = keys.map(() => '?').join(',');
  const rows = await query<{ option_name: string; option_value: string }[]>(
    `SELECT option_name, option_value FROM ${table('options')}
     WHERE option_name IN (${placeholders})`,
    keys
  );
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.option_name] = row.option_value;
  }
  return result;
}

/** ACF stores options as options_{field_name} */
export async function fetchAcfOptions(fieldNames: string[]): Promise<Record<string, string>> {
  const optionKeys = fieldNames.map((f) => `options_${f}`);
  const rows = await query<{ option_name: string; option_value: string }[]>(
    `SELECT option_name, option_value FROM ${table('options')}
     WHERE option_name IN (${optionKeys.map(() => '?').join(',')})`,
    optionKeys
  );
  const result: Record<string, string> = {};
  for (const row of rows) {
    const field = row.option_name.replace(/^options_/, '');
    result[field] = row.option_value;
  }
  return result;
}
