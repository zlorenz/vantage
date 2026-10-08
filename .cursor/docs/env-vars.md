# Environment variables

Secrets live in `.env.local` (never committed). Copy from `.env.example` when present.

## Site hosts

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SITE_URL` | Yes (prod) | Marketing origin, e.g. `https://vantage.pictures`. |
| `NEXT_PUBLIC_APP_HOST` | Yes (prod) | App hostname only, e.g. `app.vantage.pictures`. |
| `NEXT_PUBLIC_APP_URL` | Yes (prod) | App origin, e.g. `https://app.vantage.pictures`. Work library + showreel editor. |

## Showreel editor

| Variable | Required | Notes |
|----------|----------|--------|
| `SHOWREEL_EDITOR_PASSWORD` | Yes (for editor) | Server-only shared password. Gates `/showreel/[id]/edit` and future showreel-mutating API routes. Does **not** gate library browsing. Set your own value in `.env.local` and in Vercel. |

Example lines for `.env.local`:

```bash
NEXT_PUBLIC_SITE_URL=https://vantage.pictures
NEXT_PUBLIC_APP_HOST=app.vantage.pictures
NEXT_PUBLIC_APP_URL=https://app.vantage.pictures
SHOWREEL_EDITOR_PASSWORD= # set your own value
```
