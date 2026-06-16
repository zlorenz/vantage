# Taxonomy nav + load-more: diagnosis and solution

## Issue 1: Back button → wrong content + all nav links active

### What happens

1. Start on `/video-format/brand-film/` → correct.
2. Click to `/video-format/branded-documentary/` → correct (likely full page load).
3. Click **browser Back** to `/video-format/brand-film/` → **wrong**: grid shows all work (no filter), all nav links appear white (active). Hard refresh fixes it.

### Root causes

**A. Taxonomy filter links have no `data-term`**

- In the templates, `.vp-filter` links are: `<a class="vp-filter" href="...">` with **no `data-term`**.
- In `portfolio-load-more.js`, the legacy click handler does:
  - `term = a.dataset.term || ""` → always `""`.
  - `sentinel.dataset.term = term` → sentinel gets `""`.
  - Request is sent with no term filter → server returns **all work**.
- So any client-side filter change on taxonomy (click or back) ends up requesting unfiltered results.

**B. Active state is driven by query params only**

- In `applyFilters`, legacy active state is:
  - `activeFormat = params.get("format") || ""`
  - `a.classList.toggle("is-active", a.dataset.term === activeFormat)`.
- On taxonomy pages the URL is **path-based** (`/video-format/brand-film/`), not `?format=brand-film`.
- So `activeFormat` is always `""`. Every link has `dataset.term === ""` (missing → undefined → ""), so **every link gets `is-active`** → all white.

**C. Popstate only syncs from query params**

- On `popstate` we do:
  - `sentinel.dataset.term = params.get("format") || ""` → on taxonomy always `""`.
  - Then `applyFilters(null)` → request with no term → **all work**.
  - Legacy active state again uses `params.get("format")` → `""` → **all links active**.

So: no `data-term` on links, and all logic assumes `?format=...` instead of path-based term. That explains wrong content and all-links-active after Back.

---

## Issue 2: No spinner / no gray loading on taxonomy when scrolling

### What happens

- On Work/Work Internal: scrolling to bottom shows the lazy-load spinner and (when changing filters) grid can go gray.
- On taxonomy archives: no spinner when loading more, and items don’t go gray.

### Root cause

- **Work/Work Internal** sendinel markup includes an inner **spinner**:
  ```html
  <div id="vp-load-more" class="vp-load-more" ...>
    <div class="vp-load-spinner"></div>
  </div>
  ```
- **Taxonomy** templates sendinel has **no** inner spinner:
  ```html
  <div id="vp-load-more" class="vp-load-more" ... aria-hidden="true">
  </div>
  ```
- The JS only adds `sentinel.classList.add("loading")`; the actual spinner is the child `.vp-load-spinner`. If that element isn’t in the DOM (taxonomy), no spinner is shown.
- The gray state is `grid.classList.add("vp-portfolio-gallery--loading")`, which is only applied in **applyFilters**, not in **loadMore**. So on infinite scroll (Work or taxonomy) the grid doesn’t gray; that’s consistent. Fixing the spinner on taxonomy restores the expected “loading” feedback when scrolling.

---

## Solution (before code changes)

### 1. Taxonomy templates (all three)

- **Add `data-term` to each `.vp-filter` link** so the JS can send the correct filter and set active state:
  - “All” link: `data-term=""` (or omit; JS treats as `""`).
  - Term links: `data-term="<?php echo esc_attr( $t->slug ); ?>".
- **Add the same spinner markup as Work** inside `#vp-load-more`:
  - `<div class="vp-load-spinner"></div>` so the loading state is visible when scrolling.

### 2. JS (`portfolio-load-more.js`)

- **Path-based term for taxonomy archives**
  - When the page is a taxonomy archive (path contains `video-format`, `industry`, or `market` and has a term segment), derive the current term from the **path** (e.g. last segment for default language) instead of from `?format=...`.
  - Use that for:
    - **Popstate:** set `sentinel.dataset.term` from path before calling `applyFilters(null)` so the request is for the correct term.
    - **Legacy active state:** set `is-active` on the link whose `data-term` (or href) matches this path-derived term, not from `params.get("format")` when on a taxonomy path.
- **Keep** existing dropdown logic and query-param behavior for Work/Work Internal; only use path-based term when we detect a taxonomy archive URL.

Concretely:

- Add a small helper that returns the current “term slug” from the URL when on a taxonomy archive (e.g. path segments like `['video-format','brand-film']` → `brand-film`; if first segment is `zh`/`en`, either skip path-based term or use the segment after the taxonomy segment).
- In the legacy-filter active-state block: if we’re on a taxonomy path, use this path-derived term instead of `params.get("format")` when toggling `is-active`.
- In the `popstate` handler: if we’re on a taxonomy path, set `sentinel.dataset.term` from the path-derived term, then call `applyFilters(null)`.

Result:

- Clicking a taxonomy link sets `sentinel.dataset.term` from the clicked link’s `data-term` and requests the right category; only that link is active.
- Back/forward on taxonomy URLs restores the correct term from the path and requests the right content; active state matches the URL.
- Scrolling to bottom on taxonomy shows the same spinner as Work.

No change to Work/Work Internal behavior, filtering logic, or AJAX structure—only taxonomy nav, popstate, and sentinel markup are fixed.
