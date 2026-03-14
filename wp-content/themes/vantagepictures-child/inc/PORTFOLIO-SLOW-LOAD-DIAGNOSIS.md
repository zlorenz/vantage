# Portfolio Index Slow Load – Diagnosis & Fix Plan

**Page:** https://dev.vantage.pictures/work/  
**Template:** `page-work.php`  
**Goal:** Find root cause of ~10s delay before content appears; fix without breaking custom lazy-load/load-more.

---

## Phase 1 – Diagnosis

### 1.1 Initial portfolio query (how many items?)

**Finding:** The Work page does **not** request all portfolio items on first load.

- **`page-work.php`** (lines 30–58) passes `posts_per_page => 12` and `paged => $paged` into `vp_get_portfolio_query($args)`.
- So the **initial** query is limited to **12 items**; the template overrides the helper’s default.

**Caveat:** In **`inc/portfolio-query.php`** the **default** is `'posts_per_page' => -1` (all posts). Any future template or shortcode that calls `vp_get_portfolio_query()` without passing `posts_per_page` would load every portfolio item. Right now all known callers (page-work, page-work-internal, shortcode, block, AJAX load-more) pass a limit.

**Conclusion:** Too many items on first request is **not** the cause for the current Work page, but the default `-1` is a latent risk.

---

### 1.2 Thumbnails: eager vs lazy

**Finding:** Thumbnails are **lazy** in HTML, but the **size** is heavy.

- **`template-parts/portfolio/card.php`** uses `the_post_thumbnail('large', ['loading' => 'lazy', ...])`.
- So the **browser** lazy-loads images (good), but each card requests the **`large`** image size.
- WordPress core “large” is often **1024px** wide. For a grid card (e.g. 300–400px wide), that’s more than needed and increases transfer and decode time when each image enters the viewport.

**Conclusion:** Lazy loading is in place; the main image issue is **oversized thumbnails** (12 × “large”), not eager loading.

---

### 1.3 JavaScript and rendering

**Finding:** The custom load-more script is **not** blocking initial paint.

- **`assets/js/portfolio-load-more.js`** is enqueued in the **footer** (`wp_enqueue_script(..., true)` in `functions.php` ~line 985).
- It’s an IIFE that runs after DOM load and only reacts to IntersectionObserver and filter changes. It does not block parsing or first paint.

**Conclusion:** The slowdown is **not** from this script blocking rendering.

---

### 1.4 Expensive queries / loops

**Findings:**

1. **`get_terms()`** (page-work.php lines 17–23) runs once for the filter bar. With many terms it can add a little cost; unlikely to be the main cause unless taxonomies are huge.
2. **Meta query:** The Work page uses a `meta_query` for `hide_from_public`. That can prevent use of indexes if not supported by your meta storage; still, only 12 posts are fetched.
3. **Per-card work:** Each of the 12 cards calls:
   - `has_post_thumbnail()` / `the_post_thumbnail('large', ...)` (post meta + attachment)
   - `vp_portfolio_thumb_title()` → `vp_portfolio_get('thumb_title', $post_id)` (ACF/meta)
   So you have 12 ACF/meta lookups. Usually acceptable; could add up on a slow DB or uncached meta.

**Conclusion:** No single “killer” query; the combination of 12 posts + 12 “large” thumbnails + hero full-size + terms + meta is the kind of load that can feel slow on a busy or underpowered server.

---

### 1.5 Image sizes (full vs thumbnail)

**Finding:** Cards use **“large”**, and the hero uses **“full”**.

- **Card:** `the_post_thumbnail('large', ...)` (see 1.2).
- **Hero:** `get_the_post_thumbnail_url(get_queried_object_id(), 'full')` (page-work.php lines 62–65). One full-size image for the background can be very large (e.g. 2000px+).

**Conclusion:** Both hero and grid are using sizes larger than necessary for their display size, which can contribute strongly to slow TTFB and slow “something appears” if the server or network is slow.

---

### 1.6 Summary of likely causes

| Factor | Severity | Notes |
|--------|----------|--------|
| 12 × “large” card images | **High** | More data than needed; lazy but still 12 big requests. |
| Hero background “full” size | **Medium–High** | Single very large image in critical path. |
| Default `posts_per_page => -1` in helper | **Risk** | Not the cause for current Work page; could break other views. |
| get_terms + meta_query + 12× ACF | **Low–Medium** | Can add up on weak DB or cold cache. |

The **~10s before anything appears** is most likely from:

