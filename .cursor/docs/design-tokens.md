# Design Tokens — Vantage Pictures

Authoritative visual values for the Next.js app. Shipping tokens live as `--vp-*` custom properties in [`src/app/globals.css`](../../src/app/globals.css) (and component CSS where scoped). Tailwind v4 maps colours/fonts via `@theme` `--color-vp-*` / `--font-vp-*` in that file — there is no `tailwind.config.js` colour extend. Prefer token names over raw hex in new UI code.

---

## Locked, component-scoped (`--vp-home-carousel-*`)

Stable tokens used only by the homepage featured-work carousel. **Not** sitewide — do not reuse elsewhere until a second component needs the same value (then promote to a shared `--vp-*`). CSS lives under `.vp-home-carousel` in [`src/components/home/featured-work-carousel/carousel.css`](../../src/components/home/featured-work-carousel/carousel.css).

| Token | Value | Usage | Notes |
|---|---|---|---|
| `--vp-home-carousel-overlay-pad-inline` | `30px` | Overlay L/R inset | Desktop ≥768 |
| `--vp-home-carousel-overlay-pad-block` | `36px` | Overlay top/bottom inset | Intentional vs Figma `60px` (~40% tighter). Desktop ≥768 |
| `--vp-home-carousel-title-tag-gap` | `24px` | Brand-row → campaign title | Intentional vs Figma `32px`. Desktop ≥768; mobile uses `--vp-overlay-mobile-title-tag-gap` |
| `--vp-home-carousel-brand-dot-size` | `0.8em` | Brand `::before` bullet | Corrected from undersized `0.4em`. |
| `--vp-home-carousel-brand-accent` | `#fdb913` | Brand colour + bullet fill | Same hex as `--vp-link`. |
| `--vp-home-carousel-tracking-tight-16` | `0` | Brand/format + credit names (was −0.32px; Special Gothic minimum tracking is 0) | |
| `--vp-home-carousel-tracking-tight-48` | `0` | Campaign title 48px (was −0.96px) | |
| `--vp-home-carousel-tracking-tight-14` | `0` | Slide counter (was −0.28px) | |
| `--vp-home-carousel-credit-role` | `rgba(255,255,255,0.5)` | DIRECTOR label | |
| `--vp-home-carousel-credit-col-gap` | `80px` | Gap between credit columns | |
| `--vp-home-carousel-counter-muted` | `rgba(255,255,255,0.6)` | Counter numerals + rule | |
| `--vp-home-carousel-scrim` | symmetric `rgba(0,0,0,0.3)` vignette | Desktop overlay scrim | Mobile keeps prior bottom-weighted scrim. |

**Font note (not a CSS colour token):** all display headings use `--font-vp-heading` (Special Gothic Expanded One primary → Zalando Sans Expanded Vietnamese-glyph fallback → system-ui). Never set `--font-vp-heading-fallback` alone as `font-family`. Sitewide Zalando licensing remains an open product decision — see `candidate-tokens.md`.

---

## Shared mobile media overlay (`--vp-overlay-mobile-*`)

Proven across home carousel ≤767, work-index cards, blog hero title gap, case carousel overlay, and project-nav (where values already matched). On `:root` in `globals.css`.

| Token | Value | Usage | Notes |
|---|---|---|---|
| `--vp-overlay-mobile-title-size` | `28px` | Campaign title — home ≤767; work cards ≥576 | Work ≤575 uses `--vp-candidate-work-index-mobile-title-size` (18px) |
| `--vp-overlay-mobile-caption-size` | `12px` | Brand / format / counter captions | |
| `--vp-overlay-mobile-pad-inline` | `16px` | Overlay L/R inset (+ shared case gutters via alias) | |
| `--vp-overlay-mobile-pad-block` | `40px` | Overlay top/bottom inset | Homepage adds safe-area on bottom |
| `--vp-overlay-mobile-title-tag-gap` | `12px` | Brand-row → campaign | Half of desktop home 24px. **Not** case header (`0.35rem` — intentional split) |

---
## Colour Palette

### Core

| Token | Value | Usage |
|---|---|---|
| `vp-black` | `#000000` | Pure black — page chrome, primary button text |
| `vp-black-rgb` | `0, 0, 0` | Channel form for `rgba(var(--vp-black-rgb), α)` overlays/scrims |
| `vp-bg` | `var(--vp-black)` / `#000000` | Page background |
| `vp-text` | `#ffffff` | Primary text — pure white |
| `vp-text-muted` | `rgba(255,255,255,0.85)` | Secondary text, filter labels |
| `vp-text-soft` | `rgba(255,255,255,0.75)` | Tertiary text |

