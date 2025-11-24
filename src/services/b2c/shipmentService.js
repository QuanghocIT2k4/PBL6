import api from '../common/api';

/**
 * B2C SHIPMENT SERVICE
 * APIs for managing shipments (vận đơn)
 * 
 * Shipment Status Flow:
 * PICKING_UP → SHIPPING → DELIVERED / FAILED
 * 
 * Auto transitions:
 * - PICKING_UP → SHIPPING after 3 minutes
 * - SHIPPING → DELIVERED after 4 minutes
 */

/**
 * 1. GET SHIPMENT BY ORDER ID
 * GET /api/v1/b2c/shipments/order/{orderId}
 * 
 * Lấy thông tin shipment của đơn hàng
 */
export const getShipmentByOrderId = async (orderId) => {
  try {
    console.log('📦 Fetching shipment for order:', orderId);

    const response = await api.get(`/api/v1/b2c/shipments/order/${orderId}`);

    console.log('✅ Shipment data:', response.data);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ Error fetching shipment:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tải thông tin vận đơn',
    };
  }
};

/**
 * 2. GET SHIPMENTS BY STORE ID
 * GET /api/v1/b2c/shipments/store/{storeId}
 * 
 * Lấy danh sách shipment của store
 */
export const getShipmentsByStoreId = async (storeId, params = {}) => {
  try {
    const {
      page = 0,
      size = 10,
      status = null, // PICKING_UP, SHIPPING, DELIVERED, FAILED
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = params;

    console.log('📦 Fetching shipments for store:', { storeId, page, size, status });

    const response = await api.get(`/api/v1/b2c/shipments/store/${storeId}`, {
      params: {
        page,
        size,
        sortBy,
        sortDir,
        ...(status && { status }),
      },
    });

    console.log('✅ Shipments data:', response.data);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ Error fetching shipments:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tải danh sách vận đơn',
    };
  }
};

/**
 * 3. UPDATE SHIPMENT STATUS (FOR TESTING)
 * PUT /api/v1/b2c/shipments/{shipmentId}/status
 * 
 * Cập nhật trạng thái shipment (chỉ dùng để test)
 * Lưu ý: Trong production, status tự động chuyển
 */
export const updateShipmentStatus = async (shipmentId, newStatus) => {
  try {
    console.log('🔄 Updating shipment status:', { shipmentId, newStatus });

    const response = await api.put(`/api/v1/b2c/shipments/${shipmentId}/status`, {
      status: newStatus,
    });

    console.log('✅ Shipment status updated:', response.data);

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Đã cập nhật trạng thái vận đơn',
    };
  } catch (error) {
    console.error('❌ Error updating shipment status:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể cập nhật trạng thái vận đơn',
    };
  }
};

/**
 * HELPER FUNCTIONS
 */

/**
 * Get shipment status badge
 */
export const getShipmentStatusBadge = (status) => {
  const badges = {
    PICKING_UP: {
      text: 'Đang lấy hàng',
      color: 'yellow',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      icon: '📦',
    },
    SHIPPING: {
      text: 'Đang giao',
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      icon: '🚚',
    },
    DELIVERED: {
      text: 'Đã giao',
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      icon: '✅',
    },
    FAILED: {
      text: 'Giao thất bại',
      color: 'red',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      icon: '❌',
    },
  };

  return badges[status] || {
    text: status,
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    icon: '📦',
  };
};

/**
 * Get shipment status progress
 */
export const getShipmentProgress = (status) => {
  const progress = {
    PICKING_UP: 25,
    SHIPPING: 50,
    DELIVERED: 100,
    FAILED: 100,
  };

  return progress[status] || 0;
};

/**
 * Get shipment timeline steps
 */
export const getShipmentTimeline = (shipment) => {
  const steps = [
    {
      status: 'PICKING_UP',
      label: 'Đang lấy hàng',
      icon: '📦',
      description: 'Shipper đang đến lấy hàng',
    },
    {
      status: 'SHIPPING',
      label: 'Đang giao',
      icon: '🚚',
      description: 'Đơn hàng đang được vận chuyển',
    },
    {
      status: 'DELIVERED',
      label: 'Đã giao',
      icon: '✅',
      description: 'Giao hàng thành công',
    },
  ];

  // If failed, replace DELIVERED with FAILED
  if (shipment.status === 'FAILED') {
    steps[2] = {
      status: 'FAILED',
      label: 'Giao thất bại',
      icon: '❌',
      description: 'Giao hàng không thành công',
    };
  }

  // Mark completed steps
  const currentIndex = steps.findIndex((s) => s.status === shipment.status);
  
  return steps.map((step, index) => ({
    ...step,
    completed: index <= currentIndex,
    active: index === currentIndex,
  }));
};

/**
 * Format expected delivery date
 */
export const formatExpectedDeliveryDate = (dateString) => {
  if (!dateString) return 'Chưa xác định';

  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Calculate delivery time remaining
 */
export const getDeliveryTimeRemaining = (expectedDeliveryDate) => {
  if (!expectedDeliveryDate) return null;

  const now = new Date();
  const expected = new Date(expectedDeliveryDate);
  const diffMs = expected - now;
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMs < 0) {
    return { text: 'Đã quá hạn', color: 'red' };
  }

  if (diffHours < 24) {
    return { text: `Còn ${diffHours} giờ`, color: 'orange' };
  }

  return { text: `Còn ${diffDays} ngày`, color: 'green' };
};

/**
 * Format currency VND
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

/**
 * Format address
 */
export const formatAddress = (address) => {
  if (!address) return 'Chưa có địa chỉ';

  if (typeof address === 'string') return address;

  const parts = [
    address.homeAddress || address.suggestedName,
    address.ward,
    address.district,
    address.province,
  ].filter(Boolean);

  return parts.join(', ');
};
