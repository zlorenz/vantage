# SiteGround Optimizer – Staging config guide

Step-by-step configuration for **Speed Optimizer** and **Security Optimizer** so staging matches best practice and stays compatible with the portfolio Work page (AJAX load-more, custom lazy load, WebP).

**Reference:** Portfolio-specific notes are in `inc/PORTFOLIO-SLOW-LOAD-DIAGNOSIS.md` (Phase 3, Image quality, First-page cache).

**Speed Optimizer nav:** Dashboard → Caching → Environment → Frontend → Media → Site Performance. This guide follows that order where relevant.

---

## Part 1 – Speed Optimizer

### 1.1 Caching (Speed Optimizer → Caching)

Do these in order. After each change, save if there’s a Save button.

| Setting | Action | Why |
|--------|--------|-----|
| **Dynamic Caching** | Turn **ON** | NGINX full-page cache; big TTFB improvement. Serves cached HTML from memory. Excludes logged-in users and dynamic pages by default. |
| **File-Based Caching** | Leave **ON** (or **ON** if you only use SG Optimizer) | Builds static HTML in the WordPress cache dir. Works with Dynamic; on some setups one is primary. Keep both ON unless you use another page cache plugin. |
| **Memcached** | Turn **ON** | Object cache for DB/meta (e.g. `get_terms`, ACF, options). Speeds up the first AJAX request that builds the 12 portfolio cards. **Your screenshot showed this OFF – turning it ON is important for first-load.** |
| **Automatic Purge** | Leave **ON** | Purges cache on content/theme/plugin changes so visitors don’t see stale pages. |
| **“When clearing the cache - purge the WordPress API cache too”** | Optional: **check** if you use REST API or Gutenberg from front-end | Keeps REST cache in sync when you purge. Safe to enable. |

**After 1.1:** Clear all caches (Speed Optimizer / hosting panel if available). Open `/work/` in an incognito window (or “Disable cache” in DevTools) and confirm the page and load-more work. First load may still be slower once; second load should be much faster.

---

### 1.2 Frontend (Speed Optimizer → Frontend Optimization)

Goal: improve CSS/JS delivery without breaking the portfolio (load-more and filters).

| Setting | Action | Why |
|--------|--------|-----|
| **Combine CSS / Minify CSS** | **ON** (or per plugin defaults) | Generally safe. If the grid or filters look broken, try turning off Combine first. |
| **Preload Combined CSS** | **ON** (if you use Combine CSS) | Adds `rel="preload"` for the combined CSS so the browser fetches it earlier. Lowers render-blocking time and can improve FCP; safe with our setup. Turn on after Combine CSS is working. |
| **Combine JavaScript / Minify JavaScript** | **OFF** at first | Safer until we know portfolio works. |
| **Defer / Delay JavaScript** | **OFF** at first, or use **exclusions** | If you turn on “Defer render-blocking JS” or similar, **exclude** the portfolio script so it isn’t deferred. Exclude by handle or name, e.g. `portfolio-load-more` or `vp-portfolio-load-more`. Our script must run when the DOM is ready and must see `vpLoadMore`. |
| **Critical CSS / Above-the-fold CSS** | Optional, test after basics work | Can improve LCP. Ensure portfolio grid and filter styles are included so layout doesn’t jump. |

**Exclusion tip:** If the plugin has a “Exclude from defer” or “Exclude scripts” list, add:

- `vp-portfolio-load-more` (or the script handle used for `portfolio-load-more.js`)

**After 1.2:** Reload `/work/`, scroll to trigger load-more, change filters. No JS errors in Console; grid and filters behave normally.

---

### 1.3 Media (Speed Optimizer → Media)

Align with portfolio image quality and existing lazy load.

| Setting | Action | Why |
|--------|--------|-----|
| **Use WebP Images** | **ON** | Same visual quality, smaller files. Good for retina card images. |
| **Image compression level** | **None** (or **Recommended** and use Preview to check quality) | We want high quality for portfolio. “None” is safe; try Recommended later and preview. |
| **Lazy Load Media** | **ON** | Keep ON for the rest of the site. |
| **Exclude CSS Classes from Lazy Load** | Add: **`vp-card-img`** | Portfolio card images use this class. Excluding them avoids double lazy-load and keeps only the theme’s `loading="lazy"` for the grid. |
| **Maximum Image Width** | e.g. **2560px** (or leave default) | Caps huge uploads; fine for portfolio and heroes. |

