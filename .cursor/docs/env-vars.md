# Environment variables

Secrets live in `.env.local` (never committed). Mirror Production values from the Vercel project `vantage` when setting up a new machine.

## Site hosts

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SITE_URL` | Yes (prod) | Marketing origin, e.g. `https://vantage.pictures`. |
| `NEXT_PUBLIC_APP_HOST` | Yes (prod) | App hostname only, e.g. `app.vantage.pictures`. |
| `NEXT_PUBLIC_APP_URL` | Yes (prod) | App origin, e.g. `https://app.vantage.pictures`. Work library + showreel editor. |

## Analytics

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_GTM_ID` | Yes (prod) | GTM container ID. Wired in the locale layout. Set on Production **and** Preview if you need Tag Assistant on previews. |

## Sanity

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes | Project id. |
| `NEXT_PUBLIC_SANITY_DATASET` | Yes | Usually `production`. |
| `SANITY_API_READ_TOKEN` | Yes | Server-side reads (draft/preview as configured). |
| `SANITY_API_WRITE_TOKEN` | For writes | Mutations, campaign-brief attachments, migration scripts. Never `NEXT_PUBLIC_*`. |
| `SANITY_API_TOKEN` | Optional alias | Some scripts accept this as a write-token fallback. |
| `NEXT_PUBLIC_SANITY_UPLOAD_TOKEN` | Brief uploads | Editor-scoped, CORS-restricted browser uploads. |
| `SANITY_REVALIDATE_SECRET` | Webhook | Shared secret for `/api/webhooks/sanity-revalidate`. |
| `SANITY_VIDEO_EVENTS_WRITE_TOKEN` | Video events | Server writes for carousel/video analytics docs. |

## Vimeo

| Variable | Required | Notes |
|----------|----------|--------|
| `VIMEO_ACCESS_TOKEN` | Yes (carousel/library) | Server-only. Mints preview URLs via `/api/vimeo-preview/*`. Without it the homepage carousel falls back to letterboxed iframes. |

## Showreel editor

| Variable | Required | Notes |
|----------|----------|--------|
| `SHOWREEL_EDITOR_PASSWORD` | Yes (for editor) | Server-only shared password. Gates `/showreel/[id]/edit` (app host). Does **not** gate library browsing. |

## Forms

| Variable | Required | Notes |
|----------|----------|--------|
| `RESEND_API_KEY` | Yes | Transactional email. |
| `RESEND_FROM_EMAIL` | Yes | From address for Resend. |
| `LARK_WEBHOOK_URL` | Yes | Lark bot webhook for contact + campaign brief. |

## Cron / other

| Variable | Required | Notes |
|----------|----------|--------|
| `CRON_SECRET` | Cron routes | Authorizes Vercel cron handlers. |
| `GEMINI_API_KEY` | Optional | Used by specific Studio/tools flows if enabled. |
| `VERCEL_OIDC_TOKEN` | Vercel-managed | Often present locally after `vercel link`; do not commit. |

## Example `.env.local` skeleton

```bash
NEXT_PUBLIC_SITE_URL=https://vantage.pictures
NEXT_PUBLIC_APP_HOST=app.vantage.pictures
NEXT_PUBLIC_APP_URL=https://app.vantage.pictures
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_READ_TOKEN=
SANITY_API_WRITE_TOKEN=
NEXT_PUBLIC_SANITY_UPLOAD_TOKEN=
SANITY_REVALIDATE_SECRET=
SANITY_VIDEO_EVENTS_WRITE_TOKEN=
VIMEO_ACCESS_TOKEN=
SHOWREEL_EDITOR_PASSWORD=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
LARK_WEBHOOK_URL=
CRON_SECRET=
```
