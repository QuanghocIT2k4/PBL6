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
  const result = await searchProductVariants({
    name: keyword,
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
    if (data.content) {
      products = data.content;
      total = data.totalElements || 0;
      totalPages = data.totalPages || 1;
    } else if (Array.isArray(data)) {
      products = data;
      total = data.length;
      totalPages = 1;
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
  }
  
  return {
    products: [],
    total: 0,
    totalPages: 0,
  };
};

/**
 * ✅ Hook chính - Dùng SWR thay vì useState/useEffect
 * @param {string} keyword - Từ khóa tìm kiếm
 * @param {object} filters - Bộ lọc (category, price, sortBy, etc.)
 */
export const useSearch = (keyword, filters = {}) => {
  const { data, error, isLoading } = useSWR(
    keyword ? ['search', keyword, JSON.stringify(filters)] : null,
    () => searchFetcher({ keyword, filters }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // Cache 30s
      keepPreviousData: true,
    }
  );

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
