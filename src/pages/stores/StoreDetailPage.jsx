import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import MainLayout from '../../layouts/MainLayout';
import { getStoreById as getStoreByIdAPI } from '../../services/common/storeService';
import { getProductVariantsByStore } from '../../services/common/productService';
import { useToast } from '../../context/ToastContext';
import { getFullImageUrl } from '../../utils/imageUtils';
import SEO from '../../components/seo/SEO';
import { Helmet } from 'react-helmet-async';

const StoreDetailPage = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState('products');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 30;
  const FALLBACK_IMG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23f3f4f6"/><text x="100" y="100" text-anchor="middle" fill="%239ca3af" font-size="14" font-family="Arial">No Image</text></svg>';

  // ✅ SWR for store info (cache 10 minutes)
  const { data: storeData, error: storeError } = useSWR(
    storeId ? ['store', storeId] : null,
    () => getStoreByIdAPI(storeId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 600000, // 10 minutes
    }
  );

  // ✅ SWR for products (cache 5 minutes, keep previous data)
  const { data: productsData, error: productsError, isLoading: productsLoading } = useSWR(
    storeId ? ['store-products', storeId, currentPage] : null,
    () => getProductVariantsByStore(storeId, { page: currentPage, size: pageSize }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 minutes
      keepPreviousData: true, // ⚡ Keep old data while loading new page
    }
  );

  const store = storeData?.success ? storeData.data : null;
  const loading = !storeData && !storeError;

  // ✅ Ưu tiên ảnh màu đầu tiên (bao gồm cả attributes.colors), sau đó tới các field ảnh khác
  const getCoverImage = (product) => {
    const colors = Array.isArray(product?.colors)
      ? product.colors
      : Array.isArray(product?.attributes?.colors)
        ? product.attributes.colors
        : [];

    const fromColor = colors.length > 0 && (colors[0].image || colors[0].colorImage || colors[0].imageUrl);

    const fromProduct =
      product?.primaryImageUrl ||
      product?.imageUrls?.[0] ||
      product?.primaryImage ||
      product?.image ||
      (product?.images && product.images[0]) ||
      null;

    return fromColor || fromProduct || null;
  };

  // ✅ Giá hiển thị: ưu tiên giá trong màu/variant, fallback product.price
  const getDisplayPrice = (product) => {
    const prices = [];
    if (product?.price != null) prices.push(Number(product.price));

    const colors = Array.isArray(product?.colors)
      ? product.colors
      : Array.isArray(product?.attributes?.colors)
        ? product.attributes.colors
        : [];

    colors.forEach(c => {
      if (c?.price != null) prices.push(Number(c.price));
    });

    const valid = prices.filter(p => Number.isFinite(p) && p > 0);
    if (valid.length === 0) return null;
    return Math.min(...valid);
  };

  // Parse products data
  let products = [];
  let totalPages = 1;
  let totalProducts = 0;

  if (productsData?.success) {
    const data = productsData.data;
    if (data?.content && Array.isArray(data.content)) {
      products = data.content;
      if (data.page) {
        totalPages = data.page.totalPages || 1;
        totalProducts = data.page.totalElements || products.length;
      } else {
        totalPages = data.totalPages || 1;
        totalProducts = data.totalElements || products.length;
      }
    } else if (Array.isArray(data)) {
      products = data;
      totalPages = 1;
      totalProducts = products.length;
    }
  }

  const handleProductClick = (product) => {
    // Backend trả về variant, dùng product.id (variant ID) để navigate
    const variantId = product.id || product.productVariantId || product.productId || product.product?.id;
    navigate(`/product/${variantId}`);
    success(`🔍 Đang xem chi tiết sản phẩm`);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-gray-200 h-64 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!store) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏪</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Cửa hàng không tồn tại
            </h3>
            <button
              onClick={() => navigate('/stores')}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // SEO data
  const storeTitle = store?.name || 'Cửa hàng';
  const storeDescription = store?.description 
    ? `${store.description.substring(0, 160)}...` 
    : `Khám phá ${storeTitle} - Cửa hàng công nghệ uy tín với nhiều sản phẩm chất lượng và giá tốt nhất.`;
  const storeKeywords = `${storeTitle}, cửa hàng công nghệ, mua sắm online, ${store?.address?.province || 'Đà Nẵng'}`;

  // ✅ Helper: resolve banner URL từ nhiều field khác nhau
  const bannerRaw =
    store?.banner ||
    store?.bannerUrl ||
    store?.bannerURL ||
    store?.bannerImage ||
    store?.banner_image ||
    null;

  const bannerUrl = bannerRaw
    ? (bannerRaw.startsWith('http') ? bannerRaw : getFullImageUrl(bannerRaw))
    : null;

  return (
    <MainLayout>
      <SEO
        title={storeTitle}
        description={storeDescription}
        keywords={storeKeywords}
        image={getFullImageUrl(store?.logoUrl)}
        url={`/store/${storeId}`}
        type="website"
      />
      {store && (
        <Helmet>
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": store.name,
              "description": store.description || `${store.name} - Cửa hàng công nghệ uy tín`,
              "url": `${window.location.origin}/store/${store.id}`,
              "logo": getFullImageUrl(store.logoUrl) || undefined,
              "image": getFullImageUrl(store.logoUrl) || undefined,
              "address": {
                "@type": "PostalAddress",
                "streetAddress": store.address?.homeAddress || "",
                "addressLocality": store.address?.ward || "",
                "addressRegion": store.address?.province || "",
                "addressCountry": "VN"
              },
              "telephone": store.owner?.phone || "",
              "email": store.owner?.email || "",
              "priceRange": "$$",
              "openingHours": "Mo-Su 08:00-22:00"
            })}
          </script>
        </Helmet>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Store Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          {/* Banner */}
          <div className="h-48 rounded-t-lg relative overflow-hidden">
            {/* Banner image nếu có, fallback gradient */}
            {bannerUrl ? (
              <img
                src={bannerUrl}
                alt={store.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML =
                    '<div class=\"w-full h-full bg-gradient-to-r from-blue-500 to-purple-600\"></div>';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600" />
            )}
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 bg-green-500 text-white text-sm rounded-full">
                ✓ Đã duyệt
              </span>
            </div>
            <div className="absolute bottom-4 right-4 text-white">
              <div className="text-lg font-semibold">{totalProducts} sản phẩm</div>
              <div className="text-sm opacity-90">Cửa hàng chính hãng</div>
            </div>
          </div>

          {/* Store Info */}
          <div className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center overflow-hidden">
                {getFullImageUrl(store.logoUrl) ? (
                  <img 
                    src={getFullImageUrl(store.logoUrl)} 
                    alt={store.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `<span class="text-white font-bold text-3xl">${(store.name || 'S')[0]}</span>`;
                    }}
                  />
                ) : (
                  <span className="text-white font-bold text-3xl">{(store.name || 'S')[0]}</span>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {store.name}
                </h1>
                <p className="text-gray-600 mb-3">
                  {store.address?.suggestedName || store.address?.homeAddress || 'Địa chỉ cửa hàng'}
                </p>
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <span>📞</span>
                    <span>{store.owner.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>✉️</span>
                    <span>{store.owner.email}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                    🏪 {totalProducts} sản phẩm
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'products'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Sản phẩm ({totalProducts})
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'about'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Giới thiệu
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'products' && (
              <div>
                {products.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📦</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Chưa có sản phẩm nào
                    </h3>
                    <p className="text-gray-600">
                      Cửa hàng này chưa có sản phẩm nào được đăng bán
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {products.map((product) => (
                        <div
                          key={product.id}
                          onClick={() => handleProductClick(product)}
                          className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
                        >
                          <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden flex items-center justify-center">
                            {getCoverImage(product) ? (
                              <img
                                src={getCoverImage(product)}
                                alt={product.name}
                                loading="lazy"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = FALLBACK_IMG;
                                }}
                              />
                            ) : (
                              <div className="text-gray-400 text-center">
                                <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"></path>
                                </svg>
                                <span className="text-sm">Không có ảnh</span>
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
                              {product.name}
                            </h3>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                {(() => {
                                  const price = getDisplayPrice(product);
                                  if (price && price > 0) {
                                    return (
                                      <span className="text-lg font-bold text-red-600">
                                        {price.toLocaleString('vi-VN')}đ
                                      </span>
                                    );
                                  }
                                  return (
                                    <span className="text-lg font-semibold text-gray-500">
                                      Liên hệ
                                    </span>
                                  );
                                })()}
                              </div>
                              {product.rating && (
                                <div className="flex items-center space-x-1">
                                  <span className="text-yellow-400">★</span>
                                  <span className="text-sm text-gray-600">{product.rating}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="mt-8 flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 0}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ‹ Trước
                        </button>
                        
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i;
                          } else if (currentPage < 3) {
                            pageNum = i;
                          } else if (currentPage > totalPages - 3) {
                            pageNum = totalPages - 5 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-4 py-2 border rounded-md text-sm font-medium ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum + 1}
                            </button>
                          );
                        })}
                        
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage >= totalPages - 1}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Sau ›
                        </button>
                      </div>
                    )}

                    {/* Total products count */}
                    {totalProducts > 0 && (
                      <div className="mt-4 text-center text-sm text-gray-600">
                        Hiển thị {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalProducts)} / {totalProducts} sản phẩm
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Giới thiệu cửa hàng
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {store.description}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Thông tin liên hệ
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Chủ cửa hàng</h4>
                      <p className="text-gray-600">{store.owner.fullName}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Số điện thoại</h4>
                      <p className="text-gray-600">{store.owner.phone}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Email</h4>
                      <p className="text-gray-600">{store.owner.email}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Địa chỉ</h4>
                      <p className="text-gray-600">
                        {store.address.homeAddress}, {store.address.ward}, {store.address.province}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Thống kê cửa hàng
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {totalProducts}
                      </div>
                      <div className="text-sm text-gray-600">Sản phẩm</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        ✅
                      </div>
                      <div className="text-sm text-gray-600">Đã xác thực</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={() => navigate('/stores')}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200"
          >
            ← Quay lại danh sách cửa hàng
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default StoreDetailPage;
