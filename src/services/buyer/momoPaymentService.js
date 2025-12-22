import api from '../common/api';

/**
 * ================================================
 * MOMO PAYMENT SERVICE
 * ================================================
 * Handles MoMo payment gateway integration
 * - Create payment request
 * - Check payment status
 * - Refund transactions
 * 
 * Reference: FE/Md/MOMO_REFUND_API_GUIDE.md
 */

/**
 * 1. TẠO THANH TOÁN MOMO
 * POST /api/v1/buyer/payments/momo/create_payment_request
 * 
 * @param {number} amount - Số tiền thanh toán (VND), kiểu number
 * @param {string} orderId - Order ID từ hệ thống (optional nhưng backend có thể cần)
 * @param {string} orderInfo - Thông tin đơn hàng (optional)
 * @param {Array<string>} orderIds - Mảng các order IDs (để liên kết nhiều đơn hàng với 1 payment)
 * @returns {Object} { success, data: { payUrl, orderId, ... }, error }
 * 
 * @example
 * const result = await createMoMoPayment(50000, 'order_123', 'Thanh toán đơn hàng order_123');
 * if (result.success) {
 *   window.location.href = result.data.payUrl;
 * }
 * 
 * @example - Nhiều đơn hàng
 * const result = await createMoMoPayment(24630000, 'order_001', 'Thanh toán 2 đơn hàng', ['order_001', 'order_002']);
 */
export const createMoMoPayment = async (amount, orderId = null, orderInfo = null, orderIds = []) => {
  // ✅ Khai báo requestBody ở scope cao hơn để có thể dùng trong catch block
  let requestBody = {
    amount: amount,
  };

  try {
    if (!amount || typeof amount !== 'number') {
      return {
        success: false,
        error: 'Số tiền phải là kiểu number (VND)',
      };
    }

    // ✅ Tạo request body với các fields backend có thể yêu cầu
    requestBody = {
      amount: amount, // Phải là number, không phải string
    };

    // ✅ Thêm orderId nếu có (backend có thể cần để liên kết với order)
    if (orderId) {
      requestBody.orderId = orderId;
    }

    // ✅ Thêm orderIds nếu có (để liên kết nhiều đơn hàng với 1 payment)
    if (orderIds && Array.isArray(orderIds) && orderIds.length > 0) {
      requestBody.orderIds = orderIds;
    }

    // ✅ Thêm orderInfo nếu có (mô tả đơn hàng)
    if (orderInfo) {
      requestBody.orderInfo = orderInfo;
    } else if (orderId) {
      // ✅ Nếu không có orderInfo nhưng có orderId, tự tạo mô tả
      requestBody.orderInfo = `Thanh toán đơn hàng ${orderId}`;
    }

    const response = await api.post('/api/v1/buyer/payments/momo/create_payment_request', requestBody);

    // ✅ Kiểm tra nếu response có resultCode !== 0 (lỗi từ MoMo)
    if (response.data?.resultCode !== undefined && response.data.resultCode !== 0) {
      const errorMessage = response.data?.message || `MoMo API error: resultCode ${response.data.resultCode}`;
      return {
        success: false,
        error: errorMessage,
        resultCode: response.data.resultCode,
        subErrors: response.data?.subErrors,
      };
    }

    // Parse response
    let payUrl = null;
    let momoOrderId = null; // ✅ Đổi tên để tránh conflict với parameter orderId
    let transId = null;

    if (response.data) {
      // Format 1: Direct response
      if (response.data.payUrl) {
        payUrl = response.data.payUrl;
        momoOrderId = response.data.orderId;
        transId = response.data.transId;
      }
      // Format 2: Nested in data
      else if (response.data.data) {
        payUrl = response.data.data.payUrl || response.data.data.paymentUrl;
        momoOrderId = response.data.data.orderId;
        transId = response.data.data.transId;
      }
      // Format 3: Response từ MoMo API trực tiếp
      else if (response.data.resultCode === 0) {
        payUrl = response.data.payUrl;
        momoOrderId = response.data.orderId;
        transId = response.data.transId;
      }
    }

    if (!payUrl) {
      console.error('❌ No payment URL found in MoMo response:', response.data);
      return {
        success: false,
        error: response.data?.message || 'Backend không trả về payment URL',
        rawResponse: response.data,
      };
    }

    return {
      success: true,
      data: {
        payUrl,
        orderId: momoOrderId, // ✅ Trả về orderId từ MoMo response
        transId,
        amount: response.data.amount || amount,
        partnerCode: response.data.partnerCode || 'MOMO',
        message: response.data.message || 'Tạo link thanh toán thành công',
      },
      message: 'Tạo link thanh toán MoMo thành công',
    };
  } catch (error) {
    console.error('❌ Error creating MoMo payment:', error);
    console.error('❌ Error response:', error.response?.data);
    console.error('❌ Request body sent:', requestBody);
    
    // ✅ Xử lý lỗi từ MoMo API (resultCode !== 0)
    if (error.response?.data?.resultCode !== undefined) {
      return {
        success: false,
        error: error.response.data.message || `MoMo API error: resultCode ${error.response.data.resultCode}`,
        resultCode: error.response.data.resultCode,
        subErrors: error.response.data?.subErrors,
      };
    }
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tạo link thanh toán MoMo',
      rawError: error.response?.data,
    };
  }
};

