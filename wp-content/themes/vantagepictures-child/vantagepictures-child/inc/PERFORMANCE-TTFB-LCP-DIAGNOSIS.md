# Performance diagnosis: TTFB, LCP, third‑party (staging)

**Site:** https://dev.vantage.pictures  
**Tested:** Homepage, `/work/`  
**Date:** March 2026

---

## 1. Short diagnosis

- **Document TTFB (~1.33s)** is the main bottleneck. The browser waits ~1.33s before receiving the first byte of HTML, so every resource (images, CSS, JS) is delayed by that amount. FCP/LCP sit around 2.3–2.75s largely because the document (and thus discovery of LCP candidates) is late.
- **Image response timing** is a secondary issue: once an image is requested, server TTFB for that request is often 500–1000ms. Compression (WebP, size) is already good; the problem is when the request starts and how long the server takes to respond.
- **Above-the-fold / LCP images** are discovered only after the HTML that contains them is received. On the homepage the LCP candidate is the first hero carousel slide (CSS `background-image`); its URL is in the body, so the image request starts only after the 1.33s document TTFB plus parsing. On `/work/`, the hero background (if present) is in the initial HTML; the first grid images come from AJAX (discovered ~2.2s+), so the hero is the likely LCP candidate there.
- **Lazy loading** is not delaying the critical image: the hero is a CSS background (home) or a hero background (work), not an `<img loading="lazy">`. Portfolio card images correctly use `loading="lazy"` for below-the-fold content.
- **CSS/JS** are not the main bottleneck: TBT is low (17–21ms). Improving critical path (e.g. preload combined CSS, critical CSS) can help marginally but will not fix the 1.33s TTFB or late image discovery.
- **Third‑party scripts** (GTM, GA4, Facebook, LinkedIn, Clarity, Metricool, Bing, Snap) add many requests and load after FCP/LCP in the waterfall; they are not the primary cause of slow LCP but can be delayed to reduce contention and improve “Document Complete”.

**Conclusion:** The **main bottleneck** is **document TTFB (~1.33s)** and cache behavior. The highest‑impact lever is improving full-page cache (Dynamic + File-Based + exclusions/cookies/headers). LCP preload is implemented but must be **validated** before treating it as a win; do not add more preloads until then.

---

## 2. Top 5 optimization opportunities

| # | Opportunity | Impact | Effort | Notes |
|---|-------------|--------|--------|--------|
| **1** | **Improve document cache / TTFB** (SiteGround) | High | Config | Ensure Dynamic + File-Based Caching and Memcached are ON; confirm homepage and `/work/` are not excluded; no cookies/headers causing BYPASS. **Primary focus.** See `inc/SG-CACHE-TTFB-AUDIT.md`. |
| **2** | **Validate LCP preload** (already in theme) | Unknown until tested | — | Run fresh WebPageTest: confirm preloaded image is the LCP resource, image request starts earlier, LCP improves. Do **not** add more preloads until validated. |
| **3** | **Delay non‑critical third‑party tags in GTM** | Medium | Config | Trigger Facebook, LinkedIn, Clarity, Metricool, Bing, Snap (and similar) on `window.load` or after a short delay so they don’t compete with critical resources in the first 2–3s. GTM container change only. |
| **4** | **Preload key static assets** | Medium | Low | If critical CSS or fonts are known, add `rel="preload"` for the main stylesheet and/or primary font URL (e.g. in SG Optimizer “Fonts Preloading” or in theme). Complements SG Optimizer “Preload Combined CSS”. |
| **5** | **Verify / tune image and object caching** | Medium | Config | Ensure static assets (e.g. `/wp-content/uploads/`) are cached (browser + server/CDN) and that image requests don’t hit PHP. Long cache lifetime is already in place; confirm no cache bypass for image URLs. |

---

## 3. Current priority: document TTFB and cache

**Main focus:** HTML/document TTFB and cache behavior (homepage and `/work/`).

- **Audit:** Use **`inc/SG-CACHE-TTFB-AUDIT.md`** to confirm Dynamic Cache and Memcached are enabled and used; identify what prevents full-page cache for anonymous visitors; check cookies, headers, and custom logic for bypass; and apply the GTM/third-party delay recommendations.
- **LCP preload:** Already in theme; **validate** with a fresh WebPageTest (is the preloaded image the LCP resource? does the image request start earlier? does LCP improve?). Do not add further preload hints until validation is done.

---

## 4. Exact code / configuration changes

### 4.1 Preload LCP image (child theme) — implemented; validate before keeping

See `functions.php` (block added after the “Ensure child stylesheet only loads once” block): hook `wp_head` priority 5 that outputs:

- **Front page:** `<link rel="preload" as="image" href="...">` for the first hero carousel slide’s featured image (same URL as used in the carousel `background-image`).
- **Work page:** Same for the work page hero background image when the page has a featured image.

Conditions: only runs on front page or work page; uses ACF for home (first slide), `get_the_post_thumbnail_url()` for work; no preload if URL is empty. Uses `esc_url()` and a single early return to avoid extra queries on other pages.

### 4.2 Document TTFB (SiteGround / hosting)

Full checklist and bypass causes: **`inc/SG-CACHE-TTFB-AUDIT.md`**.

- **Speed Optimizer → Caching:** Dynamic Caching **ON**, File‑based Caching **ON**, Memcached **ON**.
- Confirm homepage and `/work/` are not excluded from dynamic cache (e.g. no custom `Cache-Control: no-cache` or `no-store`, no cookies that disable cache for anonymous users).
- If using “Exclude URLs from Caching”, ensure `/` and `/work/` are not listed (unless there is a strong reason).
- After changes, clear cache and test in incognito; check response headers for the main document (e.g. `x-cache` or similar from SG) to confirm cache HIT on second request.

### 4.3 Third‑party scripts (GTM)

- In GTM, for tags that are not needed for first paint (e.g. Facebook, LinkedIn, Clarity, Metricool, Bing, Snap):
  - Change trigger from “All Pages” / “Window Loaded” to **“Window Loaded”** (if not already), or
  - Use a **timer** trigger (e.g. 3–4 seconds after page load) so they fire after LCP.
- Keep GTM and any tag required for critical analytics (e.g. GA4 page view) as is; only delay non‑critical tags.

### 4.4 Preload critical CSS / fonts (optional)

- **SG Optimizer → Frontend:** “Preload Combined CSS” **ON** if Combine CSS is used.
- **SG Optimizer → Fonts Preloading:** Add the exact font URLs in use (e.g. from theme or Google Fonts), one per line.
- No code change in theme required unless you add a custom preload for a specific critical CSS file.

### 4.5 Image / static asset caching

- Confirm server or CDN is caching `/wp-content/uploads/` (and other static assets) and that image URLs don’t hit PHP (no query params that force dynamic handling unless needed).
- Browser cache lifetime for images is already long; no change needed there unless you see short `max-age` in response headers.

---

## 5. What not to do (constraints)

- Do **not** rewrite the portfolio AJAX system for this; the AJAX request is not the primary bottleneck.
- Do **not** change TranslatePress ALD or plugin files.
- Do **not** remove or change lazy loading on portfolio cards; it’s correct for below-the-fold content.
- Do **not** add more preload hints until the current LCP preload is validated (WebPageTest: preloaded image = LCP resource? request earlier? LCP improved?).
- Prefer child‑theme and configuration changes over modifying plugins or core.
