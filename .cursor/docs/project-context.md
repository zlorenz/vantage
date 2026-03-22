# Vantage Pictures Website - Project Context

## Project overview

This is the live Vantage Pictures company website built in WordPress.

Production URL:
`https://vantage.pictures`

Staging URL:
`https://dev.vantage.pictures`

Local development root:
`/Applications/MAMP/htdocs/vantage-local`

The site is already live and working. Changes should be approached carefully as updates to a production-ready codebase, not as greenfield development.

## Theme architecture

Parent theme:
`wp-content/themes/vantagepictures`

Child theme:
`wp-content/themes/vantagepictures-child`

Default implementation target:
`wp-content/themes/vantagepictures-child`

Do not modify the parent theme unless explicitly instructed.

## Key development principles

- Use the child theme for all custom work by default.
- Prefer hooks, filters, template overrides, and theme-level customization.
- Never modify WordPress core.
- Never modify third-party plugin source code unless explicitly instructed.
- Prefer minimal, maintainable edits over broad rewrites.
- The site is already functioning well, so avoid destabilizing working systems.

## Plugin stack

Primary plugins in use include:

- ACF Pro
- Yoast SEO Premium
- Bootstrap Blocks
- TranslatePress Business
- WPvivid Backup
- SiteGround Speed Optimizer
- SiteGround Security
- Google Tag Manager integration and related tracking tools

## Performance considerations

Performance matters. Avoid solutions that add unnecessary database-heavy queries or inefficient filtering logic.

When implementing features:
- prefer efficient WordPress-native structures
- avoid repeated expensive ACF-based filtering when better structural options exist
- preserve caching compatibility
- keep front-end behavior lightweight where possible

## Development expectations

When proposing changes:
- identify the exact file(s) to edit
- provide copy-paste-ready code
- include a short comment header in each code snippet
- avoid vague instructions
- prefer explicit, step-by-step implementation guidance

## Reference-only locations

These may be inspected for reference only and must not be modified:

- `wp-admin`
- `wp-includes`
- parent theme files
- third-party plugin files

## Notes for future work

Assume the project may include:
- custom portfolio templates
- taxonomy archives
- ACF-powered content structures
- SEO/schema enhancements
- performance tuning
- multilingual behavior through TranslatePress
- tracking and analytics integrations