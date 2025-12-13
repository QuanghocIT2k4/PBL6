import api from '../common/api';

/**
 * ================================================
 * SHOP STATISTICS SERVICE - VER 1.0 (27/11/2024)
 * ================================================
 * ✅ NEW: APIs thống kê cho cửa hàng (thay thế 2 API cũ)
 * 
 * Thay thế:
 * - ❌ /api/v1/b2c/orders/statistics?storeId={storeId}
 * - ❌ /api/v1/b2c/order/revenue?storeId={storeId}
 * 
 * APIs for shop owners to view revenue and order statistics
 */

// ===============================================
// 📊 SHOP STATISTICS API SERVICES
// ===============================================

/**
 * 1. GET OVERVIEW STATISTICS 📊
 * GET /api/v1/b2c/statistics/overview
 * 
 * Xem tổng quan thống kê shop
 */
export const getOverviewStatistics = async (storeId) => {
  try {
    if (!storeId) {
      throw new Error('storeId là bắt buộc');
    }

    console.log('📥 Fetching shop overview statistics for store:', storeId);

    const response = await api.get('/api/v1/b2c/statistics/overview', {
      params: { storeId },
    });

    console.log('✅ Shop overview statistics RAW:', response);
    console.log('✅ Shop overview statistics DATA:', response.data);
    console.log('✅ Shop overview statistics NESTED:', response.data?.data);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ Error fetching shop overview statistics:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tải thống kê tổng quan',
    };
  }
};

/**
 * 2. GET REVENUE CHART DATA 📈
 * GET /api/v1/b2c/statistics/revenue/chart-data
 * 
 * Xem dữ liệu biểu đồ doanh thu theo period
 */
export const getRevenueChartData = async (storeId, period = 'MONTH') => {
  try {
    if (!storeId) {
      throw new Error('storeId là bắt buộc');
    }

    console.log('📥 Fetching revenue chart data for store:', storeId, 'period:', period);

    const response = await api.get('/api/v1/b2c/statistics/revenue/chart-data', {
      params: { storeId, period },
    });

    console.log('✅ Revenue chart data:', response.data);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ Error fetching revenue chart data:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tải dữ liệu biểu đồ doanh thu',
    };
  }
};

/**
 * 3. GET ORDER COUNT BY STATUS 📋
 * GET /api/v1/b2c/statistics/orders/count-by-status
 * 
 * Xem số lượng đơn hàng theo trạng thái
 */
export const getOrderCountByStatus = async (storeId) => {
  try {
    if (!storeId) {
      throw new Error('storeId là bắt buộc');
    }

    console.log('📥 Fetching order count by status for store:', storeId);

    const response = await api.get('/api/v1/b2c/statistics/orders/count-by-status', {
      params: { storeId },
    });

    console.log('✅ Order count by status:', response.data);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ Error fetching order count by status:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tải thống kê đơn hàng theo trạng thái',
    };
  }
};

/**
 * 4. GET ORDERS CHART DATA 📊
 * GET /api/v1/b2c/statistics/orders/chart-data
 * 
 * Xem dữ liệu biểu đồ đơn hàng theo period
 */
export const getOrdersChartData = async (storeId, period = 'MONTH') => {
  try {
    if (!storeId) {
      throw new Error('storeId là bắt buộc');
    }

    console.log('📥 Fetching orders chart data for store:', storeId, 'period:', period);

    const response = await api.get('/api/v1/b2c/statistics/orders/chart-data', {
      params: { storeId, period },
    });

    console.log('✅ Orders chart data:', response.data);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ Error fetching orders chart data:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tải dữ liệu biểu đồ đơn hàng',
    };
  }
};

/**
 * 5. GET VARIANT COUNT BY STOCK STATUS 📦
 * GET /api/v1/b2c/statistics/variant/count-by-stock-status
 * 
 * Xem số lượng variant theo trạng thái stock
 */
