import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useSWR, { useSWRConfig } from 'swr';
import StoreLayout from '../../layouts/StoreLayout';
import { useStoreContext } from '../../context/StoreContext';
import StoreStatusGuard from '../../components/store/StoreStatusGuard';
import StorePageHeader from '../../components/store/StorePageHeader';
import { getStoreOrders, confirmOrder, shipOrder, deliverOrder } from '../../services/b2c/b2cOrderService';
import { getOrderStatusAnalytics } from '../../services/b2c/b2cAnalyticsService';
import { useToast } from '../../context/ToastContext';
import { confirmAction } from '../../utils/sweetalert';

const StoreOrders = () => {
  const { currentStore, loading: storeLoading } = useStoreContext();
  const { success, error: showError } = useToast();
  const [statusFilter, setStatusFilter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0); // ✅ 0-based pagination (page starts from 0)
  const pageSize = 20;
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
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
        success(result.message || 'Xác nhận đơn hàng thành công!');
        
        // ✅ Refresh cả orders và analytics với revalidate
        // Invalidate tất cả queries liên quan đến orders
        await Promise.all([
          mutate(undefined, { revalidate: true }), // Force refresh orders list hiện tại
          mutateAnalytics(undefined, { revalidate: true }), // Force refresh analytics
        ]);
        
        // Invalidate tất cả store-orders và order-detail queries bằng cách mutate với matcher
        globalMutate(
          (key) => {
            if (Array.isArray(key)) {
              return key[0] === 'store-orders' || key[0] === 'store-order-detail';
            }
            return false;
          },
          undefined,
          { revalidate: true }
        );
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

  // ✅ Debug: Log order structure để xem backend trả về gì
  if (orders.length > 0) {
    console.log('📦 [StoreOrders] Sample order structure:', {
      orderId: orders[0].id,
      shippingAddress: orders[0].shippingAddress,
      allKeys: Object.keys(orders[0]),
    });
  }

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
                
                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg">📦</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Tổng đơn hàng</p>
                        <p className="text-xl font-bold text-gray-900">{totalElements}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg">⏳</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Chờ xác nhận</p>
                        <p className="text-xl font-bold text-gray-900">{displayAnalytics.pending}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg">✅</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Đã xác nhận</p>
                        <p className="text-xl font-bold text-gray-900">{displayAnalytics.confirmed}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg">🚚</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Đang giao</p>
                        <p className="text-xl font-bold text-gray-900">{displayAnalytics.shipping}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg">✅</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Đã giao</p>
                        <p className="text-xl font-bold text-gray-900">{displayAnalytics.delivered}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg">❌</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Đã hủy</p>
                        <p className="text-xl font-bold text-gray-900">{displayAnalytics.cancelled}</p>
                      </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredOrders.map((order) => {
                const badge = getStatusBadge(order.status);
                return (
                  <div 
                    key={order.id} 
                    className="group bg-white rounded-2xl border-2 border-gray-200 p-6 hover:shadow-2xl hover:border-purple-300 transition-all duration-300 transform hover:-translate-y-1"
                  >
                    {/* Order Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900">
                              #{order.orderNumber || order.id.slice(-8)}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {formatDate(order.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${badge.bg} ${badge.text}`}>
                        <span className="text-base">{badge.icon}</span>
                        <span>{badge.label}</span>
                      </span>
                    </div>

                    {/* Customer Info */}
                    <div className="mb-4 pb-4 border-b-2 border-gray-100">
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span className="font-medium text-gray-900 truncate">
                          {order.shippingAddress?.suggestedName || 
                           order.shippingAddress?.recipientName || 
                           order.shippingAddress?.fullName || 
                           order.shippingAddress?.name || 
                           'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <span className="text-gray-600 truncate">{order.shippingAddress?.phone || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          <span>{order.items?.length || 0} sản phẩm</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 uppercase font-semibold">Tổng tiền</span>
                        <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {formatPrice(parseFloat(order.totalPrice) || order.totalAmount || 0)}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 items-center">
                      {/* View Details - Always shown */}
                      <Link
                        to={`/store-dashboard/orders/${order.id}`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105 font-medium text-sm h-[42px]"
                        title="Xem chi tiết"
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span className="whitespace-nowrap">Chi tiết</span>
                      </Link>

                      {/* Next Stage Action Button - CHỈ hiển thị khi CHƯA DELIVERED */}
                      {order.status === 'PENDING' && (
                        <button
                          onClick={() => handleConfirmOrder(order.id)}
                          disabled={updatingOrderId === order.id}
                          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-xl hover:from-yellow-500 hover:to-yellow-600 transition-all shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-medium text-sm h-[42px] whitespace-nowrap"
                          title="Xác nhận đơn hàng"
                        >
                          {updatingOrderId === order.id ? (
                            <svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <>
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Xác nhận</span>
                            </>
                          )}
                        </button>
                      )}

                      {order.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleShipOrder(order.id)}
                          disabled={updatingOrderId === order.id}
                          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-medium text-sm h-[42px] whitespace-nowrap"
                          title="Bắt đầu giao hàng"
                        >
                          {updatingOrderId === order.id ? (
                            <svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <>
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                              <span>Giao hàng</span>
                            </>
                          )}
                        </button>
                      )}

                      {order.status === 'SHIPPING' && (
                        <button
                          onClick={() => handleDeliverOrder(order.id)}
                          disabled={updatingOrderId === order.id}
                          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-medium text-sm h-[42px] whitespace-nowrap"
                          title="Xác nhận đã giao"
                        >
                          {updatingOrderId === order.id ? (
                            <svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <>
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Hoàn tất</span>
                            </>
                          )}
                        </button>
                      )}
                      
                      {/* DELIVERED và CANCELLED: Không có action button, chỉ có View Details */}
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
        </div>
      </StoreLayout>
    </StoreStatusGuard>
  );
};

export default StoreOrders;
