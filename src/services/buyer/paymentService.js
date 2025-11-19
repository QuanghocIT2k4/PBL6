import api from '../common/api';

/**
 * ================================================
 * BUYER PAYMENT MANAGEMENT SERVICE
 * ================================================
 * Handles VNPay payment gateway integration
 * - Create payment URL
 * - Query payment status
 * - Refund transactions (admin only)
 */

/**
 * 1. TẠO VNPAY PAYMENT URL
 * POST /api/v1/buyer/payments/create_payment_url
 * 
 * @param {Object} paymentData - Payment details
 * @param {number} paymentData.amount - Payment amount (VND)
 * @param {string} paymentData.orderInfo - Order information (e.g., "Order #ORD123456")
 * @param {string} paymentData.bankCode - Bank code (optional, e.g., "NCB", "VNPAYQR")
 * @param {string} paymentData.language - Language ("vn" or "en")
 * 
 * @returns {Object} { success, data: { paymentUrl }, error }
 * 
 * @example
 * const result = await createPaymentUrl({
 *   amount: 1000000,
 *   orderInfo: "Order #ORD123456 - Laptop ASUS",
 *   bankCode: "NCB",
 *   language: "vn"
 * });
 * 
 * if (result.success) {
 *   window.location.href = result.data.paymentUrl;
 * }
 */
export const createPaymentUrl = async (paymentData) => {
  try {
    console.log('📤 Creating VNPay payment URL:', paymentData);
    
    const response = await api.post('/api/v1/buyer/payments/create_payment_url', {
      amount: paymentData.amount,
      orderInfo: paymentData.orderInfo || `Order #${Date.now()}`, // Order information
      bankCode: paymentData.bankCode || '', // Optional
      language: paymentData.language || 'vn', // Default Vietnamese
    });
    
    console.log('✅ Full response:', response);
    console.log('✅ Response data:', response.data);
    console.log('✅ Response data type:', typeof response.data);
    console.log('✅ Response data keys:', Object.keys(response.data || {}));
    
    // Parse response - backend có thể trả về nhiều format
    let paymentUrl = null;
    
    if (typeof response.data === 'string') {
      // Format 1: Direct URL string
      paymentUrl = response.data;
    } else if (response.data?.data) {
      // Format 2: Nested in data
      paymentUrl = response.data.data.paymentUrl || response.data.data;
    } else if (response.data?.paymentUrl) {
      // Format 3: Direct paymentUrl field
      paymentUrl = response.data.paymentUrl;
    }
    
    console.log('✅ Extracted payment URL:', paymentUrl);
    
    if (!paymentUrl) {
      console.error('❌ No payment URL found in response:', response.data);
      return {
        success: false,
        error: 'Backend không trả về payment URL',
      };
    }
    
    // 🔍 PARSE VNPay URL để debug
    try {
      const url = new URL(paymentUrl);
      const params = Object.fromEntries(url.searchParams);
      console.log('🔍 VNPay URL params:', params);
      console.log('🔍 vnp_Amount:', params.vnp_Amount);
      console.log('🔍 vnp_TxnRef:', params.vnp_TxnRef);
      console.log('🔍 vnp_OrderInfo:', params.vnp_OrderInfo);
      console.log('🔍 vnp_ReturnUrl:', params.vnp_ReturnUrl);
      console.log('🔍 vnp_CreateDate:', params.vnp_CreateDate);
      console.log('🔍 vnp_ExpireDate:', params.vnp_ExpireDate);
    } catch (e) {
      console.warn('⚠️ Cannot parse payment URL:', e);
    }
    
    return {
      success: true,
      data: { paymentUrl },
      message: 'Tạo link thanh toán thành công',
    };
  } catch (error) {
    console.error('❌ Error creating payment URL:', error);
    console.error('❌ Error response:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tạo link thanh toán',
    };
  }
};

/**
 * 2. QUERY PAYMENT TRANSACTION STATUS
 * POST /api/v1/buyer/payments/query
 * 
 * Verify payment status from VNPay after user returns from payment gateway
 * 
 * @param {Object} queryData - Query details
 * @param {string} queryData.order_id - Order ID (vnp_TxnRef from VNPay callback)
 * @param {string} queryData.trans_date - Transaction date (vnp_TransactionDate from VNPay)
 * @param {string} queryData.ip_address - IP address (optional)
 * 
 * @returns {Object} { success, data: { status, amount, ... }, error }
 * 
 * @example
 * const result = await queryPayment({
 *   order_id: "ORDER123",
 *   trans_date: "20231118120000"
 * });
 * 
 * if (result.success && result.data.status === 'SUCCESS') {
 *   // Payment verified successfully
 * }
 */
export const queryPayment = async (queryData) => {
  try {
    console.log('📤 Querying payment status:', queryData);
    
    const response = await api.post('/api/v1/buyer/payments/query', {
      order_id: queryData.order_id,
      trans_date: queryData.trans_date,
      ip_address: queryData.ip_address || '',
    });
    
    console.log('✅ Payment query result:', response.data);
    
    return {
      success: true,
      data: response.data.data,
      message: 'Kiểm tra thanh toán thành công',
    };
  } catch (error) {
    console.error('❌ Error querying payment:', error);
    console.error('❌ Error response:', error.response?.data);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể kiểm tra trạng thái thanh toán',
    };
  }
};

