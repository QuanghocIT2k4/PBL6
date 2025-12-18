import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import SearchFilters from '../../components/search/SearchFilters';
import ProductSection from '../../components/common/ProductSection';
import { useSearch } from '../../hooks/useSearch';
import SEO from '../../components/seo/SEO';

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

  // SEO data
  const searchTitle = query ? `Tìm kiếm: "${query}"` : 'Tìm kiếm sản phẩm';
  const searchDescription = query 
    ? `Tìm thấy ${totalResults} kết quả cho "${query}". Khám phá sản phẩm công nghệ với giá tốt nhất.`
    : 'Tìm kiếm sản phẩm công nghệ, điện tử với nhiều lựa chọn và giá tốt nhất.';
  const searchKeywords = query 
    ? `${query}, tìm kiếm, sản phẩm, mua sắm online`
    : 'tìm kiếm, sản phẩm, mua sắm online, công nghệ';

  return (
    <MainLayout>
      <SEO
        title={searchTitle}
        description={searchDescription}
        keywords={searchKeywords}
        url={`/search${query ? `?q=${encodeURIComponent(query)}` : ''}`}
        type="website"
      />
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

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <p className="text-red-800">Có lỗi xảy ra khi tìm kiếm: {error}</p>
                </div>
              </div>
            )}

            {/* No Results Message */}
            {!loading && !error && searchResults.length === 0 && query && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
                <svg className="w-16 h-16 text-yellow-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Không tìm thấy sản phẩm nào
                </h3>
                <p className="text-gray-600 mb-4">
                  Không có kết quả nào cho từ khóa "<strong>{query}</strong>"
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  ← Về trang chủ
                </button>
              </div>
            )}

            {/* Empty Query Message */}
            {!loading && !error && !query && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Nhập từ khóa để tìm kiếm
                </h3>
                <p className="text-gray-600">
                  Hãy nhập tên sản phẩm bạn muốn tìm vào thanh tìm kiếm ở trên
                </p>
              </div>
            )}

            {/* Use ProductSection component like ProductList */}
            {query && searchResults.length > 0 && (
              <ProductSection
                title=""
                products={searchResults}
                loading={loading}
                onProductClick={handleProductClick}
                backgroundColor="bg-white"
                showViewAll={false}
                disableAnimations={true}
              />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SearchResults;