import MainLayout from '../../layouts/MainLayout';
import ProductSection from '../../components/common/ProductSection';
import ProductSkeleton from '../../components/common/ProductSkeleton';
import BrandsSection from '../../components/common/BrandsSection';
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProductVariants, usePrefetchVariants } from '../../hooks/useProductVariants';
import { useCategories } from '../../hooks/useCategories';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false); // ✅ State để pause auto-play khi hover
  const navigate = useNavigate();
  const prefetchVariants = usePrefetchVariants();
  
  // ✅ DEBOUNCE TIMER cho prefetch
  const prefetchTimerRef = useRef(null);
  
  // ✅ DÙNG PRODUCT VARIANTS - CÓ ẢNH VÀ GIÁ!
  const { variants: heroVariants, loading: heroLoading } = useProductVariants('latest', { size: 5 });
  const { categories, loading: categoriesLoading } = useCategories();
  
  // ✅ BANNER QUẢNG CÁO - 5 BANNER
  const promotionalBanners = [
    {
      id: 1,
      title: 'iPhone 15 Pro Max',
      subtitle: 'Chip A17 Pro mạnh mẽ, Camera 48MP chuyên nghiệp',
      badge: '🔥 Mới nhất',
      discount: 'Đến 10 Triệu',
      price: '24.990.000',
      installment: 'Trả góp 0%',
      period: '12 Tháng',
      image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80',
      gradient: 'from-gray-900 via-gray-800 to-black',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-white'
    },
    {
      id: 2,
      title: 'MacBook Air M3',
      subtitle: 'Hiệu năng vượt trội, pin trâu 18 giờ',
      badge: '💻 Laptop',
      discount: 'Đến 8 Triệu',
      price: '28.990.000',
      installment: 'Trả góp 0%',
      period: '12 Tháng',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
      gradient: 'from-blue-600 via-blue-500 to-purple-600',
      buttonColor: 'bg-white text-blue-600 hover:bg-blue-50',
      textColor: 'text-white'
    },
    {
      id: 3,
      title: 'Sony WH-1000XM5',
      subtitle: 'Chống ồn chủ động, âm thanh sống động',
      badge: '🎧 Tai nghe',
      discount: 'Đến 3 Triệu',
      price: '6.990.000',
      installment: 'Trả góp 0%',
      period: '6 Tháng',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      gradient: 'from-purple-600 via-purple-500 to-pink-600',
      buttonColor: 'bg-white text-purple-600 hover:bg-purple-50',
      textColor: 'text-white'
    },
    {
      id: 4,
      title: 'Samsung Galaxy Watch 6',
      subtitle: 'Theo dõi sức khỏe 24/7, pin 2 ngày',
      badge: '⌚ Đồng hồ',
      discount: 'Đến 5 Triệu',
      price: '8.990.000',
      installment: 'Trả góp 0%',
      period: '12 Tháng',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
      gradient: 'from-green-600 via-emerald-500 to-teal-600',
      buttonColor: 'bg-white text-green-600 hover:bg-green-50',
      textColor: 'text-white'
    },
    {
      id: 5,
      title: 'LG C3 OLED TV',
      subtitle: 'Màn hình OLED 4K, âm thanh Dolby Atmos',
      badge: '📺 Smart TV',
      discount: 'Đến 15 Triệu',
      price: '32.990.000',
      installment: 'Trả góp 0%',
      period: '12 Tháng',
      image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80',
      gradient: 'from-red-600 via-orange-500 to-yellow-600',
      buttonColor: 'bg-white text-red-600 hover:bg-red-50',
      textColor: 'text-white'
    }
  ];
  
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  
  // ✅ LẤY 5 DANH MỤC ĐẦU TIÊN (BỎ "Tất cả sản phẩm")
  const topCategories = useMemo(() => {
    return categories.filter(cat => cat.key !== 'all').slice(0, 5);
  }, [categories]);
  
  // ✅ FETCH 1 SẢN PHẨM MỚI NHẤT TỪ MỖI DANH MỤC (dùng riêng biệt để tuân thủ rules of hooks)
  // Chỉ fetch khi có đủ 5 categories, nếu không dùng fallback
  const cat1 = useProductVariants(
    topCategories.length >= 1 ? topCategories[0].key : null, 
    { size: 1 }
  );
  const cat2 = useProductVariants(
    topCategories.length >= 2 ? topCategories[1].key : null, 
    { size: 1 }
  );
  const cat3 = useProductVariants(
    topCategories.length >= 3 ? topCategories[2].key : null, 
    { size: 1 }
  );
  const cat4 = useProductVariants(
    topCategories.length >= 4 ? topCategories[3].key : null, 
    { size: 1 }
  );
  const cat5 = useProductVariants(
    topCategories.length >= 5 ? topCategories[4].key : null, 
    { size: 1 }
  );
  
  // ✅ KẾT HỢP THÀNH 5 SẢN PHẨM ĐA DẠNG
  const featuredVariants = useMemo(() => {
    const results = [];
    [cat1, cat2, cat3, cat4, cat5].forEach(({ variants }) => {
      if (variants && variants.length > 0) {
        results.push(variants[0]); // Lấy sản phẩm đầu tiên (mới nhất)
      }
    });
    return results;
  }, [cat1.variants, cat2.variants, cat3.variants, cat4.variants, cat5.variants]);
  
  const featuredLoading = cat1.loading || cat2.loading || cat3.loading || cat4.loading || cat5.loading;
  
  const { variants: laptopVariants, loading: laptopLoading } = useProductVariants('laptops', { size: 5 });
  const { variants: smartphoneVariants, loading: smartphoneLoading } = useProductVariants('smartphones', { size: 5 });

  // GIỚI HẠN 5 SẢN PHẨM CHO HOMEPAGE
  const limitedFeaturedVariants = featuredVariants.slice(0, 5);
  const limitedLaptopVariants = laptopVariants.slice(0, 5);
  const limitedSmartphoneVariants = smartphoneVariants.slice(0, 5);

  // Event handlers
  const handleProductClick = (variant) => {
    // ✅ Nếu có variantId thì điều hướng đến variant detail, nếu không thì điều hướng đến product detail
    if (variant.variantId) {
      navigate(`/product/${variant.variantId}`);
    } else if (variant.id) {
      navigate(`/product/${variant.id}`);
    }
  };

  // ✅ PREFETCH KHI HOVER - DEBOUNCED (chỉ chạy nếu hover > 200ms)
  const debouncedPrefetch = (category, size = 100) => {
    // Clear timer cũ nếu có
    if (prefetchTimerRef.current) {
      clearTimeout(prefetchTimerRef.current);
    }
    
    // Set timer mới - chỉ prefetch nếu hover lâu hơn 200ms
    prefetchTimerRef.current = setTimeout(() => {
      prefetchVariants(category, size);
    }, 200);
  };

  const handleHoverFeatured = () => {
    debouncedPrefetch('all', 100);
  };

  const handleHoverLaptops = () => {
    debouncedPrefetch('laptops', 100);
  };

  const handleHoverSmartphones = () => {
    debouncedPrefetch('smartphones', 100);
  };

  const handleViewAllFeatured = () => {
    navigate('/products/all');
  };

  const handleViewAllLaptops = () => {
    navigate('/products/laptops');
  };

  const handleViewAllSmartphones = () => {
    navigate('/products/smartphones');
  };

  // ✅ THÊM HANDLER CHO CATEGORY CLICK
  const handleCategoryClick = (category) => {
    navigate(`/products/${category.key}`);
  };

  // ✅ PREFETCH KHI HOVER CATEGORY - DEBOUNCED
  const handleHoverCategory = (category) => {
    debouncedPrefetch(category.key, 100);
  };

  // ✅ SLIDER LOGIC CHO BANNER QUẢNG CÁO
  const THUMBNAILS_TO_SHOW = 5;
  const getThumbnailStartIndex = (currentIndex) => {
    const currentStart = Math.floor(currentIndex / THUMBNAILS_TO_SHOW) * THUMBNAILS_TO_SHOW;
    return currentStart;
  };
  
  const thumbnailStartIndex = getThumbnailStartIndex(currentBannerIndex);
  
  const handlePrevious = () => {
    setCurrentBannerIndex((prev) => 
      prev === 0 ? promotionalBanners.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentBannerIndex((prev) => 
      prev === promotionalBanners.length - 1 ? 0 : prev + 1
    );
  };

  const handleThumbnailClick = (index) => {
    setCurrentBannerIndex(index);
  };

  // ✅ AUTO-PLAY ANIMATION - TỰ ĐỘNG CHUYỂN BANNER MỖI 4 GIÂY
  useEffect(() => {
    if (promotionalBanners.length <= 1 || isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => 
        prev === promotionalBanners.length - 1 ? 0 : prev + 1
      );
    }, 4000); // 4 giây

    return () => clearInterval(interval);
  }, [promotionalBanners.length, isPaused]);

  // ✅ CLEANUP PREFETCH TIMER khi unmount
  useEffect(() => {
    return () => {
      if (prefetchTimerRef.current) {
        clearTimeout(prefetchTimerRef.current);
      }
    };
  }, []);

  const visibleThumbnails = promotionalBanners.slice(
    thumbnailStartIndex, 
    thumbnailStartIndex + THUMBNAILS_TO_SHOW
  );

  const currentBanner = promotionalBanners[currentBannerIndex] || promotionalBanners[0];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden relative">
            {/* Sidebar Menu - ✅ DANH MỤC SẢN PHẨM */}
            <div className="w-96 bg-gray-50 border-r border-gray-200 flex flex-col relative z-10">
              <nav className="flex-1 py-4 overflow-y-auto max-h-[600px]">
                {categoriesLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : categories.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500">
                    Không có danh mục
                  </div>
                ) : (
                  categories.map((category, index) => (
                    <button
                      key={category.key || index}
                      onClick={() => handleCategoryClick(category)}
                      onMouseEnter={() => handleHoverCategory(category)}
                      className="w-full flex items-center px-6 py-4 text-base text-gray-700 hover:bg-white hover:text-gray-900 transition-colors group border-b border-gray-200/50 last:border-b-0 text-left whitespace-nowrap"
                    >
                      <span className="mr-4 text-2xl">{category.icon}</span>
                      <span className="flex-1 font-medium">{category.name}</span>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </button>
                  ))
                )}
              </nav>
            </div>

            {/* Main Content Area - BANNER QUẢNG CÁO */}
            <div className="flex-1 flex flex-col relative z-0">
              {/* Banner Slider với Framer Motion */}
              <div 
                className={`relative bg-gradient-to-r ${currentBanner.gradient} h-96 overflow-hidden`}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                {/* Animated Background Pattern */}
                <motion.div 
                  className="absolute inset-0 opacity-10"
                  animate={{ 
                    backgroundPosition: ['0% 0%', '100% 100%'],
                  }}
                  transition={{ 
                    duration: 20, 
                    repeat: Infinity, 
                    repeatType: "reverse",
                    ease: "linear"
                  }}
                >
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 80%, white 0%, transparent 50%)',
                  }}></div>
                </motion.div>

                <div className="absolute inset-0 px-8 z-10 flex items-center justify-between">
                  {/* Previous Button với Framer Motion */}
                  <motion.button
                    onClick={handlePrevious}
                    whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white z-20 shadow-2xl border border-white/30"
                    aria-label="Banner trước"
                  >
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path>
                    </svg>
                  </motion.button>

                  {/* Content - LAYOUT CỐ ĐỊNH: TEXT TRÁI, ẢNH PHẢI với Fade Animation */}
                  <div className="flex-1 px-12 max-w-6xl mx-auto grid grid-cols-12 items-center gap-8">
                    {/* Text Content - BÊN TRÁI với Framer Motion */}
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={currentBannerIndex}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 30 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className={`${currentBanner.textColor} col-span-7 pr-4`}
                      > 
                      <div className="flex items-center mb-6">
                        <span className="bg-white/20 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-full font-bold border border-white/30 shadow-lg">
                          {currentBanner.badge}
                        </span>
                      </div>
                      <h2 className="text-4xl font-extrabold mb-4 drop-shadow-2xl leading-tight">
                        {currentBanner.title}
                      </h2>
                      <p className="text-lg mb-6 opacity-95 font-medium leading-relaxed">{currentBanner.subtitle}</p>
                      
                      {/* 3 THÔNG TIN - KHÔNG KHUNG, THẲNG HÀNG */}
                      <div className="flex items-center gap-8 mb-8">
                        <div className="text-center">
                          <div className="text-xs opacity-90 mb-1 font-medium">Tổng ưu đãi</div>
                          <div className="text-lg font-bold">{currentBanner.discount}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs opacity-90 mb-1 font-medium">Giá chỉ từ</div>
                          <div className="text-lg font-bold">{currentBanner.price}đ</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs opacity-90 mb-1 font-medium">{currentBanner.installment}</div>
                          <div className="text-lg font-bold">{currentBanner.period}</div>
                        </div>
                      </div>
                      
                      <motion.button 
                        className={`${currentBanner.buttonColor} font-bold px-8 py-3 rounded-full shadow-2xl text-base`}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        Mua ngay →
                      </motion.button>
                    </motion.div>
                    </AnimatePresence>

                    {/* Product Image - BÊN PHẢI (CỐ ĐỊNH KHUNG) với Framer Motion */}
                    <div className="col-span-5 h-full flex items-center justify-end">
                      <div className="relative w-[420px] h-[320px] lg:w-[460px] lg:h-[340px] xl:w-[500px] xl:h-[360px]">
                        <motion.div 
                          className="absolute inset-0 bg-white/20 rounded-2xl blur-2xl opacity-50"
                          animate={{ 
                            scale: [1, 1.1, 1],
                            opacity: [0.5, 0.6, 0.5]
                          }}
                          transition={{ 
                            duration: 3, 
                            repeat: Infinity, 
                            ease: "easeInOut" 
                          }}
                        ></motion.div>
                        <AnimatePresence mode="wait">
                          <motion.img
                            key={currentBannerIndex}
                            src={currentBanner.image}
                            alt={currentBanner.title}
                            initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
                            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                            exit={{ opacity: 0, scale: 0.8, rotateY: 15 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            className="relative w-full h-full object-contain drop-shadow-2xl"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/500x360?text=' + encodeURIComponent(currentBanner.title);
                            }}
                          />
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* Next Button với Framer Motion */}
                  <motion.button
                    onClick={handleNext}
                    whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white z-20 shadow-2xl border border-white/30"
                    aria-label="Banner sau"
                  >
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </motion.button>
                </div>
                
                {/* Progress Indicators - Dots với Framer Motion */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
                  {promotionalBanners.map((_, index) => (
                    <motion.button
                      key={index}
                      onClick={() => setCurrentBannerIndex(index)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      className={`rounded-full ${
                        index === currentBannerIndex
                          ? 'w-10 h-3 bg-white shadow-lg'
                          : 'w-3 h-3 bg-white/50 hover:bg-white/70'
                      }`}
                      aria-label={`Chuyển đến banner ${index + 1}`}
                      animate={index === currentBannerIndex ? {
                        scale: [1, 1.1, 1]
                      } : {}}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Thumbnail Navigation - BANNER NHỎ */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 border-t border-gray-200 shadow-inner">
                <div className="flex items-start justify-center space-x-3 mb-4 max-w-6xl mx-auto">
                  {promotionalBanners.map((banner, index) => {
                    const isActive = index === currentBannerIndex;
                    return (
                      <div
                        key={banner.id}
                        onClick={() => handleThumbnailClick(index)}
                        className={`cursor-pointer p-3 rounded-xl border-2 transition-all duration-300 flex-shrink-0 ${
                          isActive
                            ? 'border-blue-500 bg-white shadow-lg scale-105'
                            : 'border-gray-300 hover:border-gray-400 bg-white/80 hover:bg-white'
                        }`}
                        style={{ 
                          width: '170px',
                          minWidth: '170px',
                          maxWidth: '170px',
                          flex: '0 0 170px'
                        }}
                      >
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-2">
                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                              isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {banner.badge}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-gray-900 mb-1 truncate">
                            {banner.title}
                          </div>
                          <div className="text-xs text-gray-600 mb-2 h-8 overflow-hidden" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}>
                            {banner.subtitle}
                          </div>
                          <div className="flex items-center justify-center text-xs">
                            <span className={`font-bold ${isActive ? 'text-blue-600' : 'text-gray-700'}`}>
                              {banner.price}đ
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Carousel Section */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Danh mục sản phẩm</h2>
          
          <div className="relative">
            <button
              onClick={() => {
                const container = document.getElementById('category-carousel');
                if (container) {
                  container.scrollLeft -= 200;
                }
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full flex items-center justify-center transition-colors shadow-md"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            
            <button
              onClick={() => {
                const container = document.getElementById('category-carousel');
                if (container) {
                  container.scrollLeft += 200;
                }
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full flex items-center justify-center transition-colors shadow-md"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
            
            <div 
              id="category-carousel"
              className="flex space-x-4 overflow-x-auto scrollbar-hide scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {categories.map((category) => (
                <div
                  key={category.key}
                  onClick={() => handleCategoryClick(category)}
                  onMouseEnter={() => handleHoverCategory(category)}
                  className="flex-shrink-0 w-48 bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                >
                  <div className="aspect-square bg-gray-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop';
                      }}
                    />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 text-center group-hover:text-blue-600 transition-colors">
                    {category.name}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="py-8 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl p-8 text-white hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4 hover:rotate-12 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold hover:text-blue-300 transition-colors duration-300">SMART WATCH</h3>
                </div>
                <p className="text-lg mb-2 hover:text-blue-200 transition-colors duration-300">M6 Smart Band 2.3 - Fitness Band</p>
                <p className="text-gray-300 mb-4 hover:text-gray-200 transition-colors duration-300">Theo dõi sức khỏe cho nam và nữ, dây đeo đỏ</p>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center hover:scale-110 transition-transform duration-300 cursor-pointer">
                    <span className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                    <span>Nhịp tim</span>
                  </div>
                  <div className="flex items-center hover:scale-110 transition-transform duration-300 cursor-pointer">
                    <span className="w-3 h-3 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                    <span>Bước chân</span>
                  </div>
                  <div className="flex items-center hover:scale-110 transition-transform duration-300 cursor-pointer">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                    <span>Giấc ngủ</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-center group cursor-pointer">
                  <div className="w-20 h-20 bg-white bg-opacity-10 rounded-xl flex items-center justify-center mb-2 hover:bg-opacity-20 hover:scale-110 transition-all duration-300 group-hover:shadow-lg">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-400 rounded-lg flex items-center justify-center">
                      <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                        <div className="w-8 h-8 bg-gray-800 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-300 group-hover:text-white transition-colors duration-300">Apple Watch</div>
                </div>
                <div className="text-center group cursor-pointer">
                  <div className="w-20 h-20 bg-white bg-opacity-10 rounded-xl flex items-center justify-center mb-2 hover:bg-opacity-20 hover:scale-110 transition-all duration-300 group-hover:shadow-lg">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                      <div className="w-12 h-12 bg-green-700 rounded-lg flex items-center justify-center">
                        <div className="w-8 h-8 bg-green-800 rounded-lg"></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-300 group-hover:text-white transition-colors duration-300">Fitness Band</div>
                </div>
                <div className="text-center group cursor-pointer">
                  <div className="w-20 h-20 bg-white bg-opacity-10 rounded-xl flex items-center justify-center mb-2 hover:bg-opacity-20 hover:scale-110 transition-all duration-300 group-hover:shadow-lg">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                      <div className="w-12 h-12 bg-blue-700 rounded-lg flex items-center justify-center">
                        <div className="w-8 h-8 bg-blue-800 rounded-lg"></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-300 group-hover:text-white transition-colors duration-300">Smart Band</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Sections - ✅ DÙNG VARIANTS (CÓ ẢNH VÀ GIÁ) */}
      <ProductSection
        title="Sản phẩm HOT"
        products={limitedFeaturedVariants}
        loading={featuredLoading}
        onProductClick={handleProductClick}
        onViewAllClick={handleViewAllFeatured}
        onHoverViewAll={handleHoverFeatured} // ✅ Prefetch khi hover!
        backgroundColor="bg-gray-50"
        showViewAll={true}
      />

      <ProductSection
        title="Laptop"
        products={limitedLaptopVariants}
        loading={laptopLoading}
        onProductClick={handleProductClick}
        onViewAllClick={handleViewAllLaptops}
        onHoverViewAll={handleHoverLaptops} // ✅ Prefetch khi hover!
        backgroundColor="bg-white"
        showViewAll={true}
      />

      <ProductSection
        title="Điện thoại"
        products={limitedSmartphoneVariants}
        loading={smartphoneLoading}
        onProductClick={handleProductClick}
        onViewAllClick={handleViewAllSmartphones}
        onHoverViewAll={handleHoverSmartphones} // ✅ Prefetch khi hover!
        backgroundColor="bg-gray-50"
        showViewAll={true}
      />

      {/* Brands Section - ✅ GỌI API */}
      <BrandsSection />

      {/* Newsletter Section - GIỮ NGUYÊN */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Đăng ký nhận thông tin khuyến mãi
          </h2>
          <p className="text-blue-100 mb-8">
            Nhận thông báo về sản phẩm mới và ưu đãi đặc biệt từ TechStore
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Nhập email của bạn"
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Đăng ký
            </button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default HomePage;