/**
 * 2. KIỂM TRA TRẠNG THÁI THANH TOÁN MOMO
 * GET /api/v1/buyer/payments/momo/check_status/{orderId}
 * 
 * @param {string} orderId - Order ID từ MoMo
 * @returns {Object} { success, data: { status, transId, amount, ... }, error }
 * 
 * @example
 * const result = await checkMoMoPaymentStatus('MOMO1702537200000');
 * if (result.success && result.data.resultCode === 0) {
 *   // Payment successful
 * }
 */
export const checkMoMoPaymentStatus = async (orderId) => {
  try {
    if (!orderId) {
      return {
        success: false,
        error: 'Order ID là bắt buộc',
      };
    }

    const response = await api.get(`/api/v1/buyer/payments/momo/check_status/${orderId}`);

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Kiểm tra trạng thái thanh toán thành công',
    };
  } catch (error) {
    console.error('❌ Error checking MoMo payment status:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể kiểm tra trạng thái thanh toán',
    };
  }
};

/**
 * 3. HOÀN TIỀN MOMO
 * POST /api/v1/buyer/payments/momo/refund
 * 
 * @param {Object} refundData - Refund details
 * @param {number} refundData.transId - Mã giao dịch MoMo (từ response thanh toán thành công)
 * @param {number} refundData.amount - Số tiền hoàn (Min: 1,000 VND, Max: 50,000,000 VND)
 * @param {string} refundData.description - Lý do hoàn tiền
 * 
 * @returns {Object} { success, data, error }
 * 
 * @example
 * const result = await refundMoMoPayment({
 *   transId: 2820086739,
 *   amount: 50000,
 *   description: 'Hoàn tiền do khách hàng hủy đơn'
 * });
 */
export const refundMoMoPayment = async (refundData) => {
  try {
    if (!refundData.transId || !refundData.amount) {
      return {
        success: false,
        error: 'transId và amount là bắt buộc',
      };
    }

    if (refundData.amount < 1000 || refundData.amount > 50000000) {
      return {
        success: false,
        error: 'Số tiền hoàn phải từ 1,000 VND đến 50,000,000 VND',
      };
    }

    const response = await api.post('/api/v1/buyer/payments/momo/refund', {
      transId: refundData.transId,
      amount: refundData.amount, // Phải là number
      description: refundData.description || 'Hoàn tiền đơn hàng',
    });

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Yêu cầu hoàn tiền thành công',
    };
  } catch (error) {
    console.error('❌ Error refunding MoMo payment:', error);
    console.error('❌ Error response:', error.response?.data);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể yêu cầu hoàn tiền',
    };
  }
};

/**
 * 4. KIỂM TRA TRẠNG THÁI HOÀN TIỀN MOMO
 * GET /api/v1/buyer/payments/momo/refund/check_status/{orderId}
 * 
 * @param {string} orderId - Order ID từ refund response
 * @returns {Object} { success, data, error }
 */
export const checkMoMoRefundStatus = async (orderId) => {
  try {
    if (!orderId) {
      return {
        success: false,
        error: 'Order ID là bắt buộc',
      };
    }

    const response = await api.get(`/api/v1/buyer/payments/momo/refund/check_status/${orderId}`);

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Kiểm tra trạng thái hoàn tiền thành công',
    };
  } catch (error) {
    console.error('❌ Error checking MoMo refund status:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể kiểm tra trạng thái hoàn tiền',
    };
  }
};

export default {
  createMoMoPayment,
  checkMoMoPaymentStatus,
  refundMoMoPayment,
  checkMoMoRefundStatus,
};

