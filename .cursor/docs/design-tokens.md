# Design Tokens — Vantage Pictures

Extracted directly from `wp-content/themes/vantagepictures-child/style.css`. These are the authoritative visual values for the new Next.js build. All values must be translated into `tailwind.config.js` as named tokens. Never use raw hex values or arbitrary numbers in component code — always reference token names.

---

## Colour Palette

### Core

| Token | Value | Usage |
|---|---|---|
| `vp-bg` | `#000000` | Page background — pure black |
| `vp-text` | `#ffffff` | Primary text — pure white |
| `vp-text-muted` | `rgba(255,255,255,0.85)` | Secondary text, filter labels |
| `vp-text-soft` | `rgba(255,255,255,0.75)` | Tertiary text |

### Accent

| Token | Value | Usage |
|---|---|---|
| `vp-link` | `#f9db24` | Links, interactive accent — yellow |
| `vp-link-hover` | `#d7bf1f` | Link hover state |

### Borders

| Token | Value | Usage |
|---|---|---|
| `vp-border` | `rgba(255,255,255,0.6)` | Default borders (filter tabs, etc.) |
| `vp-border-strong` | `rgba(255,255,255,0.95)` | Active/hover border state |
| `vp-border-soft` | `rgba(255,255,255,0.12)` | Subtle dividers, card borders |

### Overlays

| Token | Value | Usage |
|---|---|---|
| `vp-overlay-dark` | `rgba(0,0,0,0.45)` | Hero image overlays |
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

| State | Background | Text | Border |
|---|---|---|---|
| Primary default | `#ffffff` | `#000000` | — |
| Primary hover | `#a6a6a6` | `#000000` | — |
| Ghost (hero slide) | `rgba(255,255,255,0.08)` | `#ffffff` | `rgba(255,255,255,0.25)` |
| Ghost hover | `rgba(255,255,255,0.12)` | `#ffffff` | `rgba(255,255,255,0.5)` |

### Miscellaneous

| Value | Usage |
|---|---|
| `#5c5c5c` | Brand logo grid cell borders |
| `#bfbfbf` | Credits section text (muted grey) |
| `rgba(255,255,255,0.4)` | Credit role labels |
| `rgba(0,0,0,0.2)` | Hero carousel image overlay (light) |
| `rgba(0,0,0,0.4)` | Dropdown menu background |
| `rgba(0,0,0,0.65–0)` | Navbar gradient (top to transparent) |
| `#111` | Search card thumbnail placeholder background |

---

## Typography

### Font Family

| Token | Value |
|---|---|
| `vp-font-sans` | `"Poppins", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif` |

**Poppins must be loaded from Google Fonts.** It is the only external font. No other typefaces are used.

### Font Weights in Use

| Weight | Usage |
|---|---|
| 300 | Body copy, nav links, general paragraphs |
| 400 | Credit names |
| 500 | Footer links |
| 600 | Buttons, filter labels, uppercase UI elements |
| 700 | Headings (default), section titles, card titles, bold UI |
| 800 | Hero copy h1 |
| 900 | Display headings on mobile touch devices (hero, page title, section title) |

### Heading Scale

All headings: uppercase, `font-weight: 700`, `letter-spacing: 0.01em`, `line-height: 1.1`

| Element | Size |
|---|---|
| `h1` | `clamp(2rem, 3vw, 2.75rem)` |
| `h2` | `clamp(1.75rem, 2.5vw, 2.25rem)` |
| `h3` | `clamp(1.5rem, 2vw, 1.75rem)` |
| `h4` | `1.35rem` |
| `h5` | `1.15rem` |
| `h6` | `1rem` |

### Display / Hero Sizes

| Context | Size |
|---|---|
| Hero copy h1 | `clamp(2.25rem, 1.25rem + 3vw, 3.75rem)` |
| Page hero title | `clamp(2.25rem, 4vw, 3.75rem)` |
| Search empty title | `clamp(2rem, 4vw, 3.5rem)` |
| Search card title | `clamp(1.5rem, 1.9vw, 2.4rem)` — `line-height: 0.98`, `letter-spacing: -0.02em` |

### UI Text Sizes

| Context | Size | Weight | Notes |
|---|---|---|---|
| Nav links | `0.875rem` | 300 | Uppercase |
| Dropdown items | `0.875rem` | — | Uppercase |
| Filter tab labels | `0.75rem` | 600 | Uppercase |
| Filter bar labels | `0.9rem` | 600 | Uppercase |
| Credits body | `0.9rem` | — | |
| Credits dept label | `1.125rem` | 700 | Uppercase |
| Credits role label | `0.75rem` | 700 | Uppercase, `rgba(255,255,255,0.4)` |
| Search card meta | `0.8rem` | 700 | Uppercase, `letter-spacing: 0.06em` |
| Search card excerpt | `0.98rem` | — | `line-height: 1.45` |

