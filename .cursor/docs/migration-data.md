# Migration Data — Vantage Pictures

This document tracks the status of all content migration from WordPress to Sanity. It is a living document — update it as each phase is completed and verified. Do not mark anything as verified without manually spot-checking samples, not just confirming the import ran without errors.

**Migration phases:**
1. **Exported** — Content extracted from WordPress DB to JSON in `/migration-data/`
2. **Imported** — JSON imported into Sanity
3. **Verified** — Spot-checked in Sanity Studio and on the live staging site

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
141 entries × 2 languages = 282 total documents in Sanity

| Step | Status | Notes |
|---|---|---|
| Export from WordPress DB to JSON | ⬜ | |
| Export ACF custom fields (all meta) | ⬜ | |
| Export Yoast SEO fields per entry | ⬜ | |
| Export Chinese slug per entry | ⬜ | |
| Define Sanity schema (`portfolioEntry`) | ⬜ | |
| Import to Sanity | ⬜ | |
| Verify — spot check 10 entries EN | ⬜ | |
| Verify — spot check 10 entries ZH | ⬜ | |
| Verify — all Vimeo embeds functional | ⬜ | |
| Verify — all taxonomy tags assigned | ⬜ | |

### 1b. Blog Posts
23 posts × 2 languages = 46 total documents in Sanity

| Step | Status | Notes |
|---|---|---|
| Export from WordPress DB to JSON | ⬜ | |
| Export post body content | ⬜ | |
| Export featured images | ⬜ | |
| Export Yoast SEO fields per post | ⬜ | |
| Export categories per post | ⬜ | |
| Export Chinese slug per post | ⬜ | |
| Define Sanity schema (`blogPost`) | ⬜ | |
| Import to Sanity | ⬜ | |
| Verify — spot check 5 posts EN | ⬜ | |
| Verify — spot check 5 posts ZH | ⬜ | |
| Verify — all featured images rendering | ⬜ | |

### 1c. Static Pages
8 pages × 2 languages = 16 total documents in Sanity

| Page | Exported | Imported | Verified | Notes |
|---|---|---|---|---|
| Home (`/`) | ⬜ | ⬜ | ⬜ | |
| About (`/about/`) | ⬜ | ⬜ | ⬜ | |
| Work (`/work/`) | ⬜ | ⬜ | ⬜ | |
| News (`/news/`) | ⬜ | ⬜ | ⬜ | |
| Contact (`/contact/`) | ⬜ | ⬜ | ⬜ | |
| Vietnam Production Service (`/vietnam-production-service/`) | ⬜ | ⬜ | ⬜ | |
| Vietnam Location Guide (`/vietnam-location-guide/`) | ⬜ | ⬜ | ⬜ | |
| Campaign Brief (`/video-campaign-brief/`) | ⬜ | ⬜ | ⬜ | |

---

## 2. Taxonomies

### 2a. Blog Categories
4 categories × 2 languages

| Category | Exported | Imported | Verified | Notes |
|---|---|---|---|---|
| Behind the Scenes | ⬜ | ⬜ | ⬜ | |
| Creative | ⬜ | ⬜ | ⬜ | |
| Crew Insights | ⬜ | ⬜ | ⬜ | |
| Press | ⬜ | ⬜ | ⬜ | |

### 2b. Video Format
4 terms × 2 languages

| Term | Exported | Imported | Verified | Notes |
|---|---|---|---|---|
| Brand Film | ⬜ | ⬜ | ⬜ | |
| Branded Documentary | ⬜ | ⬜ | ⬜ | |
| Commercial Spot | ⬜ | ⬜ | ⬜ | |
| Product Video | ⬜ | ⬜ | ⬜ | |

### 2c. Industry
10 terms × 2 languages

