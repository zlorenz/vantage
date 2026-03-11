/**
 * Portfolio infinite scroll + filters
 * - Infinite scroll appends next pages
 * - Supports multi-taxonomy dropdown filters: format, industry, market
 * - Keeps backward compatibility with legacy tab filters (.vp-filters)
 */
(() => {
  const sentinel = document.getElementById("vp-load-more");
  const grid = document.getElementById("vp-portfolio-grid");

  // Legacy tabs (optional)
  const filtersNav = document.querySelector(".vp-filters");
  const legacyFilters = filtersNav ? filtersNav.querySelectorAll(".vp-filter") : [];

  // New dropdowns (optional)
  const dropdowns = document.querySelectorAll(".vp-tax-filter");

  if (!sentinel || !grid || !window.vpLoadMore) return;

  let loading = false;
  let done = false;

  const setLoading = (isLoading) => {
    if (isLoading) sentinel.classList.add("loading");
    else sentinel.classList.remove("loading");
  };

  const readDropdownFilters = () => {
    const out = { format: "", industry: "", market: "" };
    dropdowns.forEach((sel) => {
      const name = sel.getAttribute("name");
      if (name && Object.prototype.hasOwnProperty.call(out, name)) {
        out[name] = sel.value || "";
      }
    });
    return out;
  };

  const setDropdownsFromUrl = () => {
    if (!dropdowns.length) return;

    const params = new URLSearchParams(window.location.search);
    const format = params.get("format") || "";
    const industry = params.get("industry") || "";
    const market = params.get("market") || "";

    dropdowns.forEach((sel) => {
      const name = sel.getAttribute("name");
      if (name === "format") sel.value = format;
      if (name === "industry") sel.value = industry;
      if (name === "market") sel.value = market;
    });
  };

  const buildUrlWithFilters = (filters) => {
    const url = new URL(window.location.href);

    // Keep any existing params, but update these three
    ["format", "industry", "market"].forEach((key) => {
      if (filters[key]) url.searchParams.set(key, filters[key]);
      else url.searchParams.delete(key);
    });

    return url.toString();
  };

  const getPayload = (pageToLoad) => {
    const perPage = parseInt(sentinel.dataset.perPage || sentinel.dataset.per_page || "12", 10);

    // New: read dropdown filters and send them
    const dd = readDropdownFilters();

    return {
      action: "vp_portfolio_load_more",
      nonce: vpLoadMore.nonce,
      page: pageToLoad,
      per_page: perPage,

      // Legacy single-filter fields (kept)
      taxonomy: sentinel.dataset.taxonomy || "",
      term: sentinel.dataset.term || "",

      // Layout (taxonomy pages use 3-col grid)
      layout: sentinel.dataset.layout || "",

      // Context
      context: sentinel.dataset.context || "public",

      // New multi-filter fields
      format: dd.format || "",
      industry: dd.industry || "",
      market: dd.market || "",
    };
  };

  let io;

  const resetObserver = () => {
    if (!io) return;
    io.unobserve(sentinel);
    io.observe(sentinel);
  };

  const stopForever = () => {
    done = true;
    sentinel.classList.add("is-done");
    if (io) io.unobserve(sentinel);
  };

  const fetchPage = async (pageToLoad) => {
    const payload = getPayload(pageToLoad);
    const body = new URLSearchParams(payload);

    const res = await fetch(vpLoadMore.ajaxUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      body,
    });

    // If PHP warnings leak, this will throw (good: we stop instead of looping)
    const data = await res.json();

    if (!data?.success) return null;
    return data.data || null;
  };

  // Infinite scroll: load NEXT page and append
  const loadMore = async () => {
    if (loading || done) return;
    loading = true;
    setLoading(true);

    try {
      const current = parseInt(sentinel.dataset.page || "1", 10);
      const nextPage = current + 1;

      const result = await fetchPage(nextPage);
      if (!result) return stopForever();

      const html = (result.html || "").trim();
      if (!html) return stopForever();

      const temp = document.createElement("div");
      temp.innerHTML = html;

      while (temp.firstChild) grid.appendChild(temp.firstChild);

      sentinel.dataset.page = String(nextPage);

      if (!result.has_more) stopForever();

      // Re-arm observer so it triggers smoothly even if sentinel stays visible
      resetObserver();

    } catch (e) {
      stopForever();
    } finally {
      loading = false;
      setLoading(false);
    }
  };

  // Apply ALL filters: load page 1 and replace grid
  const applyFilters = async (pushStateUrl = null) => {
    if (loading) return;

    loading = true;
    done = false;
    sentinel.classList.remove("is-done");
    setLoading(true);

    // Reset paging whenever filters change
    sentinel.dataset.page = "1";

    try {
      const result = await fetchPage(1);
      if (!result) {
        stopForever();
        return;
      }

      const html = (result.html || "").trim();
      grid.innerHTML = html;

      // Reveal animation
      Array.from(grid.children).forEach((card, i) => {
        card.classList.add("vp-card-reveal");
        card.style.animationDelay = `${i * 40}ms`;
      });

      if (!result.has_more) stopForever();

      // Legacy tab UI: keep active state in sync with format param (if tabs still exist)
      if (filtersNav && legacyFilters.length) {
        const params = new URLSearchParams(window.location.search);
        const activeFormat = params.get("format") || "";
        legacyFilters.forEach((a) => {
          const t = a.dataset.term || "";
          a.classList.toggle("is-active", t === activeFormat);
        });
      }

      // Update URL without reload (optional)
      if (pushStateUrl) {
        history.pushState({}, "", pushStateUrl);
      }

      resetObserver();

      const gridTop = grid.getBoundingClientRect().top;
      if (gridTop < -50 || gridTop > window.innerHeight) {
        grid.scrollIntoView({ behavior: "smooth", block: "start" });
      }

    } catch (e) {
      stopForever();
    } finally {
      loading = false;
      setLoading(false);
    }
  };

  /**
   * Dropdown change handler (EXCLUSIVE MODE)
   * When you select one filter, the other two are cleared.
   */
  if (dropdowns.length) {
    dropdowns.forEach((sel) => {
      sel.addEventListener("change", () => {

        const changed = sel.getAttribute("name"); // "format" | "industry" | "market"

        // Clear the other dropdowns so filters are mutually exclusive
        dropdowns.forEach((other) => {
          const otherName = other.getAttribute("name");
          if (otherName && otherName !== changed) {
            other.value = "";
          }
        });

        const filters = readDropdownFilters();
        const url = buildUrlWithFilters(filters);
        applyFilters(url);
      });
    });
  }

  /**
   * Legacy tabs click handler (optional):
   * Interprets tab click as setting ONLY format=term, and clearing other dropdowns if they exist.
   * Keeps href working when JS is off.
   */
  if (filtersNav && legacyFilters.length) {
    legacyFilters.forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();

        const term = a.dataset.term || ""; // this is a format slug in your old system
        const href = a.getAttribute("href") || window.location.href;

        // If dropdowns exist, keep them in sync:
        // - set format dropdown to term
        // - clear industry + market dropdowns (so behavior is predictable)
        if (dropdowns.length) {
          dropdowns.forEach((sel) => {
            const name = sel.getAttribute("name");
            if (name === "format") sel.value = term;
            if (name === "industry") sel.value = "";
            if (name === "market") sel.value = "";
          });
        }

        // Also keep sentinel legacy dataset.term updated (harmless; keeps old code assumptions intact)
        sentinel.dataset.term = term || "";

        // Loading state on clicked filter
        a.classList.add("is-loading");

        applyFilters(href).finally(() => {
          a.classList.remove("is-loading");
        });
      });
    });

    // Handle back/forward navigation (sync dropdowns + reload)
    window.addEventListener("popstate", () => {
      setDropdownsFromUrl();

      // Also keep sentinel legacy dataset.term in sync with format
      const params = new URLSearchParams(window.location.search);
      sentinel.dataset.term = params.get("format") || "";

      applyFilters(null);
    });
  } else {
    // Even if legacy tabs don’t exist, still handle popstate for dropdown UX
    window.addEventListener("popstate", () => {
      setDropdownsFromUrl();
      applyFilters(null);
    });
  }

  // On first load, sync dropdowns to URL params (so refresh/share links work)
  setDropdownsFromUrl();

  io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) loadMore();
      }
    },
    { rootMargin: "1200px 0px", threshold: 0 }
  );

  io.observe(sentinel);
})();