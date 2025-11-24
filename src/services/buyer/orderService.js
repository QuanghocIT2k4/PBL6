import api from '../common/api';

/**
 * ================================================
 * ORDER SERVICE - API CALLS
 * ================================================
 * Handles all order-related API requests
 */

// =====================================
// BUYER ORDER APIs
// =====================================

/**
 * Get all orders of current user
 * @param {object} params - Query params (page, size, status)
 * @returns {Promise} List of orders
 */
export const getMyOrders = async (params = {}) => {
  try {
    const {
      page = 0,
      size = 10,
      sortBy = 'createdAt',
      sortDir = 'desc',
      status = null, // Filter by status: PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED, REFUNDED
    } = params;

    // ✅ Backend expects 0-based page index (giống Spring Data JPA mặc định)
    const pageParam = Number.isFinite(Number(page)) ? Number(page) : 0;

    const response = await api.get('/api/v1/buyer/orders', {
      params: {
        page: pageParam,
        size,
        sortBy,
        sortDir,
        ...(status && { status }),
      },
    });

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return {
      success: false,
      error: error.message || 'Không thể tải danh sách đơn hàng',
    };
  }
};

/**
 * Get order details by ID
 * @param {string} orderId - Order ID
 * @returns {Promise} Order details
 */
export const getOrderById = async (orderId) => {
  try {
    const response = await api.get(`/api/v1/buyer/orders/${orderId}`);
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    return {
      success: false,
      error: error.message || 'Không thể tải chi tiết đơn hàng',
    };
  }
};

/**
 * Create new order (checkout)
 * @param {object} orderData - Order data
 * @param {string} orderData.shippingAddressId - Shipping address ID
 * @param {string} orderData.paymentMethod - Payment method (COD, BANK_TRANSFER, etc.)
 * @param {string} orderData.note - Order note (optional)
 * @param {array} orderData.items - Array of {productVariantId, quantity, price}
 * @returns {Promise} Created order
 */
export const createOrder = async (orderData) => {
  try {
    const response = await api.post('/api/v1/buyer/orders/checkout', orderData);
    return {
      success: true,
      data: response.data.data,
      message: 'Đặt hàng thành công!',
    };
  } catch (error) {
    console.error('Error creating order:', error);
    return {
      success: false,
      error: error.message || 'Không thể đặt hàng',
    };
  }
};

/**
 * Cancel an order
 * @param {string} orderId - Order ID
 * @param {string} reason - Cancel reason (optional)
 * @returns {Promise} Success status
 */
export const cancelOrder = async (orderId, reason = '') => {
  try {
    const response = await api.put(`/api/v1/buyer/orders/${orderId}/cancel`, {
      reason,
    });
    return {
      success: true,
      data: response.data.data,
      message: 'Đơn hàng đã được hủy',
    };
  } catch (error) {
    console.error('Error cancelling order:', error);
    return {
      success: false,
      error: error.message || 'Không thể hủy đơn hàng',
    };
  }
};

// =====================================
// HELPER FUNCTIONS
// =====================================

/**
 * Get order status badge color
 * @param {string} status - Order status
 * @returns {object} Tailwind classes for badge
 */
export const getOrderStatusBadge = (status) => {
  const badges = {
    PENDING: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      label: 'Chờ xác nhận',
      icon: '⏳',
    },
    CONFIRMED: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      label: 'Đã xác nhận',
      icon: '✓',
    },
    PROCESSING: {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      label: 'Đang xử lý',
      icon: '⚙️',
    },
    SHIPPING: {
      bg: 'bg-indigo-100',
      text: 'text-indigo-800',
      label: 'Đang giao',
      icon: '🚚',
    },
    DELIVERED: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      label: 'Đã giao',
      icon: '✅',
    },
    CANCELLED: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      label: 'Đã hủy',
      icon: '❌',
    },
    REFUNDED: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      label: 'Đã hoàn tiền',
      icon: '💰',
    },
  };

  return badges[status] || badges.PENDING;
};

/**
 * Get payment method label
 * @param {string} method - Payment method
 * @returns {string} Readable label
 */
export const getPaymentMethodLabel = (method) => {
  const methods = {
    COD: 'Thanh toán khi nhận hàng (COD)',
    BANK_TRANSFER: 'Chuyển khoản ngân hàng',
    CREDIT_CARD: 'Thẻ tín dụng/Ghi nợ',
    MOMO: 'Ví MoMo',
    VNPAY: 'VNPay',
    ZALOPAY: 'ZaloPay',
  };

  return methods[method] || method;
};

/**
 * Check if order can be cancelled
 * @param {string} status - Order status
 * @returns {boolean} Can cancel
 */
export const canCancelOrder = (status) => {
  return ['PENDING', 'CONFIRMED'].includes(status);
};

/**
 * Check if order can be reviewed
 * @param {string} status - Order status
 * @returns {boolean} Can review
 */
export const canReviewOrder = (status) => {
  return status === 'DELIVERED';
};

/**
 * Calculate order summary
 * @param {array} items - Order items
 * @param {number} shippingFee - Shipping fee
 * @param {number} discount - Discount amount
 * @returns {object} Order summary
 */
export const calculateOrderSummary = (items = [], shippingFee = 0, discount = 0) => {
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  const total = subtotal + shippingFee - discount;

  return {
    subtotal,
    shippingFee,
    discount,
    total,
  };
};

export default {
  getMyOrders,
  getOrderById,
  createOrder,
  cancelOrder,
  getOrderStatusBadge,
  getPaymentMethodLabel,
  canCancelOrder,
  canReviewOrder,
  calculateOrderSummary,
};

