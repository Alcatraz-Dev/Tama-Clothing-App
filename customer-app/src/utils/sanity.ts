import { createClient } from "@sanity/client";
import { SANITY_CONFIG } from "../config/api";

// NOTE: For uploads, you typically need an editor token.
// Since one wasn't provided, we'll try to use it without if possible (only if the dataset is public and has allow-write, which is rare)
// OR the user will provide one later.
const SANITY_TOKEN = process.env.EXPO_PUBLIC_SANITY_TOKEN; // FILL THIS WITH YOUR SANITY WRITE TOKEN

export const sanityClient = createClient({
  projectId: SANITY_CONFIG.projectId,
  dataset: SANITY_CONFIG.dataset,
  apiVersion: SANITY_CONFIG.apiVersion,
  useCdn: false,
  token: SANITY_TOKEN,
  ignoreBrowserTokenWarning: true,
});

/**
 * Uploads a file (image or video) to Sanity
 */
export const uploadToSanity = async (uri: string) => {
  if (!uri || uri.includes("cdn.sanity.io") || uri.includes("b-cdn.net")) return uri;

  try {
    // Determine asset type
    const extension = uri.split(".").pop()?.toLowerCase() || "";
    const isVideo = ["mp4", "mov", "avi", "mkv", "webm", "3gp"].includes(
      extension,
    );
    const assetType = isVideo ? "file" : "image";

    // Read file
    const response = await fetch(uri);
    const blob = await response.blob();

    // Upload to Sanity
    const asset = await sanityClient.assets.upload(assetType, blob, {
      filename: `upload-${Date.now()}.${extension}`,
      contentType: blob.type,
    });

    // Return the URL
    return asset.url;
  } catch (error) {
    console.error("Sanity upload error:", error);
    throw error;
  }
};

export const uploadImageToSanity = async (uri: string) => {
  return uploadToSanity(uri);
};

export const uploadVideoToSanity = async (uri: string) => {
  return uploadToSanity(uri);
};
