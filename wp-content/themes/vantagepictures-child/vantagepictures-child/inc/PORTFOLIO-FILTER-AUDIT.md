# Portfolio filter UX – audit and fixes

**Problem:** Filters feel slow and buggy: grid takes a long time to update, and if someone clicks another filter while waiting it gets worse (wrong results, inconsistent state). User reported: selecting "Market > Singapore" showed 5 correct items plus 12 incorrect/duplicate items (17 total); WP admin shows only 5 items under Singapore. Reload with `?market=singapore` showed 5 correctly.

---

## Stage 1 – Root cause of incorrect/duplicate posts

**Cause:** A **load-more** request (page 2 of the *previous* filter, e.g. Brand Film) was still in flight when the user changed to a new filter (e.g. Singapore). Filter change correctly replaced the grid with the new filter’s page 1 (5 Singapore items). When the old load-more response arrived later, it was still appended to the grid, so the grid showed 5 + 12 = 17 items (5 correct, 12 from the previous filter). Filter requests were already aborted on new selection; **load-more requests were not**, so their responses could still be applied out of order.

**Fix implemented:**

1. **Abort in-flight load-more when filters change**  
   In `applyFilters`, call `loadMoreAbortController.abort()` so any active load-more request is cancelled. `loadMore` now uses its own `AbortController` and passes its `signal` to `fetchPage(nextPage, signal)`.

2. **Ignore load-more response if filter state changed**  
   In `loadMore`, before sending the request we store `filtersWhenSent = readDropdownFilters()`. When the response arrives, we compare with current `readDropdownFilters()`. If any of format/industry/market differ, we discard the response and do not append. That way even if the abort doesn’t cancel the request in time, we still don’t append stale data.

---

## Stage 2 – Performance audit (bottlenecks)

- **Every filter click triggers a full server round trip:** Yes. Each filter change calls `applyFilters` → `fetchPage(1, signal)` → `admin-ajax.php` → full `WP_Query` + 12-card HTML render. No way to avoid a round trip for filtered content without preloading all filter combos (heavy).
- **Fresh WP_Query each time:** Yes. Caching (transient per filter combo, 10 min) makes repeat requests for the same filter fast; first request for a given combo is still a full query.
- **Full HTML for grid returned:** Yes. Server returns full HTML for 12 cards (or fewer for small result sets). Lighter payloads (e.g. JSON + client render) would require a larger refactor.
- **Grid DOM:** We replace `grid.innerHTML` on filter; we append on load-more. No duplicate replace/append in the same flow after the fix.
- **Image/layout reflow:** Replacing 12 cards with new HTML causes reflow and image loads. Cards use `loading="lazy"` so images load as they enter view; no extra optimization done here.
- **Load-more vs filter coupling:** Both use the same `fetchPage` and `getPayload` (which reads current dropdowns). Pagination is reset on filter (`sentinel.dataset.page = "1"`). Coupling is intentional; the bug was load-more not being aborted/ignored when filters change (now fixed).
- **Request payload:** Small (action, nonce, page, per_page, context, format, industry, market, layout, taxonomy, term). Not a bottleneck.
- **Multi-taxonomy query:** Single `tax_query` with AND relation; standard and indexable. Memcached/object cache helps.
- **Client re-render:** We only set `grid.innerHTML` and add reveal classes. No heavy client-side work.

---

## Stage 3 – Low-risk improvements (already in place or applied)

- **Abort stale filter requests:** Already in place (filter AbortController + requestId).
- **Abort stale load-more when filter changes:** Implemented in Stage 1.
- **Ignore out-of-order load-more response:** Implemented in Stage 1 (filter-state check).
- **Filter bar loading state:** `.vp-filterbar--loading` and sentinel spinner.
- **Server-side cache for filtered first page:** Transient per format/industry/market combo; 10 min TTL; purged on portfolio save.
- **Pagination reset on filter:** `sentinel.dataset.page = "1"` at start of `applyFilters`.
- **Replace not append on filter:** `grid.innerHTML = html` (full replace). No change needed.

