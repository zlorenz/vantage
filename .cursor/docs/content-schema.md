# Content Schema — Vantage Pictures

Phase 1 audit reference for the WordPress → Next.js + Sanity rebuild. Synthesizes findings from the child theme audit (Tasks 1–3), database queries (Tasks 4–7), and cross-references with `site-architecture.md` and `design-tokens.md`.

**Audit date:** 2026-06-21  
**Database:** MAMP MySQL `vantage_local` (port 8889)  
**Source theme:** `wp-content/themes/vantagepictures-child/` (read-only reference)

---

## 1. JavaScript Behaviours to Rebuild

Six custom scripts in `assets/js/`. TranslatePress and plugin scripts are out of scope.

### 1.1 `vp-mobile-nav.js` — **High priority**

| Aspect | Detail |
|---|---|
| **Scope** | Global — every front-end page |
| **Purpose** | Mobile nav accordion + language switcher relocation |
| **Behaviours** | Toggle `.vp-dropdown-open` on dropdown parents (≤768px); close other open dropdowns; update `aria-expanded`; relocate TranslatePress language switcher into `.vp-mobile-lang-slot` on mobile, restore on desktop resize |
| **Next.js** | Client component in `SiteHeader` |

### 1.2 `portfolio-load-more.js` — **High priority**

| Aspect | Detail |
|---|---|
| **Scope** | `/work/`, `/work-internal/`, taxonomy archives |
| **DOM** | `#vp-load-more`, `#vp-portfolio-grid`, `.vp-filterbar`, `.vp-tax-filter`, `.vp-internal-crew-filter`, `.vp-filters` |
| **Behaviours** | IntersectionObserver infinite scroll (`rootMargin: 1200px`); public filters (format/industry/market — mutually exclusive) with URL sync (`?format=`, `?industry=`, `?market=`) + `pushState`/`popstate`; internal crew filters (client/director/dop/art-director — AND logic); staggered card reveal (`vp-card-reveal`, 40ms); AbortController + request ID guard; loading classes; `data-initial-empty="1"` auto-fetch on Work page; scroll-into-view on filter change |
| **Next.js** | Client component + API route, or full SSG with client-side filtering (141 entries makes SSG viable) |

### 1.3 `blog-load-more.js` — **Medium priority**

| Aspect | Detail |
|---|---|
| **Scope** | `/news/`, category archives, search, date/author archives |
| **DOM** | `#vp-blog-load-more`, `#vp-blog-grid` |
| **Behaviours** | IntersectionObserver (`rootMargin: 800px`); offset pagination; category/search query passthrough; initial 9 posts, 5 per batch; `.loading`/`.is-done` states |
| **Next.js** | Optional — only 23 posts; may be fully static |

### 1.4 `vimeo-datalayer.js` — **Medium priority**

| Aspect | Detail |
|---|---|
| **Scope** | Single portfolio pages only |
| **Events** | `vp_vimeo_play`, `vp_vimeo_progress` (25/50/75/100%), `vp_vimeo_complete` |
| **Behaviours** | Lazy-load `@vimeo/player`; attach after user-initiated embed; payload includes `vimeo_video_id`, `progress_percent`; Vimeo iframes only (not Xinpianchang) |
| **Next.js** | Client component on `PortfolioVideo` |

### 1.5 `gf-brief-datalayer.js` — **Low priority**

| Aspect | Detail |
|---|---|
| **Scope** | `/video-campaign-brief/` |
| **Behaviours** | Push `{ event: 'vp_brief_form_submit', formId: '1', formName: 'client_brief' }` to GTM on confirmation; dedup guard (`window._vp_brief_pushed`) |
| **Next.js** | Form submit success handler |

### 1.6 `gf-brief-validation-placement.js` — **Low priority**

| Aspect | Detail |
|---|---|
| **Scope** | Form ID 1 only |
| **Behaviours** | Move validation summary above footer/submit on multi-step form |
| **Next.js** | Built into `CampaignBriefForm` layout |

---

## 2. Additional Design Tokens

Values from `video-campaign-brief-form.css` and `file-block.css`. **Now captured in `design-tokens.md` §Form & File Block Tokens.** Add to `tailwind.config.js` before building form and file-block components.

### 2.1 Campaign Brief Form (22 tokens)

| Token | Value | Usage |
|---|---|---|
| `vp-form-gap` | `1rem` | Column gap |
| `vp-form-row-gap` | `1.5rem` | Row gap |
| `vp-form-label-size` | `1rem` | Label font size |
| `vp-form-label-weight` | `500` | Label weight |
| `vp-form-label-height` | `2.6rem` | Desktop label block height |
| `vp-form-input-min-height` | `2.625rem` | Input min height |
| `vp-form-input-padding` | `0.5rem 0.9rem` | Input padding |
| `vp-form-input-size` | `0.9rem` | Input font size |
| `vp-form-placeholder` | `rgba(255,255,255,0.5)` | Placeholder |
| `vp-form-helper-muted` | `rgba(255,255,255,0.55)` | Descriptions |
| `vp-form-option-label` | `rgba(255,255,255,0.72)` | Radio/checkbox labels |
| `vp-form-focus-border` | `rgba(255,255,255,0.4)` | Focus border |
| `vp-form-textarea-min-height` | `120px` | Textarea |
| `vp-form-dropzone-min-height` | `224px` | File dropzone |
| `vp-form-step-circle-size` | `2.25rem` | Mobile step indicator |
| `vp-form-step-border` | `rgba(255,255,255,0.45)` | Step outline |
| `vp-form-step-completed-bg` | `rgba(255,255,255,0.2)` | Completed step circle |
| `vp-form-step-pending-text` | `rgba(255,255,255,0.7)` | Pending step number |
| `vp-form-validation-border` | `rgba(255,92,92,0.7)` | Validation box border |
| `vp-form-validation-bg` | `rgba(255,92,92,0.12)` | Validation box bg |
| `vp-btn-letter-spacing` | `0.125rem` | Button letter-spacing |
| `vp-btn-select-files-spacing` | `0.05em` | Select files button |
| `vp-btn-padding` | `0.75rem 2rem` | Form button padding |
| `vp-btn-ghost-hover-bg` | `rgba(255,255,255,0.1)` | Ghost button hover |
| `vp-btn-primary-hover-soft` | `rgba(255,255,255,0.85)` | Select-files hover |