### Accent

| Token | Value | Usage |
|---|---|---|
| `vp-link` | `#fdb913` | Links, interactive accent — yellow |
| `vp-link-hover` | `#e09f02` | Link hover state |
| `vp-orange` | `#f04e23` | Brand orange — **also** desktop nav hamburger cell + work close cell fill (formerly candidate `nav-accent-orange`; identical hex, no duplicate token) |

### Borders

| Token | Value | Usage |
|---|---|---|
| `vp-border` | `rgba(255,255,255,0.6)` | Default borders (filter tabs, etc.) |
| `vp-border-strong` | `rgba(255,255,255,0.95)` | Active/hover border state |
| `vp-border-soft` | `rgba(255,255,255,0.12)` | Subtle dividers, card borders |
| `vp-struct-line` | `1px solid rgba(255,255,255,0.15)` | Nav cell hairlines + chrome rules — **intentionally stronger** than `vp-border-soft` (0.12); keep both |

### Sitewide nav chrome

Proven across every page via `NavBar.tsx` / `#header`. CSS vars on `:root` in `globals.css`.

| Token | Value | Usage |
|---|---|---|
| `--vp-nav-bar-height` | `80px` | Desktop `#header` min-height (intentional vs Figma `100px`) |
| `--vp-nav-bar-height-mobile` | `64px` | `#header` ≤767.98 (promoted from candidate) |
| `--vp-nav-cell-width` | `94px` | EN / 中文 / hamburger cell width (height tracks bar; not square) |
| `--vp-nav-cell-tracking` | `0` | Lang-cell letter-spacing (was −0.28px) |

### Mobile nav panel

Scoped on `#header .vp-mobile-nav-panel__inner` (≤991.98). Promoted from candidates.

| Token | Value | Usage |
|---|---|---|
| `--vp-mobile-nav-link-size` | `32px` | Panel link labels |
| `--vp-mobile-nav-list-gap` | `32px` | List gap |
| `--vp-mobile-nav-list-pad-inline` | `30px` | List / search / CTA pad |
| `--vp-mobile-nav-list-pad-block` | `60px` | List block pad |
| `--vp-mobile-nav-social-row-height` | `80px` | Social row |
| `--vp-mobile-nav-cta-height` | `80px` | Brief CTA row |

### Circular glass chrome chips

`:root` — work SEARCH/FILTER + blog filter trigger. Promoted from candidates.

| Token | Value | Usage |
|---|---|---|
| `--vp-chrome-chip-size` | `2.75rem` | Chip box |
| `--vp-chrome-chip-icon-size` | `1.25rem` | Chip icon |
| `--vp-chrome-chip-radius` | `9999px` | Pill |
| `--vp-chrome-chip-border` | `1px solid var(--vp-border-soft)` | Glass border |
| `--vp-chrome-chip-bg` | `var(--vp-overlay-dark)` | Glass fill |

### Filter sheet

`:root` — work + blog mobile filter dim/panel. Promoted from candidates.

| Token | Value | Usage |
|---|---|---|
| `--vp-filter-dim` | `rgba(0,0,0,0.7)` | Backdrop |
| `--vp-filter-panel-bg` | `#0f0f0f` | Panel fill |
| `--vp-filter-panel-max-height` | `76vh` | BottomSheet panel max-height |
| `--vp-filter-term-muted` | `rgba(255,255,255,0.2)` | Inactive term rows (mobile filter) |
| `--vp-search-muted` | `rgba(255,255,255,0.4)` | Work SEARCH label |
| `--vp-index-inactive` | `rgba(255,255,255,0.3)` | Work slide-num inactive ink |

### Shared section type (D7)

`:root` — about, contact CTA, VPS featured header, CornerFrame. Work-index brand yellow uses `--vp-link` (same hex as homepage `--vp-home-carousel-brand-accent`). About light sections were retired; no light-surface ink tokens.

