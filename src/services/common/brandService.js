import api from './api';

/**
 * ================================================
 * BRAND SERVICE - QUẢN LÝ THƯƠNG HIỆU
 * ================================================
 * APIs for managing brands (Admin & Public)
 */

/**
 * 1. LẤY DANH SÁCH BRANDS (PAGINATION)
 * GET /api/v1/brands
 */
export const getAllBrands = async (params = {}) => {
  try {
    const {
      page = 0,
      size = 10,
      sortBy = 'name',
      sortDirection = 'asc',
    } = params;

    const response = await api.get('/api/v1/brands', {
      params: {
        page,
        size,
        sortBy,
        sortDirection,
      },
    });

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không thể tải danh sách thương hiệu',
      data: null,
    };
  }
};

/**
 * 2. LẤY TẤT CẢ BRANDS (KHÔNG PAGINATION)
 * GET /api/v1/brands/all
 */
export const getAllBrandsWithoutPagination = async () => {
  try {
    const response = await api.get('/api/v1/brands/all');

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không thể tải danh sách thương hiệu',
      data: [],
    };
  }
};

/**
 * 3. LẤY BRAND THEO ID
 * GET /api/v1/brands/{id}
 */
export const getBrandById = async (brandId) => {
  try {
    const response = await api.get(`/api/v1/brands/${brandId}`);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không tìm thấy thương hiệu',
      data: null,
    };
  }
};

/**
 * 4. LẤY BRAND THEO TÊN
 * GET /api/v1/brands/name/{name}
 */
export const getBrandByName = async (brandName) => {
  try {
    const response = await api.get(`/api/v1/brands/name/${brandName}`);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không tìm thấy thương hiệu',
      data: null,
    };
  }
};

/**
 * 5. KIỂM TRA BRAND TỒN TẠI (BY ID)
 * GET /api/v1/brands/{id}/exists
 */
export const checkBrandExists = async (brandId) => {
  try {
    const response = await api.get(`/api/v1/brands/${brandId}/exists`);

    return {
      success: true,
      data: response.data.data || response.data,
      exists: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      exists: false,
    };
  }
};

/**
 * 6. KIỂM TRA BRAND TỒN TẠI (BY NAME)
 * GET /api/v1/brands/name/{name}/exists
 */
export const checkBrandExistsByName = async (brandName) => {
  try {
    const response = await api.get(`/api/v1/brands/name/${brandName}/exists`);

    return {
      success: true,
      data: response.data.data || response.data,
      exists: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      exists: false,
    };
  }
};

/**
 * 7. TẠO BRAND MỚI (ADMIN)
 * POST /api/v1/brands
 */
export const createBrand = async (brandData) => {
  try {
    const response = await api.post('/api/v1/brands', brandData);

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Tạo thương hiệu thành công!',
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không thể tạo thương hiệu',
      data: null,
    };
  }
};

/**
 * 8. CẬP NHẬT BRAND (ADMIN)
 * PUT /api/v1/brands/{id}
 */
export const updateBrand = async (brandId, brandData) => {
  try {
    const response = await api.put(`/api/v1/brands/${brandId}`, brandData);

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Cập nhật thương hiệu thành công!',
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không thể cập nhật thương hiệu',
      data: null,
    };
  }
};

/**
 * 9. XÓA BRAND (ADMIN)
 * DELETE /api/v1/brands/{id}
 */
export const deleteBrand = async (brandId) => {
  try {
    await api.delete(`/api/v1/brands/${brandId}`);

    return {
      success: true,
      message: 'Xóa thương hiệu thành công!',
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không thể xóa thương hiệu',
    };
  }
};

/**
 * ================================================
 * EXPORT DEFAULT
 * ================================================
 */
export default {
  getAllBrands,
  getAllBrandsWithoutPagination,
  getBrandById,
  getBrandByName,
  checkBrandExists,
  checkBrandExistsByName,
  createBrand,
  updateBrand,
  deleteBrand,
};
