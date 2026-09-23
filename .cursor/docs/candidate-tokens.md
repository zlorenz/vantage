# Candidate Tokens — Pending Promotion

Values observed in Figma (or proposed structural overrides) that are **not** yet established `--vp-*` tokens in `.cursor/docs/design-tokens.md`. Do **not** add these to `design-tokens.md` / the real `--vp-*` set until confirmed across components.

Naming: `--vp-candidate-[name]`

**Homepage carousel desktop + sitewide nav are locked.** Do not re-open desktop `--vp-home-carousel-*` spacing/type here. **Mobile (≤767) carousel overlay** uses `--vp-candidate-home-carousel-mobile-*` below until confirmed across surfaces.

---

## Homepage carousel — mobile overlay (pending)

| Candidate name | Value | Used in | Source | Status | Notes |
|---|---|---|---|---|---|
| `--vp-candidate-home-carousel-mobile-title-size` | `28px` | `.vp-proto-carousel__campaign` ≤767 | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=2282-27788 | pending | Figma `h2`. Tracking floor 0. |
| `--vp-candidate-home-carousel-mobile-caption-size` | `12px` | Brand, format, counter ≤767 | same | pending | Figma `caption_1` / `caption_2`. |
| `--vp-candidate-home-carousel-mobile-overlay-pad-inline` | `16px` | Overlay L/R + counter `right` ≤767 | same (`px-16`) | pending | |
| `--vp-candidate-home-carousel-mobile-overlay-pad-block` | `40px` | Overlay top/bottom ≤767 | same (`py-40`); credits removed | pending | Bottom = 40px + safe-area. |
| `--vp-candidate-home-carousel-mobile-counter-offset` | `69px` | Counter `top: calc(var(--vp-header-height) + 69px)` | `2282:27788`: center ≈133px − 64px bar | pending | |

**Reuse (no candidate):** `--vp-home-carousel-brand-accent`, `--vp-home-carousel-counter-muted`, `--vp-home-carousel-brand-dot-size`, `--vp-home-carousel-title-tag-gap` (shared on `.vp-proto-carousel` base).

**Dropped for mobile:** credit-col-gap, credit-role-lh, section-gap, Figma −2% tracking.

---

## Site nav — mobile bar (pending)

| Candidate name | Value | Used in | Source | Status | Notes |
|---|---|---|---|---|---|
| `--vp-candidate-nav-bar-height-mobile` | `64px` | `#header.navbar` ≤767.98; hamburger cell 64×64 | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=2282-29325 | pending | Desktop keeps `--vp-nav-bar-height: 80px` ≥768. |

**Reuse (no candidate):** `--vp-orange` hamburger fill; `--vp-struct-line` bar/logo hairlines.

---

## Site nav — mobile panel (pending)

| Candidate name | Value | Used in | Source | Status | Notes |
|---|---|---|---|---|---|
| `--vp-candidate-mobile-nav-link-size` | `24px` | `.vp-desktop-nav-label` inside mobile panel | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=2282-29325 | pending | Figma `h4`. Tracking floor 0. |
| `--vp-candidate-mobile-nav-list-gap` | `32px` | `.vp-mobile-nav-list` | same | pending | |
| `--vp-candidate-mobile-nav-list-pad-inline` | `30px` | List + search + brief/email pad | same | pending | |
| `--vp-candidate-mobile-nav-list-pad-block` | `60px` | `.vp-mobile-nav-list` | same (`py-60`) | pending | |
| `--vp-candidate-mobile-nav-social-row-height` | `80px` | `.vp-mobile-nav-socials` | same | pending | Desktop rail socials stay 100px. |
| `--vp-candidate-mobile-nav-cta-height` | `80px` | `.vp-mobile-nav-brief` | same | pending | Desktop brief stays 100px. |

**Reuse (no candidate):** Panel bg `#0f0f0f` (same as desktop rail); index `12px` / `rgba(255,255,255,0.3)` (desktop rail values); CTA yellow `var(--vp-link)`; index markup via shared `NavRailIndexLabel` / `formatNavRailIndex`.

**Not introduced:** `--vp-candidate-mobile-nav-panel-bg`, `--vp-candidate-mobile-nav-index-size`, `--vp-candidate-mobile-nav-index-color` (reuse above).

---

## Open product decision (not a colour/spacing candidate)

| Name | Value | Used in | Source | Status | Notes |
|---|---|---|---|---|---|
| `--vp-candidate-font-zalando-expanded` | Zalando Sans Expanded | Vietnamese-glyph fallback in `--font-vp-heading` stack | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=77-12462 | adopted — stack fallback only | Loaded as `--font-vp-heading-fallback` and composed second in `--font-vp-heading`. Never used alone as a primary `font-family`. Figma often labels display type “Zalando”; product intent is Special Gothic primary. **Open:** license Zalando sitewide vs keep as VN-only fallback. |

