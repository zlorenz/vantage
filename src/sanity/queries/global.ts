/**
 * Global GROQ queries — shared across layout components.
 *
 * These queries fetch singleton or site-wide data used on every page.
 * Import named exports here; never write inline GROQ in page or component files.
 */

/**
 * Fetches the singleton siteSettings document.
 *
 * Used by SiteHeader, SiteFooter, and the /contact page on every page via
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
  legalName,
  foundingDate,
  numberOfEmployees{minValue, maxValue},
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
 * One-shot fetch for Organization / ProfessionalService JSON-LD:
 * siteSettings org fields + market / industry / videoFormat titles.
 * Uses the non-stega read client at call sites (JSON-LD must stay clean).
 */
export const ORGANIZATION_SCHEMA_DATA_QUERY = `{
  "settings": *[_type == "siteSettings"][0]{
    legalName,
    foundingDate,
    numberOfEmployees{minValue, maxValue},
    contactPhone
  },
  "markets": *[_type == "market" && defined(title)] | order(title asc) { title },
  "industries": *[_type == "industry" && defined(title)] | order(title asc) { title },
  "videoFormats": *[_type == "videoFormat" && defined(title)] | order(title asc) { title }
}`;

/**
 * Fetches published page documents for navigation labels and slugZh resolution.
 *
 * Used by SiteHeader for locale-aware labels (title / optional navLabel) and
 * Chinese URLs from CMS data rather than hardcoded strings.
 */
export const NAV_PAGES_QUERY = `*[_type == "page" && !defined(trash.trashedAt) && slug.current in ["home","about","work","news","vietnam-production-service"]]{
  "slug": slug.current,
  "slugZh": slugZh.current,
  title,
  titleZh,
  navLabel,
  navLabelZh
}`;
