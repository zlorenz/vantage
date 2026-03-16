# TranslatePress frontend scripts audit

**Scope:** `trp-language-cookie.js` and `trp-frontend-language-switcher.js`  
**Goal:** Determine what each does, whether either is still loading after ALD is disabled, and whether either can be safely removed for a manual-switcher, no–auto-redirect setup.

---

## 1. trp-language-cookie.js

### Where it is enqueued

- **File:** `translatepress-business/add-ons-pro/automatic-language-detection/class-automatic-language-detection.php`
- **Method:** `enqueue_cookie_adding()`, hooked on `wp_enqueue_scripts`
- **Condition:** Only inside `if ( apply_filters( 'trp_ald_enqueue_redirecting_script', true ) )`

So this script is **only** enqueued by the Automatic Language Detection add-on, and only when the filter allows it.

### What it does

- **Cookie:** Reads/writes the `trp_language` cookie.
- **AJAX:** On first visit (no valid cookie), sends a POST to `trp-ald-ajax.php` (action `trp_ald_get_needed_language`) to get browser/IP-based language.
- **Redirect / popup:** Depending on settings, either redirects to the “needed” language URL or shows the ALD popup/hello bar.
- **Link clicks:** Listens for clicks on language links and updates the cookie so the next request uses the chosen language.

So it is entirely for **automatic language detection, redirect, and cookie sync**. It does not render or control the visible switcher UI.

### Is it still loading after ALD is deactivated / safeguard?

- **Add-on deactivated:** The ALD class is not loaded, so `enqueue_cookie_adding()` is never registered → script is **not** enqueued.
- **Add-on active + child-theme filter:**  
  `add_filter( 'trp_ald_enqueue_redirecting_script', '__return_false' );`  
  makes the condition false → script is **not** enqueued.

So with your current setup (ALD off + filter), **trp-language-cookie.js is already not loading**. No extra change is required for that.

### Safe to remove?

**Yes, for your architecture.** You do not want:

- Browser-language detection  
- Auto redirect  
- ALD cookie logic  

So this script is not needed. It is already prevented by the existing filter. Optionally, you can add a **safety dequeue** so that even if something else (or a future TP change) enqueues it, the child theme still prevents it from loading (see “Recommended implementation” below).

---

## 2. trp-frontend-language-switcher.js

### Where it is enqueued

- **File:** `translatepress-multilingual/includes/class-language-switcher-v2.php`
- **Handle:** `trp-language-switcher-js-v2` (path: `assets/js/trp-frontend-language-switcher.js`)
- **Method:** `enqueue_assets()`, hooked on `wp_enqueue_scripts` from `init()` (priority 1)
- **Condition:** Used when the **legacy** language switcher is **disabled** (default in current TranslatePress). Then `TRP_Language_Switcher_V2` is used and its `enqueue_assets()` runs on every front-end load. There is no “only on pages with shortcode” check; the script is enqueued globally.

So it loads on **homepage, work page, /zh/ pages**, and any other front-end page.

### What it does

- **BaseSwitcher:** Dropdown open/close, keyboard (Enter, Space, ArrowDown, Escape), `aria-expanded` / `inert`, transitions, focus handling.
- **ShortcodeSwitcher:** For `[language-switcher]` shortcode; click or hover to open/close.
- **FloaterSwitcher:** For the floating language switcher.
- **initLanguageSwitchers():** Finds `.trp-language-switcher` and `.trp-shortcode-switcher__wrapper` and instantiates the appropriate switcher.
- **observeShortcodeSwitcher():** MutationObserver to bind dynamically added shortcode switchers.

It contains **no** cookie logic, **no** redirect logic, **no** AJAX, and **no** ALD references. It only makes the switcher dropdown (and floater) open/close and accessible.

### Which script powers the visible language switcher?

**trp-frontend-language-switcher.js** powers the **UI behavior** of the switcher (dropdown, keyboard, a11y).  
The **links and URLs** come from the server (shortcode/menu renderer using `url_converter->get_url_for_language()`). So:

- **trp-frontend-language-switcher.js** → required for dropdown/open-close behavior.
- **trp-language-cookie.js** → not involved in rendering or controlling the switcher; only ALD/redirect/cookie.

### Safe to remove?

**No.** If you dequeue `trp-frontend-language-switcher.js`:

- Shortcode or floater switchers that use a dropdown would break (no open/close, no keyboard).
- Menu items that are plain links would still work, but any dropdown-style switcher would not.

So **keep this script** to preserve full language-switcher functionality.

---

## 3. Summary table

| Script                         | Purpose                          | Loads when? (current setup)     | Safe to remove? | Needed for manual switcher? |
|--------------------------------|----------------------------------|----------------------------------|------------------|-----------------------------|
| trp-language-cookie.js         | ALD, cookie, redirect, popup     | No (ALD off + filter)            | Yes (already off)| No                          |
| trp-frontend-language-switcher.js | Switcher dropdown / UI only  | Yes (every front page)           | No               | Yes (for dropdown behavior) |

---

## 4. Recommended implementation (child theme only)

- **trp-language-cookie.js:** Already disabled by `add_filter( 'trp_ald_enqueue_redirecting_script', '__return_false' );`. No change required.
- **Optional safety net:** Dequeue `trp-language-cookie` late on `wp_enqueue_scripts` so it never appears even if something else enqueues it. Minimal, safe, no plugin edits.

**Minimal code addition (optional)** in `functions.php` with your other TranslatePress logic:

```php
// Safety: ensure ALD script never loads even if something enqueues it (e.g. add-on re-enabled).
add_action( 'wp_enqueue_scripts', function () {
    wp_dequeue_script( 'trp-language-cookie' );
}, 999 );
```

- **trp-frontend-language-switcher.js:** Do **not** dequeue. No code change.

---

## 5. Risks and edge cases

- **Dequeuing trp-language-cookie:** None for your setup. You don’t use ALD or auto-redirect. The only theoretical risk would be if you later relied on the ALD cookie for something else; you don’t.
- **Keeping trp-frontend-language-switcher.js:** No downside for your goals. It doesn’t touch URLs or cookies; your deterministic /zh/ and translated slugs are handled server-side and by your existing patches.
- **If ALD add-on is re-enabled and the filter is removed:** Without the optional dequeue, `trp-language-cookie.js` would load again and the slow ALD request could return. The optional dequeue ensures the script never runs even in that case.

---

## 6. Conclusion

- **trp-language-cookie.js:** For ALD/cookie/redirect only. Already not loading with your safeguard. Optional: add the dequeue above for a safety net. Do not remove the existing filter.
- **trp-frontend-language-switcher.js:** Required for the visible language switcher (dropdown behavior). Keep it; do not remove or dequeue.

No plugin files were modified. All recommendations are child-theme only.
