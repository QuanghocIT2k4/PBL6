import { useState, useEffect, useMemo } from 'react';
import { useCategories } from '../../hooks/useCategories';
import { getAllBrands } from '../../services/common/productService';
import { useDebounce } from '../../hooks/useDebounce';

const SearchFilters = ({ onFiltersChange, initialFilters = {}, currentProducts = [], categoryBrands = [], loadingCategoryBrands = false, hideBrandFilter = false }) => {
  const [filters, setFilters] = useState({
    category: 'all',
    minPrice: '',
    maxPrice: '',
    sortBy: 'newest',
    brands: [],
    ...initialFilters
  });

  const [showFilters, setShowFilters] = useState(false);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [allBrands, setAllBrands] = useState([]); // ✅ Tất cả brands từ API

  // ✅ Fetch categories from API
  const { categories: apiCategories, loading: categoriesLoading } = useCategories();

  // ✅ FETCH TẤT CẢ BRANDS TỪ API (1 LẦN + CACHE VÀO LOCALSTORAGE)
  useEffect(() => {
    const fetchAllBrands = async () => {
      setBrandsLoading(true);
      
      try {
        // ✅ Kiểm tra cache trong localStorage trước
        const cached = localStorage.getItem('brands_cache');
        const cacheTime = localStorage.getItem('brands_cache_time');
        const CACHE_DURATION = 30 * 60 * 1000; // 30 phút
        
        if (cached && cacheTime) {
          const age = Date.now() - parseInt(cacheTime);
          if (age < CACHE_DURATION) {
            const brandNames = JSON.parse(cached);
            setAllBrands(brandNames);
            setBrandsLoading(false);
            return;
          }
        }
        
        // ✅ Nếu không có cache hoặc hết hạn → Gọi API
        const result = await getAllBrands();
        if (result.success && Array.isArray(result.data)) {
          const brandNames = result.data.map(b => b.name).filter(Boolean).sort();
          setAllBrands(brandNames);
          
          // ✅ Lưu vào cache
          localStorage.setItem('brands_cache', JSON.stringify(brandNames));
          localStorage.setItem('brands_cache_time', Date.now().toString());
        } else {
          setAllBrands([]);
        }
      } catch (error) {
        setAllBrands([]);
      } finally {
        setBrandsLoading(false);
      }
    };
    
    fetchAllBrands();
  }, []); // Chỉ fetch 1 lần khi mount

  // ✅ HIỂN THỊ BRANDS: Nếu có categoryBrands (từ category cụ thể) → chỉ hiển thị brands đó
  // Nếu không có categoryBrands (category = 'all') → hiển thị tất cả brands
  const availableBrands = useMemo(() => {
    // Nếu có categoryBrands và không rỗng → chỉ hiển thị brands trong category
    if (categoryBrands && categoryBrands.length > 0) {
      return categoryBrands;
    }
    // Nếu không có categoryBrands → hiển thị tất cả brands
    return allBrands;
  }, [allBrands, categoryBrands]);

  // ✅ XÓA BRANDS ĐÃ CHỌN nếu không còn tồn tại trong danh sách mới (khi đổi category)
  useEffect(() => {
    if (filters.brands.length > 0) {
      const validBrands = filters.brands.filter(b => availableBrands.includes(b));
      if (validBrands.length !== filters.brands.length) {
        setFilters(prev => ({ ...prev, brands: validBrands }));
      }
    }
  }, [availableBrands, filters.brands.length]); // ✅ Chỉ chạy khi availableBrands hoặc số lượng brands đã chọn thay đổi

  // ✅ Đồng bộ filters state với initialFilters prop khi prop thay đổi
  useEffect(() => {
    if (initialFilters.category && initialFilters.category !== filters.category) {
      setFilters(prev => ({
        ...prev,
        category: initialFilters.category
      }));
    }
  }, [initialFilters.category]);

  // ✅ Gọi onFiltersChange khi filters thay đổi (với debounce để tránh spam API)
  // ✅ TĂNG DEBOUNCE LÊN 500ms ĐỂ GIẢM SỐ LẦN GỌI API
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFiltersChange(filters);
    }, 500); // Debounce 500ms (tăng từ 300ms để tối ưu hơn)

    return () => clearTimeout(timeoutId);
  }, [filters, onFiltersChange]);

  // ✅ Use categories from API
  const categories = apiCategories;

  const sortOptions = [
    { key: 'newest', name: 'Mới nhất' },
    { key: 'relevance', name: 'Liên quan nhất' },
    { key: 'price-asc', name: 'Giá thấp đến cao' },
    { key: 'price-desc', name: 'Giá cao đến thấp' },
    { key: 'name', name: 'Tên A-Z' }
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    // onFiltersChange sẽ được gọi tự động qua useEffect debounce
  };

  const clearFilters = () => {
    const defaultFilters = {
      category: 'all',
      minPrice: '',
      maxPrice: '',
      sortBy: 'newest',
      brands: []
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      {/* Mobile Filter Toggle */}
      <div className="flex items-center justify-between mb-4 md:hidden">
        <h3 className="font-medium">Lọc kết quả</h3>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-blue-600 text-sm"
        >
          {showFilters ? 'Thu gọn' : 'Mở rộng'}
        </button>
      </div>

      <div className={`space-y-6 ${showFilters ? 'block' : 'hidden md:block'}`}>
        {/* Sort */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sắp xếp theo:
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {sortOptions.map(option => (
              <option key={option.key} value={option.key}>
                {option.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Danh mục:
          </label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          >
            {categories.map(category => (
              <option key={category.key} value={category.key}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Khoảng giá (VNĐ):
          </label>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Từ"
              value={filters.minPrice}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                const formatted = value ? Number(value).toLocaleString('vi-VN') : '';
                handleFilterChange('minPrice', formatted);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-gray-500 font-medium text-lg">-</span>
            <input
              type="text"
              placeholder="Đến"
              value={filters.maxPrice}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                const formatted = value ? Number(value).toLocaleString('vi-VN') : '';
                handleFilterChange('maxPrice', formatted);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>

        {/* Brand Filter - Ẩn khi category = 'all' */}
        {!hideBrandFilter && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thương hiệu:
              {categoryBrands && categoryBrands.length > 0 && (
                <span className="ml-2 text-xs text-gray-500 font-normal">
                  ({categoryBrands.length} thương hiệu trong danh mục này)
                </span>
              )}
            </label>
            {brandsLoading || loadingCategoryBrands ? (
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
              </div>
            ) : availableBrands.length === 0 ? (
              <div className="text-sm text-gray-500">
                {categoryBrands && categoryBrands.length === 0 && categoryBrands !== null
                  ? 'Không có thương hiệu nào trong danh mục này'
                  : 'Không có brands'}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {availableBrands.map(brand => (
                  <label key={brand} className="flex items-center space-x-2 text-sm hover:bg-gray-50 p-1 rounded">
                    <input 
                      type="checkbox" 
                      checked={filters.brands.includes(brand)} 
                      onChange={(e) => {
                        const next = e.target.checked 
                          ? [...filters.brands, brand] 
                          : filters.brands.filter(x => x !== brand);
                        handleFilterChange('brands', next);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="truncate">{brand}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
        
      </div>
    </div>
  );
};

export default SearchFilters;