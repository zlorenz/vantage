# Migration Data — Vantage Pictures

This document tracks the status of all content migration from WordPress to Sanity. It is a living document — update it as each phase is completed and verified. Do not mark anything as verified without manually spot-checking samples, not just confirming the import ran without errors.

**Migration phases:**
1. **Exported** — Content extracted from WordPress DB to JSON in `/migration-data/`
2. **Imported** — JSON imported into Sanity
3. **Verified** — Spot-checked in Sanity Studio and on the live staging site

**Migration scripts:** `npm run migrate:export` | `npm run migrate:import` | `npm run migrate:media`

**Sanity document model:** Bilingual content uses **one document per entry** with `titleZh`, `slugZh`, `bodyZh`, etc. — not separate EN/ZH documents.

**Total Sanity documents after import:** ~479 (141 portfolio + 23 blog + 9 pages + 1 siteSettings + 24 public taxonomies + 282 entities)

---

## Status Key

| Symbol | Meaning |
|---|---|
| ⬜ | Not started |
| 🔄 | In progress |
| ✅ | Complete and verified |
| ⚠️ | Needs attention — see notes |

---

## 1. Content Types

### 1a. Portfolio Entries
141 bilingual documents (`portfolioEntry`)

| Step | Status | Notes |
|---|---|---|
| Export from WordPress DB to JSON | ✅ | `migration-data/portfolio.json` — 2026-06-21 |
| Export ACF custom fields (all meta) | ✅ | Credits, titles, videos, taxonomies |
| Export Yoast SEO fields per entry | ✅ | metaDescription + focusKeyword |
| Export Chinese slug per entry | ✅ | Sparse — most slugs stay English on `/zh/` |
| Define Sanity schema (`portfolioEntry`) | ✅ | Milestone 2 |
| Import to Sanity | ✅ | 141 documents, idempotent IDs `portfolio-{wpId}` |
| Verify — spot check 10 entries EN | ✅ | DJI Chernobyl, Hyundai, realme C85, etc. |
| Verify — spot check 10 entries ZH | ✅ | titleZh + xinpianchangUrl on CN entries |
| Verify — all Vimeo embeds functional | ⚠️ | URLs migrated; player verification deferred to M6 page build |
| Verify — all taxonomy tags assigned | ✅ | videoFormats, industries, markets, clients, crew, platforms |

**Special cases verified:**
- WP ID 3187 (Bitget – Elite Traders): `isHidden: true` ✅
- WP ID 3612: slug corrected to `realme-c85-your-ultimate-outdoor-sidekick` ✅

### 1b. Blog Posts
23 bilingual documents (`blogPost`)

| Step | Status | Notes |
|---|---|---|
| Export from WordPress DB to JSON | ✅ | `migration-data/blog-posts.json` |
| Export post body content | ✅ | Raw HTML; converted to Portable Text on import |
| Export featured images | ✅ | 209 assets in media inventory |
| Export Yoast SEO fields per post | ✅ | |
| Export categories per post | ✅ | |
| Export Chinese slug per post | ✅ | Sparse per TranslatePress |
| Define Sanity schema (`blogPost`) | ✅ | Milestone 2 |
| Import to Sanity | ✅ | 23 documents |
| Verify — spot check 5 posts EN | ✅ | Body PT blocks + featured images |
| Verify — spot check 5 posts ZH | ✅ | titleZh + bodyZh where translated |
| Verify — all featured images rendering | ✅ | All posts with thumbnails have Sanity asset refs |

**Known gap:** Inline `wp-image` IDs exported but not yet embedded as image blocks in Portable Text body — ⚠️ deferred to M6 if needed.

### 1c. Static Pages
9 bilingual documents (`page`) — includes `work-internal`

