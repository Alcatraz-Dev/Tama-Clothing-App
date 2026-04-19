/**
 * Stipop Profile Sticker Service
 *
 * Implements the Stipop Profile Sticker API:
 *   Base URL: https://profile.stipop.io
 *   Auth:     HTTP Basic Auth — API key as username, empty password
 *
 * Flow:
 *   1. GET /v1/package          → list of profile sticker packages
 *   2. GET /v1/package/:id      → stickers inside a specific package
 *   3. GET /v1/search?q=        → search stickers by keyword
 *   4. GET /v1/mysticker        → fetch user's currently set profile sticker
 *
 * Messenger API (used for story/chat sticker search):
 *   Base URL: https://messenger.stipop.io
 */

const PROFILE_BASE = 'https://profile.stipop.io';
const MESSENGER_BASE = 'https://messenger.stipop.io';

// ─── Auth helper ──────────────────────────────────────────────────────────────
const toBase64 = (str: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  while (i < str.length) {
    const a = str.charCodeAt(i++);
    const b = i < str.length ? str.charCodeAt(i++) : 0;
    const c = i < str.length ? str.charCodeAt(i++) : 0;
    const t = (a << 16) | (b << 8) | c;
    result += chars[(t >> 18) & 0x3f];
    result += chars[(t >> 12) & 0x3f];
    result += chars[(t >> 6) & 0x3f];
    result += chars[t & 0x3f];
  }
  const pad = str.length % 3;
  if (pad > 0) result = result.slice(0, -pad) + '='.repeat(3 - pad);
  return result;
};

const profileHeaders = (apiKey: string) => ({
  apikey: apiKey,
  'Content-Type': 'application/json',
});


// ─── Types ────────────────────────────────────────────────────────────────────

/** A Profile Sticker Package (thumbnail-level, from /v1/package) */
export interface ProfilePackage {
  packageId: number;
  packageName: string;
  packageImg: string;    // main representative image (gif or png)
  category: string;
}

/** An individual sticker inside a package (from /v1/package/:id) */
export interface ProfileSticker {
  stickerId: number;
  packageId: number;
  stickerImg: string;
  keyword?: string;
}

/** Legacy shape kept for backward-compat with the Messenger sticker search */
export interface Sticker {
  stickerId: number;
  keyword: string;
  packageName?: string;
  stickerImg: string;
}

export interface StickerSearchParams {
  userId: string;
  q: string;
  lang?: string;
  countryCode?: string;
  limit?: number;
  pageNumber?: number;
}

export interface StickerSearchResponse {
  header: { code: string; status: string; message: string };
  body: { stickerList: Sticker[]; pageMap: any };
}

// ─── Profile API ──────────────────────────────────────────────────────────────

/**
 * GET /v1/package
 * Returns the full list of profile sticker packages.
 */
export const getProfilePackages = async (
  apiKey: string,
  userId: string,
  limit = 40,
  pageNumber = 1,
): Promise<ProfilePackage[]> => {
  const params = new URLSearchParams({
    userId,
    limit: String(limit),
    pageNumber: String(pageNumber),
  });
  const res = await fetch(`${PROFILE_BASE}/v1/package?${params}`, {
    headers: profileHeaders(apiKey),
  });
  const data = await res.json();
  if (data?.header?.code !== '0000') {
    throw new Error(data?.header?.message || 'Failed to fetch profile packages');
  }
  return data.body?.profilePackageList ?? [];
};

/**
 * GET /v1/package/:packageId
 * Returns the individual stickers inside a specific package.
 */
export const getProfilePackageStickers = async (
  apiKey: string,
  userId: string,
  packageId: number,
): Promise<ProfileSticker[]> => {
  const params = new URLSearchParams({ userId });
  const res = await fetch(`${PROFILE_BASE}/v1/package/${packageId}?${params}`, {
    headers: profileHeaders(apiKey),
  });
  const data = await res.json();
  if (data?.header?.code !== '0000') {
    throw new Error(data?.header?.message || 'Failed to fetch package stickers');
  }
  // Structure from provided JSON: body.profileSticker[0].stickers
  const pkgInfo = data.body?.profileSticker?.[0];
  const list = pkgInfo?.stickers ?? [];
  
  return list.map((s: any): ProfileSticker => ({
    stickerId: s.stickerId,
    packageId: pkgInfo?.packageId ?? packageId,
    stickerImg: s.stickerImg,
    keyword: s.keyword,
  }));
};

