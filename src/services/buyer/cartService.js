import api from '../common/api';

/**
 * ================================================
 * CART SERVICE - QUẢN LÝ GIỎ HÀNG
 * ================================================
 * Các API yêu cầu đăng nhập (Protected):
 * - GET /api/v1/buyer/cart - Xem giỏ hàng
 * - GET /api/v1/buyer/cart/count - Đếm số sản phẩm
 * - POST /api/v1/buyer/cart/add - Thêm vào giỏ
 * - PUT /api/v1/buyer/cart/{productVariantId} - Cập nhật số lượng
 * - DELETE /api/v1/buyer/cart/{productVariantId} - Xóa khỏi giỏ
 * - DELETE /api/v1/buyer/cart/clear - Xóa toàn bộ
 * 
 * ✅ Uses centralized api.js for:
 * - Automatic JWT token attachment
 * - Auto-logout on 401 Unauthorized
 * - Unified error handling
 */

// Alias for backward compatibility
const cartApi = api;

/**
 * ================================================
 * 1. LẤY GIỎ HÀNG
 * ================================================
 * GET /api/v1/buyer/cart
 * @returns {Promise} { success: boolean, data: CartItem[] }
 */
export const getCart = async () => {
  try {
    console.log('🛒 Fetching cart');
    const response = await cartApi.get('/api/v1/buyer/cart');
    console.log('✅ Cart response:', response.data);

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data || [],
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Không thể tải giỏ hàng',
        data: [],
      };
    }
  } catch (error) {
    // ✅ Nếu lỗi 400 (cart chưa tồn tại) → coi như cart rỗng, không log error
    if (error.response?.status === 400) {
      console.log('ℹ️ Cart chưa tồn tại (user chưa thêm sản phẩm nào)');
      return {
        success: true, // ✅ Trả về success = true với data rỗng
        data: [],
      };
    }
    
    console.error('❌ Error fetching cart:', error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

/**
 * ================================================
 * 2. ĐẾM SỐ LƯỢNG SẢN PHẨM TRONG GIỎ
 * ================================================
 * GET /api/v1/buyer/cart/count
 * @returns {Promise} { success: boolean, count: number }
 */
export const getCartCount = async () => {
  try {
    console.log('🔢 Fetching cart count');
    const response = await cartApi.get('/api/v1/buyer/cart/count');
    console.log('✅ Cart count response:', response.data);

    // Backend có thể trả về số trực tiếp hoặc object {count: X}
    let count = 0;
    if (typeof response.data === 'number') {
      count = response.data;
    } else if (response.data.success && typeof response.data.data === 'number') {
      count = response.data.data;
    } else if (response.data.count !== undefined) {
      count = response.data.count;
    }

    return {
      success: true,
      count,
    };
  } catch (error) {
    console.error('❌ Error fetching cart count:', error);
    return {
      success: false,
      count: 0,
      error: error.message,
    };
  }
};

/**
 * ================================================
 * 3. THÊM SẢN PHẨM VÀO GIỎ
 * ================================================
 * POST /api/v1/buyer/cart/add
 * 
 * @param {Object} cartItem - Sản phẩm cần thêm
 * @param {number} cartItem.productVariantId - ID của variant
 * @param {number} cartItem.quantity - Số lượng
 * @returns {Promise} { success: boolean, data: CartItem }
 * 
 * @example
 * await addToCart({ productVariantId: 123, quantity: 2 });
 */
export const addToCart = async (cartItem) => {
  try {
    console.log('➕ Adding to cart:', cartItem);
    
    // Validate input
    if (!cartItem.productVariantId) {
      return {
        success: false,
        error: 'Product variant ID là bắt buộc',
      };
    }
    
    if (!cartItem.quantity || cartItem.quantity < 1) {
      return {
        success: false,
        error: 'Số lượng phải lớn hơn 0',
      };
    }

    // ✅ Backend expects an ARRAY of cart items
    const payload = [{
      productVariantId: cartItem.productVariantId,
      quantity: cartItem.quantity,
    }];
    
    console.log('📤 Sending request to backend:', payload);
    
    const response = await cartApi.post('/api/v1/buyer/cart/add', payload);

    console.log('✅ Add to cart response:', response.data);

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Không thể thêm vào giỏ hàng',
      };
    }
  } catch (error) {
    console.error('❌ Error adding to cart:', error);
    console.error('❌ Error response data:', error.response?.data);
    console.error('❌ Error response status:', error.response?.status);
    console.error('❌ Full error:', JSON.stringify(error.response?.data, null, 2));
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

/**
 * ================================================
 * 4. CẬP NHẬT SỐ LƯỢNG SẢN PHẨM TRONG GIỎ
 * ================================================
 * PUT /api/v1/buyer/cart/{productVariantId}?colorId={colorId}
 * 
 * @param {string} productVariantId - ID của variant
 * @param {Object} updateData - Dữ liệu cập nhật
 * @param {number} updateData.quantity - Số lượng mới
 * @param {string} updateData.colorId - Color ID (optional)
 * @returns {Promise} { success: boolean, data: CartItem }
 * 
 * @example
 * await updateCartItem('123', { quantity: 5, colorId: 'red' });
 */
export const updateCartItem = async (productVariantId, updateData) => {
  try {
    console.log('🔄 Updating cart item:', { productVariantId, updateData });
    
    // Validate
    if (!updateData.quantity || updateData.quantity < 1) {
      return {
        success: false,
        error: 'Số lượng phải lớn hơn 0',
      };
    }

    // Build URL with colorId query param if provided
    let url = `/api/v1/buyer/cart/${productVariantId}`;
    if (updateData.colorId) {
      url += `?colorId=${updateData.colorId}`;
    }

    const response = await cartApi.put(url, {
      quantity: updateData.quantity,
    });

    console.log('✅ Update cart item response:', response.data);

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Không thể cập nhật giỏ hàng',
      };
    }
  } catch (error) {
    console.error('❌ Error updating cart item:', error);
    console.error('❌ Error response:', error.response?.data);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

/**
 * ================================================
 * 5. XÓA SẢN PHẨM KHỎI GIỎ
 * ================================================
 * DELETE /api/v1/buyer/cart/{productVariantId}?colorId={colorId}
 * 
 * @param {string} productVariantId - ID của variant cần xóa
 * @param {string} colorId - Color ID (optional)
 * @returns {Promise} { success: boolean }
 * 
 * @example
 * await removeFromCart('123', 'red');
 */
export const removeFromCart = async (productVariantId, colorId = null) => {
  try {
    console.log('🗑️ Removing from cart:', { productVariantId, colorId });
    
    // Build URL with colorId query param if provided
    let url = `/api/v1/buyer/cart/${productVariantId}`;
    if (colorId) {
      url += `?colorId=${colorId}`;
    }
    
    const response = await cartApi.delete(url);
    
    console.log('✅ Remove from cart response:', response.data);

    return {
      success: true,
      message: response.data.message || 'Đã xóa sản phẩm khỏi giỏ hàng',
    };
  } catch (error) {
    console.error('❌ Error removing from cart:', error);
    console.error('❌ Error response:', error.response?.data);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

/**
 * ================================================
 * 6. XÓA NHIỀU SẢN PHẨM KHỎI GIỎ
 * ================================================
 * DELETE /api/v1/buyer/cart
 * Body: { cartItemIds: string[] }
 * @param {string[]} cartItemIds - Mảng ID của các cart items cần xóa
 * @returns {Promise} { success: boolean }
 * 
 * @example
 * await removeManyFromCart(['item1', 'item2']);
 */
export const removeManyFromCart = async (cartItemIds) => {
  try {
    console.log('🗑️ Removing many items from cart:', cartItemIds);
    
    const response = await cartApi.delete('/api/v1/buyer/cart', {
      data: { cartItemIds }
    });
    
    console.log('✅ Remove many items response:', response.data);

    return {
      success: true,
      message: response.data.message || 'Đã xóa các sản phẩm khỏi giỏ hàng',
    };
  } catch (error) {
    console.error('❌ Error removing many items:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

/**
 * ================================================
 * 7. XÓA 1 CART ITEM THEO ID
 * ================================================
 * DELETE /api/v1/buyer/cart/{cartItemId}
 * @param {string} cartItemId - ID của cart item cần xóa
 * @returns {Promise} { success: boolean }
 * 
 * @example
 * await removeCartItemById('cartItemId123');
 */
export const removeCartItemById = async (cartItemId) => {
  try {
    console.log('🗑️ Removing cart item by ID:', cartItemId);
    
    const response = await cartApi.delete(`/api/v1/buyer/cart/${cartItemId}`);
    
    console.log('✅ Remove cart item response:', response.data);

    return {
      success: true,
      message: response.data.message || 'Đã xóa sản phẩm khỏi giỏ hàng',
    };
  } catch (error) {
    console.error('❌ Error removing cart item:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

/**
 * ================================================
 * 8. XÓA TOÀN BỘ GIỎ HÀNG
 * ================================================
 * DELETE /api/v1/buyer/cart/clear
 * @returns {Promise} { success: boolean }
 * 
 * @example
 * await clearCart();
 */
export const clearCart = async () => {
  try {
    console.log('🗑️ Clearing cart');
    
    const response = await cartApi.delete('/api/v1/buyer/cart/clear');
    
    console.log('✅ Clear cart response:', response.data);

    return {
      success: true,
      message: response.data.message || 'Đã xóa toàn bộ giỏ hàng',
    };
  } catch (error) {
    console.error('❌ Error clearing cart:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

// Export default object
const cartService = {
  getCart,
  getCartCount,
  addToCart,
  updateCartItem,
  removeFromCart,
  removeManyFromCart,
  removeCartItemById,
  clearCart,
};

export default cartService;