Optional future tweaks (not required for correctness): small debounce (e.g. 150 ms) on dropdown change to avoid double-fires from rapid clicks; or temporarily disabling the observer while `loading` is true so the sentinel doesn’t trigger load-more immediately after a filter apply (currently we rely on abort + filter-state check).

---

## Performance polish (perceived speed)

**Grid loading state:** When a filter is selected, the grid immediately gets the class `vp-portfolio-gallery--loading` (opacity 0.6, pointer-events none) so the user sees instant feedback that a refresh is in progress. Removed when the response is applied or on abort/error.

**Observer delay after filter:** After applying filter results we call `setTimeout(resetObserver, 400)` instead of `resetObserver()` so the IntersectionObserver is re-armed 400 ms later. That prevents the sentinel (often still in view with a short result set) from immediately triggering a load-more request for page 2 (often empty). Reduces unnecessary round trips and makes the filter apply feel less “double-loaded.”

**Cache-friendly headers when serving from transient:** When the AJAX handler serves a cached result (transient hit), it sends `Cache-Control: public, max-age=600` so the browser may cache the response for 10 minutes, and `X-VP-Cache: HIT` so you can confirm in DevTools that the response came from our transient. Repeat same filter within that window can be instant from browser cache.

**`nocache_headers` filter:** WordPress calls `nocache_headers()` at the start of `admin-ajax.php`, which sends `Cache-Control: no-cache, ...` before our handler runs. We add a `nocache_headers` filter that, for our action, checks the transient for the current request (page 1, public, same format/industry/market). If there is a cache hit, we return cache-friendly headers (`Expires`, `Cache-Control: public, max-age=600`) so WordPress sends those instead of no-cache. That way the response is cacheable from the first byte; we still send `X-VP-Cache: HIT` in the handler when we serve from cache.

---

## Audit (original)

### 1. Server side

- **Only unfiltered first page is cached.** The transient `vp_portfolio_page1_public` stores HTML for “page 1, no filters.” Every **filtered** request (e.g. Format = Commercial) runs the full query and 12-card render with no cache, so each filter change can take several seconds.
- **Result:** First time a filter is applied it’s slow; repeated use of the same filter is still slow.

### 2. Client side (JS)

- **No request cancellation.** When the user changes the filter again while a request is in flight, the previous request is not aborted. When it completes, its HTML is applied — so the grid can show results for the **previous** filter while the dropdown already shows the new one (“gets worse”).
- **`if (loading) return`.** If the user selects Filter B while the request for Filter A is loading, `applyFilters` exits and does nothing. The dropdown shows B but the grid will later update with A’s results. The latest click is ignored and the UI is inconsistent.
- **No loading state on the filter bar.** Only the sentinel (below the grid) shows a spinner. The filter bar doesn’t look “busy,” so users don’t know to wait and may click again.
- **Dropdowns stay enabled.** Users can keep changing filters; combined with no cancellation and “loading” guard, this leads to stale responses and confusion.

---

## Proposed solutions (implemented)

### A. Client (portfolio-load-more.js)

1. **AbortController + request id**  
   Each filter request uses an `AbortController`. When the user changes the filter again, abort the previous request. When a request completes, only apply the result if it’s still the “current” request (e.g. a numeric `requestId`). That way only the **latest** selection’s result is applied and rapid clicks don’t leave the grid showing stale data.

2. **Loading state on filter bar**  
   Add a class (e.g. `vp-filterbar--loading`) to the filter bar and a loading overlay or spinner on the grid while a filter request is in progress. Optionally disable the dropdowns during load so the state is clear (re-enable when request finishes or is aborted).

3. **No blocking on `loading` for new filter**  
   Allow starting a new filter request when the user changes the dropdown again: abort the previous request and start a new one with the new filter state. That way the latest click always “wins” and the grid updates to match.

### B. Server (portfolio-load-more.php)

4. **Cache filtered first page**  
   Cache page-1 results per filter combo (format, industry, market) in transients, e.g. key `vp_portfolio_p1_public_{format}_{industry}_{market}`. First time a filter is applied it’s slow; subsequent requests for that same combo (same or different user) are served from cache. TTL 10 minutes. On portfolio save/update, purge all filter transients (maintain a list of cache keys and delete each).