**Layout behaviours to replicate:** 12-column CSS grid on desktop (field widths 3–12 cols); block flow on mobile; fixed label height + bottom alignment on desktop; 2-col name sub-grid; step nav with ✓/●/○ indicators (desktop) and numbered circles (mobile); validation summary above footer (50% width, right-aligned); file dropzone with dashed border and FA cloud icon.

**Note:** Ghost "Previous" button variant documented in `design-tokens.md` §Form & File Block Tokens.

### 2.2 File Block (2 tokens)

| Token | Value | Usage |
|---|---|---|
| `vp-file-block-padding-top` | `1.25rem` | Spacing above block |
| `vp-file-block-button-gap` | `1.25rem` | Filename-to-button gap |

**Component:** `.wp-block-file` → `FileDownloadBlock`. Filename at h3 scale (`clamp(1.5rem, 2vw, 1.75rem)`, weight 700, uppercase); download button primary white.

**Dead file:** `vp-file-block.min.css` is identical to `file-block.css` and is not enqueued — ignore.

---

## 3. Page & Component Map

Bilingual routing: English at `/`, Chinese at `/zh/`. See `site-architecture.md` for full URL map.

### 3.1 Global Layout

| WordPress | Next.js | Key data |
|---|---|---|
| `header.php` | `SiteHeader` + root layout | Logo, `main-menu` nav, search (conditional), contact nav → modal trigger, mobile lang slot |
| `footer.php` | `SiteFooter` + `ContactModal` | ACF options: email, social links (empty = hidden) |

### 3.2 Page Templates

| WordPress | Route | Next.js page / components | Key data |
|---|---|---|---|
| `front-page.php` | `/` | `app/[locale]/page.tsx` | `HomeHeroCarousel`, CMS block renderer |
| `home.php` | `/news/` | `app/[locale]/news/page.tsx` | `PageHero`, `BlogPostCard`, `BlogSidebar` |
| `page.php` | `/about/`, `/contact/`, `/vietnam-*`, `/video-campaign-brief/` | `app/[locale]/[slug]/page.tsx` | `PageHero` or `CondensedHeader`, `RichTextContent`, `CampaignBriefForm` |
| `page-work.php` | `/work/` | `app/[locale]/work/page.tsx` | `PageHero`, `PortfolioFilterBar`, `PortfolioGrid`, `PortfolioCard` |
| `page-work-internal.php` | `/work-internal/` (EN only) | `app/work-internal/page.tsx` | `PageHero`, `CrewFilterBar`, `PortfolioGrid`, `PortfolioCard` — no visibility filter; AND crew filters |
| `single-portfolio.php` | `/portfolio/[slug]/` | `app/[locale]/portfolio/[slug]/page.tsx` | `PageHero`, `PortfolioVideo`, `CreditsTable`, `AdditionalVideos` |
| `single.php` | `/[post-slug]/` | `app/[locale]/[slug]/page.tsx` (blog) | `BlogPostHeader`, `RichTextContent` |
| `category.php` | `/category/[slug]/` | `app/[locale]/category/[slug]/page.tsx` | Archive shell + `BlogSidebar` |
| `taxonomy-industry.php` | `/industry/[slug]/` | `app/[locale]/industry/[slug]/page.tsx` | `TaxonomyHeader`, `FilterTabs`, `PortfolioGrid` |
| `taxonomy-market.php` | `/market/[slug]/` | `app/[locale]/market/[slug]/page.tsx` | Same; excludes `isHidden` entries |
| `taxonomy-video-format.php` | `/video-format/[slug]/` | `app/[locale]/video-format/[slug]/page.tsx` | Same; excludes term ID 37 from filter bar |
| `archive.php` | date/author archives | Redirect to `/news/` or minimal archive | Low traffic |
| `search.php` | `/search/` | `app/[locale]/search/page.tsx` | `SearchHeader`, `SearchResultCard` |

### 3.3 Template Parts

| File | Renders | Next.js component |
|---|---|---|
| `home-hero-carousel.php` | Full-viewport carousel from ACF slides | `HomeHeroCarousel` |
| `portfolio/card.php` | Thumbnail card + overlay title | `PortfolioCard` |
| `blog/card-list.php` | Thumbnail, title, date, excerpt | `BlogPostCard` |
| `blog/archive-shell.php` | Archive layout + sidebar + sentinel | Shared archive layout |
| `search/card.php` | Type label, date, excerpt | `SearchResultCard` |
| `contact-modal.php` | Bootstrap modal + ACF contact fields | `ContactModal` |
| `breadcrumbs.php` | Yoast breadcrumbs | `Breadcrumbs` (optional — unused in main templates) |

### 3.4 Notable Template Logic

