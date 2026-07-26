import type { PostMeta } from './acf';

export interface YoastExport {
  metaDescription?: string;
}

export function extractYoast(meta: PostMeta): YoastExport {
  const metaDescription = (meta['_yoast_wpseo_metadesc'] ?? '').trim() || undefined;
  return { metaDescription };
}

export async function extractYoastZh(
  metaDescription: string | undefined,
  translate: (s: string) => Promise<string | undefined>
): Promise<{ metaDescriptionZh?: string }> {
  if (!metaDescription) return {};
  const metaDescriptionZh = await translate(metaDescription);
  return metaDescriptionZh ? { metaDescriptionZh } : {};
}
