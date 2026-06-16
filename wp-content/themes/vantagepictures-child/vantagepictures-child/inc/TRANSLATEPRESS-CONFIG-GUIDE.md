# TranslatePress Business – Configuration Guide for vantage.pictures (Chinese SEO)

**Site:** https://vantage.pictures (production) | https://dev.vantage.pictures (staging)  
**Stack:** WordPress, Yoast SEO Premium, Schema & Structured Data for WP, Gravity Forms, custom Bootstrap child theme  
**Goal:** Full Chinese (Simplified) coverage; preserve existing manual translations; use AI/automatic translation to fill gaps only.

**Deployment:** Set up and translate everything on staging, then deploy full site (files + database, including `*_trp_*` tables) to production. Staging AI quota: keep 200k or use Unlimited—translations built on staging go to production with the DB.

---

## How to use this guide

Go to **Settings → TranslatePress** and work through the tabs **left to right**: General → Language Switcher → Automatic Translation → Translate Site → Addons → License → Advanced. Under **Advanced**, use the sub-tabs in order. Each section below matches one page/sub-tab so you can configure in sequence without jumping.

---

## 1. General

**Path:** Settings → TranslatePress → **General** tab.

Work through the page top to bottom.

### Website Languages

| Setting | Recommendation | Note |
|--------|----------------|------|
| **Default Language** | English (United States) | Match your WordPress content language. |
| **All Languages** | English (en_US, slug `en`) + Chinese (China) (zh_CN, slug `zh`), both **Active** | Keeps your existing `/zh/` URLs. Drag to reorder if you want to change switcher order. |
| (Add language) | Only if you add more languages later | Not needed for EN + zh. |

### Re-run Setup Wizard

| Setting | Recommendation |
|--------|-----------------|
| **Re-run Setup Wizard** button | Use only if you want to reset the initial wizard. Not required for this setup. |

### Language Settings

| Setting | Recommendation | Note |
|--------|----------------|------|
| **Use Native language name** | Your choice (e.g. ON so Chinese shows as “中文”) | Affects how the language name appears in the switcher. |
| **Use subdirectory for default language** | **Off** (unchecked) | Keeps default at `dev.vantage.pictures/`, Chinese at `dev.vantage.pictures/zh/`. Check only if you want default at `/en/`. |
| **Force language in custom links** | Off unless you need links to keep current language | Optional. |

Click **Save Changes** at the bottom.

---

## 2. Language Switcher

**Path:** Settings → TranslatePress → **Language Switcher** tab.

You have three sub-tabs: **Floater**, **Shortcode**, **Menu Item**. Configure the one(s) you use (e.g. Floater + Menu Item).

### 2.1 Floater (sub-tab)

Controls the floating language switcher (e.g. bottom-right corner).

| Setting | Recommendation |
|--------|-----------------|
| Switcher border width / radius / animations | Keep or adjust for design. |
| Flag and text size | Normal or Large—your choice. |
| Flag icons shape | Rectangle (4:3) or Square (1:1)—your choice. |
| **Customize Layout** → Desktop/Mobile, Position, Width, Padding, Flag position, Language names | Keep or adjust. Full Names is fine for EN + 中文. |
| **Show opposite language** | Off (unless you want the switcher to show only the *other* language). |
| **Show "Powered by TranslatePress"** | Off for a cleaner look (your choice). |

### 2.2 Shortcode (sub-tab)

For the `[language-switcher]` shortcode.

| Setting | Recommendation |
|--------|-----------------|
| Layout (Desktop/Mobile), Flag Icons Position, Language Names | Same as Floater if you want consistency. |
| **Open language switcher only on click** | Off = open on hover. On = open on click. Your choice. |
| **Show opposite language** | Off unless you want a single “Switch to other language” style. |

### 2.3 Menu Item (sub-tab)

For the switcher when added via **Appearance → Menus**.

| Setting | Recommendation |
|--------|-----------------|
| Flag Icons Position, Flag Icons shape, Language Names | Match Floater/Shortcode if you use both. |

Save with **Save changes** / **Revert changes** as needed.

