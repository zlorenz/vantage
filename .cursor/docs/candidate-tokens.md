# Candidate Tokens — Pending Promotion

Values observed in Figma (or proposed structural overrides) that are **not** yet established `--vp-*` tokens in `.cursor/docs/design-tokens.md`. Do **not** add these to `design-tokens.md` / the real `--vp-*` set until confirmed across components.

Naming: `--vp-candidate-[name]`

**Homepage carousel desktop + sitewide nav are locked.** Do not re-open desktop `--vp-home-carousel-*` spacing/type here. **Mobile media-overlay kit** promoted to `--vp-overlay-mobile-*` in `design-tokens.md` / `:root` (title-size, caption-size, pad-*, title-tag-gap).

---

## Homepage carousel — mobile overlay (audit / residual)

| Candidate name | Value | Used in | Source | Status | Notes |
|---|---|---|---|---|---|
| `--vp-candidate-home-carousel-mobile-title-size` | `28px` | ~~`.vp-proto-carousel__campaign` ≤767~~ | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=2282-27788 | superseded → `--vp-overlay-mobile-title-size` | |
| `--vp-candidate-home-carousel-mobile-caption-size` | `12px` | ~~Brand, format, counter ≤767~~ | same | superseded → `--vp-overlay-mobile-caption-size` | |
| `--vp-candidate-home-carousel-mobile-overlay-pad-inline` | `16px` | ~~Overlay L/R ≤767~~ | same (`px-16`) | superseded → `--vp-overlay-mobile-pad-inline` | |
| `--vp-candidate-home-carousel-mobile-overlay-pad-block` | `40px` | ~~Overlay top/bottom ≤767~~ | same (`py-40`) | superseded → `--vp-overlay-mobile-pad-block` | |
| `--vp-candidate-home-carousel-mobile-counter-offset` | `69px` | ~~Counter `top` offset~~ (rule kept; UI `display:none` on mobile) | `2282:27788` | superseded | Counter hidden on mobile — restore UI before re-promoting. |
| `--vp-candidate-home-carousel-mobile-title-tag-gap` | `12px` | ~~Brand-row → campaign ≤767~~ | product | superseded → `--vp-overlay-mobile-title-tag-gap` | Case header stays `0.35rem` (intentional split). |

**Reuse (no candidate):** `--vp-home-carousel-brand-accent`, `--vp-home-carousel-counter-muted`, `--vp-home-carousel-brand-dot-size`, `--vp-home-carousel-title-tag-gap` (desktop + shared colors/dot).

**Dropped for mobile:** credit-col-gap, credit-role-lh, section-gap, Figma −2% tracking.

---

## Chrome — circular glass chip (pending)

Exact match across work mobile SEARCH/FILTER, work bottom-bar filter trigger, and blog `.vp-news-page__filter-trigger`. Defined on `:root` in `globals.css`.

| Candidate name | Value | Used in | Source | Status | Notes |
|---|---|---|---|---|---|
| `--vp-candidate-chrome-chip-size` | `2.75rem` | Work SEARCH/FILTER chips; blog filter trigger; work filter-trigger + search spacer | product parity | pending | Sheet close / header spacer share this size only. |
| `--vp-candidate-chrome-chip-icon-size` | `1.25rem` | Chip icons (work + blog) | same | pending | |
| `--vp-candidate-chrome-chip-radius` | `9999px` | Glass chips | same | pending | Sheet icon-btn also circular but transparent. |
| `--vp-candidate-chrome-chip-border` | `1px solid var(--vp-border-soft)` | Glass chips | same | pending | **Not** sheet close (`border: 0`). |
| `--vp-candidate-chrome-chip-bg` | `rgba(var(--vp-black-rgb), 0.45)` | Glass chips | same | pending | Same channel as `--vp-overlay-dark`; **not** sheet close (`transparent`). |

**Intentional non-wire:** `.vp-bottom-sheet__icon-btn` / `.vp-index-filter-sheet__icon-btn` — same size/radius, different border + fill. Do not force glass tokens onto sheet chrome.

---

## Site footer — mobile stack (pending)

