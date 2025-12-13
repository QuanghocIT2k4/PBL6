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
 * @param {File[]} reviewData.imageFiles - Image files (optional) - nếu có thì dùng FormData
 * @param {string[]} reviewData.images - Image URLs (optional) - chỉ dùng khi không có imageFiles
 * @returns {Promise} Created review
 */
export const createReview = async (reviewData) => {
  try {
    console.log('📝 [ReviewService] Creating review with data:', reviewData);

    // Guard tối thiểu
    if (!reviewData?.rating || reviewData.rating < 1 || reviewData.rating > 5) {
      return { success: false, error: 'Vui lòng chọn số sao (1-5).' };
    }
    if (!reviewData?.productVariantId) {
      return { success: false, error: 'Thiếu productVariantId.' };
    }
    if (!reviewData?.orderId) {
      return { success: false, error: 'Thiếu orderId.' };
    }
    
    // ✅ API luôn dùng multipart/form-data (theo Swagger) - giống như createProductVariant và createStore
    const formData = new FormData();
    
    // ✅ Backend Spring Boot mong đợi field 'review' là JSON Blob với Content-Type application/json
    const reviewJson = {
      rating: reviewData.rating,
      comment: reviewData.comment || '',
      ...(reviewData.productVariantId && { productVariantId: reviewData.productVariantId }),
      ...(reviewData.orderId && { orderId: reviewData.orderId }),
    };
    
    console.log('📝 [ReviewService] Review JSON:', reviewJson);
    
    // ✅ Gửi review như Blob với Content-Type application/json (giống createProductVariant và createStore)
    // Swagger UI hiển thị review là object, nhưng trong multipart/form-data cần gửi như Blob
    const reviewBlob = new Blob([JSON.stringify(reviewJson)], { type: 'application/json' });
    formData.append('review', reviewBlob, 'review.json'); // đặt filename để tránh bị hiểu thành octet-stream
    
    // ✅ Append images nếu có
    if (reviewData.imageFiles && reviewData.imageFiles.length > 0) {
      console.log('📷 [ReviewService] Appending', reviewData.imageFiles.length, 'images');
      reviewData.imageFiles.forEach((file, index) => {
        formData.append('images', file);
        console.log(`📷 [ReviewService] Image ${index + 1}:`, file.name, file.type, file.size);
      });
    }
    
    // ✅ Debug: Log FormData contents
    console.log('📦 [ReviewService] FormData entries:');
    for (let pair of formData.entries()) {
      console.log('  -', pair[0], ':', pair[1] instanceof File ? `File(${pair[1].name})` : pair[1] instanceof Blob ? `Blob(${pair[1].type})` : pair[1]);
    }
    
    // ✅ Không cần set Content-Type, interceptor sẽ tự xử lý FormData
    const response = await api.post('/api/v1/buyer/reviews', formData);
    
    return {
      success: true,
      data: response.data.data,
      message: 'Đánh giá của bạn đã được gửi thành công!',
    };
  } catch (error) {
    console.error('❌ Error creating review:', error);
    console.error('❌ Error response:', error?.response?.data);
    console.error('❌ Error status:', error?.response?.status);
    console.error('❌ Error headers:', error?.response?.headers);
    
    // Extract error message from API response
    const errorMessage = error?.response?.data?.error || 
                         error?.response?.data?.message || 
                         error?.response?.data?.detail ||
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
 * @param {File[]} reviewData.imageFiles - Image files (optional) - nếu có thì dùng FormData
 * @param {string[]} reviewData.images - Image URLs (optional) - chỉ dùng khi không có imageFiles
 * @returns {Promise} Updated review
 */
export const updateReview = async (reviewId, reviewData) => {
  try {
    let response;
    
    // ✅ PUT review dùng application/json (theo Swagger), không phải multipart/form-data
    // Nếu có ảnh thì cần upload riêng hoặc backend hỗ trợ multipart
    // Hiện tại chỉ gửi JSON
    response = await api.put(`/api/v1/buyer/reviews/${reviewId}`, reviewData);
    
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

/**
 * Check if user has already reviewed a product variant in an order
 * @param {string} productVariantId - Product Variant ID
 * @param {string} orderId - Order ID
 * @returns {Promise} Has reviewed status and existing review if any
 */
export const checkExistingReview = async (productVariantId, orderId) => {
  try {
    // Lấy tất cả reviews của user
    const result = await getBuyerReviews({ page: 0, size: 100 });
    
    if (result.success && result.data) {
      const reviews = result.data.content || result.data || [];
      
      // Tìm review đã tồn tại cho productVariantId + orderId này
      const existingReview = reviews.find(review => 
        (review.productVariantId === productVariantId || review.productVariant?.id === productVariantId) &&
        (review.orderId === orderId || review.order?.id === orderId)
      );
      
      return {
        success: true,
        hasReviewed: !!existingReview,
        existingReview: existingReview || null,
      };
    }
    
    return {
      success: true,
      hasReviewed: false,
      existingReview: null,
    };
  } catch (error) {
    console.error('Error checking existing review:', error);
    return {
      success: false,
      hasReviewed: false,
      existingReview: null,
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
  checkExistingReview,
};
