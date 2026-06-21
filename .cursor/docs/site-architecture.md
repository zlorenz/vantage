# Vantage Pictures — Site Architecture

## Overview

The site is fully bilingual. Every English URL has a Chinese counterpart under `/zh/`. This document maps the English canonical URLs. Chinese equivalents are noted where the slug pattern differs from a simple `/zh/` prefix.

Two-language support must be built into every route, component, and content schema from day one. There is no "add it later" — the bilingual structure is load-bearing.

**Exception:** `/work-internal/` is English-only with no `/zh/` equivalent. It is an internal crew portfolio view, excluded from public navigation and sitemap.

---

## 1. Static Pages

These are singular pages, not driven by a post type loop.

| Route | Chinese Route | Notes |
|---|---|---|
| `/` | `/zh/` | Home — hero, portfolio grid, brand wall, CTA |
| `/about/` | `/zh/关于/` | About page |
| `/work/` | `/zh/工作/` | Portfolio index |
| `/news/` | `/zh/新闻/` | Blog/news index |
| `/contact/` | `/zh/联系/` | Contact page |
| `/vietnam-production-service/` | `/zh/越南生产服务/` | Vietnam service page |
| `/vietnam-location-guide/` | `/zh/越南旅游指南/` | Vietnam location guide |
| `/video-campaign-brief/` | `/zh/视频活动简介/` | Campaign brief form page |
| `/work-internal/` | — (English only) | Internal crew portfolio view — see below |

### Internal page: Work (Internal)

| Property | Value |
|---|---|
| Route | `/work-internal/` |
| Chinese route | None — English only |
| Template | Internal crew portfolio view |
| Filters | `client`, `director`, `dop`, `art-director` (AND logic — not mutually exclusive) |
| SEO | `noindex`, excluded from sitemap |
| Access | No authentication required; not linked from public navigation |

Shows all portfolio entries including hidden items. Used for pitch research, crew lookups, and client history.

---

## 2. Portfolio (Custom Post Type: `portfolio`)

141 portfolio entries total (282 URLs including Chinese versions). Each entry is a single project page.

**URL pattern:** `/portfolio/[slug]/`
**Chinese pattern:** `/zh/投资组合/[slug]/`

### Sample entries (representative, not exhaustive)

**Recent / flagship work:**
- `/portfolio/mammotion-luba-3-awd/`
- `/portfolio/brinc-guardian-next-generation-of-response/`
- `/portfolio/bambu-lab-h2d-your-personal-manufacturing-hub/`
- `/portfolio/realme-15-series-5g-live-real-in-every-shot/`
- `/portfolio/bitget-getagent-ft-julian-alvarez/`
- `/portfolio/govee-halloween/`
- `/portfolio/oneplus-pad-3-masterful-by-every-measure/`

**Legacy / archive work:**
- `/portfolio/dji-mavic-2-rapid-recap/` (and many other DJI entries)
- `/portfolio/hasselblad-x1d/`
- `/portfolio/samsung-x-discovery/`
- `/portfolio/ecoflow-delta-series-live-without-limits/`

**Note on slug `/portfolio/3612/`:** One entry has a numeric-only slug. Flag for review during migration — may need a proper slug assigned.

---

## 3. Blog / News (Post Type: `post`)

23 posts total (46 URLs including Chinese versions).

**URL pattern:** `/[post-slug]/` (no `/news/` prefix on individual posts — they live at root level)
**Chinese pattern:** `/zh/[chinese-slug]/`

### All current posts

- `/bitget-and-vantage-pictures-launch-campaign-starring-world-cup-champion-julian-alvarez/`
- `/vantage-pictures-delivers-high-energy-waterproof-chaos-in-global-campaign-for-the-new-realme-c85-smartphone/`
- `/vantage-pictures-and-realme-turn-nightlife-into-an-ai-powered-dream-in-live-for-real-campaign/`
- `/govees-haunted-light-show-vantage-pictures-turns-vietnam-suburb-into-a-horror-film-set/`
- `/directors-brief-12-questions-with-zacharia-lorenz-at-vantage-pictures/`
- `/directors-brief-12-questions-with-alexis-odiowei-at-vantage-pictures/`
- `/vantage-pictures-drops-cinematic-global-campaign-for-oneplus-pad-3-launch/`
- `/confidence-in-every-frame-ulike-taps-vantage-pictures-for-humorous-beauty-campaign/`
- `/msi-taps-vantage-pictures-for-its-first-global-brand-film-in-the-b2b-space/`
- `/realme-unveils-humorous-and-chaotic-spot-for-new-mishap-proof-c75/`
- `/bitgets-humorous-human-moments-shake-up-crypto-trading/`
- `/bitget-and-vantage-pictures-team-up-to-inject-humour-into-crypto-trading/`
- `/realme-13-5g-blurs-the-line-between-reality-and-gaming-in-immersive-ad/`
- `/oneplus-12-campaign-celebrates-a-bygone-era-of-authentic-imagery/`
- `/this-cross-cultural-oppo-spot-delivers-much-needed-nostalgia-for-mothers-day/`
- `/vantage-pictures-taps-into-inner-romance-for-oneplus-y-series-tv-spot/`
- `/roborock-gives-quirky-makeover-to-cordless-vacuum-cleaner/`
- `/how-we-produced-one-of-the-most-successful-crowdfunding-campaigns-in-history/`
- `/asus-business-lets-you-upgrade-to-incredible-in-campaign-from-byron-mckenzie/`
- `/vantage-pictures-elevates-mammotion-luba-3-with-cinematic-product-first-campaign/`
- `/vantage-pictures-translates-next-gen-drone-tech-into-gritty-storytelling-for-brinc/`
- `/vantage-pictures-james-duong-on-bringing-chinese-productions-to-vietnam/`
- `/a-talking-dog-ai-and-everyday-chaos-behind-govees-new-campaign-via-vantage-pictures/`

