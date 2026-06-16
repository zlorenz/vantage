/**
 * Blog infinite scroll (offset-based)
 * Sentinel: #vp-blog-load-more. Grid: #vp-blog-grid.
 * data-offset, data-per-page, data-category-id (optional)
 */
(function () {
  const sentinel = document.getElementById("vp-blog-load-more");
  const grid = document.getElementById("vp-blog-grid");

  if (!sentinel || !grid || !window.vpBlogLoadMore) return;

  let loading = false;
  let done = false;

  const setLoading = function (isLoading) {
    if (isLoading) sentinel.classList.add("loading");
    else sentinel.classList.remove("loading");
  };

  const loadMore = function () {
    if (loading || done) return;
    loading = true;
    setLoading(true);

    const offset = parseInt(sentinel.dataset.offset || "0", 10);
    const perPage = parseInt(sentinel.dataset.perPage || sentinel.dataset.per_page || "5", 10);
    const categoryId = parseInt(sentinel.dataset.categoryId || "0", 10);
    const searchQuery = sentinel.dataset.search || "";

    const body = new URLSearchParams({
      action: "vp_blog_load_more",
      nonce: vpBlogLoadMore.nonce,
      offset: String(offset),
      per_page: String(perPage),
      category_id: String(categoryId),
    });
    if (searchQuery) {
      body.set("s", searchQuery);
    }

    fetch(vpBlogLoadMore.ajaxUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      body: body.toString(),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data || !data.success || !data.data) {
          done = true;
          sentinel.classList.add("is-done");
          return;
        }
        var html = (data.data.html || "").trim();
        if (!html) {
          done = true;
          sentinel.classList.add("is-done");
          return;
        }
        var temp = document.createElement("div");
        temp.innerHTML = html;
        while (temp.firstChild) {
          grid.appendChild(temp.firstChild);
        }
        sentinel.dataset.offset = String(data.data.next_offset || offset + perPage);
        if (!data.data.has_more) {
          done = true;
          sentinel.classList.add("is-done");
        }
      })
      .catch(function () {
        done = true;
        sentinel.classList.add("is-done");
      })
      .finally(function () {
        loading = false;
        setLoading(false);
      });
  };

  var io = new IntersectionObserver(
    function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          loadMore();
          break;
        }
      }
    },
    { rootMargin: "800px 0px", threshold: 0 }
  );
  io.observe(sentinel);
})();