1. **Server-side time:** PHP/DB (query + meta + terms + 12× thumbnail generation) and/or slow hosting.
2. **Very large responses:** Hero “full” + 12× “large” in HTML, so document size and image URLs point to heavy assets.
3. **Blocking or slow resources:** If something in `<head>` or above-the-fold blocks or delays first paint (e.g. large render-blocking CSS, or a script that blocks).

### 1.7 Confirmed by Network tab (TTFB)

Chrome DevTools Network tab on `https://dev.vantage.pictures/work/` showed:

- **Document request:** `work/` — **20.12 s** total, **13.4 kB** size, type `document`, status 200.
- With "Disable cache" and "No throttling", the delay is almost entirely **server-side (TTFB)**. The server is taking ~20 seconds to generate and start sending the HTML; the small document size rules out "too much HTML" as the cause.

**Conclusion:** The primary bottleneck is **PHP/DB/hosting** generating the page, not client-side rendering or image count. Theme fixes (A/B/C) reduce payload and prevent future full-query risk; to cut the 20s TTFB you need **server-side** measures (caching, object cache, query/hosting).

---

## What to inspect or test (confirm diagnosis)

Do these on **staging** (dev.vantage.pictures) so you can confirm where time is spent.

1. **Server response time (TTFB)**  
   - DevTools → Network → reload `/work/` → select the **document** request.  
   - Check **Waiting (TTFB)**.  
   - If it’s many seconds, the bottleneck is server (PHP/DB/hosting).  
   - If TTFB is low but “something appears” is still ~10s, the bottleneck is parsing/rendering or large resources.

2. **How many portfolio items in the HTML?**  
   - View Page Source on `/work/` and count `class="vp-card"` or the number of `data-` sentinel-related cards.  
   - You should see **12** cards. If you see dozens or hundreds, another template or query is in play.

3. **Image sizes in the response**  
   - In Page Source, search for `wp-content/uploads` and look at image URLs.  
   - Check for `-1024x576` or similar (large) and very large dimensions (e.g. `-1920x1080` or no dimension = full).  
   - Confirms that cards use “large” and hero uses “full”.

4. **Script loading**  
   - In Network, filter by “JS”.  
   - Confirm `portfolio-load-more.js` loads in the **footer** (after the document), not in the head, so it’s not blocking first paint.

5. **Optional: Query Monitor**  
   - If you can install Query Monitor on staging, open the Work page and check:  
     - Number of queries and total query time.  
     - Which query fetches the portfolio posts (should be one query with `LIMIT 12` or similar).

Once you have:
- TTFB (high vs low),
- number of cards in HTML (12 vs more),
- and confirmation of image sizes,

you can be sure whether the fix should focus on **server/query**, **image sizes**, or **both**.

---

## Reducing the 20s TTFB (server-side)

Because the document itself takes ~20s, the biggest gains come from making the **server** faster:

1. **Page caching (e.g. SiteGround Speed Optimizer / full-page cache)**  
   Cache the HTML for `/work/` so repeat visits (and uncached crawlers) get a pre-built page. Purge cache when portfolio content or filters change.

2. **Object cache (Redis/Memcached)**  
   If available on hosting, enable object cache so `get_terms`, post meta, and repeated lookups are served from memory instead of hitting the DB every time.

3. **Database**  
   Ensure `hide_from_public` meta is indexed if you have many portfolio items (meta_value + meta_key indexes). Use Query Monitor or similar to confirm no single query is taking seconds.

4. **Hosting**  
   Staging servers are often slower than production. If production is also slow, consider a plan with better PHP/DB performance or a CDN for static assets.

5. **Plugins**  
   Temporarily disable non-essential plugins on staging and reload `/work/`. If TTFB drops sharply, one of them is adding cost (e.g. security scans, heavy hooks on `template_redirect`).

Theme changes (default query limit, smaller thumbnails, smaller hero) improve safety and payload size but do not by themselves fix a 20s TTFB; that requires caching and/or server/DB optimization.

---

## Phase 2 – Proposed fixes (apply after confirmation)

Only apply after you’ve confirmed the diagnosis (e.g. high TTFB and/or large images).

### Fix A – Safer default in portfolio query (recommended)

- **File:** `inc/portfolio-query.php`
- **Change:** Set default `'posts_per_page' => 12` instead of `-1`.
- **Reason:** Prevents any future caller that forgets to pass `posts_per_page` from loading the entire portfolio. Keeps current behavior for page-work (which already passes 12).

