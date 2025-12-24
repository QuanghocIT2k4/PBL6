import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import ProductGallery from '../../components/products/ProductGallery';
import ProductInfo from '../../components/products/ProductInfo';
import ProductSpecifications from '../../components/products/ProductSpecifications';
import ShopInfo from '../../components/products/ShopInfo';
import ProductSection from '../../components/common/ProductSection';
import ReviewList from '../../components/reviews/ReviewList';
import ReviewForm from '../../components/reviews/ReviewForm';
import ProductComments from '../../components/products/ProductComments';
import SEO from '../../components/seo/SEO';
import { ProductSchema, BreadcrumbSchema } from '../../components/seo/StructuredData';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useProductDetail } from '../../hooks/useProductDetail';
import { useCategories } from '../../hooks/useCategories';
import { useStoreInfo } from '../../hooks/useStoreInfo';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { product, relatedProducts, loading, relatedLoading, error } = useProductDetail(id); // ✅ DÙNG SWR
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const { categories } = useCategories();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [previousProduct, setPreviousProduct] = useState(null); // ✅ Giữ lại product cũ để tránh chớp
  const [previousId, setPreviousId] = useState(id); // ✅ Track id cũ
  
  // ✅ Update previousProduct khi có product mới (bất kỳ product nào)
  useEffect(() => {
    if (product) {
      setPreviousProduct(product);
      setPreviousId(id);
    }
  }, [product, id]);
  
  // ✅ Dùng product hiện tại hoặc product cũ để tránh chớp
  // Luôn ưu tiên product hiện tại, fallback về previousProduct nếu có
  const displayProduct = product || previousProduct;
  
  // ✅ Fetch store info từ product.storeId (thử nhiều field name)
  const productStoreId = displayProduct?.storeId || displayProduct?.store_id || displayProduct?.store?.id;
  const productStoreName = displayProduct?.storeName || displayProduct?.store_name || displayProduct?.store?.name;
  const productIdFromVariant = displayProduct?.productId || displayProduct?.product_id || displayProduct?.product?.id || displayProduct?.product?.productId;

  // Fetch all variants of the product when we know productId
  useEffect(() => {
    const loadVariants = async () => {
      try {
        if (!productIdFromVariant) {
          setVariants([]);
          return;
        }
        const { getProductVariants } = await import('../../services/common/productService');
        const res = await getProductVariants({ productId: productIdFromVariant, page: 0, size: 50 });
        if (res.success) {
          const list = res.data?.content || res.data || [];
          setVariants(list);
        } else {
          setVariants([]);
        }
      } catch (err) {
        console.error('Load variants error', err);
        setVariants([]);
      }
    };
    loadVariants();
  }, [productIdFromVariant]);
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
  const currentCategory = categories.find(cat => cat.key === displayProduct?.categoryKey);
  const categoryName = currentCategory?.name || (displayProduct?.categoryKey === 'all' ? 'Tất cả sản phẩm' : displayProduct?.categoryKey || 'Sản phẩm');

  // ✅ Helper: lấy danh sách ảnh từ product/variant hoặc màu
  const extractImages = (item) => {
    if (!item) return [];
    const imgs = [];
    const push = (val) => { if (val) imgs.push(val); };

    if (Array.isArray(item.imageUrls)) item.imageUrls.filter(Boolean).forEach(push);
    push(item.primaryImageUrl);
    push(item.primaryImage);
    push(item.image);
    if (Array.isArray(item.images)) item.images.filter(Boolean).forEach(push);

    const colors = Array.isArray(item.colors)
      ? item.colors
      : Array.isArray(item.attributes?.colors)
        ? item.attributes.colors
        : [];

    if (colors.length > 0) {
      const colorImgs = colors
        .map(c => c?.image || c?.colorImage || c?.imageUrl)
        .filter(Boolean);
      imgs.push(...colorImgs);
    }

    // unique & truthy
    return Array.from(new Set(imgs.filter(Boolean)));
  };

  // ✅ Giữ lại product cũ khi đang load product mới để tránh chớp
  // Chỉ update previousProduct khi có product mới và id khớp với id hiện tại
  useEffect(() => {
    if (product && String(product.id || product.variantId) === String(id)) {
      setPreviousProduct(product);
    }
  }, [product, id]);

  // ✅ Track variant ID hiện tại để tránh update không cần thiết
  const currentVariantIdRef = useRef(null);
  
  // ✅ Set ảnh mặc định từ product khi load xong (chỉ khi id thay đổi từ URL)
  useEffect(() => {
    const currentProduct = product || previousProduct;
    if (currentProduct) {
      const currentId = String(currentProduct.id || currentProduct.variantId);
      const prevId = currentVariantIdRef.current;
      
      // ✅ Chỉ update gallery images khi product ID thay đổi từ URL (navigate sang variant khác)
      if (currentId !== prevId && String(currentId) === String(id)) {
        currentVariantIdRef.current = currentId;
        const imgs = extractImages(currentProduct);
        setGalleryImages(imgs);
      }
    }
  }, [id, product?.id, product?.variantId, previousProduct?.id, previousProduct?.variantId]);

  // ✅ Khi chọn biến thể/thuộc tính (từ ProductInfo) → đổi ảnh gallery NGAY LẬP TỨC
  const handleVariantChange = useCallback((variant, selectedColor) => {
    // Lưu variant để specs/review/comment bám theo đúng biến thể
    setSelectedVariant(variant || null);

    if (!variant) return; // Không có variant thì không làm gì

    const variantId = String(variant.id || variant.variantId);
    
    // ✅ LUÔN update gallery images khi variant ID thay đổi (KHÔNG check updateKey nữa)
    // Chỉ check variant ID để đảm bảo update khi chọn bộ nhớ trong khác
    const prevVariantId = currentVariantIdRef.current;
    
    // ✅ Nếu variant ID không đổi, chỉ update khi có color mới
    if (prevVariantId === variantId) {
      const colorImg = selectedColor?.image || selectedColor?.colorImage || selectedColor?.imageUrl;
      if (colorImg) {
        // Chỉ update ảnh màu nếu có
        const currentImgs = galleryImages.length > 0 ? galleryImages : extractImages(variant);
        const uniqueImgs = [colorImg, ...currentImgs.filter(i => i !== colorImg)];
        setGalleryImages(uniqueImgs);
      }
      return; // Variant không đổi, không làm gì thêm
    }
    
    console.log('🖼️ Updating gallery images for NEW variant:', variantId);
    
    // ✅ Variant ID đã thay đổi → UPDATE ẢNH NGAY LẬP TỨC
    const imgsFromVariant = extractImages(variant);
    const colorImg = selectedColor?.image || selectedColor?.colorImage || selectedColor?.imageUrl;
    
    // ✅ Ưu tiên ảnh từ variant, fallback về ảnh từ product
    const merged = imgsFromVariant.length > 0 ? imgsFromVariant : extractImages(product || previousProduct);
    
    // ✅ Update gallery images một cách mượt mà, không chớp
    if (colorImg) {
      // Đưa ảnh màu lên đầu, loại bỏ duplicate
      const uniqueImgs = [colorImg, ...merged.filter(i => i !== colorImg)];
      setGalleryImages(uniqueImgs);
    } else {
      setGalleryImages(merged);
    }
    
    // ✅ Update ref để track variant ID hiện tại
    currentVariantIdRef.current = variantId;
  }, [product, previousProduct, galleryImages]);

  // ✅ Debug: Log để kiểm tra
  console.log('🔍 ProductDetail Debug:', {
    id,
    loading,
    error,
    hasProduct: !!product,
    hasPreviousProduct: !!previousProduct,
    displayProduct: !!displayProduct,
  });

  // ✅ Chỉ hiển thị loading khi thực sự không có data nào cả (không có cache và không có previous)
  if (loading && !displayProduct) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải sản phẩm...</p>
        </div>
      </MainLayout>
    );
  }
  
  // ✅ Chỉ hiển thị error khi KHÔNG đang loading và thực sự có error và không có product nào cả
  // Tránh hiển thị error khi đang load hoặc khi có previousProduct đang hiển thị
  if (!loading && error && !displayProduct) {
    console.error('❌ ProductDetail Error:', error);
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy sản phẩm</h2>
            <p className="text-gray-600 mb-6">Sản phẩm bạn tìm không tồn tại hoặc đã bị xóa.</p>
            <p className="text-sm text-red-600 mb-4">Lỗi: {error}</p>
            <p className="text-xs text-gray-500 mb-4">ID: {id}</p>
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

  // ✅ Đảm bảo có displayProduct trước khi render
  if (!displayProduct) {
    console.warn('⚠️ No displayProduct, showing loading...', { loading, error, hasProduct: !!product, hasPrevious: !!previousProduct });
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải sản phẩm...</p>
          {error && <p className="mt-2 text-sm text-red-500">Lỗi: {error}</p>}
        </div>
      </MainLayout>
    );
  }

  const handleRelatedProductClick = (relatedProduct) => {
    navigate(`/product/${relatedProduct.id}`);
  };

  // SEO data từ product
  const productTitle = displayProduct?.name || 'Sản phẩm';
  const productDescription = displayProduct?.description 
    ? `${displayProduct.description.substring(0, 160)}...` 
    : `Mua ${productTitle} với giá tốt nhất. Giao hàng nhanh, thanh toán an toàn.`;
  const productPrice = displayProduct?.price ? new Intl.NumberFormat('vi-VN').format(displayProduct.price) : '';
  const productImage = displayProduct?.images?.[0] || displayProduct?.image || '';
  const productKeywords = `${productTitle}, ${categoryName}, mua sắm online, công nghệ`;

  // Breadcrumb items for structured data
  const breadcrumbItems = [
    { name: 'Trang chủ', url: `${window.location.origin}/` },
    { name: categoryName, url: `${window.location.origin}/products/${displayProduct?.categoryKey || 'all'}` },
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
      <ProductSchema product={displayProduct} store={store} />
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
                  onClick={() => navigate(`/products/${displayProduct?.categoryKey || 'all'}`)}
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
                <span className="text-gray-900 font-medium">{displayProduct?.name || 'Sản phẩm'}</span>
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
            <ProductGallery product={displayProduct} images={galleryImages} />
          </div>

          {/* Product Info */}
          <div>
            <ProductInfo
              product={displayProduct}
              variantsOverride={variants}
              initialVariantId={id}
              onVariantChange={handleVariantChange}
            />
          </div>
        </div>

        {/* PHẦN 2: Specifications + Shop Info (50:50) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Specifications */}
          <div>
            <ProductSpecifications product={selectedVariant || displayProduct} />
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
                product={displayProduct}
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
            productVariantId={selectedVariant?.id || id}
            onWriteReview={handleWriteReview}
          />
        </div>

        {/* PHẦN 4: Comments (100% width) - Bình luận sản phẩm */}
        <div className="mb-12">
          <ProductComments productVariantId={selectedVariant?.id || id} productId={productIdFromVariant} />
        </div>

        {/* ✅ PHẦN 5: Related Products (100% width) */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Sản phẩm liên quan</h2>
          {relatedLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Đang tải sản phẩm liên quan...</p>
            </div>
          ) : relatedProducts && relatedProducts.length > 0 ? (
            <ProductSection
              title=""
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