| Token | Value | Usage |
|---|---|---|
| `--vp-section-display-size` | `64px` | Section headings (desktop) |
| `--vp-section-display-size-mobile` | `30px` | Section headings (mobile) |
| `--vp-section-display-lh` | `1.1` | Section heading line-height |
| `--vp-feature-title-size` | `40px` | Feature / workflow titles; VPS guide CTA |
| `--vp-feature-title-lh` | `1.2` | same |
| `--vp-eyebrow-size` | `16px` | Eyebrow labels (desktop) |
| `--vp-eyebrow-size-mobile` | `12px` | Eyebrow labels (mobile) |
| `--vp-eyebrow-lh` | `1.6` | Eyebrow line-height |
| `--vp-eyebrow-gap` | `0.5em` | Dot → label gap |
| `--vp-dek-size` | `22px` | Dek / contact CTA body |
| `--vp-dek-lh` | `1.6` | same |
| `--vp-step-size` | `14px` | Step nums, hero caption type |
| `--vp-step-lh` | `20px` | same |
| `--vp-frame-inset` | `15px` | CornerFrame outset (desktop) |
| `--vp-frame-inset-mobile` | `8px` | CornerFrame outset (mobile) |
| `--vp-muted-50` | `rgba(255,255,255,0.5)` | Soft body on black (contact CTA, About dek) |

### Shared structure ticks / lines

Promoted from brief candidates; reused by corner frames, contact, about, brief.

| Token | Value | Usage |
|---|---|---|
| `--vp-struct-tick-size` | `12px` (≤767: `8px`) | Corner tick length |
| `--vp-struct-tick-stroke` | `1px` | Corner tick thickness |
| `--vp-struct-tick-color` | `rgba(255,255,255,0.3)` | Corner tick ink |
| `--vp-line-color` | `rgba(255,255,255,0.15)` | Hairline color (pairs with `--vp-struct-line` border shorthand) |
| `--vp-muted-30` | `rgba(255,255,255,0.3)` | Muted label/ink |

### Site footer — mobile

Scoped in `site-footer.css` ≤575. Promoted from candidates.

| Token | Value | Usage |
|---|---|---|
| `--vp-site-footer-mobile-band-height` | `80px` | Mark + socials band |
| `--vp-site-footer-mobile-email-size` | `16px` | Email link |

---

### Overlays

| Token | Value | Usage |
|---|---|---|
| `vp-overlay-dark` | `rgba(var(--vp-black-rgb), 0.45)` | Hero image overlays; chrome-chip bg |
| `vp-overlay-light` | `rgba(255,255,255,0.1)` | Hover states on dark surfaces |

### Form & Input

| Token | Value | Usage |
|---|---|---|
| `vp-input-bg` | `rgba(255,255,255,0.08)` | Input field background |
| `vp-input-bg-focus` | `rgba(255,255,255,0.12)` | Input field background on focus |
| `vp-input-border` | `rgba(255,255,255,0.25)` | Input field border |
| `vp-input-border-focus` | `rgba(255,255,255,0.5)` | Input field border on focus |
| `vp-form-label` | `rgba(255,255,255,0.9)` | Form labels |
| `vp-form-helper` | `rgba(255,255,255,0.78)` | Helper/hint text |
| `vp-form-error` | `#ff5c5c` | Error text |
| `vp-form-error-bg` | `rgba(255,92,92,0.16)` | Error field background |
| `vp-form-error-border` | `rgba(255,92,92,0.95)` | Error field border |

### Button

Yellow hover (sitewide `.vp-btn`): `--vp-btn-yellow-hover` = `#ffcb55` (promoted from brief candidate).

| State | Background | Text | Border |
|---|---|---|---|
| Primary default | `#ffffff` | `#000000` (`vp-black`) | — |
| Primary hover | `#a6a6a6` | `#000000` (`vp-black`) | — |
| Ghost (hero slide) | `rgba(255,255,255,0.08)` | `#ffffff` | `rgba(255,255,255,0.25)` |
| Ghost hover | `rgba(255,255,255,0.12)` | `#ffffff` | `rgba(255,255,255,0.5)` |

### Miscellaneous

| Value | Usage |
|---|---|
| `#5c5c5c` | Brand logo grid cell borders |
| `#bfbfbf` | Credits section text (muted grey) |
| `rgba(255,255,255,0.4)` | Credit role labels |
| `rgba(var(--vp-black-rgb), 0.2)` | Hero carousel image overlay (light) |
| `rgba(var(--vp-black-rgb), 0.4)` | Dropdown menu background |
| Transparent | Navbar (no backdrop fill) |
| `#111` | Search card thumbnail placeholder background |

---

## Typography

### Font Family

| Token | Value | Role |
|---|---|---|
| `vp-font-sans` / `--font-vp-sans` | `"Mona Sans", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif` | Body / UI (`font-vp-sans`) |
| `vp-font-heading` / `--font-vp-heading` | `"Special Gothic Expanded One", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif` | Display h1 only (`font-vp-heading`) |

Loaded via `next/font/google` in `src/lib/fonts.ts` (self-hosted at build time). Do not `@import` Google Fonts in CSS — the pipeline strips external `@import` urls. Face names are used directly in the stacks (do not compose from next/font’s size-adjusted CSS variables).

CJK (Chinese) has no separate font token: both faces are latin/latin-ext (Mona also loads `vietnamese`); CJK glyphs fall through to the system stack.

### Font Weights Loaded (Mona Sans)

| Weight | Usage |
|---|---|
| 300 | Intro / quote / hero description copy (kept Light) |
| 400 | Body copy, lists, nav links (default) |
| 700 | Headings (h2–h4), footer email, bold UI |

Special Gothic Expanded One ships **400 only**. Display h1s may still carry `font-bold` / `font-extrabold` classes — those are intentional no-ops against the single Regular face.

Do **not** load Mona 500 / 600 / 800 / 900. Prefer remapping UI that needs emphasis to 700.

### Heading Scale

Display h1 (Special Gothic Expanded One via `font-vp-heading`): uppercase, ~59px desktop / ~34px mobile.

| Element | Size | Face |
|---|---|---|
| Display / hero / entry h1 | `var(--vp-display-title-size)` / `text-vp-display` — `clamp(2.1rem, 4.65vw, 3.7rem)` (~34–59px) | `font-vp-heading` |
| Section h2 | `clamp(1.75rem, 2.5vw, 2.25rem)` (~28–36px) | Mona Sans |
| Portable Text h3 | `clamp(1.5rem, 2.2vw, 1.75rem)` (~24–28px) | Mona Sans, weight 700 |
| Portable Text h4 | `clamp(1.15rem, 1.4vw, 1.25rem)` (~18–20px) | Mona Sans, weight 700 |

### Display / Hero Sizes

Title scales are **tiered** — smaller heroes must not inherit the largest band.

| Token / utility | Value | Use for |
|---|---|---|
| `--vp-display-title-size` / `text-vp-display` | `clamp(2.1rem, 4.65vw, 3.7rem)` | Blog post H1, case campaign H1, news H1 (~7% under prior blog max 4rem) |
| `--vp-page-hero-title-size` / `text-vp-page-hero` | `clamp(2.21rem, 4vw, 3.2rem)` | PageHero, about, campaign-brief, mobile nav (~7% under prior 2.375–3.4375) |
| `--vp-media-overlay-title-size` | `clamp(1.63rem, 3.72vw, 2.79rem)` | Static titles on video frames — `.vp-blog-hero__campaign` only (~7% under prior 1.75–3rem) |
| Tracking | `0` on all three (`--vp-*-title-tracking` / `tracking-vp-display` / `tracking-vp-page-hero`) | Special Gothic floor |
| Classes | `.vp-display-title`, `.vp-page-hero-title` | Prefer over one-off clamps |
| Intro / quote / hero desc | `clamp(1.25rem, 2.2vw, 1.75rem)` (~20–28px), weight 300 | |
| Search empty title | `clamp(2rem, 4vw, 3.5rem)` | unchanged |
| Search card title | `clamp(1.5rem, 1.9vw, 2.4rem)` — `line-height: 0.98` | unchanged |
| Case carousel title (portfolio + blog multi) | `2rem` | unchanged — never inherit display/media-overlay |
| About “How we move” / tabbed panel | `clamp(2.325rem, 4.07vw, 3.49rem)` | ~7% under prior 2.5–3.75 |
| Project-nav “Previous/Next” label | `3.72rem` / `2.325rem` mobile | ~7% under prior 4rem / 2.5rem |

### Letter Spacing Tokens

| Token | Value | Usage |
|---|---|---|
| `vp-navbar-link-spacing` | `0.125rem` | Nav and dropdown links |
| `vp-uppercase-spacing` | `0.08em` | Filter tabs, filterbar selects |
| `vp-heading-spacing` / `--tracking-vp-heading` | `0` | General headings (neutral; Special Gothic floor) |
| `vp-display-title-tracking` / `--tracking-vp-display` | `0` | Display / page-hero titles |