**Important:** Individual blog post URLs live at the root (no `/news/` prefix). The `/news/` route is only the index. This must be preserved exactly in the new build to avoid breaking inbound links and SEO.

---

## 4. Taxonomies

This is the most architecturally significant discovery from the sitemap. The site uses **four taxonomies** to classify portfolio work. These are not decorative — they power filtered views of the portfolio and must be replicated in the new build.

### 4a. Blog Categories (applied to posts)

**URL pattern:** `/category/[slug]/`
**Chinese pattern:** `/zh/类别/[slug]/`

| Category | URL |
|---|---|
| Behind the Scenes | `/category/behind-the-scenes/` |
| Creative | `/category/creative/` |
| Crew Insights | `/category/crew-insights/` |
| Press | `/category/press/` |

### 4b. Video Format (applied to portfolio)

**URL pattern:** `/video-format/[slug]/`
**Chinese pattern:** `/zh/视频格式/[slug]/`

| Format | URL |
|---|---|
| Brand Film | `/video-format/brand-film/` |
| Branded Documentary | `/video-format/branded-documentary/` |
| Commercial Spot | `/video-format/commercial-spot/` |
| Product Video | `/video-format/product-video/` |

### 4c. Industry (applied to portfolio)

**URL pattern:** `/industry/[slug]/`
**Chinese pattern:** `/zh/产业/[slug]/`

| Industry | URL |
|---|---|
| AI & Robotics | `/industry/ai-robotics/` |
| Automotive | `/industry/automotive/` |
| Beauty & Cosmetics | `/industry/beauty-cosmetics/` |
| Drones | `/industry/drones/` |
| Electronics | `/industry/electronics/` |
| Fashion | `/industry/fashion/` |
| Finance | `/industry/finance/` |
| FMCG | `/industry/fmcg/` |
| Hospitality | `/industry/hospitality/` |
| Tech | `/industry/tech/` |

### 4d. Market (applied to portfolio)

**URL pattern:** `/market/[slug]/`
**Chinese pattern:** `/zh/市场/[slug]/`

| Market | URL |
|---|---|
| China | `/market/china/` |
| Singapore | `/market/singapore/` |
| Taiwan | `/market/taiwan/` |
| USA | `/market/usa/` |
| Vietnam | `/market/vietnam/` |

---

## 5. Route Summary

| Type | Count (EN) | Count (ZH) | Total |
|---|---|---|---|
| Static pages (public) | 8 | 8 | 16 |
| Static pages (internal) | 1 | — | 1 |
| Portfolio entries | 141 | 141 | 282 |
| Blog posts | 23 | 23 | 46 |
| Blog categories | 4 | 4 | 8 |
| Video format taxonomy | 4 | 4 | 8 |
| Industry taxonomy | 10 | 10 | 20 |
| Market taxonomy | 5 | 5 | 10 |
| **Total** | **196** | **195** | **391** |

---

## 6. URL Redirect Map (Critical for SEO)

All current URL patterns must either be preserved exactly or explicitly redirected. The following patterns carry SEO equity and inbound links.

### Preserve exactly (no change needed)
- `/portfolio/[slug]/` → keep identical
- `/news/` → keep identical
- `/work/` → keep identical
- `/about/` → keep identical
- `/vietnam-production-service/` → keep identical
- `/video-campaign-brief/` → keep identical
- `/industry/[slug]/` → keep identical
- `/market/[slug]/` → keep identical
- `/video-format/[slug]/` → keep identical
- `/category/[slug]/` → keep identical

### Blog post URLs (root-level — preserve exactly)
All 23 blog post slugs live at root with no prefix. These must remain at root in the new build. Do not move them under `/news/[slug]/` without a redirect in place.

### Chinese URLs
Chinese slugs use URL-encoded Chinese characters. These must be preserved exactly as-is or redirected. Changing the encoding or slug structure will break all inbound Chinese-language links.

### Potential redirect needed
- `/portfolio/realme-c85-your-ultimate-outdoor-sidekick/` → **301 redirect to** `/portfolio/realme-c85-your-ultimate-outdoor-sidekick/` (slug corrected on production 2026-06-21)

---

## 7. Notes for Cursor

- Every page type has a bilingual equivalent. The i18n system must be baked into routing from day one, not retrofitted.
- Taxonomy archive pages (`/industry/`, `/market/`, `/video-format/`, `/category/`) must render filtered lists of portfolio or blog content. These are not static pages — they are dynamically generated from tag/category relationships in Sanity.
- Blog post URLs are at root level, not nested under `/news/`. This is intentional and must be preserved.
- The `/zh/` prefix for Chinese routes uses readable Chinese slugs, not translated English slugs. Sanity schemas must store the Chinese slug separately from the English slug for each piece of content.
- Do not invent new routes. All routes in this document should exist in the new build. New pages added post-launch will follow the patterns established here.
- `/work-internal/` is English-only, `noindex`, and not linked from public navigation. It must not appear in the sitemap or Chinese route map.