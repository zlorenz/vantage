# TranslatePress QA Checklist – Systematic (Functionality First)

Use this **in order**. One section at a time. You don’t need to read Chinese—we’re checking that things work and that key technical bits are present. Translation accuracy can be reviewed later with your Mandarin-speaking account manager.

**Site:** dev.vantage.pictures (staging)  
**Chinese base URL:** `https://dev.vantage.pictures/zh/`

---

## Before you start

- [ ] You’re on **staging** (dev.vantage.pictures), not production.
- [ ] Use a normal browser window (or incognito) so you see the site as a visitor would.
- [ ] Have the **English** version of the site open in another tab so you can compare structure (same links, same layout).

---

## Part 1: One-time site-wide checks (~10 min)

Do these once. They apply to the whole site.

### 1.1 Language switcher

1. Open **English homepage**: `https://dev.vantage.pictures/`
2. Find the language switcher (e.g. “English” or flag in nav/floater).
3. **Check:** Click it and switch to **中文** or **Chinese**.
4. **Good:** URL changes to `https://dev.vantage.pictures/zh/` (or `/zh/something/`) and the page content looks like the same layout but in Chinese.
5. **Bad:** Nothing happens, or you get a 404, or the page is blank/broken.

### 1.2 Homepage in Chinese

1. You should now be on the Chinese homepage (e.g. `https://dev.vantage.pictures/zh/`).
2. **Check:** Page loads, no white screen or PHP errors.
3. **Check:** Main layout matches English (hero, sections, footer). You’re only comparing structure, not text.
4. **Check:** Click the **logo**. It should go to Chinese homepage (stay on `/zh/` or go to `/zh/`).
5. **Bad:** Broken layout, missing sections, logo links to English only.

### 1.3 hreflang (SEO)

1. On the **Chinese** homepage, right‑click → **View Page Source** (or Ctrl/Cmd+U).
2. Search in the source for: `hreflang`
3. **Good:** You see at least one line with `hreflang="zh"` or `hreflang="zh-CN"` and a URL that contains `/zh/`.
4. **Good:** You also see `hreflang="en"` (or `en-US`) for the English version.
5. **Bad:** No hreflang at all, or only one language.

### 1.4 Sitemap (if you use Yoast sitemaps)

1. Open: `https://dev.vantage.pictures/sitemap_index.xml` (or your Yoast sitemap URL).
2. **Check:** There is a link or reference to a **Chinese** sitemap (e.g. a sitemap that includes `/zh/` in URLs).
3. **Bad:** Only English URLs in the sitemap.

*(If you don’t use sitemaps or use a different plugin, skip or adapt.)*

---

## Part 2: Navigation and main links (~15 min)

Work through the **main menu** on the Chinese site. For each item, you’re only checking: **does it go somewhere correct and does the page load?**

### 2.1 Main nav – top-level links

1. Stay on Chinese homepage: `https://dev.vantage.pictures/zh/`
2. Look at the main navigation (same place as on English).
3. For **each** top-level menu item (e.g. Services, Work, About, Contact, etc.):
   - **Check:** Click the link.
   - **Good:** URL stays under `/zh/` (e.g. `.../zh/services/`), page loads, layout looks normal.
   - **Bad:** 404, blank page, or URL goes to English (no `/zh/`).
4. Note any broken or wrong link (which item, what happened).

### 2.2 Main nav – dropdowns

1. Find any menu item that has a **dropdown** (e.g. “Services” or “Production”).
2. Open the dropdown.
3. **Check:** Each dropdown item is **clickable** (cursor changes, it’s a link).
4. **Check:** Click each dropdown item. Each should load a page under `/zh/` and show content (not blank, not 404).
5. **Bad:** Dropdown item has no link (text only), or link goes to wrong page / 404.

*(This is where the “Vietnam” link was broken—same idea for every dropdown item.)*

### 2.3 Footer links (if you have a footer menu)

1. Scroll to the footer on the Chinese site.
2. Click each footer link that should go to a page on your site.
3. **Good:** Each goes to the correct page under `/zh/` and loads.
4. **Bad:** 404, wrong page, or link missing.