| Candidate name | Value | Used in | Source | Status | Notes |
|---|---|---|---|---|---|
| `--vp-candidate-site-footer-mobile-band-height` | `80px` | `.vp-site-footer__mark` + `__socials` ≤575 | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=2283-31053 | pending | Desktop bar stays 100px. Email row is content-height (py 26). Same `.vp-site-footer` markup — column stack only. |

## Site nav — mobile bar (pending)

| Candidate name | Value | Used in | Source | Status | Notes |
|---|---|---|---|---|---|
| `--vp-candidate-nav-bar-height-mobile` | `64px` | `#header.navbar` ≤767.98; hamburger cell 64×64 | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=2282-29325 | pending | Desktop keeps `--vp-nav-bar-height: 80px` ≥768. |

**Reuse (no candidate):** `--vp-orange` hamburger fill; `--vp-struct-line` bar/logo hairlines.

---

## Site nav — mobile panel (pending)

| Candidate name | Value | Used in | Source | Status | Notes |
|---|---|---|---|---|---|
| `--vp-candidate-mobile-nav-link-size` | `32px` (was `24px`) | `.vp-desktop-nav-label` inside mobile panel | product: ~33% bump over Figma `h4` | pending | Index scaled 12→16px in lockstep. Desktop rail unchanged. |
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
| `--vp-candidate-home-carousel-mobile-title-size` / `caption-size` / `overlay-pad-*` / `title-tag-gap` | see overlay kit | superseded → `--vp-overlay-mobile-*` | Promoted 2026-09-24. |
| `--vp-candidate-home-carousel-mobile-counter-offset` | `69px` | superseded | Mobile counter `display:none`; CSS var remains on carousel for restore. |
| `--vp-candidate-index-overlay-pad` / `index-title-size` | Figma 30/48 · 26px | superseded | Work cards use overlay-mobile kit / 18px mobile title. |
| `--vp-candidate-work-index-mobile-overlay-pad-*` / `brand-gap` / `copy-stack-gap` | 15/30 · 24 · 12 | superseded | Aliased to overlay-mobile pad / brand-row 12px / title-tag-gap. |
| `--vp-candidate-work-index-mobile-tab-pad-*` | 8/20 | superseded | Horizontal taxonomy tabs removed. |
| `--vp-candidate-portfolio-case-mobile-brand-campaign-gap` | 32px → 0.35rem | superseded | Case header ≠ overlay 12px family. |
| `--vp-candidate-filter-count-size` | `9px` | superseded | No live CSS; icon-only FILTER chrome. |
| `--vp-navbar-gradient-*` / blur scrim | removed | superseded | Dropped in `992aadff`; navbar fully transparent. |

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
| `--vp-candidate-index-overlay-pad` | `30px` inline / `48px` bottom | ~~Work active-card copy inset~~ | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=77-12472 | superseded | Work cards use `--vp-overlay-mobile-pad-*` (16 / 40). |
| `--vp-candidate-index-title-size` | `26px` / bold / uppercase | ~~Work card campaign title~~ | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=77-12472 | superseded | Desktop work → `--vp-overlay-mobile-title-size` (28px); ≤575 → `--vp-candidate-work-index-mobile-title-size` (18px). |
| `--vp-candidate-filter-count-size` | `9px` | ~~`[ 100 ]` count badges~~ — no live CSS | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=2282-28478 | superseded | Mobile FILTER is icon-only; desktop filter row has no `[ n ]` badge either. Orphaned candidate — keep for audit. |
| `--vp-candidate-work-index-mobile-chrome-pad-block` | `24px` | Mobile SEARCH/FILTER top row `padding-block` ≤575 | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=2282-28478 | pending | Figma `py-24`. Inline pad reuses `--vp-overlay-mobile-pad-inline` (16px). |
| `--vp-candidate-work-index-mobile-card-gap` | `20px` | Embla slide gap ≤575 | same | pending | Figma gap between 320 cards. Aspect stays CDN 2:3. |
| `--vp-candidate-work-index-mobile-height-scale` | `0.84` | `.vp-portfolio-index` `--vp-index-height-scale` ≤575 | phone QC (Zacharia: posts a little larger) | pending | Was 0.76 (Figma 520-face tune); bumped for usable peeks. Still 2:3. |
| `--vp-candidate-work-index-mobile-frame-gutter` | `10px` | Active-frame / band-guide outset outside poster ≤575 | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=2282-28478 | pending | Figma `2282:28235` wireframe wrapper `p-[10px]` around dashed rails vs 320×520 poster. Uniform 10px (H gutter exact; V ≈6.5–10). Frame still tracks poster via `width/height: calc(100% + 2×gutter)`. |
| `--vp-candidate-work-index-mobile-title-size` | `18px` | `.vp-portfolio-index__campaign` ≤575 | product: card-scaled vs homepage 28px full-bleed | pending | Scoped override — brand stays on homepage caption 12px. |
| `--vp-candidate-work-index-mobile-overlay-pad-inline` | `15px` | ~~Active card copy inset L/R ≤575~~ | same | superseded | Reuses `--vp-overlay-mobile-pad-inline` (16px). |
| `--vp-candidate-work-index-mobile-overlay-pad-block` | `30px` | ~~Active card copy inset bottom ≤575~~ | same | superseded | Reuses `--vp-overlay-mobile-pad-block` (40px). |
| `--vp-candidate-work-index-mobile-brand-gap` | `24px` | ~~Brand \| category gap ≤575~~ | same | superseded | Matches homepage mobile brand-row `0.75rem` (12px). |
| `--vp-candidate-work-index-mobile-copy-stack-gap` | `12px` | ~~Brand row → title ≤575~~ | product | superseded | Alias of `--vp-overlay-mobile-title-tag-gap`. |
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

## Blog — mobile ≤575 (pending)

Frames: index `2301:38421`, single `2304:39785`. Decisions locked: chrome-chip filter; media-first featured; 16:9 hero; yellow/black date; overlay pad kit 40; category archive in; no SEARCH. Do **not** promote this pass.

| Candidate name | Value | Used in | Source | Status | Notes |
|---|---|---|---|---|---|
| `--vp-candidate-blog-mobile-display-size` | `40px` | `.vp-news-page__title` ≤575 | `2301:38421` display | pending | Tracking −1.6px optional; floor 0 if conflict. |
| `--vp-candidate-blog-mobile-card-title-size` | `16px` | `.vp-blog-card__title` ≤575 | ArticleCard instances | pending | |
| `--vp-candidate-blog-mobile-featured-title-size` | `24px` | `.vp-featured-post__title` ≤575 | featured stack | pending | Media→copy→CTA order kept. |
| `--vp-candidate-blog-mobile-post-title-size` | `30px` | `.vp-blog-hero__title` ≤575 | `2304:39785` h1 | pending | |
| `--vp-candidate-blog-mobile-body-size` | `16px` | `.vp-blog-post__prose` p/ul/ol ≤575 | body_large mobile | pending | Desktop stays `--vp-candidate-blog-body-size` 22px. |
| `--vp-candidate-blog-mobile-h2-size` | `28px` | `.vp-blog-post__prose` h2–h4 ≤575 | `--h2` on frame | pending | Desktop stays 48px candidate. |
| `--vp-candidate-blog-mobile-pill-height` | `32px` | Index/featured/card pills ≤575 | h-32 | pending | |
| `--vp-candidate-blog-mobile-post-pill-height` | `40px` | `.vp-blog-hero__*` pills ≤575 | h-40 | pending | Date chip stays yellow/black. |
| `--vp-candidate-blog-mobile-hero-pad-x` | `16px` | Blog hero/index gutters ≤575 | alias | pending | Prefer `--vp-overlay-mobile-pad-inline` when equal. |

**Reuse (no new names):** `--vp-overlay-mobile-pad-inline` / `pad-block` / `title-size` / `caption-size` / `title-tag-gap`; `--vp-candidate-chrome-chip-*`; filter panel bg/dim/height via blog-scoped classes mirroring work (do not edit `.vp-work-index-filter*`).

## Portfolio case study — mobile ≤575 (pending)

Frame: https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=2283-29693  
Decisions: keep **16:9** hero; no Agency on mobile key credits; no left hairline; blog scoped out of case shell; tracking floor 0; project-nav approximate.