**Rule:** Special Gothic Expanded One (`font-vp-heading`) must not use negative letter-spacing. Minimum is `0` (default). Positive tracking (e.g. buttons, uppercase UI) is fine.

### UI Text Sizes

| Context | Size | Weight | Notes |
|---|---|---|---|
| Nav links | `1rem` | 400 | Uppercase |
| Dropdown items | `0.875rem` | — | Uppercase |
| Filter tab labels | `0.75rem` | 600→nearest 700 | Uppercase |
| Filter bar labels | `0.9rem` | 600→nearest 700 | Uppercase |
| Footer email | `1.25rem` (`text-xl`) | 700 | |
| Credits body | `0.9rem` | — | |
| Credits dept label | `1.125rem` | 700 | Uppercase |
| Credits role label | `0.75rem` | 700 | Uppercase, `rgba(255,255,255,0.4)` |
| Search card meta | `0.8rem` | 700 | Uppercase, `letter-spacing: 0.06em` |
| Search card excerpt | `0.98rem` | — | `line-height: 1.45` |

---

## Spacing & Layout

### Section Vertical Padding

| Token | Value | Usage |
|---|---|---|
| `vp-section-y` | `7rem` | Default section padding |
| `vp-section-y-tight` | `3.5rem` | Tight sections |
| `vp-section-y-loose` | `6.5rem` | Loose sections |
| `vp-section-y-header-condensed` | `9.5rem` | Page header (no hero) top padding |

**Mobile override** (`max-width: 575.98px`): `--vp-section-y` (and `--spacing-vp-section-y`) collapse to `5rem` so `SectionWrapper`’s `py-[var(--vp-section-y)]` picks it up. Live values are in `src/app/globals.css`.

### Navbar

| Property | Value |
|---|---|
| Padding | `1.1rem 0.625rem` |
| Nav link padding X | `1rem` |
| Logo height (desktop) | `90px` |
| Logo height (tablet, ≤767px) | `51px` |
| Logo height (mobile, ≤575px) | `46px` |
| Navbar backdrop | Fully transparent (no scrim / blur) |

### Footer

| Property | Value |
|---|---|
| Padding | `4rem 0` |
| Social icon size | `1.25rem` |

### Portfolio Cards

| Property | Value |
|---|---|
| Card image hover scale | `scale(1.03)` |
| Card image transition | `0.35s ease` |
| Card overlay gradient | `rgba(var(--vp-black-rgb), 0.75)` → `rgba(var(--vp-black-rgb), 0)` bottom to top, `height: 45%` |
| Card title padding | `1.25em 1em 0.75em` |
| Load spinner size | `40px`, border `3px` |
| Load more sentinel height | `120px` |

### Portfolio Filter Bar

| Property | Value |
|---|---|
| Filter tab padding | `0.45rem 0.9rem` |
| Filter bar gap | `0.75rem` |
| Filter group min-width | `200px` |
| Filter group gap | `0.35rem` |

### Credits Layout (Single Portfolio)

| Property | Value |
|---|---|
| Grid columns | `140px 1fr` (desktop), `1fr` (mobile) |
| Column gap | `1.5rem` |
| Row padding | `0.25rem 0` |

---

## Transitions & Animation

| Token | Value | Usage |
|---|---|---|
| `vp-transition` / `duration-vp-default` | `0.3s ease` / `300ms` | **Official interactive shade timing** — link/button/icon `color`, `background`, `border-color`, `opacity`, brightness `filter` |
| `vp-transition-fast` / `duration-vp-fast` | `0.15s ease` / `150ms` | Micro UI only (e.g. nav dropdown opacity+transform). **Not** for hover shade |
| `vp-transition-card` | `0.35s ease` | Card image / larger surface motion |
| `vp-transition-spin` | `0.8s linear` | Load spinner |
| `vp-transition-card-reveal` | `0.45s ease forwards` | Portfolio card entrance |

### Interactive shade convention

- **In scope:** hover/focus changes to color, background, border-color, opacity, or brightness-like filter on links, icons, buttons, and similar chrome.
- **Out of scope:** transform, layout, carousel snap, sheet/nav open-close, route overlays, scroll reveals.
- **CSS:** `transition: color var(--vp-transition);` (list only the shade properties that change).
- **Tailwind:** `transition-colors duration-vp-default` or `transition-opacity duration-vp-default` (prefer a CSS `var(--vp-transition)` rule when reliability matters).

