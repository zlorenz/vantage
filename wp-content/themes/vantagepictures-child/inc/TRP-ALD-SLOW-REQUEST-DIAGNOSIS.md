# TranslatePress ALD slow request (403, ~1.6s) – diagnosis

**Request:** `POST https://dev.vantage.pictures/wp-content/plugins/translatepress-business/add-ons-pro/automatic-language-detection/includes/trp-ald-ajax.php`  
**Observed:** 403 Forbidden, TTFB ~1610 ms, total ~1.6 s, triggered by jQuery after initial page load (~2.3 s).

---

## 1. What triggers the request to `trp-ald-ajax.php`?

The request is triggered by the **TranslatePress Automatic Language Detection (ALD)** add-on’s front-end script.

**Flow:**

1. On every front-end page load, the add-on enqueues `trp-language-cookie.js` (see `class-automatic-language-detection.php` → `enqueue_cookie_adding()`).
2. When the script runs, it instantiates `TRP_IN_Determine_Language()` and calls `initialize()`.
3. In `initialize()` (in `trp-language-cookie.js`):
   - If the URL has `trp_lang_switch=1`, it sets the cookie from the current URL and returns (no AJAX).
   - Else if a valid `trp_language` cookie exists, it calls `redirect_if_needed(language_from_cookie)` (no AJAX).
   - **Else (no cookie or invalid cookie)** it calls `ajax_get_needed_language()`.
4. `ajax_get_needed_language()` sends a **jQuery POST** to `trp_language_cookie_data['trp_ald_ajax_url']`, i.e. the URL of `trp-ald-ajax.php`, with `action: 'trp_ald_get_needed_language'` and detection method, languages, etc.

So the request is triggered on the **first visit** (or when the language cookie is missing/cleared): the script tries to detect browser/IP language and then either redirect, show the popup, or set the cookie.

**Summary:** The request is triggered by `trp-language-cookie.js` when there is no valid `trp_language` cookie. It runs shortly after page load (~2.3 s in your test), which matches “after the initial page load” in the waterfall.

---

## 2. Is this request from the TranslatePress Automatic Language Detection add-on?

**Yes.** It is the add-on’s only front-end AJAX call:

- The URL is inside `translatepress-business/add-ons-pro/automatic-language-detection/includes/trp-ald-ajax.php`.
- The script that fires it is the add-on’s `assets/js/trp-language-cookie.js`, which posts to `trp_ald_ajax_url` (that file).
- The PHP file handles `$_POST['action'] === 'trp_ald_get_needed_language'` and returns the “needed” language (browser/IP-based) as JSON.

---

## 3. Why would this request return 403 on staging?

The endpoint is **not** run through WordPress. It is a **standalone PHP file** requested by direct URL:

- No `require 'wp-load.php'` (or similar).
- No `defined('ABSPATH')` check.
- It defines a mock `apply_filters()` and runs `new TRP_IN_ALD_Ajax; die();` so it can work without WordPress.

So the browser is doing:

`POST https://dev.vantage.pictures/wp-content/plugins/.../trp-ald-ajax.php`

Many security setups (including **SG Security** and common server rules) **block direct execution of PHP under `wp-content/plugins/`** to prevent abuse. Requests to such URLs are often answered with **403 Forbidden** before the plugin code runs (or after a short run and then a block). So the 403 on staging is almost certainly from:

- **SG Security** (or similar “block direct plugin access” rule), or  
- Server / WAF rules that forbid executing PHP in `/wp-content/plugins/`.

The ~1.6 s TTFB is consistent with the request being held and then rejected by a security layer (inspection, rule evaluation, then 403) rather than a quick PHP response.

---

## 4. Could SG Security or server rules be blocking this endpoint?

**Yes.** Blocking direct plugin PHP is a standard hardening measure. SG Security (and similar plugins) often:

- Restrict or block execution of PHP files under `wp-content/plugins/` when they are requested directly (by URL), while allowing normal WordPress bootstrap via `index.php` and `wp-admin/admin-ajax.php`.

So the same request that works in a permissive local setup can return 403 on staging when SG Security (or server rules) are active. No change to your theme/TranslatePress patches is required for this to happen; it’s the **request pattern** (direct POST to a plugin file) that is being blocked.

---

## 5. Could our custom TranslatePress patches conflict with ALD?

**No.** Your custom logic does not trigger or alter this ALD request, and ALD does not depend on it.

- **`trp_needed_language` filter**  
  Only affects server-side “needed language” when the URL has no language prefix. It does not run in the ALD AJAX request (that file doesn’t load WordPress). It doesn’t enqueue or call the ALD script.

- **`template_redirect`**  
  Runs on full page loads to redirect `/zh/[english-slug]` to the Chinese slug. It does not run for the ALD POST (different request), and doesn’t affect whether the script runs or where it posts.

