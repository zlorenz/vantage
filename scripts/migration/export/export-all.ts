import path from 'node:path';
import { HIDDEN_PORTFOLIO_WP_ID, PATHS } from '../config';
import { closePool } from '../db';
import '../config';
import { writeJson } from '../lib/fs';
import { exportBlogPosts } from './blog-posts';
import { exportEntities } from './entities';
import { exportMediaInventory } from './media-inventory';
import { exportPages } from './pages';
import { exportPortfolio } from './portfolio';
import { exportSiteSettings } from './site-settings';
import { exportTaxonomies } from './taxonomies';

async function main() {
  console.log('Starting WordPress export…');

  const taxonomies = await exportTaxonomies();
  const entities = await exportEntities();
  const siteSettings = await exportSiteSettings();
  const portfolio = await exportPortfolio();
  const blogPosts = await exportBlogPosts();
  const pages = await exportPages();
  const mediaInventory = await exportMediaInventory();

  const warnings: string[] = [];
  const errors: string[] = [];

  if (portfolio.length !== 141) errors.push(`Expected 141 portfolio, got ${portfolio.length}`);
  if (blogPosts.length !== 23) errors.push(`Expected 23 blog posts, got ${blogPosts.length}`);
  if (pages.length !== 9) errors.push(`Expected 9 pages, got ${pages.length}`);

  const hidden = portfolio.filter((p) => p.isHidden);
  if (hidden.length !== 1 || hidden[0].wpId !== HIDDEN_PORTFOLIO_WP_ID) {
    errors.push(`Expected exactly 1 hidden portfolio (3187), got ${hidden.length}`);
  }

  for (const p of portfolio) {
    if (!p.thumbTitle) warnings.push(`Portfolio ${p.wpId} missing thumbTitle`);
    if (!p.featuredImageWpId) warnings.push(`Portfolio ${p.wpId} missing featured image`);
    if (!p.vimeoUrl || p.vimeoUrl.includes('placeholder')) {
      if (!p.xinpianchangUrl) warnings.push(`Portfolio ${p.wpId} missing video URL`);
    }
  }

  const meta = {
    exportedAt: new Date().toISOString(),
    counts: {
      portfolio: portfolio.length,
      blogPosts: blogPosts.length,
      pages: pages.length,
      categories: taxonomies.categories.length,
      videoFormats: taxonomies.videoFormats.length,
      industries: taxonomies.industries.length,
      markets: taxonomies.markets.length,
      clients: entities.clients.length,
      crewMembers: entities.crewMembers.length,
      platforms: entities.platforms.length,
      mediaAssets: mediaInventory.length,
      mediaMissing: mediaInventory.filter((m) => !m.exists).length,
    },
    warnings,
    errors,
  };

  writeJson(path.join(PATHS.migrationData, 'meta.json'), meta);

  console.log('Export complete:', meta.counts);
  if (warnings.length) console.warn('Warnings:', warnings.length);
  if (errors.length) {
    console.error('Errors:', errors);
    process.exit(1);
  }

  await closePool();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
