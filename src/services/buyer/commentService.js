import api from '../common/api';

/**
 * ================================================
 * BUYER COMMENT SERVICE - API CALLS
 * ================================================
 * Service để gọi API bình luận sản phẩm cho buyer
 */

/**
 * Create a new product comment
 * @param {object} commentData - Comment data
 * @param {string} commentData.productVariantId - Product variant ID
 * @param {string} commentData.content - Comment content
 * @param {string} commentData.parentCommentId - Parent comment ID (optional, for replies)
 * @param {File[]} commentData.images - Optional images for the comment
 * @returns {Promise} Created comment
 */
export const createComment = async (commentData) => {
  try {
    const formData = new FormData();
    
    // ✅ Backend mong đợi field 'comment' là JSON Blob với Content-Type application/json
    const commentJson = {
      productVariantId: commentData.productVariantId,
      content: commentData.content,
      ...(commentData.parentCommentId && { parentCommentId: commentData.parentCommentId }),
    };
    
    const commentBlob = new Blob([JSON.stringify(commentJson)], {
      type: 'application/json',
    });
    formData.append('comment', commentBlob);
    
    // Append images if provided
    if (commentData.images && commentData.images.length > 0) {
      commentData.images.forEach((image) => {
        formData.append('images', image);
      });
    }
    
    const response = await api.post('/api/v1/buyer/comments', formData);
    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Bình luận đã được thêm',
    };
  } catch (error) {
    console.error('Error creating comment:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || 'Không thể thêm bình luận',
    };
  }
};

/**
 * Get my comments (all comments created by current user)
 * @returns {Promise} List of user's comments
 */
export const getMyComments = async () => {
  try {
    const response = await api.get('/api/v1/buyer/comments/my-comments');
    return {
      success: true,
      data: response.data.data || response.data || [],
    };
  } catch (error) {
    console.error('Error fetching my comments:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || 'Không thể lấy bình luận',
      data: [],
    };
  }
};

/**
 * Update an existing comment
 * @param {string} commentId - Comment ID
 * @param {object} commentData - Updated comment data
 * @param {string} commentData.content - Updated content
 * @param {File[]} commentData.images - Optional images for the comment
 * @returns {Promise} Updated comment
 */
export const updateComment = async (commentId, commentData) => {
  try {
    const formData = new FormData();
    
    // ✅ Backend mong đợi field 'comment' là JSON Blob với Content-Type application/json
    const commentJson = {
      content: commentData.content,
    };
    
    const commentBlob = new Blob([JSON.stringify(commentJson)], {
      type: 'application/json',
    });
    formData.append('comment', commentBlob);
    
    // Append images if provided
    if (commentData.images && commentData.images.length > 0) {
      commentData.images.forEach((image) => {
        formData.append('images', image);
      });
    }
    
    const response = await api.put(`/api/v1/buyer/comments/${commentId}`, formData);
    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Bình luận đã được cập nhật',
    };
  } catch (error) {
    console.error('Error updating comment:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || 'Không thể cập nhật bình luận',
    };
  }
};

/**
 * Delete a comment
 * @param {string} commentId - Comment ID
 * @returns {Promise} Success status
 */
export const deleteComment = async (commentId) => {
  try {
    const response = await api.delete(`/api/v1/buyer/comments/${commentId}`);
    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Bình luận đã được xóa',
    };
  } catch (error) {
    console.error('Error deleting comment:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || 'Không thể xóa bình luận',
    };
  }
};

/**
 * Get comments by product variant (public API)
 * @param {string} productVariantId - Product variant ID
 * @param {object} options - Query options
 * @param {number} options.page - Page number (0-based)
 * @param {number} options.size - Page size
 * @param {string} options.sortBy - Sort field
 * @param {string} options.sortDir - Sort direction (asc, desc)
 * @returns {Promise} Paginated list of comments
 */
export const getCommentsByProductVariant = async (productVariantId, options = {}) => {
  try {
    const { page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc' } = options;
    const response = await api.get(`/api/v1/comments/product-variant/${productVariantId}`, {
      params: { page, size, sortBy, sortDir },
    });
    return {
      success: true,
      data: response.data.data || response.data || {},
    };
  } catch (error) {
    console.error('Error fetching comments by product variant:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || 'Không thể lấy bình luận',
      data: { content: [], totalElements: 0 },
    };
  }
};

/**
 * Get comment by ID (public API)
 * @param {string} commentId - Comment ID
 * @returns {Promise} Comment details
 */
export const getCommentById = async (commentId) => {
  try {
    const response = await api.get(`/api/v1/comments/${commentId}`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error fetching comment by ID:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || 'Không thể lấy bình luận',
    };
  }
};

/**
 * Get replies by comment (public API)
 * @param {string} commentId - Comment ID
 * @returns {Promise} List of replies
 */
export const getRepliesByComment = async (commentId) => {
  try {
    const response = await api.get(`/api/v1/comments/${commentId}/replies`);
    return {
      success: true,
      data: response.data.data || response.data || [],
    };
  } catch (error) {
    console.error('Error fetching replies:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || 'Không thể lấy phản hồi',
      data: [],
    };
  }
};

/**
 * Get product comment statistics (public API)
 * @param {string} productVariantId - Product variant ID
 * @returns {Promise} Comment statistics
 */
export const getProductCommentStats = async (productVariantId) => {
  try {
    const response = await api.get(`/api/v1/comments/product-variant/${productVariantId}/statistics`);
    return {
      success: true,
      data: response.data.data || response.data || {},
    };
  } catch (error) {
    console.error('Error fetching comment statistics:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || 'Không thể lấy thống kê',
      data: {},
    };
  }
};

export default {
  createComment,
  getMyComments,
  updateComment,
  deleteComment,
  getCommentsByProductVariant,
  getCommentById,
  getRepliesByComment,
  getProductCommentStats,
};
