import api from '../common/api';

/**
 * ================================================
 * B2C ANALYTICS SERVICE - THỐNG KÊ CỬA HÀNG B2C
 * ================================================
 * APIs for B2C store analytics and statistics
 */

/**
 * 1. LẤY DASHBOARD ANALYTICS (TỔNG QUAN)
 * GET /api/v1/b2c/analytics/dashboard/{storeId}
 */
export const getDashboardAnalytics = async (storeId) => {
  try {
    const response = await api.get(`/api/v1/b2c/analytics/dashboard/${storeId}`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    // ✅ API này có thể không tồn tại hoặc store không có quyền
    // Trả về success: false nhưng không log error để tránh spam console
    if (error.response?.status === 500 || error.response?.status === 404) {
      // API không tồn tại hoặc lỗi server - không hiển thị error
      return {
        success: false,
        error: null, // Không hiển thị error
        data: null,
      };
    }
    return {
      success: false,
      error: error.message || 'Không thể tải thống kê dashboard',
      data: null,
    };
  }
};

/**
 * 2. LẤY THỐNG KÊ DOANH THU
 * GET /api/v1/b2c/analytics/revenue/{storeId}
 */
export const getRevenueAnalytics = async (storeId) => {
  try {
    const response = await api.get(`/api/v1/b2c/analytics/revenue/${storeId}`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể tải thống kê doanh thu',
    };
  }
};

/**
 * 3. LẤY DOANH THU THEO KHOẢNG THỜI GIAN
 * GET /api/v1/b2c/analytics/revenue/{storeId}/date-range
 */
export const getRevenueByDateRange = async (storeId, startDate, endDate) => {
  try {
    const response = await api.get(`/api/v1/b2c/analytics/revenue/${storeId}/date-range`, {
      params: { startDate, endDate },
    });
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể tải doanh thu theo thời gian',
    };
  }
};

/**
 * 4. LẤY THỐNG KÊ ĐƠN HÀNG
 * GET /api/v1/b2c/analytics/orders/{storeId}
 */
export const getOrderAnalytics = async (storeId) => {
  try {
    const response = await api.get(`/api/v1/b2c/analytics/orders/${storeId}`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể tải thống kê đơn hàng',
    };
  }
};

/**
 * 5. LẤY THỐNG KÊ TRẠNG THÁI ĐƠN HÀNG
 * GET /api/v1/b2c/analytics/orders/{storeId}/status
 */
export const getOrderStatusAnalytics = async (storeId) => {
  try {
    const response = await api.get(`/api/v1/b2c/analytics/orders/${storeId}/status`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể tải thống kê trạng thái đơn hàng',
    };
  }
};

/**
 * 6. LẤY THỐNG KÊ SẢN PHẨM
 * GET /api/v1/b2c/analytics/products/{storeId}
 */
export const getProductAnalytics = async (storeId) => {
  try {
    const response = await api.get(`/api/v1/b2c/analytics/products/${storeId}`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể tải thống kê sản phẩm',
    };
  }
};

/**
 * 7. LẤY TOP SẢN PHẨM BÁN CHẠY
 * GET /api/v1/b2c/analytics/products/{storeId}/top
 */
export const getTopProducts = async (storeId, limit = 10) => {
  try {
    const response = await api.get(`/api/v1/b2c/analytics/products/${storeId}/top`, {
      params: { limit },
    });
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể tải sản phẩm bán chạy',
    };
  }
};

/**
 * 8. LẤY THỐNG KÊ KHÁCH HÀNG
 * GET /api/v1/b2c/analytics/customers/{storeId}
 */
export const getCustomerAnalytics = async (storeId) => {
  try {
    const response = await api.get(`/api/v1/b2c/analytics/customers/${storeId}`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể tải thống kê khách hàng',
    };
  }
};

/**
 * 9. LẤY TOP KHÁCH HÀNG
 * GET /api/v1/b2c/analytics/customers/{storeId}/top
 */
