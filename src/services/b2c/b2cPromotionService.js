import api from '../common/api';

/**
 * ================================================
 * B2C PROMOTION SERVICE - QUẢN LÝ KHUYẾN MÃI B2C
 * ================================================
 * APIs for B2C store owners to manage promotions
 */

/**
 * 1. LẤY DANH SÁCH KHUYẾN MÃI CỦA HÀNG
 * GET /api/v1/b2c/promotions/store/{storeId}
 */
export const getStorePromotions = async (storeId, params = {}) => {
  try {
    const {
      page = 0,
      size = 20,
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = params;

    const response = await api.get(`/api/v1/b2c/promotions/store/${storeId}`, {
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
 * 2. LẤY KHUYẾN MÃI ĐANG HOẠT ĐỘNG
 * GET /api/v1/b2c/promotions/store/{storeId}/active
 */
export const getActivePromotions = async (storeId) => {
  try {
    const response = await api.get(`/api/v1/b2c/promotions/store/${storeId}/active`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể tải khuyến mãi đang hoạt động',
    };
  }
};

/**
 * 3. LẤY KHUYẾN MÃI KHÔNG HOẠT ĐỘNG
 * GET /api/v1/b2c/promotions/store/{storeId}/inactive
 */
export const getInactivePromotions = async (storeId) => {
  try {
    const response = await api.get(`/api/v1/b2c/promotions/store/${storeId}/inactive`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể tải khuyến mãi không hoạt động',
    };
  }
};

/**
 * 4. LẤY KHUYẾN MÃI ĐÃ HẾT HẠN
 * GET /api/v1/b2c/promotions/store/{storeId}/expired
 */
export const getExpiredPromotions = async (storeId) => {
  try {
    const response = await api.get(`/api/v1/b2c/promotions/store/${storeId}/expired`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể tải khuyến mãi đã hết hạn',
    };
  }
};

/**
 * 5. LẤY KHUYẾN MÃI ĐÃ XÓA
 * GET /api/v1/b2c/promotions/store/{storeId}/deleted
 */
export const getDeletedPromotions = async (storeId) => {
  try {
    const response = await api.get(`/api/v1/b2c/promotions/store/${storeId}/deleted`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể tải khuyến mãi đã xóa',
    };
  }
};

/**
 * 6. TẠO KHUYẾN MÃI MỚI
 * POST /api/v1/b2c/promotions/store/{storeId}
 */
export const createPromotion = async (storeId, promotionData) => {
  try {
    console.log('📤 Creating promotion:', { storeId, promotionData });
    const response = await api.post(`/api/v1/b2c/promotions/store/${storeId}`, promotionData);
    console.log('✅ Create promotion response:', response.data);
    return {
      success: true,
      data: response.data.data || response.data,
      message: response.data.message || 'Tạo khuyến mãi thành công!',
    };
  } catch (error) {
    console.error('❌ Create promotion error:', error);
    const errorMessage = error.response?.data?.message 
      || error.response?.data?.error 
      || error.message 
      || 'Không thể tạo khuyến mãi';
    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * 7. CẬP NHẬT KHUYẾN MÃI
 * PUT /api/v1/b2c/promotions/{promotionId}
 */
export const updatePromotion = async (promotionId, promotionData) => {
  try {
    console.log('📤 Updating promotion:', { promotionId, promotionData });
    const response = await api.put(`/api/v1/b2c/promotions/${promotionId}`, promotionData);
    console.log('✅ Update promotion response:', response.data);
    return {
      success: true,
      data: response.data.data || response.data,
      message: response.data.message || 'Cập nhật khuyến mãi thành công!',
    };
  } catch (error) {
    console.error('❌ Update promotion error:', error);
    const errorMessage = error.response?.data?.message 
      || error.response?.data?.error 
      || error.message 
      || 'Không thể cập nhật khuyến mãi';
    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * 8. KÍCH HOẠT KHUYẾN MÃI
 * PUT /api/v1/b2c/promotions/{promotionId}/activate
 */
export const activatePromotion = async (promotionId) => {
  try {
    const response = await api.put(`/api/v1/b2c/promotions/${promotionId}/activate`);
    return {
      success: true,
      data: response.data.data,
      message: 'Kích hoạt khuyến mãi thành công!',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể kích hoạt khuyến mãi',
    };
  }
};

/**
 * 9. VÔ HIỆU HÓA KHUYẾN MÃI
 * PUT /api/v1/b2c/promotions/{promotionId}/deactivate
 */
export const deactivatePromotion = async (promotionId) => {
  try {
    const response = await api.put(`/api/v1/b2c/promotions/${promotionId}/deactivate`);
    return {
      success: true,
      data: response.data.data,
      message: 'Vô hiệu hóa khuyến mãi thành công!',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể vô hiệu hóa khuyến mãi',
    };
  }
};

/**
 * 10. XÓA KHUYẾN MÃI
 * DELETE /api/v1/b2c/promotions/{promotionId}
 */
export const deletePromotion = async (promotionId) => {
  try {
    const response = await api.delete(`/api/v1/b2c/promotions/${promotionId}`);
    return {
      success: true,
      message: 'Xóa khuyến mãi thành công!',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể xóa khuyến mãi',
    };
  }
};

/**
 * 11. ĐẾM KHUYẾN MÃI THEO TRẠNG THÁI (API mới)
 * GET /api/v1/b2c/promotions/store/{storeId}/count-by-status
 */
export const countPromotionsByStatus = async (storeId) => {
  try {
    if (!storeId) {
      return { success: false, error: 'storeId is required' };
    }

    const response = await api.get(`/api/v1/b2c/promotions/store/${storeId}/count-by-status`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ Count promotions by status error:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể đếm khuyến mãi theo trạng thái',
    };
  }
};

export default {
  getStorePromotions,
  getActivePromotions,
  getInactivePromotions,
  getExpiredPromotions,
  getDeletedPromotions,
  countPromotionsByStatus,
  createPromotion,
  updatePromotion,
  activatePromotion,
  deactivatePromotion,
  deletePromotion,
};