| Term | Exported | Imported | Verified | Notes |
|---|---|---|---|---|
| AI & Robotics | ⬜ | ⬜ | ⬜ | |
| Automotive | ⬜ | ⬜ | ⬜ | |
| Beauty & Cosmetics | ⬜ | ⬜ | ⬜ | |
| Drones | ⬜ | ⬜ | ⬜ | |
| Electronics | ⬜ | ⬜ | ⬜ | |
| Fashion | ⬜ | ⬜ | ⬜ | |
| Finance | ⬜ | ⬜ | ⬜ | |
| FMCG | ⬜ | ⬜ | ⬜ | |
| Hospitality | ⬜ | ⬜ | ⬜ | |
| Tech | ⬜ | ⬜ | ⬜ | |

### 2d. Market
5 terms × 2 languages

| Term | Exported | Imported | Verified | Notes |
|---|---|---|---|---|
| China | ⬜ | ⬜ | ⬜ | |
| Singapore | ⬜ | ⬜ | ⬜ | |
| Taiwan | ⬜ | ⬜ | ⬜ | |
| USA | ⬜ | ⬜ | ⬜ | |
| Vietnam | ⬜ | ⬜ | ⬜ | |

---

## 3. Media Assets

### 3a. Portfolio Thumbnails & Images
One thumbnail per portfolio entry minimum. Some entries have multiple images.

| Step | Status | Notes |
|---|---|---|
| Inventory all images in `wp-content/uploads/` | ⬜ | |
| Identify which images are actively used vs orphaned | ⬜ | |
| Upload active portfolio images to Sanity media library | ⬜ | |
| Verify all portfolio entries reference correct images in Sanity | ⬜ | |

### 3b. Blog Post Featured Images & Inline Images

| Step | Status | Notes |
|---|---|---|
| Export featured images for all 23 posts | ⬜ | |
| Upload to Sanity media library | ⬜ | |
| Verify all posts reference correct images in Sanity | ⬜ | |
| Check inline images within post body content | ⬜ | |

### 3c. Static Page Images
Includes hero images, team photos, Vietnam service page gallery (25 images noted in sitemap).

| Step | Status | Notes |
|---|---|---|
| Identify all static page images | ⬜ | |
| Upload to Sanity media library | ⬜ | |
| Verify all static pages reference correct images | ⬜ | |

---

## 4. SEO Data

Yoast SEO meta fields must be migrated per-document into Sanity. These are stored in `wp_postmeta` under `_yoast_wpseo_title` and `_yoast_wpseo_metadesc`.

| Content Type | Meta Titles Exported | Meta Descriptions Exported | OG Images Exported | Imported to Sanity | Verified |
|---|---|---|---|---|---|
| Portfolio entries (141) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Blog posts (23) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Static pages (8) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

---

## 5. Redirects

| Redirect | Implemented in `next.config.js` | Verified on Staging | Notes |
|---|---|---|---|
| `/portfolio/3612/` → `/portfolio/realme-c85-your-ultimate-outdoor-sidekick/` | ⬜ | ⬜ | Slug corrected 2026-06-21 |

Add additional redirects to this table if any URL changes are made during the build.

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
| All content types verified in Sanity | ⬜ | |
| All media assets verified on staging | ⬜ | |
| All taxonomy archive pages rendering correctly | ⬜ | |
| All redirects verified on staging | ⬜ | |
| hreflang tags verified for all EN/ZH pairs | ⬜ | |
| XML sitemap generated and accessible | ⬜ | |
| Sitemap submitted to Google Search Console | ⬜ | |
| GTM container firing correctly on staging | ⬜ | |
| Vimeo play events appearing in GTM preview | ⬜ | |
| Campaign brief form submitting — email received | ⬜ | |
| Campaign brief form submitting — Lark message received | ⬜ | |
| Contact form submitting — email received | ⬜ | |
| Contact form submitting — Lark message received | ⬜ | |
| Core Web Vitals passing on staging (Lighthouse) | ⬜ | |
| Site fully functional with JS disabled | ⬜ | |
| Mobile QA complete across iOS and Android | ⬜ | |
| Cross-browser QA complete (Chrome, Safari, Firefox) | ⬜ | |
| Sanity webhook triggering Vercel rebuild on publish | ⬜ | |
| Leo Nguyen briefed on Sanity Studio — can publish independently | ⬜ | |