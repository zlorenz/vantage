/**
 * Client logo registry — authoritative source for all brand SVG assets.
 *
 * SVGs live in /public/logos/. Use this registry anywhere logos are needed:
 * home page brand grid, portfolio credits, client archive pages, etc.
 *
 * To add a logo: drop the SVG in /public/logos/, add an entry to CLIENT_LOGOS.
 * For multi-variant brands (Huawei, Toyota), link siblings via `variants`.
 */

/** Union of all 36 logo ids — enables type-safe lookups by id. */
export type ClientLogoId =
  | 'aquafina'
  | 'asics'
  | 'asus'
  | 'bambu-lab'
  | 'bitget'
  | 'braun'
  | 'brinc'
  | 'cnn'
  | 'coca-cola'
  | 'dji'
  | 'ecoflow'
  | 'fujifilm'
  | 'govee'
  | 'hasselblad'
  | 'huawei-horizontal'
  | 'huawei-vertical'
  | 'hyundai'
  | 'insta360'
  | 'jackery'
  | 'jw-marriott'
  | 'msi'
  | 'old-spice'
  | 'oneplus'
  | 'oppo'
  | 'p-and-g'
  | 'realme'
  | 'roborock'
  | 'samsung'
  | 'taiwan-excellence'
  | 'the-north-face'
  | 'toyota-horizontal'
  | 'toyota-vertical'
  | 'unilever'
  | 'westin'
  | 'youtube'
  | 'zhiyun';

export interface ClientLogo {
  /** Kebab-case id; use for lookups and CMS references. */
  id: ClientLogoId;
  /** Human-readable brand name — used for alt text and credits. */
  name: string;
  /** Public path to the SVG in /public/logos/. */
  file: string;
  /**
   * Other registry ids for the same brand when multiple orientations or
   * lockups exist (e.g. huawei-horizontal ↔ huawei-vertical).
   */
  variants?: readonly ClientLogoId[];
}

export const CLIENT_LOGOS = [
  { id: 'aquafina', name: 'Aquafina', file: '/logos/aquafina.svg' },
  { id: 'asics', name: 'ASICS', file: '/logos/asics.svg' },
  { id: 'asus', name: 'ASUS', file: '/logos/asus.svg' },
  { id: 'bambu-lab', name: 'Bambu Lab', file: '/logos/bambu-lab.svg' },
  { id: 'bitget', name: 'Bitget', file: '/logos/bitget.svg' },
  { id: 'braun', name: 'Braun', file: '/logos/braun.svg' },
  { id: 'brinc', name: 'BRINC', file: '/logos/brinc.svg' },
  { id: 'cnn', name: 'CNN', file: '/logos/cnn.svg' },
  { id: 'coca-cola', name: 'Coca-Cola', file: '/logos/coca-cola.svg' },
  { id: 'dji', name: 'DJI', file: '/logos/dji.svg' },
  { id: 'ecoflow', name: 'EcoFlow', file: '/logos/ecoflow.svg' },
  { id: 'fujifilm', name: 'Fujifilm', file: '/logos/fujifilm.svg' },
  { id: 'govee', name: 'Govee', file: '/logos/govee.svg' },
  { id: 'hasselblad', name: 'Hasselblad', file: '/logos/hasselblad.svg' },
  {
    id: 'huawei-horizontal',
    name: 'Huawei',
    file: '/logos/huawei-horizontal.svg',
    variants: ['huawei-vertical'],
  },
  {
    id: 'huawei-vertical',
    name: 'Huawei',
    file: '/logos/huawei-vertical.svg',
    variants: ['huawei-horizontal'],
  },
  { id: 'hyundai', name: 'Hyundai', file: '/logos/hyundai.svg' },
  { id: 'insta360', name: 'Insta360', file: '/logos/insta360.svg' },
  { id: 'jackery', name: 'Jackery', file: '/logos/jackery.svg' },
  { id: 'jw-marriott', name: 'JW Marriott', file: '/logos/jw-marriott.svg' },
  { id: 'msi', name: 'MSI', file: '/logos/msi.svg' },
  { id: 'old-spice', name: 'Old Spice', file: '/logos/old-spice.svg' },
  { id: 'oneplus', name: 'OnePlus', file: '/logos/oneplus.svg' },
  { id: 'oppo', name: 'Oppo', file: '/logos/oppo.svg' },
  { id: 'p-and-g', name: 'P&G', file: '/logos/p&g.svg' },
  { id: 'realme', name: 'realme', file: '/logos/realme.svg' },
  { id: 'roborock', name: 'Roborock', file: '/logos/roborock.svg' },
  { id: 'samsung', name: 'Samsung', file: '/logos/samsung.svg' },
  {
    id: 'taiwan-excellence',
    name: 'Taiwan Excellence',
    file: '/logos/taiwan-excellence.svg',
  },
  { id: 'the-north-face', name: 'The North Face', file: '/logos/the-north-face.svg' },
  {
    id: 'toyota-horizontal',
    name: 'Toyota',
    file: '/logos/toyota-horizontal.svg',
    variants: ['toyota-vertical'],
  },
  {
    id: 'toyota-vertical',
    name: 'Toyota',
    file: '/logos/toyota-vertical.svg',
    variants: ['toyota-horizontal'],
  },
  { id: 'unilever', name: 'Unilever', file: '/logos/unilever.svg' },
  { id: 'westin', name: 'Westin', file: '/logos/westin.svg' },
  { id: 'youtube', name: 'YouTube', file: '/logos/youtube.svg' },
  { id: 'zhiyun', name: 'Zhiyun', file: '/logos/zhiyun.svg' },
] as const satisfies readonly ClientLogo[];

/** 16 logos on the home page "Brands We Work With" grid — live site order. */
export const HOME_BRAND_LOGO_IDS = [
  'cnn',
  'oneplus',
  'hyundai',
  'samsung',
  'huawei-horizontal',
  'realme',
  'hasselblad',
  'dji',
  'braun',
  'the-north-face',
  'jw-marriott',
  'toyota-horizontal',
  'p-and-g',
  'zhiyun',
  'coca-cola',
  'unilever',
] as const satisfies readonly ClientLogoId[];

export const CLIENT_LOGO_BY_ID: Record<ClientLogoId, ClientLogo> = Object.fromEntries(
  CLIENT_LOGOS.map((logo) => [logo.id, logo])
) as Record<ClientLogoId, ClientLogo>;

export function getClientLogo(id: ClientLogoId): ClientLogo {
  return CLIENT_LOGO_BY_ID[id];
}

export function getClientLogos(ids: readonly ClientLogoId[]): ClientLogo[] {
  return ids.map((id) => getClientLogo(id));
}
