# Redesign Content Fields — Parallel Body Pattern

Standing pattern for the `redesign` branch when a content change would otherwise mutate the live dataset that `main` and hosted Studio still serve.

---

## What

On `blogPost` documents:

| Field | Audience | Role |
|---|---|---|
| `body` / `bodyZh` | `main`, production frontend, Chi / Karen / Hien via hosted Studio | Live content — **do not edit from redesign-branch work** |
| `redesignBody` / `redesignBodyZh` | `redesign` branch queries, renders, and migrations only | Parallel portable-text body for redesign-only content work |

Schema: `sanity/schemas/blogPost.ts`  
Studio tabs: group `live` (“Legacy / Live Content”, default) vs `redesign` (“Redesign Content”).

Same PT type as live (`portableTextBody`, including `pullQuote` / `imagePair`). Both redesign fields are optional (no `required()`).

---

## Why

**One Sanity dataset is shared by `main` and `redesign`.** Schema/API writes land in production Content Lake immediately. Editing `body` / `bodyZh` for a redesign-only change (e.g. blockquote → `pullQuote`) would alter what live already publishes.

Parallel fields let redesign evolve body content without touching live documents’ live fields. `main` never selects `redesignBody*`, so unknown attributes are ignored until merge.

---

## Authoring policy

For the duration of the redesign period:

- **New blog posts continue to be authored into `body` / `bodyZh`** (the live fields) as normal. Chi / Karen / Hien’s workflow is unchanged — they should never be pointed at `redesignBody` / `redesignBodyZh` directly.
- **`redesignBody` / `redesignBodyZh` are populated only via the backfill script** (`scripts/migration/patch/backfill-blog-redesign-body.ts`), run periodically or on demand. Editors do not touch these fields in Studio, even after a Studio deploy eventually exposes the “Redesign Content” field group.
- **At final launch / cutover (merge to `main`)**, `body` / `bodyZh` get retired/removed and `redesignBody` / `redesignBodyZh` content becomes canonical. That is a planned future cleanup step — not yet scheduled.
- **Until cutover**, any post edited on live `body` / `bodyZh` after its last backfill will not reflect that edit in `redesignBody` / `redesignBodyZh` until the script is re-run. That is the accepted drift tradeoff (see [Drift policy](#drift-policy-current) below).

---

## Drift policy (current)

After the initial backfill (`scripts/migration/patch/backfill-blog-redesign-body.ts`):

- Redesign copies are **frozen** relative to live.
- Live edits to `body` / `bodyZh` (typos, new posts, ZH work) do **not** auto-propagate into `redesignBody*`.
- **One final re-sync pass is planned before merge-to-main** — not automated yet. Do not invent ad-hoc sync scripts without Zach approval.

---

## Standing rule for agents

**Any future redesign-branch content change that would touch blog body content must go through this pattern** — write to / read from `redesignBody` / `redesignBodyZh` (or an equivalent new parallel field for other doc types), never patch live `body` / `bodyZh` for redesign-only work.

Generalize the same idea for other doc types when needed: new parallel field(s) + redesign-only query/render path + leave live fields alone.

Backfill / migration scripts:

- Default dry-run; `--apply` only after Zach explicit go-ahead.
- Dataset backup before apply:  
  `npx sanity dataset export production <path>/vantage-production-$(date +%Y%m%d).tar.gz --no-assets`
- Writes must `.set({ redesignBody, redesignBodyZh })` only — never `body` / `bodyZh`.

---

## Related

- Schema: `sanity/schemas/blogPost.ts`
- Backfill: `scripts/migration/patch/backfill-blog-redesign-body.ts`
- Query/render swap onto redesign fields: deferred until after backfill `--apply` (Phase 3 hold)
- Guardrail: `.cursor/rules/stack-guardrails.mdc` (Sanity section)
