import api from '../common/api';

/**
 * ADMIN REVENUE SERVICE - VER 1.0
 * APIs for managing platform revenue
 * 
 * Revenue Types:
 * - SERVICE_FEE: Phí dịch vụ (5000đ/order) - Thu từ shop
 * - PLATFORM_DISCOUNT_LOSS: Tiền lỗ giảm giá sàn - Sàn chịu
 * 
 * Net Revenue = SERVICE_FEE - PLATFORM_DISCOUNT_LOSS
 * 
 * Changes:
 * - Removed: status field (PENDING/COLLECTED)
 * - Renamed: serviceFees → amount
 * - Added: revenueType filter
 * - Added: order & shop info in response
 */

/**
 * 1. GET REVENUE STATISTICS ⭐
 * GET /api/v1/admin/revenues/statistics
 * 
 * Xem thống kê tổng doanh thu: tổng cộng, đã thu, chưa thu
 */
export const getRevenueStatistics = async () => {
  try {
    console.log('📥 Fetching revenue statistics');

    const response = await api.get('/api/v1/admin/revenues/statistics');

    console.log('✅ Revenue statistics:', response.data);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ Error fetching revenue statistics:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tải thống kê revenue',
    };
  }
};

/**
 * 2. GET SERVICE FEES 💰
 * GET /api/v1/admin/revenues/service-fees
 * 
 * Xem danh sách phí dịch vụ (SERVICE_FEE)
 */
export const getServiceFees = async (params = {}) => {
  try {
    const {
      page = 0,
      size = 10,
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = params;

    console.log('📥 Fetching service fees:', { page, size, sortBy, sortDir });

    const response = await api.get('/api/v1/admin/revenues/service-fees', {
      params: { page, size, sortBy, sortDir },
    });

    console.log('✅ Service fees:', response.data);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ Error fetching service fees:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tải danh sách phí dịch vụ',
    };
  }
};

/**
 * 3. GET PLATFORM DISCOUNT LOSSES 📉
 * GET /api/v1/admin/revenues/platform-discount-losses
 * 
 * Xem danh sách tiền lỗ từ giảm giá sàn (PLATFORM_DISCOUNT_LOSS)
 */
export const getPlatformDiscountLosses = async (params = {}) => {
  try {
    const {
      page = 0,
      size = 10,
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = params;

    console.log('📥 Fetching platform discount losses:', { page, size, sortBy, sortDir });

    const response = await api.get('/api/v1/admin/revenues/platform-discount-losses', {
      params: { page, size, sortBy, sortDir },
    });

    console.log('✅ Platform discount losses:', response.data);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ Error fetching platform discount losses:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tải danh sách tiền lỗ giảm giá',
    };
  }
};

/**
 * 4. GET REVENUE BY DATE RANGE 📅
 * GET /api/v1/admin/revenues/date-range
 * 
 * Xem phí dịch vụ trong khoảng thời gian cụ thể
 * @param {string} startDate - Format: yyyy-MM-dd (VD: 2025-11-01)
 * @param {string} endDate - Format: yyyy-MM-dd (VD: 2025-11-30)
 */
export const getRevenueByDateRange = async (params = {}) => {
  try {
    const {
      startDate, // Required: yyyy-MM-dd
      endDate,   // Required: yyyy-MM-dd
      page = 0,
      size = 10,
    } = params;

    if (!startDate || !endDate) {
      throw new Error('startDate và endDate là bắt buộc (format: yyyy-MM-dd)');
    }

    console.log('📥 Fetching revenues by date range:', { startDate, endDate, page, size });

    const response = await api.get('/api/v1/admin/revenues/date-range', {
      params: { startDate, endDate, page, size },
    });

    console.log('✅ Revenues by date range:', response.data);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ Error fetching revenues by date range:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tải revenue theo khoảng thời gian',
    };
  }
};

/**
 * 5. GET ALL REVENUES 🔍
 * GET /api/v1/admin/revenues
 * 
 * Xem tất cả revenues, có thể lọc theo revenueType
 * @param {string} revenueType - Optional: 'SERVICE_FEE' hoặc 'PLATFORM_DISCOUNT_LOSS', null = tất cả
 */
export const getAllRevenues = async (params = {}) => {
  try {
    const {
      page = 0,
      size = 10,
      revenueType = null, // SERVICE_FEE, PLATFORM_DISCOUNT_LOSS, or null for all
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = params;

    console.log('📥 Fetching all revenues:', { page, size, revenueType });

    const response = await api.get('/api/v1/admin/revenues', {
      params: { 
        page, 
        size,
        sortBy,
        sortDir,
        ...(revenueType && { revenueType }) 
      },
    });

    console.log('✅ All revenues:', response.data);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ Error fetching all revenues:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tải danh sách revenue',
    };
  }
};

/**
 * HELPER FUNCTIONS
 */

/**
 * Get revenue type badge
 */
export const getRevenueTypeBadge = (revenueType) => {
  const badges = {
    SERVICE_FEE: {
      text: 'Phí dịch vụ',
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      icon: '💰',
    },
    PLATFORM_DISCOUNT_LOSS: {
      text: 'Tiền lỗ giảm giá',
      color: 'red',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      icon: '📉',
    },
  };

  return badges[revenueType] || {
    text: revenueType,
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    icon: '📊',
  };
};

/**
 * Format currency VND
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

/**
 * Format date to yyyy-MM-dd for API
 */
export const formatDateForAPI = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get date range for common periods
 */
export const getDateRange = (period) => {
  const today = new Date();
  const endDate = formatDateForAPI(today);
  let startDate;

  switch (period) {
    case 'today':
      startDate = endDate;
      break;
    case 'week':
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      startDate = formatDateForAPI(weekAgo);
      break;
    case 'month':
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);
      startDate = formatDateForAPI(monthAgo);
      break;
    case 'year':
      const yearAgo = new Date(today);
      yearAgo.setFullYear(today.getFullYear() - 1);
      startDate = formatDateForAPI(yearAgo);
      break;
    default:
      startDate = endDate;
  }

  return { startDate, endDate };
};
