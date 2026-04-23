import { createClient } from "@sanity/client";
import { SANITY_CONFIG } from "../config/api";
import { Buffer } from 'buffer';

// NOTE: For uploads, you typically need an editor token.
const SANITY_TOKEN = process.env.EXPO_PUBLIC_SANITY_TOKEN;

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
  if (!uri) return null;
  if (uri.includes("cdn.sanity.io") || uri.includes("b-cdn.net")) return uri;

  try {
    // Ensure URI has file:// prefix if it's a local path and doesn't have it
    let fileUri = uri;
    if (!fileUri.startsWith('file://') && !fileUri.startsWith('http')) {
      fileUri = `file://${fileUri}`;
    }

    // Determine asset type
    const extension = fileUri.split(".").pop()?.toLowerCase() || "jpg";
    const isFile = ["mp4", "mov", "avi", "mkv", "webm", "3gp", "m4a", "wav", "mp3", "amr"].includes(
      extension,
    );
    const assetType = isFile ? "file" : "image";

    console.log(`Uploading ${assetType} to Sanity: ${fileUri}`);

    // Read file using fetch (most reliable way in RN to get a blob from local URI)
    const response = await fetch(fileUri);
    const blob = await response.blob();
    
    // Convert blob to arrayBuffer then to Buffer
    // This is safer than using File class which might have issues in some Expo versions
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
    });
    const buffer = Buffer.from(arrayBuffer);

    // Get proper content type
    let contentType = isFile 
      ? (["m4a", "wav", "mp3", "amr"].includes(extension) ? `audio/${extension}` : `video/${extension}`)
      : `image/${extension === "jpg" ? "jpeg" : extension}`;
    
    // Upload to Sanity
    const asset = await sanityClient.assets.upload(assetType, buffer, {
      filename: `upload-${Date.now()}.${extension}`,
      contentType: contentType,
    });

    // Return the URL
    console.log("Sanity upload successful:", asset.url);
    return asset.url;
  } catch (error) {
    console.error("Sanity upload error details:", error);
    throw error;
  }
};

export const uploadImageToSanity = async (uri: string) => {
  return uploadToSanity(uri);
};

export const uploadVideoToSanity = async (uri: string) => {
  return uploadToSanity(uri);
};
