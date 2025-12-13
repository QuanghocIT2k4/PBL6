import api from '../common/api';

/**
 * ================================================
 * SHIPPER SERVICE - QUẢN LÝ SHIPPER (SHIPPER)
 * ================================================
 * APIs for shipper to manage their own shipments
 */

/**
 * 1. LẤY LỊCH SỬ GIAO HÀNG
 * GET /api/v1/shipper/history
 */
export const getShipperHistory = async (params = {}) => {
  try {
    const {
      page = 0,
      size = 20,
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = params;

    const response = await api.get('/api/v1/shipper/history', {
      params: {
        page,
        size,
        sortBy,
        sortDir,
      },
    });

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ [getShipperHistory] Error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không thể tải lịch sử giao hàng',
    };
  }
};

/**
 * 2. NHẬN ĐƠN HÀNG (PICKUP)
 * PUT /api/v1/shipper/order/{orderId}/pickup
 * Shipper xác nhận đã đến lấy hàng cho đơn hàng
 */
export const pickupOrder = async (orderId) => {
  try {
    const response = await api.put(`/api/v1/shipper/order/${orderId}/pickup`);
    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Nhận đơn hàng thành công!',
    };
  } catch (error) {
    console.error('❌ [pickupOrder] Error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không thể nhận đơn hàng',
    };
  }
};

/**
 * 3. LẤY DANH SÁCH ĐƠN ĐANG CHỜ NHẬN (PICKING UP)
 * GET /api/v1/shipper/shipments/picking-up
 */
export const getPickingUpShipments = async (params = {}) => {
  try {
    const {
      page = 0,
      size = 20,
    } = params;

    const response = await api.get('/api/v1/shipper/shipments/picking-up', {
      params: {
        page,
        size,
      },
    });

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ [getPickingUpShipments] Error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không thể tải danh sách đơn chờ nhận',
    };
  }
};

/**
 * 4. LẤY CHI TIẾT SHIPMENT THEO ORDER ID
 * GET /api/v1/shipper/shipments/{orderId}
 */
export const getShipmentByOrderId = async (orderId) => {
  try {
    const response = await api.get(`/api/v1/shipper/shipments/${orderId}`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ [getShipmentByOrderId] Error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không thể tải thông tin shipment',
    };
  }
};

/**
 * 5. BẮT ĐẦU GIAO HÀNG
 * PUT /api/v1/shipper/shipments/{shipmentId}/start-shipping
 */
export const startShipping = async (shipmentId) => {
  try {
    const response = await api.put(`/api/v1/shipper/shipments/${shipmentId}/start-shipping`);
    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Bắt đầu giao hàng thành công!',
    };
  } catch (error) {
    console.error('❌ [startShipping] Error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không thể bắt đầu giao hàng',
    };
  }
};

/**
 * 6. HOÀN THÀNH GIAO HÀNG
 * PUT /api/v1/shipper/shipments/{shipmentId}/complete
 */
export const completeShipment = async (shipmentId) => {
  try {
    const response = await api.put(`/api/v1/shipper/shipments/${shipmentId}/complete`);
    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Hoàn thành giao hàng thành công!',
    };
  } catch (error) {
    console.error('❌ [completeShipment] Error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không thể hoàn thành giao hàng',
    };
  }
};

/**
 * 7. GIAO HÀNG THẤT BẠI
 * PUT /api/v1/shipper/shipments/{shipmentId}/fail
 */
export const failShipment = async (shipmentId, reason = '') => {
  try {
    const response = await api.put(`/api/v1/shipper/shipments/${shipmentId}/fail`, {
      reason: reason || 'Giao hàng thất bại',
    });
    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Đã đánh dấu giao hàng thất bại',
    };
  } catch (error) {
    console.error('❌ [failShipment] Error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không thể đánh dấu giao hàng thất bại',
    };
  }
};

export default {
  getShipperHistory,
  pickupOrder,
  getPickingUpShipments,
  getShipmentByOrderId,
  startShipping,
  completeShipment,
  failShipment,
};

