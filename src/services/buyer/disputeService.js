import api from '../common/api';

/**
 * ================================================
 * DISPUTE SERVICE - API CALLS
 * ================================================
 * Handles all dispute-related API requests for buyers
 */

/**
 * Get list of disputes
 * @param {object} params - Query params (page, size)
 * @returns {Promise} List of disputes
 */
export const getMyDisputes = async (params = {}) => {
  try {
    const { page = 0, size = 10 } = params;

    const response = await api.get('/api/v1/buyer/orders/disputes', {
      params: {
        page,
        size,
      },
    });

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error fetching disputes:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tải danh sách khiếu nại',
    };
  }
};

/**
 * Get dispute detail
 * @param {string} disputeId - Dispute ID
 * @returns {Promise} Dispute detail
 */
export const getDisputeDetail = async (disputeId) => {
  try {
    // Vì không có API GET chi tiết riêng, ta sẽ lấy từ list và filter theo ID
    // Hoặc có thể dùng admin API nếu có permission
    const response = await api.get('/api/v1/buyer/orders/disputes', {
      params: {
        page: 0,
        size: 1000, // Lấy tất cả để tìm dispute
      },
    });

    const disputes = response.data.data?.content || response.data.data || [];
    const dispute = disputes.find((d) => (d.id || d._id) === disputeId);

    if (!dispute) {
      return {
        success: false,
        error: 'Không tìm thấy khiếu nại',
      };
    }

    return {
      success: true,
      data: dispute,
    };
  } catch (error) {
    console.error('Error fetching dispute detail:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tải chi tiết khiếu nại',
    };
  }
};

/**
 * Add message to dispute
 * @param {string} disputeId - Dispute ID
 * @param {object} data - Message data (content, attachmentFiles)
 * @returns {Promise} Updated dispute
 */
export const addDisputeMessage = async (disputeId, data) => {
  try {
    const formData = new FormData();
    formData.append('content', data.content);
    
    if (data.attachmentFiles && Array.isArray(data.attachmentFiles)) {
      data.attachmentFiles.forEach((file) => {
        formData.append('attachmentFiles', file);
      });
    }

    const response = await api.post(`/api/v1/buyer/orders/disputes/${disputeId}/message`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error adding dispute message:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể thêm tin nhắn',
    };
  }
};


