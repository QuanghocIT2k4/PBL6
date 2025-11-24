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
  compact = false
}) => {
  const [addingToCart] = useState(new Set());

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
                    {/* ✅ Hỗ trợ Product Variants: ưu tiên primaryImage, sau đó images[0], cuối cùng image */}
                    {product.image || product.primaryImage ? (
                      <img 
                        src={product.image || product.primaryImage} 
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/200x200?text=No+Image';
                        }}
                      />
                    ) : product.images && product.images.length > 0 ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/200x200?text=No+Image';
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
                    {/* ✅ SỬA: Hiển thị giá hoặc "Liên hệ" nếu không có */}
                    {product.price && product.price > 0 ? (
                      <span className="text-sm font-bold text-red-600">
                        {product.price.toLocaleString('vi-VN')}đ
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-gray-500">
                        Liên hệ
                      </span>
                    )}
                  </div>
                  
                  {/* Button xem chi tiết */}
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
        )}
      </div>
    </section>
  );
});

ProductSection.displayName = 'ProductSection';

export default ProductSection;