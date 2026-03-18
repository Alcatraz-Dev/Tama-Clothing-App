/**
 * Stipop Sticker Search Service
 *
 * Provides sticker search functionality using the Stipop API.
 * API Documentation: https://messenger.stipop.io/v1/search
 */

const STIPOP_BASE_URL = "https://messenger.stipop.io";

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

  const url = `${STIPOP_BASE_URL}/v1/search?${queryParams.toString()}`;

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

  const url = `${STIPOP_BASE_URL}/v1/sticker/recent?${queryParams.toString()}`;

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

  const url = `${STIPOP_BASE_URL}/v1/sticker/trending?${queryParams.toString()}`;

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

  const url = `${STIPOP_BASE_URL}/v1/search/trending?${queryParams.toString()}`;

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
