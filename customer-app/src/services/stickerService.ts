/**
 * Stipop Sticker Services
 *
 * Provides sticker functionality using the Stipop API.
 *
 * Messenger API (Search, Trending, Recent): https://messenger.stipop.io
 * Profile API (Profile Stickers): https://profile.stipop.io
 */

const STIPOP_MESSENGER_BASE_URL = "https://messenger.stipop.io";
const STIPOP_PROFILE_BASE_URL = "https://profile.stipop.io";

// Helper function for base64 encoding (works in React Native)
const base64Encode = (str: string): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  let i = 0;

  while (i < str.length) {
    const a = str.charCodeAt(i++);
    const b = i < str.length ? str.charCodeAt(i++) : 0;
    const c = i < str.length ? str.charCodeAt(i++) : 0;

    const triplet = (a << 16) | (b << 8) | c;

    result += chars[(triplet >> 18) & 0x3f];
    result += chars[(triplet >> 12) & 0x3f];
    result += chars[(triplet >> 6) & 0x3f];
    result += chars[triplet & 0x3f];
  }

  // Add padding if needed
  const padding = str.length % 3;
  if (padding > 0) {
    result = result.slice(0, -padding) + "=".repeat(3 - padding);
  }

  return result;
};

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

export interface PageMap {
  pageNumber: number;
  onePageCountRow: number;
  totalCount: number;
  pageCount: number;
  groupCount: number;
  groupNumber: number;
  pageGroupCount: number;
  startPage: number;
  endPage: number;
  startRow: number;
  endRow: number;
  modNum: number;
  listStartNumber: number;
}

export interface StickerSearchResponse {
  header: {
    code: string;
    status: string;
    message: string;
  };
  body: {
    stickerList: Sticker[];
    pageMap: PageMap;
  };
}

/**
 * Search for stickers using the Stipop API
 *
 * @param apiKey - Stipop API Key
 * @param params - Search parameters
 * @returns Promise with sticker search results
 */
export const searchStickers = async (
  apiKey: string,
  params: StickerSearchParams,
): Promise<StickerSearchResponse> => {
  const {
    userId,
    q,
    lang = "en",
    countryCode = "US",
    limit = 20,
    pageNumber = 1,
  } = params;

  // Build query string
  const queryParams = new URLSearchParams({
    userId,
    q,
    lang,
    countryCode,
    limit: limit.toString(),
    pageNumber: pageNumber.toString(),
  });

  const url = `${STIPOP_MESSENGER_BASE_URL}/v1/search?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      apikey: apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.header?.message || "Failed to search stickers");
  }

  const data: StickerSearchResponse = await response.json();

  // Handle error responses
  if (data.header.code !== "0000") {
    throw new Error(data.header.message || "Sticker search failed");
  }

  return data;
};

/**
 * Get sticker image URL with custom dimensions
 *
 * @param stickerUrl - Original sticker image URL
 * @param width - Desired width in pixels (max 700)
 * @param height - Desired height in pixels (max 700)
 * @returns Modified URL with dimension parameter
 */
export const getStickerWithDimensions = (
  stickerUrl: string,
  width: number = 300,
  height: number = 300,
): string => {
  // Ensure dimensions are within limits
  const safeWidth = Math.min(Math.max(width, 1), 700);
  const safeHeight = Math.min(Math.max(height, 1), 700);

  // Add dimension parameter to URL
  const separator = stickerUrl.includes("?") ? "&" : "?";
  return `${stickerUrl}${separator}d=${safeWidth}x${safeHeight}`;
};

/**
 * Get user's recently used stickers
 *
 * @param apiKey - Stipop API Key
 * @param userId - Unique user identifier
 * @param limit - Number of stickers to fetch (max 50)
 * @param pageNumber - Page number for pagination
 * @returns Promise with user's recent stickers
 */
export const getRecentStickers = async (
  apiKey: string,
  userId: string,
  limit: number = 20,
  pageNumber: number = 1,
): Promise<Sticker[]> => {
  const queryParams = new URLSearchParams({
    userId,
    limit: limit.toString(),
    pageNumber: pageNumber.toString(),
  });

  const url = `${STIPOP_MESSENGER_BASE_URL}/v1/sticker/recent?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      apikey: apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error?.header?.message || "Failed to fetch recent stickers",
    );
  }

  const data: StickerSearchResponse = await response.json();

  if (data.header.code !== "0000") {
    throw new Error(data.header.message || "Failed to fetch recent stickers");
  }

  return data.body.stickerList;
};

/**
 * Get trending stickers
 *
 * @param apiKey - Stipop API Key
 * @param userId - Unique user identifier
 * @param lang - Language code for localization
 * @param countryCode - Country code for localization
 * @param limit - Number of stickers to fetch
 * @param pageNumber - Page number for pagination
 * @returns Promise with trending stickers
 */
