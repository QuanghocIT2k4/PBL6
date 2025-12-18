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
    console.log('🔍 [getShipmentByOrderId] Requesting shipment for orderId:', orderId);
    const response = await api.get(`/api/v1/b2c/shipments/order/${orderId}`);
    
    console.log('📦 [getShipmentByOrderId] Response status:', response.status);
    console.log('📦 [getShipmentByOrderId] Response data:', JSON.stringify(response.data, null, 2));

    // ✅ Kiểm tra nếu response có success: false (backend trả về 200 nhưng với body success: false)
    if (response.data && response.data.success === false) {
      // ✅ Kiểm tra xem error message có chứa "Không tìm thấy" hoặc "not found" không
      const errorMessage = response.data.error || response.data.message || '';
      const isNotFound = errorMessage.toLowerCase().includes('không tìm thấy') || 
                         errorMessage.toLowerCase().includes('not found') ||
                         errorMessage.toLowerCase().includes('không tồn tại');
      
      console.log('⚠️ [getShipmentByOrderId] Backend returned success: false');
      console.log('⚠️ [getShipmentByOrderId] Error message:', errorMessage);
      console.log('⚠️ [getShipmentByOrderId] Is not found?', isNotFound);
      
      // Backend trả về "not found" nhưng với status 200
      return {
        success: false,
        error: null, // ✅ Trả về null để không hiển thị lỗi
        notFound: true, // ✅ Flag để biết là "chưa có" chứ không phải "lỗi"
      };
    }

    console.log('✅ [getShipmentByOrderId] Shipment found:', response.data.data || response.data);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ [getShipmentByOrderId] Error caught:');
    console.error('❌ [getShipmentByOrderId] Error object:', error);
    console.error('❌ [getShipmentByOrderId] Error response:', error.response);
    console.error('❌ [getShipmentByOrderId] Error status:', error.response?.status);
    console.error('❌ [getShipmentByOrderId] Error data:', error.response?.data);
    console.error('❌ [getShipmentByOrderId] Error message:', error.message);
    console.error('❌ [getShipmentByOrderId] Full error:', JSON.stringify({
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      config: {
        url: error.config?.url,
        method: error.config?.method,
      }
    }, null, 2));
    
    // ✅ Lấy error message từ nhiều nguồn
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        error.message || 
                        '';
    
    // ✅ Kiểm tra xem có phải "not found" không (từ response data hoặc error message)
    const isNotFoundMessage = errorMessage.toLowerCase().includes('không tìm thấy') || 
                              errorMessage.toLowerCase().includes('not found') ||
                              errorMessage.toLowerCase().includes('không tồn tại') ||
                              errorMessage.toLowerCase().includes('does not exist');
    
    // ✅ Xử lý lỗi 400/404 hoặc error message chứa "not found"
    if (error.response?.status === 400 || error.response?.status === 404 || isNotFoundMessage) {
      console.log('ℹ️ [getShipmentByOrderId] Not found case (normal):', {
        status: error.response?.status,
        isNotFoundMessage,
        errorMessage
      });
      return {
        success: false,
        error: null, // ✅ Trả về null để không hiển thị lỗi
        notFound: true, // ✅ Flag để biết là "chưa có" chứ không phải "lỗi"
      };
    }
    
    console.error('❌ [getShipmentByOrderId] Real error (not 400/404/notFound):', errorMessage);
    return {
      success: false,
      error: errorMessage || 'Không thể tải thông tin vận đơn',
      notFound: false,
    };
  }
};

/**
 * 1.5. CREATE SHIPMENT FOR ORDER
 * POST /api/v1/b2c/shipments/order/{orderId}?storeId={storeId}
 *
 * Tạo shipment cho đơn hàng đã xác nhận (bắt buộc truyền storeId theo Swagger 1512)
 */
