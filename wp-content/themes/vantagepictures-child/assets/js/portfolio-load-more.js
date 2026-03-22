/**
 * Portfolio infinite scroll + filters
 * - Infinite scroll appends next pages
 * - Public Work: format, industry, market (+ legacy .vp-filters)
 * - Internal Work: client, director, dop, art-director (crew index taxonomies)
 */
(() => {
  const sentinel = document.getElementById("vp-load-more");
  const grid = document.getElementById("vp-portfolio-grid");

  // Legacy tabs (optional)
  const filtersNav = document.querySelector(".vp-filters");
  const legacyFilters = filtersNav ? filtersNav.querySelectorAll(".vp-filter") : [];

  // Public Work dropdowns (optional)
  const dropdowns = document.querySelectorAll(".vp-tax-filter");

  // Internal Work crew dropdowns (optional)
  const crewDropdowns = document.querySelectorAll(".vp-internal-crew-filter");

  if (!sentinel || !grid || !window.vpLoadMore) return;

  const isTaxLayout = sentinel.dataset.layout === "taxonomy";
  const isInternal = (sentinel.dataset.context || "public") === "internal";

  const filterBar = document.querySelector(".vp-filterbar");

  let loading = false;
  let done = false;
  let filterRequestId = 0;
  let filterAbortController = null;
  let loadMoreAbortController = null;

  const setLoading = (isLoading) => {
    if (isLoading) {
      sentinel.classList.add("loading");
      if (filterBar) filterBar.classList.add("vp-filterbar--loading");
    } else {
      sentinel.classList.remove("loading");
      if (filterBar) filterBar.classList.remove("vp-filterbar--loading");
    }
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

  const readInternalCrewFilters = () => {
    const out = { client: "", director: "", dop: "", "art-director": "" };
    crewDropdowns.forEach((sel) => {
      const name = sel.getAttribute("name");
      if (name && Object.prototype.hasOwnProperty.call(out, name)) {
        out[name] = sel.value || "";
      }
    });
    return out;
  };

  const readFilterSnapshot = () => {
    if (isInternal) return readInternalCrewFilters();
    return readDropdownFilters();
  };

  const filtersEqual = (a, b) => {
    if (isInternal) {
      return (
        a.client === b.client &&
        a.director === b.director &&
        a.dop === b.dop &&
        a["art-director"] === b["art-director"]
      );
    }
    return a.format === b.format && a.industry === b.industry && a.market === b.market;
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

  const setInternalCrewFromUrl = () => {
    if (!crewDropdowns.length) return;
    const params = new URLSearchParams(window.location.search);
    crewDropdowns.forEach((sel) => {
      const name = sel.getAttribute("name");
      if (!name) return;
      const v = params.get(name);
      sel.value = v || "";
    });
  };

  const buildUrlWithPublicFilters = (filters) => {
    const url = new URL(window.location.href);
    ["format", "industry", "market"].forEach((key) => {
      if (filters[key]) url.searchParams.set(key, filters[key]);
      else url.searchParams.delete(key);
    });
    return url.toString();
  };

  const buildUrlWithInternalCrew = (filters) => {
    const url = new URL(window.location.href);
    ["client", "director", "dop", "art-director"].forEach((key) => {
      if (filters[key]) url.searchParams.set(key, filters[key]);
      else url.searchParams.delete(key);
    });
    return url.toString();
  };

  const getPayload = (pageToLoad) => {
    const perPage = parseInt(sentinel.dataset.perPage || sentinel.dataset.per_page || "12", 10);

    const base = {
      action: "vp_portfolio_load_more",
      nonce: vpLoadMore.nonce,
      page: pageToLoad,
      per_page: perPage,
      taxonomy: sentinel.dataset.taxonomy || "",
      term: sentinel.dataset.term || "",
      layout: sentinel.dataset.layout || "",
      context: sentinel.dataset.context || "public",
    };

    if (isInternal) {
      const crew = readInternalCrewFilters();
      return {
        ...base,
        client: crew.client || "",
        director: crew.director || "",
        dop: crew.dop || "",
        "art-director": crew["art-director"] || "",
      };
    }

    const dd = readDropdownFilters();
    return {
      ...base,
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

  const fetchPage = async (pageToLoad, signal = null) => {
    const payload = getPayload(pageToLoad);
    const body = new URLSearchParams(payload);

    const res = await fetch(vpLoadMore.ajaxUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      body,
      signal,
    });

    const data = await res.json();

    if (!data?.success) return null;
    return data.data || null;
  };

  const loadMore = async () => {
    if (loading || done) return;
    if (loadMoreAbortController) loadMoreAbortController.abort();
    loadMoreAbortController = new AbortController();
    const loadMoreSignal = loadMoreAbortController.signal;

    const current = parseInt(sentinel.dataset.page || "1", 10);
    const nextPage = current + 1;
    const filtersWhenSent = readFilterSnapshot();

    loading = true;
    setLoading(true);

    try {
      const result = await fetchPage(nextPage, loadMoreSignal);
      if (!result) return stopForever();

      if (!filtersEqual(filtersWhenSent, readFilterSnapshot())) {
        return;
      }

      const html = (result.html || "").trim();
      if (!html) return stopForever();

      const temp = document.createElement("div");
      temp.innerHTML = html;

      while (temp.firstChild) grid.appendChild(temp.firstChild);

      sentinel.dataset.page = String(nextPage);

      if (!result.has_more) stopForever();

      resetObserver();
    } catch (e) {
      if (e.name === "AbortError") return;
      stopForever();
    } finally {
      loading = false;
      setLoading(false);
    }
  };

  const clearGridLoadingState = () => {
    grid.classList.remove("vp-portfolio-gallery--loading");
  };

  const applyFilters = async (pushStateUrl = null) => {
    if (filterAbortController) filterAbortController.abort();
    if (loadMoreAbortController) loadMoreAbortController.abort();
    filterAbortController = new AbortController();
    const signal = filterAbortController.signal;
    const thisRequestId = ++filterRequestId;

    loading = true;
    done = false;
    sentinel.classList.remove("is-done");
    setLoading(true);
    grid.classList.add("vp-portfolio-gallery--loading");

    sentinel.dataset.page = "1";

    try {
      const result = await fetchPage(1, signal);
      if (thisRequestId !== filterRequestId) return;
      if (!result) {
        stopForever();
        return;
      }

      const html = (result.html || "").trim();
      grid.innerHTML = html;
      clearGridLoadingState();

      Array.from(grid.children).forEach((card, i) => {
        card.classList.add("vp-card-reveal");
        card.style.animationDelay = `${i * 40}ms`;
      });

      if (!result.has_more) stopForever();

      if (filtersNav && legacyFilters.length) {
        const params = new URLSearchParams(window.location.search);
        const activeFormat = params.get("format") || "";
        legacyFilters.forEach((a) => {
          const t = a.dataset.term || "";
          a.classList.toggle("is-active", t === activeFormat);
        });
      }

      if (pushStateUrl) {
        history.pushState({}, "", pushStateUrl);
      }

      setTimeout(resetObserver, 400);

      const gridTop = grid.getBoundingClientRect().top;
      if (gridTop < -50 || gridTop > window.innerHeight) {
        grid.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch (e) {
      if (e.name === "AbortError") return;
      if (thisRequestId !== filterRequestId) return;
      stopForever();
    } finally {
      if (thisRequestId === filterRequestId) {
        loading = false;
        setLoading(false);
        clearGridLoadingState();
      }
    }
  };

  /**
   * Public Work: exclusive dropdowns (format / industry / market).
   */
  if (dropdowns.length && !isTaxLayout && !isInternal) {
    dropdowns.forEach((sel) => {
      sel.addEventListener("change", () => {
        const changed = sel.getAttribute("name");

        dropdowns.forEach((other) => {
          const otherName = other.getAttribute("name");
          if (otherName && otherName !== changed) {
            other.value = "";
          }
        });

        const filters = readDropdownFilters();
        applyFilters(buildUrlWithPublicFilters(filters));
      });
    });
  }

  /**
   * Internal Work: crew filters (AND across dropdowns).
   */
  if (crewDropdowns.length && isInternal && !isTaxLayout) {
    crewDropdowns.forEach((sel) => {
      sel.addEventListener("change", () => {
        const filters = readInternalCrewFilters();
        applyFilters(buildUrlWithInternalCrew(filters));
      });
    });
  }

  /**
   * Legacy tabs (public Work / taxonomy nav).
   */
  if (filtersNav && legacyFilters.length && !isTaxLayout && !isInternal) {
    legacyFilters.forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();

        const term = a.dataset.term || "";
        const href = a.getAttribute("href") || window.location.href;

        if (dropdowns.length) {
          dropdowns.forEach((sel) => {
            const name = sel.getAttribute("name");
            if (name === "format") sel.value = term;
            if (name === "industry") sel.value = "";
            if (name === "market") sel.value = "";
          });
        }

        sentinel.dataset.term = term || "";

        a.classList.add("is-loading");

        applyFilters(href).finally(() => {
          a.classList.remove("is-loading");
        });
      });
    });
  }

  if (!isTaxLayout) {
    window.addEventListener("popstate", () => {
      if (isInternal) {
        setInternalCrewFromUrl();
      } else {
        setDropdownsFromUrl();
        const params = new URLSearchParams(window.location.search);
        sentinel.dataset.term = params.get("format") || "";
      }
      applyFilters(null);
    });
  }

  if (!isTaxLayout) {
    if (isInternal) setInternalCrewFromUrl();
    else setDropdownsFromUrl();
  }

  io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) loadMore();
      }
    },
    { rootMargin: "1200px 0px", threshold: 0 }
  );

  io.observe(sentinel);

  if (sentinel.dataset.initialEmpty === "1" || !grid.querySelector(".vp-card")) {
    loadMore();
  }
})();