### Closed content note

Language switcher Chinese cell label: `CN` → `中文` (`8df7b0e1`). EN / aria unchanged. Not a style candidate.

### Audit trail (do not implement)

| Candidate name | Value | Status | Notes |
|---|---|---|---|
| `--vp-candidate-home-carousel-counter-beside-left-arrow` | Counter beside LEFT arrow | superseded | Current Figma (`77:12462`) places vertical `01 \| 09` mid-RIGHT. |

---

## Work index / filter — still pending

| Candidate name | Value | Used in | Source | Status | Notes |
|---|---|---|---|---|---|
| `--vp-candidate-search-muted` | `rgba(255,255,255,0.4)` | Work SEARCH label | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=77-12472 | pending | |
| `--vp-candidate-index-inactive` | `rgba(255,255,255,0.3)` | Work slide nums `( 01 )` inactive | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=77-12472 | pending | |
| `--vp-candidate-filter-item-muted` | `rgba(255,255,255,0.25)` | Filter panel term rows | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=84-36076 | pending | |
| `--vp-candidate-filter-panel-bg` | `#0f0f0f` | Work filter slide-out panel | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=84-36076 | pending | Not `--vp-black` (`#000000`). |
| `--vp-candidate-filter-dim` | `rgba(0,0,0,0.7)` | Full-bleed dim behind open filter | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=84-36076 | pending | True-black channel, not `--vp-black-rgb`. |
| `--vp-candidate-tracking-tight-26` | `-0.52px` | Work card title 26px | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=77-12472 | pending | |
| `--vp-candidate-index-card-size` | `512×640` | Work carousel card | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=77-12472 | pending | Aspect 4:5. Impl uses height-driven aspect tokens instead. |
| `--vp-candidate-index-card-gap` | `30px` | Gap between work cards | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=77-12472 | pending | |
| `--vp-candidate-index-overlay-pad` | `30px` inline / `48px` bottom | Work active-card copy inset | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=77-12472 | pending | |
| `--vp-candidate-index-title-size` | `26px` / bold / uppercase | Work card campaign title | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=77-12472 | pending | |
| `--vp-candidate-filter-count-size` | `9px` | `[ 100 ]` count badges on filter triggers (mobile top FILTER + desktop) | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=2282-28478 | pending | Snapped from Figma ≈9.03px (Work `2282:28478` / prior `77:12472`). Decision 7 — cleaner 9px. |
| `--vp-candidate-work-index-mobile-chrome-pad-block` | `24px` | Mobile SEARCH/FILTER top row `padding-block` ≤575 | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=2282-28478 | pending | Figma `py-24`. Inline pad reuses `--vp-candidate-home-carousel-mobile-overlay-pad-inline` (16px). |
| `--vp-candidate-work-index-mobile-card-gap` | `20px` | Embla slide gap ≤575 | same | pending | Figma gap between 320 cards. Aspect stays CDN 2:3. |
| `--vp-candidate-work-index-mobile-height-scale` | `0.84` | `.vp-portfolio-index` `--vp-index-height-scale` ≤575 | phone QC (Zacharia: posts a little larger) | pending | Was 0.76 (Figma 520-face tune); bumped for usable peeks. Still 2:3. |
| `--vp-candidate-work-index-mobile-title-size` | `22px` | Campaign title ≤575 | same | pending | Figma `h5`. Tracking floor 0. |
| `--vp-candidate-work-index-mobile-overlay-pad-inline` | `15px` | Active card copy inset L/R ≤575 | same | pending | Figma `px-15`. |
| `--vp-candidate-work-index-mobile-overlay-pad-block` | `30px` | Active card copy inset bottom ≤575 | same | pending | Figma `pb-30`. |
| `--vp-candidate-work-index-mobile-brand-gap` | `24px` | Brand \| category gap ≤575 | same | pending | |
| `--vp-candidate-work-index-mobile-copy-stack-gap` | `20px` | Brand row → title ≤575 | same | pending | |
| `--vp-candidate-work-index-mobile-filter-panel-height` | `76vh` | Work filter BottomSheet max-height | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=2282-28724 | pending | Figma panel 667/874 ≈ 76%. |
| `--vp-candidate-work-index-mobile-term-muted` | `rgba(255,255,255,0.2)` | Inactive term rows in mobile work filter | same | pending | Distinct from desktop `--vp-candidate-filter-item-muted` (0.25). |
| `--vp-candidate-work-index-mobile-tab-pad-inline` | `8px` (impl) / Figma `16px` | ~~Taxonomy tab pad~~ — **superseded** | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=2282-28724 | superseded | Phone QC Fix 2 removed horizontal tabs; root→nested drill restored. Keep logged for audit. |
| `--vp-candidate-work-index-mobile-tab-pad-block` | `20px` | ~~Taxonomy tab pad-block~~ | same | superseded | Same — tabs removed. |
| `--vp-candidate-filter-panel-width` | `530px` | Open filter panel | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=84-36076 | pending | |
| `--vp-candidate-index-peer-scrim` | `rgba(0,0,0,0.2–0.5)` even wash on inactive cards | Work peek cards | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=77-12472 | pending | Active card has no wash; text sits on open media + corner brackets. |