| Finding | Migration impact |
|---|---|
| Homepage below carousel is Gutenberg-driven | Portable Text / block renderer needed |
| `home.php` ≠ `front-page.php` | `/news/` has its own hero from Posts page ACF |
| Work page uses AJAX empty shell on page 1 | Next.js can SSG all 141 entries instead |
| Dual visibility systems | Consolidated to single `isHidden` on `portfolioEntry` (§4.11) |
| Contact nav opens modal, not `/contact/` | Preserve modal trigger behaviour |
| Blog post URLs at root (no `/news/` prefix) | Critical for SEO — preserve exactly |
| Xinpianchang embed on `/zh/` when set | Locale-aware video source on portfolio |
| Display titles → Brand / Product / Campaign → compiled `.vp-outline` (thumb is single-line plain) | Structured parts; optional HTML overrides |
| Comments on blog posts | **Dropped** — no comment display, forms, or moderation in rebuild |
| `portfolio` CPT not registered in child theme | Registered elsewhere (plugin/parent) |

### 3.5 Internal reference data (Sanity document types)

Mapped from WordPress crew/client/platform taxonomies. **Credit Identities** are the preferred entity for Work Library filters. Legacy `client` / `crewMember` docs remain in the dataset as orphaned WP mirrors (desk-hidden; Create blocked) after the 2026-07-22 retire pass cleared `portfolioEntry.clients` / `crewMembers`.

| WordPress taxonomy | Terms (live Sanity) | Sanity type | Role |
|---|---|---|---|
| (new) | 180 | `creditIdentity` | Stable vendor entity (opaque `ci_…` id); Brand / Director / DOP / Art Director / Editor |
| `client` | 59 (legacy) | `client` | Orphaned Brand taxonomy; **0** live portfolio refs |
| `director` / `dop` / `art-director` | 105 (legacy) | `crewMember` | Orphaned role-scoped crew taxonomy; **0** live portfolio refs |
| `platform` | 108 | `platform` | Distribution/platform tags |

**Dropped from migration:** `portfolio_visibility` taxonomy — consolidated into `portfolioEntry.isHidden` (see §4.8).

---

## 4. Sanity Schema Definitions

Mapped from ACF field groups (6 in DB + 2 PHP-only). Field types show ACF → Sanity equivalents.

### 4.1 Document types overview

| Sanity type | WordPress source | Count |
|---|---|---|
| `portfolioEntry` | `portfolio` CPT | 141 |
| `blogPost` | `post` | 23 |
| `page` | `page` | 9 (8 public bilingual + 1 internal EN-only) |
| `siteSettings` | ACF Options (Contact Info) | 1 singleton |
| `client` | `client` taxonomy | 59 (legacy; orphaned, desk-hidden) |
| `crewMember` | `director`, `dop`, `art-director` taxonomies | 105 (legacy; orphaned, desk-hidden) |
| `creditIdentity` | backfilled from clients/crew/credits | 180 |
| `platform` | `platform` taxonomy | 108 |
| Public taxonomy refs | `category`, `video-format`, `industry`, `market` | 23 terms |

### 4.2 `portfolioEntry`

```typescript
{
  _type: 'portfolioEntry'
  title: string                    // synced: Brand Product – Campaign
  titleZh?: string
  slug: slug
  slugZh?: slug
  displayTitleParts: {
    brandName: string              // required; display-only (not crew Brand)
    productName?: string
    campaignTitle?: string
    brandNameZh?: string
    productNameZh?: string
    campaignTitleZh?: string
  }
  // Media tab: first-video episode when it differs from Campaign (multi-video series)
  heroFilmTitle?: string           // outlines Full title only; Header stays Brand + Campaign/Product
  heroFilmTitleZh?: string
  // Optional HTML overrides when Brand/Product/Campaign cannot express layout
  thumbTitleOverride?: text
  headerTitleOverride?: text
  longTitleOverride?: text
  // + Zh override variants (escape hatches; DisplayTitlesInput)
  description: text
  descriptionZh?: text
  featuredImage: image
  publishedAt: date                // Studio: Original Release Date (client video release)
  vimeoUrl: url                    // oembed → extract Vimeo ID
  xinpianchangUrl?: url            // 72 entries populated; shown on /zh/
  additionalVideos?: array<{
    vimeoUrl: url
    xinpianchangUrl?: url
    videoTitle?: string            // episode / film title (outlined in Full title)
    videoTitleZh?: string
    description?: text
    descriptionZh?: text
  }>                                // 28 entries have rows
  videoFormats: array<ref>         // taxonomy: video-format
  industries: array<ref>           // taxonomy: industry
  markets: array<ref>              // taxonomy: market
  clients: array<ref>              // legacy → client; prefer creditIdentity on Brand credits
  crewMembers: array<ref>          // legacy → crewMember; prefer creditIdentity on Director/DOP/AD
  platforms: array<ref>           // ref → platform
  isHidden: boolean                // see §4.8 — migration: true for WP ID 3187 only
  crewCredits?: array<crewCredit>  // sole live credits source; filter roles link identity refs
  seo: seoFields
}
```

**Structured credit shape** (`crewCredits` — sole source for Studio + frontend):

```typescript
{
  department: 'production' | 'camera' | 'ge' | 'art' | 'casting' | 'stills' | 'post'
  roleKey?: string                 // stable catalog key for predefined roles
  role: string                     // display label
  isCustomRole?: boolean
  people: array<{
    name: string
    url?: url                      // http/https only
  }>
}
```

Editors import CSV credits via the custom Crew Credits input in Studio.
`crewCredits` is the only field read for display and Work Library filters. The
legacy document-level `credits` object (WP ACF department shape) was migrated
into `crewCredits` and then unset from all portfolio documents (2026-07-31);
it is no longer in the schema or live data.

**Crew taxonomy sync (from `crewCredits` roleKeys → Sanity refs):**

