import path from 'node:path';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

export const WP_DB = {
  host: process.env.WP_DB_HOST ?? '127.0.0.1',
  port: Number(process.env.WP_DB_PORT ?? 8889),
  database: process.env.WP_DB_NAME ?? 'vantage_local',
  user: process.env.WP_DB_USER ?? 'root',
  password: process.env.WP_DB_PASSWORD ?? 'root',
};

export const SANITY = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '7oesp86l',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  token:
    process.env.SANITY_API_WRITE_TOKEN ??
    process.env.SANITY_API_TOKEN ??
    '',
  apiVersion: '2024-01-01',
};

export const PATHS = {
  root: process.cwd(),
  uploads: path.join(process.cwd(), 'wp-content', 'uploads'),
  migrationData: path.join(process.cwd(), 'migration-data'),
  idMap: path.join(process.cwd(), 'migration-data', 'id-map.json'),
};

export const WP_TABLE_PREFIX = 'wp_';

export const HIDDEN_PORTFOLIO_WP_ID = 3187;
export const SLUG_FIX_PORTFOLIO_WP_ID = 3612;
export const SLUG_FIX_PORTFOLIO_SLUG = 'realme-c85-your-ultimate-outdoor-sidekick';
export const DEFAULT_OG_IMAGE_WP_ID = 3627;
export const HOME_PAGE_WP_ID = 3747;
