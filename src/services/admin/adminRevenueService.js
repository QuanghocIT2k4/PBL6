import api from '../common/api';

/**
 * ADMIN REVENUE SERVICE
 * APIs for managing platform service fees and revenue
 * 
 * Service Fee: 5000đ per order
 * - PENDING: Order chưa giao (chưa thu phí)
 * - COLLECTED: Order đã giao (đã thu phí)
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
 * 2. GET PENDING SERVICE FEES 🟡
 * GET /api/v1/admin/revenues/pending
 * 
 * Xem danh sách phí dịch vụ chưa thu (orders chưa giao)
 */
export const getPendingRevenue = async (params = {}) => {
  try {
    const {
      page = 0,
      size = 10,
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = params;

    console.log('📥 Fetching pending revenues:', { page, size, sortBy, sortDir });

    const response = await api.get('/api/v1/admin/revenues/pending', {
      params: { page, size, sortBy, sortDir },
    });

    console.log('✅ Pending revenues:', response.data);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ Error fetching pending revenues:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tải danh sách revenue chờ thu',
    };
  }
};

/**
 * 3. GET COLLECTED SERVICE FEES ✅
 * GET /api/v1/admin/revenues/collected
 * 
 * Xem danh sách phí dịch vụ đã thu (orders đã giao)
 */
export const getCollectedRevenue = async (params = {}) => {
  try {
    const {
      page = 0,
      size = 10,
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = params;

    console.log('📥 Fetching collected revenues:', { page, size, sortBy, sortDir });

    const response = await api.get('/api/v1/admin/revenues/collected', {
      params: { page, size, sortBy, sortDir },
    });

    console.log('✅ Collected revenues:', response.data);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ Error fetching collected revenues:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tải danh sách revenue đã thu',
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
 * Xem tất cả phí dịch vụ, có thể lọc theo status
 * @param {string} status - Optional: 'PENDING' hoặc 'COLLECTED', null = tất cả
 */
export const getAllRevenues = async (params = {}) => {
  try {
    const {
      page = 0,
      size = 10,
      status = null, // PENDING, COLLECTED, or null for all
    } = params;

    console.log('📥 Fetching all revenues:', { page, size, status });

    const response = await api.get('/api/v1/admin/revenues', {
      params: { 
        page, 
        size, 
        ...(status && { status }) 
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
