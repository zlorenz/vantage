/**
 * Sanity schema registry — all document types and objects for Vantage Pictures.
 *
 * Source: content-schema.md §4
 * Objects must be registered before documents that reference them.
 */

import { siteSettings } from './siteSettings';
import { category } from './category';
import { videoFormat } from './videoFormat';
import { industry } from './industry';
import { market } from './market';
import { client } from './client';
import { crewMember } from './crewMember';
import { platform } from './platform';
import { portfolioEntry } from './portfolioEntry';
import { blogPost } from './blogPost';
import { page } from './page';

import { seoFields } from './objects/seoFields';
import { creditsAdditionalRow } from './objects/creditsAdditionalRow';
import { productionCredits } from './objects/productionCredits';
import { cameraCredits } from './objects/cameraCredits';
import { geCredits } from './objects/geCredits';
import { artCredits } from './objects/artCredits';
import { castingCredits } from './objects/castingCredits';
import { stillsCredits } from './objects/stillsCredits';
import { postCredits } from './objects/postCredits';
import { additionalVideo } from './objects/additionalVideo';
import { heroSlide } from './objects/heroSlide';
import { founder } from './objects/founder';
import { pdfDownload } from './objects/pdfDownload';
import { imageGallery } from './objects/imageGallery';
import { ctaButton } from './objects/ctaButton';

export const schemaTypes = [
  // Shared objects
  seoFields,
  creditsAdditionalRow,
  productionCredits,
  cameraCredits,
  geCredits,
  artCredits,
  castingCredits,
  stillsCredits,
  postCredits,
  additionalVideo,
  heroSlide,
  founder,
  pdfDownload,
  imageGallery,
  ctaButton,

  // Documents
  siteSettings,
  category,
  videoFormat,
  industry,
  market,
  client,
  crewMember,
  platform,
  portfolioEntry,
  blogPost,
  page,
];
