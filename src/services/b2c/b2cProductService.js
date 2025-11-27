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
    console.log('📚 [B2C] Getting products for store:', storeId, params);

    const response = await api.get(`/api/v1/b2c/products/${storeId}`, { params });

    console.log('✅ [B2C] Products fetched:', response.data);
    
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
    console.error('❌ [B2C] Error fetching products:', error);
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
    console.log('🎨 [B2C] Getting product variants for store:', storeId, params);

    const response = await api.get(`/api/v1/b2c/product-variants/${storeId}`, { params });

    console.log('✅ [B2C] Product variants fetched:', response.data);
    
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
    console.error('❌ [B2C] Error fetching product variants:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Lỗi khi tải danh sách biến thể',
    };
  }
};

/**
 * 1. TẠO PRODUCT (SẢN PHẨM CHA)
 * POST /api/v1/b2c/products
 */
export const createProduct = async (productData) => {
  try {
    console.log('🆕 [B2C] Creating new product:', productData);

    const response = await api.post('/api/v1/b2c/products/create', productData);

    console.log('✅ [B2C] Product created:', response.data);

    if (response.data.success) {
      return { success: true, data: response.data.data };
    } else {
      return { success: false, error: response.data.error || 'Không thể tạo sản phẩm' };
    }
  } catch (error) {
    console.error('❌ [B2C] Error creating product:', error);
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
    console.log('🔄 [B2C] Updating product:', productId, productData);

    const response = await api.put(`/api/v1/b2c/products/update/${productId}`, productData);

    console.log('✅ [B2C] Product updated:', response.data);

    if (response.data.success) {
      return { success: true, data: response.data.data };
    } else {
      return { success: false, error: response.data.error || 'Không thể cập nhật sản phẩm' };
    }
  } catch (error) {
    console.error('❌ [B2C] Error updating product:', error);
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
    console.log('🆕 [B2C] Creating product variant with FormData');
    
    // ✅ Set header multipart/form-data
    const response = await api.post('/api/v1/b2c/product-variants/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('✅ [B2C] Product variant created:', response.data);
    if (response.data.success) {
      return { success: true, data: response.data.data };
    } else {
      return { success: false, error: response.data.error || 'Không thể tạo variant' };
    }
  } catch (error) {
    console.error('❌ [B2C] Error creating variant:', error);
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
    console.log('🆕 [B2C] Creating product variant:', { productId, storeId, variantData, hasImages: imageFiles?.length > 0 });

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
      console.log('📝 [B2C] Creating variant without images');
      const response = await api.post('/api/v1/b2c/product-variants/create-without-image', dto);
      
      console.log('✅ [B2C] Product variant created (no images):', response.data);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.error || 'Không thể tạo variant' };
      }
    }

    // Nếu CÓ ẢNH → Dùng API create với multipart/form-data
    console.log('📸 [B2C] Creating variant with', imageFiles.length, 'images');
    const formData = new FormData();

    // Thêm DTO dưới dạng Blob với content-type application/json
    const dtoBlob = new Blob([JSON.stringify(dto)], { type: 'application/json' });
    formData.append('dto', dtoBlob);

    // Thêm images
    imageFiles.forEach((file) => {
      formData.append('images', file);
    });

    const response = await api.post('/api/v1/b2c/product-variants/create', formData);

    console.log('✅ [B2C] Product variant created (with images):', response.data);

    if (response.data.success) {
      return { success: true, data: response.data.data };
    } else {
      return { success: false, error: response.data.error || 'Không thể tạo variant' };
    }
  } catch (error) {
    console.error('❌ [B2C] Error creating variant:', error);
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
    console.log('🔄 [B2C] Updating product variant:', variantId, variantData);

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

    console.log('✅ [B2C] Product variant updated:', response.data);

    if (response.data.success) {
      return { success: true, data: response.data.data };
    } else {
      return { success: false, error: response.data.error || 'Không thể cập nhật variant' };
    }
  } catch (error) {
    console.error('❌ [B2C] Error updating variant:', error);
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
    console.log('💰 [B2C] Updating variant price:', variantId, newPrice);

    // Theo Swagger: PUT /api/v1/b2c/product-variants/update-price/{id}
    // Request body là integer (new price), không phải query params
    const response = await api.put(
      `/api/v1/b2c/product-variants/update-price/${variantId}`,
      Number.isFinite(newPrice) ? Number(newPrice) : 0
    );

    console.log('✅ [B2C] Variant price updated:', response.data);

    if (response.data.success || response.data) {
      return { success: true, data: response.data.data || response.data };
    } else {
      return { success: false, error: response.data.error || 'Không thể cập nhật giá' };
    }
  } catch (error) {
    console.error('❌ [B2C] Error updating price:', error);
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
    console.log('📦 [B2C] Updating variant stock:', variantId, newStock);

    // Theo Swagger: PUT /api/v1/b2c/product-variants/update-stock/{id}
    // Request body là integer (new stock quantity), không phải query params
    const response = await api.put(
      `/api/v1/b2c/product-variants/update-stock/${variantId}`,
      Number.isFinite(newStock) ? Number(newStock) : 0
    );

    console.log('✅ [B2C] Variant stock updated:', response.data);

    if (response.data.success || response.data) {
      return { success: true, data: response.data.data || response.data };
    } else {
      return { success: false, error: response.data.error || 'Không thể cập nhật tồn kho' };
    }
  } catch (error) {
    console.error('❌ [B2C] Error updating stock:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Lỗi khi cập nhật tồn kho',
    };
  }
};

