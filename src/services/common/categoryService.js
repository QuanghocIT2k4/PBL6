import api from './api';

/**
 * ================================================
 * CATEGORY SERVICE - QUẢN LÝ DANH MỤC
 * ================================================
 * APIs for managing product categories (Admin & Public)
 */

/**
 * HELPER: Slugify category name cho URL-friendly key
 */
const slugify = (str) =>
  String(str || '')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();

/**
 * HELPER: Get icon by category name
 */
const getCategoryIcon = (name) => {
  const lowerName = name.toLowerCase();
  if (/laptop/i.test(lowerName)) return '💻';
  if (/phone|điện thoại/i.test(lowerName)) return '📱';
  if (/tablet|máy tính bảng/i.test(lowerName)) return '📱';
  if (/watch|đồng hồ/i.test(lowerName)) return '⌚';
  if (/headphone|tai nghe/i.test(lowerName)) return '🎧';
  if (/camera/i.test(lowerName)) return '📷';
  if (/gaming/i.test(lowerName)) return '🎮';
  return '📦';
};

/**
 * 1. LẤY DANH SÁCH CATEGORIES (PAGINATION)
 * GET /api/v1/categories
 */
export const getAllCategories = async (params = {}) => {
  try {
    const {
      page = 0,
      size = 10,
      sortBy = 'name',
      sortDirection = 'asc',
    } = params;

    const response = await api.get('/api/v1/categories', {
      params: {
        page,
        size,
        sortBy,
        sortDirection,
      },
    });

    const categories = Array.isArray(response.data) ? response.data : response.data?.data || [];
    
    // Map categories với key và icon
    const mappedCategories = categories.map(category => ({
      ...category,
      key: slugify(category.name),
      icon: getCategoryIcon(category.name),
    }));

    return {
      success: true,
      data: mappedCategories,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không thể tải danh sách danh mục',
      data: [],
    };
  }
};

/**
 * 2. LẤY CATEGORY THEO ID
 * GET /api/v1/categories/{id}
 */
export const getCategoryById = async (categoryId) => {
  try {
    const response = await api.get(`/api/v1/categories/${categoryId}`);

    const category = response.data.data || response.data;
    
    return {
      success: true,
      data: {
        ...category,
        key: slugify(category.name),
        icon: getCategoryIcon(category.name),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không tìm thấy danh mục',
      data: null,
    };
  }
};

/**
 * 3. LẤY CATEGORY THEO KEY (CUSTOM METHOD)
 * Tìm category theo slug key từ danh sách
 */
export const getCategoryByKey = async (key) => {
  try {
    const result = await getAllCategories({ size: 20 }); // ✅ Giảm từ 100 xuống 20
    
    if (result.success) {
      const category = result.data.find(c => c.key === key);
      return {
        success: !!category,
        data: category || null,
      };
    }
    
    return { success: false, data: null };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

/**
 * 4. TẠO CATEGORY MỚI (ADMIN)
 * POST /api/v1/categories
 */
export const createCategory = async (categoryData) => {
  try {
    const response = await api.post('/api/v1/categories', categoryData);

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Tạo danh mục thành công!',
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không thể tạo danh mục',
      data: null,
    };
  }
};

/**
 * 5. CẬP NHẬT CATEGORY (ADMIN)
 * PUT /api/v1/categories/{id}
 */
export const updateCategory = async (categoryId, categoryData) => {
  try {
    const response = await api.put(`/api/v1/categories/${categoryId}`, categoryData);

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Cập nhật danh mục thành công!',
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không thể cập nhật danh mục',
      data: null,
    };
  }
};

/**
 * 6. XÓA CATEGORY (ADMIN)
 * DELETE /api/v1/categories/{id}
 */
export const deleteCategory = async (categoryId) => {
  try {
    await api.delete(`/api/v1/categories/${categoryId}`);

    return {
      success: true,
      message: 'Xóa danh mục thành công!',
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không thể xóa danh mục',
    };
  }
};

/**
 * BACKWARD COMPATIBILITY: Old method name
 */
export const getCategories = getAllCategories;

/**
 * ================================================
 * EXPORT DEFAULT
 * ================================================
 */
export const categoryService = {
  getAllCategories,
  getCategories,
  getCategoryById,
  getCategoryByKey,
  createCategory,
  updateCategory,
  deleteCategory,
};

export default categoryService;