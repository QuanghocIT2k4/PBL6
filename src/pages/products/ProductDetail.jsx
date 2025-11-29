import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import ProductGallery from '../../components/products/ProductGallery';
import ProductInfo from '../../components/products/ProductInfo';
import ProductSpecifications from '../../components/products/ProductSpecifications';
import ShopInfo from '../../components/products/ShopInfo';
import ProductSection from '../../components/common/ProductSection';
import ReviewList from '../../components/reviews/ReviewList';
import ReviewForm from '../../components/reviews/ReviewForm';
import SEO from '../../components/seo/SEO';
import { ProductSchema, BreadcrumbSchema } from '../../components/seo/StructuredData';
import { useState } from 'react';
import { useProductDetail } from '../../hooks/useProductDetail';
import { useCategories } from '../../hooks/useCategories';
import { useStoreInfo } from '../../hooks/useStoreInfo';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { product, relatedProducts, loading, relatedLoading, error } = useProductDetail(id); // ✅ DÙNG SWR
  const { categories } = useCategories();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  
  // ✅ Fetch store info từ product.storeId (thử nhiều field name)
  const productStoreId = product?.storeId || product?.store_id || product?.store?.id;
  const productStoreName = product?.storeName || product?.store_name || product?.store?.name;
  const { store, loading: storeLoading, error: storeError } = useStoreInfo(productStoreId);

  const handleWriteReview = (existingReview = null) => {
    setEditingReview(existingReview);
    setShowReviewForm(true);
  };

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    setEditingReview(null);
  };
  

  // ✅ TÌM TÊN DANH MỤC DỰA TRÊN categoryKey
  const currentCategory = categories.find(cat => cat.key === product?.categoryKey);
  const categoryName = currentCategory?.name || (product?.categoryKey === 'all' ? 'Tất cả sản phẩm' : product?.categoryKey || 'Sản phẩm');

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải sản phẩm...</p>
        </div>
      </MainLayout>
    );
  }

  if (error || !product) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy sản phẩm</h2>
            <p className="text-gray-600 mb-6">Sản phẩm bạn tìm không tồn tại hoặc đã bị xóa.</p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const handleRelatedProductClick = (relatedProduct) => {
    navigate(`/product/${relatedProduct.id}`);
  };

  // SEO data từ product
  const productTitle = product?.name || 'Sản phẩm';
  const productDescription = product?.description 
    ? `${product.description.substring(0, 160)}...` 
    : `Mua ${productTitle} với giá tốt nhất. Giao hàng nhanh, thanh toán an toàn.`;
  const productPrice = product?.price ? new Intl.NumberFormat('vi-VN').format(product.price) : '';
  const productImage = product?.images?.[0] || product?.image || '';
  const productKeywords = `${productTitle}, ${categoryName}, mua sắm online, công nghệ`;

  // Breadcrumb items for structured data
  const breadcrumbItems = [
    { name: 'Trang chủ', url: `${window.location.origin}/` },
    { name: categoryName, url: `${window.location.origin}/products/${product?.categoryKey || 'all'}` },
    { name: productTitle, url: `${window.location.origin}/product/${id}` }
  ];

  return (
    <MainLayout>
      <SEO
        title={productTitle}
        description={productDescription}
        keywords={productKeywords}
        image={productImage}
        url={`/product/${id}`}
        type="product"
      />
      <ProductSchema product={product} store={store} />
      <BreadcrumbSchema items={breadcrumbItems} />
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
                <button
                  onClick={() => navigate(`/products/${product?.categoryKey || 'all'}`)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {categoryName}
                </button>
              </li>
              <li>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </li>
              <li>
                <span className="text-gray-900 font-medium">{product.name}</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Product Detail */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* PHẦN 1: Gallery + Product Info (50:50) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Gallery */}
          <div>
            <ProductGallery product={product} />
          </div>

          {/* Product Info */}
          <div>
            <ProductInfo product={product} />
          </div>
        </div>

        {/* PHẦN 2: Specifications + Shop Info (50:50) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Specifications */}
          <div>
            <ProductSpecifications product={product} />
          </div>

          {/* Shop Info */}
          <div>
            {storeLoading ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : storeError ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center py-4">
                  <p className="text-red-600 text-sm">Không thể tải thông tin cửa hàng</p>
                  <p className="text-gray-500 text-xs mt-1">{storeError}</p>
                </div>
              </div>
            ) : (
              <ShopInfo 
                shop={store} 
                storeName={productStoreName} 
                storeId={productStoreId}
                product={product}
              />
            )}
          </div>
        </div>

        {/* PHẦN 3: Reviews (100% width) */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Đánh giá sản phẩm</h2>
          
          {/* Review Form Modal */}
          {showReviewForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    {editingReview ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá'}
                  </h3>
                  <button
                    onClick={() => setShowReviewForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <ReviewForm
                  productVariantId={id}
                  existingReview={editingReview}
                  onSuccess={handleReviewSuccess}
                  onCancel={() => setShowReviewForm(false)}
                />
              </div>
            </div>
          )}
          
          {/* Review List */}
          <ReviewList
            productVariantId={id}
            onWriteReview={handleWriteReview}
          />
        </div>

        {/* ✅ PHẦN 4: Related Products (100% width) */}
        <div className="mb-12">
          {relatedLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Đang tải sản phẩm liên quan...</p>
            </div>
          ) : relatedProducts.length > 0 ? (
            <ProductSection
              title="Sản phẩm liên quan"
              products={relatedProducts}
              onProductClick={handleRelatedProductClick}
              backgroundColor="bg-gray-50"
              showViewAll={false}
            />
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-500">Không có sản phẩm liên quan</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ProductDetail;