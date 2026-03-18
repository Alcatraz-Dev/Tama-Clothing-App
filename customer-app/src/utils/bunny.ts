import { File, Directory, Paths } from "expo-file-system";
import { BUNNY_CONFIG } from "../config/api";

/**
 * Uploads a file using XMLHttpRequest
 */
const uploadWithXHR = (
  uri: string,
  uploadUrl: string,
  contentType: string,
): Promise<{ status: number; body: string }> => {
  return new Promise(async (resolve, reject) => {
    try {
      const file = new File(uri);
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("AccessKey", BUNNY_CONFIG.storageAccessKey);
      xhr.setRequestHeader("Content-Type", contentType);

      xhr.onload = () => {
        resolve({
          status: xhr.status,
          body: xhr.responseText || "",
        });
      };

      xhr.onerror = () => {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      };

      xhr.send(bytes);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Copy file to cache directory for persistence
 */
const persistFileBeforeUpload = async (uri: string): Promise<string> => {
  const cacheDir = Paths.cache;
  if (!cacheDir) return uri;

  const fileName = `upload-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const fileExtension = uri.split(".").pop()?.toLowerCase() || "jpg";
  const destUri = `${cacheDir.uri}${fileName}.${fileExtension}`;

  try {
    const sourceFile = new File(uri);
    await sourceFile.copy(destUri as any);
    return destUri;
  } catch (error) {
    console.log("File copy failed, using original:", error);
    return uri;
  }
};

/**
 * Get content type based on file extension
 */
const getContentType = (extension: string): string => {
  const types: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    heic: "image/jpeg",
    heif: "image/jpeg",
    mp4: "video/mp4",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
    webm: "video/webm",
    // Audio formats
    m4a: "audio/mp4",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    aac: "audio/aac",
    "3gp": "video/3gpp",
  };
  return types[extension.toLowerCase()] || "application/octet-stream";
};

/**
 * Uploads a file (image or video) to Bunny.net Storage
 */
const uploadFileToBunnyStorage = async (uri: string) => {
  // Step 1: Ensure file is in a persistent location
  const persistedUri = await persistFileBeforeUpload(uri);

  // Step 2: Get file info
  const fileExtension = persistedUri.split(".").pop()?.toLowerCase() || "bin";

  // Step 3: Convert HEIC/HEIF to JPG if needed
  let finalUri = persistedUri;
  if (["heic", "heif"].includes(fileExtension)) {
    const cacheDir = Paths.cache;
    if (cacheDir) {
      const jpegUri = `${cacheDir.uri}upload-${Date.now()}.jpg`;
      try {
        const sourceFile = new File(persistedUri);
        await sourceFile.copy(jpegUri as any);
        finalUri = jpegUri;
      } catch (error) {
        console.log("HEIC copy failed, trying original:", error);
        finalUri = persistedUri;
      }
    }
  }

  const isVideo = ["mp4", "mov", "avi", "mkv", "webm", "3gp"].includes(
    fileExtension,
  );
  const isAudio = ["m4a", "mp3", "wav", "aac"].includes(fileExtension);
  const folder = isVideo ? "videos" : isAudio ? "audio" : "images";

  const uploadExtension = finalUri.endsWith(".jpg") ? "jpg" : fileExtension;
  const fileName = `upload-${Date.now()}-${Math.random().toString(36).substring(7)}.${uploadExtension}`;

  const uploadUrl = `${BUNNY_CONFIG.storageEndpoint}/${BUNNY_CONFIG.storageZoneName}/${folder}/${fileName}`;

  try {
    const response = await uploadWithXHR(
      finalUri,
      uploadUrl,
      getContentType(uploadExtension),
    );

    if (response.status === 201 || response.status === 200) {
      const baseUrl = BUNNY_CONFIG.pullZoneUrl.endsWith("/")
        ? BUNNY_CONFIG.pullZoneUrl.slice(0, -1)
        : BUNNY_CONFIG.pullZoneUrl;
      return `${baseUrl}/${folder}/${fileName}`;
    }

    let errorMessage = "Bunny.net Storage upload failed";
    try {
      const data = JSON.parse(response.body);
      errorMessage = data.Message || data.message || errorMessage;
    } catch (e) {
      errorMessage = response.body || errorMessage;
    }

    throw new Error(`${errorMessage} (Status: ${response.status})`);
  } catch (error: any) {
    if (!error.message?.includes("Status:")) {
      console.log("First upload attempt failed, retrying:", error);

      const retryUri = await persistFileBeforeUpload(uri);
      const retryExtension = retryUri.split(".").pop()?.toLowerCase() || "jpg";
      const retryIsVideo = ["mp4", "mov", "avi", "mkv", "webm", "3gp"].includes(
        retryExtension,
      );
      const retryIsAudio = ["m4a", "mp3", "wav", "aac"].includes(
        retryExtension,
      );
      const retryFolder = retryIsVideo
        ? "videos"
        : retryIsAudio
          ? "audio"
          : "images";
      const retryFileName = `upload-${Date.now()}-retry.${retryExtension}`;
      const retryUrl = `${BUNNY_CONFIG.storageEndpoint}/${BUNNY_CONFIG.storageZoneName}/${retryFolder}/${retryFileName}`;

      const retryResponse = await uploadWithXHR(
        retryUri,
        retryUrl,
        getContentType(retryExtension),
      );

      if (retryResponse.status === 201 || retryResponse.status === 200) {
        const baseUrl = BUNNY_CONFIG.pullZoneUrl.endsWith("/")
          ? BUNNY_CONFIG.pullZoneUrl.slice(0, -1)
          : BUNNY_CONFIG.pullZoneUrl;
        return `${baseUrl}/${retryFolder}/${retryFileName}`;
      }
    }
    throw error;
  }
};

/**
 * Uploads a video to Bunny.net Stream
 */
const uploadVideoToBunnyStream = async (uri: string) => {
  const persistedUri = await persistFileBeforeUpload(uri);

  try {
    const createResponse = await fetch(
      `https://video.bunnycdn.com/library/${BUNNY_CONFIG.videoLibraryId}/videos`,
      {
        method: "POST",
        headers: {
          AccessKey: BUNNY_CONFIG.videoApiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          title: `Upload ${new Date().toISOString()}`,
        }),
      },
    );

    const videoData = await createResponse.json();
    if (!videoData.guid)
      throw new Error("Failed to create video entry in Bunny Stream");

    const videoId = videoData.guid;
    const uploadUrl = `https://video.bunnycdn.com/library/${BUNNY_CONFIG.videoLibraryId}/videos/${videoId}`;

    const fileExtension = uri.split(".").pop()?.toLowerCase() || "mp4";
    const uploadResponse = await uploadWithXHR(
      persistedUri,
      uploadUrl,
      getContentType(fileExtension),
    );

    if (uploadResponse.status === 200 || uploadResponse.status === 201) {
      return `https://${BUNNY_CONFIG.videoCdnHostname}/${videoId}/playlist.m3u8`;
    }

    throw new Error(`Video upload failed with status ${uploadResponse.status}`);
  } catch (error) {
    console.error("Bunny Stream upload error:", error);
    throw error;
  }
};

/**
 * Main dispatcher for Bunny.net uploads.
 */
export const uploadToBunny = async (uri: string) => {
  if (!uri || uri.startsWith("http")) return uri;

  try {
    return await uploadFileToBunnyStorage(uri);
  } catch (error) {
    console.error("Bunny upload error:", error);
    throw error;
  }
};

export {
  uploadFileToBunnyStorage as uploadImageToBunny,
  uploadVideoToBunnyStream as uploadVideoToBunny,
};