### Fix B – Use a smaller image size for grid cards (recommended)

- **File:** `template-parts/portfolio/card.php`
- **Change:** Use `'medium'` or `'medium_large'` (or a custom size) for the card thumbnail instead of `'large'`, e.g.  
  `the_post_thumbnail('medium_large', [...])`  
  so each card requests a smaller file. Keep `'loading' => 'lazy'`.
- **Reason:** Smaller bytes per card, faster loading when cards enter view, without changing the lazy-load architecture.

### Fix C – Hero background size (recommended)

- **File:** `page-work.php`
- **Change:** Use a large-but-bounded size for the hero background instead of `'full'`, e.g. `'large'` or a custom size (e.g. 1920px wide) so the hero image isn’t multi-megabyte.
- **Reason:** Reduces document/response size and speeds up first paint.

### Fix D – Optional: custom “portfolio thumbnail” size

- **File:** Child theme `functions.php` (or a small included file)
- **Change:** Register a dedicated image size for portfolio grid thumbnails, e.g. max width 600px, and use that in `card.php` instead of `'large'`.
- **Reason:** Optimal size for your grid; avoids relying on “medium”/“medium_large” defaults.

**Implementation order:** A + B + C first (no new image size). Add D if you want a tailored size.

**Status:** Fixes A, B, and C have been applied in the theme (portfolio-query default 12, card thumbnail `medium_large`, hero `large`).

### Fix E – AJAX-first load (TTFB fix, applied)

Because the document was taking ~20s (TTFB), the Work page was changed so the **initial request does not run the portfolio query**:

- **`page-work.php`:** On first page load (`paged === 1`), the template outputs an empty grid and the load-more sentinel with `data-page="0"` and `data-initial-empty="1"`. No `WP_Query` for portfolio posts runs, so the server can send HTML much faster.
- **`portfolio-load-more.js`:** On init, if the sentinel has `data-initial-empty="1"` or the grid has no cards, it immediately fetches page 1 via the existing AJAX endpoint and appends the HTML. The first 12 items appear when that request completes (typically a few seconds instead of 20s for the document).

Result: the **document** request should drop to a few seconds (header, hero, filters, empty grid), and the grid fills in when the AJAX response returns. Load-more and filters behave as before. For direct access to page 2+ (e.g. `?paged=2`), the full query still runs server-side so the content is in the HTML.

---

## Phase 3 – SiteGround Optimizer configuration (safe for custom lazy-load)

You’ll configure **SiteGround Speed Optimizer** and **SiteGround Security Optimizer** so they don’t break the custom portfolio lazy-load and load-more.

### SiteGround Speed Optimizer

- **Lazy load images**  
  - Prefer **off** for the site, or exclude the portfolio grid container (e.g. `#vp-portfolio-grid` or `.vp-portfolio-gallery`) from the plugin’s lazy-load so only your own `loading="lazy"` (and any custom JS) applies.  
  - If the plugin’s lazy load runs on the same images, you can get double handling or broken “load more” behavior.

- **JavaScript optimization (combine / defer / delay)**  
  - **Do not** aggressively defer or delay `portfolio-load-more.js`.  
  - Either exclude it from combination/defer/delay, or use “defer” only if you’ve verified that the script still runs after the DOM and that `vpLoadMore` is available when the script runs.  
  - Prefer **minimal safe optimizations**: e.g. defer non-critical scripts, but leave portfolio-load-more and any script it depends on (e.g. that sets `vpLoadMore`) in a non-broken order.

- **CSS**  
  - Combining and minifying CSS is usually safe. Critical CSS can be enabled with care; ensure above-the-fold portfolio styles are included so the grid doesn’t “jump” or fail to show.

- **Caching**  
  - Page and browser caching are generally safe and don’t affect your custom JS. Enable and test the Work page after enabling.

**Step-by-step (safe path):**

1. Enable **caching** (page + browser). Clear cache and test `/work/` and load-more.
2. Enable **CSS** combine/minify. Test layout and filters.
3. Leave **image lazy load** off (or exclude portfolio grid) so your lazy-load stays in control.
4. Leave **JS** combine/defer off at first. Then, if you want, enable defer for other scripts and exclude `portfolio-load-more.js` (and its dependencies) from defer/delay.
5. Re-test: load Work page, scroll to trigger load-more, change filters. Confirm no JS errors and no duplicate lazy-load.

### SiteGround Security Optimizer

