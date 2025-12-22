import api from '../common/api';

/**
 * ================================================
 * ADMIN PROMOTION SERVICE - QUẢN LÝ KHUYẾN MÃI (ADMIN)
 * ================================================
 */

/**
 * 1. LẤY TẤT CẢ KHUYẾN MÃI (Admin oversight)
 * GET /api/v1/admin/promotions
 */
export const getAllPromotions = async (params = {}) => {
  try {
    const {
      page = 0,
      size = 20,
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = params;

    const response = await api.get('/api/v1/admin/promotions', {
      params: { page, size, sortBy, sortDir },
    });


    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể tải danh sách khuyến mãi',
    };
  }
};

/**
 * 2. LẤY KHUYẾN MÃI THEO ID
 * GET /api/v1/admin/promotions/{id}
 */
export const getPromotionById = async (promotionId) => {
  try {
    const response = await api.get(`/api/v1/admin/promotions/${promotionId}`);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể tải thông tin khuyến mãi',
    };
  }
};

/**
 * 3. TẠO KHUYẾN MÃI NỀN TẢNG
 * POST /api/v1/admin/promotions/platform
 */
export const createPlatformPromotion = async (promotionData) => {
  try {
    // 🔍 DEBUG: Log payload trước khi gửi
    console.log('🔍 [adminPromotionService] POST payload:', JSON.stringify(promotionData, null, 2));
    console.log('🔍 [adminPromotionService] minOrderValue in payload:', promotionData.minOrderValue);
    console.log('🔍 [adminPromotionService] minOrderValue type:', typeof promotionData.minOrderValue);
    console.log('🔍 [adminPromotionService] minOrderAmount in payload:', promotionData.minOrderAmount);
    
    const response = await api.post('/api/v1/admin/promotions/platform', promotionData);
    
    // 🔍 DEBUG: Log response từ backend - KIỂM TRA TẤT CẢ FIELD
    console.log('🔍 [adminPromotionService] POST response:', JSON.stringify(response.data, null, 2));
    console.log('🔍 [adminPromotionService] Full response data:', response.data?.data);
    console.log('🔍 [adminPromotionService] Response data type:', typeof response.data?.data);
    
    // ⚠️ Backend có thể chỉ trả về message string, không trả về promotion object
    // Nếu response.data.data là string, cần gọi GET để lấy promotion object
    let promotionData_result = response.data.data || response.data;
    
    // Nếu response chỉ là message string, thử lấy promotion từ code
    // ⚠️ Backend chỉ trả về message, không trả về promotion object
    // Cần gọi GET để lấy promotion object và kiểm tra minOrderValue
    if (typeof promotionData_result === 'string' && promotionData.code) {
      console.log('⚠️ [adminPromotionService] Backend chỉ trả về message, đang gọi GET để lấy promotion object...');
      try {
        // Delay một chút để đảm bảo backend đã lưu vào database
        await new Promise(resolve => setTimeout(resolve, 1000)); // Delay 1s
        
        // Gọi getAllPromotions để tìm promotion mới tạo
        const response = await api.get('/api/v1/admin/promotions', {
          params: { page: 0, size: 100, sortBy: 'createdAt', sortDir: 'desc' }
        });
        
        const allPromotionsData = response.data.data || response.data;
        const promotions = Array.isArray(allPromotionsData?.content) 
          ? allPromotionsData.content 
          : (Array.isArray(allPromotionsData) ? allPromotionsData : []);
        
        const newPromotion = promotions.find(p => p.code === promotionData.code.toUpperCase());
        if (newPromotion) {
          console.log('✅ [adminPromotionService] Tìm thấy promotion mới tạo:', newPromotion);
          console.log('✅ [adminPromotionService] minOrderValue trong promotion:', newPromotion.minOrderValue);
          console.log('✅ [adminPromotionService] minOrderAmount trong promotion:', newPromotion.minOrderAmount);
          console.log('✅ [adminPromotionService] Tất cả fields trong promotion:', Object.keys(newPromotion));
          promotionData_result = newPromotion;
        } else {
          console.warn('⚠️ [adminPromotionService] Không tìm thấy promotion với code:', promotionData.code.toUpperCase());
          console.warn('⚠️ [adminPromotionService] Danh sách codes có sẵn:', promotions.map(p => p.code));
        }
      } catch (err) {
        console.warn('⚠️ [adminPromotionService] Không thể lấy promotion object:', err);
      }
    }
    
    console.log('🔍 [adminPromotionService] Final promotion data:', promotionData_result);
    console.log('🔍 [adminPromotionService] minOrderValue in final data:', promotionData_result?.minOrderValue);
    console.log('🔍 [adminPromotionService] minOrderAmount in final data:', promotionData_result?.minOrderAmount);

    return {
      success: true,
      data: promotionData_result,
      message: 'Tạo khuyến mãi nền tảng thành công',
    };
  } catch (error) {
    console.error('❌ [adminPromotionService] POST error:', error);
    console.error('❌ [adminPromotionService] Error response:', error.response?.data);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tạo khuyến mãi',
    };
  }
};