---

## Blog single — pull quote (pending)

| Candidate name | Value | Used in | Source | Status | Notes |
|---|---|---|---|---|---|
| `--vp-candidate-pull-quote-size` | `24px` / Mona 600 / lh 1.6 / tracking `-0.48px` | `.vp-pull-quote__text` | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=2281-13297 | pending | Figma `quotes` token. |
| `--vp-candidate-pull-quote-attribution-size` | `16px` / heading bold / lh 1.6 / tracking `0` | `.vp-pull-quote__attribution` | same | pending | Figma `caption_1` had −0.32px; product floor is 0 for Special Gothic. |
| `--vp-candidate-pull-quote-panel-bg` | `rgba(255,255,255,0.1)` | `.vp-pull-quote__panel` | same | pending | |
| `--vp-candidate-pull-quote-attribution-color` | `rgba(255,255,255,0.5)` | `.vp-pull-quote__attribution` | same | pending | |
| `--vp-candidate-pull-quote-headshot` | `324px` square | `.vp-pull-quote__headshot` | same | pending | |

## Blog single — image pair (pending)

| Candidate name | Value | Used in | Source | Status | Notes |
|---|---|---|---|---|---|
| `--vp-candidate-image-pair-caption-bg` | `rgba(255,255,255,0.1)` | `.vp-image-pair__caption` | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=2281-12989 | pending | |
| `--vp-candidate-image-pair-caption-color` | `rgba(255,255,255,0.6)` | `.vp-image-pair__caption` | same | pending | |

## Blog single — body typography (pending)

| Candidate name | Value | Used in | Source | Status | Notes |
|---|---|---|---|---|---|
| `--vp-candidate-blog-body-size` | `22px` / `1.375rem` | `.vp-blog-post__prose` p/ul/ol | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=2281-12954 | pending | Figma `body_large`. Not sitewide `--vp-text-*` size. |
| `--vp-candidate-blog-body-color` | `rgba(255,255,255,0.6)` | same | same | pending | Distinct from `--vp-text-muted` (0.85) / `--vp-text-soft` (0.75). |
| `--vp-candidate-blog-body-lh` | `1.6` | same | same | pending | |
| `--vp-candidate-blog-h2-size` | `48px` / `3rem` | `.vp-blog-post__prose` h2+h3 | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=2281-12971 | pending | Frame uses same `h2` token on 2281:13022 (“Designing for Continuity”); CMS h3 section titles get this too. |
| `--vp-candidate-blog-h2-lh` | `1.2` | same | same | pending | |
| `--vp-candidate-blog-h2-tracking` | `-0.96px` | same | same | pending | Figma letterSpacing −2% of 48px. Exception to Special Gothic tracking floor 0. |

## Blog single — hero band (pending)

| Candidate name | Value | Used in | Source | Status | Notes |
|---|---|---|---|---|---|
| `--vp-candidate-blog-rail-width` | `327px` | `.vp-blog-hero__rail` | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=2281-12897 | pending | |
| `--vp-candidate-blog-pill-bg` | `rgba(255,255,255,0.1)` | hero category pills | same | pending | |
| `--vp-candidate-blog-date-chip-bg` | `var(--vp-link)` / `#fdb913` | `.vp-blog-hero__date-chip` | same + product (yellow/black vs glass) | pending | No `--vp-color-yellow` / `--vp-yellow-100` in tokens; aliases `--vp-link`. |
| `--vp-candidate-blog-date-chip-color` | `var(--vp-black)` / `#000000` | `.vp-blog-hero__date-chip` | same | pending | Aligns with `--vp-black`. |
| `--vp-candidate-blog-dek-color` | `rgba(255,255,255,0.6)` | `.vp-blog-hero__dek` | same | pending | |
| `--vp-candidate-blog-back-color` | `rgba(255,255,255,0.5)` | `.vp-blog-hero__back-label` | same | pending | |

**Figma note:** MCP `get_design_context` for `2281:12897` / label `2281:12938` still emits the glass `white/10` fill for the date label (same as category chips). Screenshot + product call for yellow bg / black text — implemented as yellow/black via candidates above.