---

## Part 3: Key page types (~15 min)

Open each of these **in Chinese** (use the nav or type the URL with `/zh/`). For each, only check: **loads, layout looks right, main links/buttons work.**

### 3.1 Homepage (again, quick)

- URL: `https://dev.vantage.pictures/zh/`
- [ ] Loads, layout matches English version (hero + sections + footer).

### 3.2 One “About” or “Company” page

- **Use the Chinese slug:** `https://dev.vantage.pictures/zh/关于/` (not `/zh/about/`). The child theme redirects any `/zh/[english-slug]` → `/zh/[chinese-slug]` site-wide so direct visits show Chinese.
- [ ] Page loads with content in Chinese.
- [ ] No broken images or obvious layout breaks.
- [ ] Any “Contact” or CTA button: click it and confirm it does something (modal or page).

### 3.3 One “Services” or “Production” page

- URL: e.g. `https://dev.vantage.pictures/zh/services/` or your real URL.
- [ ] Page loads.
- [ ] Same structure as English (sections, headings, links).

### 3.4 Portfolio / Work listing

- URL: e.g. `https://dev.vantage.pictures/zh/portfolio/` or `.../zh/work/` (your real slug).
- [ ] Page loads.
- [ ] You see a list/grid of items (same as English).
- [ ] Click **one** item: it should open a portfolio detail page under `/zh/`.

### 3.5 One portfolio detail page

- After clicking one item above, you’re on a single portfolio page.
- [ ] Page loads; layout matches English (e.g. video, title, description, credits).
- [ ] No broken video embed, no missing blocks.

### 3.6 Contact (modal or page)

- From the nav, open **Contact** (or whatever triggers the contact form).
- [ ] Contact form or modal opens.
- [ ] You see fields (e.g. name, email, message). You’re not checking labels, just that they’re there.
- [ ] Submit button is visible and clickable (you don’t have to submit; just confirm it’s there).

### 3.7 Blog index (News)

- URL: e.g. `https://dev.vantage.pictures/zh/新闻/` (or your blog index slug).
- [ ] Page loads; list of posts visible.
- [ ] Layout matches English (titles, excerpts, dates, categories if shown).
- [ ] Click **one** post: opens single post under `/zh/`.

### 3.8 Single blog post

- After clicking one post above, you’re on a single post page.
- [ ] Page loads; layout matches English (title, content, date, author if shown).
- [ ] No broken images or embeds in the content.

### 3.9 Taxonomy archives (Chinese URLs from sitemaps)

Open each **in Chinese** and confirm: page loads, layout matches English, list/grid and links work. Spot-check at least one URL per taxonomy; add more ticks if you verify additional terms.