### Letter Spacing Tokens

| Token | Value | Usage |
|---|---|---|
| `vp-navbar-link-spacing` | `0.125rem` | Nav and dropdown links |
| `vp-uppercase-spacing` | `0.08em` | Filter tabs, filterbar selects |
| `vp-heading-spacing` | `0.01em` | All headings |

---

## Spacing & Layout

### Section Vertical Padding

| Token | Value | Usage |
|---|---|---|
| `vp-section-y` | `4.5rem` | Default section padding |
| `vp-section-y-tight` | `3.5rem` | Tight sections |
| `vp-section-y-loose` | `5.5rem` | Loose sections |
| `vp-section-y-header-condensed` | `9.5rem` | Page header (no hero) top padding |

**Mobile override** (`max-width: 575.98px`): `vp-section` collapses to `padding: 2rem 0`

### Navbar

| Property | Value |
|---|---|
| Padding | `1.1rem 0.625rem` |
| Nav link padding X | `1rem` |
| Logo height (desktop) | `90px` |
| Logo height (tablet, ≤767px) | `51px` |
| Logo height (mobile, ≤575px) | `46px` |
| Navbar backdrop blur | `blur(16px)` |
| Navbar gradient | `rgba(0,0,0,0.65)` → `rgba(0,0,0,0)` top to bottom |

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
| Card overlay gradient | `rgba(0,0,0,0.75)` → `rgba(0,0,0,0)` bottom to top, `height: 45%` |
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
| `vp-transition-fast` | `0.15s ease` | Colour, border, opacity changes |
| `vp-transition` | `0.2s ease` | Input backgrounds, general UI |

### Named Animations

**`vpSpin`** — infinite rotation, `0.8s linear`
Used on: load spinner

**`vpCardReveal`** — `opacity: 0, translateY(8px)` → `opacity: 1, translateY(0)`, `0.45s ease forwards`
Used on: portfolio cards as they load in

### Dropdown Animation

Desktop: `opacity: 0, translateY(-8px)` → visible, `transition: opacity 0.15s ease, transform 0.15s ease`
Mobile: `max-height: 0, opacity: 0, translateY(-6px)` → `max-height: 480px`, `transition: max-height 0.24s ease, opacity 0.18s ease, transform 0.24s ease`

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

The site is deliberately **sharp-edged**. Almost everything has `border-radius: 0`.

| Exception | Value |
|---|---|
| Search result cards | `0.5rem` |
| Mobile nav link hover pills | `4px` |
| Load spinner | `50%` (circle) |
| Language switcher flag images | `50%` (circle) |
| Comment list items | `0.25rem` |

All buttons, inputs, filter tabs, modals, dropdowns: `border-radius: 0`

---

## Special Visual Treatments

### Navbar Backdrop
The navbar uses a pseudo-element (`::before`) for its background — a gradient + blur combination that fades to transparent at the bottom, so it doesn't create a hard edge over hero content. This must be replicated exactly in the new navbar component.

```
background: linear-gradient(180deg, rgba(0,0,0,0.65), rgba(0,0,0,0))
backdrop-filter: blur(16px)
mask-image: linear-gradient(to bottom, black, transparent)
```

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
background: linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0))
```
Title text sits above this overlay, centred, uppercase, white.

### Brand Logo Grid
Client logos displayed at 70% scale within their grid cells (`transform: scale(0.7)`), with `#5c5c5c` cell borders and zero gap between cells.

---

## Notes for Tailwind Config

When translating these tokens into `tailwind.config.js`:

- Extend the `colors` key with all `vp-*` colour tokens using the exact names above
- Extend `fontFamily` with `vp-sans` pointing to the Poppins stack
- Extend `letterSpacing` with `vp-navbar`, `vp-uppercase`, and `vp-heading`
- Extend `transitionDuration` and `transitionTimingFunction` for `vp-fast` and `vp-default`
- Define custom `screens` matching the Bootstrap breakpoints above
- Set `borderRadius` default to `0` in the theme to match the site's sharp-edged aesthetic
- Do not use Tailwind's default colour palette in components — only `vp-*` tokens

---

## Form & File Block Tokens

Extracted from `video-campaign-brief-form.css` and `file-block.css`. Add to `tailwind.config.js` before building `CampaignBriefForm` and `FileDownloadBlock` components.

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