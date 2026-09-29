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
| `--vp-candidate-site-footer-mobile-email-size` | `16px` | `.vp-site-footer__email-link` ≤575 | product: fit nowrap email @390 | pending | Figma h6 20px overflowed Expanded Bold + icon; keep nowrap. |

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

Mobile ≤767 language switcher: dedicated `.vp-lang-cell--mobile` toggle for the other locale (EN page → 中文, ZH → EN); desktop pair uses `.vp-lang-cell--desktop` and is hidden ≤767. Earlier `.is-active { display: none }` approach failed on ZH pages in phone Chrome — do not revert to it. Not a style candidate.

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
| `--vp-candidate-portfolio-case-mobile-title-block-pad-block` | `48px` | title block **pad-top** only ≤575 | `py-48` | pending | Pad-bottom dropped — was stacking with meta pad. |
| `--vp-candidate-portfolio-case-mobile-title-pills-gap` | `16px` | `.vp-case-header__meta` pad-top ≤575 | QC: tighten campaign→pills | pending | Was effectively ~88px (48+40). |
| `--vp-candidate-portfolio-case-mobile-brand-campaign-gap` | ~~`32px`~~ → ~~`0.35rem`~~ → `--vp-overlay-mobile-title-tag-gap` (`12px`) | `.vp-case-header__title-block` gap ≤575 | QC / carousel parity | pending | Case header mobile only — other carousels + desktop title-block unchanged. |
| `--vp-candidate-portfolio-case-mobile-back-title-gap` | `32px` | `.vp-case-mobile-back` pad-bottom ≤991 | QC: larger back→title gap after hugging nav | pending | Title-block pad-top stays 48px (do not pull campaign up). |
| `--vp-candidate-portfolio-case-mobile-back-pad-top` | `12px` | `.vp-case-mobile-back` pad-top ≤575 | QC: small air under 64px nav (not flush) | pending | Mid-width ≤991 uses `1rem` pad-top; desktop rail unchanged. |
| `--vp-candidate-portfolio-case-mobile-meta-pad-block` | `40px` | `.vp-case-header__meta` **pad-bottom** ≤575 | `py-40` | pending | Pad-top superseded by title-pills-gap. |
| `--vp-candidate-portfolio-case-mobile-credit-role-width` | `8.75rem` | `.vp-credit-pair` grid col 1 ≤991 | QC: table-like role\|names | pending | Desktop stays `17.625rem`. |
| `--vp-candidate-portfolio-case-mobile-credit-row-gap` | `16px` | key + dept rows | gap 16 | pending | |
| `--vp-candidate-portfolio-case-mobile-pill-height` | ~~`48px`~~ → `36px` | pills ≤575 | QC: a little smaller | pending | Desktop stays 64px. |
| `--vp-candidate-portfolio-case-mobile-pill-pad-inline` | `12px` | pills pad-x ≤575 | QC with height 36 | pending | Was 16px. |
| `--vp-candidate-portfolio-case-mobile-pill-gap` | `2px` | pills | gap-2 | pending | |
| `--vp-candidate-portfolio-case-mobile-play-size` | ~~`64px`~~ → `48px` | play chrome ≤575 under `.vp-case-shell` (carousel + single embed) | `2283:30842` + QC | pending | Desktop stays 80px. Glyph scales with the square. |
| `--vp-candidate-portfolio-case-mobile-overlay-title-size` | `22px` | `.vp-case-carousel__title` ≤575 | QC: poster title smaller than page h1 | pending | Page campaign title stays `--vp-candidate-portfolio-case-mobile-title-size` (30px). |
| `--vp-candidate-portfolio-case-mobile-info-btn-height` | `32px` | `.vp-case-carousel__info-btn` ≤575 | QC | pending | Desktop chip stays 48px. |
| `--vp-candidate-portfolio-case-mobile-info-icon-size` | `16px` | info icon ≤575 | QC | pending | Desktop icon stays 24px. |
| `--vp-candidate-portfolio-case-mobile-info-btn-pad` | `10px` | info chip pad-inline ≤575 | QC | pending | Desktop pad stays 16px. |
| `--vp-candidate-portfolio-case-mobile-info-btn-gap` | `6px` | icon→label gap ≤575 | QC | pending | Desktop gap stays 8px. |
| `--vp-candidate-portfolio-case-mobile-dept-title-size` | `22px` | `.vp-credits__dept-name` ≤575 | h5 | pending | |
| `--vp-candidate-portfolio-case-mobile-credits-pad-top` | `60px` | `.vp-case-credits-band` ≤575 | `pt-60` | pending | |
| `--vp-candidate-portfolio-case-mobile-section-gap` | `80px` | credits↔KV rhythm | gap-80 | pending | |
| `--vp-candidate-portfolio-case-mobile-dept-gap` | ~~`60px`~~ → `3rem` (48px) | open `.vp-credits__rows--open` pad-bottom ≤991 | QC: accordion to rail breakpoint; no inter-dept gutters when collapsed | pending | Was ≤575-only / between depts; now pad under roles when open through tablet. |
| `--vp-candidate-portfolio-case-mobile-credits-pad-bottom` | `48px` | `.vp-case-credits-band` pad-bottom ≤575 | QC: air before project-nav | pending | |
| `--vp-candidate-portfolio-case-mobile-credits-last-pad` | `2.5rem` | last `.vp-credits__dept` pad-bottom ≤575 | QC: space below last names | pending | |
| `--vp-candidate-portfolio-case-mobile-kv-title-size` | `26px` | Key Visuals h2 ≤575 | h3 white | pending | |
| `--vp-candidate-portfolio-case-mobile-kv-gap` | `12px` | KV stack | gap-12 | pending | |
| `--vp-candidate-portfolio-case-mobile-kv-cell-aspect` | ~~`370 / 180`~~ | ~~KV cells ≤575~~ | cells | superseded | Phone uses each asset’s intrinsic ratio (`--vp-kv-native-aspect` on the figure) so the full frame shows. |
| `--vp-candidate-portfolio-case-mobile-next-card-aspect` | ~~`2 / 3`~~ → ~~`4 / 5`~~ → `512 / 640` (`CAROUSEL_RATIOS.workDesktop`) | project-nav card ≤575 | wired to @carousel-ratios | pending | CDN phone bake + CSS lock; wide ≥576 uses `homeDesktop` 16:9. |
| `--vp-candidate-portfolio-case-mobile-nav-title-size` | `26px` | `.vp-project-nav__title` ≤575 | QC: slightly under case title 30px | pending | Format taxonomy hidden on phone overlays. |
| `--vp-candidate-portfolio-case-mobile-nav-pad-top` | `5rem` (80px) | `.vp-case-credits-vap` pad-bottom ≤575 | QC: air under flipped VAP before carousel | pending | Was nav pad-top; mark is flush under POST. |
| `--vp-candidate-portfolio-case-mobile-explore-height` | `60px` | explore row | h-60 | pending | Approximate. |
| `--vp-candidate-portfolio-case-mobile-nav-bracket-outset` | `8px` | `.vp-project-nav__ticks` inset ≤575 | QC: brackets outside full widget (poster→explore); heading hidden on phone | pending | Negative inset = outside; poster must not be a positioning context on phone. |
| `--vp-candidate-portfolio-case-mobile-overlay-pad` | `16px` | multi carousel overlay ≤575 | frame inline | pending | Scoped `.vp-case-shell`. |