**Blog categories** ([category-sitemap](https://dev.vantage.pictures/category-sitemap.xml))

| Term (English)   | Chinese URL example |
|------------------|----------------------|
| Behind the Scenes | `/zh/类别/behind-the-scenes/` |
| Campaign Creative | `/zh/类别/有创意/` (or slug from TP) |
| Crew Insights     | `/zh/类别/crew-insights/` |
| Press Coverage    | `/zh/类别/press/` |

- [ ] At least one blog category archive loads in Chinese; post list and links work.

**Video format** (portfolio; [video-format-sitemap](https://dev.vantage.pictures/video-format-sitemap.xml))

| Term              | Chinese URL example |
|-------------------|----------------------|
| Brand Film        | `/zh/video-format/brand-film/` |
| Branded Documentary | `/zh/video-format/branded-documentary/` |
| Commercial Spot   | `/zh/video-format/commercial-spot/` |
| Product Video     | `/zh/video-format/product-video/` |

- [ ] At least one video-format archive loads in Chinese; portfolio grid and item links work.

**Industry** (portfolio; [industry-sitemap](https://dev.vantage.pictures/industry-sitemap.xml))

| Term              | Chinese URL example |
|-------------------|----------------------|
| AI & Robotics     | `/zh/industry/ai-robotics/` |
| Automotive        | `/zh/industry/automotive/` |
| Beauty & Cosmetics| `/zh/industry/beauty-cosmetics/` |
| … (drones, electronics, fashion, finance, fmcg, hospitality, tech) | `/zh/industry/{slug}/` |

- [ ] At least one industry archive loads in Chinese; portfolio grid and links work.

**Market** (portfolio; [market-sitemap](https://dev.vantage.pictures/market-sitemap.xml))

| Term     | Chinese URL example |
|----------|----------------------|
| China    | `/zh/market/china/` |
| Singapore| `/zh/market/singapore/` |
| Taiwan   | `/zh/market/taiwan/` |
| USA      | `/zh/market/usa/` |
| Vietnam  | `/zh/market/vietnam/` |

- [ ] At least one market archive loads in Chinese; portfolio grid and links work.

---

## Part 4: Forms (functionality only) (~10 min)

You’re only checking: form appears, can be used, and doesn’t error. Not translation quality.

### 4.1 Video Campaign Brief (Gravity Forms)

- **English:** `https://dev.vantage.pictures/video-campaign-brief/`
- **Chinese:** e.g. `https://dev.vantage.pictures/zh/视频活动简介/` (or your translated slug).
1. Open the form on the **Chinese** site.
2. **Check:** All sections/steps visible (Basics, Contact, Campaign Goals, Timeline, Brand/Product, Deliverables, Final Notes).
3. **Check:** Fields render; Submit (or final step) is there and clickable.
4. Optional: Submit with test data. **Good:** Success message or redirect. **Bad:** PHP error, blank response, or form doesn’t submit.
5. **Bad:** Validation messages in English only—note for later; not a blocker for “functionality.”

### 4.2 Other forms (if any)

If you add another form (e.g. newsletter, quote request):

- [ ] Open it on the Chinese site.
- [ ] Form renders; submit works (or at least the button is there and clickable).

---

## Part 5: Meta and SEO spot check (~5 min)

Only for a couple of important pages. We’re checking that **meta and URL look correct**, not the quality of the Chinese.

### 5.1 Homepage meta

1. On Chinese homepage, **View Page Source**.
2. Search for: `<title>`
3. **Good:** The `<title>` contains Chinese characters (or a mix). It’s not the same as the English title only.
4. Search for: `meta name="description"`
5. **Good:** There is a meta description; ideally it’s different from the English one (could be Chinese).

### 5.2 One inner page meta

1. Open one important Chinese page (e.g. About or main Service).
2. View source, check `<title>` and `meta name="description"`.
3. **Good:** Title and description exist and reflect that page (and ideally are in Chinese).

### 5.3 URL slug

1. Look at the address bar for 2–3 Chinese pages.
2. **Good:** URLs look like `.../zh/page-name/` or `.../zh/中文-slug/`. Consistent and no obvious errors.
3. **Bad:** Chinese URLs are missing or always the same as English.

---

## Part 6: Quick “no regressions” on English

1. Switch the language switcher back to **English** (or open `https://dev.vantage.pictures/`).
2. **Check:** Homepage and one other page still load and look correct in English.
3. **Check:** Main nav and one dropdown still work in English.
4. **Bad:** English version broken or missing after using Chinese.

---

## Summary: what to write down

When you’re done, note:

- **Broken links:** Which menu/item, English vs Chinese, what happened (404, no link, wrong URL).
- **Broken pages:** URL, what’s wrong (blank, layout broken, missing section).
- **Forms:** Any form that doesn’t open, doesn’t submit, or shows an error.
- **Meta:** Any important page where `<title>` or meta description is missing or still English-only.

You can hand that list to a dev or fix it in TranslatePress; your account manager can later focus only on **translation accuracy** on the same URLs.

---

## Optional: reuse this list

- Do **Part 1** and **Part 2** every time you change TranslatePress settings or menus.
- Do **Part 3–5** when you’re doing a full QA before deploy.
- Replace placeholder URLs (e.g. `/zh/about/`) with your real slugs once and keep this file for the next run.
