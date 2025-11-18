import api from '../common/api';

/**
 * ================================================
 * B2C STORE SERVICE - QUẢN LÝ CỬA HÀNG B2C
 * ================================================
 * APIs for B2C store owners to manage their stores
 */

/**
 * 1. LẤY DANH SÁCH CỬA HÀNG CỦA TÔI
 * GET /api/v1/b2c/stores/my-stores
 */
export const getMyStores = async () => {
  try {
    const response = await api.get('/api/v1/b2c/stores/my-stores');
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể tải danh sách cửa hàng',
    };
  }
};

/**
 * 2. TẠO CỬA HÀNG MỚI
 * POST /api/v1/b2c/stores/create
 */
export const createStore = async (storeData) => {
  try {
    console.log('📤 Creating store with data:', JSON.stringify(storeData, null, 2));
    
    // ✅ Backend yêu cầu multipart/form-data với storeDTO + logo (optional)
    const formData = new FormData();
    
    // Tạo storeDTO object
    const storeDTO = {
      name: storeData.name,
      description: storeData.description || '',
      address: storeData.address,
    };
    
    // Append storeDTO as JSON blob
    formData.append('storeDTO', new Blob([JSON.stringify(storeDTO)], { type: 'application/json' }));
    
    // Nếu có logo, append logo file
    if (storeData.logo) {
      formData.append('logo', storeData.logo);
      console.log('📷 Logo file:', storeData.logo.name);
    }
    
    // ✅ XÓA Content-Type mặc định (application/json) để Axios tự động set multipart/form-data với boundary
    const response = await api.post('/api/v1/b2c/stores/create', formData, {
      headers: {
        'Content-Type': undefined, // ← Xóa default header
      },
    });
    
    console.log('✅ Store created:', response.data);
    return {
      success: true,
      data: response.data.data,
      message: 'Tạo cửa hàng thành công!',
    };
  } catch (error) {
    console.error('❌ Error creating store:', error);
    console.error('❌ Error response:', error.response?.data);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tạo cửa hàng',
    };
  }
};

/**
 * 3. CẬP NHẬT THÔNG TIN CỬA HÀNG
 * PUT /api/v1/b2c/stores/{storeId}
 */
export const updateStore = async (storeId, storeData) => {
  try {
    const response = await api.put(`/api/v1/b2c/stores/${storeId}`, storeData);
    return {
      success: true,
      data: response.data.data,
      message: 'Cập nhật cửa hàng thành công!',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể cập nhật cửa hàng',
    };
  }
};

/**
 * 4. UPLOAD LOGO CỬA HÀNG
 * PUT /api/v1/b2c/stores/{storeId}/logo
 */
export const uploadStoreLogo = async (storeId, file) => {
  try {
    const formData = new FormData();
    formData.append('file', file); // ← Swagger spec uses "file" not "logo"
    
    const response = await api.put(`/api/v1/b2c/stores/${storeId}/logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return {
      success: true,
      data: response.data.data,
      message: 'Upload logo thành công!',
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không thể upload logo',
    };
  }
};

/**
 * 5. UPLOAD BANNER CỬA HÀNG
 * PUT /api/v1/b2c/stores/{storeId}/banner
 */
export const uploadStoreBanner = async (storeId, file) => {
  try {
    const formData = new FormData();
    formData.append('file', file); // ← Swagger spec uses "file" not "banner"
    
    const response = await api.put(`/api/v1/b2c/stores/${storeId}/banner`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return {
      success: true,
      data: response.data.data,
      message: 'Upload banner thành công!',
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không thể upload banner',
    };
  }
};

/**
 * 6. XÓA CỬA HÀNG (SOFT DELETE)
 * DELETE /api/v1/b2c/stores/{storeId}
 */
export const deleteStore = async (storeId) => {
  try {
    const response = await api.delete(`/api/v1/b2c/stores/${storeId}`);
    return {
      success: true,
      message: 'Xóa cửa hàng thành công!',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể xóa cửa hàng',
    };
  }
};

export default {
  getMyStores,
  createStore,
  updateStore,
  uploadStoreLogo,
  uploadStoreBanner,
  deleteStore,
};

