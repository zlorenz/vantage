/**
 * Global GROQ queries — shared across layout components.
 *
 * These queries fetch singleton or site-wide data used on every page.
 * Import named exports here; never write inline GROQ in page or component files.
 */

/**
 * Fetches the singleton siteSettings document.
 *
 * Used by SiteHeader, SiteFooter, and ContactModal on every page via
 * the locale layout — one server-side fetch, passed down as props.
 *
 * Returns null if the document has not been created yet (should not happen
 * post-migration).
 */
export const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0]{
  contactEmail,
  contactPhone,
  contactWhatsapp,
  contactAddress,
  contactAddressZh,
  contactModalTitle,
  contactModalTitleZh,
  contactModalIntro,
  contactModalIntroZh,
  contactModalContent,
  contactModalContentZh,
  contactCtaText,
  contactCtaTextZh,
  contactCtaUrl,
  socialVimeo,
  socialInstagram,
  socialFacebook,
  socialLinkedin,
  socialYoutube,
  socialXinpianchang,
  socialXiaohongshu,
  defaultOgImage,
  campaignCta{
    heading,
    headingZh,
    paragraphs,
    paragraphsZh,
    buttonLabel,
    buttonLabelZh,
    buttonHref
  }
}`;

/**
 * Fetches published page documents for navigation link slugZh resolution.
 *
 * Used by SiteHeader to build locale-aware Chinese URLs from CMS data
 * rather than hardcoded slug strings.
 */
export const NAV_PAGES_QUERY = `*[_type == "page" && !defined(trash.trashedAt) && slug.current in ["home","about","work","news","vietnam-production-service"]]{
  "slug": slug.current,
  "slugZh": slugZh.current
}`;