- **REST API / AJAX**  
  - The load-more uses `admin-ajax.php` (action `vp_portfolio_load_more`). Ensure Security Optimizer doesn’t block or restrict `admin-ajax.php` for logged-out users (or that your nonce and actions are allowed). If the plugin has an “allowed endpoints” or “AJAX” list, ensure the portfolio action is allowed.

- **No direct impact on lazy-load**  
  - Security settings (login hardening, 2FA, etc.) don’t usually affect front-end JS. Enable what you need; test login and load-more after any “lockdown” options.

**Step-by-step (safe path):**

1. Enable recommended security options that don’t touch AJAX (e.g. login limits, 2FA if desired).
2. If there’s a “REST API” or “AJAX” protection option, check docs: ensure `admin-ajax.php` and your action are not blocked for the Work page (both logged in and logged out).
3. After enabling, test: open `/work/`, scroll to load more, use filters. If load-more or filters break, add an exception for the portfolio AJAX action.

---

## Image quality and WebP (retina, Speed Optimizer)

Portfolio imagery should stay **high quality** for a production company while keeping load time and SEO in check.

### What the theme does

- **Custom size `vp-portfolio-card`:** 1024×576 (16:9), used for grid cards. That’s enough for ~2× on typical card width (e.g. 400px display → 800px source); retina screens get a sharp image.
- **`sizes` attribute:** The card template passes a responsive `sizes` value so the browser picks the right resolution from `srcset` (WordPress generates this automatically). No oversized downloads on small viewports.
- **Lazy loading:** Cards use `loading="lazy"` so only visible (and near-viewport) images load first.

### WebP / AVIF via Speed Optimizer

- **Use it.** Converting JPEG/PNG to WebP (and AVIF if available) usually keeps **similar visual quality** with **smaller file size** (often 25–40% smaller). So you can keep a high-resolution source (e.g. 1024px) and still improve load time.
- **Settings:** In Speed Optimizer, enable image optimization / WebP (and AVIF if offered). Prefer **quality over max compression** — avoid “aggressive” or “low” quality so thumbnails don’t look soft or blocky.
- **Don’t double-lazy-load:** If the plugin adds its own lazy load, turn it off for the portfolio grid or exclude `#vp-portfolio-grid` / `.vp-card img` so only the theme’s `loading="lazy"` (and your JS) applies.
- **Regenerate thumbnails after adding the size:** If you added `vp-portfolio-card` to an existing site, run “Regenerate Thumbnails” (or your preferred tool) once so existing portfolio images get the new size. New uploads get it automatically.

### Quality vs file size

- **Retina:** 1024px-wide card thumbnails are enough for 2× on ~512px-wide cards. If you want even sharper on large desktop (e.g. 600px card), you can add a larger custom size (e.g. 1200px) and use it in the card; WebP will keep the extra resolution from costing too much.
- **Avoid heavy compression:** WordPress default JPEG quality (~82) is a good balance. Don’t drop quality to the 60s or below for portfolio imagery.
- **SEO:** Responsive images (srcset + sizes) and lazy loading are fine for SEO. Delivering WebP/AVIF with JPEG fallback (as Speed Optimizer typically does) is also fine.

---

## First-page AJAX cache (applied)

The first “load more” request (page 1, no filters) was taking ~20s because the server runs the full portfolio query and builds 12 cards. To avoid that on every visit:

- **Transient cache:** The first time page 1 (no filters, public) is requested, the response is stored in a transient for 10 minutes. Subsequent requests (same or different users) get that HTML from cache, so the grid appears in under a second after the document loads.
- **Purge:** The cache is cleared when any portfolio post is saved or its status changes, so new or updated work shows up without stale first-page content.

So: first visitor after a purge may still wait ~20s for the grid once; everyone else (and repeat visits) get a fast response until the next publish/update or 10-minute expiry.

---

## Checklist after changes

- [ ] TTFB and “time to first content” improved (or confirmed not server-bound).
- [ ] Work page still shows 12 items; load-more loads next page and appends.
- [ ] Filter dropdowns still replace grid with filtered first page and load more.
- [ ] No duplicate lazy-load (only one mechanism for portfolio images).
- [ ] SiteGround Speed: no defer/delay on `portfolio-load-more.js` unless tested.
- [ ] SiteGround Security: AJAX load-more and filters still work for logged-in and logged-out users.

Once you’ve run the Phase 1 tests and confirmed the diagnosis, you can apply Phase 2 (A+B+C, and optionally D) and then Phase 3 (optimizer settings) in order.
