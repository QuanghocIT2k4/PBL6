import api from '../common/api';

/**
 * ADMIN WALLET SERVICE
 * APIs for admin to manage all store wallets and withdrawal requests
 */

/**
 * 1. GET ALL WITHDRAWAL REQUESTS
 * GET /api/v1/admin/withdrawals
 */
export const getAllWithdrawalRequests = async (params = {}) => {
  try {
    const { page = 0, size = 10, status, sortBy = 'createdAt', sortDir = 'desc' } = params;
    
    console.log('📥 Fetching all withdrawal requests:', { 
      page, 
      size, 
      status, 
      sortBy, 
      sortDir 
    });
    
    const response = await api.get('/api/v1/admin/withdrawals', {
      params: {
        page,
        size,
        sortBy,
        sortDir,
        ...(status && { status }),
      },
    });
    
    console.log('✅ All withdrawal requests response:', response.data);
    
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
 * 2. APPROVE WITHDRAWAL REQUEST
 * PUT /api/v1/admin/withdrawals/{withdrawalId}/approve
 * Approve withdrawal request after verification
 */
export const approveWithdrawal = async (withdrawalId, note = '') => {
  try {
    console.log('✅ Approving withdrawal:', { withdrawalId, note });
    
    const response = await api.put(`/api/v1/admin/withdrawals/${withdrawalId}/approve`, {
      note,
    });
    
    console.log('✅ Withdrawal approved:', response.data);
    
    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Đã duyệt yêu cầu rút tiền',
    };
  } catch (error) {
    console.error('❌ Error approving withdrawal:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể duyệt yêu cầu rút tiền',
    };
  }
};

/**
 * 3. COMPLETE WITHDRAWAL REQUEST
 * PUT /api/v1/admin/withdrawals/{withdrawalId}/complete
 * Mark withdrawal as completed after money transfer (auto-deducts from wallet)
 */
export const completeWithdrawal = async (withdrawalId, adminNote = '') => {
  try {
    console.log('💰 Completing withdrawal:', { withdrawalId, adminNote });
    
    const response = await api.put(
      `/api/v1/admin/withdrawals/${withdrawalId}/complete`,
      null,
      { params: { adminNote } }
    );
    
    console.log('✅ Withdrawal completed:', response.data);
    
    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Đã hoàn tất chuyển tiền',
    };
  } catch (error) {
    console.error('❌ Error completing withdrawal:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể hoàn tất rút tiền',
    };
  }
};

/**
 * 4. REJECT WITHDRAWAL REQUEST
 * PUT /api/v1/admin/withdrawals/{withdrawalId}/reject
 */
export const rejectWithdrawal = async (withdrawalId, reason) => {
  try {
    console.log('❌ Rejecting withdrawal:', { withdrawalId, reason });
    
    const response = await api.put(`/api/v1/admin/withdrawals/${withdrawalId}/reject`, {
      reason,
    });
    
    console.log('✅ Withdrawal rejected:', response.data);
    
    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Đã từ chối yêu cầu rút tiền',
    };
  } catch (error) {
    console.error('❌ Error rejecting withdrawal:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể từ chối yêu cầu rút tiền',
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
  getAllWithdrawalRequests,
  completeWithdrawal,
  rejectWithdrawal,
  formatCurrency,
  getWithdrawalStatusBadge,
};
