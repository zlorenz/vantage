# External Documentation Reference — Vantage Pictures

Use official documentation as the primary source when implementing features, debugging issues, or reviewing best practices. Prefer official docs over third-party tutorials in all cases.

---

## Next.js

Main Docs:
https://nextjs.org/docs

App Router:
https://nextjs.org/docs/app

Routing:
https://nextjs.org/docs/app/building-your-application/routing

Data Fetching:
https://nextjs.org/docs/app/building-your-application/data-fetching

Static Generation & ISR:
https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration

Image Optimization:
https://nextjs.org/docs/app/api-reference/components/image

Internationalization (i18n):
https://nextjs.org/docs/app/building-your-application/routing/internationalization

Metadata & SEO:
https://nextjs.org/docs/app/building-your-application/optimizing/metadata

Redirects:
https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects

---

## Sanity

Main Docs:
https://www.sanity.io/docs

Schema Types:
https://www.sanity.io/docs/schema-types

GROQ Query Language:
https://www.sanity.io/docs/groq

Sanity Client (JS):
https://www.sanity.io/docs/js-client

Content Lake API:
https://www.sanity.io/docs/datastore

Localization (bilingual content):
https://www.sanity.io/docs/localization

Sanity Studio:
https://www.sanity.io/docs/sanity-studio

Webhooks (for Vercel rebuild triggers):
https://www.sanity.io/docs/webhooks

Image Handling (sanity-image-url):
https://www.sanity.io/docs/image-urls

---

## Tailwind CSS

Main Docs:
https://tailwindcss.com/docs

Installation with Next.js:
https://tailwindcss.com/docs/installation/framework-guides/nextjs

Configuration:
https://tailwindcss.com/docs/configuration

---

## Vercel

Main Docs:
https://vercel.com/docs

Deploying Next.js:
https://vercel.com/docs/frameworks/nextjs

Environment Variables:
https://vercel.com/docs/environment-variables

Preview Deployments:
https://vercel.com/docs/deployments/preview-deployments

Webhooks:
https://vercel.com/docs/observability/webhooks-overview

---

## Resend (Transactional Email)

Main Docs:
https://resend.com/docs/introduction

Sending Email:
https://resend.com/docs/api-reference/emails/send-email

Next.js Integration:
https://resend.com/docs/send-with-nextjs

---

## Lark Suite

API Overview:
https://open.larksuite.com/document/home/index

Bot Webhooks (for form submission routing):
https://open.larksuite.com/document/client-docs/bot-5/add-custom-bot

---

## next-intl (Internationalization)

Main Docs:
https://next-intl.dev/docs/getting-started

App Router Setup:
https://next-intl.dev/docs/getting-started/app-router

---

## next-sitemap (Sitemap Generation)

Main Docs:
https://github.com/iamvishnusankar/next-sitemap

---

## Vimeo Player SDK

Player SDK:
https://developer.vimeo.com/player/sdk

SDK Reference:
https://developer.vimeo.com/player/sdk/reference

oEmbed API (for embed metadata):
https://developer.vimeo.com/apis/oembed

---

## Google Tag Manager

Main Docs:
https://developers.google.com/tag-platform/tag-manager

Data Layer:
https://developers.google.com/tag-platform/devguides/datalayer

---

## Google Analytics 4

Main Docs:
https://developers.google.com/analytics/devguides/collection/ga4

---

## Meta Pixel

Main Docs:
https://developers.facebook.com/docs/meta-pixel/

---

## LinkedIn Insight Tag

Main Docs:
https://learn.microsoft.com/en-us/linkedin/marketing/integrations/ads-reporting/conversion-tracking

---

## Microsoft Clarity

Main Docs:
https://learn.microsoft.com/en-us/clarity/

---

## Schema.org (Structured Data)

Full Reference:
https://schema.org/docs/full.html

Google Search — Structured Data:
https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data

---

## Google Search Central

Main Docs:
https://developers.google.com/search/docs

Sitemaps:
https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview

hreflang (multilingual SEO):
https://developers.google.com/search/docs/specialty/international/localized-versions

---

## Notes

- All tracking (GA4, Meta Pixel, LinkedIn, Clarity) is routed through Google Tag Manager. Do not implement these directly in code.
- Vimeo video play events should be captured via the Vimeo Player SDK and pushed to the GTM data layer.
- Never use `<iframe>` directly for Vimeo embeds — always use the Player SDK for event tracking capability and lazy loading control.
- Sanity image URLs should always be built using the `@sanity/image-url` package, never hardcoded.
- Environment variables for all external services (Sanity, Resend, GTM container ID, Lark webhook URL) must be stored in `.env.local` and referenced via `process.env`. Never hardcode credentials.