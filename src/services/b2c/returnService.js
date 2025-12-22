import api from '../common/api';

/**
 * ================================================
 * B2C RETURN SERVICE - API CALLS
 * ================================================
 * Handles all return request-related API requests for stores
 */

/**
 * Get list of return requests for store
 * @param {string} storeId - Store ID
 * @param {object} params - Query params (status, page, size)
 * @returns {Promise} List of return requests
 */
export const getStoreReturnRequests = async (storeId, params = {}) => {
  try {
    const { status, page = 0, size = 10 } = params;

    const response = await api.get(`/api/v1/b2c/returns/store/${storeId}`, {
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
    console.error('Error fetching store return requests:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tải danh sách yêu cầu trả hàng',
    };
  }
};

/**
 * Get return request detail
 * @param {string} storeId - Store ID
 * @param {string} returnRequestId - Return request ID
 * @returns {Promise} Return request detail
 */
export const getStoreReturnRequestDetail = async (storeId, returnRequestId) => {
  try {
    const response = await api.get(
      `/api/v1/b2c/returns/store/${storeId}/returnRequest/${returnRequestId}`
    );

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
 * Respond to return request (approve or reject)
 * @param {string} storeId - Store ID
 * @param {string} returnRequestId - Return request ID
 * @param {object} data - Response data (approved, storeResponse, evidenceFiles)
 * @returns {Promise} Updated return request
 */
export const respondToReturnRequest = async (storeId, returnRequestId, data) => {
  try {
    const formData = new FormData();

    // DTO theo swagger: part "dto" là bắt buộc
    // Swagger ReturnResponseDTO có field "reason" (không phải storeResponse)
    // Khi từ chối (approved = false), reason là bắt buộc
    const dto = {
      approved: data.approved,
      reason: data.storeResponse || data.reason || (data.approved ? null : ''),
    };

    // Gửi dto dạng JSON trong part "dto"
    formData.append(
      'dto',
      new Blob([JSON.stringify(dto)], {
        type: 'application/json',
      })
    );
    
    if (data.evidenceFiles && Array.isArray(data.evidenceFiles)) {
      data.evidenceFiles.forEach((file) => {
        formData.append('evidenceFiles', file);
      });
    }

    const response = await api.put(
      `/api/v1/b2c/returns/store/${storeId}/returnRequest/${returnRequestId}/respond`,
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
    console.error('Error responding to return request:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể phản hồi yêu cầu trả hàng',
    };
  }
};

/**
 * Confirm returned goods are OK
 * 
 * ⚠️ LƯU Ý LOGIC CẢNH BÁO:
 * - Khi store chấp nhận trả hàng (xác nhận hàng OK) → Backend PHẢI cộng 1 cảnh báo NGAY LẬP TỨC
 * - Bất kể sau đó store có khiếu nại chất lượng và thắng hay không
 * - Backend cần xử lý: Tăng returnWarningCount lên 1 khi API này được gọi
 * 
 * @param {string} storeId - Store ID
 * @param {string} returnRequestId - Return request ID
 * @returns {Promise} Updated return request
 */
export const confirmReturnOK = async (storeId, returnRequestId) => {
  try {
    const response = await api.put(
      `/api/v1/b2c/returns/store/${storeId}/returnRequest/${returnRequestId}/confirm-ok`
    );

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error confirming return OK:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể xác nhận hàng trả về',
    };
  }
};

/**
 * Dispute quality of returned goods
 * @param {string} storeId - Store ID
 * @param {string} returnRequestId - Return request ID
 * @param {object} data - Dispute data (reason, description, evidenceFiles)
 * @returns {Promise} Dispute object
 */
export const disputeQuality = async (storeId, returnRequestId, data) => {
  try {
    const formData = new FormData();
    formData.append('reason', data.reason);
    if (data.description) formData.append('description', data.description);
    
    if (data.evidenceFiles && Array.isArray(data.evidenceFiles)) {
      data.evidenceFiles.forEach((file) => {
        formData.append('evidenceFiles', file);
      });
    }

    const response = await api.post(
      `/api/v1/b2c/returns/store/${storeId}/returnRequest/${returnRequestId}/dispute-quality`,
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
    console.error('Error disputing quality:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tạo khiếu nại chất lượng',
    };
  }
};

/**
 * Add message to dispute (Store)
 * @param {string} storeId - Store ID
 * @param {string} disputeId - Dispute ID
 * @param {object} data - Message data (content, attachmentFiles)
 * @returns {Promise} Updated dispute
 */
export const addStoreDisputeMessage = async (storeId, disputeId, data) => {
  try {
    const formData = new FormData();
    formData.append('content', data.content);
    
    if (data.attachmentFiles && Array.isArray(data.attachmentFiles)) {
      data.attachmentFiles.forEach((file) => {
        formData.append('attachmentFiles', file);
      });
    }

    const response = await api.post(
      `/api/v1/b2c/returns/store/${storeId}/disputes/${disputeId}/message`,
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
    console.error('Error adding store dispute message:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể thêm tin nhắn',
    };
  }
};

/**
 * Get list of disputes for store
 * @param {string} storeId - Store ID
 * @param {object} params - Query params (page, size)
 * @returns {Promise} List of disputes
 */
export const getStoreDisputes = async (storeId, params = {}) => {
  try {
    const { page = 0, size = 10 } = params;

    const response = await api.get(`/api/v1/b2c/returns/store/${storeId}/disputes`, {
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
    console.error('Error fetching store disputes:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tải danh sách khiếu nại',
    };
  }
};

/**
 * Get dispute detail for store
 * @param {string} storeId - Store ID
 * @param {string} disputeId - Dispute ID
 * @returns {Promise} Dispute detail
 */
export const getStoreDisputeDetail = async (storeId, disputeId) => {
  try {
    // Vì không có API GET chi tiết riêng, ta sẽ lấy từ list và filter theo ID
    const response = await api.get(`/api/v1/b2c/returns/store/${storeId}/disputes`, {
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
    console.error('Error fetching store dispute detail:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tải chi tiết khiếu nại',
    };
  }
};

/**
 * Đếm số lượng yêu cầu trả hàng theo trạng thái cho store
 * GET /api/v1/b2c/returns/store/{storeId}/count-by-status
 */
export const getReturnRequestCounts = async (storeId) => {
  try {
    if (!storeId) {
      throw new Error('storeId là bắt buộc');
    }

    const response = await api.get(
      `/api/v1/b2c/returns/store/${storeId}/count-by-status`
    );

    const data = response.data?.data ?? response.data;

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Error fetching return request counts:', error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        'Không thể tải thống kê yêu cầu trả hàng',
    };
  }
};