/**
 * GET /v1/search?q=
 * Searches profile stickers by keyword.
 */
export const searchProfileStickers = async (
  apiKey: string,
  params: StickerSearchParams,
): Promise<ProfileSticker[]> => {
  const { userId, q, lang = 'en', countryCode = 'US', limit = 30, pageNumber = 1 } = params;
  const qp = new URLSearchParams({ userId, q, lang, countryCode, limit: String(limit), pageNumber: String(pageNumber) });
  const res = await fetch(`${PROFILE_BASE}/v1/search?${qp}`, {
    headers: profileHeaders(apiKey),
  });
  const data = await res.json();
  if (data?.header?.code !== '0000') {
    throw new Error(data?.header?.message || 'Profile sticker search failed');
  }
  const list = data.body?.stickerList ?? [];
  return list.map((s: any): ProfileSticker => ({
    stickerId: s.stickerId,
    packageId: s.packageId,
    stickerImg: s.stickerImg,
    keyword: s.keyword,
  }));
};

/**
 * GET /v1/mysticker
 * Returns the profile sticker the user currently has set.
 */
export const getMyProfileSticker = async (
  apiKey: string,
  userId: string,
): Promise<ProfileSticker | null> => {
  const qp = new URLSearchParams({ userId });
  const res = await fetch(`${PROFILE_BASE}/v1/mysticker?${qp}`, {
    headers: profileHeaders(apiKey),
  });
  const data = await res.json();
  if (data?.header?.code !== '0000') return null;
  const s = data.body?.sticker;
  if (!s) return null;
  return { stickerId: s.stickerId, packageId: s.packageId, stickerImg: s.stickerImg, keyword: s.keyword };
};

/**
 * POST /v1/package/sticker/:stickerId
 * Registers a sticker as the user's current profile sticker on Stipop.
 */
export const registerProfileSticker = async (
  apiKey: string,
  userId: string,
  stickerId: number,
): Promise<boolean> => {
  const qp = new URLSearchParams({ userId });
  const res = await fetch(`${PROFILE_BASE}/v1/package/sticker/${stickerId}?${qp}`, {
    method: 'POST',
    headers: profileHeaders(apiKey),
  });
  const data = await res.json();
  return data?.header?.code === '0000';
};

// ─── Messenger API (legacy / story sticker search) ────────────────────────────

export const searchStickers = async (
  apiKey: string,
  params: StickerSearchParams,
): Promise<StickerSearchResponse> => {
  const { userId, q, lang = 'en', countryCode = 'US', limit = 20, pageNumber = 1 } = params;
  const qp = new URLSearchParams({ userId, q, lang, countryCode, limit: String(limit), pageNumber: String(pageNumber) });
  const res = await fetch(`${MESSENGER_BASE}/v1/search?${qp}`, {
    headers: { apikey: apiKey, 'Content-Type': 'application/json' },
  });
  const data: StickerSearchResponse = await res.json();
  if (data.header.code !== '0000') throw new Error(data.header.message || 'Search failed');
  return data;
};

export const getDefaultStickers = async (
  apiKey: string,
  userId: string,
  lang = 'en',
  countryCode = 'US',
  limit = 30,
): Promise<Sticker[]> => {
  const keywords = ['cute', 'love', 'happy', 'funny', 'hello'];
  const q = keywords[Math.floor(Math.random() * keywords.length)];
  try {
    const r = await searchStickers(apiKey, { userId, q, lang, countryCode, limit });
    return r.body.stickerList;
  } catch {
    return [];
  }
};

export const getTrendingStickers = async (
  apiKey: string,
  userId: string,
  limit = 40,
): Promise<Sticker[]> => {
  const qp = new URLSearchParams({ userId, limit: String(limit) });
  const res = await fetch(`${MESSENGER_BASE}/v1/trending?${qp}`, {
    headers: { apikey: apiKey, 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (data?.header?.code !== '0000') return [];
  return data.body?.stickerList ?? [];
};

/** Append ?d=WxH dimension param to any Stipop image URL */
export const getStickerWithDimensions = (url: string, w = 400, h = 400): string => {
  const sw = Math.min(Math.max(w, 1), 1000);
  const sh = Math.min(Math.max(h, 1), 1000);
  return `${url}${url.includes('?') ? '&' : '?'}d=${sw}x${sh}`;
};

// Kept for backward compat — now maps to Profile API
export const getMyProfileStickers = getProfilePackages as any;
export const getProfileStickerPackageInfo = getProfilePackageStickers as any;
