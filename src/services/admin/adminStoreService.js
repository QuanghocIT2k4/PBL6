import api from '../common/api';

/**
 * ================================================
 * ADMIN STORE SERVICE - QUẢN LÝ CỬA HÀNG (ADMIN)
 * ================================================
 */

/**
 * 1. LẤY DANH SÁCH CỬA HÀNG CHỜ DUYỆT
 * GET /api/v1/admin/stores/pending
 */
export const getPendingStores = async (params = {}) => {
  try {
    const {
      page = 0,
      size = 20,
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = params;

    const response = await api.get('/api/v1/admin/stores/pending', {
      params: { page, size, sortBy, sortDir },
    });

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể tải danh sách cửa hàng chờ duyệt',
    };
  }
};

/**
 * 2. LẤY DANH SÁCH CỬA HÀNG ĐÃ DUYỆT
 * GET /api/v1/admin/stores/approved
 */
export const getApprovedStores = async (params = {}) => {
  try {
    const {
      page = 0,
      size = 20,
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = params;

    const response = await api.get('/api/v1/admin/stores/approved', {
      params: { page, size, sortBy, sortDir },
    });

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể tải danh sách cửa hàng đã duyệt',
    };
  }
};

/**
 * 3. DUYỆT CỬA HÀNG
 * PUT /api/v1/admin/stores/{storeId}/approve
 */
export const approveStore = async (storeId) => {
  try {
    const response = await api.put(`/api/v1/admin/stores/${storeId}/approve`);

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Duyệt cửa hàng thành công',
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể duyệt cửa hàng',
    };
  }
};

/**
 * 4. TỪ CHỐI CỬA HÀNG
 * PUT /api/v1/admin/stores/{storeId}/reject
 */
export const rejectStore = async (storeId, reason) => {
  try {
    const response = await api.put(`/api/v1/admin/stores/${storeId}/reject`, null, {
      params: { reason },
    });

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Từ chối cửa hàng thành công',
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể từ chối cửa hàng',
    };
  }
};

/**
 * 5. CẬP NHẬT TRẠNG THÁI CỬA HÀNG
 * PUT /api/v1/admin/stores/{storeId}/status
 */
export const updateStoreStatus = async (storeId, status) => {
  try {
    const response = await api.put(`/api/v1/admin/stores/${storeId}/status`, null, {
      params: { status },
    });

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Cập nhật trạng thái cửa hàng thành công',
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể cập nhật trạng thái',
    };
  }
};

/**
 * 6. XÓA MỀM CỬA HÀNG
 * DELETE /api/v1/admin/stores/{storeId}
 */
export const softDeleteStore = async (storeId) => {
  try {
    const response = await api.delete(`/api/v1/admin/stores/${storeId}`);

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Xóa cửa hàng thành công',
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể xóa cửa hàng',
    };
  }
};

/**
 * 7. BAN CỬA HÀNG
 * PUT /api/v1/admin/stores/{storeId}/ban
 * 
 * Ban một cửa hàng và tự động hủy tất cả các đơn hàng đang ở trạng thái PENDING của cửa hàng đó.
 * Cửa hàng sẽ không thể thực hiện các thao tác sau khi bị ban:
 * - Xác nhận đơn hàng mới (confirm Order)
 * - Tạo/cập nhật sản phẩm (product, variant)
 * - Tạo khuyến mãi mới của shop (promotions)
 * - Tạo yêu cầu rút tiền (withdrawal)
 * - Cập nhật thông tin shop (logo, banner, địa chỉ,...)
 * 
 * Cửa hàng vẫn có thể:
 * - Xem đơn hàng, thống kê
 * - Xử lý đơn hàng đang giao
 * - Xử lý yêu cầu trả hàng
 * - Xem ví
 * - Chat với khách hàng
 * 
 * @param {string} storeId - ID của cửa hàng cần ban
 * @param {string} reason - Lý do ban cửa hàng (bắt buộc)
 * @returns {Promise} Kết quả ban cửa hàng
 */
export const banStore = async (storeId, reason) => {
  try {
    if (!reason || !reason.trim()) {
      return {
        success: false,
        error: 'Lý do ban cửa hàng là bắt buộc',
      };
    }

    const response = await api.put(`/api/v1/admin/stores/${storeId}/ban`, null, {
      params: { reason: reason.trim() },
    });

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Ban cửa hàng thành công. Tất cả đơn hàng PENDING đã được hủy tự động.',
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể ban cửa hàng',
    };
  }
};

/**
 * 8. UNBAN CỬA HÀNG
 * PUT /api/v1/admin/stores/{storeId}/unban
 * 
 * Gỡ ban cho một cửa hàng đã bị ban trước đó, khôi phục trạng thái về APPROVED.
 * Sau khi unban, cửa hàng có thể thực hiện lại tất cả các chức năng bình thường.
 * 
 * @param {string} storeId - ID của cửa hàng cần unban
 * @returns {Promise} Kết quả unban cửa hàng
 */
export const unbanStore = async (storeId) => {
  try {
    const response = await api.put(`/api/v1/admin/stores/${storeId}/unban`);

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Gỡ ban cửa hàng thành công',
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể gỡ ban cửa hàng',
    };
  }
};

/**
 * 9. RESET VIOLATION WARNING COUNT (TESTING ONLY)
 * PUT /api/v1/admin/stores/{storeId}/reset-warning
 * 
 * Reset số lần cảnh báo vi phạm về 0 cho cửa hàng.
 * CHỈ DÙNG CHO MỤC ĐÍCH TESTING!
 * 
 * @param {string} storeId - ID của cửa hàng cần reset warning
 * @returns {Promise} Kết quả reset warning
 */
/**
 * Increment store warning count
 * PUT /api/v1/admin/stores/{storeId}/increment-warning
 * 
 * Tăng số lần cảnh báo vi phạm cho cửa hàng.
 * 
 * @param {string} storeId - ID của cửa hàng
 * @param {string} reason - Lý do cảnh báo
 * @returns {Promise} Kết quả increment warning
 */
export const incrementStoreWarning = async (storeId, reason = '') => {
  try {
    const response = await api.put(`/api/v1/admin/stores/${storeId}/increment-warning`, {
      reason: reason || 'Giao hàng lỗi (có return request) dù thắng khiếu nại chất lượng'
    });

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Đã cộng 1 cảnh báo cho cửa hàng',
    };
  } catch (error) {
    // Nếu API chưa tồn tại, chỉ log warning (backend sẽ tự động xử lý)
    console.warn('API increment-warning chưa tồn tại, backend sẽ tự động xử lý:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Backend sẽ tự động xử lý cảnh báo',
    };
  }
};

export const resetStoreWarning = async (storeId) => {
  try {
    const response = await api.put(`/api/v1/admin/stores/${storeId}/reset-warning`);

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Reset số lần cảnh báo thành công',
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể reset số lần cảnh báo',
    };
  }
};

export default {
  getPendingStores,
  getApprovedStores,
  approveStore,
  rejectStore,
  updateStoreStatus,
  softDeleteStore,
  banStore,
  unbanStore,
  incrementStoreWarning,
  resetStoreWarning,
};