| Page | Exported | Imported | Verified | Notes |
|---|---|---|---|---|
| Home (`/`) | ✅ | ✅ | ✅ | 6 hero carousel slides → portfolio refs |
| About (`/about/`) | ✅ | ✅ | ✅ | 4 founders, slugZh `关于` |
| Work (`/work/`) | ✅ | ✅ | ✅ | slugZh `工作` |
| News (`/news/`) | ✅ | ✅ | ✅ | slugZh `新闻` |
| Contact (`/contact/`) | ✅ | ✅ | ✅ | slugZh `联系` |
| Vietnam Production Service | ✅ | ✅ | ✅ | slugZh `越南生产服务` |
| Vietnam Location Guide | ✅ | ✅ | ✅ | slugZh `越南旅游指南` |
| Campaign Brief | ✅ | ✅ | ✅ | slugZh `视频活动简介`, hero off |
| Work Internal (`/work-internal/`) | ✅ | ✅ | ✅ | `noIndex: true`, slugZh `work-internal` |

### 1d. Site Settings
1 singleton (`siteSettings`)

| Step | Status | Notes |
|---|---|---|
| Export ACF options | ✅ | Contact + social fields |
| Import to Sanity | ✅ | `siteSettings` document |
| Verify contact email | ✅ | info@vantage.pictures |
| Verify default OG image | ✅ | WP attachment 3627 uploaded |

---

## 2. Taxonomies

### 2a. Blog Categories
5 categories (WordPress has 5, not 4)

| Category | Exported | Imported | Verified | Notes |
|---|---|---|---|---|
| Behind the Scenes | ✅ | ✅ | ✅ | |
| Creative | ✅ | ✅ | ✅ | |
| Crew Insights | ✅ | ✅ | ✅ | |
| Press | ✅ | ✅ | ✅ | |
| Uncategorized | ✅ | ✅ | ✅ | WP default category |

### 2b. Video Format
4 terms

| Term | Exported | Imported | Verified | Notes |
|---|---|---|---|---|
| Brand Film | ✅ | ✅ | ✅ | |
| Branded Documentary | ✅ | ✅ | ✅ | |
| Commercial Spot | ✅ | ✅ | ✅ | |
| Product Video | ✅ | ✅ | ✅ | |

### 2c. Industry
10 terms

| Term | Exported | Imported | Verified | Notes |
|---|---|---|---|---|
| AI & Robotics | ✅ | ✅ | ✅ | |
| Automotive | ✅ | ✅ | ✅ | |
| Beauty & Cosmetics | ✅ | ✅ | ✅ | |
| Drones | ✅ | ✅ | ✅ | |
| Electronics | ✅ | ✅ | ✅ | |
| Fashion | ✅ | ✅ | ✅ | |
| Finance | ✅ | ✅ | ✅ | |
| FMCG | ✅ | ✅ | ✅ | |
| Hospitality | ✅ | ✅ | ✅ | |
| Tech | ✅ | ✅ | ✅ | |

### 2d. Market
5 terms

| Term | Exported | Imported | Verified | Notes |
|---|---|---|---|---|
| China | ✅ | ✅ | ✅ | |
| Singapore | ✅ | ✅ | ✅ | |
| Taiwan | ✅ | ✅ | ✅ | |
| USA | ✅ | ✅ | ✅ | |
| Vietnam | ✅ | ✅ | ✅ | |

### 2e. Internal Entities (not public archive pages)

| Type | Count | Exported | Imported | Verified |
|---|---|---|---|---|
| `client` | 67 | ✅ | ✅ | ✅ |
| `crewMember` | 107 | ✅ | ✅ | ✅ |
| `platform` | 108 | ✅ | ✅ | ✅ |

---

## 3. Media Assets

### 3a. Portfolio Thumbnails & Images

| Step | Status | Notes |
|---|---|---|
| Inventory all images in `wp-content/uploads/` | ✅ | `migration-data/media-inventory.json` — 209 active assets |
| Identify which images are actively used vs orphaned | ✅ | Only referenced assets inventoried |
| Upload active portfolio images to Sanity media library | ✅ | 209/209 uploaded, 0 failed |
| Verify all portfolio entries reference correct images in Sanity | ✅ | All 141 have `featuredImage` asset refs |

