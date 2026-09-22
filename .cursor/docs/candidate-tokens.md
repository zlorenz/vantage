# Candidate Tokens — Pending Promotion

Values observed in Figma (or proposed structural overrides) that are **not** yet established `--vp-*` tokens in `.cursor/docs/design-tokens.md`. Do **not** add these to `design-tokens.md` / the real `--vp-*` set until confirmed across components.

Naming: `--vp-candidate-[name]`

**Homepage carousel + sitewide nav are locked.** Their former candidates now live in `design-tokens.md` as either sitewide `--vp-*` or component-scoped `--vp-home-carousel-*`. Do not re-open them here.

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
| `--vp-candidate-filter-count-size` | `≈9.03px` | `[ 100 ]` count badges on filter triggers | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=77-12472 | pending | Odd fractional size — confirm with designer before promoting. |
| `--vp-candidate-filter-panel-width` | `530px` | Open filter panel | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=84-36076 | pending | |
| `--vp-candidate-index-peer-scrim` | `rgba(0,0,0,0.2–0.5)` even wash on inactive cards | Work peek cards | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=77-12472 | pending | Active card has no wash; text sits on open media + corner brackets. |

---

## Blog single — pull quote (pending)

| Candidate name | Value | Used in | Source | Status | Notes |
|---|---|---|---|---|---|
| `--vp-candidate-pull-quote-size` | `24px` / Mona 600 / lh 1.6 / tracking `-0.48px` | `.vp-pull-quote__text` | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=2281-13297 | pending | Figma `quotes` token. |
| `--vp-candidate-pull-quote-attribution-size` | `16px` / heading bold / lh 1.6 / tracking `-0.32px` | `.vp-pull-quote__attribution` | same | pending | Figma `caption_1`. |
| `--vp-candidate-pull-quote-panel-bg` | `rgba(255,255,255,0.1)` | `.vp-pull-quote__panel` | same | pending | |
| `--vp-candidate-pull-quote-attribution-color` | `rgba(255,255,255,0.5)` | `.vp-pull-quote__attribution` | same | pending | |
| `--vp-candidate-pull-quote-headshot` | `324px` square | `.vp-pull-quote__headshot` | same | pending | |

## Blog single — image pair (pending)

| Candidate name | Value | Used in | Source | Status | Notes |
|---|---|---|---|---|---|
| `--vp-candidate-image-pair-caption-bg` | `rgba(255,255,255,0.1)` | `.vp-image-pair__caption` | https://www.figma.com/design/uhiQCoaWAWYqk1ILLcAw2j/Vantage-Website-Redesign?node-id=2281-12989 | pending | |
| `--vp-candidate-image-pair-caption-color` | `rgba(255,255,255,0.6)` | `.vp-image-pair__caption` | same | pending | |

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
