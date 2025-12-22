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
    console.log('📝 [ReviewService] ===== CREATE REVIEW START =====');
    console.log('📝 [ReviewService] Review data received:', reviewData);
    console.log('📝 [ReviewService] Rating:', reviewData?.rating);
    console.log('📝 [ReviewService] Comment:', reviewData?.comment);
    console.log('📝 [ReviewService] ProductVariantId:', reviewData?.productVariantId);
    console.log('📝 [ReviewService] OrderId:', reviewData?.orderId);
    console.log('📝 [ReviewService] ImageFiles count:', reviewData?.imageFiles?.length || 0);

    // Guard tối thiểu
    if (!reviewData?.rating || reviewData.rating < 1 || reviewData.rating > 5) {
      console.error('❌ [ReviewService] Invalid rating:', reviewData?.rating);
      return { success: false, error: 'Vui lòng chọn số sao (1-5).' };
    }
    if (!reviewData?.productVariantId) {
      console.error('❌ [ReviewService] Missing productVariantId');
      return { success: false, error: 'Thiếu productVariantId.' };
    }
    if (!reviewData?.orderId) {
      console.error('❌ [ReviewService] Missing orderId');
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
    
    console.log('📝 [ReviewService] Review JSON to send:', JSON.stringify(reviewJson, null, 2));
    
    // ✅ Gửi review như Blob với Content-Type application/json (giống createProductVariant và createStore)
    // Swagger UI hiển thị review là object, nhưng trong multipart/form-data cần gửi như Blob
    const reviewBlob = new Blob([JSON.stringify(reviewJson)], { type: 'application/json' });
    formData.append('review', reviewBlob, 'review.json'); // đặt filename để tránh bị hiểu thành octet-stream
    console.log('📝 [ReviewService] Review Blob created:', {
      size: reviewBlob.size,
      type: reviewBlob.type
    });
    
    // ✅ Append images nếu có
    if (reviewData.imageFiles && reviewData.imageFiles.length > 0) {
      console.log('📷 [ReviewService] Appending', reviewData.imageFiles.length, 'images');
      reviewData.imageFiles.forEach((file, index) => {
        formData.append('images', file);
        console.log(`📷 [ReviewService] Image ${index + 1}:`, {
          name: file.name,
          type: file.type,
          size: file.size
        });
      });
    }
    
    // ✅ Debug: Log FormData contents
    console.log('📦 [ReviewService] FormData entries:');
    for (let pair of formData.entries()) {
      if (pair[1] instanceof File) {
        console.log(`  - ${pair[0]}: File(${pair[1].name}, ${pair[1].type}, ${pair[1].size} bytes)`);
      } else if (pair[1] instanceof Blob) {
        console.log(`  - ${pair[0]}: Blob(${pair[1].type}, ${pair[1].size} bytes)`);
      } else {
        console.log(`  - ${pair[0]}: ${pair[1]}`);
      }
    }
    
    console.log('🚀 [ReviewService] Sending POST request to /api/v1/buyer/reviews');
    console.log('🚀 [ReviewService] Request URL:', '/api/v1/buyer/reviews');
    console.log('🚀 [ReviewService] FormData ready, sending...');
    
    // ✅ Không cần set Content-Type, interceptor sẽ tự xử lý FormData (xóa Content-Type để browser tự set với boundary)
    const response = await api.post('/api/v1/buyer/reviews', formData);
    
    console.log('✅ [ReviewService] Response received:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    console.log('✅ [ReviewService] Response data:', JSON.stringify(response.data, null, 2));
    
    return {
      success: true,
      data: response.data.data,
      message: 'Đánh giá của bạn đã được gửi thành công!',
    };
  } catch (error) {
    console.error('❌ [ReviewService] ===== CREATE REVIEW ERROR =====');
    console.error('❌ [ReviewService] Error object:', error);
    console.error('❌ [ReviewService] Error message:', error?.message);
    console.error('❌ [ReviewService] Error response:', error?.response);
    console.error('❌ [ReviewService] Error response data:', error?.response?.data);
    console.error('❌ [ReviewService] Error response status:', error?.response?.status);
    console.error('❌ [ReviewService] Error response statusText:', error?.response?.statusText);
    console.error('❌ [ReviewService] Error response headers:', error?.response?.headers);
    console.error('❌ [ReviewService] Full error response:', JSON.stringify(error?.response?.data, null, 2));
    
    // Extract error message from API response
    const errorMessage = error?.response?.data?.error || 
                         error?.response?.data?.message || 
                         error?.response?.data?.detail ||
                         error?.response?.data?.title ||
                         error?.message || 
                         'Không thể gửi đánh giá. Vui lòng kiểm tra lại thông tin.';
    
    console.error('❌ [ReviewService] Extracted error message:', errorMessage);
    
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
    console.log('📝 [ReviewService] Updating review with data:', reviewData);
    
    // ✅ PUT review dùng multipart/form-data (theo Swagger) - giống như createReview
    // Swagger hiển thị review là object với Content-Type application/json trong multipart
    const formData = new FormData();
    
    // ✅ Backend Spring Boot mong đợi field 'review' là JSON Blob với Content-Type application/json
    const reviewJson = {
      rating: reviewData.rating,
      comment: reviewData.comment || '',
    };
    
    console.log('📝 [ReviewService] Review JSON:', reviewJson);
    
    // ✅ Gửi review như Blob với Content-Type application/json
    const reviewBlob = new Blob([JSON.stringify(reviewJson)], { type: 'application/json' });
    formData.append('review', reviewBlob, 'review.json');
    
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
    const response = await api.put(`/api/v1/buyer/reviews/${reviewId}`, formData);
    
    return {
      success: true,
      data: response.data.data,
      message: 'Đánh giá đã được cập nhật!',
    };
  } catch (error) {
    console.error('❌ Error updating review:', error);
    console.error('❌ Error response:', error?.response?.data);
    console.error('❌ Error status:', error?.response?.status);
    
    // Extract error message from API response
    const errorMessage = error?.response?.data?.error || 
                         error?.response?.data?.message || 
                         error?.response?.data?.detail ||
                         error?.message || 
                         'Không thể cập nhật đánh giá. Vui lòng kiểm tra lại thông tin.';
    return {
      success: false,
      error: errorMessage,
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