/**
 * 4. CẬP NHẬT KHUYẾN MÃI NỀN TẢNG
 * PUT /api/v1/admin/promotions/platform/{promotionId}
 */
export const updatePlatformPromotion = async (promotionId, promotionData) => {
  try {
    const response = await api.put(`/api/v1/admin/promotions/platform/${promotionId}`, promotionData);

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Cập nhật khuyến mãi thành công',
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể cập nhật khuyến mãi',
    };
  }
};

/**
 * 5. XÓA KHUYẾN MÃI
 * DELETE /api/v1/admin/promotions/{promotionId}
 */
export const deletePromotion = async (promotionId) => {
  try {
    const response = await api.delete(`/api/v1/admin/promotions/${promotionId}`);

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Xóa khuyến mãi thành công',
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể xóa khuyến mãi',
    };
  }
};

/**
 * 6. KÍCH HOẠT KHUYẾN MÃI
 * PUT /api/v1/admin/promotions/{promotionId}/activate
 */
export const activatePromotion = async (promotionId) => {
  try {
    const response = await api.put(`/api/v1/admin/promotions/${promotionId}/activate`);

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Kích hoạt khuyến mãi thành công',
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể kích hoạt khuyến mãi',
    };
  }
};

/**
 * 7. VÔ HIỆU HÓA KHUYẾN MÃI
 * PUT /api/v1/admin/promotions/{promotionId}/deactivate
 */
export const deactivatePromotion = async (promotionId) => {
  try {
    const response = await api.put(`/api/v1/admin/promotions/${promotionId}/deactivate`);

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Vô hiệu hóa khuyến mãi thành công',
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể vô hiệu hóa khuyến mãi',
    };
  }
};

/**
 * 8. LẤY KHUYẾN MÃI THEO LOẠI
 * GET /api/v1/admin/promotions/type/{type}
 */
export const getPromotionsByType = async (type, params = {}) => {
  try {
    const {
      page = 0,
      size = 20,
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = params;

    const response = await api.get(`/api/v1/admin/promotions/type/${type}`, {
      params: { page, size, sortBy, sortDir },
    });

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể tải danh sách khuyến mãi',
    };
  }
};

/**
 * 9. LẤY KHUYẾN MÃI NỀN TẢNG ĐANG HOẠT ĐỘNG
 * GET /api/v1/admin/promotions/reports/active
 */
export const getActivePromotions = async (params = {}) => {
  try {
    const {
      page = 0,
      size = 20,
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = params;

    const response = await api.get('/api/v1/admin/promotions/reports/active', {
      params: { page, size, sortBy, sortDir },
    });

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể tải danh sách khuyến mãi đang hoạt động',
    };
  }
};

/**
 * 10. LẤY KHUYẾN MÃI NỀN TẢNG KHÔNG HOẠT ĐỘNG
 * GET /api/v1/admin/promotions/reports/inactive
 */
export const getInactivePromotions = async (params = {}) => {
  try {
    const {
      page = 0,
      size = 20,
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = params;

    const response = await api.get('/api/v1/admin/promotions/reports/inactive', {
      params: { page, size, sortBy, sortDir },
    });

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể tải danh sách khuyến mãi không hoạt động',
    };
  }
};

/**
 * 11. LẤY KHUYẾN MÃI NỀN TẢNG ĐÃ HẾT HẠN
 * GET /api/v1/admin/promotions/reports/expired
 */
export const getExpiredPromotions = async (params = {}) => {
  try {
    const {
      page = 0,
      size = 20,
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = params;

    const response = await api.get('/api/v1/admin/promotions/reports/expired', {
      params: { page, size, sortBy, sortDir },
    });

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể tải danh sách khuyến mãi đã hết hạn',
    };
  }
};

/**
 * 12. LẤY KHUYẾN MÃI NỀN TẢNG ĐÃ XÓA
 * GET /api/v1/admin/promotions/reports/deleted
 */
export const getDeletedPromotions = async (params = {}) => {
  try {
    const {
      page = 0,
      size = 20,
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = params;

    const response = await api.get('/api/v1/admin/promotions/reports/deleted', {
      params: { page, size, sortBy, sortDir },
    });

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể tải danh sách khuyến mãi đã xóa',
    };
  }
};

export default {
  getAllPromotions,
  getPromotionById,
  createPlatformPromotion,
  updatePlatformPromotion,
  deletePromotion,
  activatePromotion,
  deactivatePromotion,
  getPromotionsByType,
  getActivePromotions,
  getInactivePromotions,
  getExpiredPromotions,
  getDeletedPromotions,
};

/// ĐÃ KHÔI PHỤC



