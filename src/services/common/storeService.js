import api from './api';

/**
 * ================================================
 * STORE SERVICE - B2C STORES API
 * ================================================
 * API endpoints for managing B2C stores (cửa hàng B2C)
 * 
 * ✅ Uses centralized api.js for:
 * - Consistent baseURL configuration
 * - Automatic JWT token attachment
 * - Unified error handling & retry logic
 */

/**
 * 1. GET /api/v1/stores - Lấy danh sách tất cả stores
 * Query params: page, size, sortBy, sortDir
 */
export const getAllStores = async (params = {}) => {
  try {
    const {
      page = 0,
      size = 20,
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = params;

    const response = await api.get('/api/v1/stores', {
      params: {
        page,
        size,
        sortBy,
        sortDir,
      },
    });

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Không thể lấy danh sách cửa hàng',
      };
    }
  } catch (error) {
    console.error('❌ Error fetching stores:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Lỗi khi lấy danh sách cửa hàng',
    };
  }
};

/**
 * 2. GET /api/v1/stores/{storeId} - Lấy chi tiết 1 store
 */
export const getStoreById = async (storeId) => {
  try {
    const response = await api.get(`/api/v1/stores/${storeId}`);

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Không tìm thấy cửa hàng',
      };
    }
  } catch (error) {
    console.error('❌ Error fetching store detail:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Lỗi khi lấy thông tin cửa hàng',
    };
  }
};

/**
 * 3. GET /api/v1/stores/owner/{ownerId} - Lấy stores của 1 owner
 */
export const getStoresByOwnerId = async (ownerId, params = {}) => {
  try {
    const {
      page = 0,
      size = 20,
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = params;

    const response = await api.get(`/api/v1/stores/owner/${ownerId}`, {
      params: {
        page,
        size,
        sortBy,
        sortDir,
      },
    });

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Không tìm thấy cửa hàng của người dùng này',
      };
    }
  } catch (error) {
    console.error('❌ Error fetching owner stores:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Lỗi khi lấy danh sách cửa hàng',
    };
  }
};

/**
 * ================================================
 * EXPORT DEFAULT
 * ================================================
 */
export const storeService = {
  getAllStores,
  getStoreById,
  getStoresByOwnerId,
};

export default storeService;

