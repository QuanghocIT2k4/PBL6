import api from '../common/api';

/**
 * ================================================
 * ADMIN ORDER SERVICE - API CALLS
 * ================================================
 * Quản lý đơn hàng cho Admin
 */

/**
 * Lấy chi tiết đơn hàng (Admin có thể xem bất kỳ đơn nào)
 * @param {string} orderId - Order ID
 * @returns {Promise} Order details
 */
export const getAdminOrderById = async (orderId) => {
  try {
    const response = await api.get(`/api/v1/admin/orders/${orderId}`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error fetching admin order:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tải chi tiết đơn hàng',
    };
  }
};

export default {
  getAdminOrderById,
};




