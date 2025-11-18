import useSWR, { useSWRConfig } from 'swr';
import { getProductVariantsByCategory, getLatestProductVariants, getCategories } from '../services/common/productService';

// ✅ Key mapping: Frontend key → Backend API name
const KEY_TO_API_NAME = {
  'smartphones': 'Phone',
  'laptops': 'Laptop',
  'audio': 'Earphone',
  'loudspeaker': 'Loudspeaker',
  'watch': 'Watch',
  'camera': 'Camera',
  'tv': 'TV',
  'tablets': 'Tablet',
  'accessories': 'Accessories'
};

/**
 * ✅ SWR Fetcher cho Product Variants
 * Dùng API trực tiếp từ backend theo Swagger
 */
const variantsFetcher = async ([type, category, options]) => {
  let categoryName = null;
  
  // ✅ Xử lý category - Map key sang backend API name
  if (category && category !== 'all' && category !== 'featured' && category !== 'hero' && category !== 'latest') {
    // ✅ Ưu tiên dùng hardcoded mapping (nhanh nhất)
    if (KEY_TO_API_NAME[category]) {
      categoryName = KEY_TO_API_NAME[category];
      console.log('🔍 Category mapping:', { key: category, apiName: categoryName });
    } else {
      // ✅ Fallback: Gọi API để tìm (nếu category mới không có trong mapping)
      const categoriesResult = await getCategories({ page: 0, size: 100 });
      if (categoriesResult.success) {
        const apiCategory = categoriesResult.data.find(
          cat => cat.name.toLowerCase() === category.toLowerCase() || 
                cat.description?.toLowerCase() === category.toLowerCase() ||
                cat.id === category
        );
        if (apiCategory) {
          categoryName = apiCategory.name;
          console.log('🔍 Category from API:', { key: category, name: categoryName });
        } else {
          categoryName = category; // Nếu không tìm thấy, dùng chính nó
          console.warn('⚠️ Category not found, using as-is:', category);
        }
      } else {
        categoryName = category; // Fallback cuối cùng
        console.warn('⚠️ Failed to fetch categories, using as-is:', category);
      }
    }
  }
  
  // ✅ Nếu là latest hoặc featured, dùng latest variants API
  if (category === 'latest' || category === 'featured' || category === 'hero') {
    const result = await getLatestProductVariants(options);
    if (!result.success) {
      throw new Error(result.error || 'Không thể tải variants');
    }
    return result.data;
  }
  
  // ✅ Nếu là 'all', lấy latest variants
  if (category === 'all' || !categoryName) {
    const result = await getLatestProductVariants(options);
    if (!result.success) {
      throw new Error(result.error || 'Không thể tải variants');
    }
    return result.data;
  }
  
  // ✅ Lấy variants theo category
  const result = await getProductVariantsByCategory({ ...options, categoryName });
  
  if (!result.success) {
    throw new Error(result.error || 'Không thể tải variants');
  }
  
  return result.data;
};

/**
 * ✅ Hook chính - Dùng SWR để fetch Product Variants
 * @param {string} category - Category key (laptops, smartphones, audio, tv, camera, accessories, all, latest, featured, hero)
 * @param {object} options - Tùy chọn phân trang, filter
 */
