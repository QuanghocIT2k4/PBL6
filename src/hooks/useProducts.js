import useSWR, { useSWRConfig } from 'swr';
import { getCategories, getProductVariantsByCategory, searchProductVariants } from '../services/common/productService';

/**
 * ✅ SWR Fetcher cho Products - DÙNG PRODUCT VARIANTS TRỰC TIẾP
 * 🎯 Strategy mới: Lấy product-variants luôn (đã có ảnh + giá)
 * ⚡ Loại bỏ N+1 problem (trước đây: 1 query products + N queries variants)
 */
const productsFetcher = async ([type, category, options]) => {
  let categoryName = null;
  
  // ✅ Xử lý category
  if (category && category !== 'all' && category !== 'featured' && category !== 'hero') {
    const categoriesResult = await getCategories();
    if (categoriesResult.success) {
      const foundCategory = categoriesResult.data.find(
        cat => cat.name.toLowerCase() === category.toLowerCase() || 
              cat.key === category ||
              cat.id === category
      );
      if (foundCategory) categoryName = foundCategory.name;
      else categoryName = category;
    }
  }
  
  // ✅ GỌI TRỰC TIẾP API PRODUCT VARIANTS (có ảnh + giá)
  let result;
  
  if (categoryName) {
    // Nếu có category, dùng API filter theo category
    result = await getProductVariantsByCategory(categoryName, options);
  } else {
    // Nếu không có category, dùng search API với empty query
    result = await searchProductVariants({
      name: '',
      page: options.page || 0,
      size: options.size || 100,
      sortBy: options.sortBy || 'createdAt',
      sortDir: options.sortDir || 'desc',
    });
  }
  
  if (!result.success) {
    throw new Error(result.error || 'Không thể tải sản phẩm');
  }
  
  return result.data;
};

/**
 * ✅ Hook chính - Dùng SWR thay vì useState/useEffect
 * @param {string} category - Category key (laptops, smartphones, audio, tv, camera, accessories, all)
 * @param {object} options - Tùy chọn phân trang, filter
 */
export const useProducts = (category, options = {}) => {
  const {
    page = 0,
    size = 100,
    sortBy = 'createdAt',
    sortDir = 'desc',
  } = options;

  const { data, error, isLoading } = useSWR(
    ['products', category, { page, size, sortBy, sortDir }],
    productsFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // Cache 5 phút
      revalidateIfStale: false,
      shouldRetryOnError: false,
      keepPreviousData: true, // Giữ data cũ khi fetch mới
    }
  );

  // Parse response data
  const products = data?.content || data || [];
  const pagination = {
    currentPage: data?.number || 0,
    totalPages: data?.totalPages || 1,
    totalElements: data?.totalElements || products.length,
    pageSize: data?.size || size,
  };

  return {
    products,
    loading: isLoading,
    error: error?.message,
    pagination,
  };
};

/**
 * ✅ Hook để prefetch products (dùng cho hover effects)
 */
export const usePrefetchProducts = () => {
  const { mutate } = useSWRConfig();
  
  const prefetch = (category, size = 100) => {
    const key = ['products', category, { page: 0, size, sortBy: 'createdAt', sortDir: 'desc' }];
    
    // ✅ SỬA: Gọi fetcher với key đúng format (mảng 3 phần tử)
    mutate(
      key,
      () => productsFetcher(key), // ← QUAN TRỌNG: Truyền key vào fetcher
      { revalidate: false }
    );
  };
  
  return prefetch;
};