export const createShipmentForOrder = async (orderId, storeId) => {
  try {
    console.log('🚀 [createShipmentForOrder] Creating shipment for orderId:', orderId, 'storeId:', storeId);

    if (!orderId) {
      return {
        success: false,
        error: 'orderId is required to create shipment',
      };
    }

    if (!storeId) {
      return {
        success: false,
        error: 'storeId is required to create shipment',
      };
    }

    // Backend yêu cầu storeId là query param
    const response = await api.post(
      `/api/v1/b2c/shipments/order/${orderId}`,
      null,
      {
        params: { storeId },
      }
    );
    
    console.log('✅ [createShipmentForOrder] Response status:', response.status);
    console.log('✅ [createShipmentForOrder] Response data:', JSON.stringify(response.data, null, 2));
    
    const shipmentData = response.data.data || response.data;

    console.log('✅ [createShipmentForOrder] Shipment created successfully:', shipmentData);
    return {
      success: true,
      data: shipmentData,
      message: response.data.message || 'Đã tạo vận đơn thành công',
    };
  } catch (error) {
    console.error('❌ [createShipmentForOrder] Error caught:');
    console.error('❌ [createShipmentForOrder] Error object:', error);
    console.error('❌ [createShipmentForOrder] Error response:', error.response);
    console.error('❌ [createShipmentForOrder] Error status:', error.response?.status);
    console.error('❌ [createShipmentForOrder] Error data:', error.response?.data);
    console.error('❌ [createShipmentForOrder] Error message:', error.message);
    console.error('❌ [createShipmentForOrder] Full error:', JSON.stringify({
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data,
      }
    }, null, 2));
    
    return {
      success: false,
      error: error.response?.data?.message || error.response?.data?.error || 'Không thể tạo vận đơn',
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
      status = null, // READY_TO_PICK, PICKING_UP, PICKING, PICKED, SHIPPING, DELIVERED, DELIVERED_FAIL, FAILED
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = params;

    const response = await api.get(`/api/v1/b2c/shipments/store/${storeId}`, {
      params: {
        page,
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
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tải danh sách vận đơn',
    };
  }
};

/**
 * 4. ĐẾM SHIPMENT THEO TRẠNG THÁI (API mới)
 * GET /api/v1/b2c/shipments/store/{storeId}/count-by-status
 */
export const countShipmentsByStatus = async (storeId) => {
  try {
    if (!storeId) {
      return { success: false, error: 'storeId is required' };
    }

    const response = await api.get(`/api/v1/b2c/shipments/store/${storeId}/count-by-status`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể đếm shipment theo trạng thái',
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
    // ✅ Thử nhiều format khác nhau vì có thể backend expect format khác
    // Format 1: Gửi string trực tiếp
    let response;
    try {
      response = await api.put(`/api/v1/b2c/shipments/${shipmentId}/status`, `"${newStatus}"`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (err1) {
      // Format 2: Gửi object với field status
      try {
        response = await api.put(`/api/v1/b2c/shipments/${shipmentId}/status`, { status: newStatus });
      } catch (err2) {
        // Format 3: Gửi string không có quotes
        response = await api.put(`/api/v1/b2c/shipments/${shipmentId}/status`, newStatus, {
          headers: {
            'Content-Type': 'text/plain',
          },
        });
      }
    }

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Đã cập nhật trạng thái vận đơn',
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.response?.data?.error || error.message || 'Không thể cập nhật trạng thái vận đơn',
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
    READY_TO_PICK: {
      text: 'Sẵn sàng lấy hàng',
      color: 'cyan',
      bgColor: 'bg-cyan-100',
      textColor: 'text-cyan-800',
      icon: '📦',
    },
    PICKING_UP: {
      text: 'Đang lấy hàng',
      color: 'yellow',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      icon: '📦',
    },
    PICKING: {
      text: 'Đang lấy hàng',
      color: 'yellow',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      icon: '📦',
    },
    PICKED: {
      text: 'Đã lấy hàng',
      color: 'orange',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800',
      icon: '✅',
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
    RETURNED: {
      text: 'Đã trả hàng',
      color: 'indigo',
      bgColor: 'bg-indigo-100',
      textColor: 'text-indigo-800',
      icon: '↩️',
    },
    DELIVERED_FAIL: {
      text: 'Giao thất bại',
      color: 'red',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      icon: '❌',
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
