import { uploadToSanity, uploadImageToSanity, uploadVideoToSanity } from "./sanity";

/**
 * DEPRECATED: This file originally handled Bunny.net uploads.
 * It has been redirected to Sanity per user request.
 * All existing calls to uploadToBunny, uploadImageToBunny, and uploadVideoToBunny
 * will now upload assets to Sanity (Project ID: 93i3skro).
 */

export const uploadToBunny = async (uri: string) => {
  console.log("Redirecting Bunny upload to Sanity:", uri);
  return uploadToSanity(uri);
};

export const uploadImageToBunny = async (uri: string) => {
  return uploadImageToSanity(uri);
};

export const uploadVideoToBunny = async (uri: string) => {
  return uploadVideoToSanity(uri);
};
