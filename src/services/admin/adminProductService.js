import api from '../common/api';

/**
 * ================================================
 * ADMIN PRODUCT SERVICE - QUẢN LÝ SẢN PHẨM (ADMIN)
 * ================================================
 */

/**
 * 1. LẤY DANH SÁCH SẢN PHẨM CHỜ DUYỆT
 * GET /api/v1/admin/products/pending
 */
export const getPendingProducts = async (params = {}) => {
  try {
    const {
      page = 0,
      size = 20,
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = params;

    const response = await api.get('/api/v1/admin/products/pending', {
      params: { page, size, sortBy, sortDir },
    });

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể tải danh sách sản phẩm chờ duyệt',
    };
  }
};

/**
 * 2. DUYỆT SẢN PHẨM
 * PUT /api/v1/admin/products/{productId}/approve
 */
export const approveProduct = async (productId) => {
  try {
    const response = await api.put(`/api/v1/admin/products/${productId}/approve`);

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Duyệt sản phẩm thành công',
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể duyệt sản phẩm',
    };
  }
};

/**
 * 3. TỪ CHỐI SẢN PHẨM
 * PUT /api/v1/admin/products/{productId}/reject
 */
export const rejectProduct = async (productId, reason) => {
  try {
    const response = await api.put(`/api/v1/admin/products/${productId}/reject`, null, {
      params: { reason },
    });

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Từ chối sản phẩm thành công',
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể từ chối sản phẩm',
    };
  }
};

// NOTE: Variant functions đã được move sang adminVariantService.js
// để tránh conflict exports

export default {
  getPendingProducts,
  approveProduct,
  rejectProduct,
};