**After 1.3:** Reload `/work/`, check that card images load (and lazy-load) as before and look sharp. No duplicate lazy-load behavior.

---

### 1.4 HTML, fonts, and other front-end options

| Setting | Action | Why |
|--------|--------|-----|
| **Minify the HTML Output** | **ON** | Strips unnecessary whitespace/comments from HTML; reduces document size and can improve load. Safe for our setup. Leave “Exclude from HTML Minification” empty unless you have a specific URL or pattern that breaks (e.g. a page that relies on exact whitespace). |
| **Web Fonts Optimization** | **ON** | Changes how Google (and similar) fonts load to save requests; fonts are often preloaded or loaded more efficiently. Safe. If you see a visible “flash” when fonts load (FOUT), you can tune font-display or preload next. |
| **Fonts Preloading** | **ON**; add only fonts in use | Preload the font files your site actually uses (full URLs). Speeds up first paint of text. Add only the font URLs you use (e.g. from your theme or Google Fonts) so you don’t preload unused fonts. |
| **Remove Query Strings from Static Resources** | **ON** | Removes `?ver=1.0.0` etc. from CSS/JS so caches and CDNs can cache them better. Standard practice; no impact on portfolio. |
| **Disable Emojis** | **ON** | Stops WordPress from loading the default emoji script/CSS. Saves a couple of requests; no impact on portfolio or normal content (emojis still display via system fonts). |
| **DNS Pre-fetch for External Domains** | **ON**; add domains you use | Resolves external hostnames (e.g. fonts, analytics, Vimeo) before resources are requested. Add domains you actually use, e.g. `https://fonts.googleapis.com`, `https://fonts.gstatic.com`, your analytics/GTM domain, `https://player.vimeo.com` if you embed Vimeo. |

**After 1.4:** Clear cache and do a quick visual pass: fonts load correctly, no layout shifts, portfolio and filters still work. No need to exclude anything for portfolio.

---

### 1.5 Environment (Speed Optimizer → Environment)

| Setting | Action | Why |
|--------|--------|-----|
| **HTTPS Enforce** | **ON** | Forces the site to load over HTTPS and updates insecure links in the database; adds an .htaccess rule so all requests use an encrypted connection. Use on staging and production. |
| **Fix Insecure Content** | **ON** if you see mixed-content warnings | Dynamically rewrites insecure (http) requests for resources from your site so browsers don’t block them. Enable if the browser reports “insecure content” or mixed HTTP/HTTPS on HTTPS pages. |
| **WordPress Heartbeat Optimization** | **ON** (use recommended values below) | Heartbeat runs every 15–60s and can increase CPU when many logged-in tabs are open. Tuning it reduces server load without affecting the portfolio. |
| **Heartbeat – WordPress Admin Pages** | **Disabled** (Recommended) | Stops Heartbeat in wp-admin. Auto-save and real-time features in the editor may be affected; many sites leave it disabled. |
| **Heartbeat – Posts and Pages** | **120s** (Recommended) | Runs Heartbeat in the editor every 120 seconds instead of 15. Keeps auto-save but reduces requests. |
| **Heartbeat – Site Frontend** | **Disabled** (Recommended) | Stops Heartbeat on the front end. No impact on portfolio load-more or filters (they use admin-ajax.php, not Heartbeat). |
| **Scheduled Database Maintenance** | **Enabled** | Runs weekly cleanup (revisions, spam, etc.) so the database stays smaller and faster. Use **Edit** to choose which tasks run (e.g. post revisions, orphaned meta, transients). |

**After 1.5:** If you turned on HTTPS Enforce, confirm the site loads over HTTPS and there are no mixed-content errors. Heartbeat and DB maintenance need no extra testing for the portfolio.

---

### 1.6 Other (Site Performance, etc.)

- **Browser Caching:** Usually **ON** (in Caching or Environment). No conflict with portfolio.
- **Database / Image optimization:** Use per plugin; avoid changing our portfolio image size or breaking WebP.
- **CDN:** If you add one later, purge cache after config changes and test `/work/` again.
- **Site Performance tab:** Enable any recommended options that don’t alter JS/CSS delivery or images; re-test `/work/` and load-more after changes.

---

## Part 2 – Security Optimizer

Goal: Harden security without blocking `admin-ajax.php` (used by portfolio load-more and filters).

### 2.1 Login & general security