---

## Files changed

- `assets/js/portfolio-load-more.js` — AbortController, request id, filter-bar loading state, only apply latest result.
- `inc/portfolio-load-more.php` — Cache filtered first page; purge filter caches on portfolio save; `nocache_headers` filter sends cache-friendly headers for all page-1 public (HIT and MISS); `X-VP-Cache: HIT` / `X-VP-Cache: MISS`; `vp_portfolio_normalize_filter_for_cache()` so `""` and `"all"` share the same cache key and tax_query.

---

## Testing after a full cache flush

- **Why it can feel worse right after a flush:** Every filter combo is cold (transient empty). The first request for each combo is a full query + render, so you see the slow path. Only the *second* request for the same filter (same format/industry/market) hits the transient and returns fast.
- **DevTools “Disable cache”:** If this is checked, the browser will not use our `Cache-Control: public, max-age=600` and will refetch every time. Uncheck it when testing repeat filter clicks to see browser-cache benefit.
- **What to look for:** For both **miss** and **hit**, page-1 public responses should show `Cache-Control: public, max-age=600`; miss shows `X-VP-Cache: MISS`, hit shows `X-VP-Cache: HIT`. Browser can cache both. `Sg-F-Cache: BYPASS` is expected for `admin-ajax.php`; our optimization is transient + browser cache, not full-page cache.

---

## Diagnosis: Why filters still feel slow after deploy + flush

**What your screenshots show**

1. **Many requests are cache MISSes**  
   Multiple `admin-ajax.php` responses show `Cache-Control: no-cache, ...` and no `X-VP-Cache: HIT` (or show `X-VP-Cache: MISS` if that header is present). So the transient is not being hit for those requests.

2. **When cache does hit, it works**  
   At least one screenshot shows `200 OK (from disk cache)`, `Cache-Control: public, max-age=600`, and `X-VP-Cache: HIT`. So the implementation is correct when the same filter combo is requested again.

3. **Very long times on MISS**  
   Some requests take 25–33+ seconds; many take 2–5 seconds. All of that is the “cold” path: full WordPress load + `WP_Query` + 12-card HTML render. No layer (transient, browser, proxy) is helping on the first request for a given filter combo.

4. **Lots of canceled requests**  
   Many `admin-ajax.php` requests are `(canceled)`. That’s expected: when you change the filter before the previous request finishes, the client aborts it. So the slowness is in the server taking too long to respond before the cancel, not in the cancel logic itself.

5. **Possible cache key fragmentation**  
   The cache key is `vp_portfolio_p1_public_{format}_{industry}_{market}`. “All” in the dropdowns is `value=""`. If the URL or JS ever sends `industry=all` or `market=all` (e.g. from `?industry=all`), the key becomes `_all_all` instead of `__` (empty). Same logical filter (e.g. Brand Film + All + All) would then use two different keys and never share the cache, so you get more MISSes and slower perceived behavior.

**Root causes**

- **Full flush = everything is cold**  
  After flushing SG + Memcached + transients, every filter combination is a MISS on first request. You’re hitting the slow path for almost every click until each combo has been requested once.

- **Cold path is heavy**  
  On a MISS, the server does full WordPress bootstrap, our handler, `WP_Query` (with `meta_query` + `tax_query`), 12× card render (with thumbnails, ACF, etc.). That can easily be 2–10+ seconds depending on server and object cache.

- **Cache key consistency**  
  If `""` and `"all"` (or different URL shapes) produce different keys for the same logical filter, the transient is underused and you see more MISSes and “feels longer” than it should after a few clicks.

---

## Proposed solutions (before implementing)

**1. Normalize cache key (high impact, low risk)** — **Implemented**  
- In `portfolio-load-more.php`, when building the cache key, treat empty string and `"all"` (case-insensitive) as the same.  
- Use a single normalized value (e.g. `""`) for “no filter” so that:
  - `format=brand-film&industry=&market=`  
  - `format=brand-film&industry=all&market=all`  
  produce the same cache key and can hit the same transient.

