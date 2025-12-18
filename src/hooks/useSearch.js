import useSWR from 'swr';
import { searchProductVariants, getCategories } from '../services/common/productService';

/**
 * ✅ SWR Fetcher cho Search
 * 🎯 Dùng searchProductVariants vì Product không có ảnh và giá
 */
const searchFetcher = async ({ keyword, filters }) => {
  const parsePrice = (s) => {
    if (!s) return undefined;
    const digits = String(s).replace(/[^0-9]/g, '');
    return digits ? parseInt(digits, 10) : undefined;
  };

  // ✅ Gọi API search product variants (có ảnh + giá)
  try {
    const result = await searchProductVariants({
      name: keyword || '', // ✅ Đảm bảo luôn có giá trị (ít nhất là empty string)
      page: filters.page || 0,
      size: filters.size || 50,
      sortBy: filters.sortBy === 'price-asc' || filters.sortBy === 'price-desc' ? 'price' : 
              filters.sortBy === 'name' ? 'name' : 'createdAt',
      sortDir: filters.sortBy === 'price-asc' ? 'asc' : 'desc',
    });
    
    if (result.success) {
      let products = [];
      let total = 0;
      let totalPages = 1;
      
      const data = result.data;
      if (data && data.content && Array.isArray(data.content)) {
        // ✅ Trường hợp response là Page object
        products = data.content;
        total = data.totalElements || data.content.length || 0;
        totalPages = data.totalPages || 1;
      } else if (Array.isArray(data)) {
        // ✅ Trường hợp response là array trực tiếp
        products = data;
        total = data.length;
        totalPages = 1;
      } else if (data && typeof data === 'object') {
        // ✅ Trường hợp data là object nhưng không có content, thử lấy trực tiếp
        console.warn('⚠️ Unexpected data format from search API:', data);
        products = [];
        total = 0;
        totalPages = 0;
      }

      // ✅ Filter trên frontend (vì API product-variants/search không hỗ trợ filter)
      let filteredProducts = products;

    // Filter by category
    if (filters.category && filters.category !== 'all') {
      filteredProducts = filteredProducts.filter(p => {
        const categoryName = p.product?.category?.name || p.categoryName || '';
        return categoryName.toLowerCase().includes(filters.category.toLowerCase());
      });
    }

    // Filter by brands
    if (filters.brands && filters.brands.length > 0) {
      filteredProducts = filteredProducts.filter(p => {
        const productName = (p.name || p.productName || '').toLowerCase();
        const brandName = (p.product?.brand?.name || p.brandName || '').toLowerCase();
        return filters.brands.some(brand => 
          productName.includes(brand.toLowerCase()) || 
          brandName.includes(brand.toLowerCase())
        );
      });
    }

    // Filter by price range
    const minPrice = parsePrice(filters.minPrice);
    const maxPrice = parsePrice(filters.maxPrice);
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      filteredProducts = filteredProducts.filter(p => {
        const price = typeof p.price === 'string' 
          ? parseInt(p.price.replace(/[^0-9]/g, '')) 
          : parseInt(p.price || 0);
        
        if (minPrice !== undefined && price < minPrice) return false;
        if (maxPrice !== undefined && price > maxPrice) return false;
        return true;
      });
    }

      return {
        products: filteredProducts,
        total: filteredProducts.length,
        totalPages: Math.ceil(filteredProducts.length / (filters.size || 50)),
      };
    } else {
      // ✅ API trả về success: false hoặc có lỗi
      console.error('❌ Search API returned success: false', result);
      return {
        products: [],
        total: 0,
        totalPages: 0,
      };
    }
  } catch (error) {
    // ✅ Xử lý lỗi khi gọi API
    console.error('❌ Error in searchFetcher:', error);
    return {
      products: [],
      total: 0,
      totalPages: 0,
    };
  }
};

/**
 * ✅ Hook chính - Dùng SWR thay vì useState/useEffect
 * @param {string} keyword - Từ khóa tìm kiếm
 * @param {object} filters - Bộ lọc (category, price, sortBy, etc.)
 */
export const useSearch = (keyword, filters = {}) => {
  // ✅ Chỉ gọi API khi có keyword (không rỗng sau khi trim)
  const shouldFetch = keyword && keyword.trim().length > 0;
  
  const { data, error, isLoading } = useSWR(
    shouldFetch ? ['search', keyword.trim(), JSON.stringify(filters)] : null,
    () => searchFetcher({ keyword: keyword.trim(), filters }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // Cache 30s
      keepPreviousData: true,
    }
  );

  // ✅ Log để debug
  if (error) {
    console.error('❌ Search error:', error);
  }

  return {
    searchResults: data?.products || [],
    totalResults: data?.total || 0,
    totalPages: data?.totalPages || 0,
    pagination: {
      currentPage: filters.page || 0,
      totalPages: data?.totalPages || 0,
    },
    loading: isLoading,
    error: error?.message,
  };
};
