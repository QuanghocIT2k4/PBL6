import { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useVariants } from '../../hooks/useVariants';
import { getAttributeLabel } from '../../utils/attributeLabels';
import Button from '../ui/Button';

const ProductInfo = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart, isInCart, getProductQuantityInCart } = useCart();
  
  // ✅ SỬ DỤNG DYNAMIC VARIANTS
  const { variants, loading: variantsLoading, getAttributeKeys, getAttributeValues, findVariantByAttributes } = useVariants(product);
  
  const [quantity, setQuantity] = useState(1);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const addingRef = useRef(false);

  // ✅ LẤY ATTRIBUTE KEYS TỪ CATEGORY
  const attributeKeys = getAttributeKeys();

  // ✅ KHỞI TẠO SELECTED ATTRIBUTES
  useEffect(() => {
    if (attributeKeys.length > 0 && Object.keys(selectedAttributes).length === 0) {
      const initialAttrs = {};
      attributeKeys.forEach(key => {
        const values = getAttributeValues(key);
        if (values.length > 0) {
          initialAttrs[key] = values[0];
        }
      });
      setSelectedAttributes(initialAttrs);
    }
  }, [attributeKeys, selectedAttributes, getAttributeValues]);

  // ✅ CURRENT OPTIONS CHO CART
  const currentOptions = useMemo(() => selectedAttributes, [selectedAttributes]);

  // ✅ TÌM VARIANT HIỆN TẠI
  const currentVariant = useMemo(() => {
    return findVariantByAttributes(selectedAttributes);
  }, [selectedAttributes, findVariantByAttributes]);

  const productInCart = isInCart(product?.id, currentOptions);
  const totalQuantityInCart = getProductQuantityInCart(product?.id, currentOptions);

  // ✅ GIÁ HIỂN THỊ
  const displayPrice = currentVariant?.price || product?.price;

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
        const result = await addToCart(product, quantity, selectedAttributes);
        
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
      const result = await addToCart(product, quantity, currentOptions);
      
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
          <h1 className="text-2xl font-bold text-gray-900 transition-all duration-300 ease-in-out hover:text-blue-600">{product?.name}</h1>
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
        <div className="flex items-center space-x-3">
          <span className="text-3xl font-bold text-red-600">
            {displayPrice?.toLocaleString('vi-VN')}đ
          </span>
        </div>
      </div>

      {/* ✅ DYNAMIC ATTRIBUTES - Tự động theo category */}
      {variantsLoading ? (
        <div className="text-gray-500 text-sm">Đang tải tùy chọn...</div>
      ) : attributeKeys.length > 0 ? (
        <>
          {attributeKeys.map((attrKey, index) => {
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
        </>
      ) : (
        <div className="text-gray-500 text-sm italic">Sản phẩm này không có tùy chọn</div>
      )}

      {/* Quantity */}
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

      {/* Action Buttons */}
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

      {/* Cart Status */}
      {productInCart && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center text-green-700">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span className="font-medium">Đã có {totalQuantityInCart} sản phẩm này trong giỏ hàng</span>
          </div>
        </div>
      )}

      {/* Additional Info - Platform-level benefits (có thể giữ) */}
      {product && (
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