import path from 'node:path';
import { PATHS } from '../config';
import type { ExportedSiteSettings } from '../export/site-settings';
import { readJson } from '../lib/fs';
import { htmlToPortableText } from '../lib/html-to-pt';
import { imageField, loadIdMap } from '../lib/id-map';
import { SITE_SETTINGS_ID } from '../lib/ids';
import { createOrReplace } from '../lib/sanity-client';

export async function importSiteSettings(): Promise<void> {
  const settings = readJson<ExportedSiteSettings>(
    path.join(PATHS.migrationData, 'site-settings.json')
  );
  const idMap = loadIdMap();

  const doc: Record<string, unknown> = {
    _id: SITE_SETTINGS_ID,
    _type: 'siteSettings',
    contactEmail: settings.contactEmail,
  };

  if (settings.contactPhone) doc.contactPhone = settings.contactPhone;
  if (settings.contactWhatsapp) doc.contactWhatsapp = settings.contactWhatsapp;
  if (settings.contactAddress) doc.contactAddress = settings.contactAddress;
  if (settings.contactModalTitle) doc.contactModalTitle = settings.contactModalTitle;
  if (settings.contactModalIntro) doc.contactModalIntro = settings.contactModalIntro;
  if (settings.contactModalContentHtml) {
    doc.contactModalContent = htmlToPortableText(settings.contactModalContentHtml);
  }
  if (settings.contactCtaText) doc.contactCtaText = settings.contactCtaText;
  if (settings.contactCtaUrl) doc.contactCtaUrl = settings.contactCtaUrl;
  if (settings.socialVimeo) doc.socialVimeo = settings.socialVimeo;
  if (settings.socialInstagram) doc.socialInstagram = settings.socialInstagram;
  if (settings.socialFacebook) doc.socialFacebook = settings.socialFacebook;
  if (settings.socialLinkedin) doc.socialLinkedin = settings.socialLinkedin;
  if (settings.socialYoutube) doc.socialYoutube = settings.socialYoutube;
  if (settings.socialXinpianchang) doc.socialXinpianchang = settings.socialXinpianchang;
  if (settings.socialXiaohongshu) doc.socialXiaohongshu = settings.socialXiaohongshu;

  const ogImage = imageField(idMap, settings.defaultOgImageWpId);
  if (ogImage) doc.defaultOgImage = ogImage;

  await createOrReplace(doc);
  console.log('Imported siteSettings');
}
