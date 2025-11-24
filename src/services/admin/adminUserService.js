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
      userName = null,
      userEmail = null,
      userPhone = null,
    } = params;

    const response = await api.get('/api/v1/admin/users', {
      params: { page, size, sortBy, sortDir, userName, userEmail, userPhone },
    });

    // 🔍 DEBUG: Log FULL raw response
    console.log('🔍 ========== RAW API RESPONSE ==========');
    console.log('🔍 Full response:', response);
    console.log('🔍 response.data:', response.data);
    console.log('🔍 response.data.data:', response.data.data);
    console.log('🔍 response.data.data.content:', response.data.data?.content);
    
    if (response.data.data?.content && response.data.data.content.length > 0) {
      console.log('🔍 First user:', response.data.data.content[0]);
      console.log('🔍 First user fields:', Object.keys(response.data.data.content[0]));
      
      // Tìm user bị ban
      const bannedUser = response.data.data.content.find(u => 
        u.email === 'Ndnquang3072004@gmail.com' || u.banReason
      );
      if (bannedUser) {
        console.log('🔍 ========== BANNED USER FOUND ==========');
        console.log('🔍 Banned user:', JSON.stringify(bannedUser, null, 2));
      }
    }
    console.log('🔍 ========================================');

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
 * POST /api/v1/admin/users/unban/{userId}
 */
export const unbanUser = async (userId) => {
  try {
    const response = await api.post(`/api/v1/admin/users/unban/${userId}`);

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
 * GET /api/v1/admin/users/check-ban/{userId}
 */
export const checkBanStatus = async (userId) => {
  try {
    const response = await api.get(`/api/v1/admin/users/check-ban/${userId}`);

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