---

## 3. Automatic Translation

**Path:** Settings → TranslatePress → **Automatic Translation** tab.

This is where you enable AI and choose the engine. Work top to bottom.

| Setting | Recommendation | Note |
|--------|----------------|------|
| **Enable Automatic Translation** | **ON** | Required so missing strings get filled when you or users view Chinese. |
| **Translation engine** | **TranslatePress AI** | Click **Switch to TranslatePress AI** and use that. No API key; uses your license quota. Existing manual translations are not overwritten—only missing strings are sent. |
| (If you stayed on Google) Google Translate API Key | — | Leave empty if using TranslatePress AI. |
| **Automatically Translate Slugs** | **On** if you want missing post/page/CPT slugs filled by AI; **Off** if you prefer to translate slugs only manually | Slugs affect Chinese SEO URLs. |
| **Block Crawlers** | Off | So search engines can index translated pages. |
| **Limit machine translation / characters per day** | Keep default or set a cap (e.g. 1,000,000) if you want a safety limit | TranslatePress AI uses word quota from your account; this limit is for the selected engine. |
| **Log machine translation queries** | Off (unless debugging) | Logging can impact performance. |

Save **Save Changes**.

---

## 4. Translate Site

**Path:** Settings → TranslatePress → **Translate Site** tab.

This is not a settings form—it opens the **Translation Editor** on the front end.

Use it to:

- Open any page, switch to Chinese in the editor, and translate or review strings.
- Find **Meta Information** (title, description, image alt, OG) in the string list and translate them for key pages.
- Trigger automatic translation for missing strings by viewing pages in Chinese (AI fills only what’s not yet translated).
- Use the **String Translation** tab (inside the editor) for Gettext, Slugs, and Regular strings.

No checkboxes to set here; just use it when doing translation work.

---

## 5. Addons

**Path:** Settings → TranslatePress → **Addons** tab.

Enable or leave as-is per row.

### Advanced Add-ons

| Add-on | Recommendation | Why |
|--------|----------------|-----|
| **SEO Pack** | **Active** | Needed for translating slugs, title, meta description, image alt, OG/social, and for multilingual sitemap (Yoast). |
| **Multiple Languages** | **Active** | Lets you have Chinese (and more languages if needed). |

### Pro Add-ons

| Add-on | Recommendation | Why |
|--------|----------------|-----|
| **DeepL Automatic Translation** | Optional | Use only if you prefer DeepL over TranslatePress AI; you’d set engine to DeepL in Automatic Translation. |
| **Automatic User Language Detection** | Keep **Active** if you want the “We’ve detected…” popup | Sends users to Chinese when browser/IP suggest it. |
| **Translator Accounts** | Your choice | Only if you want non-admin users to translate. |
| **Browse As User Role** | Your choice | Useful for translating content that changes by role. |
| **Navigation Based on Language** | Off unless you need different menus per language | Optional. |
| **Different Domain per Language** | Off | You’re using subpaths (`/zh/`), not separate domains. |

No separate “Save” for add-ons; activation is immediate.

---

## 6. License

**Path:** Settings → TranslatePress → **License** tab.

Confirm **Your License Key is valid** and that the product is **TranslatePress Business**. No configuration needed for this guide. Expiry and site count are shown here.

---

## 7. Advanced

**Path:** Settings → TranslatePress → **Advanced** tab.

Use the **sub-tabs** in order: Automatic User Language Detection → Troubleshooting → Exclude strings & pages → Debug → Miscellaneous options → Custom language.

---

### 7.1 Automatic User Language Detection

| Setting | Recommendation |
|--------|-----------------|
| **User Language Detection Method** | **First by browser language, then IP address (recommended)** is fine. |
| **User Notification Popup** → Popup Type | “Pop-up window over the content” or “Hello bar”—your choice. |
| Popup Text, Button Text, Close Button Text | Edit if you want different wording (e.g. in Chinese). |

---

### 7.2 Troubleshooting

