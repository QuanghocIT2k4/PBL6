import { useParams, useNavigate, useLocation } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import ProductSection from '../../components/common/ProductSection';
import SearchFilters from '../../components/search/SearchFilters';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useProductVariants } from '../../hooks/useProductVariants';
import { useCategories } from '../../hooks/useCategories';
import { useSWRConfig } from 'swr';
import { 
  getProductVariantsByCategoryAndBrand,
  getProductsByCategoryAndBrand 
} from '../../services/common/productService';
import { getBrandsByCategory } from '../../config/categoryBrandsMapping';

const ProductList = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { mutate } = useSWRConfig(); // ✅ Để prefetch data
  
  // ✅ PAGINATION: Mỗi trang 20 sản phẩm (tối ưu hiệu suất)
  const [currentPage, setCurrentPage] = useState(1); // Trang hiện tại (bắt đầu từ 1)
  const ITEMS_PER_PAGE = 20; // Mỗi trang hiển thị 20 sản phẩm (giảm từ 50 để load nhanh hơn)
  
  // ✅ SERVER-SIDE PAGINATION: Chỉ load số lượng sản phẩm cần thiết cho trang hiện tại
  // Chuyển đổi từ page 1-based (UI) sang page 0-based (API)
  const apiPage = currentPage - 1;
  const { variants: allVariants, loading, error, totalElements, pagination } = useProductVariants(
    category || 'all', 
    { 
      page: apiPage, // Sử dụng server-side pagination
      size: ITEMS_PER_PAGE // Chỉ load số lượng cần thiết
    }
  );
  
  const [filters, setFilters] = useState({ category, brands: [], sortBy: 'relevance', minPrice: '', maxPrice: '' });
  
  // ✅ State cho API mới: Category + Brand filter
  const [categoryBrandProducts, setCategoryBrandProducts] = useState(null);
  const [categoryBrandLoading, setCategoryBrandLoading] = useState(false);
  const [categoryBrandTotalElements, setCategoryBrandTotalElements] = useState(null);
  
  // ✅ State để lưu tổng số items thực tế (fetch một lần nếu API không trả về)
  const [actualTotalItems, setActualTotalItems] = useState(null);
  
  // ✅ State để lưu brands có trong category hiện tại (từ hardcode mapping)
  const [categoryBrands, setCategoryBrands] = useState([]);
  const [loadingCategoryBrands, setLoadingCategoryBrands] = useState(false);
  
  // ✅ Reset về trang 1 CHỈ KHI category thay đổi
  useEffect(() => {
    setCurrentPage(1);
    setFilters({ category, brands: [], sortBy: 'relevance', minPrice: '', maxPrice: '' });
    setCategoryBrandProducts(null); // Reset API results
    setCategoryBrandTotalElements(null); // Reset totalElements
    setActualTotalItems(null); // Reset actual total items
    
    // ✅ Lấy brands từ hardcode mapping
    const brandsForCategory = getBrandsByCategory(category);
    setCategoryBrands(brandsForCategory);
    console.log(`🏷️ Category "${category}" → ${brandsForCategory.length} brands:`, brandsForCategory);
    
    // Scroll to top mượt mà khi chuyển danh mục
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [category]);
  
  // ✅ Fetch tổng số items một lần nếu API không trả về totalElements
  useEffect(() => {
    const fetchTotalItems = async () => {
      // Chỉ fetch nếu:
      // 1. Không có totalElements từ API
      // 2. Chưa có actualTotalItems
      // 3. Đang ở trang 1 (để tránh fetch nhiều lần)
      if (totalElements === undefined && actualTotalItems === null && currentPage === 1 && !loading) {
        try {
          console.log('🔍 Fetching total items count...');
          // Fetch với size lớn để lấy tổng số (hoặc dùng API count nếu có)
          const { getLatestProductVariants } = await import('../../services/common/productService');
          const result = await getLatestProductVariants({ 
            page: 0, 
            size: 1, // Chỉ cần 1 item để lấy totalElements
            sortBy: 'createdAt',
            sortDir: 'desc'
          });
          
          if (result.success && result.data?.totalElements) {
            console.log('✅ Total items from API:', result.data.totalElements);
            setActualTotalItems(result.data.totalElements);
          }
        } catch (err) {
          console.error('❌ Error fetching total items:', err);
        }
      }
    };
    
    fetchTotalItems();
  }, [totalElements, actualTotalItems, currentPage, loading, category]);
  
  // ✅ Auto-select brand từ navigation state (khi click brand từ HomePage)
  useEffect(() => {
    if (location.state?.selectedBrand) {
      const brandName = location.state.selectedBrand;
      console.log('🏷️ Auto-selecting brand from navigation:', brandName);
      setFilters(prev => ({ ...prev, brands: [brandName] }));
      // Clear navigation state để không bị auto-select lại khi refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);
  
  // ✅ ĐÃ XÓA: Không cần fetch brands từ backend nữa, dùng hardcode mapping
  // Brands đã được set trong useEffect reset category ở trên
  
  // ✅ LOGIC MỚI: Khi user chọn 1 brand duy nhất + đang ở category cụ thể → Gọi API mới
  useEffect(() => {
    const fetchCategoryBrandProducts = async () => {
      // Điều kiện: Phải chọn ĐÚNG 1 brand
      // Nếu category = 'all' → Không gọi API (vì backend không hỗ trợ), để client-side filter
      if (!filters.brands.length || filters.brands.length !== 1) {
        setCategoryBrandProducts(null);
        setCategoryBrandTotalElements(null);
        return;
      }
      
      // Nếu category = 'all' → Skip API, dùng client-side filter
      if (!category || category === 'all') {
        setCategoryBrandProducts(null);
        setCategoryBrandTotalElements(null);
        return;
      }
      
      const selectedBrand = filters.brands[0];
      
      // Map category key sang API name (giống logic trong useProductVariants)
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
      
      const categoryName = KEY_TO_API_NAME[category] || category;
      
      console.log('🎨🏷️ Calling Category+Brand APIs:', { category: categoryName, brand: selectedBrand });
      
      setCategoryBrandLoading(true);
      
      try {
        // ✅ GỌI CẢ 2 APIs SONG SONG: Products + Product Variants
        // ✅ TỐI ƯU: Chỉ load số lượng cần thiết cho trang hiện tại
        const apiPage = currentPage - 1; // Chuyển từ 1-based sang 0-based
        const [productsResult, variantsResult] = await Promise.all([
          getProductsByCategoryAndBrand(categoryName, selectedBrand, {
            page: apiPage,
            size: ITEMS_PER_PAGE, // Chỉ load số lượng cần thiết
            sortBy: filters.sortBy === 'price-asc' ? 'price' : filters.sortBy === 'price-desc' ? 'price' : 'createdAt',
            sortDir: filters.sortBy === 'price-asc' ? 'asc' : filters.sortBy === 'price-desc' ? 'desc' : 'desc'
          }),
          getProductVariantsByCategoryAndBrand(categoryName, selectedBrand, {
            page: apiPage,
            size: ITEMS_PER_PAGE, // Chỉ load số lượng cần thiết
            sortBy: filters.sortBy === 'price-asc' ? 'price' : filters.sortBy === 'price-desc' ? 'price' : 'createdAt',
            sortDir: filters.sortBy === 'price-asc' ? 'asc' : filters.sortBy === 'price-desc' ? 'desc' : 'desc'
          })
        ]);
        
        console.log('✅ Products API Result:', productsResult);
        console.log('✅ Variants API Result:', variantsResult);
        
        // ✅ Ưu tiên dùng Product Variants (vì có đầy đủ thông tin hơn)
        // Fallback sang Products nếu không có variants
        let finalProducts = [];
        let totalElementsFromAPI = null;
        
        if (variantsResult.success && variantsResult.data) {
          console.log('📦 Using Product Variants data');
          finalProducts = (variantsResult.data.content || []).map(variant => ({
            id: variant.id,
            name: variant.name,
            images: variant.images || (variant.primaryImage ? [variant.primaryImage] : []),
            image: variant.primaryImage || variant.images?.[0] || null,
            price: variant.price || 0,
            stock: variant.stock || 0,
            description: variant.description,
            attributes: variant.attributes,
            variantId: variant.id,
            ...variant,
          }));
          // ✅ Lưu totalElements từ API response
          totalElementsFromAPI = variantsResult.data.totalElements;
        } else if (productsResult.success && productsResult.data) {
          console.log('📦 Using Products data (fallback)');
          finalProducts = (productsResult.data.content || []).map(product => ({
            id: product.id,
            name: product.name,
            images: product.images || [],
            image: product.images?.[0] || null,
            price: product.price || 0,
            stock: product.stock || 0,
            description: product.description,
            ...product,
          }));
          // ✅ Lưu totalElements từ API response
          totalElementsFromAPI = productsResult.data.totalElements;
        } else {
          console.warn('⚠️ No data from both APIs');
          finalProducts = [];
          totalElementsFromAPI = 0;
        }
        
        setCategoryBrandProducts(finalProducts);
        setCategoryBrandTotalElements(totalElementsFromAPI);
      } catch (err) {
        console.error('❌ Category+Brand API Exception:', err);
        setCategoryBrandProducts([]);
        setCategoryBrandTotalElements(0);
      } finally {
        setCategoryBrandLoading(false);
      }
    };
    
    fetchCategoryBrandProducts();
  }, [category, filters.brands, currentPage, filters.sortBy, ITEMS_PER_PAGE]);
  
  // ✅ Sử dụng categoryBrandProducts nếu có (từ API mới), nếu không thì dùng allVariants
  const products = categoryBrandProducts !== null ? categoryBrandProducts : allVariants;

  // Helper to parse price string like "12.000.000" or "12.000.000₫" to number 12000000
  const parsePrice = (s) => {
    if (!s) return NaN;
    const digits = String(s).replace(/[^0-9]/g, '');
    return digits ? parseInt(digits, 10) : NaN;
  };

  // ✅ Filter variants (chỉ filter trên dữ liệu đã load - tối ưu hiệu suất)
  const allFilteredProducts = useMemo(() => {
    let result = products.slice();
    
    // ✅ QUAN TRỌNG: Nếu đang dùng API mới (categoryBrandProducts), KHÔNG filter brand nữa
    // Vì API đã filter rồi. Chỉ filter brand khi dùng allVariants
    const shouldFilterBrand = categoryBrandProducts === null && filters.brands?.length > 0;
    
    // Brand filter: suy ra brand từ tên (chỉ khi không dùng API mới)
    if (shouldFilterBrand) {
      result = result.filter(p => {
        const name = (p.name || '').toLowerCase();
        return filters.brands.some(b => name.includes(b.toLowerCase()));
      });
    }
    // Price filter (giá là string VNĐ; loại bỏ ký tự)
    const min = parsePrice(filters.minPrice);
    const max = parsePrice(filters.maxPrice);
    if (!isNaN(min)) result = result.filter(p => parsePrice(p.price) >= min);
    if (!isNaN(max)) result = result.filter(p => parsePrice(p.price) <= max);
    // Sort (chỉ khi không dùng API mới vì API đã sort rồi)
    if (categoryBrandProducts === null) {
      if (filters.sortBy === 'price-asc') result.sort((a,b)=>parsePrice(a.price)-parsePrice(b.price));
      if (filters.sortBy === 'price-desc') result.sort((a,b)=>parsePrice(b.price)-parsePrice(a.price));
      if (filters.sortBy === 'name') result.sort((a,b)=> (a.name||'').localeCompare(b.name||''));
    }

    return result;
  }, [products, filters, categoryBrandProducts]);
  
  // ✅ Tính toán phân trang từ server response
  // QUAN TRỌNG: Dùng totalElements từ API để tính totalPages (server-side pagination)
  // Ưu tiên: categoryBrandTotalElements > actualTotalItems > pagination.totalPages > totalElements > ước tính
  let totalItems = null;
  let totalPages = 1;
  
  if (categoryBrandTotalElements !== null && categoryBrandTotalElements !== undefined) {
    // Nếu có totalElements từ category+brand API
    totalItems = categoryBrandTotalElements;
    totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  } else if (actualTotalItems !== null && actualTotalItems > 0) {
    // ✅ Ưu tiên dùng actualTotalItems (đã fetch một lần)
    totalItems = actualTotalItems;
    totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  } else if (pagination?.totalPages && pagination.totalPages > 1) {
    // ✅ Dùng pagination.totalPages từ hook (nếu có)
    totalPages = pagination.totalPages;
    totalItems = pagination.totalElements || (totalPages * ITEMS_PER_PAGE);
  } else if (totalElements !== undefined && totalElements !== null && totalElements > 0) {
    // Nếu có totalElements từ useProductVariants
    totalItems = totalElements;
    totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  } else {
    // ✅ FALLBACK: Nếu API không trả về totalElements, ước tính từ số items đã load
    // Nếu load được đúng ITEMS_PER_PAGE items, có thể còn trang tiếp theo
    // Hiển thị pagination nếu có ít nhất ITEMS_PER_PAGE items
    if (allFilteredProducts.length >= ITEMS_PER_PAGE) {
      // ✅ Nếu đang ở trang > 1, chắc chắn có nhiều trang
      // Ước tính: có ít nhất currentPage + 1 trang (vì đã load được đến trang này)
      totalPages = Math.max(2, currentPage + 1);
      totalItems = totalPages * ITEMS_PER_PAGE; // Ước tính
    } else {
      // Nếu ít hơn ITEMS_PER_PAGE items, chỉ có 1 trang
      totalPages = 1;
      totalItems = allFilteredProducts.length;
    }
  }
  
  // ✅ Đảm bảo totalPages ít nhất bằng currentPage (nếu đang ở trang > 1)
  if (currentPage > totalPages) {
    totalPages = currentPage + 1; // Cho phép thêm 1 trang để user có thể thử
  }
  
  // ✅ Debug log để kiểm tra
  console.log('📊 Pagination Calculation:', {
    categoryBrandTotalElements,
    actualTotalItems,
    paginationTotalPages: pagination?.totalPages,
    paginationTotalElements: pagination?.totalElements,
    totalElements,
    allFilteredProductsLength: allFilteredProducts.length,
    currentPage,
    calculatedTotalPages: totalPages,
    calculatedTotalItems: totalItems,
    // ✅ Thêm thông tin debug
    isLoading: loading || categoryBrandLoading,
    hasCategoryBrandProducts: categoryBrandProducts !== null,
    filtersBrands: filters.brands,
    category: category
  });
  
  // ✅ Với server-side pagination, không cần slice nữa vì API đã trả về đúng số lượng
  // Nhưng vẫn giữ slice để xử lý trường hợp filter client-side
  const filteredProducts = allFilteredProducts;
  
  const { categories } = useCategories();

  // ✅ TÌM TÊN DANH MỤC DỰA TRÊN KEY
  const currentCategory = categories.find(cat => cat.key === category);
  const categoryName = currentCategory?.name || (category === 'all' ? 'Tất cả sản phẩm' : category);

  // ✅ Memoize initialFilters để tránh tạo object mới mỗi lần render
  const initialFilters = useMemo(() => ({
    ...filters,
    category
  }), [filters, category]);

  const handleProductClick = (variant) => {
    // ✅ Nếu có variantId thì điều hướng đến variant detail, nếu không thì điều hướng đến product detail
    if (variant.variantId) {
      navigate(`/product/${variant.variantId}`);
    } else if (variant.id) {
      navigate(`/product/${variant.id}`);
    }
  };

  // ✅ Hàm xử lý khi filters thay đổi
  const handleFiltersChange = (newFilters) => {
    // ✅ CHO PHÉP THAY ĐỔI CATEGORY từ dropdown filter
    // Nếu category từ newFilters khác với URL category → Navigate sang trang đó
    if (newFilters.category && newFilters.category !== category) {
      console.log('📂 Category changed via dropdown:', newFilters.category);
      navigate(`/products/${newFilters.category}`);
      return; // Navigate sẽ trigger useEffect để load dữ liệu mới
    }
    
    // Chỉ reset trang nếu filters thực sự thay đổi (không bao gồm category)
    const { category: _, ...oldFiltersWithoutCategory } = filters;
    const { category: __, ...newFiltersWithoutCategory } = newFilters;
    const filtersChanged = JSON.stringify(oldFiltersWithoutCategory) !== JSON.stringify(newFiltersWithoutCategory);
    
    setFilters({...newFilters, category});
    
    if (filtersChanged) {
      setCurrentPage(1); // Reset về trang 1 CHỈ KHI filters thực sự thay đổi
    }
  };

  // ✅ Hàm xử lý pagination - Server-side pagination (tối ưu: giữ data cũ khi load)
  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1) {
      // ✅ Update state ngay lập tức (SWR sẽ tự động fetch với keepPreviousData)
      setCurrentPage(newPage);
      // Scroll to top khi chuyển trang
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // ✅ SWR với keepPreviousData sẽ giữ data cũ và fetch mới song song
      // → User thấy data cũ ngay, sau đó update khi có data mới
    }
  }, []);
  
  // ✅ Tự động điều chỉnh nếu trang hiện tại không có dữ liệu
  useEffect(() => {
    // Nếu đã load xong và không có sản phẩm nhưng đang ở trang > 1
    if (!loading && allFilteredProducts.length === 0 && currentPage > 1) {
      console.log('⚠️ Trang hiện tại không có dữ liệu, quay về trang 1');
      setCurrentPage(1);
    }
  }, [loading, allFilteredProducts.length, currentPage]);

  // ✅ Tính toán các trang cần hiển thị - HIỂN THỊ TẤT CẢ (không có "...")
  const getVisiblePages = () => {
    const pages = [];
    // Hiển thị tất cả các trang từ 1 đến totalPages
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  // ✅ Loading screen CHỈ khi load lần đầu (không có data cũ)
  // ✅ QUAN TRỌNG: Không ẩn sản phẩm khi đang load - giữ data cũ để UX mượt
  const isLoading = loading || categoryBrandLoading;
  const isInitialLoad = isLoading && products.length === 0 && allFilteredProducts.length === 0;
  
  if (isInitialLoad) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">
            {categoryBrandLoading ? 'Đang lọc sản phẩm theo thương hiệu...' : 'Đang tải sản phẩm...'}
          </p>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="text-red-600">Lỗi: {error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Về trang chủ
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Breadcrumb */}
      <div className="bg-gray-50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <button
                  onClick={() => navigate('/')}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Trang chủ
                </button>
              </li>
              <li>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </li>
              <li>
                <span className="text-gray-900 font-medium">{categoryName}</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex gap-8 items-start">
          <div className="w-80 hidden md:block flex-shrink-0 pt-1">
            <SearchFilters 
              onFiltersChange={handleFiltersChange} 
              initialFilters={initialFilters}
              currentProducts={allVariants}
              categoryBrands={categoryBrands}
              loadingCategoryBrands={loadingCategoryBrands}
            />
          </div>
          <div className="flex-1">
            
            {/* ✅ Hiển thị loading indicator nhỏ khi đang load (không ẩn sản phẩm) */}
            {isLoading && !isInitialLoad && (
              <div className="mb-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Đang tải sản phẩm mới...</span>
              </div>
            )}
            
            {/* ✅ Hiển thị skeleton loading khi đang load lần đầu (có data cũ) */}
            {isLoading && !isInitialLoad && filteredProducts.length === 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 aspect-square rounded-lg mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            )}
            
            {/* ✅ Chỉ hiển thị ProductSection khi có sản phẩm hoặc không loading */}
            {(!isLoading || filteredProducts.length > 0) && (
              <ProductSection
                title={categoryName}
                products={filteredProducts}
                onProductClick={handleProductClick}
                showViewAll={false}
                backgroundColor="bg-white"
                compact
              />
            )}
            
            {/* ✅ PAGINATION COMPONENT */}
            {/* Hiển thị pagination nếu: có sản phẩm VÀ (totalPages > 1 HOẶC có >= ITEMS_PER_PAGE items) */}
            {allFilteredProducts.length > 0 && (totalPages > 1 || allFilteredProducts.length >= ITEMS_PER_PAGE) && (
              <div className="flex items-center justify-center mt-8 mb-8">
                {/* Pagination Controls */}
                <div className="flex items-center justify-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 shadow-sm hover:shadow-md hover:scale-105'
                    }`}
                    aria-label="Trang trước"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {getVisiblePages().map((page) => {
                      const isActive = page === currentPage;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`min-w-[40px] h-10 px-4 rounded-lg font-semibold transition-all duration-200 ${
                            isActive
                              ? 'bg-red-500 text-white shadow-lg scale-110'
                              : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 shadow-sm hover:shadow-md hover:scale-105'
                          }`}
                          aria-label={`Trang ${page}`}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 shadow-sm hover:shadow-md hover:scale-105'
                    }`}
                    aria-label="Trang sau"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </button>
                </div>
              </div>
            )}
            
            {/* ✅ Thông báo khi không có sản phẩm */}
            {allFilteredProducts.length === 0 && !loading && (
              <div className="text-center mt-12 mb-12">
                <div className="inline-flex items-center gap-3 px-8 py-4 bg-yellow-50 text-yellow-700 rounded-2xl border-2 border-yellow-300 shadow-lg">
                  <svg className="w-7 h-7 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-bold text-lg">Không tìm thấy sản phẩm nào</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProductList;