/** Deterministic Sanity document IDs for idempotent imports. */

export function portfolioId(wpId: number): string {
  return `portfolio-${wpId}`;
}

export function blogPostId(wpId: number): string {
  return `blogPost-${wpId}`;
}

export function pageId(slug: string): string {
  return `page-${slug}`;
}

export function categoryId(slug: string): string {
  return `category-${slug}`;
}

export function videoFormatId(slug: string): string {
  return `videoFormat-${slug}`;
}

export function industryId(slug: string): string {
  return `industry-${slug}`;
}

export function marketId(slug: string): string {
  return `market-${slug}`;
}

export function clientId(slug: string): string {
  return `client-${slug}`;
}

export function crewMemberId(role: string, slug: string): string {
  return `crew-${role}-${slug}`;
}

export function platformId(slug: string): string {
  return `platform-${slug}`;
}

export const SITE_SETTINGS_ID = 'siteSettings';
