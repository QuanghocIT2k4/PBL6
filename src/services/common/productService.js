import api from './api';

/**
 * ================================================
 * PRODUCT SERVICE - QUẢN LÝ API SẢN PHẨM
 * ================================================
 * Các API công khai (không cần token):
 * - GET /api/v1/products - Lấy danh sách sản phẩm
 * - GET /api/v1/products/{id} - Chi tiết sản phẩm
 * - GET /api/v1/product-variants - Danh sách variants
 * - GET /api/v1/product-variants/{id} - Chi tiết variant
 * - GET /api/v1/categories - Danh sách danh mục
 * - GET /api/v1/brands - Danh sách thương hiệu
 * 
 * ✅ Uses centralized api.js for:
 * - Consistent baseURL configuration  
 * - Automatic JWT token attachment (for authorized endpoints)
 * - Unified error handling & retry logic (502/503/504 auto-retry)
 */

/**
 * ================================================
 * 1. LẤY DANH SÁCH SẢN PHẨM (CÓ PHÂN TRANG, FILTER, SORT)
 * ================================================
 * ⚠️ LƯU Ý: BE có 2 endpoints:
 * - GET /api/v1/products?name=... - TÌM KIẾM theo tên (name là required)
 * - GET /api/v1/products/category/{categoryName} - LẤY theo category
 * 
 * Vì BE không có endpoint "get all products", ta sẽ dùng:
 * - Nếu có categoryId → gọi /products/category/{name}
 * - Nếu không → gọi /products?name= (empty string để lấy tất cả)
 */
