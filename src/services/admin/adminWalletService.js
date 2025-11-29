import api from '../common/api';

/**
 * ADMIN WALLET SERVICE
 * APIs for admin to manage store and customer withdrawal requests
 * 
 * ⚠️ UPDATED: 26/11/2024 - Tách riêng Store vs Customer withdrawals
 */

/**
 * ================================================
 * STORE WITHDRAWAL MANAGEMENT
 * ================================================
 */

/**
 * 1. GET STORE WITHDRAWAL REQUESTS
 * GET /api/v1/admin/withdrawals/store
 */
export const getStoreWithdrawals = async (params = {}) => {
  try {
    const { page = 0, size = 10, status, sortBy = 'createdAt', sortDir = 'desc' } = params;
    
    console.log('🏪 Fetching store withdrawal requests:', { 
      page, 
      size, 
      status, 
      sortBy, 
      sortDir 
    });
    
    const response = await api.get('/api/v1/admin/withdrawals/store', {
      params: {
        page,
        size,
        sortBy,
        sortDir,
        ...(status && { status }),
      },
    });
    
    console.log('✅ Store withdrawal requests response:', response.data);
    
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ Error fetching store withdrawal requests:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tải danh sách yêu cầu rút tiền của cửa hàng',
    };
  }
};

/**
 * 2. APPROVE STORE WITHDRAWAL REQUEST
 * PUT /api/v1/admin/withdrawals/store/{requestId}/approve
 */
export const approveStoreWithdrawal = async (requestId, adminNote = '') => {
  try {
    console.log('✅ Approving store withdrawal:', { requestId, adminNote });
    
    const url = `/api/v1/admin/withdrawals/store/${requestId}/approve`;
    console.log('🔗 API URL:', url);
    
    // ⚠️ adminNote là QUERY PARAMETER, không phải body
    const response = await api.put(url, null, {
      params: adminNote ? { adminNote } : undefined,
    });
    
    console.log('✅ Store withdrawal approved:', response.data);
    
    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Đã duyệt yêu cầu rút tiền của cửa hàng',
    };
  } catch (error) {
    console.error('❌ Error approving store withdrawal:', error);
    console.error('❌ Error response:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || 'Không thể duyệt yêu cầu rút tiền',
    };
  }
};

/**
 * 3. REJECT STORE WITHDRAWAL REQUEST
 * PUT /api/v1/admin/withdrawals/store/{requestId}/reject
 */
export const rejectStoreWithdrawal = async (requestId, adminNote) => {
  try {
    console.log('❌ Rejecting store withdrawal:', { requestId, adminNote });
    
    // ⚠️ adminNote là QUERY PARAMETER, không phải body
    const response = await api.put(`/api/v1/admin/withdrawals/store/${requestId}/reject`, null, {
      params: {
        ...(adminNote && { adminNote }),
      },
    });
    
    console.log('✅ Store withdrawal rejected:', response.data);
    
    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Đã từ chối yêu cầu rút tiền của cửa hàng',
    };
  } catch (error) {
    console.error('❌ Error rejecting store withdrawal:', error);
    
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || 'Không thể từ chối yêu cầu rút tiền',
    };
  }
};

/**
 * ================================================
 * CUSTOMER WITHDRAWAL MANAGEMENT
 * ================================================
 */

/**
 * 4. GET CUSTOMER WITHDRAWAL REQUESTS
 * GET /api/v1/admin/withdrawals/customer
 */
export const getCustomerWithdrawals = async (params = {}) => {
  try {
    const { page = 0, size = 10, status, sortBy = 'createdAt', sortDir = 'desc' } = params;
    
    console.log('👥 Fetching customer withdrawal requests:', { 
      page, 
      size, 
      status, 
      sortBy, 
      sortDir 
    });
    
    const response = await api.get('/api/v1/admin/withdrawals/customer', {
      params: {
        page,
        size,
        sortBy,
        sortDir,
        ...(status && { status }),
      },
    });
    
    console.log('✅ Customer withdrawal requests response:', response.data);
    
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ Error fetching customer withdrawal requests:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tải danh sách yêu cầu rút tiền của khách hàng',
    };
  }
};

/**
 * 5. GET CUSTOMER WITHDRAWAL BY ID
 * GET /api/v1/admin/withdrawals/customer/{requestId}
 */
export const getCustomerWithdrawalById = async (requestId) => {
  try {
    console.log('👥 Fetching customer withdrawal by ID:', requestId);
    
    const response = await api.get(`/api/v1/admin/withdrawals/customer/${requestId}`);
    
    console.log('✅ Customer withdrawal detail:', response.data);
    
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ Error fetching customer withdrawal detail:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tải chi tiết yêu cầu rút tiền',
    };
  }
};

/**
 * 6. APPROVE CUSTOMER WITHDRAWAL REQUEST
 * PUT /api/v1/admin/withdrawals/customer/{requestId}/approve
 */
export const approveCustomerWithdrawal = async (requestId, adminNote = '') => {
  try {
    console.log('✅ Approving customer withdrawal:', { requestId, adminNote });
    
    // ⚠️ adminNote là QUERY PARAMETER, không phải body
    const response = await api.put(`/api/v1/admin/withdrawals/customer/${requestId}/approve`, null, {
      params: {
        ...(adminNote && { adminNote }),
      },
    });
    
    console.log('✅ Customer withdrawal approved:', response.data);
    
    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Đã duyệt yêu cầu rút tiền của khách hàng',
    };
  } catch (error) {
    console.error('❌ Error approving customer withdrawal:', error);
    
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || 'Không thể duyệt yêu cầu rút tiền',
    };
  }
};

/**
 * 7. REJECT CUSTOMER WITHDRAWAL REQUEST
 * PUT /api/v1/admin/withdrawals/customer/{requestId}/reject
 */
export const rejectCustomerWithdrawal = async (requestId, adminNote) => {
  try {
    console.log('❌ Rejecting customer withdrawal:', { requestId, adminNote });
    
    // ⚠️ adminNote là QUERY PARAMETER, không phải body
    const response = await api.put(`/api/v1/admin/withdrawals/customer/${requestId}/reject`, null, {
      params: {
        ...(adminNote && { adminNote }),
      },
    });
    
    console.log('✅ Customer withdrawal rejected:', response.data);
    
    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Đã từ chối yêu cầu rút tiền của khách hàng',
    };
  } catch (error) {
    console.error('❌ Error rejecting customer withdrawal:', error);
    
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || 'Không thể từ chối yêu cầu rút tiền',
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
    PENDING: { text: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
    APPROVED: { text: 'Đã duyệt', color: 'bg-green-100 text-green-800', icon: '✅' },
    REJECTED: { text: 'Từ chối', color: 'bg-red-100 text-red-800', icon: '❌' },
    COMPLETED: { text: 'Hoàn thành', color: 'bg-blue-100 text-blue-800', icon: '💰' },
  };
  
  return badges[status] || { text: status, color: 'bg-gray-100 text-gray-800', icon: '📝' };
};

export default {
  // Store Withdrawals
  getStoreWithdrawals,
  approveStoreWithdrawal,
  rejectStoreWithdrawal,
  
  // Customer Withdrawals
  getCustomerWithdrawals,
  getCustomerWithdrawalById,
  approveCustomerWithdrawal,
  rejectCustomerWithdrawal,
  
  // Helpers
  formatCurrency,
  getWithdrawalStatusBadge,
};
