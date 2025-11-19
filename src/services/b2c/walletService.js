import api from '../common/api';

/**
 * B2C WALLET SERVICE
 * APIs for store wallet management
 */

/**
 * 1. GET STORE WALLET INFO
 * GET /api/v1/b2c/wallet/store/{storeId}
 */
export const getStoreWallet = async (storeId) => {
  try {
    console.log('📥 Fetching store wallet:', storeId);
    
    const response = await api.get(`/api/v1/b2c/wallet/store/${storeId}`);
    
    console.log('✅ Store wallet response:', response.data);
    
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ Error fetching store wallet:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tải thông tin ví',
    };
  }
};

/**
 * 2. GET WITHDRAWAL REQUESTS
 * GET /api/v1/b2c/wallet/store/{storeId}/withdrawals
 */
export const getWithdrawalRequests = async (storeId, params = {}) => {
  try {
    const { 
      page = 0, 
      size = 10, 
      status,
      sortBy = 'createdAt',
      sortDir = 'desc'
    } = params;
    
    console.log('📥 Fetching withdrawal requests:', { 
      storeId, 
      page, 
      size, 
      status,
      sortBy,
      sortDir
    });
    
    const response = await api.get(`/api/v1/b2c/wallet/store/${storeId}/withdrawals`, {
      params: { 
        page, 
        size, 
        sortBy,
        sortDir,
        ...(status && { status }) 
      },
    });
    
    console.log('✅ Withdrawal requests response:', response.data);
    
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ Error fetching withdrawal requests:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tải danh sách yêu cầu rút tiền',
    };
  }
};

/**
 * 3. CREATE WITHDRAWAL REQUEST
 * POST /api/v1/b2c/wallet/store/{storeId}/withdrawal
 */
export const createWithdrawalRequest = async (storeId, withdrawalData) => {
  try {
    console.log('📤 Creating withdrawal request:', { storeId, withdrawalData });
    
    const response = await api.post(
      `/api/v1/b2c/wallet/store/${storeId}/withdrawal`,
      withdrawalData
    );
    
    console.log('✅ Withdrawal request created:', response.data);
    
    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Tạo yêu cầu rút tiền thành công',
    };
  } catch (error) {
    console.error('❌ Error creating withdrawal request:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tạo yêu cầu rút tiền',
    };
  }
};

/**
 * 4. GET WITHDRAWAL REQUEST DETAIL
 * GET /api/v1/b2c/wallet/store/{storeId}/withdrawal/{requestId}
 */
export const getWithdrawalRequestDetail = async (storeId, requestId) => {
  try {
    console.log('📥 Fetching withdrawal request detail:', { storeId, requestId });
    
    const response = await api.get(`/api/v1/b2c/wallet/store/${storeId}/withdrawal/${requestId}`);
    
    console.log('✅ Withdrawal request detail response:', response.data);
    
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ Error fetching withdrawal request detail:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tải chi tiết yêu cầu rút tiền',
    };
  }
};

/**
 * 5. GET WALLET TRANSACTIONS
 * GET /api/v1/b2c/wallet/store/{storeId}/transactions
 */
export const getWalletTransactions = async (storeId, params = {}) => {
  try {
    const { 
      page = 0, 
      size = 10, 
      type,
      sortBy = 'createdAt',
      sortDir = 'desc'
    } = params;
    
    console.log('📥 Fetching wallet transactions:', { 
      storeId, 
      page, 
      size, 
      type,
      sortBy,
      sortDir
    });
    
    const response = await api.get(`/api/v1/b2c/wallet/store/${storeId}/transactions`, {
      params: { 
        page, 
        size, 
        sortBy,
        sortDir,
        ...(type && { type }) 
      },
    });
    
    console.log('✅ Wallet transactions response:', response.data);
    
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ Error fetching wallet transactions:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tải lịch sử giao dịch',
    };
  }
};

/**
 * HELPER: Format currency
 */
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

/**
 * HELPER: Get withdrawal status badge
 */
export const getWithdrawalStatusBadge = (status) => {
  const badges = {
    PENDING: { text: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-800' },
    APPROVED: { text: 'Đã duyệt', color: 'bg-green-100 text-green-800' },
    REJECTED: { text: 'Từ chối', color: 'bg-red-100 text-red-800' },
    COMPLETED: { text: 'Hoàn thành', color: 'bg-blue-100 text-blue-800' },
  };
  
  return badges[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
};

/**
 * HELPER: Get transaction type badge
 */
export const getTransactionTypeBadge = (type) => {
  const badges = {
    PAYMENT: { text: 'Thanh toán', color: 'bg-green-100 text-green-800', icon: '💰' },
    WITHDRAWAL: { text: 'Rút tiền', color: 'bg-red-100 text-red-800', icon: '💸' },
    REFUND: { text: 'Hoàn tiền', color: 'bg-yellow-100 text-yellow-800', icon: '↩️' },
    FEE: { text: 'Phí dịch vụ', color: 'bg-gray-100 text-gray-800', icon: '💳' },
  };
  
  return badges[type] || { text: type, color: 'bg-gray-100 text-gray-800', icon: '📝' };
};

export default {
  getStoreWallet,
  getWithdrawalRequests,
  createWithdrawalRequest,
  getWithdrawalRequestDetail,
  getWalletTransactions,
  formatCurrency,
  getWithdrawalStatusBadge,
  getTransactionTypeBadge,
};
