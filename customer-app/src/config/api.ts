export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";



export const SANITY_CONFIG = {
  projectId: process.env.EXPO_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.EXPO_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-03-19", // Use a recent date
  useCdn: false, // Set to false for uploads
};
