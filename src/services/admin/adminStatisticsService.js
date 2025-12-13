import api from '../common/api';

/**
 * ================================================
 * ADMIN STATISTICS SERVICE - VER 2.0 (27/11/2024)
 * ================================================
 * ✅ UPDATED: Đổi endpoint từ /admin/revenues → /admin/statistics
 * ✅ NEW: Thêm API getOverviewStatistics()
 * 
 * APIs for managing platform revenue and statistics
 * 
 * Revenue Types:
 * - SERVICE_FEE: Phí dịch vụ (5000đ/order) - Thu từ shop
 * - PLATFORM_DISCOUNT_LOSS: Tiền lỗ giảm giá sàn - Sàn chịu
 * 
 * Net Revenue = SERVICE_FEE - PLATFORM_DISCOUNT_LOSS
 */

// ===============================================
// 📊 STATISTICS API SERVICES
// ===============================================

/**
 * 1. GET OVERVIEW STATISTICS ⭐ NEW
 * GET /api/v1/admin/statistics/overview
 * 
 * Xem tổng quan thống kê admin
 */
export const getOverviewStatistics = async () => {
  try {
    const response = await api.get('/api/v1/admin/statistics/overview');

    // Handle different response structures
    let data = response.data;
    
    // If response has nested data
    if (data.data) {
      data = data.data;
    }
    
    // If response has success wrapper
    if (data.success && data.data) {
      data = data.data;
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tải thống kê tổng quan',
    };
  }
};

/**
 * 2. GET SERVICE FEES 💰
 * GET /api/v1/admin/statistics/service-fees
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

    const response = await api.get('/api/v1/admin/statistics/service-fees', {
      params: { page, size, sortBy, sortDir },
    });

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
 * 3. GET REVENUE STATISTICS 📊
 * GET /api/v1/admin/statistics/revenue
 * 
 * Xem thống kê tổng doanh thu: tổng phí dịch vụ và tổng tiền lỗ
 */
export const getRevenueStatistics = async () => {
  try {
    console.log('📥 Fetching revenue statistics');

    const response = await api.get('/api/v1/admin/statistics/revenue');

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
 * 4. GET PLATFORM DISCOUNT LOSSES 📉
 * GET /api/v1/admin/statistics/platform-discount-losses
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

    const response = await api.get('/api/v1/admin/statistics/platform-discount-losses', {
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
 * 5. GET REVENUE BY DATE RANGE 📅
 * GET /api/v1/admin/statistics/date-range
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

    const response = await api.get('/api/v1/admin/statistics/date-range', {
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
 * 6. GET REVENUE CHART DATA 📈
 * GET /api/v1/admin/statistics/chart-data
 * 
 * Xem dữ liệu biểu đồ doanh thu theo period
 * @param {string} period - WEEK, MONTH, hoặc YEAR
 */
export const getRevenueChartData = async (period = 'MONTH') => {
  try {
    if (!period) {
      throw new Error('period là bắt buộc (WEEK, MONTH, hoặc YEAR)');
    }

    console.log('📥 [getRevenueChartData] Fetching với period:', period);
    const response = await api.get('/api/v1/admin/statistics/chart-data', {
      params: { period },
    });

    console.log('📥 [getRevenueChartData] Raw response:', response);
    console.log('📥 [getRevenueChartData] response.data:', response.data);

    // Handle different response structures
    let chartData = response.data;
    if (chartData.data) {
      console.log('📥 [getRevenueChartData] Found nested data.data');
      chartData = chartData.data;
    }
    
    // Log structure để debug
    console.log('📥 [getRevenueChartData] chartData structure:', {
      isArray: Array.isArray(chartData),
      type: typeof chartData,
      keys: chartData && typeof chartData === 'object' ? Object.keys(chartData) : 'N/A',
      value: chartData
    });
    
    // Ensure it's an array
    if (!Array.isArray(chartData)) {
      console.log('📥 [getRevenueChartData] chartData is not array, type:', typeof chartData);
      // If it's an object with array property, extract it
      if (chartData.chartData && Array.isArray(chartData.chartData)) {
        console.log('📥 [getRevenueChartData] Found chartData.chartData array');
        chartData = chartData.chartData;
      } else if (chartData.items && Array.isArray(chartData.items)) {
        console.log('📥 [getRevenueChartData] Found chartData.items array');
        chartData = chartData.items;
      } else if (chartData.content && Array.isArray(chartData.content)) {
        console.log('📥 [getRevenueChartData] Found chartData.content array');
        chartData = chartData.content;
      } else if (chartData.data && Array.isArray(chartData.data)) {
        console.log('📥 [getRevenueChartData] Found chartData.data array');
        chartData = chartData.data;
      } else if (chartData.values && Array.isArray(chartData.values)) {
        console.log('📥 [getRevenueChartData] Found chartData.values array');
        chartData = chartData.values;
      } else {
        console.log('📥 [getRevenueChartData] Object keys:', Object.keys(chartData || {}));
        console.log('📥 [getRevenueChartData] Wrapping single object in array');
        // If it's a single object, wrap it in array
        chartData = [chartData];
      }
    }

    console.log('✅ [getRevenueChartData] Final chartData:', chartData);
    return {
      success: true,
      data: chartData,
    };
  } catch (error) {
    console.error('❌ [getRevenueChartData] Error:', error);
    console.error('❌ [getRevenueChartData] Error response:', error.response);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tải dữ liệu biểu đồ',
    };
  }
};

// ===============================================
// 🛠️ HELPER FUNCTIONS
// ===============================================

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

/**
 * Get period label in Vietnamese
 */
export const getPeriodLabel = (period) => {
  const labels = {
    WEEK: 'Tuần',
    MONTH: 'Tháng',
    YEAR: 'Năm',
  };
  return labels[period] || period;
};
