/**
 * ================================================
 * IMAGE UTILITIES
 * ================================================
 * Helper functions for handling image URLs
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://technova-d3gferhtgdaaaedh.eastasia-01.azurewebsites.net';

/**
 * Convert relative image path to full URL
 * @param {string} imagePath - Image path (can be relative or absolute)
 * @returns {string} Full image URL
 */
export const getFullImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If already full URL (starts with http/https), return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If relative path, prepend base URL
  if (imagePath.startsWith('/')) {
    return `${API_BASE_URL}${imagePath}`;
  }
  
  // If path doesn't start with /, add it
  return `${API_BASE_URL}/${imagePath}`;
};

/**
 * Check if a string is a valid image URL
 * @param {string} url - URL to check
 * @returns {boolean} True if valid URL
 */
export const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
};

/**
 * Get placeholder image for category
 * @param {string} category - Product category
 * @returns {string} Placeholder image URL
 */
export const getProductGallery = (productId, category) => {
  // Return placeholder based on category
  const placeholders = {
    smartphone: 'https://via.placeholder.com/600x600?text=Phone',
    laptop: 'https://via.placeholder.com/600x600?text=Laptop',
    audio: 'https://via.placeholder.com/600x600?text=Audio',
    camera: 'https://via.placeholder.com/600x600?text=Camera',
    tv: 'https://via.placeholder.com/600x600?text=TV',
    pc: 'https://via.placeholder.com/600x600?text=PC',
  };
  
  return [placeholders[category] || 'https://via.placeholder.com/600x600?text=Product'];
};

export default {
  getFullImageUrl,
  isValidImageUrl,
  getProductGallery,
};
