import api from '../common/api';

/**
 * ================================================
 * REVIEW SERVICE - API CALLS
 * ================================================
 * Handles all review-related API requests
 */

// =====================================
// PUBLIC REVIEW APIs (Anyone can view)
// =====================================

// ❌ REMOVED: getReviewById() - API không tồn tại trong Swagger
// ❌ REMOVED: getProductReviews() - API không tồn tại, chỉ có product-variant reviews

/**
 * Get all reviews for a product variant
 * @param {string} productVariantId - Product Variant ID
 * @param {object} params - Query params (page, size, sortBy, rating, hasImages)
 * @returns {Promise} List of reviews
 */
export const getProductVariantReviews = async (productVariantId, params = {}) => {
  try {
    const {
      page = 0,
      size = 10,
      sortBy = 'createdAt',
      sortDir = 'desc',
      rating = null,
      hasImages = null,
    } = params;

    const response = await api.get(`/api/v1/reviews/product-variant/${productVariantId}`, {
      params: {
        page,
        size,
        sortBy,
        sortDir,
        ...(rating && { rating }),
        ...(hasImages !== null && { hasImages }),
      },
    });

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error('Error fetching product variant reviews:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get review statistics for a product variant
 * @param {string} productVariantId - Product Variant ID
 * @returns {Promise} Review statistics (average rating, rating distribution)
 */
export const getProductVariantReviewStats = async (productVariantId) => {
  try {
    const response = await api.get(`/api/v1/reviews/product-variant/${productVariantId}/stats`);
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error('Error fetching review stats:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get all reviews written by current user
 * @param {object} params - Query params (page, size)
 * @returns {Promise} List of user's reviews
 */
// ❌ REMOVED: getMyReviews() - Wrong endpoint /api/v1/reviews/my-reviews
// ✅ Use getBuyerReviews() below with correct endpoint /api/v1/buyer/reviews/my-reviews

// =====================================
// BUYER REVIEW APIs (Require authentication)
// =====================================

/**
 * Create a new review
 * @param {object} reviewData - Review data
 * @param {string} reviewData.productVariantId - Product Variant ID
 * @param {string} reviewData.orderId - Order ID
 * @param {number} reviewData.rating - Rating (1-5)
 * @param {string} reviewData.comment - Review comment (optional)
 * @param {string[]} reviewData.images - Image URLs (optional)
 * @returns {Promise} Created review
 */
export const createReview = async (reviewData) => {
  try {
    const response = await api.post('/api/v1/buyer/reviews', reviewData);
    return {
      success: true,
      data: response.data.data,
      message: 'Đánh giá của bạn đã được gửi thành công!',
    };
  } catch (error) {
    console.error('Error creating review:', error);
    // Extract error message from API response
    const errorMessage = error?.response?.data?.error || 
                         error?.response?.data?.message || 
                         error?.message || 
                         'Không thể gửi đánh giá. Vui lòng kiểm tra lại thông tin.';
    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Update an existing review
 * @param {string} reviewId - Review ID
 * @param {object} reviewData - Updated review data
 * @param {number} reviewData.rating - Rating (1-5)
 * @param {string} reviewData.comment - Review comment
 * @param {string[]} reviewData.images - Image URLs
 * @returns {Promise} Updated review
 */
export const updateReview = async (reviewId, reviewData) => {
  try {
    const response = await api.put(`/api/v1/buyer/reviews/${reviewId}`, reviewData);
    return {
      success: true,
      data: response.data.data,
      message: 'Đánh giá đã được cập nhật!',
    };
  } catch (error) {
    console.error('Error updating review:', error);
    return {
      success: false,
      error: error.message || 'Không thể cập nhật đánh giá',
    };
  }
};

/**
 * Delete a review
 * @param {string} reviewId - Review ID
 * @returns {Promise} Success status
 */
export const deleteReview = async (reviewId) => {
  try {
    await api.delete(`/api/v1/buyer/reviews/${reviewId}`);
    return {
      success: true,
      message: 'Đánh giá đã được xóa!',
    };
  } catch (error) {
    console.error('Error deleting review:', error);
    return {
      success: false,
      error: error.message || 'Không thể xóa đánh giá',
    };
  }
};

/**
 * Get all reviews written by current user (buyer endpoint)
 * @param {object} params - Query params (page, size)
 * @returns {Promise} List of user's reviews
 */
export const getBuyerReviews = async (params = {}) => {
  try {
    const {
      page = 0,
      size = 20,
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = params;

    const response = await api.get('/api/v1/buyer/reviews/my-reviews', {
      params: {
        page,
        size,
        sortBy,
        sortDir,
      },
    });

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error('Error fetching buyer reviews:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// =====================================
// HELPER FUNCTIONS
// =====================================

/**
 * Check if user can review a product (has purchased and order is delivered)
 * @param {string} productVariantId - Product Variant ID
 * @param {string} orderId - Order ID
 * @returns {Promise} Can review status
 */
export const canReviewProduct = async (productVariantId, orderId) => {
  try {
    // This would typically be checked via order status
    // For now, we'll assume if user has orderId, they can review
    return {
      success: true,
      canReview: true,
    };
  } catch (error) {
    return {
      success: false,
      canReview: false,
    };
  }
};

export default {
  // Public APIs (✅ Validated with Swagger)
  getProductVariantReviews,
  getProductVariantReviewStats,
  
  // Buyer APIs (✅ Validated with Swagger)
  createReview,
  updateReview,
  deleteReview,
  getBuyerReviews,
  
  // Helpers
  canReviewProduct,
};
