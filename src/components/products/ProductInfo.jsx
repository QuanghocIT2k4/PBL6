import { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useVariants } from '../../hooks/useVariants';
import { getAttributeLabel } from '../../utils/attributeLabels';
import Button from '../ui/Button';

const ProductInfo = ({ product, variantsOverride = [], initialVariantId, isStoreView = false, onVariantChange }) => {
  const navigate = useNavigate();
  const { addToCart, isInCart, getProductQuantityInCart } = useCart();
  
  // ✅ SỬ DỤNG DYNAMIC VARIANTS (fallback) HOẶC VARIANTS TỪ BE
  const {
    variants: generatedVariants,
    loading: variantsLoadingGenerated,
    getAttributeKeys: getAttributeKeysGenerated,
    getAttributeValues: getAttributeValuesGenerated,
  } = useVariants(product);

  const variants = variantsOverride.length > 0 ? variantsOverride : generatedVariants;
  const variantsLoading = variantsOverride.length > 0 ? false : variantsLoadingGenerated;
  
  const [quantity, setQuantity] = useState(1);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [selectedColor, setSelectedColor] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const addingRef = useRef(false);
  const isInitializedRef = useRef(false); // ✅ Flag để theo dõi đã khởi tạo chưa
  const prevInitialVariantIdRef = useRef(initialVariantId);
  const currentVariantRef = useRef(null); // ✅ Giữ lại variant hiện tại để tránh tự động chuyển

  // ✅ Reset flag khi initialVariantId thay đổi (navigate sang variant khác)
  useEffect(() => {
    if (String(prevInitialVariantIdRef.current) !== String(initialVariantId)) {
      isInitializedRef.current = false;
      prevInitialVariantIdRef.current = initialVariantId;
      setSelectedAttributes({}); // Reset để khởi tạo lại
      setSelectedColor(null);
    }
  }, [initialVariantId]);

  // ✅ Helper: collect values for an attribute from variantsOverride
  const collectValuesFromVariants = (list, key) => {
    const set = new Set();
    list.forEach(v => {
      const val = v.attributes?.[key];
      if (val) set.add(val);
    });
    return Array.from(set);
  };

  // ✅ Helper: get attribute values (ưu tiên data thật)
  const getAttributeValues = (attributeKey) => {
    if (variantsOverride.length > 0) {
      return collectValuesFromVariants(variantsOverride, attributeKey);
    }
    return getAttributeValuesGenerated(attributeKey);
  };

  // ✅ LẤY ATTRIBUTE KEYS TỪ DATA THẬT (variantsOverride) HOẶC TEMPLATE
  const attributeKeys = useMemo(() => {
    if (variantsOverride.length > 0) {
      const keys = new Set();
      variantsOverride.forEach(v => {
        Object.keys(v.attributes || {}).forEach(k => keys.add(k));
      });
      return Array.from(keys);
    }
    return getAttributeKeysGenerated();
  }, [variantsOverride, getAttributeKeysGenerated]);

  // ✅ Chỉ coi là thuộc tính phân loại khi có hơn 1 giá trị trong các variant
  // ✅ LOẠI BỎ STORAGE KEY - CHỈ GIỮ LẠI MÀU SẮC
  const variationKeys = useMemo(() => {
    // ✅ KHÔNG HIỂN THỊ BẤT KỲ ATTRIBUTE NÀO - CHỈ GIỮ MÀU SẮC
    // Màu sắc sẽ được hiển thị riêng từ colorOptions
    return [];
  }, []);

  // ✅ KHỞI TẠO SELECTED COLOR (KHÔNG CÒN SELECTED ATTRIBUTES VÌ ĐÃ XÓA BỘ NHỚ TRONG)
  useEffect(() => {
    if (isInitializedRef.current) return; // ✅ Đã khởi tạo rồi thì không làm gì

    // Nếu có initialVariantId, ưu tiên variant đó
    let initialVariant =
      variants.find(v => String(v.id) === String(initialVariantId)) ||
      variants.find(v => String(v.variantId) === String(initialVariantId));

    // ✅ Nếu không tìm thấy variant từ initialVariantId, KHÔNG fallback về rẻ nhất
    // Giữ nguyên để tránh tự động chuyển variant
    if (!initialVariant) {
      console.warn(`Không tìm thấy variant với ID: ${initialVariantId}`);
      isInitializedRef.current = true;
      return;
    }

    // ✅ Chỉ khởi tạo màu sắc từ variant được chọn
    const colors = (initialVariant?.colors && initialVariant.colors.length > 0) ? initialVariant.colors : [];
    if (colors.length > 0 && !selectedColor) {
      setSelectedColor(colors[0]);
    }
    
    isInitializedRef.current = true; // ✅ Đánh dấu đã khởi tạo
  }, [variants, initialVariantId, selectedColor]);

  // ✅ CURRENT OPTIONS CHO CART
  const currentOptions = useMemo(() => selectedAttributes, [selectedAttributes]);

  // ✅ TÌM VARIANT HIỆN TẠI
  // ✅ VÌ ĐÃ XÓA VARIATION KEYS (BỘ NHỚ TRONG), CHỈ GIỮ LẠI VARIANT TỪ INITIALVARIANTID
  const currentVariant = useMemo(() => {
    if (variants.length === 0) return null;
    
    // ✅ LUÔN ƯU TIÊN TÌM VARIANT TỪ INITIALVARIANTID (từ URL)
    if (initialVariantId) {
      const foundById = variants.find(v => 
        String(v.id) === String(initialVariantId) || 
        String(v.variantId) === String(initialVariantId)
      );
      if (foundById) return foundById;
    }
    
    // ✅ Nếu không có initialVariantId, fallback về variant đầu tiên hoặc rẻ nhất
    return [...variants].sort((a, b) => (a.price || 0) - (b.price || 0))[0];
  }, [variants, initialVariantId]);

  // Tên hiển thị: ưu tiên tên biến thể đang chọn
  const displayName = currentVariant?.name || product?.name;

  // ✅ Update UI và navigate khi variant thay đổi (khi người dùng chọn attribute)
  // CHỈ chạy khi variant ID thay đổi, KHÔNG chạy khi selectedColor thay đổi
  const prevVariantIdRef = useRef(currentVariant?.id || currentVariant?.variantId);
  
  useEffect(() => {
    if (!isInitializedRef.current) return;
    if (!currentVariant) return; // Không có variant thì không làm gì
    
    const targetId = currentVariant.id || currentVariant.variantId;
    if (!targetId) return;
    
    // ✅ Chỉ navigate khi variant ID thực sự thay đổi (không phải do re-render)
    const prevId = prevVariantIdRef.current;
    const isVariantChanged = String(targetId) !== String(prevId);
    
    if (!isVariantChanged) return; // Variant không đổi thì không làm gì
    
    console.log('🔄 Variant changed:', { from: prevId, to: targetId });
    prevVariantIdRef.current = targetId;
    
    // ✅ Call onVariantChange để update UI ngay lập tức (QUAN TRỌNG: phải gọi TRƯỚC khi navigate)
    if (typeof onVariantChange === 'function') {
      // ✅ Đảm bảo có selectedColor từ variant mới nếu chưa có
      const colorToUse = selectedColor || (currentVariant.colors && currentVariant.colors[0]) || null;
      console.log('📞 Calling onVariantChange with:', { variantId: targetId, color: colorToUse?.colorName || colorToUse?.name });
      onVariantChange(currentVariant, colorToUse);
    }
    
    // ✅ Nếu variant khác với initialVariantId → navigate sang URL mới
    if (String(targetId) !== String(initialVariantId)) {
      navigate(`/product/${targetId}`, { replace: true });
    }
  }, [currentVariant?.id, currentVariant?.variantId, currentVariant, initialVariantId, navigate, onVariantChange, selectedColor]);

  const productInCart = isInCart(product?.id, currentOptions);
  const totalQuantityInCart = getProductQuantityInCart(product?.id, currentOptions);

  // ✅ GIÁ HIỂN THỊ (ưu tiên giá theo màu nếu có)
  // Dùng state để track giá và chỉ update khi giá số thực sự thay đổi (tránh chớp)
  const [displayPriceFormatted, setDisplayPriceFormatted] = useState(() => {
    const price = (selectedColor?.price) || (currentVariant?.price) || (product?.price);
    return price ? price.toLocaleString('vi-VN') : null;
  });
  
  const prevPriceRef = useRef(null);
  
  // ✅ Chỉ update state khi giá số thực sự thay đổi
  useEffect(() => {
    const newPrice = (selectedColor?.price) || (currentVariant?.price) || (product?.price);
    
    // Chỉ update khi giá số thực sự thay đổi
    if (newPrice !== prevPriceRef.current) {
      prevPriceRef.current = newPrice;
      const formatted = newPrice ? newPrice.toLocaleString('vi-VN') : null;
      setDisplayPriceFormatted(formatted);
    }
  }, [
    selectedColor?.price,
    currentVariant?.price,
    product?.price,
  ]);

  // ✅ COLOR OPTIONS (từ variant.colors) - Đảm bảo luôn lấy từ variant hiện tại
  const colorOptions = useMemo(() => {
    if (!currentVariant) {
      console.log('⚠️ No currentVariant for colorOptions');
      return [];
    }
    const colors = Array.isArray(currentVariant.colors) ? currentVariant.colors : [];
    console.log('🎨 Color options from variant:', {
      variantId: currentVariant.id || currentVariant.variantId,
      colorsCount: colors.length,
      colors: colors.map(c => c.colorName || c.name),
    });
    return colors;
  }, [currentVariant?.id, currentVariant?.variantId, currentVariant?.colors]);

  // ✅ Chỉ update màu khi variant thay đổi, KHÔNG override khi người dùng chọn màu
  const prevVariantIdForColorRef = useRef(currentVariant?.id || currentVariant?.variantId);
  
  useEffect(() => {
    if (!isInitializedRef.current) return;
    
    const currentVariantId = currentVariant?.id || currentVariant?.variantId;
    const prevVariantId = prevVariantIdForColorRef.current;
    
    // ✅ CHỈ update màu khi variant ID thay đổi (không phải khi người dùng chọn màu)
    if (String(currentVariantId) === String(prevVariantId)) return;
    
    prevVariantIdForColorRef.current = currentVariantId;
    
    // Khi đổi variant, set lại màu đầu tiên nếu có
    if (colorOptions.length > 0) {
      // giữ màu đang chọn nếu vẫn tồn tại trong variant mới
      const exists = selectedColor && colorOptions.find(c => 
        c.colorName === selectedColor.colorName || 
        c.name === selectedColor.name ||
        c._id === selectedColor._id ||
        c.id === selectedColor.id
      );
      setSelectedColor(exists || colorOptions[0]);
    } else {
      setSelectedColor(null);
    }
  }, [currentVariant?.id, currentVariant?.variantId, colorOptions]);

  // ✅ SỬA LẠI - SỬ DỤNG USEMEMO ĐỂ TRÁNH RE-CREATE FUNCTION
  const handleAddToCart = useMemo(() => {
    return async (event) => {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      if (!product || isAdding || addingRef.current) return; // Tránh double-click
      
      addingRef.current = true;
      setIsAdding(true);
      try {
        // ✅ CỘNG DỒN SỐ LƯỢNG CHO SẢN PHẨM CÙNG VARIANT  
        const selectedColorId = selectedColor?._id || selectedColor?.id || selectedColor?.colorId;
        const optionsWithColor = {
          ...selectedAttributes,
          color: selectedColor?.colorName || selectedColor?.name,
          colorId: selectedColorId
        };
        const result = await addToCart(product, quantity, optionsWithColor);
        
        if (result.success) {
          // Show success notification
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300';
          notification.textContent = result.message;
          document.body.appendChild(notification);
          
          // Auto remove notification after 3 seconds
          setTimeout(() => {
            notification.classList.add('opacity-0', 'translate-x-full');
            setTimeout(() => {
              if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
              }
            }, 300);
          }, 3000);
          
          // Reset quantity về 1 sau khi thêm thành công
          setQuantity(1);
        } else if (result.requiresLogin) {
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 right-4 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300';
          notification.textContent = result.error || 'Vui lòng đăng nhập để thêm vào giỏ hàng';
          document.body.appendChild(notification);
          setTimeout(() => {
            notification.classList.add('opacity-0', 'translate-x-full');
            setTimeout(() => {
              if (notification.parentNode) notification.parentNode.removeChild(notification);
            }, 300);
          }, 2500);
        }
      } finally {
        setIsAdding(false);
        // Reset ref sau khi hoàn thành
        setTimeout(() => {
          addingRef.current = false;
        }, 100);
      }
    };
  }, [product, quantity, currentOptions, isAdding, addToCart]);

  // ✅ SỬA: handleBuyNow sử dụng forceNew = true (để tạo item riêng cho "Mua ngay")
  const handleBuyNow = async () => {
    if (!product || isBuying) return; // Tránh double-click
    
    setIsBuying(true);
    try {
      // Thêm sản phẩm vào giỏ hàng trước (tạo item riêng cho "Mua ngay")
      const selectedColorId = selectedColor?._id || selectedColor?.id || selectedColor?.colorId;
      const optionsWithColor = {
        ...currentOptions,
        color: selectedColor?.colorName || selectedColor?.name,
        colorId: selectedColorId
      };
      const result = await addToCart(product, quantity, optionsWithColor);
      
      if (result.success) {
        // Show processing notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300';
        notification.innerHTML = `
          <div class="flex items-center">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-3"></div>
            Đang thêm vào giỏ hàng...
          </div>
        `;
        document.body.appendChild(notification);
        
        // Navigate with state sau 1 giây
        setTimeout(() => {
          navigate('/cart', { 
            state: { fromBuyNow: true }
          });
          
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 1000);
        
        setQuantity(1);
      } else if (result.requiresLogin) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300';
        notification.textContent = result.error || 'Vui lòng đăng nhập để mua ngay';
        document.body.appendChild(notification);
        setTimeout(() => {
          notification.classList.add('opacity-0', 'translate-x-full');
          setTimeout(() => {
            if (notification.parentNode) notification.parentNode.removeChild(notification);
          }, 300);
        }, 2500);
      }
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Product Title & Badge */}
      <div className="animate-in fade-in duration-700">
        <div className="flex items-center space-x-2 mb-2">
          <h1 className="text-2xl font-bold text-gray-900 transition-all duration-300 ease-in-out hover:text-blue-600">
            {displayName}
          </h1>
          {product?.badge && (
            <span className={`px-2 py-1 rounded text-xs font-medium text-white transition-all duration-300 ease-in-out transform hover:scale-110 ${
              product.badge === 'Hot' ? 'bg-red-500 hover:bg-red-600' :
              product.badge === 'Mới nhất' ? 'bg-green-500 hover:bg-green-600' :
              product.badge === 'Gaming' ? 'bg-purple-500 hover:bg-purple-600' :
              'bg-blue-500 hover:bg-blue-600'
            }`}>
              {product.badge}
            </span>
          )}
        </div>
        <p className="text-gray-600 transition-colors duration-300 ease-in-out hover:text-gray-800">{product?.subtitle}</p>
      </div>

      {/* Price */}
      <div className="space-y-1">
        <div className="flex items-center space-x-3 relative h-12">
          <span className="text-3xl font-bold text-red-600 transition-opacity duration-200 ease-in-out">
            {displayPriceFormatted ? `${displayPriceFormatted}đ` : '0đ'}
          </span>
        </div>
        {/* Không lặp lại label màu ở đây để tránh dư chữ "Màu" */}
      </div>

      {/* ✅ DYNAMIC ATTRIBUTES - Tự động theo category */}
      {variantsLoading ? (
        <div className="text-gray-500 text-sm">Đang tải tùy chọn...</div>
      ) : (
        <>
          {/* Thuộc tính phân loại (nếu có) */}
          {variationKeys.length > 0 &&
            variationKeys.map((attrKey) => {
              const values = getAttributeValues(attrKey);
              if (values.length === 0) return null;

              const label = getAttributeLabel(attrKey);

              return (
                <div key={attrKey}>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    {label}:
                  </h3>
                  <div className={`${values.length > 4 ? 'grid grid-cols-2 gap-2' : 'flex flex-wrap gap-2'}`}>
                    {values.map((value) => (
                      <button
                        key={value}
                        onClick={() => setSelectedAttributes(prev => ({ ...prev, [attrKey]: value }))}
                        className={`px-4 py-2 rounded-lg border text-sm ${
                          selectedAttributes[attrKey] === value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 text-gray-700'
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

          {/* Color options từ colors array (hiển thị cả khi chỉ có 1 màu) */}
          {colorOptions.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Màu sắc:</h3>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((c) => {
                  const colorKey = c._id ?? c.id ?? c.colorName ?? c.name;
                  const selectedKey = selectedColor?._id ?? selectedColor?.id ?? selectedColor?.colorName ?? selectedColor?.name;
                  const isSelected = Boolean(selectedKey && selectedKey === colorKey);

                  return (
                    <button
                      key={c._id || c.id || c.colorName}
                      onClick={() => setSelectedColor(c)}
                      className={`px-4 py-2 rounded-lg border text-sm flex items-center gap-3 transition-all focus:outline-none focus:ring-0 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                          : 'border-black bg-white text-gray-900 hover:border-blue-300 hover:text-blue-700'
                      }`}
                      title={c.colorName}
                    >
                      {c.image ? (
                        <img src={c.image} alt={c.colorName} className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <span className="w-10 h-10 rounded bg-gray-200 inline-block" />
                      )}
                      <div className="flex flex-col items-start leading-tight">
                        <span className="font-semibold text-gray-900">{c.colorName || c.name || 'Không rõ màu'}</span>
                        <span className="text-xs text-gray-600 font-medium">
                          {((c.price ?? displayPriceValue)?.toLocaleString('vi-VN') || '0')}đ
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Quantity - Chỉ hiển thị cho buyer */}
      {!isStoreView && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Số lượng:</h3>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center"
            >
              -
            </button>
            <span className="text-lg font-medium min-w-[2rem] text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons - Chỉ hiển thị cho buyer */}
      {!isStoreView && (
        <div className="space-y-3">
          <Button
            onClick={handleBuyNow}
            className="w-full bg-gradient-to-r from-red-600 to-red-700"
            size="lg"
            loading={isBuying}
            disabled={isAdding || isBuying}
          >
            {isBuying ? 'Đang xử lý...' : 'Mua ngay'}
          </Button>
          
          <Button
            onClick={handleAddToCart}
            variant="outline"
            className="w-full border-2 border-blue-600 text-blue-600"
            size="lg"
            loading={isAdding}
            disabled={isAdding || isBuying}
          >
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 4M7 13v8a2 2 0 002 2h6a2 2 0 002-2v-8m-9 0V9a2 2 0 012-2h6a2 2 0 012 2v4.01"/>
              </svg>
              Thêm vào giỏ hàng
            </div>
          </Button>
        </div>
      )}

      {/* Cart Status - Chỉ hiển thị cho buyer */}
      {!isStoreView && productInCart && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center text-green-700">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span className="font-medium">Đã có {totalQuantityInCart} sản phẩm này trong giỏ hàng</span>
          </div>
        </div>
      )}

      {/* Additional Info - Platform-level benefits - Chỉ hiển thị cho buyer */}
      {!isStoreView && product && (
        <div className="border-t pt-4 space-y-2 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Miễn phí vận chuyển toàn quốc</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Bảo hành chính hãng 12 tháng</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Đổi trả trong 7 ngày</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductInfo;