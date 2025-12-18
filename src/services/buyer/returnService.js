import api from '../common/api';

/**
 * ================================================
 * RETURN REQUEST SERVICE - API CALLS
 * ================================================
 * Handles all return request-related API requests for buyers
 */

/**
 * Create return request for an order
 * @param {string} orderId - Order ID
 * @param {object} data - Return request data (reason, description, evidenceMedia)
 * @returns {Promise} Return request object
 */
export const createReturnRequest = async (orderId, data) => {
  try {
    const formData = new FormData();
    
    // Query params: reason, description, bank info (cho COD)
    const queryParams = new URLSearchParams();
    queryParams.append('reason', data.reason);
    if (data.description) queryParams.append('description', data.description);
    
    // Bank info for COD refunds (query params, required for COD)
    if (data.bankName) queryParams.append('bankName', data.bankName);
    if (data.bankAccountName) queryParams.append('bankAccountName', data.bankAccountName);
    if (data.bankAccountNumber) queryParams.append('bankAccountNumber', data.bankAccountNumber);
    
    // Append files to FormData (multipart/form-data)
    if (data.evidenceFiles && Array.isArray(data.evidenceFiles)) {
      data.evidenceFiles.forEach((file) => {
        formData.append('evidenceFiles', file);
      });
    }

    // Gửi FormData với query params
    const url = `/api/v1/buyer/orders/${orderId}/return?${queryParams.toString()}`;
    const response = await api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error creating return request:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tạo yêu cầu trả hàng',
    };
  }
};

/**
 * Get list of return requests
 * @param {object} params - Query params (status, page, size)
 * @returns {Promise} List of return requests
 */
export const getMyReturnRequests = async (params = {}) => {
  try {
    const { status, page = 0, size = 10 } = params;

    const response = await api.get('/api/v1/buyer/orders/returns', {
      params: {
        ...(status && { status }),
        page,
        size,
      },
    });

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error fetching return requests:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tải danh sách yêu cầu trả hàng',
    };
  }
};

/**
 * Get return request detail
 * @param {string} returnRequestId - Return request ID
 * @returns {Promise} Return request detail
 */
export const getReturnRequestDetail = async (returnRequestId) => {
  try {
    const response = await api.get(`/api/v1/buyer/orders/returns/${returnRequestId}`);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error fetching return request detail:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tải chi tiết yêu cầu trả hàng',
    };
  }
};

/**
 * Cancel a return request
 * PUT /api/v1/buyer/orders/returns/{returnRequestId}/cancel
 */
export const cancelReturnRequest = async (returnRequestId) => {
  try {
    const response = await api.put(`/api/v1/buyer/orders/returns/${returnRequestId}/cancel`);

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Đã hủy yêu cầu trả hàng',
    };
  } catch (error) {
    console.error('Error cancelling return request:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể hủy yêu cầu trả hàng',
    };
  }
};

/**
 * Create dispute for rejected return request
 * @param {string} returnRequestId - Return request ID
 * @param {object} data - Dispute data (content, attachmentFiles)
 * @returns {Promise} Dispute object
 */
export const createDispute = async (returnRequestId, data) => {
  try {
    const formData = new FormData();
    formData.append('content', data.content);
    
    if (data.attachmentFiles && Array.isArray(data.attachmentFiles)) {
      data.attachmentFiles.forEach((file) => {
        formData.append('attachmentFiles', file);
      });
    }

    const response = await api.post(
      `/api/v1/buyer/orders/returns/${returnRequestId}/dispute`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error creating dispute:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tạo khiếu nại',
    };
  }
};