| Area | Suggestion | Note |
|------|------------|------|
| **Login attempt limiting** | **ON** (e.g. 5–10 attempts, then lockout) | Reduces brute force. |
| **Two-factor authentication (2FA)** | Optional | Stronger admin security. |
| **Custom login URL** | Optional | Obscures `/wp-admin` and `/wp-login.php`. |
| **Disable XML-RPC** | **ON** if you don’t need it | Cuts attack surface. |
| **Activity log** | **ON** if you want audit trail | No impact on front-end. |

### 2.2 REST API & AJAX (important for portfolio)

Portfolio load-more sends **POST** to `admin-ajax.php` (action `vp_portfolio_load_more`). That must stay allowed for both logged-in and logged-out users.

| Setting | Action | Why |
|--------|--------|-----|
| **REST API / “Block REST API” or “Restrict REST API”** | **OFF** or **Don’t block** for anonymous GET if you use blocks/API | Our feature uses **admin-ajax.php**, not REST, but some Security Optimizer options affect both. |
| **Firewall – 6G / 5G – Block request methods** | Do **not** block **POST** | Load-more uses POST. Blocking POST would break the grid. If you see “Block PUT method” and similar, leave POST allowed. |
| **“Lock system folders” / “Protect wp-includes” etc.** | Use defaults; avoid blocking `admin-ajax.php` or `wp-admin` for POST | So AJAX still reaches WordPress. |

**If load-more or filters break after enabling Security Optimizer:**

1. Temporarily disable Security Optimizer and confirm `/work/` and load-more work again.
2. Re-enable and turn off options one by one (or relax firewall rules) until you find what blocks POST to `admin-ajax.php`.
3. Keep that option off or add an exception for `admin-ajax.php` (or the action `vp_portfolio_load_more`) if the plugin allows it.

### 2.3 Post-hack / advanced

- Use per plugin docs. No special exclusions needed for portfolio if POST and `admin-ajax.php` remain allowed.

---

## Part 3 – Checklist (staging)

Use this after you’ve applied the steps above.

**Speed Optimizer**

- [ ] Dynamic Caching **ON**
- [ ] File-Based Caching **ON**
- [ ] **Memcached ON** (was OFF in your screenshot – turn it on)
- [ ] Automatic Purge **ON**
- [ ] WebP **ON**
- [ ] Lazy Load **ON**, with **`vp-card-img`** in “Exclude CSS Classes from Lazy Load”
- [ ] No JS combine/defer applied to `vp-portfolio-load-more` (or portfolio script excluded from defer)
- [ ] Minify HTML **ON**; Web Fonts Optimization **ON**; Fonts Preloading **ON** (only fonts in use); Remove Query Strings **ON**; Disable Emojis **ON**; DNS Pre-fetch **ON** (add external domains you use)
- [ ] **Environment:** HTTPS Enforce **ON**; Fix Insecure Content **ON** if you had mixed-content issues; Heartbeat Optimization **ON** (Admin **Disabled**, Posts/Pages **120s**, Frontend **Disabled**); Scheduled Database Maintenance **Enabled**
- [ ] Clear all caches once after saving

**Security Optimizer**

- [ ] Login / 2FA / activity log as desired
- [ ] POST to `admin-ajax.php` not blocked (load-more and filters work when logged out)
- [ ] No firewall rule blocking POST for the Work page

**Portfolio**

- [ ] `/work/` loads; first 12 cards appear (from AJAX or cache)
- [ ] Scroll loads more items
- [ ] Filter dropdowns replace grid and load filtered page 1
- [ ] No console errors; images lazy-load once (no double lazy-load)
- [ ] First load (cold cache) can still be slower; second load (with Dynamic + File-Based + Memcached) should be clearly faster

---

## Quick reference – what each cache does

| Layer | What it caches | Effect on portfolio |
|-------|----------------|--------------------|
| **Dynamic Cache** | Full HTML of pages (e.g. `/work/`) | Document request is fast; grid still loads via AJAX (or from our transient for page 1). |
| **File-Based Cache** | Static HTML in wp-content cache | Same idea; often used together with Dynamic on SG. |
| **Memcached** | DB queries, options, transients (object cache) | Speeds up the **first** AJAX request that builds the 12 cards (fewer slow DB/meta calls). |
| **Our transient** (`vp_portfolio_page1_public`) | HTML for “page 1, no filters” | After first slow request, that response is reused for 10 minutes so the grid appears fast. |

Together: Dynamic + File-Based make the **document** fast; Memcached + our transient make the **first grid load** faster (cold) or very fast (warm).
