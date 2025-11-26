import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import * as cartService from '../services/buyer/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const lastAddRef = useRef({ id: null, timestamp: 0 }); // Track last add để chống duplicate
  const { user } = useAuth();

  // ✅ Function để fetch cart (có thể gọi từ nhiều nơi)
  const fetchCart = async () => {
    try {
      // 🚫 BỎ QUA HOÀN TOÀN CHO ADMIN: Không load cart trên trang admin
      const isAdmin = Array.isArray(user?.roles) && user.roles.includes('ROLE_ADMIN');
      if (isAdmin) {
        setCartItems([]);
        return;
      }

      const token = localStorage.getItem('token');
        
        // ✅ NẾU CÓ TOKEN, LOAD TỪ BACKEND
        if (token) {
          const result = await cartService.getCart();
          
          if (result.success && result.data) {
            
            // ✅ LOAD TỪ BACKEND RESPONSE
            // Backend có thể trả về: result.data.cartItems HOẶC result.data (array)
            let backendCart = [];
            if (Array.isArray(result.data)) {
              backendCart = result.data;
            } else if (result.data.cartItems && Array.isArray(result.data.cartItems)) {
              backendCart = result.data.cartItems;
            } else {
              console.error('❌ Backend response không có cartItems!', result.data);
            }
            
            const normalized = backendCart.map(item => {
              // ✅ Backend đã sửa: trả về productVariantId + productVariantName
              // Structure: { id, productVariantId, productVariantName, imageUrl, quantity, price, storeId }
              
              const variantId = item.productVariantId || item.productId;
              const productName = item.productVariantName || item.productName || item.name;
              
              if (!variantId || !productName) {
                console.warn('⚠️ Cart item missing productVariantId or productName:', {
                  item,
                  hasProductVariantId: !!item.productVariantId,
                  hasProductId: !!item.productId,
                  hasProductVariantName: !!item.productVariantName,
                  hasProductName: !!item.productName,
                  allKeys: Object.keys(item)
                });
                return null;
              }
              
              // ✅ Tạo product object từ backend data
              const product = {
                id: variantId,
                name: productName,
                image: item.imageUrl,
                price: item.price || 0,
                storeId: item.storeId || item.store?.id, // ← Backend có thể trả về store.id thay vì storeId
                // Copy tất cả fields khác từ backend item
                ...item
              };
              
              return {
                id: item.id,
                productVariantId: variantId, // ← Thêm field này!
                product: product,
                quantity: item.quantity || 1,
                selected: true,
                addedAt: item.createdAt || new Date().toISOString(),
                options: item.options || {}
              };
            }).filter(item => item !== null); // Lọc bỏ items không hợp lệ
            
            setCartItems(normalized);
            // ✅ Sync to localStorage
            localStorage.setItem('cart', JSON.stringify(normalized));
          } else {
            setCartItems([]);
            localStorage.removeItem('cart');
          }
        } else {
          // ✅ GUEST USER: LOAD TỪ LOCALSTORAGE
          const savedCart = localStorage.getItem('cart');
          if (savedCart) {
            const parsed = JSON.parse(savedCart);
            const normalized = Array.isArray(parsed)
              ? parsed.map(item => ({ 
                  ...item, 
                  selected: item.selected !== false,
                  addedAt: item.addedAt || new Date().toISOString(),
                  options: item.options || {}
                }))
              : [];
            setCartItems(normalized);
          } else {
            setCartItems([]);
          }
        }
      } catch (error) {
        setCartItems([]);
        // Clear corrupted data
        localStorage.removeItem('cart');
      } finally {
        setIsInitialized(true);
      }
  };

  // Load cart từ backend hoặc localStorage khi khởi tạo
  useEffect(() => {
    fetchCart();
  }, [user?.roles]);

  // ✅ Theo dõi logout event và xóa giỏ hàng khi logout
  useEffect(() => {
    const handleLogout = () => {
      console.log('🔥 CartContext: Received userLogout event, clearing cart');
      console.log('🔥 CartContext: Before clear - cartItems.length:', cartItems.length);
      setCartItems([]);
      localStorage.removeItem('cart'); // ✅ XÓA CART KHỎI LOCALSTORAGE
      console.log('🔥 CartContext: After clear - should be 0');
    };

    // Listen for logout event
    window.addEventListener('userLogout', handleLogout);

    // Listen for storage changes (khi token bị xóa từ tab khác)
    const handleStorageChange = (e) => {
      if (e.key === 'token' && e.oldValue && !e.newValue) {
        // Token đã bị xóa từ tab khác
        setCartItems([]);
        localStorage.removeItem('cart'); // ✅ XÓA CART KHỎI LOCALSTORAGE
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('userLogout', handleLogout);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Lưu cart vào localStorage mỗi khi cartItems thay đổi
  useEffect(() => {
    // Chỉ lưu sau khi đã initialized để tránh ghi đè dữ liệu khi load
    if (!isInitialized) return;
    
    // 🚫 Không lưu cart cho admin
    const isAdmin = Array.isArray(user?.roles) && user.roles.includes('ROLE_ADMIN');
    if (isAdmin) return;

    // Không lưu nếu không có token (guest không nên lưu cart lâu dài)
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    } catch (error) {
    }
  }, [cartItems, isInitialized]);

  // ✅ HELPER: Generate unique ID từ TẤT CẢ options (dynamic)
  const generateCartItemId = (productId, options = {}) => {
    // Sort keys để đảm bảo consistent order
    const optionsString = Object.entries(options)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    
    return optionsString ? `${productId}-${optionsString}` : `${productId}-no-options`;
  };

  // ✅ SỬA LẠI - DYNAMIC CHO TẤT CẢ LOẠI SẢN PHẨM + GỌI API BACKEND
  const addToCart = useCallback(async (product, quantity = 1, options = {}) => {
    const baseId = generateCartItemId(product.id, options);
    const now = Date.now();
    
    // ✅ CHỐNG DUPLICATE: Nếu cùng sản phẩm được add trong vòng 300ms, bỏ qua
    if (lastAddRef.current.id === baseId && (now - lastAddRef.current.timestamp) < 300) {
      return { success: true, message: `Đã thêm ${quantity} ${product.name} vào giỏ hàng` };
    }
    
    // Update timestamp NGAY để block duplicate calls
    lastAddRef.current = { id: baseId, timestamp: now };
    
    setLoading(true);
    
    try {
      // ✅ GỌI API BACKEND
      const token = localStorage.getItem('token');
      if (token) {
        const result = await cartService.addToCart({
          productVariantId: product.id,
          quantity: quantity
        });
        
        if (!result.success) {
          // Vẫn tiếp tục lưu localStorage nếu API lỗi
        }
      } else {
      }
    } catch (apiError) {
      // Vẫn tiếp tục lưu localStorage nếu API lỗi
    }
    
    // ✅ CẬP NHẬT LOCALSTORAGE (fallback cho guest users)
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.id === baseId);
      
      if (existingItemIndex >= 0) {
        // Cộng dồn số lượng
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += quantity;
        return updatedItems;
      } else {
        // Thêm mới
        const cartItem = {
          id: baseId,
          product,
          quantity,
          options,
          addedAt: new Date().toISOString(),
          selected: true
        };
        return [...prevItems, cartItem];
      }
    });

    setLoading(false);

    return { success: true, message: `Đã thêm ${quantity} ${product.name} vào giỏ hàng` };
  }, []);

  // Cập nhật số lượng sản phẩm
  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    // ✅ TÌM ITEM ĐỂ LẤY productVariantId
    const item = cartItems.find(i => i.id === itemId);
    if (!item) return;

    // ✅ GỌI API BACKEND
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Backend đã sửa: cart trả về productVariantId
        const variantId = item.productVariantId || item.product?.id;
        const result = await cartService.updateCartItem(variantId, {
          quantity: newQuantity,
          colorId: item.options?.color || null
        });
        
        if (!result.success) {
        }
      } catch (apiError) {
      }
    }

    // ✅ CẬP NHẬT LOCALSTORAGE
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId 
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // Xóa sản phẩm khỏi giỏ hàng
  const removeFromCart = async (itemId) => {
    // ✅ itemId chính là cartItemId - dùng trực tiếp
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // ✅ Dùng cartItemId thay vì productVariantId
        const result = await cartService.removeCartItemById(itemId);
        
        if (result.success) {
          // ✅ FETCH LẠI CART TỪ BACKEND ĐỂ ĐỒNG BỘ
          await fetchCart();
        } else {
          console.error('Failed to remove cart item:', result.error);
          // Không update local state nếu API fail
          return;
        }
      } catch (apiError) {
        console.error('Error removing cart item:', apiError);
        // Không update local state nếu có lỗi
        return;
      }
    } else {
      // ✅ Nếu không có token (offline), chỉ update localStorage
      setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
    }
  };

  // Xóa tất cả sản phẩm
  const clearCart = async () => {
    // ✅ GỌI API BACKEND
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const result = await cartService.clearCart();
        
        if (!result.success) {
        }
      } catch (apiError) {
      }
    }

    // ✅ CẬP NHẬT LOCALSTORAGE
    setCartItems([]);
  };

  // Chọn/bỏ chọn một sản phẩm
  const toggleItemSelected = (itemId) => {
    setCartItems(prevItems => prevItems.map(item => item.id === itemId ? { ...item, selected: !item.selected } : item));
  };

  const setItemSelected = (itemId, selected) => {
    setCartItems(prevItems => prevItems.map(item => item.id === itemId ? { ...item, selected } : item));
  };

  // Chọn tất cả / bỏ chọn tất cả
  const selectAll = (selected) => {
    setCartItems(prevItems => prevItems.map(item => ({ ...item, selected })));
  };

  // Xóa các item đã chọn (sau khi thanh toán)
  const removeSelectedItems = () => {
    setCartItems(prevItems => prevItems.filter(item => !item.selected));
  };

  // Tính tổng số lượng items
  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // Tính tổng giá trị giỏ hàng
  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const price = typeof item.product.price === 'string' 
        ? parseFloat(item.product.price.replace(/[^\d]/g, '')) || 0
        : parseFloat(item.product.price) || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  // Tổng theo các sản phẩm đã chọn
  const getSelectedItems = () => cartItems.filter(item => item.selected);

  const getSelectedTotalItems = () => {
    return cartItems.reduce((total, item) => total + (item.selected ? item.quantity : 0), 0);
  };

  const getSelectedTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      if (!item.selected) return total;
      const price = typeof item.product.price === 'string' 
        ? parseFloat(item.product.price.replace(/[^\d]/g, '')) || 0
        : parseFloat(item.product.price) || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  // Tính tổng tiết kiệm
  const getTotalSavings = () => {
    return cartItems.reduce((total, item) => {
      if (item.product.originalPrice) {
        const originalPrice = typeof item.product.originalPrice === 'string'
          ? parseFloat(item.product.originalPrice.replace(/[^\d]/g, '')) || 0
          : parseFloat(item.product.originalPrice) || 0;
        const currentPrice = typeof item.product.price === 'string'
          ? parseFloat(item.product.price.replace(/[^\d]/g, '')) || 0
          : parseFloat(item.product.price) || 0;
        return total + ((originalPrice - currentPrice) * item.quantity);
      }
      return total;
    }, 0);
  };

  const getSelectedTotalSavings = () => {
    return cartItems.reduce((total, item) => {
      if (!item.selected) return total;
      if (item.product.originalPrice) {
        const originalPrice = typeof item.product.originalPrice === 'string'
          ? parseFloat(item.product.originalPrice.replace(/[^\d]/g, '')) || 0
          : parseFloat(item.product.originalPrice) || 0;
        const currentPrice = typeof item.product.price === 'string'
          ? parseFloat(item.product.price.replace(/[^\d]/g, '')) || 0
          : parseFloat(item.product.price) || 0;
        return total + ((originalPrice - currentPrice) * item.quantity);
      }
      return total;
    }, 0);
  };

  // ✅ Kiểm tra sản phẩm có trong giỏ hàng không - DYNAMIC
  const isInCart = (productId, options = {}) => {
    const baseId = generateCartItemId(productId, options);
    return cartItems.some(item => item.id === baseId);
  };

  // ✅ Lấy số lượng sản phẩm trong giỏ hàng - DYNAMIC
  const getProductQuantityInCart = (productId, options = {}) => {
    const baseId = generateCartItemId(productId, options);
    const item = cartItems.find(item => item.id === baseId);
    return item ? item.quantity : 0;
  };

  // Format số tiền
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const value = {
    cartItems,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    toggleItemSelected,
    setItemSelected,
    selectAll,
    removeSelectedItems,
    getTotalItems,
    getTotalPrice,
    getTotalSavings,
    getSelectedItems,
    getSelectedTotalItems,
    getSelectedTotalPrice,
    getSelectedTotalSavings,
    isInCart,
    getProductQuantityInCart, // ✅ THÊM HÀM MỚI
    formatPrice
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};