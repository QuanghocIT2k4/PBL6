import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useSWR, { useSWRConfig } from 'swr';
import StoreLayout from '../../layouts/StoreLayout';
import { useStoreContext } from '../../context/StoreContext';
import StoreStatusGuard from '../../components/store/StoreStatusGuard';
import StorePageHeader from '../../components/store/StorePageHeader';
import { getStoreOrders, getStoreOrderById, confirmOrder, shipOrder, deliverOrder } from '../../services/b2c/b2cOrderService';
import { getShipmentByOrderId, updateShipmentStatus } from '../../services/b2c/shipmentService';
import { getOrderStatusAnalytics } from '../../services/b2c/b2cAnalyticsService';
import { useToast } from '../../context/ToastContext';
import { confirmAction } from '../../utils/sweetalert';

const StoreOrders = () => {
  const navigate = useNavigate();
  const { currentStore, loading: storeLoading } = useStoreContext();
  const { success, error: showError } = useToast();
  const [statusFilter, setStatusFilter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0); // ✅ 0-based pagination (page starts from 0)
  const pageSize = 20;
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const { mutate: globalMutate } = useSWRConfig();

  // Handle order status updates
  const handleConfirmOrder = async (orderId) => {
    if (!currentStore?.id) {
      showError('Không tìm thấy thông tin cửa hàng');
      return;
    }

    const confirmed = await confirmAction('xác nhận đơn hàng này');
    if (!confirmed) return;
    
    setUpdatingOrderId(orderId);
    try {
      const result = await confirmOrder(orderId, currentStore.id);
      if (result.success) {
        success(result.message || 'Xác nhận đơn hàng thành công! Vận đơn sẽ được tạo tự động.');
        
        // ✅ Refresh cả orders và analytics với revalidate
        // Invalidate tất cả queries liên quan đến orders
        await Promise.all([
          mutate(undefined, { revalidate: true }), // Force refresh orders list hiện tại
          mutateAnalytics(undefined, { revalidate: true }), // Force refresh analytics
        ]);
        
        console.log('🔄 [StoreOrders] Invalidating shipments cache after confirm order...');
        
        // ⚠️ LƯU Ý: Backend KHÔNG tự động tạo shipment khi confirm order
        // Shipment sẽ được tạo khi shipper pickup hoặc cần backend sửa để tự động tạo
        // Tạm thời: Chỉ invalidate cache, không retry tìm shipment
        
        // ✅ Invalidate tất cả store-orders, order-detail, shipments và shipper queries
        globalMutate(
          (key) => {
            if (Array.isArray(key)) {
              const keyName = key[0];
              return (
                keyName === 'store-orders' || 
                keyName === 'store-order-detail' ||
                keyName === 'store-shipments' || // ✅ Invalidate shipments để StoreShipments tự refresh
                keyName === 'store-shipments-stats' || // ✅ Invalidate stats để stats được cập nhật
                keyName === 'shipper-picking-up' || // ✅ Invalidate shipper để ShipperDashboard tự refresh
                keyName === 'shipper-history'
              );
            }
            return false;
          },
          undefined,
          { revalidate: true }
        );
        
        // ✅ Retry refresh shipments sau 2 giây (để đảm bảo backend đã tạo shipment)
        setTimeout(() => {
          console.log('🔄 [StoreOrders] Retry refresh shipments (2s)...');
          globalMutate(
            (key) => {
              if (Array.isArray(key) && (key[0] === 'store-shipments' || key[0] === 'store-shipments-stats')) {
                return true;
              }
              return false;
            },
            undefined,
            { revalidate: true }
          );
        }, 2000);
      } else {
        showError(result.error || 'Không thể xác nhận đơn hàng');
      }
    } catch (err) {
      console.error('Error confirming order:', err);
      showError('Có lỗi xảy ra khi xác nhận đơn hàng');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleShipOrder = async (orderId) => {
    if (!currentStore?.id) {
      showError('Không tìm thấy thông tin cửa hàng');
      return;
    }

    const confirmed = await confirmAction('chuyển đơn hàng sang trạng thái đang giao');
    if (!confirmed) return;
    
    setUpdatingOrderId(orderId);
    try {
      const result = await shipOrder(orderId, currentStore.id);
      if (result.success) {
        success(result.message || 'Đơn hàng đã chuyển sang trạng thái đang giao!');
        
        // ✅ Refresh cả orders và analytics với revalidate
        mutate(undefined, { revalidate: true }); // Force refresh orders list hiện tại
        mutateAnalytics(undefined, { revalidate: true }); // Force refresh analytics
        
        // Invalidate tất cả store-orders và order-detail queries
        const cacheKeys = Array.from(globalMutate.keys?.() || []);
        for (const key of cacheKeys) {
          if (Array.isArray(key) && (key[0] === 'store-orders' || key[0] === 'store-order-detail')) {
            globalMutate(key, undefined, { revalidate: true });
          }
        }
      } else {
        showError(result.error || 'Không thể cập nhật trạng thái giao hàng');
      }
    } catch (err) {
      console.error('Error shipping order:', err);
      showError('Có lỗi xảy ra khi cập nhật trạng thái giao hàng');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleDeliverOrder = async (orderId) => {
    if (!currentStore?.id) {
      showError('Không tìm thấy thông tin cửa hàng');
      return;
    }

    const confirmed = await confirmAction('xác nhận đơn hàng đã giao thành công');
    if (!confirmed) return;
    
    setUpdatingOrderId(orderId);
    try {
      const result = await deliverOrder(orderId, currentStore.id);
      if (result.success) {
        success(result.message || 'Đơn hàng đã được giao thành công!');
        
        // ✅ Refresh cả orders và analytics với revalidate
        mutate(undefined, { revalidate: true }); // Force refresh orders list hiện tại
        mutateAnalytics(undefined, { revalidate: true }); // Force refresh analytics
        
        // Invalidate tất cả store-orders và order-detail queries
        const cacheKeys = Array.from(globalMutate.keys?.() || []);
        for (const key of cacheKeys) {
          if (Array.isArray(key) && (key[0] === 'store-orders' || key[0] === 'store-order-detail')) {
            globalMutate(key, undefined, { revalidate: true });
          }
        }
      } else {
        showError(result.error || 'Không thể hoàn tất giao hàng');
      }
    } catch (err) {
      console.error('Error delivering order:', err);
      showError('Có lỗi xảy ra khi hoàn tất giao hàng');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // ✅ Fetch order status analytics
  const { data: statusAnalytics, mutate: mutateAnalytics } = useSWR(
    currentStore?.id ? ['order-status-analytics', currentStore.id] : null,
    () => getOrderStatusAnalytics(currentStore.id),
    { 
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000, // Cache 2s để tránh request quá nhiều
    }
  );

  const analytics = statusAnalytics?.success ? statusAnalytics.data : null;

  // ✅ Fetch orders từ API với filter
  const { data: ordersData, error, isLoading, mutate } = useSWR(
    currentStore?.id ? ['store-orders', currentStore.id, statusFilter, currentPage] : null,
    () => {
      // ✅ Đảm bảo storeId tồn tại trước khi gọi API
      if (!currentStore?.id) {
        console.error('❌ [StoreOrders] storeId is missing:', currentStore);
        return { success: false, error: 'storeId is required' };
      }
      
      console.log('📦 [StoreOrders] Current page state:', currentPage, 'type:', typeof currentPage);
      console.log('📦 [StoreOrders] Fetching orders with params:', {
        storeId: currentStore.id,
        page: currentPage,
        size: pageSize,
        sortBy: 'createdAt',
        sortDir: 'desc',
        status: statusFilter
      });
      
      return getStoreOrders({
        storeId: currentStore.id,
        page: currentPage,
        size: pageSize,
        sortBy: 'createdAt',
        sortDir: 'desc',
        status: statusFilter
      });
    },
    { 
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000, // Cache 2s để tránh request quá nhiều
    }
  );

  const orders = ordersData?.success ? (ordersData.data?.content || ordersData.data || []) : [];
  const totalPages = ordersData?.data?.totalPages || 0;
  const totalElements = ordersData?.data?.totalElements || 0;

  // Filter by search term (client-side)
  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      order.orderNumber?.toLowerCase().includes(searchLower) ||
      order.shippingAddress?.fullName?.toLowerCase().includes(searchLower) ||
      order.shippingAddress?.phone?.includes(searchTerm) ||
      order.id?.toLowerCase().includes(searchLower)
    );
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Chờ xác nhận', icon: '⏳' },
      CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Đã xác nhận', icon: '✅' },
      SHIPPING: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Đang giao', icon: '🚚' },
      DELIVERED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã giao', icon: '📦' },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Đã hủy', icon: '❌' }
    };
    return badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status, icon: '📋' };
  };

  // ✅ Tính toán status counts từ orders hiện tại (fallback nếu analytics chưa có)
  const statusCounts = {
    ALL: totalElements,
    PENDING: orders.filter(o => o.status === 'PENDING').length,
    CONFIRMED: orders.filter(o => o.status === 'CONFIRMED').length,
    SHIPPING: orders.filter(o => o.status === 'SHIPPING').length,
    DELIVERED: orders.filter(o => o.status === 'DELIVERED').length,
    CANCELLED: orders.filter(o => o.status === 'CANCELLED').length
  };

  // ✅ Ưu tiên dùng analytics từ API, fallback về tính từ orders hiện tại
  // Nếu analytics có và đang ở trang 1 (toàn bộ orders), dùng analytics
  // Nếu không, tính từ orders hiện tại
  const displayAnalytics = {
    pending: analytics?.pending ?? statusCounts.PENDING,
    confirmed: analytics?.confirmed ?? statusCounts.CONFIRMED,
    shipping: analytics?.shipping ?? statusCounts.SHIPPING,
    delivered: analytics?.delivered ?? statusCounts.DELIVERED,
    cancelled: analytics?.cancelled ?? statusCounts.CANCELLED,
  };

  return (
    <StoreStatusGuard currentStore={currentStore} pageName="quản lý đơn hàng" loading={storeLoading}>
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold">
                        <span className="text-cyan-600">Quản lý</span> <span className="text-blue-600">đơn hàng</span>
                      </h1>
                      <p className="text-gray-600 mt-1">Quản lý danh sách đơn hàng của cửa hàng</p>
                    </div>
                  </div>
                </div>
                
                {/* Stats Cards - Vertical Layout */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
                  {/* Tổng đơn hàng */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-gray-200 hover:shadow-md transition-all">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl flex items-center justify-center shadow-sm mb-2">
                        <span className="text-2xl">📦</span>
                      </div>
                      <p className="text-xs font-medium text-gray-600 mb-1 whitespace-nowrap">Tổng đơn hàng</p>
                      <p className="text-2xl font-bold text-gray-900">{totalElements}</p>
                    </div>
                  </div>

                  {/* Chờ xác nhận */}
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border-2 border-yellow-200 hover:shadow-md transition-all">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-sm mb-2">
                        <span className="text-2xl">⏳</span>
                      </div>
                      <p className="text-xs font-medium text-gray-600 mb-1 whitespace-nowrap">Chờ xác nhận</p>
                      <p className="text-2xl font-bold text-yellow-700">{displayAnalytics.pending}</p>
                    </div>
                  </div>

                  {/* Đã xác nhận */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200 hover:shadow-md transition-all">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center shadow-sm mb-2">
                        <span className="text-2xl">✅</span>
                      </div>
                      <p className="text-xs font-medium text-gray-600 mb-1 whitespace-nowrap">Đã xác nhận</p>
                      <p className="text-2xl font-bold text-blue-700">{displayAnalytics.confirmed}</p>
                    </div>
                  </div>

                  {/* Đang giao */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200 hover:shadow-md transition-all">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-500 rounded-xl flex items-center justify-center shadow-sm mb-2">
                        <span className="text-2xl">🚚</span>
                      </div>
                      <p className="text-xs font-medium text-gray-600 mb-1 whitespace-nowrap">Đang giao</p>
                      <p className="text-2xl font-bold text-purple-700">{displayAnalytics.shipping}</p>
                    </div>
                  </div>

                  {/* Đã giao */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200 hover:shadow-md transition-all">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-xl flex items-center justify-center shadow-sm mb-2">
                        <span className="text-2xl">📦</span>
                      </div>
                      <p className="text-xs font-medium text-gray-600 mb-1 whitespace-nowrap">Đã giao</p>
                      <p className="text-2xl font-bold text-green-700">{displayAnalytics.delivered}</p>
                    </div>
                  </div>

                  {/* Đã hủy */}
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border-2 border-red-200 hover:shadow-md transition-all">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-500 rounded-xl flex items-center justify-center shadow-sm mb-2">
                        <span className="text-2xl">❌</span>
                      </div>
                      <p className="text-xs font-medium text-gray-600 mb-1 whitespace-nowrap">Đã hủy</p>
                      <p className="text-2xl font-bold text-red-700">{displayAnalytics.cancelled}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm đơn hàng theo mã, tên khách hàng, số điện thoại..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:shadow-md"
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                <select
                  value={statusFilter || 'ALL'}
                  onChange={(e) => {
                    setStatusFilter(e.target.value === 'ALL' ? null : e.target.value);
                    setCurrentPage(0); // Reset về trang đầu
                  }}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:shadow-md appearance-none bg-white cursor-pointer"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="PENDING">Chờ xác nhận</option>
                  <option value="CONFIRMED">Đã xác nhận</option>
                  <option value="SHIPPING">Đang giao</option>
                  <option value="DELIVERED">Đã giao</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>
            </div>
          </div>

          {/* Orders Grid */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-600">Đang tải đơn hàng...</p>
              <p className="text-sm text-gray-400">Backend có thể mất 30-60s để khởi động (cold start)</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <p>Không thể tải danh sách đơn hàng</p>
              <button
                onClick={() => mutate()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Thử lại
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">Không có đơn hàng nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredOrders.map((order) => {
                const badge = getStatusBadge(order.status);
                // ⚠️ Backend chỉ trả về buyer.username, không có fullName
                // TODO: Yêu cầu backend bổ sung buyerName vào order response
                const customerName = order.shippingAddress?.recipientName ||
                                   order.shippingAddress?.fullName || 
                                   order.shippingAddress?.name ||
                                   order.buyer?.username ||  // Tạm dùng username
                                   'Khách hàng';
                
                return (
                  <div 
                    key={order.id} 
                    className="bg-white rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl transition-all duration-200 overflow-hidden aspect-square flex flex-col"
                  >
                    {/* Header with Status */}
                    <div className={`px-4 py-3 ${badge.bg} border-b-2 border-gray-100`}>
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${badge.text}`}>
                          <span className="text-lg">{badge.icon}</span>
                          {badge.label}
                        </span>
                        <span className="text-xs text-gray-600 font-medium">
                          {new Date(order.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 flex flex-col justify-between p-4">
                      {/* Customer Name */}
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{customerName}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      {/* Total Amount */}
                      <div className="mt-auto pt-3 border-t border-gray-100">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-gray-500 font-medium">Tổng tiền:</span>
                          <span className="text-base font-bold text-blue-600">
                            {formatPrice(parseFloat(order.totalPrice) || order.totalAmount || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-4 pb-4 flex gap-2">
                      <button
                        onClick={() => navigate(`/store-dashboard/orders/${order.id}`)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Chi tiết
                      </button>
                      
                      {/* Nút Xem vận đơn - chỉ hiển thị khi đã xác nhận */}
                      {(order.status === 'CONFIRMED' || order.status === 'SHIPPING' || order.status === 'DELIVERED') && (
                        <button
                          onClick={() => navigate('/store-dashboard/shipments')}
                          className="w-10 h-10 flex items-center justify-center bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                          title="Xem vận đơn"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                          </svg>
                        </button>
                      )}

                      {order.status === 'PENDING' && (
                        <button
                          onClick={() => handleConfirmOrder(order.id)}
                          disabled={updatingOrderId === order.id}
                          className="w-10 h-10 flex items-center justify-center bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
                          title="Xác nhận đơn hàng"
                        >
                          {updatingOrderId === order.id ? (
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      )}

                      {order.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleShipOrder(order.id)}
                          disabled={updatingOrderId === order.id}
                          className="w-10 h-10 flex items-center justify-center bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                          title="Bắt đầu giao hàng"
                        >
                          {updatingOrderId === order.id ? (
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          )}
                        </button>
                      )}

                      {order.status === 'SHIPPING' && (
                        <button
                          onClick={() => handleDeliverOrder(order.id)}
                          disabled={updatingOrderId === order.id}
                          className="w-10 h-10 flex items-center justify-center bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                          title="Hoàn tất giao hàng"
                        >
                          {updatingOrderId === order.id ? (
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && !error && totalPages > 1 && (
            <div className="bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg border-2 border-gray-200 p-6 flex items-center justify-between">
              <div className="text-sm text-gray-700 font-medium">
                Trang <span className="text-blue-600 font-bold text-lg">{currentPage + 1}</span> / <span className="text-gray-600 font-bold text-lg">{totalPages}</span>
                <span className="ml-4 text-gray-500">({totalElements} đơn hàng)</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-blue-500 hover:text-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-700 font-medium shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Trước
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-blue-500 hover:text-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-700 font-medium shadow-sm hover:shadow-md"
                >
                  Sau
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Order Detail Modal */}
          {selectedOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
              <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
                  <h2 className="text-xl font-bold">Chi tiết đơn hàng</h2>
                  <button onClick={() => setSelectedOrder(null)} className="text-white hover:text-gray-200">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ${getStatusBadge(selectedOrder.status).bg} ${getStatusBadge(selectedOrder.status).text}`}>
                      <span className="text-xl">{getStatusBadge(selectedOrder.status).icon}</span>
                      {getStatusBadge(selectedOrder.status).label}
                    </span>
                    <span className="text-sm text-gray-600">
                      {formatDate(selectedOrder.createdAt)}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Thông tin khách hàng
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tên:</span>
                        <span className="font-medium text-gray-900">
                          {selectedOrder.shippingAddress?.recipientName || 
                           selectedOrder.shippingAddress?.fullName || 
                           selectedOrder.buyer?.fullName || 
                           'Khách hàng'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Số điện thoại:</span>
                        <span className="font-medium text-gray-900">
                          {selectedOrder.shippingAddress?.phone || 
                           selectedOrder.buyer?.phone || 
                           'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-gray-600">Địa chỉ:</span>
                        <span className="font-medium text-gray-900 text-right max-w-xs break-words">
                          {selectedOrder.shippingAddress?.addressDetail || 
                           selectedOrder.shippingAddress?.address || 
                           selectedOrder.shippingAddress?.fullAddress ||
                           selectedOrder.shippingAddress?.street ||
                           [
                             selectedOrder.shippingAddress?.district,
                             selectedOrder.shippingAddress?.city,
                             selectedOrder.shippingAddress?.province
                           ].filter(Boolean).join(', ') ||
                           'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    {(() => {
                      const orderItems = selectedOrder.items || selectedOrder.orderItems || [];
                      return (
                        <>
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            Sản phẩm ({orderItems.length})
                          </h3>
                          <div className="space-y-3">
                            {orderItems.length > 0 ? (
                              orderItems.map((item, idx) => (
                                <div key={idx} className="flex gap-3 bg-gray-50 rounded-lg p-3">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">
                                      {item.productName || item.productVariantName || item.name || item.variantName || 'Sản phẩm'}
                                    </p>
                                    <p className="text-sm text-gray-600">Số lượng: {item.quantity || 1}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-blue-600">{formatPrice(item.price || item.unitPrice || 0)}</p>
                                    <p className="text-sm text-gray-600">× {item.quantity || 1}</p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-gray-500 text-sm text-center py-4">Không có thông tin sản phẩm</p>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Price Breakdown */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Thanh toán
                    </h3>
                    <div className="space-y-2">
                      {(() => {
                        const orderItems = selectedOrder.items || selectedOrder.orderItems || [];
                        const subtotal = orderItems.reduce((sum, item) => 
                          sum + (parseFloat(item.price || item.unitPrice || 0) * parseInt(item.quantity || 0)), 0
                        );
                        const shippingFee = parseFloat(selectedOrder.shippingFee || selectedOrder.shippingCost || 30000);
                        const discount = parseFloat(selectedOrder.discount || selectedOrder.discountAmount || 0);
                        const totalPrice = parseFloat(selectedOrder.totalPrice) || selectedOrder.totalAmount || (subtotal + shippingFee - discount);

                        return (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Tạm tính ({orderItems.length} sản phẩm):</span>
                              <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
                            </div>
                            
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Phí vận chuyển:</span>
                              <span className="font-medium text-gray-900">{formatPrice(shippingFee)}</span>
                            </div>
                            
                            {discount > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Giảm giá:</span>
                                <span className="font-medium text-red-600">-{formatPrice(discount)}</span>
                              </div>
                            )}
                            
                            <div className="border-t-2 border-blue-200 pt-2 mt-2">
                              <div className="flex justify-between items-center">
                                <span className="text-lg font-bold text-gray-900">Tổng cộng:</span>
                                <span className="text-2xl font-bold text-blue-600">{formatPrice(totalPrice)}</span>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 rounded-b-2xl border-t border-gray-200">
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Đóng
                  </button>
                  {selectedOrder.status === 'PENDING' && (
                    <button
                      onClick={() => {
                        handleConfirmOrder(selectedOrder.id);
                        setSelectedOrder(null);
                      }}
                      className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
                    >
                      Xác nhận đơn
                    </button>
                  )}
                  {selectedOrder.status === 'CONFIRMED' && (
                    <button
                      onClick={() => {
                        handleShipOrder(selectedOrder.id);
                        setSelectedOrder(null);
                      }}
                      className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
                    >
                      Bắt đầu giao hàng
                    </button>
                  )}
                  {selectedOrder.status === 'SHIPPING' && (
                    <button
                      onClick={() => {
                        handleDeliverOrder(selectedOrder.id);
                        setSelectedOrder(null);
                      }}
                      className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                    >
                      Hoàn tất giao hàng
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </StoreLayout>
    </StoreStatusGuard>
  );
};

export default StoreOrders;