## Campaign brief form — desktop restyle (pending)

Frames: S1 `2426:4340`, S2.1 `2380:25373`, S2.2 `2382:26251`, S3 `2382:26469`, Confirm `2382:26839`. Content column stays the existing **900px** (Figma 922px was not adopted). Special Gothic tracking stays **0** (Figma −2% was not adopted). Display layers use `--font-vp-heading` at `--font-vp-heading-weight` with `font-synthesis: none`.

**Reuse (no new name):** `--vp-link` (`#fdb913`), `--vp-orange` (`#f04e23`), `--vp-form-placeholder` (white 0.5, above-control hints), `--vp-form-gap` (16px column gap), `--vp-radius` (0), `--vp-form-error` / error border+bg, `--vp-black` / `--vp-text`. Do not reuse `--vp-form-step-completed-bg` outside the old stepper.

| Candidate name | Value | Used in | Source | Status | Notes |
|---|---|---|---|---|---|
| `--vp-candidate-brief-title-size` | `48px` | Campaign brief H1 | S1 `2426:4349` h2 | pending | Same size as `--vp-candidate-blog-h2-size`. Tracking 0, not the blog −0.96px exception. |
| `--vp-candidate-brief-title-lh` | `1.2` | same | same | pending | |
| `--vp-candidate-brief-intro-size` | `18px` | Intro under the H1 | S1 `2426:4350` body_medium | pending | Mona Sans Regular. |
| `--vp-candidate-brief-intro-lh` | `1.5` | same | same | pending | |
| `--vp-candidate-brief-intro-color` | `rgba(255,255,255,0.6)` | same | same | pending | Same alpha as `--vp-home-carousel-counter-muted`; kept separate so the brief does not depend on carousel scope. |
| `--vp-candidate-brief-title-intro-gap` | `40px` | H1 → intro | S1 title block gap | pending | Does not stack on condensed-header clearance. |
| `--vp-candidate-brief-intro-step-gap` | `60px` | Intro → stepper | S1 header block gap | pending | |
| `--vp-candidate-brief-step-card-gap` | `80px` | Stepper → card | S1 column gap | pending | |
| `--vp-candidate-brief-section-title-size` | `26px` | In-card section title + confirm heading | S1 `2426:4372` h5 | pending | |
| `--vp-candidate-brief-section-title-lh` | `1.4` | same | same | pending | |
| `--vp-candidate-brief-card-pad` | `30px` | Corner-tick card | S1 `2426:4368` | pending | |
| `--vp-candidate-brief-tick-size` | `12px` | Corner ticks | SVG `Rectangle 65` viewBox 12.5 | pending | |
| `--vp-candidate-brief-tick-stroke` | `1px` | same | SVG default stroke (no `stroke-width`) | pending | |
| `--vp-candidate-brief-tick-color` | `rgba(255,255,255,0.3)` | same | `stroke="white" stroke-opacity="0.3"` | pending | |
| `--vp-candidate-brief-step-size` | `60px` | Step squares | S1 `2426:4353` | pending | ≤767 may still shrink; radius stays 0. |
| `--vp-candidate-brief-step-label-gap` | `20px` | Square → label | S1 step column gap | pending | |
| `--vp-candidate-brief-caption-size` | `14px` | Step numbers, step labels, field labels, Browse | caption_2 | pending | |
| `--vp-candidate-brief-caption-lh` | `20px` | same | same | pending | |
| `--vp-candidate-brief-label-color` | `rgba(255,255,255,0.8)` | Field labels | white/80 | pending | |
| `--vp-candidate-brief-muted-30` | `rgba(255,255,255,0.3)` | Placeholders, pending step numbers | white/30 | pending | Not `--vp-form-placeholder` (0.5). |
| `--vp-candidate-brief-line` | `rgba(255,255,255,0.15)` | Underlines, pending borders, connectors | white/15 | pending | Alpha matches `--vp-struct-line`; width differs. |
| `--vp-candidate-brief-rule` | `0.6px solid` that line | Field underlines | input border-b 0.6px | pending | |
| `--vp-candidate-brief-control-pad-top` | `20px` | Controls | input pt | pending | |
| `--vp-candidate-brief-control-pad-bottom` | `12px` | Controls | input pb | pending | |
| `--vp-candidate-brief-control-size` | `18px` | Values, placeholders, dropzone prompt | body_medium | pending | Mobile floor `16px` in `globals.css` still wins ≤767.98px. |
| `--vp-candidate-brief-control-lh` | `1.5` | same | same | pending | |
| `--vp-candidate-brief-textarea-pad-bottom` | `60px` | Textareas | S2.2 / S3 pb-60 | pending | |
| `--vp-candidate-brief-field-gap` | `60px` | Field rows; S1 title → fields | S1 / S2.2 | pending | |
| `--vp-candidate-brief-field-gap-tight` | `48px` | Step 2 title → fields, fields → buttons | S2.1 | pending | |
| `--vp-candidate-brief-check-size` | `24px` | Checkbox / budget square | S2.2 | pending | |
| `--vp-candidate-brief-check-icon-size` | `20px` | Checked glyph | S2.2 check.1 | pending | Step-complete check is 24px (separate). |
| `--vp-candidate-brief-check-bg` | `rgba(255,255,255,0.05)` | Unchecked fill | white/5 | pending | |
| `--vp-candidate-brief-check-border` | `rgba(255,255,255,0.1)` | Unchecked border | white/10 | pending | |
| `--vp-candidate-brief-check-gap` | `16px` | Box → option label | S2.2 | pending | |
| `--vp-candidate-brief-option-gap` | `12px` | Options in a group | S2.2 | pending | |
| `--vp-candidate-brief-group-gap` | `24px` | Label block → options | S2.2 | pending | |
| `--vp-candidate-brief-chip-size` | `32px` | Select chevron / date icon chip | S1 select | pending | |
| `--vp-candidate-brief-chip-bg` | `rgba(255,255,255,0.15)` | Chip fill | white/15 | pending | |
| `--vp-candidate-brief-chip-glyph` | `18px` | Glyph inside the chip | S1 | pending | |
| `--vp-candidate-brief-btn-height` | `80px` | Form buttons | S1 Next | pending | Form-scoped. Does not change `VpButton`. |
| `--vp-candidate-brief-btn-pad-inline` | `32px` | same | px-32 | pending | |
| `--vp-candidate-brief-btn-size` | `16px` | Button label | S1 Next | pending | |
| `--vp-candidate-brief-btn-lh` | `20px` | same | leading 20 | pending | |
| `--vp-candidate-brief-btn-gap` | `8px` | Previous \| Next | S2.1 | pending | |
| `--vp-candidate-brief-btn-ghost-border` | `rgba(255,255,255,0.2)` | Previous, confirm CTA | white/20 | pending | Not `--vp-form-step-completed-bg`. |
| `--vp-candidate-brief-btn-arrow-size` | `24px` | Previous arrow | S2.1 | pending | |
| `--vp-candidate-brief-btn-arrow-gap` | `16px` | Arrow → label | S2.1 | pending | |
| `--vp-candidate-brief-connector-width` | `0.6px` | Stepper connectors | connector SVGs | pending | |
| `--vp-candidate-brief-connector-dash` | `4px` | Pending connector dash | `stroke-dasharray="4 2"` | pending | |
| `--vp-candidate-brief-connector-gap` | `2px` | Pending connector gap | same | pending | Pending stroke is white 0.15. Into the active step: solid white. Between two completed steps: solid `--vp-link`. |
| `--vp-candidate-brief-step-pending-border-width` | `0.6px` | Pending square | S1 dashed 0.6px | pending | Color is `--vp-candidate-brief-line`. |
| `--vp-candidate-brief-step-completed-border-width` | `1px` | Completed square | S2.1 `border` dashed white/15 | pending | Fill is `--vp-link`. |
| `--vp-candidate-brief-dropzone-pad-block` | `56px` | Dropzone | S3 | pending | |
| `--vp-candidate-brief-dropzone-pad-inline` | `24px` | Dropzone | S3 | pending | |
| `--vp-candidate-brief-dropzone-gap` | `16px` | Icon / prompt / Browse | S3 | pending | |
| `--vp-candidate-brief-browse-pad` | `16px` | Browse files | S3 | pending | Border `--vp-orange`, radius 0. |
| `--vp-candidate-brief-control-hover` | `rgba(255,255,255,0.4)` | Control + ghost hover | **derived — no Figma frame** | pending | |
| `--vp-candidate-brief-control-focus` | `#ffffff` | Focused underline | **derived — no Figma frame** | pending | Solid white. |
| `--vp-candidate-brief-focus-ring` | `1px solid var(--vp-link)` | Keyboard focus-visible | **derived — no Figma frame** | pending | Buttons, checks, radios, step squares. |
| `--vp-candidate-brief-focus-offset` | `3px` | same | **derived — no Figma frame** | pending | |
| `--vp-candidate-brief-disabled-opacity` | `0.4` | Disabled controls and buttons | **derived — no Figma frame** | pending | No hover shift while disabled. |
| `--vp-candidate-brief-primary-hover` | `#ffcb55` | Next / Submit hover | **derived — no Figma frame** | pending | No `--vp-yellow-80` token exists. |
| `--vp-candidate-brief-dropzone-active-fill` | `rgba(255,255,255,0.03)` | Dropzone drag-over | **derived — no Figma frame** | pending | Border becomes `--vp-link`. |
| `--vp-candidate-brief-transition` | `0.3s ease-out` | Form interaction | **derived — no Figma frame** | pending | Distinct from `--vp-transition` (`0.3s ease`). Honors `prefers-reduced-motion`. |

