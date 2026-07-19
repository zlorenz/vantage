/**
 * Re-export portfolio + pages only (faster than full migrate:export after TRP changes).
 *
 * Usage: npm run migrate:export:content
 */

import { closePool } from '../db';
import '../config';
import { exportPages } from './pages';
import { exportPortfolio } from './portfolio';

async function main() {
  console.log('Exporting portfolio and pages…');
  const portfolio = await exportPortfolio();
  const pages = await exportPages();
  console.log(`Done: ${portfolio.length} portfolio, ${pages.length} pages`);
  await closePool();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
