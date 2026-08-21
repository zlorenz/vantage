/**
 * One-time: delete translatedPhrase docs that map video embed URLs
 * (Vimeo/YouTube → Xinpianchang). Those pairs are hosting choices, not
 * translations, and must not live in the phrase book.
 *
 * Dry-run (default):
 *   npx tsx scripts/migration/patch/purge-embed-url-phrases.ts
 *
 * Apply (after review):
 *   npx tsx scripts/migration/patch/purge-embed-url-phrases.ts --apply
 *
 * --apply requires SANITY_API_WRITE_TOKEN (or SANITY_API_TOKEN) in .env.local.
 */

import {createClient} from '@sanity/client';
import {SANITY} from '../config';
import {getWriteClient} from '../lib/sanity-client';

const APPLY = process.argv.includes('--apply');

const EMBED_HOST_FILTER = `*[_type == "translatedPhrase" && (
  en match "*vimeo.com*" || en match "*youtube.com*" || en match "*youtu.be*" || en match "*xinpianchang.com*" ||
  zh match "*vimeo.com*" || zh match "*youtube.com*" || zh match "*youtu.be*" || zh match "*xinpianchang.com*"
)]{_id, en, zh} | order(en asc)`;

function getReadClient() {
  return createClient({
    projectId: SANITY.projectId,
    dataset: SANITY.dataset,
    apiVersion: SANITY.apiVersion,
    token: SANITY.token || undefined,
    useCdn: false,
  });
}

async function main() {
  const client = APPLY ? getWriteClient() : getReadClient();
  const rows = await client.fetch<{_id: string; en?: string; zh?: string}[]>(
    EMBED_HOST_FILTER,
  );

  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`Dataset: ${SANITY.dataset}`);
  console.log(`Embed-URL phrase docs: ${rows.length}\n`);

  for (const row of rows) {
    const id = row._id.replace(/^drafts\./, '');
    console.log(`${APPLY ? 'DELETE' : 'WOULD DELETE'} ${id}`);
    console.log(`  en: ${row.en ?? ''}`);
    console.log(`  zh: ${row.zh ?? ''}`);

    if (APPLY) {
      try {
        await client.delete(id);
      } catch {
        // missing published
      }
      try {
        await client.delete(`drafts.${id}`);
      } catch {
        // missing draft
      }
    }
  }

  console.log(
    `\nDone. ${APPLY ? 'Deleted' : 'Would delete'} ${rows.length} phrase doc(s).`,
  );
  if (!APPLY) {
    console.log('Re-run with --apply to delete from Sanity.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
