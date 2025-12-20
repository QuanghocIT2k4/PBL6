import api from '../common/api';

// ===================================================
// B2C PRODUCT & VARIANT MANAGEMENT APIS
// ===================================================

/**
 * 0. LẤY DANH SÁCH PRODUCTS CỦA STORE (B2C API MỚI)
 * GET /api/v1/b2c/products/{storeId}
 * Trả về tất cả products của store cho B2C management
 */
export const getProductsByStore = async (storeId, params = {}) => {
  try {
    const response = await api.get(`/api/v1/b2c/products/${storeId}`, { params });
    
    // ✅ Debug: Log để xem API GET PRODUCT có trả về status và brand fields không
    if (response.data?.success && response.data?.data) {
      const products = Array.isArray(response.data.data) ? response.data.data : (response.data.data?.content || []);
      if (products.length > 0) {
        const firstProduct = products[0];
      }
    }

    if (response.data.success) {
      // Xử lý response - có thể là paginated hoặc array
      const data = response.data.data;
      
      if (Array.isArray(data)) {
        return { success: true, data: data };
      } else if (data?.content) {
        // Paginated response
        return { success: true, data: data.content, pagination: data };
      } else {
        return { success: true, data: [] };
      }
    } else {
      return { success: false, error: response.data.error || 'Không thể tải danh sách sản phẩm' };
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Lỗi khi tải danh sách sản phẩm',
    };
  }
};

/**
 * 0.1. LẤY DANH SÁCH PRODUCT VARIANTS CỦA STORE (B2C API MỚI)
 * GET /api/v1/b2c/product-variants/{storeId}
 * Trả về tất cả product variants của store cho B2C management
 */
export const getProductVariantsByStore = async (storeId, params = {}) => {
  try {
    const response = await api.get(`/api/v1/b2c/product-variants/${storeId}`, { params });
    
    // ✅ Debug: Log toàn bộ response JSON để kiểm tra có field status không
    if (response.data?.success && response.data?.data) {
      const variants = Array.isArray(response.data.data) ? response.data.data : (response.data.data?.content || []);
    }

    if (response.data.success) {
      // Xử lý response - có thể là paginated hoặc array
      const data = response.data.data;
      
      if (Array.isArray(data)) {
        return { success: true, data: data };
      } else if (data?.content) {
        // Paginated response
        return { success: true, data: data.content, pagination: data };
      } else {
        return { success: true, data: [] };
      }
    } else {
      return { success: false, error: response.data.error || 'Không thể tải danh sách biến thể' };
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Lỗi khi tải danh sách biến thể',
    };
  }
};

/**
 * 0.2 ĐẾM VARIANT THEO TRẠNG THÁI (API mới)
 * GET /api/v1/b2c/product-variants/store/{storeId}/count-by-status
 */
export const countProductVariantsByStatus = async (storeId) => {
  try {
    if (!storeId) {
      return { success: false, error: 'storeId is required' };
    }

    const response = await api.get(`/api/v1/b2c/product-variants/store/${storeId}/count-by-status`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không thể đếm biến thể theo trạng thái',
    };
  }
};

/**
 * 0.3 ĐẾM PRODUCTS THEO TRẠNG THÁI (API mới - tương tự orders)
 * GET /api/v1/b2c/products/store/{storeId}/count-by-status
 * ⚠️ API này có thể chưa có trong Swagger, nhưng thử gọi theo pattern tương tự orders
 */
export const countProductsByStatus = async (storeId) => {
  try {
    if (!storeId) {
      return { success: false, error: 'storeId is required' };
    }

    // ✅ Thử endpoint theo pattern tương tự orders: /api/v1/b2c/products/store/{storeId}/count-by-status
    const response = await api.get(`/api/v1/b2c/products/store/${storeId}/count-by-status`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    
    // ✅ Nếu API không tồn tại, trả về error để frontend xử lý (tính từ products hiện tại)
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không thể đếm sản phẩm theo trạng thái',
    };
  }
};

