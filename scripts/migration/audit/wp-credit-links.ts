/**
 * Audit anchor links in WordPress portfolio credit fields.
 *   npx tsx scripts/migration/audit/wp-credit-links.ts
 */

import { query } from '../db';
import { CREDITS_CONFIG } from '../lib/credits-config';
import { normalizeCreditUrl } from '../../../shared/crew-credits';
import '../config';

export interface WpCreditLink {
  postId: number;
  slug: string;
  dept: string;
  field: string;
  href: string;
  label: string;
  title?: string;
  target?: string;
  rel?: string;
}

const anchorRe = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
const attrRe = /([a-z-]+)\s*=\s*("([^"]*)"|'([^']*)')/gi;

function parseAttrs(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  let match: RegExpExecArray | null;
  while ((match = attrRe.exec(raw)) !== null) {
    attrs[match[1].toLowerCase()] = (match[3] ?? match[4] ?? '').trim();
  }
  return attrs;
}

export function extractLinksFromHtml(
  html: string,
  ctx: Omit<WpCreditLink, 'href' | 'label' | 'title' | 'target' | 'rel'>,
): WpCreditLink[] {
  const links: WpCreditLink[] = [];
  if (!html.includes('<a')) return links;

  let match: RegExpExecArray | null;
  const re = new RegExp(anchorRe.source, anchorRe.flags);
  while ((match = re.exec(html)) !== null) {
    const attrs = parseAttrs(match[1]);
    const label = match[2].replace(/<[^>]+>/g, '').trim();
    if (!label || !attrs.href) continue;
    links.push({
      ...ctx,
      href: attrs.href,
      label,
      title: attrs.title,
      target: attrs.target,
      rel: attrs.rel,
    });
  }
  return links;
}

export { normalizeCreditUrl };

async function main() {
  const allFields = Object.entries(CREDITS_CONFIG).flatMap(([dept, cfg]) =>
    cfg.fields.map((field) => ({ dept, field, repeater: cfg.repeater })),
  );

  const posts = await query<{ ID: number; post_name: string; post_title: string }[]>(
    `SELECT ID, post_name, post_title FROM wp_posts WHERE post_type = 'portfolio' AND post_status = 'publish' ORDER BY ID`,
  );

  const postIds = posts.map((p) => p.ID);
  if (!postIds.length) {
    console.log('No portfolio posts found.');
    return;
  }

  const placeholders = postIds.map(() => '?').join(',');
  const metaRows = await query<{ post_id: number; meta_key: string; meta_value: string }[]>(
    `SELECT post_id, meta_key, meta_value FROM wp_postmeta WHERE post_id IN (${placeholders}) AND meta_key NOT LIKE '\\_%'`,
    postIds,
  );

  const metaByPost = new Map<number, Record<string, string>>();
  for (const row of metaRows) {
    if (!metaByPost.has(row.post_id)) metaByPost.set(row.post_id, {});
    metaByPost.get(row.post_id)![row.meta_key] = row.meta_value ?? '';
  }

  const links: WpCreditLink[] = [];

  for (const post of posts) {
    const meta = metaByPost.get(post.ID) ?? {};
    const ctx = { postId: post.ID, slug: post.post_name, dept: '', field: '' };

    for (const { dept, field } of allFields) {
      const val = (meta[field] ?? '').trim();
      links.push(
        ...extractLinksFromHtml(val, { ...ctx, dept, field }),
      );
    }

    const repeaters = new Set(allFields.map((f) => f.repeater));
    for (const repeater of repeaters) {
      const dept = allFields.find((f) => f.repeater === repeater)?.dept ?? '';
      const count = Number(meta[repeater] ?? 0);
      for (let i = 0; i < count; i++) {
        const names = (meta[`${repeater}_${i}_names`] ?? '').trim();
        links.push(
          ...extractLinksFromHtml(names, {
            ...ctx,
            dept,
            field: `${repeater}[${i}]`,
          }),
        );
      }
    }
  }

  console.log(`WP portfolio posts: ${posts.length}`);
  console.log(`Total anchor links in credits: ${links.length}`);
  console.log(`Unique hrefs: ${new Set(links.map((l) => l.href)).size}`);
  console.log(`With title attr: ${links.filter((l) => l.title).length}`);
  console.log(`With target=_blank: ${links.filter((l) => l.target === '_blank').length}`);
  console.log(`With noopener in rel: ${links.filter((l) => l.rel?.includes('noopener')).length}`);

  console.log('\nSample links:');
  for (const link of links.slice(0, 20)) {
    const title = link.title ? ` title=${JSON.stringify(link.title)}` : '';
    console.log(
      `  ${link.slug} | ${link.field} | ${link.label} -> ${link.href.slice(0, 70)}${title}`,
    );
  }
}

const isAuditCli = process.argv[1]?.includes('wp-credit-links');
if (isAuditCli) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}