(() => {
  const moveValidationSummary = () => {
    const wrapper = document.getElementById("gform_wrapper_1");
    const container = document.getElementById("gform_1_validation_container");

    if (!wrapper || !container) {
      return;
    }

    const form = wrapper.querySelector("form#gform_1");
    if (!form) {
      return;
    }

    // Prefer the current page footer (multi-page form), fallback to any footer.
    const currentPage = form.querySelector(".gform_page:not([style*='display:none'])");
    const footer =
      (currentPage && currentPage.querySelector(".gform_page_footer")) ||
      form.querySelector(".gform_page_footer") ||
      form.querySelector(".gform_footer");

    if (!footer || !footer.parentNode) {
      return;
    }

    footer.parentNode.insertBefore(container, footer);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", moveValidationSummary);
  } else {
    moveValidationSummary();
  }
})();