/**
 * 1. TẠO PRODUCT (SẢN PHẨM CHA)
 * POST /api/v1/b2c/products
 */
export const createProduct = async (productData) => {
  try {
    const response = await api.post('/api/v1/b2c/products/create', productData);

    if (response.data.success) {
      return { success: true, data: response.data.data };
    } else {
      return { success: false, error: response.data.error || 'Không thể tạo sản phẩm' };
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Lỗi khi tạo sản phẩm',
    };
  }
};

/**
 * 2. CẬP NHẬT PRODUCT
 * PUT /api/v1/b2c/products/{productId}
 */
export const updateProduct = async (productId, productData) => {
  try {
    const response = await api.put(`/api/v1/b2c/products/update/${productId}`, productData);

    if (response.data.success) {
      return { success: true, data: response.data.data };
    } else {
      return { success: false, error: response.data.error || 'Không thể cập nhật sản phẩm' };
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Lỗi khi cập nhật sản phẩm',
    };
  }
};

/**
 * 3. TẠO PRODUCT VARIANT
 * POST /api/v1/b2c/product-variants
 */
/**
 * 3.1. TẠO PRODUCT VARIANT (với FormData - dùng trong form)
 * POST /api/v1/b2c/product-variants/create
 */
export const createProductVariantWithFormData = async (formData) => {
  try {
    // ✅ Set header multipart/form-data
    const response = await api.post('/api/v1/b2c/product-variants/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (response.data.success) {
      return { success: true, data: response.data.data };
    } else {
      return { success: false, error: response.data.error || 'Không thể tạo variant' };
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Lỗi khi tạo variant',
    };
  }
};

/**
 * 3. TẠO PRODUCT VARIANT (với tham số riêng - dùng trong code)
 * POST /api/v1/b2c/product-variants
 */
export const createProductVariant = async (productId, storeId, variantData, imageFiles = []) => {
  try {

    // Tạo DTO object theo schema ProductVariantDTO
    const dto = {
      productId,
      name: `${variantData.size || ''} ${variantData.color || ''}`.trim() || 'Variant',  // BẮT BUỘC
      price: variantData.price,  // BẮT BUỘC
      stock: variantData.stock || 0,
      description: variantData.description || null,
      attributes: {  // size, color nằm trong attributes
        size: variantData.size || '',
        color: variantData.color || '',
        ram: variantData.ram || '',
        storage: variantData.storage || '',
      }
    };

    // Nếu KHÔNG CÓ ẢNH → Dùng API create-without-image
    if (!imageFiles || imageFiles.length === 0) {
      const response = await api.post('/api/v1/b2c/product-variants/create-without-image', dto);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.error || 'Không thể tạo variant' };
      }
    }

    // Nếu CÓ ẢNH → Dùng API create với multipart/form-data
    const formData = new FormData();

    // Thêm DTO dưới dạng Blob với content-type application/json
    const dtoBlob = new Blob([JSON.stringify(dto)], { type: 'application/json' });
    formData.append('dto', dtoBlob);

    // Thêm images
    imageFiles.forEach((file) => {
      formData.append('images', file);
    });

    // primaryImageIndex cần dạng string (theo API mới)
    const primaryIdx = Math.max(0, Math.min(variantData?.primaryImageIndex ?? 0, imageFiles.length - 1));
    formData.append('primaryImageIndex', String(primaryIdx));

    const response = await api.post('/api/v1/b2c/product-variants/create', formData);

    if (response.data.success) {
      return { success: true, data: response.data.data };
    } else {
      return { success: false, error: response.data.error || 'Không thể tạo variant' };
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Lỗi khi tạo variant',
    };
  }
};

/**
 * 4. CẬP NHẬT PRODUCT VARIANT
 * PUT /api/v1/b2c/product-variants/{variantId}
 */
