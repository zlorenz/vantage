# Vantage Pictures

Next.js + Sanity website for [vantage.pictures](https://vantage.pictures).

| Surface | URL |
|---------|-----|
| Marketing site | https://vantage.pictures |
| Internal work library | https://app.vantage.pictures |
| Sanity Studio | https://vantage-pictures.sanity.studio |

## Develop

```bash
npm install
npm run dev
```

App: [http://localhost:3000](http://localhost:3000) · Studio (separate): `cd sanity && npm run dev`

Copy secrets into `.env.local` — see [`.cursor/docs/env-vars.md`](.cursor/docs/env-vars.md).  
Project context for agents: [`.cursor/docs/project-context.md`](.cursor/docs/project-context.md).

## Stack notes

- App Router under `src/app` (not the Pages Router)
- Host routing for marketing vs app: `src/proxy.ts`
- Hard constraints: `.cursor/rules/`