| roleKey | Sanity document type |
|---|---|
| `brand` | `client` (legacy) / prefer `creditIdentity` |
| `director` | `crewMember` (`role: director`) / prefer `creditIdentity` |
| `dop` | `crewMember` (`role: dop`) / prefer `creditIdentity` |
| `art_director` | `crewMember` (`role: art-director`) / prefer `creditIdentity` |

The canonical role catalog lives in `shared/crew-credits/` and is shared by Studio,
CSV import, frontend rendering, and migration.

### 4.3 `blogPost`

```typescript
{
  _type: 'blogPost'
  title: string
  titleZh?: string
  slug: slug                       // root-level URL: /[slug]/ not /news/[slug]/
  slugZh?: slug
  featuredImage?: image
  categories: array<ref>           // category taxonomy
  excerpt?: text                   // EN card / teaser copy
  excerptZh?: text                 // ZH card excerpt (locale pair with `excerpt`)
  body: portableTextBody           // curated Portable Text (see below)
  bodyZh?: portableTextBody
  seo: seoFields
}
```

**`portableTextBody` (blog composer)** — scoped to patterns used across live posts; not a Gutenberg-style block library:

| Insert | Sanity type / style | Notes |
|---|---|---|
| Paragraph | `block` · `normal` | Default prose |
| Heading 2–4 | `block` · `h2`–`h4` | H3 is the dominant post lead style |
| Quote | `block` · `blockquote` | Style menu → Quote |
| Bullet / numbered list | `block` lists | Rare in posts; kept for flexibility |
| Strong / emphasis / link | marks | No code/underline/strike in the menu |
| Image | `image` (+ optional `alt`, `caption`, hotspot) | Inline stills; Studio edit dialog mirrors Media (Title / Alt text / Description→caption) |
| Video | `videoEmbed` · `{ url, title? }` | Vimeo or YouTube; Studio can paste URL or pick from portfolio; `title` from pick/oEmbed for preview |

**Out of scope for blog bodies:** `imageGallery`, `ctaButton`, columns, spacers, file downloads (those remain page-oriented where used).

