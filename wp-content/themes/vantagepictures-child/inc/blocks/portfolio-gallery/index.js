// Prevent the file from being executed twice (can happen with some caching/minify setups)
if (window.__VP_PORTFOLIO_GALLERY_BLOCK_LOADED__) {
  // eslint-disable-next-line no-console
  console.warn('VP Portfolio Gallery block already loaded — skipping duplicate execution.');
} else {
  window.__VP_PORTFOLIO_GALLERY_BLOCK_LOADED__ = true;

const { useState, useRef, useEffect, Fragment } = wp.element;
const apiFetch = wp.apiFetch;
const { registerBlockType } = wp.blocks;
const { InspectorControls } = wp.blockEditor;
const { PanelBody, TextControl, SelectControl, RangeControl } = wp.components;

registerBlockType("vp/portfolio-gallery", {

  edit: ({ attributes, setAttributes }) => {

    const timerRef = useRef(null);

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const cacheRef = useRef({});

    const [titleMap, setTitleMap] = useState({});
    const decodeHTML = (html) => {
      const txt = document.createElement("textarea");
      txt.innerHTML = html;
      return txt.value;
    };

    const titleFor = (id) => {
      const t = titleMap[String(id)];
      return t ? decodeHTML(t) : `#${id}`;
    };

    useEffect(() => {
      const ids = attributes.ids ? attributes.ids.split(",").map(s => s.trim()).filter(Boolean) : [];
      if (!ids.length) return;

      // ✅ Avoid crashing Gutenberg if apiFetch isn't available
      if (!apiFetch) {
        // fallback: just show IDs
        const next = { ...titleMap };
        ids.forEach(id => { if (!next[id]) next[id] = `#${id}`; });
        setTitleMap(next);
        return;
      }

      const missing = ids.filter(id => !titleMap[id]);
      if (!missing.length) return;

      apiFetch({
        path: `/wp/v2/portfolio?include=${missing.join(",")}&per_page=${missing.length}&_fields=id,title`
      })
        .then((posts) => {
          const next = { ...titleMap };
          posts.forEach((p) => {
            next[String(p.id)] =
              p.title && p.title.rendered ? p.title.rendered : `(Untitled #${p.id})`;
          });
          setTitleMap(next);
        })
        .catch(() => {
          const next = { ...titleMap };
          missing.forEach(id => { next[id] = `#${id}`; });
          setTitleMap(next);
        });
    }, [attributes.ids]);

    const getIdsArray = () =>
      (attributes.ids ? attributes.ids.split(",") : [])
        .map((s) => String(s).trim())
        .filter(Boolean);

    const setIdsArray = (arr) =>
      setAttributes({ ids: arr.map((x) => String(x).trim()).filter(Boolean).join(",") });

    const searchPortfolio = (value) => {

      const q = (value || "").trim().toLowerCase();

      if (timerRef.current) clearTimeout(timerRef.current);

      if (q.length < 2) {
        setResults([]);
        return;
      }

      // cached result
      if (cacheRef.current[q]) {
        setResults(cacheRef.current[q]);
        return;
      }

      timerRef.current = setTimeout(() => {

        setLoading(true);

        apiFetch({
          path: `/wp/v2/portfolio?search=${encodeURIComponent(q)}&per_page=8&_fields=id,title`
        })
        .then((posts) => {

          cacheRef.current[q] = posts;

          setResults(posts);

        })
        .finally(() => {
          setLoading(false);
        });

      }, 250);

    };

    return wp.element.createElement(
      Fragment,
      {},

      wp.element.createElement(
        InspectorControls,
        {},

        wp.element.createElement(
          PanelBody,
          { title: "Gallery Settings", initialOpen: true },

          wp.element.createElement(TextControl, {
            label: "Search Portfolio",
            onChange: searchPortfolio
          }),

          loading &&
            wp.element.createElement(
              "div",
              { style: { padding: "6px 8px", color: "#777" } },
              "Searching portfolio..."
            ),

          results.map((post) =>
            wp.element.createElement(
              "div",
              {
                key: post.id,
                style: {
                  padding: "6px 8px",
                  cursor: "pointer",
                  borderBottom: "1px solid #eee"
                },
                onClick: () => {
                  const current = attributes.ids ? attributes.ids.split(",") : [];

                  if (!current.includes(String(post.id))) {
                    const updated = [...current, post.id].join(",");
                    setAttributes({ ids: updated });
                    setResults([]);
                  }
                }
              },
              post.title.rendered
            )
          ),

          attributes.ids &&
            wp.element.createElement(
              "div",
              { style: { marginTop: "10px" } },

              getIdsArray().map((id, index) => {
                const idsArr = getIdsArray();

                return wp.element.createElement(
                  "div",
                  {
                    key: id + "-" + index, // allow same ID twice (just in case)
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 0",
                      borderBottom: "1px solid #eee",
                    },
                  },

                  // Title + ID
                  wp.element.createElement(
                    "div",
                    { style: { flex: 1 } },
                    wp.element.createElement(
                      "div",
                      { style: { fontWeight: 600 } },
                      titleFor(id)
                    ),
                    wp.element.createElement(
                      "div",
                      { style: { fontSize: "12px", opacity: 0.7 } },
                      `ID: ${id}`
                    )
                  ),

                  // Up
                  wp.element.createElement(wp.components.Button, {
                    isSmall: true,
                    icon: "arrow-up-alt2",
                    label: "Move up",
                    disabled: index === 0,
                    onClick: () => {
                      const next = idsArr.slice();
                      const temp = next[index - 1];
                      next[index - 1] = next[index];
                      next[index] = temp;
                      setIdsArray(next);
                    },
                  }),

                  // Down
                  wp.element.createElement(wp.components.Button, {
                    isSmall: true,
                    icon: "arrow-down-alt2",
                    label: "Move down",
                    disabled: index === idsArr.length - 1,
                    onClick: () => {
                      const next = idsArr.slice();
                      const temp = next[index + 1];
                      next[index + 1] = next[index];
                      next[index] = temp;
                      setIdsArray(next);
                    },
                  }),

                  // Remove
                  wp.element.createElement(wp.components.Button, {
                    isSmall: true,
                    isDestructive: true,
                    icon: "trash",
                    label: "Remove",
                    onClick: () => {
                      const next = idsArr.slice();
                      next.splice(index, 1);
                      setIdsArray(next);
                    },
                  })
                );
              })
            ),

          wp.element.createElement(SelectControl, {
            label: "Taxonomy",
            value: attributes.taxonomy,
            options: [
              { label: "Video Format", value: "video-format" },
              { label: "Market", value: "market" },
              { label: "Industry", value: "industry" }
            ],
            onChange: (v) => setAttributes({ taxonomy: v })
          }),

          wp.element.createElement(TextControl, {
            label: "Terms (slugs, comma separated)",
            value: attributes.terms,
            onChange: (v) => setAttributes({ terms: v })
          }),

          wp.element.createElement(RangeControl, {
            label: "Limit",
            min: 1,
            max: 24,
            value: attributes.limit,
            onChange: (v) => setAttributes({ limit: v })
          }),

          wp.element.createElement(RangeControl, {
            label: "Columns",
            min: 2,
            max: 4,
            value: attributes.cols,
            onChange: (v) => setAttributes({ cols: v })
          }),

          wp.element.createElement(RangeControl, {
            label: "Gutter",
            min: 1,
            max: 5,
            value: attributes.gutter,
            onChange: (v) => setAttributes({ gutter: v })
          })

        )
      ),

      wp.element.createElement(
        "div",
        {
          style: {
            padding: "20px",
            border: "1px dashed #ccc"
          }
        },
        "Portfolio Gallery will render on the frontend."
      )

    );

  },

  save() {
    return null;
  }

});
} // <-- closes the else block