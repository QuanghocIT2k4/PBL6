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

export default {
  getPendingStores,
  getApprovedStores,
  approveStore,
  rejectStore,
  updateStoreStatus,
  softDeleteStore,
};