export const useProductVariants = (category, options = {}) => {
  const {
    page = 0,
    size = 100, // ✅ Giảm default size xuống 100 để tránh timeout
    sortBy = 'createdAt',
    sortDir = 'desc',
  } = options;

  const { data, error, isLoading } = useSWR(
    ['product-variants', category, { page, size, sortBy, sortDir }],
    variantsFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 600000, // ✅ Tăng cache lên 10 phút (vì BE chậm, cache lâu hơn)
      revalidateIfStale: false,
      shouldRetryOnError: false,
      errorRetryCount: 0, // ✅ Không retry (vì BE chậm, retry sẽ làm chậm hơn)
      keepPreviousData: true, // ✅ Giữ data cũ khi fetch mới → UX mượt hơn
      revalidateOnMount: true,
      fallbackData: undefined,
      // ✅ Tối ưu: Loading timeout - nếu quá 5s thì coi như đang load (để hiển thị data cũ)
      loadingTimeout: 5000,
    }
  );

  // Parse response data
  // ✅ Kiểm tra cẩn thận: data có thể là {}, phải check Array.isArray
  let variants = [];
  let totalElementsFromAPI = undefined;
  let totalPagesFromAPI = undefined;
  let currentPageFromAPI = undefined;
  
  if (!data) {
    // Data chưa load (SWR đang fetch) → trả về empty array
    variants = [];
  } else if (Array.isArray(data?.content)) {
    // ✅ Paginated response: có content array
    variants = data.content;
    // ✅ Backend trả về structure: { content: [...], page: {...} }
    // Lấy pagination metadata từ data.page hoặc data (nếu có ở top level)
    if (data.page && typeof data.page === 'object') {
      // ✅ Structure mới: pagination metadata nằm trong page object
      totalElementsFromAPI = data.page.totalElements !== undefined ? data.page.totalElements : undefined;
      totalPagesFromAPI = data.page.totalPages !== undefined ? data.page.totalPages : undefined;
      currentPageFromAPI = data.page.number !== undefined ? data.page.number : undefined;
    } else {
      // ✅ Fallback: thử lấy từ top level (structure cũ)
      totalElementsFromAPI = data.totalElements !== undefined ? data.totalElements : undefined;
      totalPagesFromAPI = data.totalPages !== undefined ? data.totalPages : undefined;
      currentPageFromAPI = data.number !== undefined ? data.number : undefined;
    }
  } else if (Array.isArray(data)) {
    // ✅ Array trực tiếp (không có pagination metadata)
    variants = data;
  } else if (data && typeof data === 'object') {
    // ✅ Có thể là object với structure khác, thử tìm content
    if (Array.isArray(data.content)) {
      variants = data.content;
      // ✅ Backend trả về structure: { content: [...], page: {...} }
      if (data.page && typeof data.page === 'object') {
        // ✅ Structure mới: pagination metadata nằm trong page object
        totalElementsFromAPI = data.page.totalElements !== undefined ? data.page.totalElements : undefined;
        totalPagesFromAPI = data.page.totalPages !== undefined ? data.page.totalPages : undefined;
        currentPageFromAPI = data.page.number !== undefined ? data.page.number : undefined;
      } else {
        // ✅ Fallback: thử lấy từ top level (structure cũ)
        totalElementsFromAPI = data.totalElements !== undefined ? data.totalElements : undefined;
        totalPagesFromAPI = data.totalPages !== undefined ? data.totalPages : undefined;
        currentPageFromAPI = data.number !== undefined ? data.number : undefined;
      }
    } else {
      // ✅ Có thể là object chứa array trực tiếp (không có wrapper content)
      // Thử tìm các key có thể chứa array
      const arrayKeys = Object.keys(data).filter(key => Array.isArray(data[key]));
      if (arrayKeys.length > 0) {
        // Lấy array đầu tiên tìm thấy
        variants = data[arrayKeys[0]];
        console.log(`⚠️ Using array from key "${arrayKeys[0]}" (no content wrapper)`);
        // ✅ Thử lấy pagination từ page object nếu có
        if (data.page && typeof data.page === 'object') {
          totalElementsFromAPI = data.page.totalElements !== undefined ? data.page.totalElements : undefined;
          totalPagesFromAPI = data.page.totalPages !== undefined ? data.page.totalPages : undefined;
          currentPageFromAPI = data.page.number !== undefined ? data.page.number : undefined;
        }
      } else {
        console.warn('⚠️ Unexpected data format (object but no content or array):', data);
        variants = [];
      }
    }
  } else {
    console.warn('⚠️ Unexpected data format (not array or paginated):', data);
    variants = [];
  }
  
  // ✅ Debug: Log API response để kiểm tra totalElements
  console.log('🔍 useProductVariants - API Response:', {
    hasData: !!data,
    dataType: typeof data,
    dataKeys: data ? Object.keys(data) : [],
    totalElements: totalElementsFromAPI,
    totalPages: totalPagesFromAPI,
    number: currentPageFromAPI,
    size: data?.size || data?.page?.size,
    contentLength: variants.length,
    // ✅ Log chi tiết để debug
    hasContent: Array.isArray(data?.content),
    hasPage: !!data?.page,
    pageKeys: data?.page ? Object.keys(data.page) : [],
    hasTotalElements: 'totalElements' in (data || {}) || 'totalElements' in (data?.page || {}),
    hasTotalPages: 'totalPages' in (data || {}) || 'totalPages' in (data?.page || {}),
    pageObject: data?.page,
    fullData: data
  });
  
  const pagination = {
    currentPage: currentPageFromAPI !== undefined ? currentPageFromAPI : 0,
    totalPages: totalPagesFromAPI !== undefined ? totalPagesFromAPI : 1,
    // ✅ Lấy totalElements từ API response
    totalElements: totalElementsFromAPI,
    pageSize: data?.page?.size || data?.size || size,
  };

  // ✅ Transform variants để tương thích với ProductSection component
  const transformedVariants = variants.map((variant) => ({
    // ✅ Spread ...variant TRƯỚC để giữ nguyên TẤT CẢ fields từ API
    ...variant,
    // ✅ Override/thêm các field cần thiết cho UI
    id: variant.id,
    name: variant.name,
    images: variant.images || (variant.primaryImage ? [variant.primaryImage] : []),
    image: variant.primaryImage || variant.images?.[0] || null,
    price: variant.price || 0,
    stock: variant.stock || 0,
    variantId: variant.id,
  }));

  return {
    variants: transformedVariants,
    products: transformedVariants, // Alias để tương thích với code cũ (dùng như products)
    loading: isLoading,
    error: error?.message,
    pagination,
    totalElements: pagination.totalElements, // ✅ Trả về totalElements để dùng cho "Xem thêm"
  };
};

/**
 * ✅ Hook để prefetch variants (dùng cho hover effects)
 */
export const usePrefetchVariants = () => {
  const { mutate } = useSWRConfig();
  
  const prefetch = (category, size = 100) => {
    const key = ['product-variants', category, { page: 0, size, sortBy: 'createdAt', sortDir: 'desc' }];
    
    mutate(
      key,
      () => variantsFetcher(key),
      { revalidate: false }
    );
  };
  
  return prefetch;
};

export default useProductVariants;