| Setting | Recommendation | Note |
|--------|----------------|------|
| **Fix missing dynamic content** | **On** only if you see content “flash” from original to translated on Chinese pages | Shows original briefly then swaps in translation for JS-inserted content. |
| **Disable dynamic translation** | **Off** | So JS-inserted strings can still be translated. |
| **Filter Gettext wrapping from post content and title** | **Off** unless you have a specific issue | Docs recommend DB backup before turning on. |
| **Filter Gettext wrapping from post meta** | **Off** unless you have a specific issue | Same as above. |
| **Load legacy SEO Pack Add-On** | **Off** | Use only if slug/SEO issues after an update; support may ask you to try it. |
| **Load legacy Language Switcher** | **Off** | Use only if the new switcher causes problems. |

---

### 7.3 Exclude strings & pages

Controls what is excluded from translation or from automatic translation only.

| Section / Setting | Recommendation |
|-------------------|-----------------|
| **Do not translate certain paths** | Leave empty unless you want to exclude (or “translate only”) specific URL paths. Use **Exclude Paths From Translation** or **Translate Only Certain Paths** and list paths (e.g. `/some/path/` or `/some/*`). |
| **Exclude Gettext strings** | Leave empty unless you need to stop TP from translating specific theme/plugin strings (they can still use .po/.mo). Add “Gettext String” + “Domain” and **Add**. |
| **Exclude strings from automatic translation** | Add only words you never want auto-translated (e.g. brand names, technical terms). Paragraphs are still translated; only the exact string is left as-is. |
| **Exclude from dynamic translation** | Add **CSS selectors** if you need to exclude specific HTML nodes from dynamic (JS) translation. Server-side translation can still apply. |
| **Exclude selectors from translation** | Add **CSS selectors** to exclude entire elements (and children) from *any* translation (manual + automatic). Use sparingly. |
| **Exclude selectors only from automatic translation** | Add **CSS selectors** to block only automatic translation in those elements; manual translation in the editor still allowed. |

For “fill missing only” and preserving manual work, you usually leave these empty unless you have a concrete reason to exclude something.

---

### 7.4 Debug

| Setting | Recommendation | Note |
|--------|----------------|------|
| **Disable post container tags for post title** | **Off** | Only enable if translated titles break the page. |
| **Disable post container tags for post content** | **Off** | Only enable if translated content breaks the page. |
| **Disable translation for gettext strings** | **Off** | Leave **off** so theme/plugin (and Gravity Forms) strings are translated by TranslatePress. Turning on would use only .po/.mo and no TP/auto translation for gettext. |
| **Optimize TranslatePress database tables** | Use the link only when you want to clean duplicates / fix metadata | Not a checkbox; use when maintaining the DB. |

---

### 7.5 Miscellaneous options

| Setting | Recommendation | Note |
|--------|----------------|------|
| **Remove duplicate hreflang** | **Show Both (recommended)** | Matches Google’s guidance. |
| **HTML Lang Attribute Format** | **Default (e.g. en-US, fr-CA)** or Regional | Default is fine for EN + zh. |
| **Automatic Translation Memory** | **On** | Reuses translations for very similar strings (≥95% similarity, ≥50 chars). Reduces AI usage and keeps phrasing consistent. *Warning in UI:* can slow secondary-language pages on very large DBs; if you see slowness, turn off and retest. |
| **Force slash at end of home url** | Off | Only if your setup needs a trailing slash on home URL. |
| **Translate numbers and numerals** | Off | Unless you want different numbers (e.g. phone) per language. |
| **Exclude translated links from sitemap** | **Off** | So Chinese (and other) URLs stay in the sitemap for SEO. |
| **Manual Translation Only** | **Off** | Must be **off** so automatic translation can fill missing strings when users (or you) browse in Chinese. |
| **Enable the hreflang x-default tag for language** | **On** with **English** selected | Good for default-language targeting. |
| **Date format** | Keep your 简体中文 format (e.g. `Y年n月j号`) | You already have this set. |
| **Marketing opt-in** | Your choice | Optional. |

Save **Save Changes**.

---

### 7.6 Custom language

Use only if you need a language that isn’t in the list. For **Chinese (China)** you don’t need this. Leave empty.

