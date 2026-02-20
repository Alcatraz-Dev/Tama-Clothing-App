import { CLOUDINARY_CONFIG } from '../config/api';

export const uploadImageToCloudinary = async (uri: string) => {
  if (!uri || uri.startsWith('http')) return uri;

  const fileType = uri.split('.').pop()?.toLowerCase();
  const isVideo = ['mp4', 'mov', 'avi', 'mkv'].includes(fileType || '');
  const resourceType = isVideo ? 'video' : 'image';

  try {
    const formData = new FormData();
    // @ts-ignore - React Native FormData require uri, type, name
    formData.append('file', {
      uri: uri,
      type: isVideo ? 'video/mp4' : 'image/jpeg',
      name: isVideo ? 'upload.mp4' : 'upload.jpg',
    });
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/${resourceType}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url;
    }
    throw new Error(data.error?.message || 'Cloudinary upload failed');
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

export const uploadToCloudinary = uploadImageToCloudinary;
