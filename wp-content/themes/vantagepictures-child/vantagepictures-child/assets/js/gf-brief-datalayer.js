/**
 * Client briefing form (Gravity Forms ID 1): push success to dataLayer for GTM.
 * Fires when the form confirmation is shown (AJAX or non-AJAX).
 *
 * GTM: Create a Custom Event trigger for event name "vp_brief_form_submit",
 * then use it for GA4 events, Meta Lead, LinkedIn conversion, etc.
 */
(function () {
  function pushBriefFormSubmit(formId) {
    if (parseInt(formId, 10) !== 1) {
      return;
    }
    // Skip if already pushed by AJAX iframe script (avoids double fire).
    if (window._vp_brief_pushed) {
      return;
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'vp_brief_form_submit',
      formId: String(formId),
      formName: 'client_brief',
    });
  }

  if (typeof jQuery !== 'undefined') {
    jQuery(document).on('gform_confirmation_loaded', function (event, formId) {
      pushBriefFormSubmit(formId);
    });
  }
})();
