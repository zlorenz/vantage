# Portfolio system – deep audit (no patches, analysis only)

**Date:** 2025-03  
**Scope:** All portfolio page templates, filtering, taxonomies, AJAX load-more, cache, and JS.  
**Goal:** Explain what is going wrong and exactly how to fix it, before making any code changes.

---

## 1. High-level architecture

| Area | Files | Behavior |
|------|--------|----------|
| **Work (public)** | `page-work.php` | First page can be **empty grid + AJAX** (paged=1) or server-rendered (paged>1). Dropdowns. 4-col grid (`col-lg-3`). |
| **Work Internal** | `page-work-internal.php` | Always server-rendered first page. Dropdowns. 4-col grid. No `hide_from_public` filter. |
| **Taxonomy archives** | `taxonomy-video-format.php`, `taxonomy-industry.php`, `taxonomy-market.php` | First page always server-rendered. **Link nav** (no dropdowns). **3-col grid** (`col-lg-4`). Each sentinel has `data-layout="taxonomy"`. |
| **AJAX handler** | `inc/portfolio-load-more.php` | Serves page N of portfolio; **column class depends on `layout`**: `layout=taxonomy` → 3-col, else 4-col. Caches **page 1, public** by lang + format + industry + market (see below). |
| **Front-end** | `assets/js/portfolio-load-more.js` | One script for all: load more (append), apply filters (replace grid with page 1). Reads `layout` from sentinel. On Work with `data-initial-empty="1"`, triggers **loadMore()** so first batch comes from AJAX. |

So:

- **Work:** Expects 4 columns everywhere (initial + load more).
- **Work Internal:** Expects 4 columns (all server-rendered + load more).
- **Taxonomy:** Expects 3 columns everywhere (initial server-rendered + load more with `data-layout="taxonomy"`).

The only way the grid can look “3 columns then 4 columns” on the same page is if the **first batch** of HTML uses 3-col wrappers and a **later batch** (load more) uses 4-col wrappers.

---

## 2. Root cause of “3 column then 4 column” on Work / Work Internal

### What’s wrong

- **Work (paged=1):** The first 12 items are **not** server-rendered. The template outputs an **empty** grid and `#vp-load-more` with `data-page="0"` and `data-initial-empty="1"`. The JS then runs and calls `loadMore()`, which fetches **page 1** via AJAX and injects the HTML into the grid.
- So the **first visible content** on Work comes from the **AJAX response**. That response is built in `portfolio-load-more.php` using:
  - `$col_class = ($layout === 'taxonomy') ? 'col-12 col-md-6 col-lg-4' : 'col-12 col-sm-6 col-md-4 col-lg-3';`
- So:
  - If the request has `layout=taxonomy` → HTML uses **3-col** (`col-lg-4`).
  - If the request has `layout=""` → HTML uses **4-col** (`col-lg-3`).

- **Caching:** For **page 1, context=public**, the handler uses a **transient cache**. The cache key is:
  - `vp_portfolio_p1_public_{lang}_{format}_{industry}_{market}`
  - **Layout is not part of the key.**

So:

1. If a **taxonomy** page ever triggers a **page-1** request (e.g. via `applyFilters()` on popstate or any future dropdown on taxonomy), the response is built with `layout=taxonomy` → **3-col** HTML, and that is stored under the same key as “Work, no filters” (e.g. `vp_portfolio_p1_public_en_US___`).
2. When **Work** then loads with empty grid and requests page 1 with `layout=""`, it can get a **cache HIT** and receive that **3-col** HTML.
3. So the first 12 items on Work are 3 columns.
4. When the user scrolls and **load more** runs, it requests **page 2**. Page 2 is **not** cached; it’s built with the current request’s `layout=""` → **4-col**.
5. Result: first batch 3-col, next batches 4-col → “3 column grid, then when we load more it’s four column.”

Work Internal doesn’t use “initial empty” or AJAX for the first page; it always server-renders with `col-lg-3`. So the same cache mix-up can still affect Work Internal **only if** something on that page ever requests page 1 via AJAX (e.g. filter change) and receives the taxonomy 3-col cached response. So the primary victim is Work, but the underlying bug is “cache key ignores layout.”

### Fix (to apply when you’re ready)

- **Include `layout` in the cache key** in `inc/portfolio-load-more.php`:
  - e.g. `vp_portfolio_p1_public_{lang}_{layout}_{format}_{industry}_{market}`.
  - So “Work, no filters” uses e.g. `…_en_US___…` (layout empty) and “taxonomy, no filters” uses e.g. `…_en_US_taxonomy_…`. No more cross-use of the same HTML for different layouts.
- **Purge existing transients** for portfolio page-1 (or at least the ones you care about) after deploying, so no old 3-col/4-col mix remains in cache.

After that, Work and Work Internal will consistently get 4-col for both initial (AJAX or server) and load more; taxonomy will keep getting 3-col for both.

---

## 3. Chinese taxonomy pages – infinite reload (already fixed)

- **What was wrong:** An inline script on taxonomy templates compared the **last URL path segment** (e.g. Chinese slug 品牌膜) to `data-term-slug` (always English, e.g. `brand-film`). On `/zh/...` they never match, so the script called `location.reload()` in a loop → page “loading forever” and blinking.
- **What was done:** The script now **exits without reloading** when the first path segment is a language code (`zh` or `en`). So the reload logic runs only on default-language taxonomy URLs (e.g. `/video-format/brand-film/`), where the slug in the URL can match `data-term-slug`.
- No further change needed for this.

---

## 4. Taxonomy vs Work – two different UX paths (by design)