### Named Animations

**`vpSpin`** — infinite rotation, `0.8s linear`
Used on: load spinner

**`vpCardReveal`** — `opacity: 0, translateY(8px)` → `opacity: 1, translateY(0)`, `0.45s ease forwards`
Used on: portfolio cards as they load in

### Dropdown Animation

Desktop: `opacity` + `transform` via `var(--vp-transition-fast)` (see `.navbar .dropdown .dropdown-menu` in `globals.css`).
Mobile: `max-height` / `opacity` / `transform` open-close choreography (hard-coded 0.24s / 0.18s — motion UI, not shade).

---

## Breakpoints

Inherited from Bootstrap 5.3 — these are the breakpoints used throughout the stylesheet.

| Name | Max-width value | Notes |
|---|---|---|
| `xs` | `575.98px` | Small phones |
| `sm` | `767.98px` | Mobile / large phones |
| `md` | `991.98px` | Tablets |
| `lg` | `1199.98px` | Small desktops |

In Tailwind config, these should be defined as custom breakpoints to match the existing site's responsive behaviour exactly.

---

## Border Radius

The site is deliberately **sharp-edged** for most UI. Almost everything has `border-radius: 0`.

| Exception | Value |
|---|---|
| Buttons (primary / ghost / form attach) | `9999px` (pill) |
| Search result cards | `0.5rem` |
| Mobile nav link hover pills | `4px` |
| Load spinner | `50%` (circle) |
| Language switcher flag images | `50%` (circle) |
| Comment list items | `0.25rem` |

Inputs, filter tabs, modals, dropdowns: `border-radius: 0`

**Button type:** Special Gothic Expanded One (`font-vp-heading` / `--vp-font-heading`), uppercase, pill corners.

---

## Special Visual Treatments

### Navbar Backdrop
Navbar chrome is fully transparent — no `::before` scrim, blur, or fade mask. Contrast comes from type/icons and the bottom hairline only.

### Outline Text Effect
`.vp-outline` — text rendered as a white outline with transparent fill:
```
color: transparent
-webkit-text-stroke: 1px #fff
```
Used in hero headings and page hero titles for typographic contrast.

### Portfolio Card Overlay
Bottom-anchored gradient overlay on thumbnail images, covering the lower 45% of the card:
```
background: linear-gradient(to top, rgba(var(--vp-black-rgb), 0.75), rgba(var(--vp-black-rgb), 0))
```
Title text sits above this overlay, centred, uppercase, white.

### Brand Logo Grid
Client logos displayed at 70% scale within their grid cells (`transform: scale(0.7)`), with `#5c5c5c` cell borders and zero gap between cells.

---

## Notes for Tailwind / @theme

Tokens live in `src/app/globals.css` (`@theme` for utilities, `:root` `--vp-*` for custom CSS). When adding new ones:

- Prefer `@theme` `--color-vp-*`, `--font-vp-*`, `--duration-vp-*`, etc. so utilities generate automatically (Tailwind v4 — no `tailwind.config.js` colour extend needed for these)
- Custom CSS should use semantic `:root` aliases (`--vp-link`, `--vp-transition`, …), not raw hex / hard-coded timings for interactive shade
- Interactive shade: `duration-vp-default` (utilities) or `var(--vp-transition)` (CSS) — keep both at 300ms / 0.3s ease
- Do not use Tailwind's default colour palette in components — only `vp-*` tokens
- Set sharp corners via `--radius: 0` (already in `@theme`)
- Screens already mirror Bootstrap breakpoints in `@theme`

---

## Form & File Block Tokens

Historical form tokens (many superseded by brief candidates / promoted chrome). Prefer live values in `campaign-brief-form.css` and `:root` in `globals.css`.

### Campaign Brief Form

