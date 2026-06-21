/**
 * Page GROQ queries — static CMS pages (home, about, news, Vietnam, etc.).
 */

const PAGE_BASE_FIELDS = `
  _id,
  title,
  titleZh,
  "slug": slug.current,
  "slugZh": slugZh.current,
  showHeroHeader,
  heroTitle,
  heroTitleZh,
  featuredImage,
  body,
  bodyZh,
  seo{
    metaDescription,
    metaDescriptionZh,
    focusKeyword
  },
  noIndex
`;

/** Any page document by English slug. */
export const PAGE_BY_SLUG_QUERY = `
  *[_type == "page" && slug.current == $slug][0]{
    ${PAGE_BASE_FIELDS},
    heroSlides[]{
      buttonLabel,
      buttonLabelZh,
      "portfolioRef": portfolioRef->{
        "slug": slug.current,
        "slugZh": slugZh.current,
        headerTitle,
        description,
        featuredImage
      }
    },
    founders[]{
      name,
      jobTitle,
      image,
      bio,
      sameAs
    },
    pdfDownload{
      label,
      file{
        asset->{
          _id,
          url
        }
      }
    }
  }
`;

/** Homepage — hero carousel slides + body copy. */
export const HOME_PAGE_QUERY = `
  *[_type == "page" && slug.current == "home"][0]{
    ${PAGE_BASE_FIELDS},
    heroSlides[]{
      buttonLabel,
      buttonLabelZh,
      "portfolioRef": portfolioRef->{
        "slug": slug.current,
        "slugZh": slugZh.current,
        headerTitle,
        description,
        featuredImage
      }
    }
  }
`;
