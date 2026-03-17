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

  function initLanguageSwitcher(header) {
    var slot = header.querySelector('.vp-mobile-lang-slot');
    if (!slot) return function () {};

    // TranslatePress menu item. Classnames can differ by configuration/environment
    // (some installs don't output trp-menu-ls-mobile), so use the stable container class.
    var langItem =
      header.querySelector('li.trp-language-switcher-container') ||
      header.querySelector('li.trp-menu-ls-item');
    if (!langItem) return function () {};

    var originalParent = langItem.parentElement;
    if (!originalParent) return function () {};

    function place() {
      // Always re-select the element in case it was moved.
      langItem =
        header.querySelector('li.trp-language-switcher-container') ||
        header.querySelector('li.trp-menu-ls-item') ||
        langItem;
      if (!langItem) return;

      if (isMobile()) {
        if (!slot.contains(langItem)) {
          slot.appendChild(langItem);
        }
        langItem.classList.add('vp-mobile-lang-item');
      } else {
        if (slot.contains(langItem) && originalParent) {
          originalParent.appendChild(langItem);
        }
        langItem.classList.remove('vp-mobile-lang-item');
      }
    }

    // Initial placement + keep correct on resize/orientation changes.
    place();
    window.addEventListener('resize', place);

    return function cleanup() {
      window.removeEventListener('resize', place);
    };
  }

  function init() {
    var header = document.getElementById('header');
    var navbar = document.getElementById('navbar');
    if (!header || !navbar) return;

    initLanguageSwitcher(header);

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
