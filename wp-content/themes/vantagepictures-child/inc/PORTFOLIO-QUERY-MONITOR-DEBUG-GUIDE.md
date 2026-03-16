# Query Monitor — Debugging slow portfolio filtering & load-more

Use this guide to gather performance data from Query Monitor for the Work page and portfolio AJAX (filters, load-more). **No code fixes here—only how to collect the right evidence** to paste back into Cursor for analysis.

---

## STAGE 1 — Install / confirm setup

### 1.1 Install and activate Query Monitor

1. In WordPress admin, go to **Plugins → Add New**.
2. Search for **Query Monitor**.
3. Click **Install Now** on the plugin by John Blackbourn.
4. Click **Activate**.

### 1.2 Confirm it is working

1. After activation, open the **front end** of your site (e.g. the Work page).
2. At the **top of the page** you should see a dark **Query Monitor** bar with links like **QM**, **Queries**, **Conditionals**, **Request**, etc.
3. If you don’t see it: you must be **logged in** as an admin. Query Monitor only shows for logged-in users. Log in and reload the front end.

### 1.3 Where to click

- The **Query Monitor bar** is in the **top admin toolbar** (black bar) when you’re on the front end.
- Click **QM** (or the plugin name) to open the **main panel**.
- The panel opens at the **bottom** of the page and has tabs: **Overview**, **Queries**, **HTTP**, **Hooks & Actions**, **Scripts**, etc.
- Use the **left-hand tabs** in that panel to switch between Queries, HTTP, Hooks, etc.

---

## STAGE 2 — What we are testing

We care about **four scenarios**. For each, you do one action, wait for it to finish, then capture the right Query Monitor data.

| # | Scenario | Where to go | What to do | Wait for |
|---|----------|-------------|------------|----------|
| 1 | **Work page initial load** | Navigate to the public Work page (e.g. `/work/`) | Just load the page (no filter, no scroll) | Page fully loaded (grid may still be loading via AJAX—that’s OK; we’re measuring the **HTML** request) |
| 2 | **Filter change (AJAX)** | On the Work page | Change one filter (e.g. Market → Singapore) and **do nothing else** | New results to appear in the grid |
| 3 | **Load-more (AJAX)** | On the Work page, with some results already shown | Scroll down until “load more” runs and new cards appear | New batch of cards to appear |
| 4 | **Taxonomy archive (optional)** | Go to a portfolio taxonomy URL (e.g. `/market/singapore/` if you have one) | Just load the page | Page fully loaded |

Important:

- For **initial load** and **taxonomy**, you’re measuring the **main page request** (the document request). Open Query Monitor **after** the page has loaded.
- For **filter** and **load-more**, the work happens in **AJAX** requests. Query Monitor can show a **separate block for each AJAX request**. You must open the panel **after** the filter/load-more has completed, then switch to the **AJAX** context so you’re not looking at the initial page load.

---

## STAGE 3 — Which Query Monitor panels to capture

For each test, the **most useful** data is below. Copy the **text/numbers** from these areas (you can copy the whole block or the key lines).

### All tests (when relevant)

- **Overview → Page generation time** (total time for that request).
- **Queries** tab: **Queries by component** (theme vs plugin), **Queries by caller**, and any **slow queries** (highlighted or listed).
- **Hooks & Actions**: list of hooks and **duration** (prioritize the slow ones).
- **HTTP** (only if you see HTTP API calls): request URLs and timing.
- **Errors** (or PHP Errors): any errors or warnings.

### For the main page (Tests 1 and 4)

- In the QM panel, leave the **context** as the **current page** (no need to switch to AJAX).
- Capture: **Overview** (generation time), **Queries** (by component, by caller, slow queries), **Hooks & Actions** (slow hooks), **Errors**.

### For AJAX (Tests 2 and 3)

- Query Monitor groups AJAX by request. After the filter or load-more finishes:
  1. Open the QM panel (click **QM** in the toolbar).
  2. In the panel, find the **dropdown or selector** that says something like “Page load” or “Admin Ajax”. **Switch to the admin-ajax.php request** (or the request that just ran).
  3. Then capture the **same** sections (Overview, Queries, Hooks, etc.) **for that AJAX request**, not for the initial page.

If you’re not sure which request is the filter/load-more: in the **HTTP** tab, look for `admin-ajax.php` with `action=vp_portfolio_load_more` (or your action name), and use that request’s data.

---

## STAGE 4 — Checklist for each test

Use this checklist while you run each test.

---

### Test 1: Work page initial load

| Step | What to do |
|------|------------|
| **Test name** | Work page initial load |
| **Where to go** | Front end: `/work/` (or your Work page URL) |
| **What to do** | Load the page once. Do not change filters or scroll to load more. |
| **Wait for** | Page to finish loading (hero, filters, and first grid may appear; AJAX may still be loading the first 12—that’s OK). |
| **Which QM panel** | Open QM bar → QM panel. Stay on **current page** (not AJAX). |
| **What to copy** | From **Overview**: “Page generation time”. From **Queries**: “Queries by component”, “Queries by caller”, and the list of **slow queries** (if any). From **Hooks & Actions**: hooks with highest time. From **Errors**: any errors. |
| **What this helps** | Whether the **document request** for the Work page is slow and whether the cost is in DB (queries), hooks, or theme/plugins. |

---

### Test 2: Work page — filter change (AJAX)

