# Vantage Pictures Website — Project Context

## Project Overview

Vantage Pictures company website: **Next.js (App Router) + Sanity**, deployed on Vercel. The WordPress rebuild is complete; there is no WordPress tree in this repo.

**Marketing URL:** `https://vantage.pictures` (www → apex)  
**Internal app URL:** `https://app.vantage.pictures` (work library + showreel editor)  
**Sanity Studio:** `https://vantage-pictures.sanity.studio/`  
**Local root:** this workspace on `main` only (redesign branch/worktree retired)

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) under `src/app` |
| CMS | Sanity (hosted Studio + Content Lake) |
| Styling | Tailwind CSS + component CSS / design tokens in `src/app/globals.css` |
| Deployment | Vercel (project `vantage`) |
| Email (transactional) | Resend |
| Email (company) | SiteGround (unchanged) |
| Analytics | Google Tag Manager → GA4 (+ other tags in GTM) |
| Video | Vimeo (Player SDK + server-minted preview URLs) |

---

## Repository & Environment

- App code: `src/` · Sanity Studio: `sanity/` · Shared helpers: `shared/`
- Environment variables live in `.env.local` (never commit). Full list: `.cursor/docs/env-vars.md`
- Hard constraints: `.cursor/rules/stack-guardrails.mdc`, `.cursor/rules/implementation-workflow.mdc`

---

## Deployment Architecture

- **Vercel** hosts the Next.js app (marketing + app host on the same project)
- **Sanity** hosts Studio and content; publish webhook hits `/api/webhooks/sanity-revalidate`
- Host routing (`src/proxy.ts` + `src/lib/site-hosts.ts`):
  - Marketing: public site
  - App host: library at `/`, project detail at `/{slug}`, showreel login/edit under `/showreel/...`
  - `/work-internal` on marketing **308s** to the app host

---

## CMS Users & Roles

| Name | Role in Sanity | Responsibilities |
|---|---|---|
| Zacharia Lorenz | Administrator | Full access — content, schema, settings |
| Leo Nguyen | Editor | Portfolio, blog, translations |

Editor role must not modify schemas, global settings, or delete published content without admin approval.

### CMS notes

Canonical pages: `home` (carousel), `about` (media + founders). Blog bodies use `body` / `bodyZh`. Historical consolidation notes: `.cursor/docs/redesign-content-fields.md`.

---

## Content & Language

Fully bilingual: **English** (primary) and **Chinese Simplified** (secondary).

- English at `/`, Chinese under `/zh/`
- Chinese slugs stored explicitly (`slugZh`) — never auto-derived
- i18n via `next-intl`

---

## Contact & Forms

### Campaign Brief (`/video-campaign-brief/`)
1. Email via Resend → `info@vantage.pictures`
2. Field payload → Lark webhook
3. Briefing files → Sanity upload token (browser) + optional attachment doc

### Contact (`/contact/`)
Email + Lark; fire-and-forward (no form DB).

---

## Analytics & Tracking

All tracking through **Google Tag Manager** (`NEXT_PUBLIC_GTM_ID`). Do not implement GA4 / Meta / LinkedIn / Clarity directly in code. Vimeo play events push into the data layer for GTM.

---

## Performance Expectations

- Prefer static / cached rendering for content pages
- Images via Next.js `<Image>` + Sanity image URLs (`@sanity/image-url`)
- Homepage carousel uses native Vimeo preview minting (`VIMEO_ACCESS_TOKEN`); iframe is fallback only
- Core Web Vitals targets: LCP < 2.5s, CLS < 0.1, INP < 200ms

---

## SEO Requirements

- Preserve existing URL equity; redirects live in `next.config.ts`
- Blog posts stay at root (`/[slug]`), not under `/news/`
- App host / work-internal surfaces are `noindex` and excluded from the sitemap
- Sitemap: `https://vantage.pictures/sitemap.xml`

---

## Related docs

| Doc | Topic |
|---|---|
| `site-architecture.md` | Routes and hosts |
| `env-vars.md` | Environment variables |
| `redesign-content-fields.md` | Historical CMS consolidation notes (complete) |
| `design-tokens.md` / `candidate-tokens.md` | Tokens |
| `content-schema.md` / `migration-data.md` | Historical rebuild notes (may be stale) |