- **Work / Work Internal:**  
  - Filter UI: **dropdowns** (format, industry, market).  
  - First page: Work uses optional **AJAX-first** (empty grid + one AJAX call for page 1); Work Internal is **server-rendered**.  
  - Grid: **4 columns** (`col-lg-3`).  
  - JS: same `portfolio-load-more.js`; sentinel has **no** `data-layout` (so `layout=""`).

- **Taxonomy archives:**  
  - Filter UI: **link nav** (simple links to other terms / “All”).  
  - First page: **always server-rendered** (no AJAX for first 12).  
  - Grid: **3 columns** (`col-lg-4`).  
  - Sentinel has `data-layout="taxonomy"` so load-more returns 3-col.

So 3-col vs 4-col is intentional between taxonomy and Work. The bug was only that the **cache key did not include layout**, so Work could receive taxonomy’s 3-col HTML for page 1.

---

## 5. File-by-file summary (what each does, what can go wrong)

### 5.1 `page-work.php`

- **Behavior:**  
  - If `paged === 1`: does **not** run the main portfolio query; outputs empty grid and sentinel with `data-page="0"`, `data-initial-empty="1"`, `data-context="public"`. No `data-layout`.  
  - If `paged > 1`: runs query, outputs 12 cards with `col-12 col-sm-6 col-md-4 col-lg-3` and sentinel `data-page="1"`.
- **Risk:** First paint is empty grid + spinner; first content comes from AJAX. If that AJAX returns cached 3-col HTML (because cache key didn’t include layout), you get 3 columns; load more then returns 4 columns → inconsistency. Fix: cache key + layout and purge (see §2).

### 5.2 `page-work-internal.php`

- **Behavior:** Always runs query and server-renders first page with `col-lg-3`. Sentinel has `data-context="internal"`, no `data-layout`. Load more uses same AJAX; internal doesn’t use “initial empty.”
- **Risk:** Same cache key issue only if something triggers a page-1 AJAX request (e.g. filter) and the cached response was 3-col. Fix: same as §2.

### 5.3 `taxonomy-video-format.php`, `taxonomy-industry.php`, `taxonomy-market.php`

- **Behavior:**  
  - Server-render first 12 with `col-12 col-md-6 col-lg-4` (3-col).  
  - Grid class: `row g-3 g-md-4`.  
  - Sentinel: `data-page="1"`, `data-context="public"`, **`data-layout="taxonomy"`**, taxonomy/term.  
  - Inline script: reload only when URL slug ≠ `data-term-slug` and only when first path segment is **not** `zh`/`en` (avoids Chinese infinite reload).
- **Risks:**  
  - If layout were ever not sent or cache returned 4-col, you’d see 4-col on load more (already fixed by sending `data-layout="taxonomy"`).  
  - Cache key without layout can still cause Work to get taxonomy’s 3-col; fix in §2.

### 5.4 `inc/portfolio-load-more.php`

- **Behavior:**  
  - Reads `page`, `context`, `layout`, `format`, `industry`, `market`, plus legacy `taxonomy`/`term`.  
  - Builds `$col_class` from `layout` (taxonomy → 3-col, else 4-col).  
  - For **page 1 + context public**, checks/sets transient. **Cache key =** `vp_portfolio_p1_public_{lang}_{format}_{industry}_{market}` — **no `layout`**.  
  - Returns HTML of card wrappers + cards; front-end injects or appends.
- **Risks:**  
  - Cache key omits layout → wrong column layout for Work (see §2).  
  - No other logic bug identified; filters, tax_query, and meta_query are consistent with templates.

### 5.5 `assets/js/portfolio-load-more.js`

- **Behavior:**  
  - Single script for Work, Work Internal, and taxonomy.  
  - Reads `layout` from sentinel (`sentinel.dataset.layout || ""`).  
  - If `data-initial-empty="1"` or grid has no `.vp-card`, calls `loadMore()` once (which fetches page 1 when `data-page="0"`).  
  - Load more: fetches next page, appends to grid.  
  - applyFilters: fetches page 1, replaces `grid.innerHTML`.  
  - Aborts in-flight requests on filter change; ignores load-more response if filter state changed.
- **Risks:**  
  - None for column count; it just sends whatever `layout` the sentinel has and injects server HTML.  
  - Correct behavior depends on server returning the right column class for that layout (and cache not mixing layouts).

---

## 6. Other details (no bug, but good to know)

- **Gap classes:** Work/Work Internal use `g-3 g-md-3`; taxonomy uses `g-3 g-md-4`. Small difference; not the cause of 3 vs 4 columns (that’s the column class on the child divs).
- **Order by:** `portfolio-query.php` defaults to `menu_order ASC`; `page-work.php` and the AJAX handler pass `orderby => date`, `order => DESC`, so they override. No conflict.
- **Blocks/shortcodes:** `inc/blocks/portfolio-gallery.php` and shortcode portfolio gallery use their own markup; they are not the source of the Work/taxonomy grid inconsistency.

---

## 7. What to do (in order)

1. **Fix cache key** in `inc/portfolio-load-more.php`: include `layout` in the transient key for page-1 public (e.g. `vp_portfolio_p1_public_{lang}_{layout}_{format}_{industry}_{market}`).
2. **Purge** existing portfolio page-1 transients (or at least the ones used by Work and taxonomy) after deploy.
3. **Leave** the Chinese taxonomy reload guard as-is (skip reload when first path segment is `zh` or `en`).
4. **Do not** change column classes or layout logic on templates or AJAX; the only bug was cache key + cached 3-col being served to Work.

After (1) and (2), Work and Work Internal will show a consistent 4-column grid for both the first batch and load more; taxonomy will stay 3-column for both.
