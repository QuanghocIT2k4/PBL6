import api from '../common/api';

/**
 * ================================================
 * SHIPMENT SERVICE - API CALLS
 * ================================================
 * Handles all shipment-related API requests for shippers
 */

/**
 * Get list of shipments ready to pickup
 * @returns {Promise} List of shipments
 */
export const getReadyToPickup = async () => {
  try {
    const response = await api.get('/api/v1/shipper/shipments/ready-to-pickup');

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error fetching ready to pickup:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tải danh sách đơn hàng cần lấy',
    };
  }
};

/**
 * Start picking order
 * @param {string} shipmentId - Shipment ID
 * @returns {Promise} Updated shipment
 */
export const startPicking = async (shipmentId) => {
  try {
    const response = await api.put(`/api/v1/shipper/shipment/${shipmentId}/picking`);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error starting picking:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể bắt đầu lấy hàng',
    };
  }
};

/**
 * Confirm picked
 * @param {string} shipmentId - Shipment ID
 * @returns {Promise} Updated shipment
 */
export const confirmPicked = async (shipmentId) => {
  try {
    const response = await api.put(`/api/v1/shipper/shipment/${shipmentId}/picked`);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error confirming picked:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể xác nhận đã lấy hàng',
    };
  }
};

/**
 * Start shipping
 * @param {string} shipmentId - Shipment ID
 * @returns {Promise} Updated shipment
 */
export const startShipping = async (shipmentId) => {
  try {
    const response = await api.put(`/api/v1/shipper/shipment/${shipmentId}/shipping`);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error starting shipping:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể bắt đầu giao hàng',
    };
  }
};

/**
 * Confirm delivered
 * @param {string} shipmentId - Shipment ID
 * @returns {Promise} Updated shipment
 */
export const confirmDelivered = async (shipmentId) => {
  try {
    const response = await api.put(`/api/v1/shipper/shipment/${shipmentId}/delivered`);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error confirming delivered:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể xác nhận đã giao hàng',
    };
  }
};

/**
 * Report delivery fail
 * @param {string} shipmentId - Shipment ID
 * @param {string} reason - Fail reason
 * @returns {Promise} Updated shipment
 */
export const reportFail = async (shipmentId, reason) => {
  try {
    const response = await api.put(`/api/v1/shipper/shipment/${shipmentId}/fail`, { reason });

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error reporting fail:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể báo giao hàng thất bại',
    };
  }
};

/**
 * Start returning
 * @param {string} shipmentId - Shipment ID
 * @returns {Promise} Updated shipment
 */
export const startReturning = async (shipmentId) => {
  try {
    const response = await api.put(`/api/v1/shipper/shipment/${shipmentId}/returning`);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error starting returning:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể bắt đầu trả hàng',
    };
  }
};

/**
 * Confirm returned
 * @param {string} shipmentId - Shipment ID
 * @returns {Promise} Updated shipment
 */
export const confirmReturned = async (shipmentId) => {
  try {
    const response = await api.put(`/api/v1/shipper/shipment/${shipmentId}/returned`);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error confirming returned:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể xác nhận đã trả hàng',
    };
  }
};

/**
 * Get shipment by shipment ID
 * @param {string} shipmentId - Shipment ID
 * @returns {Promise} Shipment detail
 */
export const getShipmentById = async (shipmentId) => {
  try {
    const response = await api.get(`/api/v1/shipper/shipments/${shipmentId}`);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('Error fetching shipment:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tải thông tin shipment',
    };
  }
};

