import api from '../common/api';

/**
 * ================================================
 * BUYER WALLET SERVICE
 * ================================================
 * APIs quản lý ví điện tử cho khách hàng
 * - Xem số dư
 * - Lịch sử giao dịch
 * - Yêu cầu rút tiền
 */

/**
 * 1. GET WALLET BALANCE
 * GET /api/v1/buyer/wallet/balance
 * 
 * Lấy số dư ví hiện tại
 * 
 * @returns {Object} { success, data: { balance }, error }
 */
export const getWalletBalance = async () => {
  try {
    const response = await api.get('/api/v1/buyer/wallet/balance');
    
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ [Buyer Wallet] Error fetching balance:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tải số dư ví',
    };
  }
};

/**
 * 2. GET WALLET INFO
 * GET /api/v1/buyer/wallet/info
 * 
 * Lấy thông tin chi tiết ví (balance, status, etc.)
 * 
 * @returns {Object} { success, data: { wallet info }, error }
 */
export const getWalletInfo = async () => {
  try {
    const response = await api.get('/api/v1/buyer/wallet/info');
    
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ [Buyer Wallet] Error fetching wallet info:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tải thông tin ví',
    };
  }
};

/**
 * 3. GET WALLET TRANSACTIONS
 * GET /api/v1/buyer/wallet/transactions
 * 
 * Lấy lịch sử giao dịch
 * 
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (0-indexed)
 * @param {number} params.size - Page size
 * @param {string} params.type - Transaction type (DEPOSIT, PAYMENT, REFUND, WITHDRAWAL)
 * @param {string} params.sortBy - Sort field
 * @param {string} params.sortDir - Sort direction (asc/desc)
 * 
 * @returns {Object} { success, data: { transactions, pagination }, error }
 */
export const getWalletTransactions = async (params = {}) => {
  try {
    const {
      page = 0,
      size = 10,
      type = null, // DEPOSIT, PAYMENT, REFUND, WITHDRAWAL
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = params;
    
    const response = await api.get('/api/v1/buyer/wallet/transactions', {
      params: {
        page,
        size,
        sortBy,
        sortDir,
        ...(type && { type }),
      },
    });
    
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ [Buyer Wallet] Error fetching transactions:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tải lịch sử giao dịch',
    };
  }
};

/**
 * 4. GET WITHDRAWAL REQUESTS
 * GET /api/v1/buyer/wallet/withdrawal-requests
 * 
 * Lấy danh sách yêu cầu rút tiền
 * 
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.size - Page size
 * @param {string} params.status - Request status (PENDING, APPROVED, REJECTED, COMPLETED)
 * 
 * @returns {Object} { success, data: { requests, pagination }, error }
 */
export const getWithdrawalRequests = async (params = {}) => {
  try {
    const {
      page = 0,
      size = 10,
      status = null, // PENDING, APPROVED, REJECTED, COMPLETED
    } = params;
    
    
    const response = await api.get('/api/v1/buyer/wallet/withdrawal-requests', {
      params: {
        page,
        size,
        ...(status && { status }),
      },
    });
    
    
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ [Buyer Wallet] Error fetching withdrawal requests:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tải danh sách yêu cầu rút tiền',
    };
  }
};

/**
 * 5. GET WITHDRAWAL REQUEST DETAIL
 * GET /api/v1/buyer/wallet/withdrawal-requests/{requestId}
 * 
 * Lấy chi tiết yêu cầu rút tiền
 * 
 * @param {string} requestId - Withdrawal request ID
 * @returns {Object} { success, data: { request detail }, error }
 */
export const getWithdrawalRequestDetail = async (requestId) => {
  try {
    
    const response = await api.get(`/api/v1/buyer/wallet/withdrawal-requests/${requestId}`);
    
    
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ [Buyer Wallet] Error fetching withdrawal request detail:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tải chi tiết yêu cầu rút tiền',
    };
  }
};

/**
 * 6. CREATE WITHDRAWAL REQUEST
 * POST /api/v1/buyer/wallet/withdrawal-request
 * 
 * Tạo yêu cầu rút tiền mới
 * 
 * @param {Object} requestData - Withdrawal request data
 * @param {number} requestData.amount - Số tiền rút
 * @param {string} requestData.bankName - Tên ngân hàng
 * @param {string} requestData.bankAccountNumber - Số tài khoản
 * @param {string} requestData.bankAccountName - Tên chủ tài khoản
 * @param {string} requestData.note - Ghi chú (optional)
 * 
 * @returns {Object} { success, data: { request }, message, error }
 */
export const createWithdrawalRequest = async (requestData) => {
  try {
    
    const response = await api.post('/api/v1/buyer/wallet/withdrawal-request', requestData);
    
    
    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Yêu cầu rút tiền đã được tạo thành công',
    };
  } catch (error) {
    console.error('❌ [Buyer Wallet] Error creating withdrawal request:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tạo yêu cầu rút tiền',
    };
  }
};

/**
 * ================================================
 * HELPER FUNCTIONS
 * ================================================
 */

/**
 * Format currency VND
 */
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

/**
 * Get transaction type badge
 */
export const getTransactionTypeBadge = (type) => {
  const badges = {
    DEPOSIT: {
      text: 'Nạp tiền',
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      icon: '💰',
    },
    PAYMENT: {
      text: 'Thanh toán',
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      icon: '💳',
    },
    REFUND: {
      text: 'Hoàn tiền',
      color: 'purple',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-800',
      icon: '↩️',
    },
    WITHDRAWAL: {
      text: 'Rút tiền',
      color: 'orange',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800',
      icon: '💸',
    },
  };
  
  return badges[type] || {
    text: type,
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    icon: '📝',
  };
};

/**
 * Get withdrawal status badge
 */
export const getWithdrawalStatusBadge = (status) => {
  const badges = {
    PENDING: {
      text: 'Chờ duyệt',
      color: 'yellow',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      icon: '⏳',
    },
    APPROVED: {
      text: 'Đã duyệt',
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      icon: '✅',
    },
    REJECTED: {
      text: 'Từ chối',
      color: 'red',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      icon: '❌',
    },
    COMPLETED: {
      text: 'Hoàn tất',
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      icon: '✔️',
    },
  };
  
  return badges[status] || {
    text: status,
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    icon: '📝',
  };
};

/**
 * Format date time
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Validate withdrawal amount
 */
export const validateWithdrawalAmount = (amount, balance, minAmount = 50000) => {
  if (!amount || amount <= 0) {
    return { valid: false, message: 'Số tiền phải lớn hơn 0' };
  }
  
  if (amount < minAmount) {
    return { valid: false, message: `Số tiền tối thiểu là ${formatCurrency(minAmount)}` };
  }
  
  if (amount > balance) {
    return { valid: false, message: 'Số dư không đủ' };
  }
  
  return { valid: true };
};
