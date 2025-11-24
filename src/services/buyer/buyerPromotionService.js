import api from '../common/api';

/**
 * ================================================
 * BUYER PROMOTION SERVICE - API CHO BUYER XEM PROMOTIONS
 * ================================================
 * Các API này yêu cầu authentication (Bearer token)
 * 
 * APIs:
 * - GET /api/v1/buyer/promotions/store/{storeId}/available - Lấy promotions của store
 * - GET /api/v1/buyer/promotions/platform/available - Lấy platform promotions
 */

/**
 * ================================================
 * 1. LẤY ACTIVE PROMOTIONS CỦA STORE
 * ================================================
 * GET /api/v1/buyer/promotions/store/{storeId}/available
 * 
 * @param {string} storeId - ID của store
 * @param {Object} params - Query parameters
 * @param {number} params.orderValue - Giá trị đơn hàng để kiểm tra promotions áp dụng được (required)
 * @param {number} params.page - Số trang (default: 0)
 * @param {number} params.size - Số items/trang (default: 10)
 * @param {string} params.sortBy - Trường sắp xếp (default: 'createdAt')
 * @param {string} params.sortDir - Hướng sắp xếp: 'asc' | 'desc' (default: 'desc')
 * 
 * @returns {Promise<Object>} { success: boolean, data: Page<Promotion> | null, error?: string }
 * 
 * @example
 * const result = await getStoreAvailablePromotions('store123', {
 *   orderValue: 500000,
 *   page: 0,
 *   size: 10
 * });
 */
export const getStoreAvailablePromotions = async (storeId, params = {}) => {
  try {
    const {
      orderValue,
      page = 0,
      size = 10,
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = params;

    if (!storeId) {
      return {
        success: false,
        error: 'Store ID is required',
      };
    }

    if (orderValue === undefined || orderValue === null) {
      return {
        success: false,
        error: 'Order value is required',
      };
    }

    const response = await api.get(`/api/v1/buyer/promotions/store/${storeId}/available`, {
      params: {
        orderValue,
        page,
        size,
        sortBy,
        sortDir,
      },
    });
    
    // Backend trả về empty - không log nữa

    // Handle different response structures
    let promotions = [];
    let responseData = null;

    // Case 1: Response has success field and data
    if (response.data?.success !== undefined) {
      if (response.data.success) {
        responseData = response.data.data;
      } else {
        // Backend returned success: false
        // ⚠️ Trả về empty array thay vì error để UI vẫn hiển thị được
        return {
          success: true,
          data: {
            content: [],
            totalElements: 0,
            totalPages: 0
          },
          error: response.data.error || response.data.message
        };
      }
    } 
    // Case 2: Response data is directly the promotions array
    else if (Array.isArray(response.data)) {
      responseData = response.data;
      promotions = response.data;
    }
    // Case 3: Response data is an object with nested data
    else if (response.data?.data !== undefined) {
      responseData = response.data.data;
    }
    // Case 4: Response data is directly the data object (no wrapper)
    else if (response.data && typeof response.data === 'object') {
      responseData = response.data;
    }

    // Extract promotions from responseData
    if (responseData) {
      if (Array.isArray(responseData)) {
        promotions = responseData;
      } else if (responseData?.content && Array.isArray(responseData.content)) {
        promotions = responseData.content;
      } else if (responseData && typeof responseData === 'object') {
        promotions = responseData.content || responseData.promotions || responseData.items || [];
      }
    }
    
    
    // Return success with promotions (even if empty array)
    return {
      success: true,
      data: {
        content: promotions,
        totalElements: responseData?.totalElements || promotions.length,
        totalPages: responseData?.totalPages || 1,
        ...(typeof responseData === 'object' && !Array.isArray(responseData) ? responseData : {})
      },
    };
  } catch (error) {
    console.error('❌ Error fetching store available promotions:', error);
    console.error('❌ Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        params: error.config?.params
      }
    });
    
    const errorMessage = error.response?.data?.message 
      || error.response?.data?.error 
      || error.message 
      || 'Lỗi khi tải promotions của store';
    
    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * ================================================
 * 2. LẤY PLATFORM PROMOTIONS (TOÀN SÀN)
 * ================================================
 * GET /api/v1/buyer/promotions/platform/available
 * 
 * @param {Object} params - Query parameters
 * @param {number} params.orderValue - Giá trị đơn hàng để kiểm tra promotions áp dụng được (required)
 * @param {number} params.page - Số trang (default: 0)
 * @param {number} params.size - Số items/trang (default: 10)
 * @param {string} params.sortBy - Trường sắp xếp (default: 'createdAt')
 * @param {string} params.sortDir - Hướng sắp xếp: 'asc' | 'desc' (default: 'desc')
 * 
 * @returns {Promise<Object>} { success: boolean, data: Page<Promotion> | null, error?: string }
 * 
 * @example
 * const result = await getPlatformAvailablePromotions({
 *   orderValue: 500000,
 *   page: 0,
 *   size: 10
 * });
 */
export const getPlatformAvailablePromotions = async (params = {}) => {
  try {
    const {
      orderValue,
      page = 0,
      size = 10,
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = params;

    if (orderValue === undefined || orderValue === null) {
      return {
        success: false,
        error: 'Order value is required',
      };
    }

    const response = await api.get('/api/v1/buyer/promotions/platform/available', {
      params: {
        orderValue,
        page,
        size,
        sortBy,
        sortDir,
      },
    });

    if (response.data.success) {
      const data = response.data.data;
      // Handle different response structures
      let promotions = [];
      
      if (Array.isArray(data)) {
        // Direct array
        promotions = data;
      } else if (data?.content && Array.isArray(data.content)) {
        // Paginated response with content array
        promotions = data.content;
      } else if (data && typeof data === 'object') {
        // Try to extract promotions from object
        promotions = data.content || data.promotions || data.items || [];
      }
      
      return {
        success: true,
        data: {
          content: promotions,
          totalElements: data?.totalElements || promotions.length,
          totalPages: data?.totalPages || 1,
          ...data
        },
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Không thể tải promotions',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Lỗi khi tải platform promotions',
    };
  }
};

export default {
  getStoreAvailablePromotions,
  getPlatformAvailablePromotions,
};

