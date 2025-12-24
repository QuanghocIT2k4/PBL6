import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import StoreLayout from '../../layouts/StoreLayout';
import StoreStatusGuard from '../../components/store/StoreStatusGuard';
import { useStoreContext } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { getOrderCode } from '../../utils/displayCodeUtils';
import Chart from '../../components/charts/Chart';
import { getStoreOrders } from '../../services/b2c/b2cOrderService';
import { countPromotionsByStatus } from '../../services/b2c/b2cPromotionService';
import { countShipmentsByStatus } from '../../services/b2c/shipmentService';
import { 
  getOverviewStatistics, 
  // getProductsSoldChartData, // TODO: Uncomment khi backend implement API
  getOrderCountByStatus,
  getVariantCountByStockStatus,
  getBestSellingVariants,
  formatCurrency,
  getOrderStatusBadge,
  getStockStatusBadge
} from '../../services/b2c/shopStatisticsService';

const StoreDashboard = () => {
  const { currentStore, loading: storeLoading } = useStoreContext();
  

  // ✅ Fetch overview + revenue chart (new statistics APIs)
  const { data: overviewData, error: overviewError } = useSWR(
    currentStore?.id ? ['overview-stats', currentStore.id] : null,
    () => getOverviewStatistics(currentStore.id),
    { 
      revalidateOnFocus: false,
      onError: (error) => {
        // Log error để debug
        console.error('❌ [OVERVIEW API] Error:', error);
        console.error('❌ [OVERVIEW API] Response:', error.response?.data);
      }
    }
  );
  const [bestSellingPeriod, setBestSellingPeriod] = useState('MONTH');

  // ✅ Fetch best-selling variants
  const { data: bestSellingData, error: bestSellingError, isLoading: bestSellingLoading, mutate: mutateBestSelling } = useSWR(
    currentStore?.id ? ['best-selling-variants', currentStore.id, bestSellingPeriod] : null,
    () => getBestSellingVariants(currentStore.id, 10, bestSellingPeriod),
    { 
      revalidateOnFocus: false,
      revalidateIfStale: true, // ✅ Revalidate khi period thay đổi
      dedupingInterval: 0, // ✅ Tắt deduping để luôn fetch khi period thay đổi
    }
  );
  
  // TODO: Uncomment khi backend implement API /api/v1/b2c/statistics/products/chart-data
  // const { data: productsSoldChartData, error: productsSoldChartError } = useSWR(
  //   currentStore?.id ? ['products-sold-chart', currentStore.id, chartPeriod] : null,
  //   () => getProductsSoldChartData(currentStore.id, chartPeriod),
  //   { revalidateOnFocus: false }
  // );
  

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

  // ✅ Đã xóa analytics vì API /api/v1/b2c/analytics/dashboard/{storeId} không tồn tại
  // ✅ Sử dụng API /api/v1/b2c/statistics/overview thay thế
  const overview = overviewData?.success ? overviewData.data : {};
  const revenueTotal = overview?.totalRevenue ?? 0;
  
  // Debug: Log overview data để kiểm tra
  if (overviewError) {
    console.error('❌ [OVERVIEW] API Error:', overviewError);
  }
  if (overviewData && !overviewData.success) {
    console.error('❌ [OVERVIEW] API returned error:', overviewData.error);
  }
  if (overview && Object.keys(overview).length > 0) {
    console.log('✅ [OVERVIEW] Data received:', overview);
  }
  const recentOrders = ordersData?.success ? (ordersData.data?.content || ordersData.data || []) : [];
  const orderCounts = orderCountData?.success ? orderCountData.data : {};
  const variantStockCounts = variantCountData?.success ? variantCountData.data : {}; // Stock status: IN_STOCK, LOW_STOCK, OUT_OF_STOCK
  const promotionCounts = promotionCountData?.success ? promotionCountData.data : {};
  const shipmentCounts = shipmentCountData?.success ? shipmentCountData.data : {};
  
  const bestSellingVariants = bestSellingData?.success ? (Array.isArray(bestSellingData.data) ? bestSellingData.data : []) : [];

  // Helper functions - phải định nghĩa trước khi sử dụng
  // ✅ Sửa: Chỉ tính tổng các status thực tế, loại bỏ key "total", "TOTAL", "all", "ALL"
  const sumCounts = (obj = {}, excludeKeys = ['total', 'TOTAL', 'all', 'ALL', 'sum', 'SUM']) => {
    return Object.entries(obj).reduce((acc, [key, val]) => {
      // ✅ Bỏ qua các key không phải status (total, all, sum, etc.)
      const lowerKey = key.toLowerCase();
      if (excludeKeys.includes(lowerKey)) {
        return acc;
      }
      // ✅ Chỉ cộng các giá trị số hợp lệ
      const numVal = Number.isFinite(Number(val)) ? Number(val) : 0;
      return acc + numVal;
    }, 0);
  };
  
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

  // TODO: Uncomment khi backend implement API /api/v1/b2c/statistics/products/chart-data
  // Format products sold chart data - tương tự orders chart
  // let productsSoldChartFormatted = [];
  // if (productsSoldChartData?.success && productsSoldChartData.data) {
  //   ... code parse data ...
  // }

  // Statistics chart data - cho biểu đồ phân bổ
  // Hiển thị tất cả các loại, kể cả giá trị 0 để biểu đồ đầy đủ
  const statsChartData = [
    { label: 'Đơn hàng', value: sumCounts(orderCounts), color: 'blue' },
    { label: 'Sản phẩm', value: sumCounts(variantStockCounts), color: 'green' },
    { label: 'Khuyến mãi', value: sumCounts(promotionCounts), color: 'orange' },
    { label: 'Vận chuyển', value: sumCounts(shipmentCounts), color: 'purple' },
  ];

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
      RETURNED: 'Đã trả hàng',
      PICKING: 'Đang lấy hàng',
      READY_TO_PICK: 'Sẵn sàng lấy hàng',
      // Các key từ API có thể có
      pickingUp: 'Đang lấy hàng',
      shipping: 'Đang giao',
      delivered: 'Đã giao',
      failed: 'Thất bại',
      returned: 'Đã trả hàng',
      picking: 'Đang lấy hàng',
      readyToPick: 'Sẵn sàng lấy hàng',
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
        if (upperKey.includes('PICKING_UP') || upperKey.includes('PICKING') || upperKey.includes('LẤY HÀNG')) return 'bg-blue-100 text-blue-800 border-blue-200';
        if (upperKey.includes('READY_TO_PICK') || upperKey.includes('SẴN SÀNG')) return 'bg-cyan-100 text-cyan-800 border-cyan-200';
        if (upperKey.includes('SHIPPING') || upperKey.includes('ĐANG GIAO')) return 'bg-purple-100 text-purple-800 border-purple-200';
        if (upperKey.includes('DELIVERED') || upperKey.includes('ĐÃ GIAO')) return 'bg-green-100 text-green-800 border-green-200';
        if (upperKey.includes('RETURNED') || upperKey.includes('TRẢ HÀNG')) return 'bg-orange-100 text-orange-800 border-orange-200';
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
        'picking': 'Đang lấy hàng',
        'readytopick': 'Sẵn sàng lấy hàng',
        'ready_to_pick': 'Sẵn sàng lấy hàng',
        'shipping': 'Đang giao',
        'delivered': 'Đã giao',
        'returned': 'Đã trả hàng',
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
  if (ordersLoading || storeLoading) {
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

  // ✅ Hiển thị số kể cả khi là 0 (không ẩn)
  const displayCount = (val) => {
    const num = Number(val) || 0;
    return num > 0 ? num : 0; // Hiển thị 0 nếu không có dữ liệu
  };
  const displayPrice = (val) => {
    const num = Number(val) || 0;
    return num > 0 ? formatPrice(num) : formatPrice(0); // Hiển thị 0đ nếu không có dữ liệu
  };

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
                {overview?.revenueGrowth !== undefined && (
                  <div className="text-right bg-gradient-to-br from-green-50 to-emerald-50 px-4 py-3 rounded-xl border border-green-200">
                    <div className="text-sm text-gray-600 mb-1">Tăng trưởng:</div>
                    <div className={`text-2xl font-bold ${overview.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatGrowth(overview.revenueGrowth)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">So với tháng trước</div>
                  </div>
                )}
              </div>
              
              {/* Tắt các card tổng hợp (doanh thu/đơn mới/sản phẩm/khách) theo yêu cầu */}
            </div>
          </div>

          {/* Thống kê trạng thái nhanh (đưa lên gần đầu trang) */}
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
                <p className="text-sm text-gray-600">Thống kê chi tiết theo số lượng, sản phẩm</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Biểu đồ theo số lượng */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-lg mb-12">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Thống kê theo số lượng</h3>
                  <p className="text-sm text-gray-600">Tổng hợp đơn hàng, sản phẩm, khuyến mãi, vận chuyển</p>
                </div>
                <Chart
                  type="bar"
                  data={statsChartData}
                  valueKey="value"
                  labelKey="label"
                  formatValue={(val) => val.toLocaleString('vi-VN')}
                  color="purple"
                  height="400px"
                  className="border-0 shadow-none p-0"
                />
              </div>
            </div>
          </div>

          {/* Sản phẩm bán chạy */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-2xl text-white">🏆</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Sản phẩm bán chạy</h3>
                  <p className="text-sm text-gray-600">
                    Top {bestSellingVariants.length > 0 ? bestSellingVariants.length : 10} sản phẩm bán chạy nhất
                    {bestSellingPeriod === 'WEEK' ? ' (7 ngày qua)' :
                     bestSellingPeriod === 'MONTH' ? ' (30 ngày qua)' :
                     bestSellingPeriod === 'YEAR' ? ' (365 ngày qua)' :
                     ' (tất cả thời gian)'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setBestSellingPeriod('WEEK');
                    // ✅ Force revalidate khi period thay đổi
                    setTimeout(() => mutateBestSelling(), 100);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    bestSellingPeriod === 'WEEK'
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tuần
                </button>
                <button
                  onClick={() => {
                    setBestSellingPeriod('MONTH');
                    // ✅ Force revalidate khi period thay đổi
                    setTimeout(() => mutateBestSelling(), 100);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    bestSellingPeriod === 'MONTH'
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tháng
                </button>
                <button
                  onClick={() => {
                    setBestSellingPeriod('YEAR');
                    // ✅ Force revalidate khi period thay đổi
                    setTimeout(() => mutateBestSelling(), 100);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    bestSellingPeriod === 'YEAR'
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Năm
                </button>
                <button
                  onClick={() => {
                    setBestSellingPeriod('ALL');
                    // ✅ Force revalidate khi period thay đổi
                    setTimeout(() => mutateBestSelling(), 100);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    bestSellingPeriod === 'ALL'
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tất cả
                </button>
              </div>
            </div>

            {bestSellingLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Đang tải dữ liệu...</p>
              </div>
            ) : bestSellingError || bestSellingData?.success === false ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">⚠️</span>
                </div>
                <p className="text-gray-500 mb-2 font-semibold">Không thể tải dữ liệu sản phẩm bán chạy</p>
                <p className="text-sm text-gray-400 mb-2">
                  {bestSellingData?.error || bestSellingError?.message || 'Vui lòng thử lại sau'}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium"
                >
                  Tải lại
                </button>
              </div>
            ) : bestSellingVariants.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">📦</span>
                </div>
                <p className="text-gray-500 mb-4">Chưa có dữ liệu sản phẩm bán chạy</p>
                <p className="text-sm text-gray-400">Dữ liệu sẽ được cập nhật khi có đơn hàng</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bestSellingVariants.map((variant, index) => {
                  const variantId = variant.variantId || variant.id || variant._id || variant.variant?.id;
                  const productName = variant.productName || variant.name || variant.product?.name || variant.productName || 'Sản phẩm';
                  const variantName = variant.variantName || variant.sku || variant.variant?.name || variant.name || variant.specification || '';
                  
                  // Thử nhiều field names có thể có cho số lượng bán
                  const totalSold = variant.totalSold 
                    || variant.quantitySold 
                    || variant.sold 
                    || variant.quantity
                    || variant.totalQuantity
                    || variant.soldQuantity
                    || variant.count
                    || variant.totalCount
                    || variant.orderCount
                    || variant.numberOfOrders
                    || variant.variant?.totalSold
                    || variant.variant?.quantitySold
                    || 0;
                  
                  // Thử nhiều field names có thể có cho doanh thu
                  const revenue = variant.revenue 
                    || variant.totalRevenue 
                    || variant.amount 
                    || variant.totalAmount
                    || variant.salesAmount
                    || variant.income
                    || variant.variant?.revenue
                    || variant.variant?.totalRevenue
                    || 0;
                  
                  // Thử nhiều field names và nested paths cho ảnh sản phẩm
                  const image = variant.primaryImage
                    || variant.primaryImageUrl
                    || (variant.images && Array.isArray(variant.images) && variant.images.length > 0 ? variant.images[0] : null)
                    || (variant.imageUrls && Array.isArray(variant.imageUrls) && variant.imageUrls.length > 0 ? variant.imageUrls[0] : null)
                    || variant.image 
                    || variant.productImage 
                    || variant.product?.primaryImage
                    || variant.product?.primaryImageUrl
                    || (variant.product?.images && Array.isArray(variant.product.images) && variant.product.images.length > 0 ? variant.product.images[0] : null)
                    || variant.product?.image 
                    || variant.variant?.primaryImage
                    || variant.variant?.primaryImageUrl
                    || (variant.variant?.images && Array.isArray(variant.variant.images) && variant.variant.images.length > 0 ? variant.variant.images[0] : null)
                    || variant.variant?.image
                    || variant.thumbnail
                    || variant.product?.thumbnail
                    || null;
                  
                  return (
                    <div
                      key={variantId || index}
                      className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 p-4 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start gap-4">
                        {/* Rank badge */}
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md ${
                            index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
                            index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                            index === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-400' :
                            'bg-gradient-to-br from-amber-400 to-orange-400'
                          }`}>
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                          </div>
                        </div>

                        {/* Product image */}
                        <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border-2 border-amber-200">
                          {image ? (
                            <img
                              src={image}
                              alt={productName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Nếu ảnh lỗi, ẩn img và hiển thị placeholder
                                e.target.style.display = 'none';
                                const placeholder = e.target.nextElementSibling;
                                if (placeholder) placeholder.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className={`w-full h-full flex items-center justify-center text-gray-400 text-xl ${image ? 'hidden' : ''}`}
                            style={{ display: image ? 'none' : 'flex' }}
                          >
                            📦
                          </div>
                        </div>

                        {/* Product info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 text-sm mb-1 truncate">
                            {productName}
                          </h4>
                          {variantName && (
                            <p className="text-xs text-gray-600 mb-2 truncate">
                              {variantName}
                            </p>
                          )}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">Đã bán:</span>
                              <span className="text-sm font-bold text-amber-600">
                                {totalSold.toLocaleString('vi-VN')} sản phẩm
                              </span>
                            </div>
                            {revenue > 0 && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-600">Doanh thu:</span>
                                <span className="text-sm font-bold text-green-600">
                                  {formatPrice(revenue)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Thao tác nhanh */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mt-12">
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
                  
                  // Order không có tên khách hàng
                  
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
