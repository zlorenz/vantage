# Environment variables

Secrets live in `.env.local` (never committed). Copy from `.env.example` when present.

## Showreel editor

| Variable | Required | Notes |
|----------|----------|--------|
| `SHOWREEL_EDITOR_PASSWORD` | Yes (for editor) | Server-only shared password. Gates `/showreel/[id]/edit` and future showreel-mutating API routes. Does **not** gate `/work-internal` browsing. Set your own value in `.env.local` and in Vercel. |

Example line for `.env.local`:

```bash
SHOWREEL_EDITOR_PASSWORD= # set your own value
```