export const updateProductVariant = async (variantId, variantData, imageFiles = []) => {
  try {

    const formData = new FormData();

    // Thêm DTO dưới dạng Blob
    const dtoBlob = new Blob([JSON.stringify(variantData)], { type: 'application/json' });
    formData.append('dto', dtoBlob);

    // Thêm images nếu có
    if (imageFiles && imageFiles.length > 0) {
      imageFiles.forEach((file) => {
        formData.append('images', file);
      });
    }

    const response = await api.put(`/api/v1/b2c/product-variants/${variantId}`, formData);

    if (response.data.success) {
      return { success: true, data: response.data.data };
    } else {
      return { success: false, error: response.data.error || 'Không thể cập nhật variant' };
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Lỗi khi cập nhật variant',
    };
  }
};

/**
 * 5. CẬP NHẬT GIÁ VARIANT (THEO SWAGGER SPEC)
 * PUT /api/v1/b2c/product-variants/update-price/{id}?newPrice=xxx
 */
export const updateVariantPrice = async (variantId, newPrice) => {
  try {

    // Theo Swagger: PUT /api/v1/b2c/product-variants/update-price/{id}
    // Request body là integer (new price), không phải query params
    const response = await api.put(
      `/api/v1/b2c/product-variants/update-price/${variantId}`,
      Number.isFinite(newPrice) ? Number(newPrice) : 0
    );


    if (response.data.success || response.data) {
      return { success: true, data: response.data.data || response.data };
    } else {
      return { success: false, error: response.data.error || 'Không thể cập nhật giá' };
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Lỗi khi cập nhật giá',
    };
  }
};

/**
 * 6. CẬP NHẬT TỒN KHO VARIANT (THEO SWAGGER SPEC)
 * PUT /api/v1/b2c/product-variants/update-stock/{id}?newStock=xxx
 */
export const updateVariantStock = async (variantId, newStock) => {
  try {

    // Theo Swagger: PUT /api/v1/b2c/product-variants/update-stock/{id}
    // Request body là integer (new stock quantity), không phải query params
    const response = await api.put(
      `/api/v1/b2c/product-variants/update-stock/${variantId}`,
      Number.isFinite(newStock) ? Number(newStock) : 0
    );


    if (response.data.success || response.data) {
      return { success: true, data: response.data.data || response.data };
    } else {
      return { success: false, error: response.data.error || 'Không thể cập nhật tồn kho' };
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Lỗi khi cập nhật tồn kho',
    };
  }
};

/**
 * 7. XÓA PRODUCT VARIANT
 * DELETE /api/v1/b2c/product-variants/delete/{variantId}
 * 
 * Soft delete a product variant by disabling it (sets status to inactive)
 */
export const deleteProductVariant = async (variantId) => {
  try {
    if (!variantId) {
      return {
        success: false,
        error: 'variantId is required',
      };
    }

    // ✅ Dùng DELETE endpoint theo Swagger spec
    const response = await api.delete(`/api/v1/b2c/product-variants/delete/${variantId}`);

    if (response.data?.success !== false) {
      return { success: true, data: response.data?.data || response.data };
    } else {
      return { success: false, error: response.data?.error || response.data?.message || 'Không thể xóa variant' };
    }
  } catch (error) {
    console.error('[deleteProductVariant] Error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || 'Lỗi khi xóa variant',
    };
  }
};

/**
 * 8. THÊM MÀU SẮC CHO PRODUCT VARIANT (THEO SWAGGER SPEC)
 * POST /api/v1/b2c/product-variants/add-colors/{id}
 * ColorOption requires: colorName, price, stock, image (ALL REQUIRED)
 */
