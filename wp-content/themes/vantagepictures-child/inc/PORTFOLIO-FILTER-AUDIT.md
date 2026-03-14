# Portfolio filter UX – audit and fixes

**Problem:** Filters feel slow and buggy: grid takes a long time to update, and if someone clicks another filter while waiting it gets worse (wrong results, inconsistent state).

---

## Audit

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
- `inc/portfolio-load-more.php` — Cache filtered first page; purge filter caches on portfolio save.
