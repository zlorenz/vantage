<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Workspace

Primary workspace is this repo on **`main`**. The redesign branch/worktree is retired — do not assume a parallel checkout.

Hard stack constraints: `.cursor/rules/` (always applied). Project context: `.cursor/docs/project-context.md`.

## CMS

Canonical fields/docs: blog `body` / `bodyZh`; pages `home` + `about`. See `.cursor/docs/redesign-content-fields.md` for post-cutover consolidation notes.
