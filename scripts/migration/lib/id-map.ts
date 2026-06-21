import { PATHS } from '../config';
import { readJson, readJsonIfExists, writeJson } from './fs';

export interface IdMap {
  assets: Record<string, string>;
  documents: Record<string, string>;
}

export function loadIdMap(): IdMap {
  return (
    readJsonIfExists<IdMap>(PATHS.idMap) ?? {
      assets: {},
      documents: {},
    }
  );
}

export function saveIdMap(map: IdMap): void {
  writeJson(PATHS.idMap, map);
}

export function getAssetRef(map: IdMap, wpAttachmentId: number): string | undefined {
  return map.assets[String(wpAttachmentId)];
}

export function setAssetRef(
  map: IdMap,
  wpAttachmentId: number,
  sanityAssetId: string
): void {
  map.assets[String(wpAttachmentId)] = sanityAssetId;
}

export function imageField(
  map: IdMap,
  wpAttachmentId: number | undefined
): { _type: 'image'; asset: { _type: 'reference'; _ref: string } } | undefined {
  if (!wpAttachmentId) return undefined;
  const ref = getAssetRef(map, wpAttachmentId);
  if (!ref) return undefined;
  return {
    _type: 'image',
    asset: { _type: 'reference', _ref: ref },
  };
}

export function docRef(sanityId: string): { _type: 'reference'; _ref: string } {
  return { _type: 'reference', _ref: sanityId };
}