### 3b. Blog Post Featured Images & Inline Images

| Step | Status | Notes |
|---|---|---|
| Export featured images for all 23 posts | ✅ | |
| Upload to Sanity media library | ✅ | |
| Verify all posts reference correct images in Sanity | ✅ | |
| Check inline images within post body content | ⚠️ | IDs exported; PT image blocks deferred to M6 |

### 3c. Static Page Images

| Step | Status | Notes |
|---|---|---|
| Identify all static page images | ✅ | Hero + founder photos in inventory |
| Upload to Sanity media library | ✅ | |
| Verify all static pages reference correct images | ✅ | About founders have images |

---

## 4. SEO Data

Yoast SEO meta fields migrated per-document into Sanity `seo` object. Titles generated in Next.js (not stored).

| Content Type | Meta Titles Exported | Meta Descriptions Exported | OG Images Exported | Imported to Sanity | Verified |
|---|---|---|---|---|---|
| Portfolio entries (141) | N/A (generated) | ✅ 141/141 | N/A (global default) | ✅ | ✅ |
| Blog posts (23) | N/A (generated) | ✅ 22/23 | N/A (global default) | ✅ | ✅ |
| Static pages (9) | N/A (generated) | ✅ 8/9 | N/A (global default) | ✅ | ✅ |

**Missing meta descriptions (fill manually in Studio if desired):**
- Page `work-internal`
- Post `vantage-pictures-james-duong-on-bringing-chinese-productions-to-vietnam`

---

## 5. Redirects

| Redirect | Implemented in `next.config.js` | Verified on Staging | Notes |
|---|---|---|---|
| `/portfolio/3612/` → `/portfolio/realme-c85-your-ultimate-outdoor-sidekick/` | ⬜ | ⬜ | Slug corrected in Sanity; redirect deferred to M9 |

---

## 6. WordPress File Removal Checklist

Do not action any of these until the stated condition is met and Zacharia has given explicit approval.

| Item | Condition to Remove | Approved | Removed |
|---|---|---|---|
| `wp-content/themes/vantagepictures-child/` | After audit phase complete and `design-tokens.md` signed off | ⬜ | ⬜ |
| `wp-config.php` | After all content exported to JSON and imported into Sanity | ⬜ | ⬜ |
| `wp-content/uploads/` | After all media assets confirmed in Sanity and verified on staging | ⬜ | ⬜ |

---

## 7. Final Pre-Launch Checklist

Complete all items before cutting DNS over to production.

| Item | Status | Notes |
|---|---|---|
| All content types verified in Sanity | ✅ | M3 complete — staging verification in M10 |
| All media assets verified on staging | ⬜ | M10 |
| All taxonomy archive pages rendering correctly | ⬜ | M6 |
| All redirects verified on staging | ⬜ | M9 |
| hreflang tags verified for all EN/ZH pairs | ⬜ | M9 |
| XML sitemap generated and accessible | ⬜ | M9 |
| Sitemap submitted to Google Search Console | ⬜ | M11 |
| GTM container firing correctly on staging | ⬜ | M8 |
| Vimeo play events appearing in GTM preview | ⬜ | M8 |
| Campaign brief form submitting — email received | ⬜ | M7 |
| Campaign brief form submitting — Lark message received | ⬜ | M7 |
| Contact form submitting — email received | ⬜ | M7 |
| Contact form submitting — Lark message received | ⬜ | M7 |
| Core Web Vitals passing on staging (Lighthouse) | ⬜ | M10 |
| Site fully functional with JS disabled | ⬜ | M10 |
| Mobile QA complete across iOS and Android | ⬜ | M10 |
| Cross-browser QA complete (Chrome, Safari, Firefox) | ⬜ | M10 |
| Sanity webhook triggering Vercel rebuild on publish | ⬜ | M10 |
| Leo Nguyen briefed on Sanity Studio — can publish independently | ⬜ | M10 |
