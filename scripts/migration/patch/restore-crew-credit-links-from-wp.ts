/**
 * Restore crew-credit links from the live WordPress database into Sanity crewCredits.
 *
 * Reads anchor tags from WP portfolio credit fields, matches them to structured
 * crewCredits people by slug + role + name, and patches url / linkTitle.
 *
 * Dry-run by default:
 *   npx tsx scripts/migration/patch/restore-crew-credit-links-from-wp.ts
 *   npx tsx scripts/migration/patch/restore-crew-credit-links-from-wp.ts --apply
 */

import {
  CREW_ROLE_BY_LEGACY_FIELD,
  normalizeCreditUrl,
  type CrewCreditValue,
  type CrewPersonValue,
} from '../../../shared/crew-credits';
import { query } from '../db';
import { CREDITS_CONFIG } from '../lib/credits-config';
import { getWriteClient } from '../lib/sanity-client';
import {
  extractLinksFromHtml,
  type WpCreditLink,
} from '../audit/wp-credit-links';
import '../config';

interface WpLinkTarget {
  slug: string
  legacyField?: string
  customRole?: string
  label: string
  url: string
  linkTitle?: string
}

interface SanityDoc {
  _id: string
  title?: string
  slug: string
  crewCredits?: CrewCreditValue[]
}

function normName(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/&amp;/g, '&')
}

function linkTitleFor(label: string, title?: string): string | undefined {
  if (!title?.trim()) return undefined
  return normName(title) !== normName(label) ? title.trim() : undefined
}

async function fetchWpLinksBySlug(): Promise<Map<string, WpLinkTarget[]>> {
  const posts = await query<{ ID: number; post_name: string }[]>(
    `SELECT ID, post_name FROM wp_posts WHERE post_type = 'portfolio' AND post_status = 'publish'`,
  );

  const postIds = posts.map((p) => p.ID);
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

  const bySlug = new Map<string, WpLinkTarget[]>();

  for (const post of posts) {
    const meta = metaByPost.get(post.ID) ?? {};
    const targets: WpLinkTarget[] = [];

    for (const [, cfg] of Object.entries(CREDITS_CONFIG)) {
      for (const field of cfg.fields) {
        const val = (meta[field] ?? '').trim();
        for (const link of extractLinksFromHtml(val, {
          postId: post.ID,
          slug: post.post_name,
          dept: '',
          field,
        })) {
          const url = normalizeCreditUrl(link.href);
          if (!url) continue
          targets.push({
            slug: post.post_name,
            legacyField: field,
            label: link.label,
            url,
            linkTitle: linkTitleFor(link.label, link.title),
          })
        }
      }

      const count = Number(meta[cfg.repeater] ?? 0);
      for (let i = 0; i < count; i++) {
        const names = (meta[`${cfg.repeater}_${i}_names`] ?? '').trim();
        const role = (meta[`${cfg.repeater}_${i}_role`] ?? '').trim();
        for (const link of extractLinksFromHtml(names, {
          postId: post.ID,
          slug: post.post_name,
          dept: '',
          field: `${cfg.repeater}[${i}]`,
        })) {
          const url = normalizeCreditUrl(link.href);
          if (!url) continue
          targets.push({
            slug: post.post_name,
            customRole: role,
            label: link.label,
            url,
            linkTitle: linkTitleFor(link.label, link.title),
          })
        }
      }
    }

    bySlug.set(post.post_name, targets);
  }

  return bySlug;
}

function findCredit(
  crewCredits: CrewCreditValue[],
  target: WpLinkTarget,
): CrewCreditValue | undefined {
  if (target.legacyField) {
    const roleKey = CREW_ROLE_BY_LEGACY_FIELD.get(target.legacyField)?.role.key;
    if (!roleKey) return undefined;
    return crewCredits.find((credit) => !credit.isCustomRole && credit.roleKey === roleKey);
  }
  if (target.customRole) {
    const roleNorm = normName(target.customRole);
    return crewCredits.find(
      (credit) => credit.isCustomRole && normName(credit.role) === roleNorm,
    );
  }
  return undefined;
}

