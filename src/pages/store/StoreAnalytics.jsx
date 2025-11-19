import React, { useState, useEffect } from 'react';
import StoreLayout from '../../layouts/StoreLayout';
import StoreStatusGuard from '../../components/store/StoreStatusGuard';
import { useStoreContext } from '../../context/StoreContext';
import { getStoreOrders } from '../../services/b2c/b2cOrderService';
import { getProductsByStore } from '../../services/b2c/b2cProductService';
import { 
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
} from '../../services/b2c/b2cAnalyticsService';

const StoreAnalytics = () => {
  const { currentStore, loading: storeLoading } = useStoreContext();
  const [timeRange, setTimeRange] = useState('30days');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch real analytics data from backend
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!currentStore?.id) return;
      
      setLoading(true);
      try {
        console.log('📊 Calculating analytics for store:', currentStore.id);
        
        // ⚠️ Backend analytics APIs toàn lỗi 500 → Skip và tính trực tiếp từ orders/products
        console.warn('⚠️ Skipping analytics APIs (all return 500), calculating from orders/products...');
        
        // Calculate analytics from orders and products
        const [ordersResult, productsResult] = await Promise.all([
          getStoreOrders({ storeId: currentStore.id, page: 0, size: 1000 }),
          getProductsByStore(currentStore.id, { page: 0, size: 1000 }),
        ]);
        
        if (ordersResult.success && ordersResult.data) {
          const orders = ordersResult.data.content || ordersResult.data;
          const products = productsResult.success ? (productsResult.data.content || productsResult.data) : [];
          
          // Calculate order status
          const orderStatus = {
            pending: orders.filter(o => o.status === 'PENDING').length,
            processing: orders.filter(o => o.status === 'PROCESSING').length,
            shipped: orders.filter(o => o.status === 'SHIPPED').length,
            delivered: orders.filter(o => o.status === 'DELIVERED').length,
            cancelled: orders.filter(o => o.status === 'CANCELLED').length,
          };
          
          // Calculate revenue
          const totalRevenue = orders
            .filter(o => o.status === 'DELIVERED')
            .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
          
          // Calculate products stats
          const productsStats = {
            total: products.length,
            active: products.filter(p => p.status === 'APPROVED').length,
            inactive: products.filter(p => p.status !== 'APPROVED').length,
            topSelling: [],
          };
          
          setAnalyticsData({
            revenue: { total: totalRevenue, growth: 0, chart: [] },
            orders: { total: orders.length, growth: 0, chart: [] },
            orderStatus,
            products: productsStats,
            customers: { total: 0, new: 0, returning: 0, chart: [] },
            topCustomers: [],
            customerGrowth: { growth: 0, chart: [] },
            reviews: { total: 0, average: 0, chart: [] },
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            inventory: { total: productsStats.total, lowStock: 0, outOfStock: 0 },
            salesTrend: { chart: [] },
            salesByCategory: [],
            performance: { conversionRate: 0, avgOrderValue: totalRevenue / (orders.length || 1), customerLifetimeValue: 0 },
          });
          
          console.log('✅ Analytics calculated from orders/products');
        } else {
          // Set empty data if calculation fails
          setAnalyticsData({
            revenue: { total: 0, growth: 0, chart: [] },
            orders: { total: 0, growth: 0, chart: [] },
            orderStatus: { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 },
            products: { total: 0, active: 0, inactive: 0, topSelling: [] },
            customers: { total: 0, new: 0, returning: 0, chart: [] },
            topCustomers: [],
            customerGrowth: { growth: 0, chart: [] },
            reviews: { total: 0, average: 0, chart: [] },
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            inventory: { total: 0, lowStock: 0, outOfStock: 0 },
            salesTrend: { chart: [] },
            salesByCategory: [],
            performance: { conversionRate: 0, avgOrderValue: 0, customerLifetimeValue: 0 },
          });
        }
      } catch (error) {
        console.error('❌ Error fetching analytics:', error);
        // Set empty data instead of mock
        setAnalyticsData({
          revenue: { total: 0, growth: 0, chart: [] },
          orders: { total: 0, growth: 0, chart: [] },
          orderStatus: { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 },
          products: { total: 0, active: 0, inactive: 0, topSelling: [] },
          customers: { total: 0, new: 0, returning: 0, chart: [] },
          topCustomers: [],
          customerGrowth: { growth: 0, chart: [] },
          reviews: { total: 0, average: 0, chart: [] },
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          inventory: { total: 0, lowStock: 0, outOfStock: 0 },
          salesTrend: { chart: [] },
          salesByCategory: [],
          performance: { conversionRate: 0, avgOrderValue: 0, customerLifetimeValue: 0 },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [currentStore?.id, timeRange]);

  // Use only real data from backend
  const displayData = analyticsData;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  // Show loading state
  if (loading && !displayData) {
    return (
      <StoreStatusGuard currentStore={currentStore} pageName="phân tích dữ liệu" loading={storeLoading}>
        <StoreLayout>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Đang tải dữ liệu phân tích...</p>
            </div>
          </div>
        </StoreLayout>
      </StoreStatusGuard>
    );
  }

  return (
    <StoreStatusGuard currentStore={currentStore} pageName="phân tích dữ liệu" loading={storeLoading}>
      <StoreLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-cyan-200 to-blue-200 rounded-2xl p-6">
              <div className="relative bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-xl flex items-center justify-center">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold">
                        <span className="text-cyan-600">Phân tích</span> <span className="text-blue-600">dữ liệu</span>
                      </h1>
                      <p className="text-gray-600 mt-1">Thống kê và báo cáo chi tiết</p>
                    </div>
                  </div>
                  {currentStore?.status && (
                    <div className={`px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 ${
                      currentStore.status === 'APPROVED' ? 'bg-green-100 text-green-800 border-2 border-green-300' :
                      currentStore.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300' :
                      'bg-red-100 text-red-800 border-2 border-red-300'
                    }`}>
                      <span className="text-lg">
                        {currentStore.status === 'APPROVED' ? '✅' :
                         currentStore.status === 'PENDING' ? '⏳' : '❌'}
                      </span>
                      <span>
                        {currentStore.status === 'APPROVED' ? 'Đã duyệt' :
                         currentStore.status === 'PENDING' ? 'Chờ duyệt' : 'Đã từ chối'}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
                  <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
                        <p className="text-xl font-bold text-gray-900">{formatPrice(displayData?.revenue?.total || 0)}</p>
                        <p className="text-xs text-green-600">+{displayData?.revenue?.growth || 0}% so với tháng trước</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Tổng đơn hàng</p>
                        <p className="text-xl font-bold text-gray-900">{formatNumber(displayData?.orders?.total || 0)}</p>
                        <p className="text-xs text-blue-600">+{displayData?.orders?.growth || 0}% so với tháng trước</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Sản phẩm</p>
                        <p className="text-xl font-bold text-gray-900">{formatNumber(displayData?.products?.total || 0)}</p>
                        <p className="text-xs text-purple-600">{formatNumber(displayData?.products?.active || 0)} đang bán</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Khách hàng</p>
                        <p className="text-xl font-bold text-gray-900">{formatNumber(displayData?.customers?.total || 0)}</p>
                        <p className="text-xs text-orange-600">{formatNumber(displayData?.customers?.new || 0)} mới</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Doanh thu theo tháng</h3>
              <div className="h-64 flex items-end justify-between gap-2">
                {(displayData?.revenue?.chart || []).map((item, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div
                      className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t"
                      style={{ height: `${displayData?.revenue?.chart?.length > 0 ? (item.revenue / Math.max(...displayData.revenue.chart.map(c => c.revenue))) * 200 : 0}px` }}
                    ></div>
                    <span className="text-xs text-gray-500 mt-2">{item.month}</span>
                    <span className="text-xs text-gray-700 font-medium">{formatPrice(item.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Orders Chart */}
            <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Đơn hàng theo tháng</h3>
              <div className="h-64 flex items-end justify-between gap-2">
                {(displayData?.orders?.chart || []).map((item, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                      style={{ height: `${displayData?.orders?.chart?.length > 0 ? (item.orders / Math.max(...displayData.orders.chart.map(c => c.orders))) * 200 : 0}px` }}
                    ></div>
                    <span className="text-xs text-gray-500 mt-2">{item.month}</span>
                    <span className="text-xs text-gray-700 font-medium">{formatNumber(item.orders)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Status & Inventory */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Status */}
            <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📦 Trạng thái đơn hàng</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⏳</span>
                    <span className="font-medium text-gray-700">Chờ xử lý</span>
                  </div>
                  <span className="text-lg font-bold text-yellow-600">{formatNumber(displayData?.orderStatus?.pending || 0)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔄</span>
                    <span className="font-medium text-gray-700">Đang xử lý</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{formatNumber(displayData?.orderStatus?.processing || 0)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🚚</span>
                    <span className="font-medium text-gray-700">Đang giao</span>
                  </div>
                  <span className="text-lg font-bold text-purple-600">{formatNumber(displayData?.orderStatus?.shipped || 0)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✅</span>
                    <span className="font-medium text-gray-700">Đã giao</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">{formatNumber(displayData?.orderStatus?.delivered || 0)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">❌</span>
                    <span className="font-medium text-gray-700">Đã hủy</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">{formatNumber(displayData?.orderStatus?.cancelled || 0)}</span>
                </div>
              </div>
            </div>

            {/* Inventory Status */}
            <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📦 Tình trạng kho</h3>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Tổng sản phẩm</span>
                    <span className="text-2xl font-bold text-green-600">{formatNumber(displayData?.inventory?.total || 0)}</span>
                  </div>
                  <div className="h-2 bg-green-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: '100%' }}></div>
                  </div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">⚠️ Sắp hết hàng</span>
                    <span className="text-2xl font-bold text-yellow-600">{formatNumber(displayData?.inventory?.lowStock || 0)}</span>
                  </div>
                  <div className="h-2 bg-yellow-200 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500" style={{ 
                      width: `${displayData?.inventory?.total > 0 ? (displayData.inventory.lowStock / displayData.inventory.total) * 100 : 0}%` 
                    }}></div>
                  </div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">🚫 Hết hàng</span>
                    <span className="text-2xl font-bold text-red-600">{formatNumber(displayData?.inventory?.outOfStock || 0)}</span>
                  </div>
                  <div className="h-2 bg-red-200 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500" style={{ 
                      width: `${displayData?.inventory?.total > 0 ? (displayData.inventory.outOfStock / displayData.inventory.total) * 100 : 0}%` 
                    }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews & Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Reviews */}
            <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⭐ Đánh giá</h3>
              <div className="flex items-center gap-6 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-yellow-500">{displayData?.reviews?.average?.toFixed(1) || '0.0'}</div>
                  <div className="text-sm text-gray-500 mt-1">{formatNumber(displayData?.reviews?.total || 0)} đánh giá</div>
                </div>
                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = displayData?.ratingDistribution?.[star] || 0;
                    const total = Object.values(displayData?.ratingDistribution || {}).reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 w-12">{star} ⭐</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400" style={{ width: `${percentage}%` }}></div>
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Hiệu suất</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Tỷ lệ chuyển đổi</span>
                    <span className="text-2xl font-bold text-blue-600">{displayData?.performance?.conversionRate?.toFixed(1) || '0.0'}%</span>
                  </div>
                  <div className="mt-2 h-2 bg-blue-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${displayData?.performance?.conversionRate || 0}%` }}></div>
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Giá trị đơn TB</span>
                    <span className="text-xl font-bold text-green-600">{formatPrice(displayData?.performance?.avgOrderValue || 0)}</span>
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">CLV khách hàng</span>
                    <span className="text-xl font-bold text-purple-600">{formatPrice(displayData?.performance?.customerLifetimeValue || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Customers */}
          <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Khách hàng hàng đầu</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(displayData?.topCustomers || []).map((customer, index) => (
                <div key={index} className="p-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-orange-600">#{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{customer.name || 'Khách hàng'}</p>
                      <p className="text-sm text-gray-500">{formatNumber(customer.orders || 0)} đơn hàng</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-orange-600">{formatPrice(customer.totalSpent || 0)}</p>
                  </div>
                </div>
              ))}
              {(!displayData?.topCustomers || displayData.topCustomers.length === 0) && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  Chưa có dữ liệu khách hàng
                </div>
              )}
            </div>
          </div>

          {/* Top Selling Products */}
          <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sản phẩm bán chạy</h3>
            <div className="space-y-4">
              {(displayData?.products?.topSelling || []).map((product, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-green-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{formatNumber(product.sales)} sản phẩm đã bán</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatPrice(product.revenue)}</p>
                    <p className="text-sm text-gray-500">Doanh thu</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </StoreLayout>
    </StoreStatusGuard>
  );
};

export default StoreAnalytics;