- **`trp_translated_html`**  
  Only filters translated HTML output. It doesn’t affect ALD script enqueue or the AJAX URL.

So the slow 403 is **not** caused by your patches. The request would fire and be blocked the same way with or without them.

---

## 6. Given your architecture, is Automatic Language Detection unnecessary?

**Yes, for your described setup it is unnecessary.**

You stated:

- Default language: English (no prefix).
- Chinese: `/zh/` prefix.
- You use a **manual language switcher** and care about **Chinese SEO** and deterministic URLs.
- You **do not** need browser-language auto redirect.

ALD’s job is to:

- Detect browser/IP language.
- Redirect or show a popup to switch language when it doesn’t match the current page.

That conflicts with “we don’t need browser-language auto redirect” and “manual switcher.” So from a product perspective, ALD is redundant and only adds:

- An extra script on every page.
- A failing, slow request (403, ~1.6 s) when there’s no cookie (e.g. first visit, WebPageTest’s clean run).

So the safest path is to **disable ALD** so this request never fires.

---

## 7. Safest way to disable ALD so the request never fires

**Recommended: prevent the script from loading** (no plugin file edits, no touching ALD’s own settings UI).

In your child theme’s `functions.php` (or a small must-use/site-specific plugin), add:

```php
// Disable TranslatePress Automatic Language Detection script so trp-ald-ajax.php is never requested.
add_filter( 'trp_ald_enqueue_redirecting_script', '__return_false' );
```

- **Effect:** TranslatePress will not enqueue `trp-language-cookie.js`, so `ajax_get_needed_language()` is never called and **no request is sent** to `trp-ald-ajax.php`.
- **Safe:** This is the same filter TranslatePress uses internally (e.g. to skip ALD inside page builders). No direct plugin edits; you can remove the filter later if you change your mind.
- **Caveat:** If you ever re-enable ALD (remove the filter), the 403 will still occur on staging unless you also fix the endpoint (see §8).

**Alternative:** In **TranslatePress → Settings → Add-ons**, disable the “Automatic User Language Detection” add-on if the UI allows it. That also stops the script and the request. The filter above is still useful if you prefer to keep the add-on “on” but effectively disabled for your site.

---

## 8. If ALD should remain enabled: minimal fix for 403 and 1.6 s

If you must keep ALD (e.g. for another environment or future use), you have two kinds of fixes:

**A. Whitelist the ALD URL (server / SG Security)**  
- In SG Security (or equivalent), allow direct access to this specific path (e.g. `.../automatic-language-detection/includes/trp-ald-ajax.php`) for POST requests.  
- **Downside:** You are explicitly allowing direct execution of a plugin PHP file, which weakens the “no direct plugin access” policy. Only do this if you understand and accept that risk.

**B. Route the request through WordPress (recommended if ALD stays)**  
- Do **not** request `trp-ald-ajax.php` directly.  
- Expose the same logic via `admin-ajax.php` (or a REST route): e.g. action `trp_ald_get_needed_language`, and in the handler require the ALD class and run the same logic.  
- Use the existing filter to point the front-end to that URL:

  `add_filter( 'trp_ald_ajax_url', function() { return admin_url( 'admin-ajax.php' ); }, 10, 1 );`

- You must **register** the handler in WordPress (e.g. `wp_ajax_nopriv_trp_ald_get_needed_language` and `wp_ajax_trp_ald_get_needed_language`) and inside it load the ALD determine-language logic and output the same JSON.  
- **Upside:** No direct plugin file access; SG Security and typical server rules won’t block it. TTFB should drop to normal WP AJAX levels once the 403 is gone.  
- **Downside:** Requires a small amount of custom (or plugin) code to wire the existing ALD logic to `admin-ajax.php`.

So: **if ALD is unnecessary (your case), use §7 and disable it.** If you must keep it, prefer **8B** (route via WordPress); use **8A** only if you explicitly accept the security trade-off.

---

## Summary

| Question | Answer |
|----------|--------|
| 1. What triggers the request? | ALD script `trp-language-cookie.js` when there is no valid `trp_language` cookie (e.g. first visit). |
| 2. From ALD add-on? | Yes. |
| 3. Why 403 on staging? | Direct POST to a plugin PHP file; security (e.g. SG Security) blocks direct plugin execution. |
| 4. SG Security / server? | Yes, very likely. |
| 5. Conflict with our patches? | No. |
| 6. ALD necessary for us? | No; manual switcher + no auto redirect. |
| 7. Safest disable? | `add_filter( 'trp_ald_enqueue_redirecting_script', '__return_false' );` in theme (or plugin). |
| 8. If we keep ALD? | Prefer routing the same logic through `admin-ajax.php`; alternatively whitelist the ALD URL (less secure). |

No code has been modified; this file is diagnosis and recommendation only.
