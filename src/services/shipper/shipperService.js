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
    // ✅ Xử lý lỗi backend gracefully - nếu lỗi 500 do null address, trả về empty array
    if (error.response?.status === 500) {
      console.warn('⚠️ [getShipperHistory] Backend error 500 - returning empty array');
      return {
        success: true,
        data: {
          content: [],
          totalElements: 0,
          totalPages: 0,
        },
      };
    }
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || 'Không thể tải lịch sử giao hàng',
    };
  }
};

/**
 * 2. NHẬN ĐƠN HÀNG (PICKUP)
 * PUT /api/v1/shipper/shipment/{shipmentId}/picking
 * Shipper bắt đầu lấy hàng cho đơn hàng (theo shipmentId)
 */
export const pickupShipment = async (shipmentId) => {
  try {
    console.log('🔍 [pickupShipment] Calling API with shipmentId:', shipmentId);
    console.log('🔍 [pickupShipment] Endpoint:', `/api/v1/shipper/shipment/${shipmentId}/picking`);
    const response = await api.put(`/api/v1/shipper/shipment/${shipmentId}/picking`);
    console.log('✅ [pickupShipment] Success:', response.data);
    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Nhận đơn hàng thành công!',
    };
  } catch (error) {
    console.error('❌ [pickupShipment] Error:', error);
    console.error('❌ [pickupShipment] Error response:', error.response?.data);
    console.error('❌ [pickupShipment] Error status:', error.response?.status);
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || 'Không thể nhận đơn hàng',
    };
  }
};

/**
 * 3. LẤY DANH SÁCH ĐƠN ĐANG CHỜ NHẬN (PICKING UP)
 * GET /api/v1/shipper/shipments/ready-to-pickup
 */
export const getPickingUpShipments = async (params = {}) => {
  try {
    console.log('🔍 [getPickingUpShipments] Fetching ready-to-pickup shipments...');
    const response = await api.get('/api/v1/shipper/shipments/ready-to-pickup', {
      params: {
        page: params.page || 0,
        size: params.size || 20,
      }
    });

    console.log('📦 [getPickingUpShipments] Response status:', response.status);
    console.log('📦 [getPickingUpShipments] Response data:', JSON.stringify(response.data, null, 2));
    
    // ✅ Xử lý nhiều format response từ backend
    let shipments = [];
    
    // Format 1: response.data.data.content (nested)
    if (response.data?.data?.content && Array.isArray(response.data.data.content)) {
      shipments = response.data.data.content;
      console.log('📦 [getPickingUpShipments] Format 1: response.data.data.content');
    }
    // Format 2: response.data.content (direct)
    else if (response.data?.content && Array.isArray(response.data.content)) {
      shipments = response.data.content;
      console.log('📦 [getPickingUpShipments] Format 2: response.data.content');
    }
    // Format 3: response.data.data (array)
    else if (response.data?.data && Array.isArray(response.data.data)) {
      shipments = response.data.data;
      console.log('📦 [getPickingUpShipments] Format 3: response.data.data');
    }
    // Format 4: response.data (array)
    else if (Array.isArray(response.data)) {
      shipments = response.data;
      console.log('📦 [getPickingUpShipments] Format 4: response.data');
    }
    
    console.log('📦 [getPickingUpShipments] Parsed shipments:', {
      count: shipments.length,
      isArray: Array.isArray(shipments),
      data: shipments
    });

    return {
      success: true,
      data: { 
        content: shipments,
        totalElements: shipments.length,
        totalPages: 1,
      },
    };
  } catch (error) {
    console.error('❌ [getPickingUpShipments] Error caught:');
    console.error('❌ [getPickingUpShipments] Error object:', error);
    console.error('❌ [getPickingUpShipments] Error response:', error.response);
    console.error('❌ [getPickingUpShipments] Error status:', error.response?.status);
    console.error('❌ [getPickingUpShipments] Error data:', error.response?.data);
    console.error('❌ [getPickingUpShipments] Full error:', JSON.stringify({
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      config: {
        url: error.config?.url,
        method: error.config?.method,
      }
    }, null, 2));
    
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || 'Không thể tải danh sách đơn chờ nhận',
    };
  }
};