---

## 8. Safe rollout order (checklist)

Do these in sequence so you don’t miss a tab:

1. **Backup** – Full DB (and files) for staging.
2. **General** – Confirm Default + All Languages (EN + zh, slug `zh`), subdirectory for default **off**. Save.
3. **Addons** – Confirm SEO Pack and Multiple Languages **Active**.
4. **Automatic Translation** – **Enable** automatic translation, switch to **TranslatePress AI**, set **Automatically Translate Slugs** On/Off as desired. Save.
5. **Advanced → Troubleshooting** – Leave everything off unless you need “Fix missing dynamic content” for flash. Save.
6. **Advanced → Exclude strings & pages** – Leave empty unless you have exclusions. Save.
7. **Advanced → Debug** – Leave “Disable translation for gettext strings” **off**. Save.
8. **Advanced → Miscellaneous** – **Automatic Translation Memory** **On**, **Manual Translation Only** **Off**, **Exclude translated links from sitemap** **Off**, **hreflang x-default** On (English). Save.
9. **Verify** – Open a few `/zh/` URLs; confirm existing manual Chinese is still there.
10. **Fill gaps** – Browse more Chinese pages or use **Translate Site** (Translation Editor) in Chinese so AI fills missing strings.
11. **String Translation** – In the Translation Editor, open **String Translation** → Gettext → **Rescan plugins and theme for strings**. Translate or review Gettext (and Slugs/Regular) as needed.
12. **SEO** – In Translation Editor, translate **Meta Information** (title, description, OG) for key pages; use String Translation → Slugs for important URLs.
13. **QA** – Homepage, contact, forms, confirmations, meta, hreflang in view-source.
14. **Production** – When ready: backup production, deploy full site (files + DB including `*_trp_*`). Clear caches and re-check key URLs.

---

## 9. Things to verify manually

**For a step-by-step, in-order QA (functionality first, no Chinese reading required), use:**  
`inc/TRANSLATEPRESS-QA-CHECKLIST.md`

Quick list:

- [ ] Key `/zh/` pages show existing manual Chinese (no regression).
- [ ] New or previously untranslated strings get filled by AI and look correct.
- [ ] Navigation, footer, buttons, form labels, placeholders, validation and confirmation messages in Chinese.
- [ ] Meta title and description for important pages in Chinese (view-source or Yoast).
- [ ] Image alt text where it matters for SEO.
- [ ] URL slugs for main posts/pages in Chinese (e.g. `/zh/about/`).
- [ ] Multilingual sitemap includes Chinese URLs and correct alternates.
- [ ] hreflang tags present and correct for default and `zh` (and x-default if enabled).
- [ ] No mixed language in schema (if applicable); fix or accept.
- [ ] Language switcher and default/zh behavior.
- [ ] Gravity Forms: submit flow, validation, confirmation in Chinese.
- [ ] Performance and caching: no broken layout; cache cleared after changes.

---

## 10. Memory summary (for later prompts)

- **Sites:** Staging dev.vantage.pictures (configure + translate); production vantage.pictures (full deploy from staging).
- **Languages:** Default English (US); Chinese (China), slug `zh`. Subdirectory for default **off**.
- **Add-ons:** SEO Pack and Multiple Languages **on**; others as needed.
- **Automatic translation:** **On**, engine **TranslatePress AI**. Automatically Translate Slugs on or off by preference. **Manual Translation Only** **off**.
- **Advanced:** Automatic Translation Memory **on**; gettext translation **on** (Debug); Exclude translated links from sitemap **off**; hreflang x-default **on** (English).
- **Workflow:** Configure by tab (General → … → Advanced sub-tabs) → verify existing Chinese → let AI fill gaps → rescan gettext → translate meta/slugs → QA → deploy full site (files + DB) to production.
- **Staging AI quota:** 200k or Unlimited; translations built on staging are deployed with the DB.
- **Doc reference:** https://translatepress.com/docs/translatepress/ — this guide: `vantagepictures-child/inc/TRANSLATEPRESS-CONFIG-GUIDE.md`.