**Studio UX:** Body fields use a widened Portable Text writing column (Sanity’s default block max-width is 640px). **Expand editor** opens a full-viewport compose overlay (editor chrome fills the window; prose stays ~900px centered to match the site). Sanity’s built-in PTE fullscreen is disabled here — its `ExpandedLayer` breaks in the Content tool; the supported alternative is a custom input + CSS height ([Sanity PTE height guide](https://www.sanity.io/docs/developer-guides/change-the-height-of-a-portable-text-editor-pte-using-a-custom-input-component)). Image blocks use hover edit/delete instead of the default Alt/Untitled chrome; metadata is written to the Media asset and mirrored onto the block (`alt`, `caption`).

**Dropped feature — blog comments:** WordPress enables comments on blog posts. The Next.js rebuild does not include comment display, comment forms, or moderation infrastructure.

### 4.4 `page`

```typescript
{
  _type: 'page'
  title: string
  titleZh?: string
  featuredImage?: image
  excerpt?: text                   // EN card / teaser copy (locale pair with `excerptZh`)
  excerptZh?: text
  slug: slug
  slugZh?: slug
  showHeroHeader: boolean          // vp_show_hero_header — off for Home, Campaign Brief
  heroTitle?: string               // vp_hero_title — supports <span class="vp-outline">
  heroTitleZh?: string
  body: portableText
  bodyZh?: portableText
  heroSlides?: array<ref → portfolioEntry>  // homepage carousel (order = display; CTA always “Watch”)
  featuredWork?: array<ref → portfolioEntry>  // Home “A Bit of Our Work”; VPS “Shot in Vietnam”
  brandLogos?: array<{             // homepage “Brands We Work With” — logoId from shared/client-logos registry (+ /public/logos SVGs)
    logoId: string                 // curated enum; new marks = design/code PR, not CMS upload
  }>
  founders?: array<{               // About page only
    name: string
    jobTitle: string
    jobTitleZh?: string
    image: image
  }>
  pdfDownload?: {                  // Vietnam Location Guide only
    file: file
    label: string
  }
  seo: seoFields
  noIndex?: boolean                 // work-internal only
}
```

**Studio UX:** Two tabs — **Page Details** and **Content**. Page Details matches blog posts: Title → **Card** (Featured Image | Excerpt) → Slug, then hero chrome / noindex / SEO. Slug-gated Content fields: Home (`heroSlides`, `featuredWork`, `brandLogos`), Vietnam Production Service (`featuredWork`), About (`founders`), Vietnam Location Guide (`pdfDownload`). Hero title hides when Show Hero Header is off. Carousel / Featured Work / Brand Logos include Clear all with confirm.

**Published pages:**

| Slug | Hero header | Notes |
|---|---|---|
| `home` | Off | Front page — carousel + Gutenberg |
| `about` | On | Founders repeater (4 entries) |
| `work` | On | Portfolio index |
| `work-internal` | On | Internal crew view; English-only route; noindex; not in public nav |
| `news` | On | Blog index |
| `contact` | On | Contact page (nav opens modal) |
| `vietnam-production-service` | On | Featured Work → “Shot in Vietnam” grid |
| `vietnam-location-guide` | On | File download block |
| `video-campaign-brief` | Off | Campaign Brief form |

### 4.5 `siteSettings` (singleton)

```typescript
{
  _type: 'siteSettings'
  contactEmail: string             // info@vantage.pictures
  contactPhone?: string
  contactWhatsapp?: string
  contactAddress?: string
  contactModalTitle?: string
  contactModalIntro?: text         // empty in production
  contactModalContent?: portableText  // empty in production
  contactCtaText?: string          // empty in production
  contactCtaUrl?: url              // empty in production
  campaignCta?: {                  // shared Home / About / Vietnam CTA
    heading: string                // supports vp-outline HTML
    headingZh?: string
    paragraphs: array<text>
    paragraphsZh?: array<text>
    buttonLabel: string
    buttonLabelZh?: string
    buttonHref?: string            // default /video-campaign-brief
  }
  socialVimeo?: url
  socialInstagram?: url
  socialFacebook?: url
  socialLinkedin?: url
  socialYoutube?: url
  socialXinpianchang?: url
  socialXiaohongshu?: url          // empty = hidden in footer
  defaultOgImage?: image           // vantage-pictures-default.jpg (ID 3627)
}
```

### 4.6 Public taxonomy documents

```typescript
// category — titles/slugs only
// videoFormat, industry, market — include archive intro copy
{
  _type: 'category' | 'videoFormat' | 'industry' | 'market'
  title: string
  titleZh?: string
  slug: slug
  slugZh?: slug
  description?: string             // EN archive intro (portfolio taxonomies)
  descriptionZh?: string           // ZH archive intro (portfolio taxonomies)
}
```

### 4.7 `client` (legacy)

```typescript
{
  _type: 'client'
  name: string                     // term name from client taxonomy
  slug: slug
  // Legacy Brand taxonomy. Prefer creditIdentity linked from Brand credits.
  // Not exposed on public taxonomy archive pages
  // Studio: desk-hidden; Create blocked (structure.ts / sanity.config.ts)
}
```

**Count:** 59 documents (live, 2026-07-26). **Live refs:** 0 `portfolioEntry` docs with non-empty `clients` (published or draft) after the 2026-07-22 retire pass. Docs kept for historical reference only.

### 4.7b `creditIdentity`

```typescript
{
  _type: 'creditIdentity'
  _id: 'ci_…'                      // opaque; never derived from name/role
  name: string                     // display only; renames do not change identity
  url?: url                        // optional default profile/site link
  // Referenced from crewPerson.identity on Brand / Director / DOP / Art Director / Editor
  // Work Library filters by _id; role lives on the credit row (roleKey)
}
```

**Count:** 180 documents (live, 2026-07-26).

### 4.8 `crewMember` (legacy)

```typescript
{
  _type: 'crewMember'
  name: string                     // term name
  slug: slug
  role: 'director' | 'dop' | 'art-director'
  // Legacy role-scoped taxonomy. Prefer creditIdentity (one vendor across roles).
  // Not exposed on public taxonomy archive pages
  // Studio: desk-hidden; Create blocked (structure.ts / sanity.config.ts)
}
```

**Count:** 105 documents (live, 2026-07-26). **Live refs:** 0 `portfolioEntry` docs with non-empty `crewMembers` (published or draft) after the 2026-07-22 retire pass. Docs kept for historical reference only.

### 4.9 `platform`

```typescript
{
  _type: 'platform'
  name: string                     // term name from platform taxonomy
  slug: slug
  // Referenced from portfolioEntry.platforms
  // Not exposed on public taxonomy archive pages
}
```

**Count:** 108 terms

### 4.10 Shared `seoFields` object

```typescript
{
  metaDescription?: text           // 171/173 entries populated — primary migration field
  metaDescriptionZh?: text
  focusKeyword?: string             // 171 entries — optional editorial reference
  // Title: generated in Next.js metadata API, not stored per-entry
  // Pattern: {title} | Vantage Pictures (with page-specific overrides — see §7)
}
```

### 4.11 Fields to drop or consolidate

| Source | Issue | Action |
|---|---|---|
| Hide from Public Portfolio (ACF, disabled) | 0 entries with value 1 | **Dropped.** Do not migrate. |
| `portfolio_visibility` taxonomy | 1 entry in `hidden` | **Consolidated** into `portfolioEntry.isHidden` |
| Blog comments (WordPress) | Enabled on posts | **Dropped.** No comment UI or infrastructure in rebuild. |
| Credits Guide tab/message | Editor-only UI | Omit; use Sanity field descriptions |
| `contact_cta_*`, `contact_modal_intro/content` | Empty in production | Optional in schema |
| Yoast content score, linkdex, reading time | Internal Yoast metrics | Do not migrate |
| Legacy CF7 forms (2) | Not Gravity Forms | Do not migrate |

**Visibility consolidation (confirmed):** Replace the disabled ACF `hide_from_public` field and the `portfolio_visibility` taxonomy with a single `isHidden: boolean` on `portfolioEntry`. During migration, set `isHidden: true` for **one entry only**: Bitget – Elite Traders (WordPress ID **3187**). All other entries default to `isHidden: false`.

---

## 5. Campaign Brief Form Schema

Rebuild as native Next.js client component.

| Locale | Route |
|---|---|
| English | `/video-campaign-brief/` |
| Chinese | `/zh/视频活动简介/` |

### 5.0 Build sequence — bilingual forms (v1 requirement)

Both English and Chinese forms are required for v1 launch, but **must be built sequentially, not simultaneously:**

1. **Phase A — English form:** Build, style, and verify the English `CampaignBriefForm` against §5.1–5.5. Confirm Resend email, Lark webhook, file upload, GTM event, validation, and conditional logic.
2. **Phase B — Chinese form:** After English form is complete and verified, build the fully translated Chinese variant at `/zh/视频活动简介/`.

**Chinese form scope (Phase B):** All 42 fields, all 7 step titles, all select/radio/checkbox choice labels, all section headers, all conditional logic labels, validation messages, submit button text, form description, and confirmation message must have Chinese translations. Reuse the same component architecture and submission pipeline as the English form.

### 5.1 Form properties

| Property | Value |
|---|---|
| Steps | 7 (multi-page) |
| Input fields | 42 |
| Required fields | 6 |
| Submit button | "Submit Brief" |
| Honeypot | Enabled |
| Submit speed check | 3000ms threshold |
| File upload | Max 10 files; pdf, ppt, pptx, key, doc, docx, pages, xls, xlsx, numbers, zip, jpg, jpeg, png |

**Description (shown above fields):**
> This briefing form helps us understand your brand, product, and upcoming video campaign. The more you can provide, the more effectively we can shape the creative direction and production approach. If you're unsure about anything, feel free to leave them blank — our team will guide you through next steps.

### 5.2 Step structure

| Step | Title | Fields |
|---|---|---|
| 1 | Basics | 6 |
| 2 | Contact | 4 |
| 3 | Campaign Goals | 8 |
| 4 | Timeline & Release | 6 |
| 5 | Brand / Product | 9 (+ 2 section headers) |
| 6 | Deliverables | 11 (+ 3 conditional section headers) |
| 7 | Final Notes | 2 |

### 5.3 All fields

#### Step 1 — Basics

| Label | Key | Type | Required |
|---|---|---|---|
| Project title | `project_title` | text | **Yes** |
| Company name | `company_name` | text | **Yes** |
| What type of project is this? | `project_type` | select | No |
| How did you hear about us? | `discovery_source` | select | No |
| Please tell us how you found us | `referral_source_other` | text | No — if `discovery_source` = "Other" |
| Who referred you? | `referrer_name` | text | No — if referral option selected |

**`project_type` choices:** Product video, Commercial spot, Brand film, Corporate video, Social media campaign, Other

**`discovery_source` choices:** Google, Vimeo/YouTube, social platforms, colleague/agency/partner referral, events, Other (11 total)

#### Step 2 — Contact

| Label | Key | Type | Required |
|---|---|---|---|
| Name | `contact_name` | name (first + last) | **Yes** |
| Job title | `contact_job_title` | text | No |
| Email | `contact_email` | email | **Yes** |
| Phone | `contact_phone` | phone | No |

#### Step 3 — Campaign Goals

| Label | Key | Type | Required |
|---|---|---|---|
| Primary goals | `campaign_goals` | textarea | No |
| Key message | `key_message` | textarea | No |
| Target audience | `target_audience` | text | No |
| Desired runtime | `desired_runtime` | text | No |
| Mood and style | `video_tone_style` | textarea | No |
| Reference videos | `reference_videos` | textarea | No |
| Themes / buzzwords / slogans | `campaign_keywords_or_avoidances` | text | No |
| Budget range | `budget_range` | radio | **Yes** |

**`budget_range` choices:** Under $80K / $80K–$150K / $150K–$200K / $200K–$250K / $250K+ USD

#### Step 4 — Timeline & Release

| Label | Key | Type | Required |
|---|---|---|---|
| Distribution channels | `distribution_channels` | text | No |
| Target regions | `target_regions` | text | No |
| Usage rights term | `usage_rights_term` | text | No |
| Final delivery deadline | `delivery_deadline` | text | No |
| Deadline flexibility | `delivery_flexibility` | radio | No |
| Launch timing | `launch_timing` | text | No — if Fixed or Not sure yet |

#### Step 5 — Brand / Product

| Label | Key | Type | Required |
|---|---|---|---|
| Brand description | `brand_description` | textarea | No |
| Company mission | `brand_mission` | textarea | No |
| Campaign focused on product? | `campaign_focus` | radio | **Yes** |
| Product name | `product_name` | text | No — if `campaign_focus` = Yes |
| Key selling points | `product_key_features` | textarea | No — conditional |
| Market pain points | `market_pain_points` | textarea | No — conditional |
| Product differentiators | `product_differentiators` | textarea | No — conditional |

#### Step 6 — Deliverables

| Label | Key | Type | Required |
|---|---|---|---|
| Deliverables needed | `deliverables` | checkbox | No |
| Cutdown durations | `cutdown_durations` | text | No — if includes "Cutdowns" |
| Cutdown distribution | `cutdown_distribution` | text | No — conditional |
| Social channels | `social_channels` | text | No — if includes "Social versions" |
| Aspect ratios | `social_aspect_ratios` | text | No — conditional |
| Platform requirements | `social_platform_requirements` | textarea | No — conditional |
| Stills type | `stills_type` | textarea | No — if includes "Key visuals" |
| Photography requirements | `photography_requirements` | textarea | No — conditional |
| Stills quantity | `stills_quantity` | text | No — conditional |

**`deliverables` choices:** Main hero film, Cutdowns, Social versions, Key visuals, Motion graphics, Other

#### Step 7 — Final Notes

| Label | Key | Type | Required |
|---|---|---|---|
| Additional notes | `additional_notes` | textarea | No |
| Briefing materials upload | `briefing_materials_upload` | file (max 10) | No |

### 5.4 Conditional logic summary

| Trigger | Condition | Shows |
|---|---|---|
| `discovery_source` | = "Other" | `referral_source_other` |
| `discovery_source` | = colleague/agency/partner referral | `referrer_name` |
| `delivery_flexibility` | = Fixed OR Not sure yet | `launch_timing` |
| `campaign_focus` | = Yes | Product Details section + 4 product fields |
| `deliverables` | includes "Cutdowns" | Cutdowns section + 2 fields |
| `deliverables` | includes "Social versions" | Social section + 3 fields |
| `deliverables` | includes "Key visuals" | Stills section + 3 fields |

### 5.5 Submission handling

| Channel | Destination |
|---|---|
| Email | Resend → `zacharia@vantage.pictures` (all field data) |
| Team notification | Lark group webhook |
| Analytics | GTM event `vp_brief_form_submit` |
| Storage | None — fire-and-forward |
| File attachments | API route multipart → Lark attachments (no persistent storage) |

**Confirmation message:** "Thanks for contacting us! We will get in touch with you shortly." — generic copy; update for campaign brief in rebuild.

---

## 6. Content Counts & Taxonomy Terms

Verified against `site-architecture.md` on 2026-06-21.

### 6.1 Published content

| Type | Count | Doc match |
|---|---|---|
| Portfolio entries | **141** | Yes |
| Blog posts | **23** | Yes |
| Pages | **9** | Yes — includes `work-internal` (EN-only, internal) |
| **Total content URLs (EN+ZH)** | **~391** | Yes (196 EN + 195 ZH) |

### 6.2 Static pages

| Slug | Title | In site-architecture |
|---|---|---|
| `home` | Home | Yes (front page) |
| `about` | About | Yes |
| `work` | Work | Yes |
| `work-internal` | Work (Internal) | Yes — EN-only, noindex, not in public nav |
| `news` | News | Yes |
| `contact` | Contact | Yes |
| `vietnam-production-service` | Vietnam Production Service | Yes |
| `vietnam-location-guide` | Vietnam Location Guidebook | Yes |
| `video-campaign-brief` | Video Campaign Brief | Yes |

### 6.3 Blog categories

| Name | Slug | Count |
|---|---|---|
| Behind the Scenes | `behind-the-scenes` | 10 |
| Campaign Creative | `creative` | 10 |
| Crew Insights | `crew-insights` | 3 |
| Press Coverage | `press` | 16 |
| Uncategorized | `uncategorized` | 0 (unused default) |

### 6.4 Video format

| Name | Slug | Count |
|---|---|---|
| Brand Film | `brand-film` | 8 |
| Branded Documentary | `branded-documentary` | 27 |
| Commercial Spot | `commercial-spot` | 49 |
| Product Video | `product-video` | 55 |

### 6.5 Industry

| Name | Slug | Count |
|---|---|---|
| AI & Robotics | `ai-robotics` | 21 |
| Automotive | `automotive` | 2 |
| Beauty & Cosmetics | `beauty-cosmetics` | 1 |
| Drones | `drones` | 38 |
| Electronics | `electronics` | 56 |
| Fashion | `fashion` | 1 |
| Finance | `finance` | 8 |
| FMCG | `fmcg` | 12 |
| Hospitality | `hospitality` | 2 |
| Tech | `tech` | 114 |

### 6.6 Market

| Name | Slug | Count |
|---|---|---|
| China | `china` | 101 |
| Singapore | `singapore` | 5 |
| Taiwan | `taiwan` | 4 |
| USA | `usa` | 10 |
| Vietnam | `vietnam` | 20 |

### 6.7 TranslatePress configuration

| Setting | Value |
|---|---|
| Default language | `en_US` |
| Translation languages | `en_US`, `zh_CN` |
| URL prefix | `/zh/` |
| Dictionary entries | 8,145 (514 human, 4,529 machine, 3,099 untranslated) |
| Content coverage | Portfolio 141/141, posts 23/23, pages 7/9 |
| Chinese slugs | Sparse — ~18 post slug translations; most portfolio/blog URLs stay English on `/zh/` |
| Machine translation | Disabled (SQL error flagged in options) |
| Floater switcher | Disabled (custom theme switcher) |

### 6.8 Migration flags

| Item | Detail |
|---|---|
| Numeric portfolio slug | ID 3612, slug `3612` — assign proper slug; redirect documented in `migration-data.md` |
| Legacy CF7 forms | 2 Contact Form 7 forms remain — not active campaign form |
| Plugin cruft | ninja-table (24), oembed_cache (12), wp_block (4) — ignore |

---

## 7. SEO Migration Scope

Checked across **173** published items (141 portfolio + 23 posts + 9 pages).

### 7.1 Coverage summary

| Field | Populated | Total | Coverage |
|---|---|---|---|
| Hand-written SEO title | 0 | 173 | **0%** — all use Yoast templates |
| Per-entry Yoast title template (`%%…%%`) | 8 | 173 | 4.6% (pages only) |
| Custom meta description | 171 | 173 | **98.8%** |
| Per-entry OG image | 0 | 173 | **0%** — global default only |
| Focus keyword | 171 | 173 | 98.8% |

### 7.2 Missing meta descriptions (2)

| Type | Slug |
|---|---|
| Page | `work-internal` |
| Post | `vantage-pictures-james-duong-on-bringing-chinese-productions-to-vietnam` |

### 7.3 Title generation (Next.js metadata API)

No hand-written titles exist. Replicate Yoast global templates:

| Content type | Template |
|---|---|
| Portfolio | `{title} \| Vantage Pictures` |
| Post | `{title} \| Vantage Pictures` |
| Page (default) | `{title} \| Vantage Pictures` |
| Home | `Vantage Pictures \| {site description}` |

**Page-specific overrides** (stored as Yoast template strings — preserve logic):

| Page | Title pattern |
|---|---|
| Home | `{sitename} \| {sitedesc}` |
| Work | `{sitename} \| Commercial Film Portfolio` |
| News | `Commercial Film Production {title} \| {sitename}` |
| Video Campaign Brief | `Start Your Project \| {sitename}` |
| Vietnam Location Guide | `Vietnam Filming Location Guide \| Production Resource` |
| About / Contact | `{title} {sitename} \| {sitedesc}` |

### 7.4 OG / social

| Setting | Value |
|---|---|
| Global default OG image | `vantage-pictures-default.jpg` (attachment ID 3627) |
| Open Graph | Enabled globally |
| Twitter cards | Enabled globally |
| Per-entry OG images | None — use default or derive from featured image |

### 7.5 Indexing rules

| Entry | Rule |
|---|---|
| `work-internal` | `noindex` — must stay excluded from sitemap |
| All other content | Index |

### 7.6 Migration checklist

| Field | Migrate? | Notes |
|---|---|---|
| `metaDescription` | **Yes** | 171 entries via export script; fill 2 gaps manually |
| SEO title | **No** (generate) | Template logic in Next.js metadata |
| Page title overrides | **Partial** | 8 pages have non-default patterns |
| OG image | **Optional** | Global default; consider featured image fallback |
| Focus keyword | **Optional** | Editorial reference only |
| Content score / linkdex | **No** | Yoast-internal |
| Chinese SEO meta | **No separate Yoast fields** | Handled by TranslatePress rendered output → Sanity `*Zh` fields |

---

## Appendix: Decisions Log

All audit decisions confirmed 2026-06-21.

| # | Topic | Decision |
|---|---|---|
| 1 | **`/work-internal/`** | **Include in rebuild.** English-only route (`/work-internal/`, no `/zh/` equivalent). Internal crew portfolio view with AND-logic filters (Brand / Director / DOP / Art Director via `creditIdentity` + unlinked name fallbacks on `crewCredits`). `noindex`, excluded from sitemap. No auth required; not linked from public navigation. Documented in `site-architecture.md`. |
| 2 | **Blog comments** | **Drop entirely.** No comment display, forms, or moderation in Next.js. Noted in §4.3 (`blogPost`). |
| 3 | **Visibility consolidation** | **Confirmed.** Single `isHidden: boolean` on `portfolioEntry`. Drop disabled ACF `hide_from_public` and `portfolio_visibility` taxonomy. Migration: set `isHidden: true` for WP ID 3187 (Bitget – Elite Traders) only. Documented in §4.11. |
| 4 | **Chinese Campaign Brief form** | **v1 requirement, sequential build.** Fully translated 42-field, 7-step form at `/zh/视频活动简介/`. Build after English form is complete and verified — not simultaneously. Documented in §5.0. |
| 5 | **Crew taxonomies** | **Original (2026-06-21):** keep `client` / `crewMember` / `platform` mapped from WP. **Post-migration (2026-07-22):** Work Library filters via `creditIdentity` on `crewCredits` (not `clients` / `crewMembers` arrays). Legacy `client` (59) and `crewMember` (105) docs remain orphaned; Studio desk-hidden + Create blocked. `platform` (108) unchanged. Documented in §4.7–4.9. |
| 6 | **`brandLogoItem.logoId` enum** | **Won't Fix (2026-07-26, `bd8e833c`).** Registry stays code-owned. 36 SVGs added in one commit (`680f0cea`), zero incremental adds in 12 months. Rejected: `client.logo` (`client` retired) and a `brandLogo` document type (assets live in `/public/logos/`, so a new mark requires a deploy regardless of schema — a doc type would add a source of truth without removing the deploy). Logo set ≠ client set: several marks have no client doc, `p-and-g`/`procter-gamble` slug mismatch, orientation variants (`huawei-horizontal`/`huawei-vertical`) can't be expressed by a single ref. Guardrails: `logoId` validated against `CLIENT_LOGO_BY_ID`; disk-parity test `npm run test:client-logos` (both directions). Adding a mark = design PR. |
| 7 | **`client` / `crewMember` retired** | **Confirmed (2026-07-22 data, 2026-07-26 desk, `bd8e833c`).** 59 `client` and 105 `crewMember` orphan docs remain; 0 `portfolioEntry` refs to either, published and drafts. Both removed from `sanity/structure.ts` and blocked in `newDocumentOptions`. Schema types stay registered, documents untouched — orphans are Vision-only. Live brand record is `crewCredits` Brand rows + `creditIdentity`. Do not re-run `link-credit-identities-on-credits.ts` unfiltered — stale map can write dangling weak refs (see script header). |

### Remaining items (not blocking build start)

| Item | Notes |
|---|---|
| Chinese slug patterns | Verify TranslatePress dictionary against `site-architecture.md` during migration (e.g. `/zh/关于/` vs `/zh/关于我们/`) |
| Campaign Brief confirmation copy | Update generic "contact us" wording for brief context (EN and ZH) |
| File upload strategy | No persistent storage; Lark attachment forwarding via API route |
| TranslatePress SQL error | Flagged in local DB options; dictionary data intact |
| Portfolio slug `/portfolio/3612/` | Assign human-readable slug; redirect in `migration-data.md` |

---

## Recommended Next Steps

1. **Define Sanity schemas** — implement document types from §4 in Sanity Studio (including `client`, `crewMember`, `platform`).
2. **Build migration scripts** — export portfolio/posts/pages + Yoast metadesc + TranslatePress dictionary + crew/client/platform terms to JSON. Apply `isHidden: true` for WP ID 3187.
3. **Assign portfolio slug** — `/portfolio/3612/` → human-readable slug + redirect.
4. **Scaffold Next.js routes** — follow page/component map in §3 with bilingual `[locale]` routing; add English-only `/work-internal/` route.
5. **Build Campaign Brief form (Phase A)** — English form per §5 with Resend + Lark integration.
6. **Build Campaign Brief form (Phase B)** — Chinese translation after English form verified.
7. **Close audit phase** — sign off `design-tokens.md` and remove WordPress reference files per `migration-data.md` checklist (when approved).