| Step | What to do |
|------|------------|
| **Test name** | Work page filter AJAX |
| **Where to go** | Work page, with Query Monitor already active (and ideally with a fresh reload so we see one clear AJAX). |
| **What to do** | Change **one** filter (e.g. Market → Singapore). Do nothing else. |
| **Wait for** | Grid to update with the new filter results. |
| **Which QM panel** | Open QM panel. **Switch to the admin-ajax request** that just ran (the one for the filter), not the initial page load. |
| **What to copy** | For **that AJAX request**: **Overview** (request/time), **Queries** (by component, by caller, slow queries), **Hooks & Actions** (slow hooks), **HTTP** (if it shows the AJAX call), **Errors**. |
| **What this helps** | Whether **filter slowness** is in DB (WP_Query, ACF), theme (template/caller), or hooks/plugins. |

---

### Test 3: Work page — load-more (AJAX)

| Step | What to do |
|------|------------|
| **Test name** | Work page load-more AJAX |
| **Where to go** | Work page, with some results already visible. |
| **What to do** | Scroll down until the next page loads (infinite scroll). |
| **Wait for** | New cards to appear. |
| **Which QM panel** | Open QM panel. **Switch to the admin-ajax request** that corresponds to this load-more (the second or later admin-ajax call). |
| **What to copy** | Same as Test 2: for **that AJAX request**, copy Overview, Queries (by component, by caller, slow queries), Hooks, Errors. |
| **What this helps** | Whether **load-more slowness** has the same or different profile as the filter (queries vs hooks vs theme). |

---

### Test 4: Taxonomy archive (optional)

| Step | What to do |
|------|------------|
| **Test name** | Taxonomy archive page load |
| **Where to go** | A portfolio taxonomy URL (e.g. `/market/singapore/` or your equivalent). |
| **What to do** | Load the page once. |
| **Wait for** | Page to finish loading. |
| **Which QM panel** | Same as Test 1: current page (document request). |
| **What to copy** | Same as Test 1: Overview, Queries (by component, by caller, slow queries), Hooks, Errors. |
| **What this helps** | Compare taxonomy archive performance to the Work page and to filter AJAX. |

---

## STAGE 5 — Template for pasting results into Cursor

Copy this template and fill it in with the data you captured. Then paste the whole block into Cursor for analysis.

```text
=== QUERY MONITOR — PORTFOLIO PERFORMANCE DATA ===
Site: vantage.pictures
Date/time of capture: [fill in]

---
TEST 1: Work page initial load
---
Page generation time:
Queries by component:
Slow queries:
Hooks (top by time):
HTTP API calls (if any):
Errors:

---
TEST 2: Work page filter AJAX request
---
Ajax endpoint (e.g. admin-ajax.php?action=...):
Total time / request time:
Queries by component:
Queries by caller:
Slow queries:
Hooks (top by time):
Errors:

---
TEST 3: Work page load-more AJAX request
---
Ajax endpoint:
Total time:
Queries by component:
Queries by caller:
Slow queries:
Hooks (top by time):
Errors:

---
TEST 4: Taxonomy archive (optional)
---
Page generation time:
Queries by component:
Slow queries:
Hooks (top by time):
Errors:

---
NOTES (any extra observation, e.g. "filter felt slow", "load-more was fast"):
---
```

---

## STAGE 6 — What matters most and how to use it

### What matters most for slow portfolio filters

1. **Page / request generation time** — Which request is slow: the Work page itself or the filter/load-more AJAX?
2. **Queries by component** — Is most time in “Theme” (your child theme), “Plugin” (ACF, etc.), or “Core”?
3. **Queries by caller** — Which function or file is running the slow queries (e.g. `vp_get_portfolio_query`, ACF, `get_terms`)?
4. **Slow queries** — Individual queries that take a long time (e.g. heavy meta_query or tax_query).
5. **Hooks with high time** — Actions/filters that run during the request and take a lot of time (plugins or theme).

### How to tell what’s causing the slowness

- **WP_Query / DB:** Slow queries list and “Queries by caller” point to theme or plugin code that runs the query (e.g. portfolio query, ACF).
- **ACF:** If “Queries by caller” or “Queries by component” show ACF or `get_field`, ACF loading is part of the cost.
- **Template rendering:** Often shows as theme in “Queries by component” and in “Queries by caller” as your template or `get_template_part`.
- **Hooks/plugins:** “Hooks & Actions” with high duration; “Queries by component” showing a plugin name.
- **General PHP:** High “Page generation time” but no single huge query → cost may be spread across many small queries or PHP (loops, template code).

### Making sure you’re looking at the AJAX request

- After a **filter** or **load-more**, the browser sends a **new** request to `admin-ajax.php`. Query Monitor can show **multiple requests**: the first is the page load, the next ones are AJAX.
- In the QM panel, **switch the context** from “Page load” to the **admin-ajax** request (or the most recent one). Then all tabs (Queries, Hooks, etc.) apply to **that** AJAX request.
- If your plugin labels requests, pick the one that matches the time you clicked the filter or when load-more ran.

### Common mistakes to avoid

1. **Copying the main page load when you meant to test filter/load-more** — Always switch to the correct admin-ajax request before copying.
2. **Testing while other tabs or plugins are doing heavy work** — Close other tabs, disable other heavy plugins temporarily if you want a clean reading.
3. **Only copying “total time”** — Paste **Queries by component**, **Queries by caller**, and **slow queries** so we can see *where* time is spent.
4. **Ignoring errors** — Copy any PHP errors or warnings; they can affect performance or point to misconfig.

---

Once you’ve filled in the template with real data from Query Monitor, paste it into Cursor and we can interpret it and suggest next steps (still without jumping to code changes until we’re sure where the bottleneck is).
