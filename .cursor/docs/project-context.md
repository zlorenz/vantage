# Vantage Pictures Website — Project Context

## Project Overview

This is a ground-up rebuild of the Vantage Pictures company website, migrating from a WordPress + ACF Pro installation to a Next.js + Sanity stack. The WordPress codebase exists in this same folder as the starting point and reference. It is being systematically replaced — not modified.

The goal is a fast, maintainable, custom-built site with a purpose-built CMS that gives the team exactly the content management tools they need and nothing else.

**Production URL:** `https://vantage.pictures`
**Staging URL:** `https://dev.vantage.pictures`
**Local development root:** `/Users/zacharialorenz/Documents/Cursor/vantage`

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| CMS | Sanity (hosted) |
| Styling | Tailwind CSS |
| Deployment | Vercel |
| Email (transactional) | Resend |
| Email (company) | SiteGround (unchanged) |
| Analytics | Google Tag Manager → GA4 |
| Video embeds | Vimeo Player SDK |

---

## Repository & Environment

- Local path: `/Users/zacharialorenz/Documents/Cursor/vantage`
- The WordPress installation remains in this folder during the build phase as a reference and content source. Do not delete WordPress files until explicitly instructed.
- New Next.js application will be initialized inside this folder as the build progresses.
- Environment variables (Sanity project ID, dataset, API tokens, Resend API key) are stored in `.env.local` and must never be committed to version control.

---

## Deployment Architecture

- **Vercel** hosts the Next.js application
- **Sanity** hosts the CMS (Sanity Studio accessible at `/studio` or a subdomain)
- **SiteGround Singapore** continues to handle email only (`@vantage.pictures` addresses)
- On content publish in Sanity, Vercel triggers an automatic rebuild via webhook
- Staging environment mirrors production on a Vercel preview deployment or `dev.vantage.pictures`

---

## CMS Users & Roles

Two active users. A third (digital marketing hire) will be added in the future.

| Name | Role in Sanity | Responsibilities |
|---|---|---|
| Zacharia Lorenz | Administrator | Full access — content, schema changes, settings |
| Leo Nguyen | Editor | Add/edit portfolio entries, blog posts, translations |

Sanity permissions should be configured so that the Editor role cannot modify schemas, global settings, navigation structure, or delete published content without admin approval.

---

## Content & Language

The site is fully bilingual: **English** (primary) and **Chinese Simplified** (secondary).

- Every content type has English and Chinese field variants
- English is the canonical language; Chinese is a translation layer
- Routing: English at root (`/`), Chinese under `/zh/` prefix
- Chinese URL slugs are stored explicitly — they are not auto-generated from English slugs
- All new content schemas must include both language variants from day one
- i18n routing is handled via Next.js built-in internationalization or `next-intl`

---

## Contact & Forms

### Campaign Brief Form (`/video-campaign-brief/`)
The primary lead generation form on the site. On submission:
1. A confirmation/notification email is sent to `zacharia@vantage.pictures` via Resend
2. All form field data is posted to a **Lark group** via a Lark bot webhook
3. No data is stored in a database — submissions are fire-and-forward only

Lark Suite API documentation: `https://open.larksuite.com/document/home/index`

### Contact Page (`/contact/`)
Simpler contact form. Same routing as campaign brief — email to `zacharia@vantage.pictures` + Lark bot.

---

## Analytics & Tracking

All tracking is implemented via **Google Tag Manager**. Do not implement GA4, Meta Pixel, LinkedIn Insight Tag, or Microsoft Clarity directly — route everything through GTM. The GTM container ID must be stored in an environment variable.

| Tool | Purpose |
|---|---|
| Google Analytics 4 | Site analytics |
| Meta Pixel | Facebook/Instagram ad attribution |
| LinkedIn Insight Tag | LinkedIn ad attribution |
| Microsoft Clarity | Session recording and heatmaps |
| Vimeo Player SDK | Video play event tracking, piped into GTM data layer |

---

## Performance Expectations

- All portfolio and blog pages are statically generated at build time (SSG)
- Taxonomy archive pages (industry, market, video-format, category) are also statically generated
- Images are served via Next.js `<Image>` component with lazy loading and modern formats (WebP/AVIF)
- Vimeo embeds are lazy-loaded — do not embed the iframe until user interaction
- Core Web Vitals targets: LCP < 2.5s, CLS < 0.1, INP < 200ms
- No client-side data fetching on page load for content that can be statically rendered

---

## SEO Requirements

- Every page has a unique meta title and meta description, sourced from Sanity fields
- Open Graph tags on all pages (title, description, image)
- JSON-LD structured data on portfolio entries and blog posts
- Canonical tags on all pages, with `hreflang` alternates for EN/ZH pairs
- XML sitemap auto-generated and submitted to Google Search Console
- All existing URLs preserved exactly or explicitly 301-redirected (see `site-architecture.md`)

---

## Key Development Principles

- Build for the editor, not just the developer. CMS fields should be clearly labelled and scoped to exactly what each content type needs.
- Never hardcode content that belongs in Sanity. Page copy, titles, and media all come from the CMS.
- Prefer static generation. Use server components and ISR only where static generation is insufficient.
- The site must be fully functional without JavaScript for core content (portfolio, blog, pages). JS enhances; it does not gate.
- Mobile-first. The majority of client traffic is on mobile in Asia.
- Do not install packages without a clear reason. Keep `package.json` lean.
- All components are in `/components`, all Sanity schemas in `/sanity/schemas`, all page routes in `/app`.

---

## Reference: Legacy WordPress Installation

The WordPress files in this folder are **read-only reference material** until explicitly told otherwise. They exist to:
- Provide the design system and CSS to extract into `design-tokens.md`
- Provide ACF field structures to inform Sanity schema definitions
- Provide content for migration into Sanity
- Provide Gravity Forms structure for rebuilding the campaign brief form

Do not modify any WordPress files. Do not run `wp` commands that write to the database without explicit instruction. The WordPress installation is a source of truth for existing content, not an active development target.

---

## External Documentation

See `external-docs.md` for all reference links. Always prefer official documentation over third-party tutorials.