**2. Send `X-VP-Cache: MISS` on the miss path (diagnostics)**  
- When we do *not* serve from transient (page 1, public), send `X-VP-Cache: MISS` in the response so DevTools clearly shows whether the response was cached or not. No behavior change, only observability.

**3. Slightly speed up the cold path (medium impact)**  
- Cache `get_terms()` for the filter dropdowns (e.g. in a transient or object cache) so that repeated calls in the same request or across requests are cheap.  
- Ensure the main portfolio `WP_Query` is as lean as possible (indexes, no redundant meta/term queries).  
- Optionally increase transient TTL for page-1 filter results (e.g. from 10 to 15 minutes) so that after a flush, the first computation is reused a bit longer.

**4. Pre-warm cache (optional)**  
- After deploy or after a manual “flush” action, run a small script (e.g. WP-CLI or one-time admin action) that requests page 1 for the most common filter combos (e.g. unfiltered + a few format slugs + all/empty industry/market). That way the first real user request for those combos can be a HIT.

**5. UX only (no backend change)**  
- Keep the current loading state (grid dimming, spinner). Optionally add a short “Loading…” label so users see that the app is working while the cold request completes.

**Recommended order**

- Do **1** (normalize cache key) and **2** (add `X-VP-Cache: MISS`) first. That maximizes cache reuse and makes it obvious in DevTools when you’re on the miss path.  
- Then, if cold path is still too slow, do **3** (get_terms + query tuning) and optionally **4** (pre-warm).  
- **5** is optional and can be done anytime.

---

## Diagnosis: "No-cache" on filter responses after deploy + flush (Mar 2026)

**What’s working**

- **Cache key normalization (solution 1)** is helping: filters feel slightly smoother; initial load of portfolio items is much faster.
- **When the transient hits:** Response has `Cache-Control: public, max-age=600`, `X-VP-Cache: HIT`, and very low TTFB (e.g. 1.5 ms, 278 ms). So the HIT path is correct.

**Why you still see no-cache**

- The `nocache_headers` filter only replaces WordPress’s default headers when we **have a transient hit**. It checks `get_transient($cache_key)` and, if miss, returns the default `$headers` (no-cache).
- So for every **MISS** (first request for a filter combo after flush, or after 10 min expiry), WordPress’s `no-cache, must-revalidate, max-age=0, no-store, private` is sent. We never override that on the miss path.
- Result: first request for a combo is slow (full query) and the response is marked non-cacheable, so the browser doesn’t store it. The second request for the same combo can be a server-side HIT and fast, but if the user or another tab hits the same filter again before the transient is warm, they still get a full round-trip and no browser cache.

**Proposed fix: cache-friendly headers for all page-1 public responses (HIT and MISS)**

1. **`nocache_headers` filter**  
   For our action when `page === 1` and `context === 'public'`, **always** return cache-friendly headers (`Expires`, `Cache-Control: public, max-age=600`). Remove the transient check from this filter so that both HIT and MISS responses are sent with the same cacheable headers. The filter runs at the start of the request; we only need to decide “is this a page-1 public portfolio load?” and if yes, send cache-friendly headers.

2. **Handler**  
   - Keep sending `X-VP-Cache: HIT` when we serve from the transient.  
   - Send `X-VP-Cache: MISS` when we are about to `wp_send_json_success($payload)` after building the response (page 1, public) and we did *not* serve from cache. That keeps DevTools clear (HIT vs MISS) and doesn’t change caching behavior.

**Effect**

- **MISS:** First request for a filter combo is still slow (full query), but the response will have `Cache-Control: public, max-age=600`, so the browser can cache it. A repeat request for the same filter within 10 minutes can be served from the browser cache (no server round-trip).
- **HIT:** Unchanged: we serve from transient and send `X-VP-Cache: HIT`; the filter already makes the response cacheable.

**Risk**

- Low. We only broaden “cacheable” to include the first (MISS) response for the same endpoint we already cache on the server. Content is the same; we’re just allowing the browser to cache it too.
