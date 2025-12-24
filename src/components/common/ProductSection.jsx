import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import ProductSkeleton from './ProductSkeleton';

const ProductSection = memo(({ 
  title = "Sản phẩm nổi bật",
  showViewAll = true,
  products = [],
  loading = false,
  columns = "lg:grid-cols-5",
  onProductClick,
  onViewAllClick,
  onHoverViewAll, // ✅ Thêm prop mới cho prefetch
  backgroundColor = "bg-gray-50",
  compact = false,
  disableAnimations = false // ✅ Tắt animation khi filter để tăng performance
}) => {
  const [addingToCart] = useState(new Set());

  const FALLBACK_IMG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23f3f4f6"/><text x="100" y="100" text-anchor="middle" fill="%239ca3af" font-size="14" font-family="Arial">No Image</text></svg>';

  // ✅ Tính giá hiển thị: lấy giá thấp nhất trong màu (nếu có), fallback price
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

    // Bỏ giá không hợp lệ/âm
    const valid = prices.filter(p => Number.isFinite(p) && p > 0);
    if (valid.length === 0) return null;
    return Math.min(...valid);
  };

  // ✅ Ảnh bìa: ưu tiên ảnh màu (colors[0]) trước, rồi mới tới image fields khác
  const getCoverImage = (product) => {
    const colors = Array.isArray(product?.colors)
      ? product.colors
      : Array.isArray(product?.attributes?.colors)
        ? product.attributes.colors
        : [];

    // Helper: lấy ảnh từ một biến thể
    const pickFromVariant = (v) => (
      (Array.isArray(v?.colors) &&
        v.colors.length > 0 &&
        (v.colors[0].image || v.colors[0].colorImage || v.colors[0].imageUrl)) ||
      (Array.isArray(v?.attributes?.colors) &&
        v.attributes.colors.length > 0 &&
        (v.attributes.colors[0].image || v.attributes.colors[0].colorImage || v.attributes.colors[0].imageUrl)) ||
      v?.primaryImage ||
      (v?.images && v.images[0]) ||
      v?.image ||
      (v?.imageUrls && v.imageUrls[0]) ||
      null
    );

    // Ưu tiên ảnh màu của product
    const fromProductColor = (
      colors.length > 0 &&
      (colors[0].image || colors[0].colorImage || colors[0].imageUrl)
    );

    // Ảnh trực tiếp của product
    const fromProductImage =
      product?.primaryImageUrl ||
      (product?.imageUrls && product.imageUrls[0]) ||
      product?.primaryImage ||
      product?.image ||
      (product?.images && product.images[0]);

    // Fallback: ảnh từ biến thể đầu tiên (nhiều field tên khác nhau)
    const variantsArr =
      (Array.isArray(product?.variants) && product.variants) ||
      (Array.isArray(product?.productVariants) && product.productVariants) ||
      (Array.isArray(product?.variantList) && product.variantList) ||
      null;

    const fromVariant = variantsArr && variantsArr.length > 0 ? pickFromVariant(variantsArr[0]) : null;

    return fromProductColor || fromProductImage || fromVariant || null;
  };

  // Chỉ điều hướng tới trang chi tiết
  const handleViewDetail = (e, product) => {
    e.stopPropagation();
    onProductClick?.(product);
  };

  const sectionPadding = compact ? 'py-2' : 'py-16';
  const headerMargin = compact ? 'mb-4' : 'mb-12';
  const titleSize = compact ? 'text-2xl' : 'text-2xl';

  // ✅ Framer Motion animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  return (
    <section className={`${sectionPadding} ${backgroundColor}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header với title và button "Xem tất cả" */}
        <div className={`flex justify-between items-center ${headerMargin}`}>
          <h2 className={`${titleSize} font-bold text-gray-900`}>
            {title}
          </h2>
          {showViewAll && (
            <button 
              onClick={onViewAllClick}
              onMouseEnter={onHoverViewAll} // ✅ Prefetch khi hover!
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Xem tất cả →
            </button>
          )}
        </div>
        
        {loading ? (
          /* ✅ SKELETON LOADING - Hiển thị placeholder mượt mà */
          <ProductSkeleton count={5} />
        ) : (
          /* Grid sản phẩm với Framer Motion */
          disableAnimations ? (
            /* ✅ TẮT ANIMATION KHI FILTER để tăng performance */
            <div className={`grid grid-cols-2 sm:grid-cols-3 ${columns} gap-4`}>
              {products.map((product, index) => (
                <div 
                  key={`${product.id}-${index}`}
                  onClick={() => onProductClick?.(product)}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer group hover:shadow-lg transition-shadow"
                >
                {/* Ảnh sản phẩm */}
                <div className="relative overflow-hidden">
                  <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center group-hover:from-gray-200 group-hover:to-gray-300 transition-colors">
                    {/* ✅ Hỗ trợ Product Variants: ưu tiên primaryImageUrl/imageUrls/images/colors */}
                    {getCoverImage(product) ? (
                      <img 
                        src={getCoverImage(product)} 
                        alt={product.name || 'Sản phẩm'}
                        loading="lazy"
                        width="200"
                        height="200"
                        decoding="async"
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 ease-out"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = FALLBACK_IMG;
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <span className="text-xs mt-1">Chưa có ảnh</span>
                      </div>
                    )}
                  </div>
                  {/* Badge (Hot, Giảm giá, v.v.) */}
                  {product.badge && (
                    <span className={`absolute top-2 left-2 text-white text-xs px-2 py-1 rounded ${
                      product.badge === 'Hot' ? 'bg-red-500' :
                      product.badge === 'Mới nhất' ? 'bg-green-500' :
                      product.badge === 'Gaming' ? 'bg-purple-500' :
                      product.badge === 'Bestseller' ? 'bg-orange-500' :
                      'bg-red-500'
                    }`}>
                      {product.badge}
                    </span>
                  )}
                </div>
                
                {/* Thông tin sản phẩm */}
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 mb-1 text-xs line-clamp-2 h-8 group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                  
                  {/* ✅ Tên cửa hàng */}
                  {(product.store?.name || product.storeName || product.storeId) && (
                    <div className="flex items-center space-x-1 mb-2">
                      <span className="text-[10px] text-gray-500">🏪</span>
                      <span className="text-[10px] text-gray-600 truncate">
                        {product.store?.name || product.storeName || `Store #${product.storeId?.slice(-6)}`}
                      </span>
                    </div>
                  )}
                  
                  {/* Giá sản phẩm */}
                  <div className="flex flex-col space-y-1">
                    {/* ✅ Hiển thị giá thấp nhất trong màu (nếu có) */}
                    {(() => {
                      const price = getDisplayPrice(product);
                      if (price && price > 0) {
                        return (
                          <span className="text-sm font-bold text-red-600">
                            {price.toLocaleString('vi-VN')}đ
                          </span>
                        );
                      }
                      return (
                        <span className="text-sm font-medium text-gray-500">
                          Liên hệ
                        </span>
                      );
                    })()}
                  </div>
                  
                  {/* Button xem chi tiết */}
                  <div className="mt-2">
                    <button 
                      onClick={(e) => handleViewDetail(e, product)}
                      className="w-full bg-blue-600 text-white py-1.5 rounded-md hover:bg-blue-700 text-xs font-medium transition-colors"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              </div>
              ))}
            </div>
          ) : (
            /* ✅ CÓ ANIMATION khi không filter */
            <motion.div 
              className={`grid grid-cols-2 sm:grid-cols-3 ${columns} gap-4`}
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {products.map((product, index) => (
                <motion.div 
                  key={`${product.id}-${index}`} 
                  variants={itemVariants}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -8,
                    transition: { type: "spring", stiffness: 400, damping: 17 }
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onProductClick?.(product)}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer group"
                >
                  {/* Ảnh sản phẩm */}
                  <div className="relative overflow-hidden">
                    <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center group-hover:from-gray-200 group-hover:to-gray-300 transition-colors">
                      {getCoverImage(product) ? (
                        <img 
                          src={getCoverImage(product)} 
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 ease-out"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = FALLBACK_IMG;
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          <span className="text-xs mt-1">Chưa có ảnh</span>
                        </div>
                      )}
                    </div>
                    {product.badge && (
                      <span className={`absolute top-2 left-2 text-white text-xs px-2 py-1 rounded ${
                        product.badge === 'Hot' ? 'bg-red-500' :
                        product.badge === 'Mới nhất' ? 'bg-green-500' :
                        product.badge === 'Gaming' ? 'bg-purple-500' :
                        product.badge === 'Bestseller' ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}>
                        {product.badge}
                      </span>
                    )}
                  </div>
                  
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 mb-1 text-xs line-clamp-2 h-8 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                    
                    {(product.store?.name || product.storeName || product.storeId) && (
                      <div className="flex items-center space-x-1 mb-2">
                        <span className="text-[10px] text-gray-500">🏪</span>
                        <span className="text-[10px] text-gray-600 truncate">
                          {product.store?.name || product.storeName || `Store #${product.storeId?.slice(-6)}`}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex flex-col space-y-1">
                      {(() => {
                        const price = getDisplayPrice(product);
                        if (price && price > 0) {
                          return (
                            <span className="text-sm font-bold text-red-600">
                              {price.toLocaleString('vi-VN')}đ
                            </span>
                          );
                        }
                        return (
                          <span className="text-sm font-medium text-gray-500">
                            Liên hệ
                          </span>
                        );
                      })()}
                    </div>
                    
                    <div className="mt-2">
                      <motion.button 
                        onClick={(e) => handleViewDetail(e, product)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-blue-600 text-white py-1.5 rounded-md hover:bg-blue-700 text-xs font-medium"
                      >
                        Xem chi tiết
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )
        )}
      </div>
    </section>
  );
});

ProductSection.displayName = 'ProductSection';

export default ProductSection;