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
 * Complete order - Xác nhận hoàn tất đơn hàng
 * @param {string} orderId - Order ID
 * @returns {Promise} Updated order
 */
export const completeOrder = async (orderId) => {
  try {
    const response = await api.put(`/api/v1/buyer/orders/${orderId}/complete`);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error completing order:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể xác nhận hoàn tất đơn hàng',
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
      data: response.data.data || response.data,
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
 * Get refund status of an order
 * GET /api/v1/buyer/orders/{orderId}/refund-status
 */
export const getOrderRefundStatus = async (orderId) => {
  try {
    const response = await api.get(`/api/v1/buyer/orders/${orderId}/refund-status`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error fetching order refund status:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tải thông tin hoàn tiền',
    };
  }
};

/**
 * Get return shipment info for an order (only for return orders)
 * GET /api/v1/buyer/orders/{orderId}/return-shipment
 */
export const getReturnShipmentInfo = async (orderId) => {
  try {
    const response = await api.get(`/api/v1/buyer/orders/${orderId}/return-shipment`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error fetching return shipment info:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tải thông tin vận chuyển trả hàng',
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
    // Đơn đã trả hàng (chờ/đang hoàn tiền hoặc đã hoàn tiền nhưng BE vẫn trả status RETURNED)
    RETURNED: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      label: 'Đã trả hàng / Hoàn tiền',
      icon: '↩️',
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
    VNPAY: 'Thanh toán qua VNPay',
    MOMO: 'Thanh toán qua MoMo',
    // Các method cũ (deprecated) - giữ lại để backward compatibility
    BANK_TRANSFER: 'Thanh toán qua VNPay', // Map cũ sang mới
    E_WALLET: 'Thanh toán qua MoMo', // Map cũ sang mới
    CREDIT_CARD: 'Thẻ tín dụng/Ghi nợ',
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
  // Cho phép review khi đơn hàng đã giao (DELIVERED) hoặc hoàn thành (COMPLETED)
  return status === 'DELIVERED' || status === 'COMPLETED';
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
  getOrderRefundStatus,
  getReturnShipmentInfo,
  getOrderStatusBadge,
  getPaymentMethodLabel,
  canCancelOrder,
  canReviewOrder,
  calculateOrderSummary,
};

