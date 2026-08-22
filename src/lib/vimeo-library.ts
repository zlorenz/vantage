/**
 * Fetch the authenticated user's Vimeo video library for Studio picker.
 * Paginates at 100/page; uses Next.js fetch cache unless bypassed.
 */

export const VIMEO_LIBRARY_REVALIDATE_SECONDS = 300;

const VIMEO_LIBRARY_FIELDS =
  'uri,name,link,duration,created_time,privacy.view,pictures.sizes';

export type VimeoLibraryPictureSize = {
  width: number;
  height: number;
  link: string;
};

export type VimeoLibraryVideo = {
  uri: string;
  name: string;
  link: string;
  duration: number;
  created_time: string;
  privacy?: {view?: string};
  pictures?: {sizes?: VimeoLibraryPictureSize[]};
};

type VimeoLibraryPageResponse = {
  total?: number;
  page?: number;
  per_page?: number;
  paging?: {next?: string | null};
  data?: VimeoLibraryVideo[];
  error?: string;
};

export type VimeoLibraryLoadResult =
  | {ok: true; videos: VimeoLibraryVideo[]; total: number}
  | {ok: false; status: number; error: string; message: string};

async function fetchLibraryPage(
  page: number,
  token: string,
  refresh: boolean,
): Promise<Response> {
  const url = `https://api.vimeo.com/me/videos?per_page=100&page=${page}&fields=${VIMEO_LIBRARY_FIELDS}`;
  return fetch(url, {
    headers: {
      Authorization: `bearer ${token}`,
      Accept: 'application/vnd.vimeo.*+json;version=3.4',
    },
    ...(refresh ? {cache: 'no-store' as const} : {next: {revalidate: VIMEO_LIBRARY_REVALIDATE_SECONDS}}),
  });
}

async function parseLibraryPage(response: Response): Promise<VimeoLibraryLoadResult> {
  if (response.status === 429) {
    return {
      ok: false,
      status: 429,
      error: 'rate_limited',
      message: 'Vimeo rate limit reached. Try again shortly.',
    };
  }
  if (!response.ok) {
    return {
      ok: false,
      status: 502,
      error: 'vimeo_error',
      message: 'Could not load videos from Vimeo.',
    };
  }

  const body = (await response.json()) as VimeoLibraryPageResponse;
  const videos = Array.isArray(body.data) ? body.data : [];
  const total = typeof body.total === 'number' ? body.total : videos.length;
  return {ok: true, videos, total};
}

/**
 * Load all pages for /me/videos. Stops early on 429 or other errors.
 */
export async function loadVimeoLibrary(
  token: string,
  options?: {refresh?: boolean},
): Promise<VimeoLibraryLoadResult> {
  const refresh = options?.refresh === true;
  const all: VimeoLibraryVideo[] = [];
  let expectedTotal: number | null = null;

  for (let page = 1; page <= 50; page++) {
    const response = await fetchLibraryPage(page, token, refresh);
    const parsed = await parseLibraryPage(response);
    if (!parsed.ok) return parsed;

    if (expectedTotal == null) expectedTotal = parsed.total;
    all.push(...parsed.videos);

    if (all.length >= expectedTotal || parsed.videos.length === 0) {
      break;
    }
  }

  return {ok: true, videos: all, total: expectedTotal ?? all.length};
}
