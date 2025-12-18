import api from '../common/api';

/**
 * ================================================
 * ADMIN REFUND SERVICE - API CALLS
 * ================================================
 * Quản lý các yêu cầu hoàn tiền cho Admin.
 *
 * Backend endpoints (theo Swagger1612):
 * - GET  /api/v1/admin/refunds                      : danh sách yêu cầu hoàn tiền
 * - GET  /api/v1/admin/refunds/{id}                : chi tiết 1 yêu cầu hoàn tiền
 * - POST /api/v1/admin/refunds/process             : duyệt / từ chối hoàn tiền
 * - GET  /api/v1/admin/refunds/statistics          : thống kê theo trạng thái
 */

/**
 * Lấy danh sách yêu cầu hoàn tiền
 * @param {object} params - { status?: 'PENDING'|'COMPLETED'|'REJECTED', page?: number, size?: number }
 */
export const getAdminRefunds = async (params = {}) => {
  try {
    const { status, page = 0, size = 10 } = params;

    const response = await api.get('/api/v1/admin/refunds', {
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
    console.error('Error fetching admin refunds:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tải danh sách yêu cầu hoàn tiền',
    };
  }
};

/**
 * Lấy chi tiết 1 yêu cầu hoàn tiền
 * @param {string} refundRequestId
 */
export const getAdminRefundDetail = async (refundRequestId) => {
  try {
    const response = await api.get(`/api/v1/admin/refunds/${refundRequestId}`);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error fetching refund request detail:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tải chi tiết yêu cầu hoàn tiền',
    };
  }
};

/**
 * Xử lý yêu cầu hoàn tiền
 * @param {object} data - { refundRequestId, action: 'APPROVE'|'REJECT', refundTransactionId?, adminNote?, rejectionReason? }
 */
export const processRefundRequest = async (data) => {
  try {
    const payload = {
      refundRequestId: data.refundRequestId,
      action: data.action,
      refundTransactionId: data.refundTransactionId || null,
      adminNote: data.adminNote || null,
      rejectionReason: data.rejectionReason || null,
    };

    const response = await api.post('/api/v1/admin/refunds/process', payload);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error processing refund request:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể xử lý yêu cầu hoàn tiền',
    };
  }
};

/**
 * Lấy thống kê số lượng yêu cầu hoàn tiền theo trạng thái
 * Response tuỳ backend, nhưng thường dạng:
 * { PENDING: number, COMPLETED: number, REJECTED: number, TOTAL: number }
 */
export const getRefundStatistics = async () => {
  try {
    const response = await api.get('/api/v1/admin/refunds/statistics');

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error fetching refund statistics:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tải thống kê hoàn tiền',
    };
  }
};

export default {
  getAdminRefunds,
  getAdminRefundDetail,
  processRefundRequest,
  getRefundStatistics,
};


