import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import SearchFilters from '../../components/search/SearchFilters';
import ProductSection from '../../components/common/ProductSection';
import { useSearch } from '../../hooks/useSearch';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  
  const [filters, setFilters] = useState({
    category: 'all',
    minPrice: '',
    maxPrice: '',
    sortBy: 'relevance'
  });
  
  // ✅ DÙNG SWR - Auto cache, tự động search khi filters thay đổi
  const { searchResults, loading, error, totalResults } = useSearch(query, filters);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleProductClick = (product) => {
    // Backend đã sửa: search trả về productVariantId (variant ID để navigate)
    const variantId = product.id || product.productVariantId || product.productId || product.product?.id;
    if (variantId) {
      navigate(`/product/${variantId}`);
    } else {
      console.error('Cannot navigate: variant ID not found', product);
    }
  };

  return (
    <MainLayout>
      {/* Breadcrumb */}
      <div className="bg-gray-50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => navigate('/')}
              className="text-gray-500 hover:text-gray-700"
            >
              Trang chủ
            </button>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
            <span className="text-gray-900 font-medium">
              Kết quả tìm kiếm: "{query}"
            </span>
          </nav>
        </div>
      </div>

      {/* Search Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className="w-64 flex-shrink-0 hidden md:block">
            <SearchFilters
              onFiltersChange={handleFiltersChange}
              initialFilters={filters}
              currentProducts={searchResults}
            />
          </div>

          {/* Results */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Kết quả tìm kiếm
                </h1>
                <p className="text-gray-600">
                  {loading ? 'Đang tìm kiếm...' : `Tìm thấy ${totalResults} sản phẩm cho "${query}"`}
                </p>
              </div>

              {/* Mobile Filters */}
              <div className="md:hidden">
                <SearchFilters
                  onFiltersChange={handleFiltersChange}
                  initialFilters={filters}
                  currentProducts={searchResults}
                />
              </div>
            </div>

            {/* Use ProductSection component like ProductList */}
            <ProductSection
              title=""
              products={searchResults}
              loading={loading}
              onProductClick={handleProductClick}
              backgroundColor="bg-white"
              showViewAll={false}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SearchResults;