## About page — desktop restyle (pending)

Frame: https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=2466-28598  
Defined in `src/components/about/about-tokens.css` (imported by the About page). Not in `globals.css`. Pending reuse outside About. Special Gothic tracking stays **0**. Section padding is declared only at `min-width: 1200px` so it does not change the mobile rhythm or `--vp-section-y`.

**Reuse (no new name):** `--vp-link` (`#fdb913`) for the yellow emphasis, More About headline, and 60px crosshair; `--vp-orange` (`#f04e23`) for eyebrows and the open accordion icon; `--vp-black` / `--vp-text` / `--vp-bg`; `--vp-candidate-brief-tick-size` (12px), `--vp-candidate-brief-tick-stroke` (1px), and `--vp-candidate-brief-tick-color` (`rgba(255,255,255,0.3)`) for dark corner brackets; `--vp-candidate-brief-line` (`rgba(255,255,255,0.15)`) for dark hairlines and tick-ruler marks. Light brackets use `--vp-candidate-about-black-50`.

| Candidate name | Value | Used in | Source | Status | Notes |
|---|---|---|---|---|---|
| `--vp-candidate-about-section-pad-block` | `200px` | About section padding, desktop only | `2466:28808` `py-200` | pending | Declared inside `@media (min-width: 1200px)` only. |
| `--vp-candidate-about-header-gap` | `100px` | Eyebrow row → panel | `2466:28808` `gap-100` | pending | |
| `--vp-candidate-about-display-size` | `64px` | Section headings | h1 on `2466:28641` | pending | |
| `--vp-candidate-about-statement-size` | `clamp(1.75rem, 5.55cqi, 4rem)` | Statement heading only | About `2466:28641`, scaled to the rail gap | pending | 5.55cqi of the 1152px measure is 64px. Lines stay `nowrap` so a phrase does not break. Other headings keep the fixed 64px token. |
| `--vp-candidate-about-display-lh` | `1.1` | same | same | pending | |
| `--vp-candidate-about-feature-title-size` | `40px` | Workflow titles, production-row titles | h3 on `2466:28887` / `2466:28975` | pending | |
| `--vp-candidate-about-feature-title-lh` | `1.2` | same | same | pending | |
| `--vp-candidate-about-tab-size` | `32px` | Specialties / Advantages menu rows | h4 on `2466:28817` | pending | |
| `--vp-candidate-about-tab-lh` | `1.3` | same | same | pending | |
| `--vp-candidate-about-body-size` | `18px` | Tab descriptions, accordion copy, feature bodies | body_medium | pending | |
| `--vp-candidate-about-body-lh` | `1.5` | same | same | pending | |
| `--vp-candidate-about-eyebrow-size` | `16px` | Orange eyebrows | caption_1 on `2466:28812` | pending | |
| `--vp-candidate-about-eyebrow-lh` | `1.6` | same | same | pending | |
| `--vp-candidate-about-step-size` | `14px` | Workflow numbers, More About link cells | caption_2 | pending | |
| `--vp-candidate-about-step-lh` | `20px` | same | same | pending | |
| `--vp-candidate-about-dek-size` | `22px` | More About dek | body_large on `2466:29066` | pending | |
| `--vp-candidate-about-dek-lh` | `1.6` | same | same | pending | |
| `--vp-candidate-about-black-20` | `rgba(0,0,0,0.2)` | Inactive menu rows, light section | `2466:28819` | pending | |
| `--vp-candidate-about-black-15` | `rgba(0,0,0,0.15)` | Light-section rules and rulers | `2466:28818` | pending | |
| `--vp-candidate-about-black-30` | `rgba(0,0,0,0.3)` | Workflow numbers, light ruler labels | `2466:28885` | pending | |
| `--vp-candidate-about-black-50` | `rgba(0,0,0,0.5)` | Light corner brackets | specialties bracket SVG | pending | Dark brackets reuse the brief tick color. |
| `--vp-candidate-about-black-70` | `rgba(0,0,0,0.7)` | Body on white | `2466:28825` | pending | |
| `--vp-candidate-about-white-20` | `rgba(255,255,255,0.2)` | Inactive menu rows, dark section | `2466:28864` | pending | |
| `--vp-candidate-about-white-50` | `rgba(255,255,255,0.5)` | More About dek | `2466:29066` | pending | |
| `--vp-candidate-about-white-60` | `rgba(255,255,255,0.6)` | Body on black | `2466:28870` | pending | |
| `--vp-candidate-about-cell-pad` | `30px` | Menu rows, image frames, More About frame | `p-30` | pending | |
| `--vp-candidate-about-cta-height` | `80px` | Production-row buttons | `2466:28978` | pending | Same height as `--vp-candidate-brief-btn-height`; kept separate so About does not depend on the form. |
| `--vp-candidate-about-crosshair` | `40px` | Crosshair on images and film-strip center frame | `2466:28831` | pending | 1px stroke, white on photos. |
| `--vp-candidate-about-crosshair-mark` | `60px` | More About crosshair | `2466:29078` | pending | 1px stroke, `--vp-link`. |
| `--vp-candidate-about-film-frame` | `297px` | Film-strip column width | `2466:28696` | pending | |
| `--vp-candidate-about-film-image-width` | `237px` | Poster inside a film frame | `2466:28704` | pending | 30px pad on the 297px frame. |
| `--vp-candidate-about-film-image-height` | `320px` | same | same | pending | |
| `--vp-candidate-about-film-dim` | `0.4` | Non-center film frames | `opacity-40` on `2466:28697` | pending | |
