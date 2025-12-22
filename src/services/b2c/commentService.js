import api from '../common/api';

/**
 * ================================================
 * B2C COMMENT SERVICE - API CALLS
 * ================================================
 * Service để gọi API bình luận sản phẩm cho store owners
 */

/**
 * Create a new store comment
 * @param {string} storeId - Store ID
 * @param {object} commentData - Comment data
 * @param {string} commentData.productVariantId - Product variant ID
 * @param {string} commentData.content - Comment content
 * @param {string} commentData.parentCommentId - Parent comment ID (optional, for replies)
 * @param {File[]} commentData.images - Optional images for the comment (max 5)
 * @returns {Promise} Created comment
 */
export const createStoreComment = async (storeId, commentData) => {
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
    
    // Append images if provided (max 5)
    if (commentData.images && commentData.images.length > 0) {
      const imagesToAdd = commentData.images.slice(0, 5); // Limit to 5 images
      imagesToAdd.forEach((image) => {
        formData.append('images', image);
      });
    }
    
    const response = await api.post(`/api/v1/b2c/comments/store/${storeId}`, formData);
    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Bình luận đã được thêm',
    };
  } catch (error) {
    console.error('Error creating store comment:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || 'Không thể thêm bình luận',
    };
  }
};

/**
 * Get store comments (all comments created by this store)
 * @param {string} storeId - Store ID
 * @returns {Promise} List of store's comments
 */
export const getStoreComments = async (storeId) => {
  try {
    const response = await api.get(`/api/v1/b2c/comments/store/${storeId}/my-comments`);
    return {
      success: true,
      data: response.data.data || response.data || [],
    };
  } catch (error) {
    console.error('Error fetching store comments:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || 'Không thể lấy bình luận',
      data: [],
    };
  }
};

/**
 * Update an existing store comment
 * @param {string} storeId - Store ID
 * @param {string} commentId - Comment ID
 * @param {object} commentData - Updated comment data
 * @param {string} commentData.content - Updated content
 * @param {File[]} commentData.images - Optional images for the comment (max 5)
 * @returns {Promise} Updated comment
 */
export const updateStoreComment = async (storeId, commentId, commentData) => {
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
    
    // Append images if provided (max 5)
    if (commentData.images && commentData.images.length > 0) {
      const imagesToAdd = commentData.images.slice(0, 5); // Limit to 5 images
      imagesToAdd.forEach((image) => {
        formData.append('images', image);
      });
    }
    
    const response = await api.put(`/api/v1/b2c/comments/store/${storeId}/comment/${commentId}`, formData);
    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Bình luận đã được cập nhật',
    };
  } catch (error) {
    console.error('Error updating store comment:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || 'Không thể cập nhật bình luận',
    };
  }
};

/**
 * Delete a store comment
 * @param {string} storeId - Store ID
 * @param {string} commentId - Comment ID
 * @returns {Promise} Success status
 */
export const deleteStoreComment = async (storeId, commentId) => {
  try {
    const response = await api.delete(`/api/v1/b2c/comments/store/${storeId}/comment/${commentId}`);
    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Bình luận đã được xóa',
    };
  } catch (error) {
    console.error('Error deleting store comment:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || 'Không thể xóa bình luận',
    };
  }
};

export default {
  createStoreComment,
  getStoreComments,
  updateStoreComment,
  deleteStoreComment,
};




