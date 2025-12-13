import React, { useState, useEffect } from 'react';
import StoreLayout from '../../layouts/StoreLayout';
import StoreStatusGuard from '../../components/store/StoreStatusGuard';
import { useStoreContext } from '../../context/StoreContext';
import { getStoreOrders } from '../../services/b2c/b2cOrderService';
import { getProductsByStore } from '../../services/b2c/b2cProductService';
// ✅ NEW: Dùng Shop Statistics Service (27/11/2024)
import {
  getOverviewStatistics,
  getRevenueChartData,
  getOrderCountByStatus,
  getOrdersChartData,
  getVariantCountByStockStatus,
  formatCurrency,
  getPeriodLabel,
  getOrderStatusBadge,
  getStockStatusBadge,
  formatNumber,
  calculatePercentageChange,
  getPercentageChangeDisplay,
} from '../../services/b2c/shopStatisticsService';

// ❌ OLD: b2cAnalyticsService (17 APIs - nhiều lỗi 500)
// import { 
//   getDashboardAnalytics,
//   getRevenueAnalytics,
//   ...
// } from '../../services/b2c/b2cAnalyticsService';

const StoreAnalytics = () => {
  const { currentStore, loading: storeLoading } = useStoreContext();
  const [timeRange, setTimeRange] = useState('30days');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingWeekChart, setLoadingWeekChart] = useState(false);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [chartModeMonth, setChartModeMonth] = useState('revenue'); // revenue | orders
  const [chartModeWeek, setChartModeWeek] = useState('revenue'); // revenue | orders

  // Helper: Add timeout to API calls
  const withTimeout = (promise, timeoutMs = 10000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
      )
    ]);
  };

  // Fetch analytics data using new Shop Statistics APIs
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!currentStore?.id) return;
      
      setLoading(true);
      try {
        console.log('📊 Fetching analytics using new Shop Statistics APIs for store:', currentStore.id);
        
        const normalizeRevenueChart = (raw) => {
          if (Array.isArray(raw)) return raw;
          if (!raw || typeof raw !== 'object') return [];
          if (Array.isArray(raw.revenues) && Array.isArray(raw.labels)) {
            return raw.labels.map((label, idx) => {
              const v = raw.revenues[idx] ?? 0;
              return { label, value: v, totalRevenue: v, revenue: v, total: v };
            });
          }
          if (Array.isArray(raw.data)) return raw.data;
          return [];
        };

        const normalizeOrdersChart = (raw) => {
          if (Array.isArray(raw)) return raw;
          if (!raw || typeof raw !== 'object') return [];
          // ✅ API trả về orderCounts (theo Swagger)
          const vals = raw.orderCounts || raw.orders || raw.counts || raw.values;
          if (Array.isArray(vals) && Array.isArray(raw.labels)) {
            return raw.labels.map((label, idx) => {
              const v = vals[idx] ?? 0;
              return { label, value: v, orders: v, count: v, total: v, orderCounts: v };
            });
          }
          if (Array.isArray(raw.data)) return raw.data;
          return [];
        };

        // ✅ Load overview stats first (no timeout to avoid mất dữ liệu)
        const [overviewResult, orderCountResult, variantCountResult] = await Promise.all([
          getOverviewStatistics(currentStore.id),
          getOrderCountByStatus(currentStore.id),
          getVariantCountByStockStatus(currentStore.id),
        ]);

        // Set initial data immediately (progressive loading)
        const overview = overviewResult.success ? overviewResult.data : {};
        const orderCount = orderCountResult.success ? orderCountResult.data : {};
        const variantCount = variantCountResult.success ? variantCountResult.data : {};
        // ✅ API trả về totalOrders trực tiếp, nếu không có thì tính tổng
        const totalOrders = orderCount.totalOrders || Object.values(orderCount).reduce((sum, count) => {
          // Skip các key không phải số (như totalOrders, nếu có)
          if (typeof count === 'number') return sum + count;
          return sum;
        }, 0);
        const totalVariants = Object.values(variantCount).reduce((sum, count) => sum + (count || 0), 0);

        // Set initial data without charts (show immediately)
        setAnalyticsData({
          revenue: { total: overview.totalRevenue || 0, growth: overview.revenueGrowth || 0, chartMonth: [], chartWeek: [] },
          orders: { total: totalOrders || orderCount.totalOrders || 0, growth: overview.orderGrowth || 0, chartMonth: [], chartWeek: [] },
          // ✅ Order status - API trả về camelCase với suffix "Orders"
          orderStatus: {
            pending: orderCount.pendingOrders || orderCount.PENDING || orderCount.NEW || orderCount.CREATED || 0,
            processing: orderCount.confirmedOrders || orderCount.CONFIRMED || orderCount.PROCESSING || orderCount.IN_PROGRESS || 0, // "Đang xử lý" = confirmedOrders
            shipped: orderCount.shippingOrders || orderCount.SHIPPING || orderCount.IN_DELIVERY || orderCount.DELIVERING || 0, // "Đang giao"
            delivered: orderCount.deliveredOrders || orderCount.DELIVERED || orderCount.COMPLETED || orderCount.DONE || 0,
            cancelled: orderCount.cancelledOrders || orderCount.CANCELLED || orderCount.CANCELED || orderCount.REJECTED || 0,
          },
          products: {
            total: totalVariants,
            active: variantCount.IN_STOCK || 0,
            inactive: (variantCount.LOW_STOCK || 0) + (variantCount.OUT_OF_STOCK || 0),
          },
          inventory: {
            total: totalVariants,
            inStock: variantCount.IN_STOCK || 0,
            lowStock: variantCount.LOW_STOCK || 0,
            outOfStock: variantCount.OUT_OF_STOCK || 0,
          },
          // ✅ Tính toán các metrics từ dữ liệu hiện có
          metrics: {
            cancellationRate: totalOrders > 0 ? ((orderCount.cancelledOrders || orderCount.CANCELLED || 0) / totalOrders * 100).toFixed(1) : '0.0',
            successRate: totalOrders > 0 ? ((orderCount.deliveredOrders || orderCount.DELIVERED || 0) / totalOrders * 100).toFixed(1) : '0.0',
            avgOrderValue: totalOrders > 0 ? (overview.totalRevenue || 0) / totalOrders : 0,
            todayRevenue: overview.todayRevenue || 0,
            newOrdersToday: overview.newOrdersToday || 0,
          },
        });
        setLoading(false); // ✅ Show UI immediately

        // Step 2: Load charts (may be slow - don't block UI)
        setLoadingCharts(true);
        const [
          revenueChartMonthResult,
          ordersChartMonthResult,
        ] = await Promise.all([
          getRevenueChartData(currentStore.id, 'MONTH'),
          getOrdersChartData(currentStore.id, 'MONTH'),
        ]);
        
        // Process chart data
        const revenueChartMonth = revenueChartMonthResult.success
          ? normalizeRevenueChart(revenueChartMonthResult.data)
          : [];
        const ordersChartMonth = ordersChartMonthResult.success
          ? normalizeOrdersChart(ordersChartMonthResult.data)
          : [];
        
        // Calculate revenue total from chart
        const revenueTotal = (overview.totalRevenue ?? 0) ||
          revenueChartMonth.reduce(
            (sum, item) => sum + (item.totalRevenue ?? item.revenue ?? item.total ?? 0),
            0
          );

        // ✅ Update analytics data with charts (progressive loading)
        setAnalyticsData(prev => ({
          ...prev,
          revenue: {
            ...prev.revenue,
            total: revenueTotal,
            chartMonth: revenueChartMonth,
          },
          orders: {
            ...prev.orders,
            chartMonth: ordersChartMonth,
          },
        }));
        
        setLoadingCharts(false);
        
        console.log('✅ Analytics loaded from Shop Statistics APIs:', {
          overview: overviewResult.success,
          revenueChartMonth: revenueChartMonthResult.success,
          orderCount: orderCountResult.success,
          ordersChartMonth: ordersChartMonthResult.success,
          variantCount: variantCountResult.success,
        });
        
      } catch (error) {
        console.error('❌ Error fetching analytics:', error);
        setLoadingCharts(false);
        // Set empty data on error (but keep what we already loaded)
        if (!analyticsData) {
          setAnalyticsData({
            revenue: { total: 0, growth: 0, chartMonth: [], chartWeek: [] },
            orders: { total: 0, growth: 0, chartMonth: [], chartWeek: [] },
            orderStatus: { pending: 0, confirmed: 0, shipping: 0, delivered: 0, cancelled: 0 },
            products: { total: 0, active: 0, inactive: 0 },
          inventory: { total: 0, lowStock: 0, outOfStock: 0 },
          metrics: {
            cancellationRate: '0.0',
            successRate: '0.0',
            avgOrderValue: 0,
            todayRevenue: 0,
            newOrdersToday: 0,
          },
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [currentStore?.id, timeRange]);

  // Lazy load WEEK charts after MONTH charts are loaded
  useEffect(() => {
    const loadWeekCharts = async () => {
      if (!currentStore?.id || !analyticsData || loadingWeekChart) return;
      
      // Check if WEEK charts are already loaded
      if (analyticsData.revenue?.chartWeek?.length > 0 || analyticsData.orders?.chartWeek?.length > 0) {
        return; // Already loaded
      }

      setLoadingWeekChart(true);
      try {
        const normalizeRevenueChart = (raw) => {
          if (Array.isArray(raw)) return raw;
          if (!raw || typeof raw !== 'object') return [];
          if (Array.isArray(raw.revenues) && Array.isArray(raw.labels)) {
            return raw.labels.map((label, idx) => {
              const v = raw.revenues[idx] ?? 0;
              return { label, value: v, totalRevenue: v, revenue: v, total: v };
            });
          }
          if (Array.isArray(raw.data)) return raw.data;
          return [];
        };

        const normalizeOrdersChart = (raw) => {
          if (Array.isArray(raw)) return raw;
          if (!raw || typeof raw !== 'object') return [];
          // ✅ API trả về orderCounts (theo Swagger)
          const vals = raw.orderCounts || raw.orders || raw.counts || raw.values;
          if (Array.isArray(vals) && Array.isArray(raw.labels)) {
            return raw.labels.map((label, idx) => {
              const v = vals[idx] ?? 0;
              return { label, value: v, orders: v, count: v, total: v, orderCounts: v };
            });
          }
          if (Array.isArray(raw.data)) return raw.data;
          return [];
        };

        const [revenueChartWeekResult, ordersChartWeekResult] = await Promise.all([
          getRevenueChartData(currentStore.id, 'WEEK'),
          getOrdersChartData(currentStore.id, 'WEEK'),
        ]);

        const revenueChartWeek = revenueChartWeekResult.success
          ? normalizeRevenueChart(revenueChartWeekResult.data)
          : [];
        const ordersChartWeek = ordersChartWeekResult.success
          ? normalizeOrdersChart(ordersChartWeekResult.data)
          : [];

        // Update analytics data with WEEK charts
        setAnalyticsData(prev => ({
          ...prev,
          revenue: {
            ...prev.revenue,
            chartWeek: revenueChartWeek,
          },
          orders: {
            ...prev.orders,
            chartWeek: ordersChartWeek,
          },
        }));

        console.log('✅ WEEK charts loaded:', {
          revenueChartWeek: revenueChartWeekResult.success,
          ordersChartWeek: ordersChartWeekResult.success,
        });
      } catch (error) {
        console.error('❌ Error loading WEEK charts:', error);
      } finally {
        setLoadingWeekChart(false);
      }
    };

    // Load WEEK charts after a short delay to not block initial render
    const timer = setTimeout(() => {
      loadWeekCharts();
    }, 100);

    return () => clearTimeout(timer);
  }, [currentStore?.id, analyticsData, loadingWeekChart]);

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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
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
                        <p className="text-sm font-medium text-gray-600">Biến thể (kho)</p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatNumber(displayData?.inventory?.total || displayData?.products?.total || 0)}
                        </p>
                        <p className="text-xs text-purple-600">
                          {formatNumber(displayData?.inventory?.inStock || displayData?.products?.active || 0)} đang bán
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* Charts: Tháng & Tuần với toggle Doanh thu / Đơn hàng */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart theo tháng */}
            <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Biểu đồ theo tháng</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setChartModeMonth('revenue')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      chartModeMonth === 'revenue'
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}
                  >
                    Doanh thu
                  </button>
                  <button
                    onClick={() => setChartModeMonth('orders')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      chartModeMonth === 'orders'
                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}
                  >
                    Đơn hàng
                  </button>
                </div>
              </div>
              {(() => {
                if (loadingCharts) {
                  return (
                    <div className="h-64 flex items-end justify-between gap-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex flex-col items-center flex-1">
                          <div className="w-full bg-gray-200 rounded-t animate-pulse" style={{ height: `${[80, 120, 100][i - 1]}px` }}></div>
                          <div className="h-4 w-12 bg-gray-200 rounded mt-2 animate-pulse"></div>
                          <div className="h-4 w-16 bg-gray-200 rounded mt-1 animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  );
                }
                const data =
                  chartModeMonth === 'revenue'
                    ? displayData?.revenue?.chartMonth || []
                    : displayData?.orders?.chartMonth || [];
                const maxVal = Math.max(
                  ...data.map((d) => {
                    if (chartModeMonth === 'revenue') return d.totalRevenue ?? d.revenue ?? d.total ?? 0;
                    return d.orderCounts ?? d.orders ?? d.count ?? d.total ?? 0;
                  }),
                  1
                );
                if (!data.length) return <p className="text-sm text-gray-500">Chưa có dữ liệu</p>;
                return (
                  <div className="h-64 flex items-end justify-between gap-2">
                    {data.map((item, index) => {
                      const value =
                        chartModeMonth === 'revenue'
                          ? item.totalRevenue ?? item.revenue ?? item.total ?? 0
                          : item.orderCounts ?? item.orders ?? item.count ?? item.total ?? 0;
                      const label = item.label || item.month || item.period || item.date || `P${index + 1}`;
                      const height = (value / maxVal) * 200;
                      return (
                        <div key={index} className="flex flex-col items-center flex-1">
                          <div
                            className={`w-full rounded-t ${chartModeMonth === 'revenue'
                              ? 'bg-gradient-to-t from-green-500 to-green-400'
                              : 'bg-gradient-to-t from-blue-500 to-blue-400'}`}
                            style={{ height: `${height}px` }}
                            title={`${label}: ${chartModeMonth === 'revenue' ? formatPrice(value) : formatNumber(value)}`}
                          ></div>
                          <span className="text-xs text-gray-500 mt-2 truncate w-full text-center" title={label}>
                            {label}
                          </span>
                          <span className="text-xs text-gray-700 font-medium">
                            {chartModeMonth === 'revenue' ? formatPrice(value) : formatNumber(value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Chart theo tuần */}
            <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Biểu đồ theo tuần</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setChartModeWeek('revenue')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      chartModeWeek === 'revenue'
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}
                  >
                    Doanh thu
                  </button>
                  <button
                    onClick={() => setChartModeWeek('orders')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      chartModeWeek === 'orders'
                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}
                  >
                    Đơn hàng
                  </button>
                </div>
              </div>
              {(() => {
                if (loadingWeekChart) {
                  return (
                    <div className="h-64 flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">Đang tải dữ liệu...</p>
                      </div>
                    </div>
                  );
                }
                const data =
                  chartModeWeek === 'revenue'
                    ? displayData?.revenue?.chartWeek || []
                    : displayData?.orders?.chartWeek || [];
                const maxVal = Math.max(
                  ...data.map((d) => {
                    if (chartModeWeek === 'revenue') return d.totalRevenue ?? d.revenue ?? d.total ?? 0;
                    return d.orderCounts ?? d.orders ?? d.count ?? d.total ?? 0;
                  }),
                  1
                );
                if (!data.length) return <p className="text-sm text-gray-500">Chưa có dữ liệu</p>;
                return (
                  <div className="h-64 flex items-end justify-between gap-2">
                    {data.map((item, index) => {
                      const value =
                        chartModeWeek === 'revenue'
                          ? item.totalRevenue ?? item.revenue ?? item.total ?? 0
                          : item.orderCounts ?? item.orders ?? item.count ?? item.total ?? 0;
                      const label = item.label || item.week || item.period || item.date || `W${index + 1}`;
                      const height = (value / maxVal) * 200;
                      return (
                        <div key={index} className="flex flex-col items-center flex-1">
                          <div
                            className={`w-full rounded-t ${chartModeWeek === 'revenue'
                              ? 'bg-gradient-to-t from-green-500 to-green-400'
                              : 'bg-gradient-to-t from-blue-500 to-blue-400'}`}
                            style={{ height: `${height}px` }}
                            title={`${label}: ${chartModeWeek === 'revenue' ? formatPrice(value) : formatNumber(value)}`}
                          ></div>
                          <span className="text-xs text-gray-500 mt-2 truncate w-full text-center" title={label}>
                            {label}
                          </span>
                          <span className="text-xs text-gray-700 font-medium">
                            {chartModeWeek === 'revenue' ? formatPrice(value) : formatNumber(value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
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

          {/* Key Metrics - Tính toán từ dữ liệu hiện có */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Tỷ lệ thành công */}
            <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">✅ Tỷ lệ thành công</span>
                <span className="text-2xl font-bold text-green-600">{displayData?.metrics?.successRate || '0.0'}%</span>
              </div>
              <p className="text-xs text-gray-500">Đơn hàng đã giao thành công</p>
              <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: `${displayData?.metrics?.successRate || 0}%` }}></div>
              </div>
            </div>

            {/* Tỷ lệ hủy đơn */}
            <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">❌ Tỷ lệ hủy đơn</span>
                <span className="text-2xl font-bold text-red-600">{displayData?.metrics?.cancellationRate || '0.0'}%</span>
              </div>
              <p className="text-xs text-gray-500">Đơn hàng bị hủy</p>
              <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-red-500" style={{ width: `${displayData?.metrics?.cancellationRate || 0}%` }}></div>
              </div>
            </div>

            {/* Giá trị đơn hàng trung bình */}
            <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">💰 Giá trị đơn TB</span>
                <span className="text-xl font-bold text-blue-600">{formatPrice(displayData?.metrics?.avgOrderValue || 0)}</span>
              </div>
              <p className="text-xs text-gray-500">Trung bình mỗi đơn hàng</p>
            </div>

            {/* Doanh thu hôm nay (nếu có) */}
            {(displayData?.metrics?.todayRevenue > 0 || displayData?.metrics?.newOrdersToday > 0) && (
              <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">📊 Hôm nay</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Doanh thu:</span>
                    <span className="text-sm font-semibold text-green-600">{formatPrice(displayData?.metrics?.todayRevenue || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Đơn mới:</span>
                    <span className="text-sm font-semibold text-blue-600">{formatNumber(displayData?.metrics?.newOrdersToday || 0)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </StoreLayout>
    </StoreStatusGuard>
  );
};

export default StoreAnalytics;