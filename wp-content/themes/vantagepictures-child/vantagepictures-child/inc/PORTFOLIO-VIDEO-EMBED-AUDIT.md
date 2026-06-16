# Portfolio Video Embed Audit – Vimeo / Xinpianchang (Chinese) Switching

**Date:** 2025-03-17  
**Goal:** Replace TranslatePress manual embed swapping with ACF + theme logic for Chinese Xinpianchang embeds.

---

## Step 1: Current Child Theme Audit

### 1.1 Where the single portfolio video embed is rendered

| Location | Lines | Purpose |
|----------|-------|---------|
| `single-portfolio.php` | 87–130 | Main portfolio video (right column, 16:9 ratio) |
| `single-portfolio.php` | 146–205 | Additional videos repeater (each row has its own vimeo_link) |

**Current flow:**
- Uses `vp_portfolio_get('vimeo_link', $post_id)` (ACF/meta wrapper).
- If value contains `<iframe`, outputs via `wp_kses` with allowed iframe attrs.
- Else treats as URL → `wp_oembed_get()` for Vimeo.
- Fallback (line 185): if oEmbed fails, regex extracts Vimeo ID and builds iframe manually.

### 1.2 How the theme detects Chinese (TranslatePress)

| Method | Usage | File(s) |
|--------|-------|---------|
| `global $TRP_LANGUAGE` | Direct check `$TRP_LANGUAGE === 'zh_CN'` | functions.php (vp_trp_blog_chinese_strings, vp_category_display_name, trp_translated_html filter) |
| URL-based | Chinese pages use `/zh/` prefix; TRP sets `$TRP_LANGUAGE` accordingly before template load | portfolio-load-more.php (cache key), template_redirect (redirect logic) |

**Recommendation:** Use `global $TRP_LANGUAGE; return ( isset( $TRP_LANGUAGE ) && $TRP_LANGUAGE === 'zh_CN' );` for server-side Chinese detection. This matches how the rest of the theme works.

### 1.3 Existing portfolio video helper logic

| Helper | Location | Purpose |
|--------|----------|---------|
| `vp_portfolio_get( $key, $post_id )` | functions.php:863 | ACF/meta retrieval; used for vimeo_link, header_title, etc. |
| Inline embed logic | single-portfolio.php | No dedicated render helper; logic duplicated for main + additional videos |

**Yoast Schema:** `inc/yoast-schema-portfolio.php` uses `vp_portfolio_get('vimeo_link')` to build VideoObject `embedUrl`; it expects Vimeo. Schema can stay Vimeo-only for default language (Chinese schema could be extended later if needed).

**Vimeo dataLayer:** `assets/js/vimeo-datalayer.js` selects `iframe[src*="player.vimeo.com"]` only. Xinpianchang iframes won’t match → no Vimeo API load, which is correct.

---

## Step 2: Xinpianchang Embed Analysis (Old Live Implementation)

### 2.1 Embed HTML from old Chinese portfolio page

```html
<iframe class=" lazyloaded" data-src="https://player.xinpianchang.com/?aid=11955262&mid=zqd9g4rmDOJwv86Z" 
  allowfullscreen="" allow="fullscreen" frameborder="0" style="border: none;" 
  src="https://player.xinpianchang.com/?aid=11955262&mid=zqd9g4rmDOJwv86Z"></iframe>
```

### 2.2 Embed URL structure

| Param | Example | Purpose |
|-------|---------|---------|
| `aid` | `11955262` | Numeric video ID |
| `mid` | `zqd9g4rmDOJwv86Z` | Additional identifier (per-video; not derivable from page URL) |

**Full player URL:** `https://player.xinpianchang.com/?aid=11955262&mid=zqd9g4rmDOJwv86Z`

### 2.3 Can we generate the embed from a normal Xinpianchang page URL?

- Page URL format: `https://www.xinpianchang.com/a11955262` (number = aid)
- `mid` does **not** appear in the page URL. It comes from Xinpianchang’s share/embed dialog.
- **Conclusion:** We cannot reliably build the full embed URL from only a page URL. The user must provide either:
  1. The full player URL from the embed code (`https://player.xinpianchang.com/?aid=X&mid=Y`), or
  2. Both `aid` and `mid` as separate fields.

**Recommendation:** Use a single **URL** field. User pastes the player URL from Xinpianchang’s share/embed dialog. That keeps UX simple and avoids parsing two fields.

---

## Step 3: Implementation Architecture Recommendation

### 3.1 ACF field

| Field name | Type | Instructions |
|------------|------|--------------|
| `xinpianchang_url` | URL | Paste the embed URL from Xinpianchang (e.g. `https://player.xinpianchang.com/?aid=11955262&mid=...`). Get it from the video’s share/embed dialog. Leave empty to show Vimeo on Chinese pages. |

**Location:** Same field group as `vimeo_link` (Portfolio post type). If the portfolio group is only in DB, add this via wp-admin; otherwise we can add via PHP in an `acf/init` callback.

### 3.2 Helper functions (new)

| Function | Purpose |
|----------|---------|
| `vp_portfolio_is_chinese()` | Returns true when `$TRP_LANGUAGE === 'zh_CN'` |
| `vp_portfolio_render_video_embed( $post_id )` | Chooses Vimeo vs Xinpianchang, validates URLs, outputs safe markup, handles fallback |

### 3.3 Where logic lives

| File | Changes |
|------|---------|
| `functions.php` | Add `vp_portfolio_is_chinese()`, `vp_portfolio_render_video_embed()` |
| `inc/acf-portfolio-video.php` (new) | Register `xinpianchang_url` ACF field for portfolio |
| `single-portfolio.php` | Replace inline embed block with `vp_portfolio_render_video_embed( $post_id )` |
| `inc/yoast-schema-portfolio.php` | No change (schema stays Vimeo-centric) |

### 3.4 Fallback behavior

1. **Chinese page + xinpianchang_url set and valid** → Output Xinpianchang iframe.
2. **Chinese page + xinpianchang_url empty or invalid** → Fall back to Vimeo (same as default).
3. **Non-Chinese page** → Always Vimeo.

### 3.5 Xinpianchang URL validation

- Accept URLs that match: `https://player.xinpianchang.com/?` with query string containing `aid=` and `mid=`.
- Reject page URLs like `https://www.xinpianchang.com/a11955262` (no mid).
- If invalid, fall back to Vimeo.

---

## Step 4: Implementation Checklist

- [x] Create `inc/acf-portfolio-video.php` – ACF field group with `xinpianchang_url` for portfolio
- [x] Add `vp_portfolio_is_chinese()` to functions.php
- [x] Add `vp_portfolio_render_video_embed( $post_id )` to functions.php
- [x] Refactor `single-portfolio.php` main video block to use the helper
- [ ] Optionally extend additional_videos repeater with `xinpianchang_url` and same logic (future scope)
- [x] ACF field group registered via PHP in `inc/acf-portfolio-video.php` (no manual wp-admin setup needed)