/**
 * 3. REFUND PAYMENT TRANSACTION
 * POST /api/v1/buyer/payments/refund
 * 
 * Request refund for a completed payment (Admin only)
 * 
 * @param {Object} refundData - Refund details
 * @param {string} refundData.transaction_type - Transaction type (e.g., "02" for full refund)
 * @param {string} refundData.order_id - Order ID
 * @param {number} refundData.amount - Refund amount (VND)
 * @param {string} refundData.transaction_date - Original transaction date
 * @param {string} refundData.reason - Refund reason (optional, e.g., "Customer requested cancellation")
 * @param {string} refundData.created_by - Admin username
 * @param {string} refundData.ip_address - IP address (optional)
 * 
 * @returns {Object} { success, data, error }
 * 
 * @example
 * const result = await refundPayment({
 *   transaction_type: "02",
 *   order_id: "ORDER123",
 *   amount: 1000000,
 *   transaction_date: "20231118120000",
 *   reason: "Customer requested cancellation",
 *   created_by: "admin"
 * });
 */
export const refundPayment = async (refundData) => {
  try {
    console.log('📤 Requesting payment refund:', refundData);
    
    const response = await api.post('/api/v1/buyer/payments/refund', {
      transaction_type: refundData.transaction_type,
      order_id: refundData.order_id,
      amount: refundData.amount,
      transaction_date: refundData.transaction_date,
      reason: refundData.reason || '', // Refund reason
      created_by: refundData.created_by,
      ip_address: refundData.ip_address || '',
    });
    
    console.log('✅ Refund request submitted:', response.data);
    
    return {
      success: true,
      data: response.data.data,
      message: 'Yêu cầu hoàn tiền thành công',
    };
  } catch (error) {
    console.error('❌ Error requesting refund:', error);
    console.error('❌ Error response:', error.response?.data);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể yêu cầu hoàn tiền',
    };
  }
};

/**
 * ================================================
 * HELPER FUNCTIONS
 * ================================================
 */

/**
 * Parse VNPay callback URL parameters
 * 
 * @param {URLSearchParams} searchParams - URL search params from callback
 * @returns {Object} Parsed payment result
 * 
 * @example
 * const searchParams = new URLSearchParams(window.location.search);
 * const result = parseVNPayCallback(searchParams);
 * 
 * if (result.isSuccess) {
 *   // Payment successful
 * }
 */
export const parseVNPayCallback = (searchParams) => {
  const vnp_ResponseCode = searchParams.get('vnp_ResponseCode');
  const vnp_TxnRef = searchParams.get('vnp_TxnRef');
  const vnp_Amount = searchParams.get('vnp_Amount');
  const vnp_TransactionNo = searchParams.get('vnp_TransactionNo');
  const vnp_TransactionDate = searchParams.get('vnp_TransactionDate');
  const vnp_BankCode = searchParams.get('vnp_BankCode');
  const vnp_OrderInfo = searchParams.get('vnp_OrderInfo');
  
  // VNPay response codes
  const isSuccess = vnp_ResponseCode === '00';
  
  return {
    isSuccess,
    responseCode: vnp_ResponseCode,
    txnRef: vnp_TxnRef,
    amount: vnp_Amount ? parseInt(vnp_Amount) / 100 : 0, // VNPay returns amount * 100
    transactionNo: vnp_TransactionNo,
    transactionDate: vnp_TransactionDate,
    bankCode: vnp_BankCode,
    orderInfo: vnp_OrderInfo,
    // For query API
    queryData: {
      order_id: vnp_TxnRef,
      trans_date: vnp_TransactionDate,
    },
  };
};

/**
 * Get VNPay response code message (Vietnamese)
 * 
 * @param {string} code - VNPay response code
 * @returns {string} Error message
 */
export const getVNPayErrorMessage = (code) => {
  const messages = {
    '00': 'Giao dịch thành công',
    '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
    '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
    '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
    '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
    '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
    '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.',
    '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
    '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
    '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
    '75': 'Ngân hàng thanh toán đang bảo trì.',
    '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch',
    '99': 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)',
  };
  
  return messages[code] || 'Lỗi không xác định';
};

/**
 * Get common bank codes for VNPay
 * 
 * @returns {Array} List of bank codes with names
 */
export const getVNPayBankCodes = () => {
  return [
    { code: '', name: 'Cổng thanh toán VNPay (Tất cả phương thức)' },
    { code: 'VNPAYQR', name: 'Thanh toán qua ứng dụng hỗ trợ VNPAYQR' },
    { code: 'VNBANK', name: 'Thanh toán qua ATM-Tài khoản ngân hàng nội địa' },
    { code: 'INTCARD', name: 'Thanh toán qua thẻ quốc tế' },
    { code: 'NCB', name: 'Ngân hàng NCB' },
    { code: 'VIETCOMBANK', name: 'Ngân hàng Vietcombank' },
    { code: 'VIETINBANK', name: 'Ngân hàng Vietinbank' },
    { code: 'BIDV', name: 'Ngân hàng BIDV' },
    { code: 'AGRIBANK', name: 'Ngân hàng Agribank' },
    { code: 'TECHCOMBANK', name: 'Ngân hàng Techcombank' },
    { code: 'MB', name: 'Ngân hàng MB' },
    { code: 'ACB', name: 'Ngân hàng ACB' },
    { code: 'SACOMBANK', name: 'Ngân hàng Sacombank' },
    { code: 'TPBANK', name: 'Ngân hàng TPBank' },
    { code: 'VPBank', name: 'Ngân hàng VPBank' },
  ];
};