/**
 * 7. XÓA PRODUCT VARIANT (SET STATUS DELETED - THEO API MỚI)
 * PUT /api/v1/b2c/product-variants/{variantId}
 * Body: { status: 'DELETED' }
 * 
 * ⚠️ LƯU Ý: Giờ không dùng DELETE endpoint nữa, mà dùng PUT để set status về DELETED
 */
export const deleteProductVariant = async (variantId) => {
  try {
    console.log('🗑️ [B2C] Deleting product variant by setting status DELETED:', variantId);

    // ✅ Dùng PUT endpoint để update status về DELETED thay vì DELETE endpoint
    const response = await api.put(`/api/v1/b2c/product-variants/${variantId}`, {
      status: 'DELETED'
    });

    console.log('✅ [B2C] Product variant status set to DELETED:', response.data);

    if (response.data.success || response.data) {
      return { success: true, data: response.data.data || response.data };
    } else {
      return { success: false, error: response.data.error || 'Không thể xóa variant' };
    }
  } catch (error) {
    console.error('❌ [B2C] Error deleting variant:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Lỗi khi xóa variant',
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
    console.log('🎨 [B2C] Adding color to variant:', variantId, colorData);

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

    console.log('✅ [B2C] Color added to variant:', response.data);

    if (response.data.success || response.data) {
      return { success: true, data: response.data.data || response.data };
    } else {
      return { success: false, error: response.data.error || 'Không thể thêm màu sắc' };
    }
  } catch (error) {
    console.error('❌ [B2C] Error adding color:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Lỗi khi thêm màu sắc',
    };
  }
};

/**
 * 9. CẬP NHẬT MÀU SẮC CỦA VARIANT
 * PUT /api/v1/b2c/product-variants/update-colors/{variantId}/color/{colorId}
 */
export const updateVariantColor = async (variantId, colorId, colorData) => {
  try {
    console.log('🔄 [B2C] Updating variant color:', variantId, colorId, colorData);

    const response = await api.put(
      `/api/v1/b2c/product-variants/update-colors/${variantId}/color/${colorId}`,
      colorData
    );

    console.log('✅ [B2C] Variant color updated:', response.data);

    if (response.data.success || response.data) {
      return { success: true, data: response.data.data || response.data };
    } else {
      return { success: false, error: response.data.error || 'Không thể cập nhật màu sắc' };
    }
  } catch (error) {
    console.error('❌ [B2C] Error updating color:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Lỗi khi cập nhật màu sắc',
    };
  }
};

/**
 * 10. CẬP NHẬT ẢNH CỦA VARIANT
 * PUT /api/v1/b2c/product-variants/update-images/{variantId}?indexPrimary=0
 */
export const updateVariantImages = async (variantId, images, indexPrimary = 0) => {
  try {
    console.log('🖼️ [B2C] Updating variant images:', variantId, images.length, 'images');

    const formData = new FormData();
    images.forEach((image) => {
      formData.append('images', image);
    });

    const response = await api.put(
      `/api/v1/b2c/product-variants/update-images/${variantId}?indexPrimary=${indexPrimary}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log('✅ [B2C] Variant images updated:', response.data);

    if (response.data.success || response.data) {
      return { success: true, data: response.data.data || response.data };
    } else {
      return { success: false, error: response.data.error || 'Không thể cập nhật ảnh' };
    }
  } catch (error) {
    console.error('❌ [B2C] Error updating images:', error);
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