# Post-cutover CMS consolidation (complete)

The redesign branch is retired. Canonical CMS shape after consolidation:

| Surface | Canonical doc / fields |
|---|---|
| Blog article body | `blogPost.body` / `bodyZh` |
| Home carousel | `page` slug **`home`** → `carouselSlides` |
| About media | `page` slug **`about`** → specialties / advantages / CTAs / statement slots |
| Home / About SEO | same canonical `home` / `about` docs |

Stub pages (`home-redesign`, `about-redesign`) and parallel `redesignBody*` fields have been removed from the authoring model. One-off promote/merge scripts remain under `scripts/migration/patch/` for history; do not re-run unless recovering from a restore.

## Authoring

- Edit **Home** for carousel order (also powers the Work featured strip).
- Edit **About** for About page media slots.
- Edit blog **Body** fields for article content (what production renders).
