import { closePool } from '../db';
import '../config';
import { importBlogPosts } from './blog-posts';
import { importEntities } from './entities';
import { importPages } from './pages';
import { importPortfolio } from './portfolio';
import { importSiteSettings } from './site-settings';
import { importTaxonomies } from './taxonomies';
import { uploadMedia } from '../media/upload';

async function main() {
  console.log('Starting Sanity import…');

  await importTaxonomies();
  await importEntities();
  await uploadMedia();
  await importSiteSettings();
  await importPortfolio();
  await importPages();
  await importBlogPosts();

  console.log('Import complete.');
  await closePool();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
