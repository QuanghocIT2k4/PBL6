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

    console.log('🔍 [getStoreAvailablePromotions] ===== CALLING API =====');
    console.log('🔍 [getStoreAvailablePromotions] URL: /api/v1/buyer/promotions/store/' + storeId + '/available');
    console.log('🔍 [getStoreAvailablePromotions] Params:', {
      orderValue,
      page,
      size,
      sortBy,
      sortDir,
    });
    
    const response = await api.get(`/api/v1/buyer/promotions/store/${storeId}/available`, {
      params: {
        orderValue,
        page,
        size,
        sortBy,
        sortDir,
      },
    });
    
    console.log('🔍 [getStoreAvailablePromotions] ===== API RESPONSE =====');
    console.log('🔍 [getStoreAvailablePromotions] Response status:', response.status);
    console.log('🔍 [getStoreAvailablePromotions] Response headers:', response.headers);
    console.log('🔍 [getStoreAvailablePromotions] Full response:', response);
    console.log('🔍 [getStoreAvailablePromotions] response.data:', response.data);
    console.log('🔍 [getStoreAvailablePromotions] response.data type:', typeof response.data);
    console.log('🔍 [getStoreAvailablePromotions] response.data isArray:', Array.isArray(response.data));
    if (response.data && typeof response.data === 'object') {
      console.log('🔍 [getStoreAvailablePromotions] response.data keys:', Object.keys(response.data));
    }

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
    console.log('🔍 [getStoreAvailablePromotions] ===== PARSING RESPONSE DATA =====');
    console.log('🔍 [getStoreAvailablePromotions] responseData:', responseData);
    console.log('🔍 [getStoreAvailablePromotions] responseData type:', typeof responseData);
    console.log('🔍 [getStoreAvailablePromotions] responseData isArray:', Array.isArray(responseData));
    
    if (responseData) {
      if (Array.isArray(responseData)) {
        console.log('✅ [getStoreAvailablePromotions] responseData is array');
        promotions = responseData;
      } else if (responseData?.content && Array.isArray(responseData.content)) {
        console.log('✅ [getStoreAvailablePromotions] responseData.content is array');
        promotions = responseData.content;
      } else if (responseData && typeof responseData === 'object') {
        console.log('✅ [getStoreAvailablePromotions] responseData is object, extracting...');
        promotions = responseData.content || responseData.promotions || responseData.items || [];
        console.log('🔍 [getStoreAvailablePromotions] Extracted:', {
          'responseData.content': responseData.content,
          'responseData.promotions': responseData.promotions,
          'responseData.items': responseData.items,
          'final promotions': promotions
        });
      }
    }
    
    console.log('✅ [getStoreAvailablePromotions] Final promotions:', promotions);
    console.log('✅ [getStoreAvailablePromotions] Promotions count:', promotions.length);
    if (promotions.length > 0) {
      console.log('✅ [getStoreAvailablePromotions] First promotion:', promotions[0]);
    }
    console.log('🔍 [getStoreAvailablePromotions] ====================================');
    
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

    console.log('🔍 [getPlatformAvailablePromotions] ===== CALLING API =====');
    console.log('🔍 [getPlatformAvailablePromotions] URL: /api/v1/buyer/promotions/platform/available');
    console.log('🔍 [getPlatformAvailablePromotions] Params:', {
      orderValue,
      page,
      size,
      sortBy,
      sortDir,
    });
    
    const response = await api.get('/api/v1/buyer/promotions/platform/available', {
      params: {
        orderValue,
        page,
        size,
        sortBy,
        sortDir,
      },
    });

    console.log('🔍 [getPlatformAvailablePromotions] ===== API RESPONSE =====');
    console.log('🔍 [getPlatformAvailablePromotions] Response status:', response.status);
    console.log('🔍 [getPlatformAvailablePromotions] Response headers:', response.headers);
    console.log('🔍 [getPlatformAvailablePromotions] Full response:', response);
    console.log('🔍 [getPlatformAvailablePromotions] response.data:', response.data);
    console.log('🔍 [getPlatformAvailablePromotions] response.data type:', typeof response.data);
    console.log('🔍 [getPlatformAvailablePromotions] response.data isArray:', Array.isArray(response.data));
    if (response.data && typeof response.data === 'object') {
      console.log('🔍 [getPlatformAvailablePromotions] response.data keys:', Object.keys(response.data));
    }

    // Handle different response structures
    let promotions = [];
    let responseData = null;

    // Case 1: Response has success field and data
    if (response.data?.success !== undefined) {
      if (response.data.success) {
        responseData = response.data.data;
      } else {
        // Backend returned success: false
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
    console.log('🔍 [getPlatformAvailablePromotions] ===== PARSING RESPONSE DATA =====');
    console.log('🔍 [getPlatformAvailablePromotions] responseData:', responseData);
    console.log('🔍 [getPlatformAvailablePromotions] responseData type:', typeof responseData);
    console.log('🔍 [getPlatformAvailablePromotions] responseData isArray:', Array.isArray(responseData));
    
    if (responseData) {
      if (Array.isArray(responseData)) {
        console.log('✅ [getPlatformAvailablePromotions] responseData is array');
        promotions = responseData;
      } else if (responseData?.content && Array.isArray(responseData.content)) {
        console.log('✅ [getPlatformAvailablePromotions] responseData.content is array');
        promotions = responseData.content;
      } else if (responseData && typeof responseData === 'object') {
        console.log('✅ [getPlatformAvailablePromotions] responseData is object, extracting...');
        promotions = responseData.content || responseData.promotions || responseData.items || [];
        console.log('🔍 [getPlatformAvailablePromotions] Extracted:', {
          'responseData.content': responseData.content,
          'responseData.promotions': responseData.promotions,
          'responseData.items': responseData.items,
          'final promotions': promotions
        });
      }
    }

    console.log('✅ [getPlatformAvailablePromotions] Final promotions:', promotions);
    console.log('✅ [getPlatformAvailablePromotions] Promotions count:', promotions.length);
    if (promotions.length > 0) {
      console.log('✅ [getPlatformAvailablePromotions] First promotion:', promotions[0]);
    }
    console.log('🔍 [getPlatformAvailablePromotions] ====================================');
    
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