export const getProducts = async (params = {}) => {
  try {
    const {
      page = 0,
      size = 20,
      sortBy = 'createdAt',
      sortDir = 'desc',
      categoryId,
      categoryName,
    } = params;

    let response;
    
    // ✅ Strategy: Nếu có categoryName → dùng endpoint category
    if (categoryName) {
      response = await api.get(`/api/v1/products/category/${categoryName}`, {
        params: {
          page,
          size,
          sortBy,
          sortDir,
        },
      });
    } else {
      // ✅ Fallback: dùng search với name rỗng để lấy tất cả
      response = await api.get('/api/v1/products', {
        params: {
          name: '', // ← Gửi empty string thay vì không gửi
          page,
          size,
          sortBy,
          sortDir,
        },
      });
    }

    // BE trả về: ApiResponse<Page<ProductResponse>>
    if (response.data.success) {
      return {
        success: true,
        data: response.data.data, // Page object
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Không thể tải danh sách sản phẩm',
      };
    }
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * ================================================
 * 2. LẤY CHI TIẾT SẢN PHẨM
 * ================================================
 * GET /api/v1/products/{id}
 */
export const getProductById = async (productId) => {
  try {
    const response = await api.get(`/api/v1/products/${productId}`);

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Không tìm thấy sản phẩm',
      };
    }
  } catch (error) {
    console.error('❌ Error fetching product detail:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * ================================================
 * 3. LẤY DANH SÁCH PRODUCT VARIANTS
 * ================================================
 * ✅ Nếu có productId → GET /api/v1/product-variants/product/{productId}
 * ✅ Nếu không → GET /api/v1/product-variants/latest
 */
export const getProductVariants = async (params = {}) => {
  try {
    const {
      page = 0,
      size = 20,
      sortBy = 'createdAt',
      sortDir = 'desc',
      productId, // Lọc theo productId nếu cần
    } = params;

    let response;
    
    // ✅ Nếu có productId, dùng endpoint /product/{productId}
    if (productId) {
      response = await api.get(`/api/v1/product-variants/product/${productId}`, {
        params: {
          page,
          size,
          sortBy,
          sortDir,
        },
      });
    } else {
      // ✅ Nếu không có productId, dùng endpoint /latest
      response = await api.get('/api/v1/product-variants/latest', {
        params: {
          page,
          size,
          sortBy,
          sortDir,
        },
      });
    }

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Không thể tải variants',
      };
    }
  } catch (error) {
    console.error('❌ Error fetching variants:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * ================================================
 * 3.5. LẤY PRODUCT VARIANTS THEO CATEGORY
 * ================================================
 * GET /api/v1/product-variants/category/{category}
 * ✅ GỌI TRỰC TIẾP API TỪ BACKEND
 */
export const getProductVariantsByCategory = async (params = {}) => {
  try {
    const {
      page = 0,
      size = 20,
      sortBy = 'createdAt',
      sortDir = 'desc',
      categoryName,
    } = params;

    if (!categoryName) {
      return { success: false, error: 'Category name is required' };
    }

    // ✅ GỌI TRỰC TIẾP API PRODUCT VARIANTS THEO CATEGORY
    const response = await api.get(`/api/v1/product-variants/category/${categoryName}`, {
      params: {
        page,
        size,
        sortBy,
        sortDir,
      },
    });

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data, // Page object từ BE
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Không thể tải variants',
      };
    }
  } catch (error) {
    console.error('❌ Error fetching variants by category:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * ================================================
 * 3.6. LẤY LATEST PRODUCT VARIANTS
 * ================================================
 * GET /api/v1/product-variants/latest
 * 
 * ⚠️ LƯU Ý: API default size đã thay đổi từ 2 → 15
 * Code này truyền size rõ ràng nên không bị ảnh hưởng
 */
export const getLatestProductVariants = async (params = {}) => {
  try {
    const {
      page = 0,
      size = 20, // Default trong code (API default = 15)
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = params;

    const response = await api.get('/api/v1/product-variants/latest', {
      params: {
        page,
        size,
        sortBy,
        sortDir,
      },
    });

    if (response.data.success) {
      // ✅ response.data.data là PageObject có: totalElements, totalPages, content, number, size
      return {
        success: true,
        data: response.data.data, // PageObject từ BE
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Không thể tải variants',
      };
    }
  } catch (error) {
    console.error('❌ Error fetching latest variants:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * ================================================
 * 3.7. TÌM KIẾM PRODUCT VARIANTS
 * ================================================
 * GET /api/v1/product-variants/search?name=...
 */
export const searchProductVariants = async (params = {}) => {
  try {
    const {
      name = '',
      page = 0,
      size = 20,
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = params;

    const response = await api.get('/api/v1/product-variants/search', {
      params: {
        name,
        page,
        size,
        sortBy,
        sortDir,
      },
    });

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Không tìm thấy kết quả',
      };
    }
  } catch (error) {
    console.error('❌ Error searching variants:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * ================================================
 * 3.5. LẤY PRODUCT VARIANTS BY STORE
 * ================================================
 * GET /api/v1/product-variants/store/{storeId}
 */
export const getProductVariantsByStore = async (storeId, params = {}) => {
  try {
    const {
      page = 0,
      size = 20,
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = params;

    const response = await api.get(`/api/v1/product-variants/store/${storeId}`, {
      params: {
        page,
        size,
        sortBy,
        sortDir,
      },
    });

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Không tìm thấy sản phẩm',
      };
    }
  } catch (error) {
    console.error('❌ Error fetching store variants:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * ================================================
 * 3.8. LỌC PRODUCT VARIANTS THEO CATEGORY & BRAND
 * ================================================
 * GET /api/v1/product-variants/category/{category}/brand/{brand}
 * 
 * @description
 * Lọc sản phẩm theo cả category (danh mục) VÀ brand (thương hiệu) cùng lúc.
 * Giúp người dùng tìm kiếm chính xác hơn với bộ lọc kép.
 * 
 * @param {string} category - Tên category (VD: "Laptop", "Smartphone")
 * @param {string} brand - Tên brand (VD: "Dell", "Samsung", "Apple")
 * @param {Object} params - Query parameters
 * @param {number} params.page - Số trang (default: 0)
 * @param {number} params.size - Số items/trang (default: 20)
 * @param {string} params.sortBy - Trường sắp xếp (default: 'createdAt')
 * @param {string} params.sortDir - Hướng sắp xếp: 'asc' | 'desc' (default: 'desc')
 * 
 * @returns {Promise<Object>} { success: boolean, data: Page<ProductVariant> | null, error?: string }
 * 
 * @example
 * // Tìm Laptop Dell
 * const result = await getProductVariantsByCategoryAndBrand('Laptop', 'Dell', {
 *   page: 0,
 *   size: 20,
 *   sortBy: 'price',
 *   sortDir: 'asc'
 * });
 * 
 * @example
 * // Tìm Smartphone Samsung
 * const result = await getProductVariantsByCategoryAndBrand('Smartphone', 'Samsung');
 */
export const getProductVariantsByCategoryAndBrand = async (category, brand, params = {}) => {
  try {
    const {
      page = 0,
      size = 20,
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = params;

    // Validate input
    if (!category || category.trim() === '') {
      return {
        success: false,
        error: 'Category là bắt buộc',
      };
    }

    if (!brand || brand.trim() === '') {
      return {
        success: false,
        error: 'Brand là bắt buộc',
      };
    }

    const response = await api.get(`/api/v1/product-variants/category/${encodeURIComponent(category)}/brand/${encodeURIComponent(brand)}`, {
      params: {
        page,
        size,
        sortBy,
        sortDir,
      },
    });

    // Handle response
    if (response.data.success) {
      return {
        success: true,
        data: response.data.data, // Page<ProductVariantResponse>
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Không tìm thấy sản phẩm phù hợp',
      };
    }
  } catch (error) {
    console.error('❌ Error fetching variants by category & brand:', error);
    return {
      success: false,
      error: error.message || 'Lỗi khi lọc sản phẩm',
    };
  }
};

/**
 * ================================================
 * 4. LẤY CHI TIẾT PRODUCT VARIANT
 * ================================================
 * GET /api/v1/product-variants/{id}
 */
export const getProductVariantById = async (variantId) => {
  try {
    console.log('🌐 API Call: GET /api/v1/product-variants/' + variantId);
    const response = await api.get(`/api/v1/product-variants/${variantId}`);
    console.log('📥 API Response:', response.status, response.data);

    if (response.data.success) {
      console.log('✅ Variant data:', response.data.data?.id || response.data.data?.variantId);
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      console.warn('⚠️ API returned success:false', response.data);
      return {
        success: false,
        error: response.data.error || 'Không tìm thấy variant',
      };
    }
  } catch (error) {
    console.error('❌ Error fetching variant detail:', error);
    console.error('❌ Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    return {
      success: false,
      error: error.message || 'Lỗi khi tải variant',
    };
  }
};

/**
 * ================================================
 * 5. LẤY DANH SÁCH CATEGORIES (DANH MỤC)
 * ================================================
 * GET /api/v1/categories
 * ✅ CÓ CACHE - Chỉ fetch 1 lần đầu tiên
 */

// Cache categories để tránh fetch nhiều lần
let categoriesCache = null;
let categoriesCacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

export const getCategories = async (params = {}) => {
  try {
    // ✅ Kiểm tra cache
    const now = Date.now();
    if (categoriesCache && categoriesCacheTime && (now - categoriesCacheTime < CACHE_DURATION)) {
      return {
        success: true,
        data: categoriesCache,
      };
    }

    const response = await api.get('/api/v1/categories/all');

    // ✅ Backend trả về List<CategoryDTO> trực tiếp (ResponseEntity.ok(categoryDTOs))
    // KHÔNG có ApiResponse wrapper
    let categories = [];
    
    if (Array.isArray(response.data)) {
      // ✅ Nếu là array trực tiếp
      categories = response.data;
    } else if (response.data?.success && response.data?.data) {
      // ✅ Nếu có ApiResponse wrapper (fallback)
      const data = response.data.data;
      categories = Array.isArray(data) ? data : data.content || [];
    } else {
      console.error('❌ Unexpected response format:', response.data);
      return {
        success: false,
        error: 'Unexpected response format',
      };
    }
    
    // ✅ Lưu vào cache
    categoriesCache = categories;
    categoriesCacheTime = now;
    
    return {
      success: true,
      data: categories,
    };
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * ================================================
 * 6. LẤY CHI TIẾT CATEGORY
 * ================================================
 * GET /api/v1/categories/{id}
 */
export const getCategoryById = async (categoryId) => {
  try {
    const response = await api.get(`/api/v1/categories/${categoryId}`);

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Không tìm thấy danh mục',
      };
    }
  } catch (error) {
    console.error('❌ Error fetching category:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * ================================================
 * 7. LẤY DANH SÁCH BRANDS (THƯƠNG HIỆU)
 * ================================================
 * GET /api/v1/brands (có phân trang)
 */
export const getBrands = async (params = {}) => {
  try {
    const {
      page = 0,
      size = 100, // Lấy hết brands
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

    // BE có thể trả về array hoặc page object
    if (response.data.success) {
      const data = response.data.data;
      return {
        success: true,
        data: Array.isArray(data) ? data : data.content || [],
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Không thể tải thương hiệu',
      };
    }
  } catch (error) {
    console.error('❌ Error fetching brands:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * ================================================
 * 7.1. LẤY TẤT CẢ BRANDS (KHÔNG PHÂN TRANG)
 * ================================================
 * GET /api/v1/brands/all
 * 
 * @description
 * Lấy danh sách đầy đủ tất cả brands (không phân trang) để hiển thị trang
 * "Thương hiệu nổi tiếng" hoặc dropdown filter.
 * 
 * @returns {Promise<Object>} { success: boolean, data: Brand[] }
 * 
 * @example
 * const result = await getAllBrands();
 * if (result.success) {
 *   console.log('Brands:', result.data); // Array of all brands
 * }
 */
export const getAllBrands = async () => {
  try {
    const response = await api.get('/api/v1/brands/all');

    // ✅ Response format: Array<BrandDTO> trực tiếp (không có ApiResponse wrapper)
    if (Array.isArray(response.data)) {
      return {
        success: true,
        data: response.data, // Array<BrandDTO>
      };
    } else {
      console.error('❌ Unexpected brands response format:', response.data);
      return {
        success: false,
        error: 'Unexpected response format',
      };
    }
  } catch (error) {
    console.error('❌ Error fetching brands:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * ================================================
 * 8. LẤY CHI TIẾT BRAND
 * ================================================
 * GET /api/v1/brands/{id}
 */
export const getBrandById = async (brandId) => {
  try {
    const response = await api.get(`/api/v1/brands/${brandId}`);

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Không tìm thấy thương hiệu',
      };
    }
  } catch (error) {
    console.error('❌ Error fetching brand:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * ================================================
 * 9. LỌC PRODUCTS THEO CATEGORY & BRAND
 * ================================================
 * GET /api/v1/products/category/{category}/brand/{brand}
 * 
 * @description
 * Lọc PRODUCTS (không phải variants) theo cả category VÀ brand cùng lúc.
 * Khác với getProductVariantsByCategoryAndBrand, API này trả về Product objects.
 * 
 * @param {string} category - Tên category (VD: "Laptop", "Smartphone")
 * @param {string} brand - Tên brand (VD: "Dell", "Samsung", "Apple")
 * @param {Object} params - Query parameters
 * @param {number} params.page - Số trang (default: 0)
 * @param {number} params.size - Số items/trang (default: 20)
 * @param {string} params.sortBy - Trường sắp xếp (default: 'createdAt')
 * @param {string} params.sortDir - Hướng sắp xếp: 'asc' | 'desc' (default: 'desc')
 * 
 * @returns {Promise<Object>} { success: boolean, data: Page<Product> | null, error?: string }
 * 
 * @example
 * // Tìm Product Laptop Dell
 * const result = await getProductsByCategoryAndBrand('Laptop', 'Dell', {
 *   page: 0,
 *   size: 20,
 *   sortBy: 'name',
 *   sortDir: 'asc'
 * });
 * 
 * @example
 * // Tìm Product Smartphone Samsung
 * const result = await getProductsByCategoryAndBrand('Smartphone', 'Samsung');
 */
export const getProductsByCategoryAndBrand = async (category, brand, params = {}) => {
  try {
    const {
      page = 0,
      size = 20,
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = params;

    // Validate input
    if (!category || category.trim() === '') {
      return {
        success: false,
        error: 'Category là bắt buộc',
      };
    }

    if (!brand || brand.trim() === '') {
      return {
        success: false,
        error: 'Brand là bắt buộc',
      };
    }

    const response = await api.get(`/api/v1/products/category/${encodeURIComponent(category)}/brand/${encodeURIComponent(brand)}`, {
      params: {
        page,
        size,
        sortBy,
        sortDir,
      },
    });

    // Handle response
    if (response.data.success) {
      return {
        success: true,
        data: response.data.data, // Page<ProductResponse>
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Không tìm thấy sản phẩm phù hợp',
      };
    }
  } catch (error) {
    console.error('❌ Error fetching products by category & brand:', error);
    return {
      success: false,
      error: error.message || 'Lỗi khi lọc sản phẩm',
    };
  }
};

/**
 * ================================================
 * 10. TÌM KIẾM SẢN PHẨM
 * ================================================
 * GET /api/v1/products?name={keyword}
 * Query params:
 *   - name: từ khóa tìm kiếm
 *   - page, size, sortBy, sortDir
 */
export const searchProducts = async (params = {}) => {
  try {
    const {
      keyword = '',
      page = 0,
      size = 20,
      sortBy = 'createdAt',
      sortDir = 'desc',
      categoryId,
      brandId,
      minPrice,
      maxPrice,
    } = params;

    const response = await api.get('/api/v1/products', {
      params: {
        name: keyword,
        page,
        size,
        sortBy,
        sortDir,
      },
    });

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Không tìm thấy kết quả',
      };
    }
  } catch (error) {
    console.error('❌ Error searching products:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Export default object (backward compatibility với code cũ)
export const productService = {
  getProducts,
  getProductById,
  getProductsByCategoryAndBrand,
  getProductVariants,
  getProductVariantById,
  getProductVariantsByCategory,
  getProductVariantsByStore,
  getProductVariantsByCategoryAndBrand,
  getLatestProductVariants,
  searchProductVariants,
  getCategories,
  getCategoryById,
  getBrands,
  getAllBrands,
  getBrandById,
  searchProducts,
  
  // Alias methods cho các tên cũ (để không phá vỡ code cũ)
  getAllProducts: getProducts,
  getProductsByCategory: (category, limit) => getProducts({ categoryId: category, size: limit }),
  getFeaturedProducts: (limit) => getProducts({ size: limit, sortBy: 'createdAt' }),
  getHeroProducts: () => getProducts({ size: 5, sortBy: 'createdAt' }),
};

export default productService;
