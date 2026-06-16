# How to collect filter performance data

To diagnose filter/load-more lag with real numbers (instead of “feels like 5 seconds”), capture the following. This gives TTFB (server time), download time, and payload size so we can see whether the bottleneck is server, network, or client.

---

## 1. Open DevTools and prepare

1. Go to **https://dev.vantage.pictures/work/** (or your staging URL).
2. Open **Chrome DevTools** (F12 or right‑click → Inspect).
3. Go to the **Network** tab.
4. Enable **“Disable cache”** (so we see real first-load behavior).
5. In the filter bar, choose **“Fetch/XHR”** so only AJAX requests show (the portfolio requests go to `admin-ajax.php`).

---

## 2. Capture a filter change

1. (Optional) Clear the list: click the **clear** icon in the Network tab.
2. Change a filter (e.g. **Market → Singapore** or **Video Format → Brand Film**).
3. In the list, find the **POST** request to **`admin-ajax.php`** (or the URL that contains `admin-ajax`). That is the “filter page 1” request.
4. Click that request and look at the **Timing** (or **Headers → Timing**) section.

**Note these numbers:**

| Metric | Where to find it | What it tells us |
|--------|------------------|-------------------|
| **Waiting (TTFB)** | Timing panel: “Waiting for server response” | Time until the server starts sending the response. High = server/PHP/DB slow. |
| **Content Download** | Timing panel: “Content Download” | Time to download the response body. High = large payload or slow connection. |
| **Total** | Request row: “Time” column, or sum of timing phases | End‑to‑end time for the request. |
| **Size** | Request row: “Size” column | Response size. Large = more HTML/images in response. |

**Paste or screenshot:** Either type the numbers (e.g. `TTFB: 3200 ms, Download: 80 ms, Total: 3280 ms, Size: 45 kB`) or send a **screenshot** of the Network row for that request plus the **Timing** tab so we can read the breakdown.

---

## 3. Capture a load-more (page 2) request

1. Clear the Network list again (or note that you’re capturing a second scenario).
2. Set a filter that has **more than 12 items** (e.g. **Video Format → Brand Film** or **Market → China**).
3. **Scroll down** until the next set of items loads (load-more / page 2).
4. Find the **second** POST to **admin-ajax.php** (the one that fired when you scrolled).
5. Note the same **Timing** and **Size** for this request.

This shows whether load-more requests are slow in the same way as the first filter request (e.g. same TTFB) or different.

---

## 4. Optional: cold vs cached filter

- **Cold:** Change to a filter you **haven’t** used this session (or clear cache and reload, then change filter). Record TTFB + Total + Size for that request.
- **Cached:** Change to the **same** filter again (or another you already used). Record the same numbers.

Comparing cold vs cached tells us how much the transient cache is helping and how much of the delay is server vs cache hit.

---

## 5. What to send back

Provide one of the following:

- **A.** The numbers in a short list, e.g.  
  - Filter (cold): TTFB 3200 ms, Download 80 ms, Total 3280 ms, Size 45 kB  
  - Filter (cached): TTFB 50 ms, Download 40 ms, Total 90 ms, Size 42 kB  
  - Load-more (page 2): TTFB 2800 ms, Download 75 ms, Total 2875 ms, Size 44 kB  

- **B.** A screenshot of the Network tab showing the **admin-ajax** request(s) with the **Time** and **Size** columns visible, plus a screenshot of the **Timing** subpanel for the slow request.

- **C.** If you use a HAR export: DevTools → Network → right‑click a request → “Save all as HAR with content”, then share the file (or paste the timing section for the relevant request).

With TTFB, download time, total time, and size we can tell whether the delay is mainly server (high TTFB), payload size (large response), or something else, and suggest the right optimizations.