function findPerson(credit: CrewCreditValue, label: string): CrewPersonValue | undefined {
  const needle = normName(label);
  const exact = credit.people?.find((person) => normName(person.name) === needle);
  if (exact) return exact;

  // Fuzzy: WP label contained in Sanity name or vice versa (e.g. entity differences).
  return credit.people?.find((person) => {
    const name = normName(person.name);
    return name.includes(needle) || needle.includes(name);
  });
}

function applyLinkToCredits(
  crewCredits: CrewCreditValue[],
  target: WpLinkTarget,
): { credits: CrewCreditValue[]; changed: boolean; note?: string } {
  const credit = findCredit(crewCredits, target);
  if (!credit) {
    return {credits: crewCredits, changed: false, note: 'no matching credit row'}
  }

  const person = findPerson(credit, target.label);
  if (!person) {
    return {credits: crewCredits, changed: false, note: 'no matching person'}
  }

  const needsUrl = person.url !== target.url;
  const needsTitle = (person.linkTitle ?? undefined) !== (target.linkTitle ?? undefined);
  if (!needsUrl && !needsTitle) {
    return {credits: crewCredits, changed: false}
  }

  const next = crewCredits.map((row) => {
    if (row !== credit) return row
    return {
      ...row,
      people: row.people.map((p) => {
        if (p !== person) return p
        const updated: CrewPersonValue = {
          ...p,
          url: target.url,
        }
        if (target.linkTitle) updated.linkTitle = target.linkTitle
        else delete updated.linkTitle
        return updated
      }),
    }
  })

  return {credits: next, changed: true}
}

async function main() {
  const apply = process.argv.includes('--apply');
  const wpBySlug = await fetchWpLinksBySlug();
  const client = getWriteClient();

  const docs = await client.fetch<SanityDoc[]>(`
    *[_type == "portfolioEntry"]{
      _id,
      title,
      "slug": slug.current,
      crewCredits[]{
        _key,
        department,
        roleKey,
        role,
        isCustomRole,
        people[]{ _key, name, url, linkTitle }
      }
    }
  `);

  let docsChanged = 0;
  let linksPatched = 0;
  let linksSkipped = 0;
  const issues: string[] = [];

  for (const doc of docs) {
    const wpLinks = wpBySlug.get(doc.slug) ?? [];
    if (!wpLinks.length) continue;

    let crewCredits = doc.crewCredits ?? [];
    if (!crewCredits.length) {
      issues.push(`${doc.slug}: no crewCredits to patch`);
      continue;
    }

    let docChanged = false;
    for (const target of wpLinks) {
      const result = applyLinkToCredits(crewCredits, target);
      crewCredits = result.credits;
    if (result.changed) {
      docChanged = true;
      linksPatched++;
    } else if (result.note) {
        linksSkipped++;
        if (issues.length < 30) {
          issues.push(`${doc.slug} | ${target.label}: ${result.note}`);
        }
      } else {
        linksSkipped++;
      }
    }

    if (docChanged && apply) {
      await client.patch(doc._id).set({crewCredits}).commit();
      docsChanged++;
    } else if (docChanged) {
      docsChanged++;
    }
  }

  const wpTotal = [...wpBySlug.values()].reduce((n, items) => n + items.length, 0);
  console.log('\n--- Summary ---');
  console.log(`WP links scanned: ${wpTotal}`);
  console.log(`Documents ${apply ? 'updated' : 'would update'}: ${docsChanged}`);
  console.log(`Links patched: ${linksPatched}`);
  console.log(`Links unchanged/skipped: ${linksSkipped}`);
  if (issues.length) {
    console.log('\nUnresolved (first 30):');
    for (const issue of issues) console.log(`  ${issue}`);
  }
  if (!apply && linksPatched > 0) {
    console.log('\nRe-run with --apply to write patches to Sanity.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