export const addColorToVariant = async (variantId, colorData, imageFile) => {
  try {

    const formData = new FormData();

    // Thêm DTO (ColorOption) dưới dạng Blob với content-type application/json
    const colorOptionDto = {
      colorName: colorData.colorName,  // REQUIRED
      price: colorData.price,          // REQUIRED
      stock: colorData.stock,          // REQUIRED
    };
    
    const dtoBlob = new Blob([JSON.stringify(colorOptionDto)], { type: 'application/json' });
    formData.append('dto', dtoBlob);

    // Thêm image (REQUIRED)
    if (imageFile) {
      formData.append('image', imageFile);
    } else {
      throw new Error('Image is required for color option');
    }

    const response = await api.post(`/api/v1/b2c/product-variants/add-colors/${variantId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });


    if (response.data.success || response.data) {
      return { success: true, data: response.data.data || response.data };
    } else {
      return { success: false, error: response.data.error || 'Không thể thêm màu sắc' };
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Lỗi khi thêm màu sắc',
    };
  }
};

/**
 * 9. CẬP NHẬT MÀU SẮC CỦA VARIANT
 * PUT /api/v1/b2c/product-variants/update-colors/{variantId}/color/{colorId}
 *
 * Swagger: multipart/form-data với:
 *  - dto: ColorOption (JSON)  { colorName, price, stock }
 *  - image: file (OPTIONAL)  ảnh màu mới
 *
 * FE: colorData có thể truyền thêm imageFile nếu muốn cập nhật ảnh.
 */
export const updateVariantColor = async (variantId, colorId, colorData = {}) => {
  try {
    if (!variantId || !colorId) {
      return { success: false, error: 'variantId và colorId là bắt buộc' };
    }

    const formData = new FormData();

    const colorOptionDto = {
      colorName: colorData.colorName,
      price: colorData.price,
      stock: colorData.stock,
    };

    const dtoBlob = new Blob([JSON.stringify(colorOptionDto)], { type: 'application/json' });
    formData.append('dto', dtoBlob);

    // Ảnh là OPTIONAL khi update
    if (colorData.imageFile) {
      formData.append('image', colorData.imageFile);
    }

    const response = await api.put(
      `/api/v1/b2c/product-variants/update-colors/${variantId}/color/${colorId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (response.data.success || response.data) {
      return { success: true, data: response.data.data || response.data };
    } else {
      return { success: false, error: response.data.error || 'Không thể cập nhật màu sắc' };
    }
  } catch (error) {
    console.error('❌ [updateVariantColor] Error:', error);
    console.error('❌ [updateVariantColor] Error response:', error.response?.data);
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Lỗi khi cập nhật màu sắc',
    };
  }
};

/**
 * 10. CẬP NHẬT ẢNH CỦA VARIANT
 * PUT /api/v1/b2c/product-variants/update-images/{variantId}?indexPrimary=0
 */
export const updateVariantImages = async (variantId, images, indexPrimary = 0) => {
  try {

    const formData = new FormData();
    images.forEach((image) => {
      formData.append('images', image);
    });

    const primaryIndex = String(indexPrimary);

    const response = await api.put(
      `/api/v1/b2c/product-variants/update-images/${variantId}?indexPrimary=${primaryIndex}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );


    if (response.data.success || response.data) {
      return { success: true, data: response.data.data || response.data };
    } else {
      return { success: false, error: response.data.error || 'Không thể cập nhật ảnh' };
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Lỗi khi cập nhật ảnh',
    };
  }
};

/**
 * ================================================
 * EXPORT DEFAULT
 * ================================================
 */
export default {
  // Store management
  getProductsByStore,
  getProductVariantsByStore,
  
  // Product CRUD
  createProduct,
  updateProduct,
  
  // Variant CRUD
  createProductVariant,
  createProductVariantWithFormData,
  updateProductVariant,
  deleteProductVariant,
  
  // Variant price & stock
  updateVariantPrice,
  updateVariantStock,
  
  // Variant colors
  addColorToVariant,
  updateVariantColor,
  
  // Variant images
  updateVariantImages,
};