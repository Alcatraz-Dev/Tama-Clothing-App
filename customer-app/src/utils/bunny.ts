import * as FileSystem from 'expo-file-system/legacy';
import { BUNNY_CONFIG } from '../config/api';

/**
 * Uploads a file (image or video) to Bunny.net Storage
 */
const uploadFileToBunnyStorage = async (uri: string) => {
    // Extract file extension and name
    const fileExtension = uri.split('.').pop()?.toLowerCase() || 'bin';
    const isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(fileExtension);
    const folder = isVideo ? 'videos' : 'images';
    const fileName = `upload-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

    // Bunny.net Storage API URL format: https://storage.bunnycdn.com/storageZoneName/path/fileName
    // We add the folder name to organize files
    const uploadUrl = `${BUNNY_CONFIG.storageEndpoint}/${BUNNY_CONFIG.storageZoneName}/${folder}/${fileName}`;

    const response = await FileSystem.uploadAsync(uploadUrl, uri, {
        httpMethod: 'PUT',
        headers: {
            'AccessKey': BUNNY_CONFIG.storageAccessKey,
            'Content-Type': 'application/octet-stream',
        },
    });

    if (response.status === 201 || response.status === 200) {
        // Return the public CDN URL from the Pull Zone including the folder path
        const baseUrl = BUNNY_CONFIG.pullZoneUrl.endsWith('/')
            ? BUNNY_CONFIG.pullZoneUrl.slice(0, -1)
            : BUNNY_CONFIG.pullZoneUrl;
        return `${baseUrl}/${folder}/${fileName}`;
    }

    let errorMessage = 'Bunny.net Storage upload failed';
    try {
        const data = JSON.parse(response.body);
        errorMessage = data.Message || data.message || errorMessage;
    } catch (e) {
        errorMessage = response.body || errorMessage;
    }

    throw new Error(`${errorMessage} (Status: ${response.status})`);
};

/**
 * Uploads a video specifically to Bunny.net Stream (for HLS/Adaptive streaming)
 * Note: Use this only if you want transcoding and adaptive bitrate.
 */
const uploadVideoToBunnyStream = async (uri: string) => {
    try {
        // 1. Create a video entry
        const createResponse = await fetch(`https://video.bunnycdn.com/library/${BUNNY_CONFIG.videoLibraryId}/videos`, {
            method: 'POST',
            headers: {
                'AccessKey': BUNNY_CONFIG.videoApiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                title: `Upload ${new Date().toISOString()}`
            })
        });

        const videoData = await createResponse.json();
        if (!videoData.guid) throw new Error('Failed to create video entry in Bunny Stream');

        const videoId = videoData.guid;
        const uploadUrl = `https://video.bunnycdn.com/library/${BUNNY_CONFIG.videoLibraryId}/videos/${videoId}`;

        const uploadResponse = await FileSystem.uploadAsync(uploadUrl, uri, {
            httpMethod: 'PUT',
            headers: { 'AccessKey': BUNNY_CONFIG.videoApiKey },
        });

        if (uploadResponse.status === 200 || uploadResponse.status === 201) {
            return `https://${BUNNY_CONFIG.videoCdnHostname}/${videoId}/playlist.m3u8`;
        }

        throw new Error(`Video upload failed with status ${uploadResponse.status}`);
    } catch (error) {
        console.error('Bunny Stream upload error:', error);
        throw error;
    }
};

/**
 * Main dispatcher for Bunny.net uploads.
 * Now defaults to Storage for both images and videos as requested.
 */
export const uploadToBunny = async (uri: string) => {
    if (!uri || uri.startsWith('http')) return uri;

    // By default, we now use Storage for everything (same as images)
    // This provides a direct file URL which is easier to manage.
    return await uploadFileToBunnyStorage(uri);
};

export { uploadFileToBunnyStorage as uploadImageToBunny, uploadVideoToBunnyStream as uploadVideoToBunny };