export const getTrendingStickers = async (
  apiKey: string,
  userId: string,
  lang: string = "en",
  countryCode: string = "US",
  limit: number = 30,
  pageNumber: number = 1,
): Promise<Sticker[]> => {
  const queryParams = new URLSearchParams({
    userId,
    lang,
    countryCode,
    limit: limit.toString(),
    pageNumber: pageNumber.toString(),
  });

  const url = `${STIPOP_MESSENGER_BASE_URL}/v1/sticker/trending?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      apikey: apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error?.header?.message || "Failed to fetch trending stickers",
    );
  }

  const data: StickerSearchResponse = await response.json();

  if (data.header.code !== "0000") {
    throw new Error(data.header.message || "Failed to fetch trending stickers");
  }

  return data.body.stickerList;
};

/**
 * Get trending search terms
 *
 * @param apiKey - Stipop API Key
 * @param userId - Unique user identifier
 * @param lang - Language code
 * @param countryCode - Country code
 * @returns Promise with trending search terms
 */
export const getTrendingSearchTerms = async (
  apiKey: string,
  userId: string,
  lang: string = "en",
  countryCode: string = "US",
): Promise<string[]> => {
  const queryParams = new URLSearchParams({
    userId,
    lang,
    countryCode,
  });

  const url = `${STIPOP_MESSENGER_BASE_URL}/v1/search/trending?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      apikey: apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.header?.message || "Failed to fetch trending terms");
  }

  const data = await response.json();

  if (data.header?.code !== "0000") {
    throw new Error(data.header?.message || "Failed to fetch trending terms");
  }

  return data.body?.searchList || [];
};

/**
 * Get default/initial stickers (trending or popular)
 *
 * @param apiKey - Stipop API Key
 * @param userId - Unique user identifier
 * @param lang - Language code
 * @param countryCode - Country code
 * @param limit - Number of stickers to fetch
 * @returns Promise with default sticker list
 */
export const getDefaultStickers = async (
  apiKey: string,
  userId: string,
  lang: string = "en",
  countryCode: string = "US",
  limit: number = 30,
): Promise<Sticker[]> => {
  // Use common search terms for default stickers
  const defaultKeywords = ["love", "hello", "happy", "cute", "funny"];
  const randomKeyword =
    defaultKeywords[Math.floor(Math.random() * defaultKeywords.length)];

  try {
    const response = await searchStickers(apiKey, {
      userId,
      q: randomKeyword,
      lang,
      countryCode,
      limit,
      pageNumber: 1,
    });
    return response.body.stickerList;
  } catch (error) {
    console.error("Error fetching default stickers:", error);
    return [];
  }
};

/**
 * Get Profile Sticker Packages from Profile API
 *
 * @param apiKey - Stipop API Key
 * @param userId - Unique user identifier
 * @param limit - Number of packages to fetch
 * @param pageNumber - Page number for pagination
 * @returns Promise with profile sticker packages
 */
export const getMyProfileStickers = async (
  apiKey: string,
  userId: string,
  limit: number = 30,
  pageNumber: number = 1,
): Promise<Sticker[]> => {
  const queryParams = new URLSearchParams({
    userId,
    limit: limit.toString(),
    pageNumber: pageNumber.toString(),
  });

  const url = `${STIPOP_PROFILE_BASE_URL}/v1/package?${queryParams.toString()}`;

  // Profile API uses HTTP Basic Auth - API key as username, empty password
  const basicAuth = base64Encode(`${apiKey}:`);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error?.header?.message || "Failed to fetch profile stickers",
    );
  }

  const data = await response.json();

  if (data.header?.code !== "0000") {
    throw new Error(data.header?.message || "Failed to fetch profile stickers");
  }

  // Transform profilePackageList to Sticker format
  const packages = data.body?.profilePackageList || [];
  return packages.map((pkg: any) => ({
    stickerId: pkg.packageId,
    keyword: pkg.packageName,
    packageName: pkg.category,
    stickerImg: pkg.packageImg,
  }));
};

/**
 * Get Profile Sticker Package Details (individual stickers in a package)
 *
 * @param apiKey - Stipop API Key
 * @param userId - Unique user identifier
 * @param packageId - Package ID to get stickers from
 * @returns Promise with stickers from the specified package
 */
export const getProfileStickerPackageInfo = async (
  apiKey: string,
  userId: string,
  packageId: string,
): Promise<Sticker[]> => {
  const queryParams = new URLSearchParams({
    userId,
  });

  const url = `${STIPOP_PROFILE_BASE_URL}/v1/package/${packageId}?${queryParams.toString()}`;

  // Profile API uses HTTP Basic Auth - API key as username, empty password
  const basicAuth = base64Encode(`${apiKey}:`);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error?.header?.message || "Failed to fetch profile sticker package info",
    );
  }

  const data = await response.json();

  if (data.header?.code !== "0000") {
    throw new Error(
      data.header?.message || "Failed to fetch profile sticker package info",
    );
  }

  // Transform stickerList to Sticker format
  const stickers = data.body?.stickerList || [];
  return stickers.map((s: any) => ({
    stickerId: s.stickerId,
    keyword: s.keyword,
    packageName: s.packageName,
    stickerImg: s.stickerImg,
  }));
};

/**
 * Search stickers using Profile API
 *
 * @param apiKey - Stipop API Key
 * @param params - Search parameters
 * @returns Promise with sticker search results from Profile API
 */
export const searchProfileStickers = async (
  apiKey: string,
  params: StickerSearchParams,
): Promise<StickerSearchResponse> => {
  const {
    userId,
    q,
    lang = "en",
    countryCode = "US",
    limit = 20,
    pageNumber = 1,
  } = params;

  const queryParams = new URLSearchParams({
    userId,
    q,
    lang,
    countryCode,
    limit: limit.toString(),
    pageNumber: pageNumber.toString(),
  });

  const url = `${STIPOP_PROFILE_BASE_URL}/v1/search?${queryParams.toString()}`;

  // Profile API uses HTTP Basic Auth - API key as username, empty password
  const basicAuth = base64Encode(`${apiKey}:`);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error?.header?.message || "Failed to search profile stickers",
    );
  }

  const data: StickerSearchResponse = await response.json();

  if (data.header.code !== "0000") {
    throw new Error(data.header.message || "Profile sticker search failed");
  }

  return data;
};