| Candidate name | Value | Used in | Source | Status | Notes |
|---|---|---|---|---|---|
| `--vp-candidate-portfolio-case-mobile-inline-pad` | `16px` | `.vp-case-shell` pad / back / header / credits / KV ≤575 | `2283:29693` gutters | pending | Prefer alias of `--vp-overlay-mobile-pad-inline` when equal. |
| `--vp-candidate-portfolio-case-mobile-back-btn-size` | `56px` | `.vp-case-mobile-back__btn` | `2283:29746` | pending | |
| `--vp-candidate-portfolio-case-mobile-title-size` | `30px` | `.vp-case-header__campaign` ≤575 | h1 fallback on frame | pending | `--font-vp-heading`; tracking floor 0. |
| `--vp-candidate-portfolio-case-mobile-title-lh` | `1.1` | campaign | same | pending | |
| `--vp-candidate-portfolio-case-mobile-brand-size` | `12px` | brand / credit names / explore | caption_1 | pending | |
| `--vp-candidate-portfolio-case-mobile-label-size` | `12px` | credit roles / pills | caption_3/4 | pending | |
| `--vp-candidate-portfolio-case-mobile-title-block-pad-block` | `48px` | title block py | `py-48` | pending | |
| `--vp-candidate-portfolio-case-mobile-brand-campaign-gap` | ~~`32px`~~ → ~~`0.35rem`~~ → `--vp-overlay-mobile-title-tag-gap` (`12px`) | `.vp-case-header__title-block` gap ≤575 | QC / carousel parity | pending | Case header mobile only — other carousels + desktop title-block unchanged. |
| `--vp-candidate-portfolio-case-mobile-back-title-gap` | `32px` | `.vp-case-mobile-back` pad-bottom ≤575 | QC: larger back→title gap after hugging nav | pending | Title-block pad-top stays 48px (do not pull campaign up). |
| `--vp-candidate-portfolio-case-mobile-meta-pad-block` | `40px` | meta band | `py-40` | pending | |
| `--vp-candidate-portfolio-case-mobile-credit-row-gap` | `16px` | key + dept rows | gap 16 | pending | |
| `--vp-candidate-portfolio-case-mobile-pill-height` | `48px` | pills ≤575 | h-48 | pending | Desktop stays 64px. |
| `--vp-candidate-portfolio-case-mobile-pill-gap` | `2px` | pills | gap-2 | pending | |
| `--vp-candidate-portfolio-case-mobile-play-size` | `64px` | play chrome ≤575 under `.vp-case-shell` | `2283:30842` | pending | Desktop/peek stay 80px. |
| `--vp-candidate-portfolio-case-mobile-dept-title-size` | `22px` | `.vp-credits__dept-name` ≤575 | h5 | pending | |
| `--vp-candidate-portfolio-case-mobile-credits-pad-top` | `60px` | `.vp-case-credits-band` ≤575 | `pt-60` | pending | |
| `--vp-candidate-portfolio-case-mobile-section-gap` | `80px` | credits↔KV rhythm | gap-80 | pending | |
| `--vp-candidate-portfolio-case-mobile-dept-gap` | ~~`60px`~~ → `3rem` (48px) | between depts ≤575 | desktop compact parity (Zacharia) | pending | Was Figma 60; now mirrors desktop `.vp-credits__col` gap. |
| `--vp-candidate-portfolio-case-mobile-credits-pad-bottom` | `48px` | `.vp-case-credits-band` pad-bottom ≤575 | QC: air before project-nav | pending | |
| `--vp-candidate-portfolio-case-mobile-credits-last-pad` | `2.5rem` | last `.vp-credits__dept` pad-bottom ≤575 | QC: space below last names | pending | |
| `--vp-candidate-portfolio-case-mobile-kv-title-size` | `26px` | Key Visuals h2 ≤575 | h3 white | pending | |
| `--vp-candidate-portfolio-case-mobile-kv-gap` | `12px` | KV stack | gap-12 | pending | |
| `--vp-candidate-portfolio-case-mobile-kv-cell-aspect` | `370 / 180` | KV cells ≤575 | cells | pending | |
| `--vp-candidate-portfolio-case-mobile-next-card-aspect` | `2 / 3` | project-nav card ≤575 | 370×600 | pending | Approximate. |
| `--vp-candidate-portfolio-case-mobile-explore-height` | `60px` | explore row | h-60 | pending | Approximate. |
| `--vp-candidate-portfolio-case-mobile-overlay-pad` | `16px` | multi carousel overlay ≤575 | frame inline | pending | Scoped `.vp-case-shell`. |