export const getTopCustomers = async (storeId, limit = 10) => {
  try {
    const response = await api.get(`/api/v1/b2c/analytics/customers/${storeId}/top`, {
      params: { limit },
    });
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể tải top khách hàng',
    };
  }
};

/**
 * 10. LẤY THỐNG KÊ TĂNG TRƯỞNG KHÁCH HÀNG
 * GET /api/v1/b2c/analytics/customers/{storeId}/growth
 */
export const getCustomerGrowth = async (storeId) => {
  try {
    const response = await api.get(`/api/v1/b2c/analytics/customers/${storeId}/growth`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể tải thống kê tăng trưởng',
    };
  }
};

/**
 * 11. LẤY THỐNG KÊ ĐÁNH GIÁ
 * GET /api/v1/b2c/analytics/reviews/{storeId}
 */
export const getReviewAnalytics = async (storeId) => {
  try {
    const response = await api.get(`/api/v1/b2c/analytics/reviews/${storeId}`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể tải thống kê đánh giá',
    };
  }
};

/**
 * 12. LẤY PHÂN BỐ ĐÁNH GIÁ
 * GET /api/v1/b2c/analytics/reviews/{storeId}/rating-distribution
 */
export const getRatingDistribution = async (storeId) => {
  try {
    const response = await api.get(`/api/v1/b2c/analytics/reviews/${storeId}/rating-distribution`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể tải phân bố đánh giá',
    };
  }
};

/**
 * 13. LẤY THỐNG KÊ TỒN KHO
 * GET /api/v1/b2c/analytics/inventory/{storeId}
 */
export const getInventoryAnalytics = async (storeId) => {
  try {
    const response = await api.get(`/api/v1/b2c/analytics/inventory/${storeId}`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    // ✅ API này có thể không tồn tại hoặc store không có quyền
    // Trả về success: false nhưng không log error để tránh spam console
    if (error.response?.status === 500 || error.response?.status === 404) {
      // API không tồn tại hoặc lỗi server - không hiển thị error
      return {
        success: false,
        error: null, // Không hiển thị error
        data: null,
      };
    }
    return {
      success: false,
      error: error.message || 'Không thể tải thống kê tồn kho',
    };
  }
};

/**
 * 14. LẤY XU HƯỚNG DOANH SỐ
 * GET /api/v1/b2c/analytics/sales/{storeId}/trend
 */
export const getSalesTrend = async (storeId, period = 'month') => {
  try {
    const response = await api.get(`/api/v1/b2c/analytics/sales/${storeId}/trend`, {
      params: { period },
    });
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể tải xu hướng doanh số',
    };
  }
};

/**
 * 15. LẤY DOANH SỐ THEO DANH MỤC
 * GET /api/v1/b2c/analytics/sales/{storeId}/category
 */
export const getSalesByCategory = async (storeId) => {
  try {
    const response = await api.get(`/api/v1/b2c/analytics/sales/${storeId}/category`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể tải doanh số theo danh mục',
    };
  }
};

/**
 * 16. LẤY HIỆU SUẤT TỔNG QUAN
 * GET /api/v1/b2c/analytics/performance/{storeId}
 */
export const getPerformanceMetrics = async (storeId) => {
  try {
    const response = await api.get(`/api/v1/b2c/analytics/performance/${storeId}`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Không thể tải hiệu suất',
    };
  }
};

export default {
  getDashboardAnalytics,
  getRevenueAnalytics,
  getRevenueByDateRange,
  getOrderAnalytics,
  getOrderStatusAnalytics,
  getProductAnalytics,
  getTopProducts,
  getCustomerAnalytics,
  getTopCustomers,
  getCustomerGrowth,
  getReviewAnalytics,
  getRatingDistribution,
  getInventoryAnalytics,
  getSalesTrend,
  getSalesByCategory,
  getPerformanceMetrics,
};

