import api from '../common/api';

/**
 * ================================================
 * ADMIN VARIANT SERVICES - Quản lý duyệt biến thể
 * ================================================
 */

/**
 * Lấy TẤT CẢ biến thể (tất cả trạng thái)
 * GET /api/v1/admin/product-variants
 */
export const getAllVariants = async () => {
  try {
    console.log('🛠 [Admin][Variants] GET all → /api/v1/admin/product-variants');
    const response = await api.get('/api/v1/admin/product-variants');
    console.log('✅ [Admin][Variants] all response.raw:', response.data);
    
    // Handle paginated response hoặc array trực tiếp
    let data = response.data;
    
    // Nếu có wrapper success/data
    if (data.success !== undefined && data.data) {
      data = data.data;
    }

    // Thử các wrapper phổ biến
    const candidates =
      (Array.isArray(data) && data) ||
      (Array.isArray(data?.content) && data.content) ||
      (Array.isArray(data?.items) && data.items) ||
      (Array.isArray(data?.records) && data.records) ||
      (Array.isArray(data?.list) && data.list) ||
      (Array.isArray(data?.rows) && data.rows) ||
      (Array.isArray(data?.result?.content) && data.result.content) ||
      (Array.isArray(data?.result?.items) && data.result.items) ||
      null;

    if (Array.isArray(candidates)) {
      console.log('📦 [Admin][Variants] all parsed (common wrappers): length=', candidates.length);
      return {
        success: true,
        data: candidates
      };
    }

    // Nếu là paginated response (có content) theo chuẩn
    if (data.content && Array.isArray(data.content)) {
      console.log('📦 [Admin][Variants] all parsed (paginated):', {
        totalElements: data.totalElements,
        totalPages: data.totalPages,
        pageSize: data.size,
        contentCount: data.content.length
      });
      return {
        success: true,
        data: data.content
      };
    }
    
    // Nếu là array trực tiếp
    if (Array.isArray(data)) {
      console.log('📦 [Admin][Variants] all parsed (array): length=', data.length);
      return {
        success: true,
        data: data
      };
    }
    
    // Fallback về empty array
    console.warn('⚠️ [Admin][Variants] all parsed → empty fallback');
    return {
      success: true,
      data: []
    };
  } catch (error) {
    console.error('Error fetching all variants:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tải danh sách biến thể'
    };
  }
};

/**
 * Lấy danh sách biến thể chờ duyệt (CHỈ PENDING)
 * GET /api/v1/admin/product-variants/pending
 */
export const getPendingVariants = async () => {
  try {
    console.log('🛠 [Admin][Variants] GET pending → /api/v1/admin/product-variants/pending');
    const response = await api.get('/api/v1/admin/product-variants/pending');
    console.log('✅ [Admin][Variants] pending response.raw:', response.data);
    
    // Handle paginated response hoặc array trực tiếp
    let data = response.data;
    
    // Nếu có wrapper success/data
    if (data.success !== undefined && data.data) {
      data = data.data;
    }

    // Thử các wrapper phổ biến
    const candidates =
      (Array.isArray(data) && data) ||
      (Array.isArray(data?.content) && data.content) ||
      (Array.isArray(data?.items) && data.items) ||
      (Array.isArray(data?.records) && data.records) ||
      (Array.isArray(data?.list) && data.list) ||
      (Array.isArray(data?.rows) && data.rows) ||
      (Array.isArray(data?.result?.content) && data.result.content) ||
      (Array.isArray(data?.result?.items) && data.result.items) ||
      null;

    if (Array.isArray(candidates)) {
      console.log('📦 [Admin][Variants] pending parsed (common wrappers): length=', candidates.length);
      return {
        success: true,
        data: candidates
      };
    }

    // Nếu là paginated response (có content) theo chuẩn
    if (data.content && Array.isArray(data.content)) {
      console.log('📦 [Admin][Variants] pending parsed (paginated):', {
        totalElements: data.totalElements,
        totalPages: data.totalPages,
        pageSize: data.size,
        contentCount: data.content.length
      });
      return {
        success: true,
        data: data.content
      };
    }
    
    // Nếu là array trực tiếp
    if (Array.isArray(data)) {
      console.log('📦 [Admin][Variants] pending parsed (array): length=', data.length);
      return {
        success: true,
        data: data
      };
    }
    
    // Fallback về empty array
    console.warn('⚠️ [Admin][Variants] pending parsed → empty fallback');
    return {
      success: true,
      data: []
    };
  } catch (error) {
    console.error('Error fetching pending variants:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tải danh sách biến thể'
    };
  }
};

/**
 * Duyệt biến thể
 * PUT /api/v1/admin/product-variants/{id}/approve
 */
export const approveVariant = async (variantId) => {
  try {
    const response = await api.put(`/api/v1/admin/product-variants/${variantId}/approve`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error approving variant:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể duyệt biến thể'
    };
  }
};

/**
 * Từ chối biến thể
 * PUT /api/v1/admin/product-variants/{id}/reject
 */
export const rejectVariant = async (variantId, reason) => {
  try {
    const response = await api.put(
      `/api/v1/admin/product-variants/${variantId}/reject`,
      null,
      { params: { reason } }
    );
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error rejecting variant:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể từ chối biến thể'
    };
  }
};
