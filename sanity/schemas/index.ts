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
import { creditIdentity } from './creditIdentity';
import { translatedPhrase } from './translatedPhrase';
import { platform } from './platform';
import { portfolioEntry } from './portfolioEntry';
import { blogPost } from './blogPost';
import { page } from './page';
import { trashRecord } from './trashRecord';
import { campaignBriefAttachment } from './campaignBriefAttachment';

import { seoFields } from './objects/seoFields';
import { trashMetadata } from './objects/trashMetadata';
import { crewPerson } from './objects/crewPerson';
import { crewCredit } from './objects/crewCredit';
import { additionalVideo } from './objects/additionalVideo';
import { founder } from './objects/founder';
import { brandLogoItem } from './objects/brandLogoItem';
import { campaignCta } from './objects/campaignCta';
import { pdfDownload } from './objects/pdfDownload';
import { imageGallery } from './objects/imageGallery';
import { ctaButton } from './objects/ctaButton';
import { videoEmbed } from './objects/videoEmbed';
import { portableTextBody } from './objects/portableTextBody';

export const schemaTypes = [
  // Shared objects
  seoFields,
  trashMetadata,
  crewPerson,
  crewCredit,
  additionalVideo,
  founder,
  brandLogoItem,
  campaignCta,
  pdfDownload,
  imageGallery,
  ctaButton,
  videoEmbed,
  portableTextBody,

  // Documents
  siteSettings,
  category,
  videoFormat,
  industry,
  market,
  client,
  crewMember,
  creditIdentity,
  translatedPhrase,
  platform,
  portfolioEntry,
  blogPost,
  page,
  trashRecord,
  campaignBriefAttachment,
];