/**
 * 4. LẤY CHI TIẾT SHIPMENT THEO SHIPMENT ID
 * ⚠️ Lưu ý: API theo Swagger 1512 là dạng số ít:
 * GET /api/v1/shipper/shipment/{shipmentId}
 */
export const getShipmentByShipmentId = async (shipmentId) => {
  try {
    // Sử dụng endpoint dạng số ít `/shipment/{shipmentId}` để khớp với backend
    const response = await api.get(`/api/v1/shipper/shipment/${shipmentId}`);
    // ✅ Xử lý nhiều format response
    const shipmentData = response.data?.data || response.data;
    return {
      success: true,
      data: shipmentData,
    };
  } catch (error) {
    // ✅ Xử lý lỗi 404 (không tìm thấy shipment)
    if (error.response?.status === 404) {
      return {
        success: false,
        notFound: true,
        error: 'Không tìm thấy thông tin vận đơn',
      };
    }
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || 'Không thể tải thông tin shipment',
    };
  }
};

/**
 * 5. BẮT ĐẦU GIAO HÀNG
 * PUT /api/v1/shipper/shipment/{shipmentId}/shipping
 */
export const startShipping = async (shipmentId) => {
  try {
    const response = await api.put(`/api/v1/shipper/shipment/${shipmentId}/shipping`);
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
 * PUT /api/v1/shipper/shipment/{shipmentId}/delivered
 */
export const completeShipment = async (shipmentId) => {
  try {
    const response = await api.put(`/api/v1/shipper/shipment/${shipmentId}/delivered`);
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
 * PUT /api/v1/shipper/shipment/{shipmentId}/fail
 */
export const failShipment = async (shipmentId, reason = '') => {
  try {
    const response = await api.put(`/api/v1/shipper/shipment/${shipmentId}/fail`, {
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

/**
 * 8. XÁC NHẬN ĐÃ LẤY HÀNG
 * PUT /api/v1/shipper/shipment/{shipmentId}/picked
 */
export const confirmPicked = async (shipmentId) => {
  try {
    const response = await api.put(`/api/v1/shipper/shipment/${shipmentId}/picked`);
    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Đã xác nhận lấy hàng thành công!',
    };
  } catch (error) {
    console.error('❌ [confirmPicked] Error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không thể xác nhận lấy hàng',
    };
  }
};

/**
 * 9. BẮT ĐẦU TRẢ HÀNG
 * PUT /api/v1/shipper/shipment/{shipmentId}/returning
 */
export const startReturning = async (shipmentId) => {
  try {
    const response = await api.put(`/api/v1/shipper/shipment/${shipmentId}/returning`);
    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Bắt đầu trả hàng thành công!',
    };
  } catch (error) {
    console.error('❌ [startReturning] Error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không thể bắt đầu trả hàng',
    };
  }
};

/**
 * 10. XÁC NHẬN ĐÃ TRẢ HÀNG
 * PUT /api/v1/shipper/shipment/{shipmentId}/returned
 */
export const confirmReturned = async (shipmentId) => {
  try {
    const response = await api.put(`/api/v1/shipper/shipment/${shipmentId}/returned`);
    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Đã xác nhận trả hàng thành công!',
    };
  } catch (error) {
    console.error('❌ [confirmReturned] Error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Không thể xác nhận trả hàng',
    };
  }
};

export default {
  getShipperHistory,
  pickupShipment,
  getPickingUpShipments,
  getShipmentByShipmentId,
  startShipping,
  completeShipment,
  failShipment,
  confirmPicked,
  startReturning,
  confirmReturned,
};

