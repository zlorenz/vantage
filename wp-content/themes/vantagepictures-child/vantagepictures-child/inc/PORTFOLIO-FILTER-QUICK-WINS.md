# Portfolio filter — final quick wins (before production)

---

## After you deploy live — do this once

**Run the portfolio cache pre-warm** so the first visitors get cached filter results instead of cold ~9s loads:

- **URL (easiest):** Log in as admin on the **production** site, then visit:  
  `https://your-production-domain.com/?vp_prewarm_portfolio=1`  
  (Replace with your real domain.) Page will redirect; pre-warm is done.
- **WP-CLI (if you have SSH):** From the site root:  
  `wp vp prewarm-portfolio`

Do this once after go-live (and again after any full cache flush if you want first-load to stay fast). Include it in your production audit checklist.

---

**Context:** Cache-friendly headers and transient caching are in place. First-time filter requests (e.g. Tech, Singapore) still take ~9s because they hit the cold path. Below: diagnosis and minimal-effort options.

---

## Diagnosis

**What's working**

- `Cache-Control: public, max-age=600` is sent for page-1 public filter responses (HIT and MISS). Repeat requests within 10 min can be served from browser or transient.
- Cache key normalization and AbortController logic are in place. Initial page load is faster.

**Why some filters are still ~9s on first load**

- The **first** request for a given filter combo (e.g. Tech, Singapore) is always a **cold** path: full WordPress bootstrap → our handler → `WP_Query` (meta_query + tax_query) → 12× card render (ACF, thumbnails). No transient yet, so that work runs every time until the response is cached.
- After a full cache flush, every filter combo is cold. Object cache (Memcached) helps once warm; the first request after a flush still pays full PHP/DB cost.
- The AJAX handler does **not** call `get_terms()`; the 9s is from query + 12 cards. Caching `get_terms` in the handler would not change this.

---

## Proposed solutions (minimal effort)

### 1. Pre-warm the most-used filter combos (recommended)

After deploy (or via a one-time admin action / WP-CLI), trigger a few internal requests to the portfolio AJAX endpoint for the combos you care about most (e.g. unfiltered, `format=brand-film`, `industry=tech`, `market=singapore`). Then the "first" request is already a HIT for real users.

**Implementation:** Small PHP that does `wp_remote_post()` to `admin-ajax.php` with `action=vp_portfolio_load_more`, `page=1`, `context=public`, and the desired format/industry/market. Run once after deploy or from a "Pre-warm portfolio cache" button in admin.

### 2. Increase transient TTL (one-line change)

Current TTL is 10 minutes. Bump to 15 or 30 minutes so repeat filter clicks in a session are more likely to hit the transient.

**Trade-off:** After publishing a new portfolio item, that filter's cached first page can be stale longer (until TTL or purge). With purge on `save_post_portfolio`, 15–30 min is usually acceptable.

### 3. Production checklist (no code)

- Ensure Memcached (or object cache) is **on** in production.
- After a full cache flush in production, consider running the pre-warm so the first real user does not hit cold Tech/Singapore etc.

---

## Out of scope (to keep effort small)

- No change to query structure, card markup, or ACF.
- No `get_terms` caching in the AJAX handler (not used there).
- No new plugins.