export const getVariantCountByStockStatus = async (storeId) => {
  try {
    if (!storeId) {
      throw new Error('storeId là bắt buộc');
    }

    console.log('📥 Fetching variant count by stock status for store:', storeId);

    const response = await api.get('/api/v1/b2c/statistics/variant/count-by-stock-status', {
      params: { storeId },
    });

    console.log('✅ Variant count by stock status:', response.data);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ Error fetching variant count by stock status:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tải thống kê variant theo stock',
    };
  }
};

/**
 * 6. GET PRODUCTS SOLD CHART DATA 📊
 * GET /api/v1/b2c/statistics/products/chart-data
 * 
 * Xem dữ liệu biểu đồ sản phẩm bán được theo period
 * (Nếu API chưa có, sẽ thử dùng API tương tự hoặc tính từ orders)
 */
export const getProductsSoldChartData = async (storeId, period = 'MONTH') => {
  try {
    if (!storeId) {
      throw new Error('storeId là bắt buộc');
    }

    console.log('📥 Fetching products sold chart data for store:', storeId, 'period:', period);

    // Thử gọi API mới (nếu có)
    try {
      const response = await api.get('/api/v1/b2c/statistics/products/chart-data', {
        params: { storeId, period },
      });

      console.log('✅ Products sold chart data:', response.data);

      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (apiError) {
      // Nếu API chưa có, thử dùng API khác hoặc trả về empty
      console.warn('⚠️ Products chart API not available, trying alternative...');
      
      // Có thể tính từ orders nếu cần
      // Hoặc trả về empty data để hiển thị "Chưa có dữ liệu"
      return {
        success: false,
        error: 'API chưa được implement',
        data: null,
      };
    }
  } catch (error) {
    console.error('❌ Error fetching products sold chart data:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tải dữ liệu biểu đồ sản phẩm bán được',
      data: null,
    };
  }
};

// ===============================================
// 🛠️ HELPER FUNCTIONS
// ===============================================

/**
 * Format currency VND
 */
export const formatCurrency = (amount) => {
  if (amount == null) return '0₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
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

/**
 * Get order status badge
 */
export const getOrderStatusBadge = (status) => {
  const badges = {
    PENDING: {
      text: 'Chờ xác nhận',
      color: 'yellow',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      icon: '⏳',
    },
    CONFIRMED: {
      text: 'Đã xác nhận',
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      icon: '✅',
    },
    SHIPPING: {
      text: 'Đang giao',
      color: 'purple',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-800',
      icon: '🚚',
    },
    DELIVERED: {
      text: 'Đã giao',
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      icon: '📦',
    },
    CANCELLED: {
      text: 'Đã hủy',
      color: 'red',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      icon: '❌',
    },
  };

  return badges[status] || {
    text: status,
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    icon: '📋',
  };
};

/**
 * Get stock status badge
 */
export const getStockStatusBadge = (status) => {
  const badges = {
    IN_STOCK: {
      text: 'Còn hàng',
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      icon: '✅',
    },
    LOW_STOCK: {
      text: 'Sắp hết',
      color: 'yellow',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      icon: '⚠️',
    },
    OUT_OF_STOCK: {
      text: 'Hết hàng',
      color: 'red',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      icon: '❌',
    },
  };

  return badges[status] || {
    text: status,
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    icon: '📦',
  };
};

/**
 * Format number with K, M suffix
 */
export const formatNumber = (num) => {
  if (num == null) return '0';
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Calculate percentage change
 */
export const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Get percentage change color and icon
 */
export const getPercentageChangeDisplay = (percentage) => {
  if (percentage > 0) {
    return {
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      icon: '📈',
      text: `+${percentage.toFixed(1)}%`,
    };
  } else if (percentage < 0) {
    return {
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      icon: '📉',
      text: `${percentage.toFixed(1)}%`,
    };
  } else {
    return {
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      icon: '➡️',
      text: '0%',
    };
  }
};
