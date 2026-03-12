/**
 * Mobile navbar: reliable dropdown toggling when navbar is collapsed.
 *
 * Bootstrap 5 dropdowns use Popper.js and absolute positioning, which can
 * fail or misbehave inside the collapsed navbar (off-screen, or collapse
 * capturing the click). This script only runs when the viewport is in the
 * collapsed range (≤768px). It toggles a class .vp-dropdown-open on the
 * .dropdown parent so CSS can show the menu in-flow (accordion-style).
 * Desktop dropdowns are unchanged and still use Bootstrap's default behavior.
 */
(function () {
  var MOBILE_BREAKPOINT = 768;

  function isMobile() {
    return window.innerWidth < MOBILE_BREAKPOINT;
  }

  function init() {
    var header = document.getElementById('header');
    var navbar = document.getElementById('navbar');
    if (!header || !navbar) return;

    header.addEventListener('click', function (e) {
      if (!isMobile()) return;

      var toggle = e.target.closest('.dropdown-toggle');
      if (!toggle) return;

      var dropdown = toggle.closest('.dropdown');
      if (!dropdown || !dropdown.contains(toggle)) return;

      e.preventDefault();
      e.stopPropagation();

      var wasOpen = dropdown.classList.contains('vp-dropdown-open');
      var allDropdowns = header.querySelectorAll('.dropdown');
      allDropdowns.forEach(function (el) {
        el.classList.remove('vp-dropdown-open', 'show');
        var menu = el.querySelector('.dropdown-menu');
        if (menu) menu.classList.remove('show');
        var t = el.querySelector('.dropdown-toggle');
        if (t) t.setAttribute('aria-expanded', 'false');
      });

      if (!wasOpen) {
        dropdown.classList.add('vp-dropdown-open');
        toggle.setAttribute('aria-expanded', 'true');
      }
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
