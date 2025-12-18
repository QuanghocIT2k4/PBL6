import api from '../common/api';

/**
 * ================================================
 * ADMIN DISPUTE SERVICE - API CALLS
 * ================================================
 * Handles all dispute-related API requests for admins
 */

/**
 * Get list of all disputes
 * @param {object} params - Query params (status, disputeType, page, size)
 * @returns {Promise} List of disputes
 */
export const getAdminDisputes = async (params = {}) => {
  try {
    const { status, disputeType, page = 0, size = 10 } = params;

    const response = await api.get('/api/v1/admin/disputes', {
      params: {
        ...(status && { status }),
        ...(disputeType && { disputeType }),
        page,
        size,
      },
    });

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error fetching admin disputes:', error);
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
export const getAdminDisputeDetail = async (disputeId) => {
  try {
    const response = await api.get(`/api/v1/admin/disputes/${disputeId}`);

    return {
      success: true,
      data: response.data.data || response.data,
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
 * Resolve dispute (for RETURN_REJECTION type)
 * @param {string} disputeId - Dispute ID
 * @param {object} data - Decision data (decision: APPROVE_RETURN | REJECT_RETURN, reason)
 * @returns {Promise} Resolved dispute
 */
export const resolveDispute = async (disputeId, data) => {
  try {
    // API yêu cầu reason thay vì adminNote
    const payload = {
      decision: data.decision,
      reason: data.reason || data.adminNote || '',
    };
    const response = await api.put(`/api/v1/admin/disputes/${disputeId}/resolve`, payload);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error resolving dispute:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể giải quyết khiếu nại',
    };
  }
};

/**
 * Resolve quality dispute (for RETURN_QUALITY type)
 * @param {string} disputeId - Dispute ID
 * @param {object} data - Decision data (decision: APPROVE_STORE | REJECT_STORE, reason)
 * @returns {Promise} Resolved dispute
 */
export const resolveQualityDispute = async (disputeId, data) => {
  try {
    // API yêu cầu reason thay vì adminNote
    const payload = {
      decision: data.decision,
      reason: data.reason || data.adminNote || '',
    };
    const response = await api.put(`/api/v1/admin/disputes/${disputeId}/resolve-quality`, payload);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error resolving quality dispute:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể giải quyết khiếu nại chất lượng',
    };
  }
};

/**
 * Add message to dispute (Admin)
 * @param {string} disputeId - Dispute ID
 * @param {object} data - Message data (content only - Admin API không hỗ trợ file đính kèm)
 * @returns {Promise} Updated dispute
 */
export const addAdminDisputeMessage = async (disputeId, data) => {
  try {
    // Admin API chỉ nhận JSON body với content, không hỗ trợ file đính kèm
    const response = await api.post(`/api/v1/admin/disputes/${disputeId}/message`, {
      content: data.content,
    });

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error adding admin dispute message:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể thêm tin nhắn',
    };
  }
};


