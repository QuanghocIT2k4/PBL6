import api from '../common/api';

/**
 * ================================================
 * ADMIN SHIPPER SERVICE - QUẢN LÝ SHIPPER (ADMIN)
 * ================================================
 * APIs for admin to manage shipper accounts
 */

/**
 * 1. LẤY DANH SÁCH SHIPPER
 * GET /api/v1/admin/shipper
 */
export const getAllShippers = async (params = {}) => {
  try {
    const {
      page = 0,
      size = 20,
      sortBy = 'createdAt',
      sortDir = 'desc',
      name = null,
      email = null,
      phone = null,
      status = null,
    } = params;

    const response = await api.get('/api/v1/admin/shipper', {
      params: {
        page,
        size,
        sortBy,
        sortDir,
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(status && { status }),
      },
    });

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ [getAllShippers] Error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không thể tải danh sách shipper',
    };
  }
};

/**
 * 2. LẤY CHI TIẾT SHIPPER
 * GET /api/v1/admin/shipper/{shipperId}
 */
export const getShipperById = async (shipperId) => {
  try {
    const response = await api.get(`/api/v1/admin/shipper/${shipperId}`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ [getShipperById] Error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không thể tải thông tin shipper',
    };
  }
};

/**
 * 3. TẠO TÀI KHOẢN SHIPPER
 * POST /api/v1/admin/shipper
 * Body: multipart/form-data với dto (JSON) và avatar (file)
 */
export const createShipper = async (shipperData, avatarFile = null) => {
  try {
    const formData = new FormData();
    
    // ✅ Gửi dto như Blob với Content-Type application/json
    const dtoBlob = new Blob([JSON.stringify(shipperData)], { type: 'application/json' });
    formData.append('dto', dtoBlob, 'dto.json');
    
    // ✅ Append avatar nếu có
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }
    
    const response = await api.post('/api/v1/admin/shipper', formData);
    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Tạo tài khoản shipper thành công!',
    };
  } catch (error) {
    console.error('❌ [createShipper] Error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không thể tạo tài khoản shipper',
    };
  }
};

/**
 * 4. CẬP NHẬT THÔNG TIN SHIPPER
 * PUT /api/v1/admin/shipper/shipper/{shipperId}
 */
export const updateShipperInfo = async (shipperId, updateData) => {
  try {
    const response = await api.put(`/api/v1/admin/shipper/shipper/${shipperId}`, updateData);
    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Cập nhật thông tin shipper thành công!',
    };
  } catch (error) {
    console.error('❌ [updateShipperInfo] Error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không thể cập nhật thông tin shipper',
    };
  }
};

/**
 * 5. KÍCH HOẠT TÀI KHOẢN SHIPPER
 * PUT /api/v1/admin/shipper/{shipperId}/activate
 */
export const activateShipper = async (shipperId) => {
  try {
    const response = await api.put(`/api/v1/admin/shipper/${shipperId}/activate`);
    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Kích hoạt tài khoản shipper thành công!',
    };
  } catch (error) {
    console.error('❌ [activateShipper] Error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không thể kích hoạt tài khoản shipper',
    };
  }
};

/**
 * 6. RESET MẬT KHẨU SHIPPER
 * POST /api/v1/admin/shipper/{shipperId}/reset-password
 */
export const resetShipperPassword = async (shipperId) => {
  try {
    const response = await api.post(`/api/v1/admin/shipper/${shipperId}/reset-password`);
    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Reset mật khẩu thành công!',
    };
  } catch (error) {
    console.error('❌ [resetShipperPassword] Error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không thể reset mật khẩu',
    };
  }
};

/**
 * 7. LẤY THỐNG KÊ SHIPPER
 * GET /api/v1/admin/shipper/statistics
 */
export const getShipperStatistics = async () => {
  try {
    const response = await api.get('/api/v1/admin/shipper/statistics');
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ [getShipperStatistics] Error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không thể tải thống kê shipper',
    };
  }
};

export default {
  getAllShippers,
  getShipperById,
  createShipper,
  updateShipperInfo,
  activateShipper,
  resetShipperPassword,
  getShipperStatistics,
};






