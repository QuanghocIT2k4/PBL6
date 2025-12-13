import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import StoreLayout from '../../layouts/StoreLayout';
import StoreStatusGuard from '../../components/store/StoreStatusGuard';
import { useStoreContext } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { getOrderCode } from '../../utils/displayCodeUtils';
import Chart from '../../components/charts/Chart';
import { getDashboardAnalytics } from '../../services/b2c/b2cAnalyticsService';
import { getStoreOrders } from '../../services/b2c/b2cOrderService';
import { countPromotionsByStatus } from '../../services/b2c/b2cPromotionService';
import { countShipmentsByStatus } from '../../services/b2c/shipmentService';
import { 
  getOverviewStatistics, 
  getOrdersChartData,
  // getProductsSoldChartData, // TODO: Uncomment khi backend implement API
  getOrderCountByStatus,
  getVariantCountByStockStatus,
  formatCurrency,
  getOrderStatusBadge,
  getStockStatusBadge
} from '../../services/b2c/shopStatisticsService';

const StoreDashboard = () => {
  const { currentStore, loading: storeLoading } = useStoreContext();
  
  // ✅ Fetch dashboard analytics từ API
  const { data: analyticsData, error: analyticsError, isLoading: analyticsLoading } = useSWR(
    currentStore?.id ? ['dashboard-analytics', currentStore.id] : null,
    () => getDashboardAnalytics(currentStore.id),
    { revalidateOnFocus: false }
  );

  // ✅ Fetch overview + revenue chart (new statistics APIs)
  const { data: overviewData } = useSWR(
    currentStore?.id ? ['overview-stats', currentStore.id] : null,
    () => getOverviewStatistics(currentStore.id),
    { revalidateOnFocus: false }
  );

  const [chartPeriod, setChartPeriod] = useState('MONTH');
  
  const { data: ordersChartData, error: ordersChartError } = useSWR(
    currentStore?.id ? ['orders-chart', currentStore.id, chartPeriod] : null,
    () => getOrdersChartData(currentStore.id, chartPeriod),
    { revalidateOnFocus: false }
  );
  
  // TODO: Uncomment khi backend implement API /api/v1/b2c/statistics/products/chart-data
  // const { data: productsSoldChartData, error: productsSoldChartError } = useSWR(
  //   currentStore?.id ? ['products-sold-chart', currentStore.id, chartPeriod] : null,
  //   () => getProductsSoldChartData(currentStore.id, chartPeriod),
  //   { revalidateOnFocus: false }
  // );
  
  // Debug: Log API response
  React.useEffect(() => {
    if (ordersChartData) {
      console.log('📊 [StoreDashboard] ordersChartData:', ordersChartData);
      console.log('📊 [StoreDashboard] ordersChartData.success:', ordersChartData.success);
      console.log('📊 [StoreDashboard] ordersChartData.data:', ordersChartData.data);
    }
    if (ordersChartError) {
      console.error('❌ [StoreDashboard] ordersChartError:', ordersChartError);
    }
  }, [ordersChartData, ordersChartError]);

  // ✅ Fetch recent orders từ API (bắt buộc truyền storeId)
  const { data: ordersData, error: ordersError, isLoading: ordersLoading } = useSWR(
    currentStore?.id ? ['recent-orders', currentStore.id] : null,
    () =>
      getStoreOrders({
        storeId: currentStore.id,
        page: 0,
        size: 5,
        sortBy: 'createdAt',
        sortDir: 'desc',
        status: 'DELIVERED', // chỉ lấy đơn đã giao
      }),
    { revalidateOnFocus: false }
  );

  // ✅ Fetch counts by status (API statistics mới từ shopStatisticsService)
  const { data: orderCountData } = useSWR(
    currentStore?.id ? ['order-count-status', currentStore.id] : null,
    () => getOrderCountByStatus(currentStore.id),
    { revalidateOnFocus: false }
  );

  const { data: variantCountData } = useSWR(
    currentStore?.id ? ['variant-count-stock-status', currentStore.id] : null,
    () => getVariantCountByStockStatus(currentStore.id),
    { revalidateOnFocus: false }
  );

  const { data: promotionCountData } = useSWR(
    currentStore?.id ? ['promotion-count-status', currentStore.id] : null,
    () => countPromotionsByStatus(currentStore.id),
    { revalidateOnFocus: false }
  );

  const { data: shipmentCountData } = useSWR(
    currentStore?.id ? ['shipment-count-status', currentStore.id] : null,
    () => countShipmentsByStatus(currentStore.id),
    { revalidateOnFocus: false }
  );

  const analytics = analyticsData?.success ? analyticsData.data : null;
  const overview = overviewData?.success ? overviewData.data : {};
  const ordersChart = ordersChartData?.success
    ? (Array.isArray(ordersChartData.data) ? ordersChartData.data : [])
    : [];
  const revenueTotal = overview?.totalRevenue ?? 0;
  const recentOrders = ordersData?.success ? (ordersData.data?.content || ordersData.data || []) : [];
  const orderCounts = orderCountData?.success ? orderCountData.data : {};
  const variantStockCounts = variantCountData?.success ? variantCountData.data : {}; // Stock status: IN_STOCK, LOW_STOCK, OUT_OF_STOCK
  const promotionCounts = promotionCountData?.success ? promotionCountData.data : {};
  const shipmentCounts = shipmentCountData?.success ? shipmentCountData.data : {};

  // Helper functions - phải định nghĩa trước khi sử dụng
  const sumCounts = (obj = {}) =>
    Object.values(obj).reduce((acc, val) => acc + (Number.isFinite(Number(val)) ? Number(val) : 0), 0);
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price || 0);
  };

  const formatGrowth = (growth) => {
    if (!growth && growth !== 0) return '+0%';
    return growth >= 0 ? `+${growth.toFixed(1)}%` : `${growth.toFixed(1)}%`;
  };

  // Format chart data - xử lý structure từ API
  let ordersChartFormatted = [];
  if (ordersChartData?.success && ordersChartData.data) {
    let chartData = ordersChartData.data;
    
    console.log('📊 [StoreDashboard] Raw chartData:', chartData);
    
    // Nếu là array, lấy phần tử đầu tiên
    if (Array.isArray(chartData) && chartData.length > 0 && typeof chartData[0] === 'object') {
      chartData = chartData[0];
    }
    
    // API trả về: {period: 'MONTH', orderCounts: Array, Labels: Array}
    // Kiểm tra orderCounts (chữ L viết hoa) hoặc orders (chữ thường)
    const orderCounts = chartData.orderCounts || chartData.orders;
    const labels = chartData.Labels || chartData.labels;
    
    if (orderCounts && Array.isArray(orderCounts)) {
      // Có labels từ API
      if (labels && Array.isArray(labels) && labels.length === orderCounts.length) {
        ordersChartFormatted = orderCounts.map((value, idx) => ({
          label: labels[idx] || `Period ${idx + 1}`,
          value: Number(value) || 0,
        }));
      } else {
        // Tự tạo labels nếu không có - chỉ dùng dữ liệu thực tế từ API
        const generatedLabels = orderCounts.map((_, idx) => {
          if (chartPeriod === 'MONTH') {
            const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                              'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
            return monthNames[idx] || `Tháng ${idx + 1}`;
          }
          if (chartPeriod === 'WEEK') {
            // Dùng format "Tuần XX/YYYY" nếu có thể
            const currentYear = new Date().getFullYear();
            const weekNum = idx + 1;
            return `Tuần ${weekNum}/${currentYear}`;
          }
          if (chartPeriod === 'YEAR') {
            const currentYear = new Date().getFullYear();
            return `${currentYear - orderCounts.length + idx + 1}`;
          }
          return `Period ${idx + 1}`;
        });
        ordersChartFormatted = orderCounts.map((value, idx) => ({
          label: generatedLabels[idx] || `Period ${idx + 1}`,
          value: Number(value) || 0,
        }));
      }
    } 
    // Nếu là object có orders array (format cũ)
    else if (!Array.isArray(chartData) && chartData.orders && Array.isArray(chartData.orders)) {
      const labels = chartData.labels || chartData.orders.map((_, idx) => {
        if (chartPeriod === 'MONTH') return `Tháng ${idx + 1}`;
        if (chartPeriod === 'WEEK') return `Tuần ${idx + 1}`;
        if (chartPeriod === 'YEAR') return `Năm ${idx + 1}`;
        return `Period ${idx + 1}`;
      });
      ordersChartFormatted = chartData.orders.map((value, idx) => ({
        label: labels[idx] || `Period ${idx + 1}`,
        value: value || 0,
      }));
    } 
    // Nếu là array trực tiếp
    else if (Array.isArray(chartData)) {
      ordersChartFormatted = chartData.map((item) => ({
        label: item.label || item.period || item.month || item.date || 'N/A',
        value: item.totalOrders || item.orders || item.count || item.orderCount || 0,
      }));
    }
    
    console.log('📊 [StoreDashboard] ordersChartFormatted:', ordersChartFormatted);
  }

  // TODO: Uncomment khi backend implement API /api/v1/b2c/statistics/products/chart-data
  // Format products sold chart data - tương tự orders chart
  // let productsSoldChartFormatted = [];
  // if (productsSoldChartData?.success && productsSoldChartData.data) {
  //   ... code parse data ...
  // }

  // Statistics chart data - cho biểu đồ phân bổ
  const statsChartData = [
    { label: 'Đơn hàng', value: sumCounts(orderCounts), color: 'blue' },
    { label: 'Sản phẩm', value: sumCounts(variantStockCounts), color: 'green' },
    { label: 'Khuyến mãi', value: sumCounts(promotionCounts), color: 'orange' },
    { label: 'Vận chuyển', value: sumCounts(shipmentCounts), color: 'purple' },
  ].filter(item => item.value > 0);

  const statusLabelMap = {
    orders: {
      // Order status chỉ còn 3: PENDING, CONFIRMED, CANCELLED
      // SHIPPING và DELIVERED đã chuyển sang Shipment Management
      PENDING: 'Chờ xác nhận',
      CONFIRMED: 'Đã xác nhận',
      CANCELLED: 'Đã hủy',
      // Các key từ API có thể có
      pendingOrders: 'Chờ xác nhận',
      confirmedOrders: 'Đã xác nhận',
      cancelledOrders: 'Đã hủy',
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      cancelled: 'Đã hủy',
    },
    variants: {
      IN_STOCK: 'Còn hàng',
      LOW_STOCK: 'Sắp hết',
      OUT_OF_STOCK: 'Hết hàng',
      // Các key từ API có thể có
      inStockProducts: 'Còn hàng',
      lowStockProducts: 'Sắp hết',
      outOfStockProducts: 'Hết hàng',
      inStock: 'Còn hàng',
      lowStock: 'Sắp hết',
      outOfStock: 'Hết hàng',
    },
    promotions: {
      ACTIVE: 'Đang chạy',
      INACTIVE: 'Tạm dừng',
      EXPIRED: 'Hết hạn',
      DELETED: 'Đã xóa',
      UPCOMING: 'Sắp chạy',
      // Các key từ API có thể có
      active: 'Đang chạy',
      inactive: 'Tạm dừng',
      expired: 'Hết hạn',
      deleted: 'Đã xóa',
      upcoming: 'Sắp chạy',
    },
    shipments: {
      PICKING_UP: 'Đang lấy hàng',
      SHIPPING: 'Đang giao',
      DELIVERED: 'Đã giao',
      FAILED: 'Thất bại',
      // Các key từ API có thể có
      pickingUp: 'Đang lấy hàng',
      shipping: 'Đang giao',
      delivered: 'Đã giao',
      failed: 'Thất bại',
    },
  };

  const renderStatusPills = (counts = {}, map = {}, type = '') => {
    // Lọc bỏ 'total' và các giá trị = 0
    const entries = Object.entries(counts).filter(([key, val]) => {
      const lowerKey = key.toLowerCase();
      // Bỏ qua total và các key không hợp lệ
      if (lowerKey === 'total' || lowerKey === 'totalorders' || lowerKey === 'totalproducts' || Number(val) <= 0) {
        return false;
      }
      // Nếu là orders, bỏ qua shippingOrders và deliveredOrders (đã chuyển sang Shipment)
      if (type === 'orders') {
        if (lowerKey.includes('shipping') || lowerKey.includes('delivered')) {
          return false;
        }
      }
      return true;
    });
    
    if (!entries.length) return <div className="text-xs text-gray-500 py-2">Chưa có dữ liệu</div>;
    
    // Color map theo từng loại
    const getColorClass = (key, type) => {
      const upperKey = key.toUpperCase();
      
      if (type === 'orders' || map[key]?.includes('đơn')) {
        // Order status chỉ còn 3: PENDING, CONFIRMED, CANCELLED
        // SHIPPING và DELIVERED đã chuyển sang Shipment
        if (upperKey.includes('PENDING') || upperKey.includes('CHỜ')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        if (upperKey.includes('CONFIRMED') || upperKey.includes('XÁC NHẬN')) return 'bg-blue-100 text-blue-800 border-blue-200';
        if (upperKey.includes('CANCELLED') || upperKey.includes('HỦY')) return 'bg-red-100 text-red-800 border-red-200';
        // Bỏ qua SHIPPING và DELIVERED vì đã chuyển sang Shipment
      }
      
      if (type === 'variants' || map[key]?.includes('kho')) {
        if (upperKey.includes('IN_STOCK') || upperKey.includes('CÒN HÀNG')) return 'bg-green-100 text-green-800 border-green-200';
        if (upperKey.includes('LOW_STOCK') || upperKey.includes('SẮP HẾT')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        if (upperKey.includes('OUT_OF_STOCK') || upperKey.includes('HẾT HÀNG')) return 'bg-red-100 text-red-800 border-red-200';
      }
      
      if (type === 'promotions' || map[key]?.includes('khuyến')) {
        if (upperKey.includes('ACTIVE') || upperKey.includes('CHẠY')) return 'bg-green-100 text-green-800 border-green-200';
        if (upperKey.includes('INACTIVE') || upperKey.includes('TẠM DỪNG')) return 'bg-gray-100 text-gray-800 border-gray-200';
        if (upperKey.includes('EXPIRED') || upperKey.includes('HẾT HẠN')) return 'bg-red-100 text-red-800 border-red-200';
        if (upperKey.includes('UPCOMING') || upperKey.includes('SẮP CHẠY')) return 'bg-blue-100 text-blue-800 border-blue-200';
      }
      
      if (type === 'shipments' || map[key]?.includes('vận chuyển')) {
        if (upperKey.includes('PICKING_UP') || upperKey.includes('LẤY HÀNG')) return 'bg-blue-100 text-blue-800 border-blue-200';
        if (upperKey.includes('SHIPPING') || upperKey.includes('ĐANG GIAO')) return 'bg-purple-100 text-purple-800 border-purple-200';
        if (upperKey.includes('DELIVERED') || upperKey.includes('ĐÃ GIAO')) return 'bg-green-100 text-green-800 border-green-200';
        if (upperKey.includes('FAILED') || upperKey.includes('THẤT BẠI')) return 'bg-red-100 text-red-800 border-red-200';
      }
      
      return 'bg-gray-100 text-gray-800 border-gray-200';
    };
    
    // Hàm chuyển đổi key sang tiếng Việt
    const getVietnameseLabel = (key, map) => {
      // Thử tìm trong map trước
      if (map[key]) return map[key];
      
      // Nếu không có, thử tìm với key viết hoa
      const upperKey = key.toUpperCase();
      if (map[upperKey]) return map[upperKey];
      
      // Mapping thủ công cho các key phổ biến
      const keyLower = key.toLowerCase();
      const labelMap = {
        // Orders - chỉ còn 3 status: PENDING, CONFIRMED, CANCELLED
        'pendingorders': 'Chờ xác nhận',
        'confirmedorders': 'Đã xác nhận',
        'cancelledorders': 'Đã hủy',
        'pending': 'Chờ xác nhận',
        'confirmed': 'Đã xác nhận',
        'cancelled': 'Đã hủy',
        // SHIPPING và DELIVERED đã chuyển sang Shipment Management
        // Variants
        'instockproducts': 'Còn hàng',
        'lowstockproducts': 'Sắp hết',
        'outofstockproducts': 'Hết hàng',
        'instock': 'Còn hàng',
        'lowstock': 'Sắp hết',
        'outofstock': 'Hết hàng',
        // Promotions
        'active': 'Đang chạy',
        'inactive': 'Tạm dừng',
        'expired': 'Hết hạn',
        'deleted': 'Đã xóa',
        'upcoming': 'Sắp chạy',
        // Shipments
        'pickingup': 'Đang lấy hàng',
        'shipping': 'Đang giao',
        'delivered': 'Đã giao',
        'failed': 'Thất bại',
      };
      
      return labelMap[keyLower] || key;
    };
    
    return (
      <div className="grid grid-cols-2 gap-2">
        {entries.map(([key, val]) => {
          const label = getVietnameseLabel(key, map);
          const colors = getColorClass(key, type);
          return (
            <div
              key={key}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold border ${colors} hover:shadow-sm transition-shadow`}
            >
              <span className="text-xs truncate">{label}</span>
              <span className="font-bold ml-2 flex-shrink-0">{val}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // Loading state
  if (analyticsLoading || ordersLoading || storeLoading) {
    return (
      <StoreStatusGuard currentStore={currentStore} pageName="bảng điều khiển" loading={true}>
        <StoreLayout>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải dữ liệu...</p>
            </div>
          </div>
        </StoreLayout>
      </StoreStatusGuard>
    );
  }

  const displayCount = (val) => (val && val > 0 ? val : '');
  const displayPrice = (val) => (val && val > 0 ? formatPrice(val) : '');

  const getOrderItems = (order) => order?.items || order?.orderItems || [];
  const getFirstItem = (order) => {
    const items = getOrderItems(order);
    return items.length > 0 ? items[0] : null;
  };
  const getShipping = (orderObj) =>
    orderObj?.shippingAddress ||
    orderObj?.shippingInfo ||
    orderObj?.deliveryAddress ||
    orderObj?.deliveryInfo ||
    orderObj?.address ||
    orderObj?.shipment?.shippingAddress ||
    orderObj?.shipment?.receiverAddress ||
    orderObj?.shipping ||
    orderObj?.receiverAddress ||
    orderObj?.addressInfo ||
    null;
  const getCustomerName = (orderObj) => {
    // Ưu tiên 1: Từ shipping address (tên người nhận)
    const s = getShipping(orderObj) || {};
    if (s.suggestedName || s.recipientName || s.fullName || s.name || s.receiverName) {
      return s.suggestedName || s.recipientName || s.fullName || s.name || s.receiverName;
    }
    
    // Ưu tiên 2: Từ order object trực tiếp
    if (orderObj?.customerName || orderObj?.buyerName || orderObj?.receiverName || orderObj?.recipientName) {
      return orderObj?.customerName || orderObj?.buyerName || orderObj?.receiverName || orderObj?.recipientName;
    }
    
    // Ưu tiên 3: Từ buyer object
    if (orderObj?.buyer) {
      if (orderObj.buyer.fullName) return orderObj.buyer.fullName;
      if (orderObj.buyer.name) return orderObj.buyer.name;
      if (orderObj.buyer.username) return orderObj.buyer.username;
    }
    
    // Ưu tiên 4: Từ user object
    if (orderObj?.user) {
      if (orderObj.user.fullName) return orderObj.user.fullName;
      if (orderObj.user.name) return orderObj.user.name;
      if (orderObj.user.username) return orderObj.user.username;
    }
    
    // Ưu tiên 5: Từ customer object
    if (orderObj?.customer) {
      if (orderObj.customer.fullName) return orderObj.customer.fullName;
      if (orderObj.customer.name) return orderObj.customer.name;
    }
    
    // Fallback
    return 'Khách hàng';
  };
  const getCustomerPhone = (orderObj) => {
    const s = getShipping(orderObj) || {};
    return (
      s.phone ||
      s.receiverPhone ||
      s.contactPhone ||
      s.mobile ||
      orderObj?.shipment?.receiverPhone ||
      orderObj?.customerPhone ||
      orderObj?.buyerPhone ||
      orderObj?.buyer?.phone ||
      orderObj?.user?.phone ||
      ''
    );
  };

  return (
    <StoreStatusGuard currentStore={currentStore} pageName="bảng điều khiển" loading={storeLoading}>
      <StoreLayout>
        <div className="space-y-6">
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-cyan-200 to-blue-200 rounded-2xl p-4">
            <div className="relative bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-1">
                    <span className="text-cyan-600">Tổng quan</span> <span className="text-blue-600">cửa hàng</span>
                  </h1>
                  <p className="text-gray-600 text-base">Tổng quan về hoạt động của hàng</p>
                </div>
                {analytics?.revenueGrowth !== undefined && (
                  <div className="text-right bg-gradient-to-br from-green-50 to-emerald-50 px-4 py-3 rounded-xl border border-green-200">
                    <div className="text-sm text-gray-600 mb-1">Tăng trưởng:</div>
                    <div className={`text-2xl font-bold ${analytics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatGrowth(analytics.revenueGrowth)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">So với tháng trước</div>
                  </div>
                )}
              </div>
              
              {/* Stats Cards - 4 Cards in Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
                {/* Tổng doanh thu */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 hover:shadow-lg transition-all flex flex-col justify-center p-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-400 rounded-xl flex items-center justify-center shadow-md mx-auto mb-3">
                      <span className="text-3xl">💰</span>
                    </div>
                    <div className="text-sm font-medium text-gray-600 mb-1">Tổng doanh thu</div>
                    {displayPrice(revenueTotal || 0) && (
                      <div className="text-xl font-bold text-gray-900 mb-1">
                        {displayPrice(revenueTotal || 0)}
                      </div>
                    )}
                    {overview?.revenueGrowth !== undefined && (
                      <div className={`text-xs font-medium ${overview.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatGrowth(overview.revenueGrowth)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Đơn hàng mới */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 hover:shadow-lg transition-all flex flex-col justify-center p-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-md mx-auto mb-3">
                      <span className="text-3xl">📋</span>
                    </div>
                    <div className="text-sm font-medium text-gray-600 mb-1">Đơn hàng mới</div>
                    {displayCount(analytics?.pendingOrders || 0) && (
                      <div className="text-xl font-bold text-gray-900 mb-1">
                        {displayCount(analytics?.pendingOrders || 0)}
                      </div>
                    )}
                    <div className="text-xs text-blue-600 font-medium"></div>
                  </div>
                </div>

                {/* Sản phẩm đang bán */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 hover:shadow-lg transition-all flex flex-col justify-center p-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center shadow-md mx-auto mb-3">
                      <span className="text-3xl">📦</span>
                    </div>
                    <div className="text-sm font-medium text-gray-600 mb-1">Sản phẩm đang bán</div>
                    {displayCount(analytics?.activeProducts || 0) && (
                      <div className="text-xl font-bold text-gray-900 mb-1">
                        {displayCount(analytics?.activeProducts || 0)}
                      </div>
                    )}
                    <div className="text-xs text-purple-600 font-medium"></div>
                  </div>
                </div>

                {/* Khách hàng */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200 hover:shadow-lg transition-all flex flex-col justify-center p-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-400 rounded-xl flex items-center justify-center shadow-md mx-auto mb-3">
                      <span className="text-3xl">👥</span>
                    </div>
                    <div className="text-sm font-medium text-gray-600 mb-1">Khách hàng mới</div>
                    {displayCount(analytics?.totalCustomers || 0) && (
                      <div className="text-xl font-bold text-gray-900 mb-1">
                        {displayCount(analytics?.totalCustomers || 0)}
                      </div>
                    )}
                    <div className="text-xs text-orange-600 font-medium"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Thống kê trạng thái nhanh */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Đơn hàng */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-2xl text-white">📦</span>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Đơn hàng</p>
                    <h4 className="text-lg font-bold text-gray-900">Theo trạng thái</h4>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">{sumCounts(orderCounts)}</div>
                  <div className="text-xs text-blue-500 font-medium">Tổng</div>
                </div>
              </div>
              {renderStatusPills(orderCounts, statusLabelMap.orders, 'orders')}
            </div>

            {/* Biến thể */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-2xl text-white">📊</span>
                  </div>
                  <div>
                    <p className="text-xs text-purple-600 uppercase font-semibold mb-1">Biến thể</p>
                    <h4 className="text-lg font-bold text-gray-900">Theo trạng thái kho</h4>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-purple-600">{sumCounts(variantStockCounts)}</div>
                  <div className="text-xs text-purple-500 font-medium">Tổng</div>
                </div>
              </div>
              {renderStatusPills(variantStockCounts, statusLabelMap.variants, 'variants')}
            </div>

            {/* Khuyến mãi */}
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border-2 border-pink-200 p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-2xl text-white">🎯</span>
                  </div>
                  <div>
                    <p className="text-xs text-pink-600 uppercase font-semibold mb-1">Khuyến mãi</p>
                    <h4 className="text-lg font-bold text-gray-900">Theo trạng thái</h4>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-pink-600">{sumCounts(promotionCounts)}</div>
                  <div className="text-xs text-pink-500 font-medium">Tổng</div>
                </div>
              </div>
              {renderStatusPills(promotionCounts, statusLabelMap.promotions, 'promotions')}
            </div>

            {/* Vận chuyển */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200 p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-2xl text-white">🚚</span>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600 uppercase font-semibold mb-1">Vận chuyển</p>
                    <h4 className="text-lg font-bold text-gray-900">Theo trạng thái</h4>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-emerald-600">{sumCounts(shipmentCounts)}</div>
                  <div className="text-xs text-emerald-500 font-medium">Tổng</div>
                </div>
              </div>
              {renderStatusPills(shipmentCounts, statusLabelMap.shipments, 'shipments')}
            </div>
          </div>

          {/* Biểu đồ phân tích */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Biểu đồ phân tích</h2>
                <p className="text-sm text-gray-600">Thống kê chi tiết theo số lượng, thời gian, sản phẩm</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Biểu đồ đơn hàng theo thời gian */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Đơn hàng theo thời gian</h3>
                  <p className="text-sm text-gray-500">Số lượng đơn hàng theo {chartPeriod === 'WEEK' ? 'tuần' : chartPeriod === 'MONTH' ? 'tháng' : 'năm'}</p>
                </div>
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setChartPeriod('WEEK')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      chartPeriod === 'WEEK'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Tuần
                  </button>
                  <button
                    onClick={() => setChartPeriod('MONTH')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      chartPeriod === 'MONTH'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Tháng
                  </button>
                  <button
                    onClick={() => setChartPeriod('YEAR')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      chartPeriod === 'YEAR'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Năm
                  </button>
                </div>
                <Chart
                  type="line"
                  data={ordersChartFormatted}
                  valueKey="value"
                  labelKey="label"
                  formatValue={(val) => val.toLocaleString('vi-VN')}
                  color="green"
                  height="200px"
                  className="border-0 shadow-none p-0"
                />
                {sumCounts(orderCounts) > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Tổng đơn hàng:</span>
                      <span className="text-lg font-bold text-gray-900">{sumCounts(orderCounts)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Biểu đồ theo số lượng */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <Chart
                  type="bar"
                  data={statsChartData}
                  valueKey="value"
                  labelKey="label"
                  formatValue={(val) => val.toLocaleString('vi-VN')}
                  color="purple"
                  height="320px"
                  title="Thống kê theo số lượng"
                  subtitle="Tổng hợp đơn hàng, sản phẩm, khuyến mãi, vận chuyển"
                />
              </div>
            </div>
          </div>



          {/* Thao tác nhanh */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Thao tác nhanh</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to="/store-dashboard/products/create"
                className="flex items-center gap-4 p-5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-300"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-white text-2xl">📦</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">Thêm sản phẩm</h4>
                  <p className="text-sm text-gray-600">Tạo sản phẩm mới</p>
                </div>
              </Link>

              <Link
                to="/store-dashboard/orders"
                className="flex items-center gap-4 p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl hover:shadow-lg transition-all border-2 border-transparent hover:border-green-300"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-white text-2xl">📋</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">Xem đơn hàng</h4>
                  <p className="text-sm text-gray-600">Quản lý đơn hàng</p>
                </div>
              </Link>

              <Link
                to="/store-dashboard/promotions"
                className="flex items-center gap-4 p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl hover:shadow-lg transition-all border-2 border-transparent hover:border-purple-300"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-white text-2xl">🎯</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">Tạo khuyến mãi</h4>
                  <p className="text-sm text-gray-600">Chương trình giảm giá</p>
                </div>
              </Link>

              <Link
                to="/store-dashboard/analytics"
                className="flex items-center gap-4 p-5 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl hover:shadow-lg transition-all border-2 border-transparent hover:border-orange-300"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-white text-2xl">📊</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">Xem báo cáo</h4>
                  <p className="text-sm text-gray-600">Thống kê doanh thu</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Đơn hàng gần đây */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Đơn hàng gần đây</h3>
              <Link
                to="/store-dashboard/orders"
                className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1"
              >
                Xem tất cả →
              </Link>
            </div>
            
            {recentOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">📦</span>
                </div>
                <p className="text-gray-500 mb-4">Chưa có đơn hàng nào</p>
                <Link
                  to="/store-dashboard/products"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Thêm sản phẩm để bắt đầu bán
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => {
                  const firstItem = getFirstItem(order);
                  const items = getOrderItems(order);
                  const moreCount = Math.max(0, items.length - 1);
                  const customerName = getCustomerName(order);
                  
                  // Debug: Log order structure để xem có tên ở đâu
                  if (customerName === 'Khách hàng') {
                    console.log('⚠️ [StoreDashboard] Order không có tên khách hàng:', {
                      orderId: order.id,
                      orderKeys: Object.keys(order),
                      buyer: order.buyer,
                      user: order.user,
                      shippingAddress: order.shippingAddress,
                      shipment: order.shipment,
                      customerName: order.customerName,
                      buyerName: order.buyerName
                    });
                  }
                  
                  return (
                    <div key={order.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl flex items-center justify-center font-bold text-xs shadow-sm">
                            {getOrderCode(order.id).slice(-6)}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                              {firstItem?.image || firstItem?.productImage ? (
                                <img
                                  src={firstItem.image || firstItem.productImage}
                                  alt={firstItem.productName || firstItem.name || 'Sản phẩm'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">📦</div>
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {firstItem?.productName || firstItem?.name || 'Sản phẩm'}
                              </h4>
                              <p className="text-sm text-gray-600">
                                x{firstItem?.quantity || 1} · {formatPrice(firstItem?.price || 0)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Khách hàng: {customerName}
                                {getCustomerPhone(order) && getCustomerPhone(order) !== 'N/A' && (
                                  <>
                                    {' '}•{' '}
                                    <span className="font-medium text-gray-700">{getCustomerPhone(order)}</span>
                                  </>
                                )}
                              </p>
                              {moreCount > 0 && (
                                <p className="text-xs text-gray-500">+{moreCount} sản phẩm khác</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end gap-2">
                          <p className="font-bold text-gray-900 text-lg">
                            {formatPrice(parseFloat(order.totalPrice) || order.totalAmount || 0)}
                          </p>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'SHIPPING' ? 'bg-purple-100 text-purple-800' :
                            order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {order.status === 'PENDING' ? 'Chờ xác nhận' :
                             order.status === 'CONFIRMED' ? 'Đã xác nhận' :
                             order.status === 'SHIPPING' ? 'Đang giao' :
                             order.status === 'DELIVERED' ? 'Đã giao' : 'Đã hủy'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </StoreLayout>
    </StoreStatusGuard>
  );
};

export default StoreDashboard;
