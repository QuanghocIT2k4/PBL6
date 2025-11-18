import api from '../common/api';

/**
 * ================================================
 * B2C ORDER SERVICE - QUẢN LÝ ĐƠN HÀNG CỦA HÀNG B2C
 * ================================================
 * APIs for B2C store owners to manage orders
 */

/**
 * 1. LẤY DANH SÁCH ĐƠN HÀNG
 * GET /api/v1/b2c/orders
 */
export const getStoreOrders = async (params = {}) => {
  try {
    const {
      storeId,
      page = 0, // ✅ 0-based pagination like all other APIs
      size = 20,
      sortBy = 'createdAt',
      sortDir = 'desc',
      status = null,
    } = params;

    // ✅ Validate storeId
    if (!storeId) {
      return {
        success: false,
        error: 'storeId is required',
      };
    }

    // ✅ Validate & force page to be a valid integer >= 0
    const pageNum = parseInt(page, 10);
    const validPage = Number.isNaN(pageNum) ? 0 : Math.max(0, pageNum);
    
    console.log('📦 [getStoreOrders] RAW page param:', page, 'type:', typeof page);
    console.log('📦 [getStoreOrders] PARSED pageNum:', pageNum);
    console.log('📦 [getStoreOrders] VALID page:', validPage);
    
    console.log('📦 [getStoreOrders] Request params:', {
      storeId,
      page: validPage,
      pageType: typeof validPage,
      size,
      sortBy,
      sortDir,
      status
    });

    const requestParams = {
      storeId: String(storeId),
      page: validPage,
      size: Number(size),
      sortBy,
      sortDir,
      ...(status && { status }),
    };
    
    console.log('📦 [getStoreOrders] Actual request params:', requestParams);
    console.log('📦 [getStoreOrders] Params stringified:', JSON.stringify(requestParams));

    // ✅ TRY 1: Send ALL params (original approach)
    const response = await api.get('/api/v1/b2c/orders', {
      params: requestParams,
    });
    
    // ⚠️ If above fails, try this instead (only storeId like Postman):
    // const response = await api.get('/api/v1/b2c/orders', {
    //   params: { storeId: String(storeId) }
    // });

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ [getStoreOrders] Error:', error);
    console.error('❌ [getStoreOrders] Error response:', error.response?.data);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tải danh sách đơn hàng',
    };
  }
};

/**
 * 2. LẤY CHI TIẾT ĐƠN HÀNG
 * GET /api/v1/b2c/orders/{orderId}
 * ⚠️ CẦN storeId trong query params (required theo Swagger)
 */
export const getStoreOrderById = async (orderId, storeId) => {
  try {
    if (!storeId) {
      return {
        success: false,
        error: 'storeId is required',
      };
    }

    const response = await api.get(`/api/v1/b2c/orders/${orderId}`, {
      params: {
        storeId: String(storeId),
      },
    });
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ [getStoreOrderById] Error:', error);
    console.error('❌ [getStoreOrderById] Error response:', error.response?.data);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tải chi tiết đơn hàng',
    };
  }
};

/**
 * 3. CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
 * PUT /api/v1/b2c/orders/{orderId}/status
 */
export const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await api.put(`/api/v1/b2c/orders/${orderId}/status`, { status });
    return {
      success: true,
      data: response.data.data,
      message: 'Cập nhật trạng thái thành công!',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể cập nhật trạng thái',
    };
  }
};

/**
 * 4. XÁC NHẬN ĐƠN HÀNG
 * PUT /api/v1/b2c/orders/{orderId}/confirm
 * ⚠️ CẦN storeId trong query params
 */
export const confirmOrder = async (orderId, storeId) => {
  try {
    if (!storeId) {
      return {
        success: false,
        error: 'storeId is required',
      };
    }

    const response = await api.put(`/api/v1/b2c/orders/${orderId}/confirm`, null, {
      params: {
        storeId: String(storeId),
      },
    });
    return {
      success: true,
      data: response.data.data,
      message: 'Xác nhận đơn hàng thành công!',
    };
  } catch (error) {
    console.error('❌ [confirmOrder] Error:', error);
    console.error('❌ [confirmOrder] Error response:', error.response?.data);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể xác nhận đơn hàng',
    };
  }
};

/**
 * 5. GIAO HÀNG
 * PUT /api/v1/b2c/orders/{orderId}/ship
 * ⚠️ CẦN storeId trong query params
 */
export const shipOrder = async (orderId, storeId) => {
  try {
    if (!storeId) {
      return {
        success: false,
        error: 'storeId is required',
      };
    }

    const response = await api.put(`/api/v1/b2c/orders/${orderId}/ship`, null, {
      params: {
        storeId: String(storeId),
      },
    });
    return {
      success: true,
      data: response.data.data,
      message: 'Đơn hàng đã chuyển sang trạng thái đang giao!',
    };
  } catch (error) {
    console.error('❌ [shipOrder] Error:', error);
    console.error('❌ [shipOrder] Error response:', error.response?.data);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể cập nhật trạng thái giao hàng',
    };
  }
};

/**
 * 6. HOÀN TẤT GIAO HÀNG
 * PUT /api/v1/b2c/orders/{orderId}/deliver
 * ⚠️ CẦN storeId trong query params
 */
export const deliverOrder = async (orderId, storeId) => {
  try {
    if (!storeId) {
      return {
        success: false,
        error: 'storeId is required',
      };
    }

    const response = await api.put(`/api/v1/b2c/orders/${orderId}/deliver`, null, {
      params: {
        storeId: String(storeId),
      },
    });
    return {
      success: true,
      data: response.data.data,
      message: 'Đơn hàng đã được giao thành công!',
    };
  } catch (error) {
    console.error('❌ [deliverOrder] Error:', error);
    console.error('❌ [deliverOrder] Error response:', error.response?.data);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể hoàn tất giao hàng',
    };
  }
};

/**
 * 7. HỦY ĐƠN HÀNG
 * PUT /api/v1/b2c/orders/{orderId}/cancel
 */
export const cancelStoreOrder = async (orderId, reason = '') => {
  try {
    const response = await api.put(`/api/v1/b2c/orders/${orderId}/cancel`, { reason });
    return {
      success: true,
      data: response.data.data,
      message: 'Đã hủy đơn hàng!',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể hủy đơn hàng',
    };
  }
};

/**
 * 8. LẤY THỐNG KÊ ĐƠN HÀNG
 * GET /api/v1/b2c/orders/statistics
 */
export const getOrderStatistics = async () => {
  try {
    const response = await api.get('/api/v1/b2c/orders/statistics');
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể tải thống kê đơn hàng',
    };
  }
};

/**
 * 9. LẤY THỐNG KÊ DOANH THU
 * GET /api/v1/b2c/orders/revenue
 */
export const getRevenueStatistics = async (startDate, endDate) => {
  try {
    const response = await api.get('/api/v1/b2c/orders/revenue', {
      params: { startDate, endDate },
    });
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể tải thống kê doanh thu',
    };
  }
};

export default {
  getStoreOrders,
  getStoreOrderById,
  updateOrderStatus,
  confirmOrder,
  shipOrder,
  deliverOrder,
  cancelStoreOrder,
  getOrderStatistics,
  getRevenueStatistics,
};

