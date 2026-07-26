# Sanity TypeGen

Query-level TypeScript types for GROQ (`*_QUERY_RESULT`) plus schema types.
Generated file is committed so a clean clone builds without a codegen step, and
GROQ/schema drift shows up in diffs.

## After a schema or GROQ change

From the **repo root**:

```bash
npm run typegen
npm run build
```

`npm run typegen` runs **inside `sanity/`** (required — CLI config and
`sanity-typegen.json` live there; Studio schemas are resolved from that cwd):

1. `npx sanity schemas extract --force`  
   Writes `sanity/schema.json`. `--force` is required when that file already
   exists (it does in this repo).
2. `npx sanity typegen generate`  
   Reads `sanity/sanity-typegen.json` (and the mirrored `typegen` block in
   `sanity/sanity.cli.js`) and writes **`src/sanity/sanity.types.ts`**.

Do **not** run these from the repo root without `cd sanity` — relative
`schema` / `path` / `generates` entries are resolved from the Studio directory.

Equivalent manual form:

```bash
cd sanity
npx sanity schemas extract --force
npx sanity typegen generate
cd ..
npm run build
```

Note the CLI verb is **`schemas extract`** (plural), not `schema extract`.

## Query requirements

- Wrap GROQ strings in `defineQuery` from `groq` and assign to a named export
  (e.g. `export const ABOUT_PAGE_QUERY = defineQuery(\`...\`)`).
- Plain template strings are ignored by typegen — no `*_RESULT` type is emitted.
- Fragment composition via `` `${PAGE_META_FIELDS}` `` is fine: `const` template
  fragments without interpolations stay string **literals**, so
  `client.fetch(QUERY)` can still key into `SanityQueries`.

## Output path (do not move casually)

| Artifact | Path | Tracked? |
|---|---|---|
| Typegen config | `sanity/sanity-typegen.json` | yes — commit it |
| Generated types | `src/sanity/sanity.types.ts` | yes — **do not gitignore** |
| Schema extract | `sanity/schema.json` | yes (existing) |

### Dual `@sanity/client` gotcha

The Studio package installs its own `@sanity/client` under `sanity/node_modules`.
If types are generated under `sanity/` (e.g. `sanity/sanity.types.ts`), the
`declare module '@sanity/client'` augmentation patches the **studio** client.
The Next app imports the **root** `node_modules/@sanity/client`, so
`fetch(QUERY)` falls back to `any`.

That is why `generates` is `../src/sanity/sanity.types.ts`. The app loads the
augmentation via `import '@/sanity/sanity.types'` in `src/lib/sanity.ts`.

## Status (as of #4 page-query typegen)

- **9** `*_QUERY_RESULT` types are generated (HOME, WORK, WORK_PAGE_META, ABOUT,
  CONTACT, NEWS, VIETNAM_LOCATION_GUIDE, VIETNAM_PRODUCTION_SERVICE,
  VIDEO_CAMPAIGN_BRIEF).
- `ClientReturn` / `sanityClient.fetch(QUERY)` inference is confirmed working
  (not `any`) with `overloadClientMethods: true`.