| Token | Value | Usage |
|---|---|---|
| `vp-form-gap` | `1rem` | Column gap |
| `vp-form-row-gap` | `1.5rem` | Row gap |
| `vp-form-label-size` | `1rem` | Label font size |
| `vp-form-label-weight` | `500` | Label weight |
| `vp-form-label-height` | `2.6rem` | Desktop label block height |
| `vp-form-input-min-height` | `2.625rem` | Input min height |
| `vp-form-input-padding` | `0.5rem 0.9rem` | Input padding |
| `vp-form-input-size` | `0.9rem` | Input font size |
| `vp-form-placeholder` | `rgba(255,255,255,0.5)` | Placeholder |
| `vp-form-helper-muted` | `rgba(255,255,255,0.55)` | Descriptions |
| `vp-form-option-label` | `rgba(255,255,255,0.72)` | Radio/checkbox labels |
| `vp-form-focus-border` | `rgba(255,255,255,0.4)` | Focus border |
| `vp-form-textarea-min-height` | `120px` | Textarea |
| `vp-form-dropzone-min-height` | `224px` | File dropzone |
| `vp-form-step-circle-size` | `2.25rem` | Mobile step indicator |
| `vp-form-step-border` | `rgba(255,255,255,0.45)` | Step outline |
| `vp-form-step-completed-bg` | `rgba(255,255,255,0.2)` | Completed step circle |
| `vp-form-step-pending-text` | `rgba(255,255,255,0.7)` | Pending step number |
| `vp-form-validation-border` | `rgba(255,92,92,0.7)` | Validation box border |
| `vp-form-validation-bg` | `rgba(255,92,92,0.12)` | Validation box bg |
| `vp-btn-letter-spacing` | `0.125rem` | Button letter-spacing |
| `vp-btn-select-files-spacing` | `0.05em` | Select files button |
| `vp-btn-padding` | `0.75rem 2rem` | Form button padding |
| `vp-btn-font-size` / `text-vp-btn` | `1.3rem` | Default button label size (yellow chrome + white pills) |
| `vp-btn-line-height` / `leading-vp-btn` | `1.625rem` | Default button line-height |
| `vp-btn-arrow-size` | `1.4625rem` | BriefArrow / Explore diagonal glyph |
| `vp-btn-ghost-hover-bg` | `rgba(255,255,255,0.1)` | Ghost button hover |
| `vp-btn-primary-hover-soft` | `rgba(255,255,255,0.85)` | Select-files hover |

**Ghost "Previous" button variant** (not covered by primary/ghost tokens above):

| Property | Value |
|---|---|
| Background | `transparent` |
| Border | `1px solid #ffffff` |
| Hover background | `vp-btn-ghost-hover-bg` (`rgba(255,255,255,0.1)`) |

**Layout behaviours to replicate:**

| Region | Behaviour |
|---|---|
| Form wrapper | Full width; `margin-bottom: 3rem` (2.5rem on xs) |
| 12-column field grid | Desktop: CSS grid, `column-gap: vp-form-gap`, `row-gap: vp-form-row-gap`; field widths 3–12 cols; section/page/hidden fields full width |
| Mobile (≤767px) | Block flow; `0.85rem` field margin; `2rem` padding below step title |
| Label alignment | Desktop: fixed `vp-form-label-height`, `align-items: flex-end` |
| Name fields | 2-col sub-grid desktop; single column mobile |
| Step navigation | Desktop: text labels + ✓/●/○ via `::before`; mobile: numbered circles (`vp-form-step-circle-size`) + active step heading |
| Validation summary | Top hidden by default; rendered above footer; 50% width right-aligned (66.67% tablet, 100% mobile) |
| Footer buttons | Flex right, `gap: 0.75rem`, `margin-top: 2rem`; full-width stacked on xs |
| File dropzone | Dashed border, `min-height: vp-form-dropzone-min-height`, FA cloud icon; hide drag text on mobile |

**Interaction states:** Focus uses `vp-input-bg-focus` and `vp-form-focus-border`; required asterisk uses `vp-link`; error fields use `vp-form-error`, `vp-form-error-border`, `vp-form-error-bg`; completed steps ✓ white, active step ● + 2px underline, pending ○ muted.

### File Block

| Token | Value | Usage |
|---|---|---|
| `vp-file-block-padding-top` | `1.25rem` | Spacing above block |
| `vp-file-block-button-gap` | `1.25rem` | Filename-to-button gap |

**Layout:** Filename and download button inline; button `margin-left: vp-file-block-button-gap`. Filename at h3 scale (`clamp(1.5rem, 2vw, 1.75rem)`, weight 700, uppercase). Download button uses primary white styling with `vp-btn-padding` and `vp-btn-letter-spacing`; hover `#a6a6a6`.