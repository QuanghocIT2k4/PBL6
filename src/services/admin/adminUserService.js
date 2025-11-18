import api from '../common/api';

/**
 * ================================================
 * ADMIN USER SERVICE - QUẢN LÝ NGƯỜI DÙNG (ADMIN)
 * ================================================
 */

/**
 * 1. LẤY DANH SÁCH NGƯỜI DÙNG (với filters)
 * GET /api/v1/admin/users
 */
export const getAllUsers = async (params = {}) => {
  try {
    const {
      page = 0,
      size = 20,
      sortBy = 'createdAt',
      sortDir = 'desc',
      role = null,
      status = null,
    } = params;

    const response = await api.get('/api/v1/admin/users', {
      params: { page, size, sortBy, sortDir, role, status },
    });

    // Debug: Log raw response
    console.log('Raw API response:', response.data);
    console.log('Response data structure:', response.data.data);
    console.log('Response content:', response.data.data?.content);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể tải danh sách người dùng',
    };
  }
};

/**
 * 2. BAN USER
 * POST /api/v1/admin/users/ban
 */
export const banUser = async (banData) => {
  try {
    const response = await api.post('/api/v1/admin/users/ban', banData);

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Ban người dùng thành công',
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể ban người dùng',
    };
  }
};

/**
 * 3. UNBAN USER
 * DELETE /api/v1/admin/users/unban/{userId}
 */
export const unbanUser = async (userId) => {
  try {
    const response = await api.delete(`/api/v1/admin/users/unban/${userId}`);

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Gỡ ban người dùng thành công',
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể gỡ ban người dùng',
    };
  }
};

/**
 * 4. KIỂM TRA TRẠNG THÁI BAN
 * GET /api/v1/admin/users/{userId}/ban-status
 */
export const checkBanStatus = async (userId) => {
  try {
    const response = await api.get(`/api/v1/admin/users/${userId}/ban-status`);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể kiểm tra trạng thái ban',
    };
  }
};

export default {
  getAllUsers,
  banUser,
  unbanUser,
  checkBanStatus,
};







