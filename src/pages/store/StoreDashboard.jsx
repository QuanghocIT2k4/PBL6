import React from 'react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import StoreLayout from '../../layouts/StoreLayout';
import StoreStatusGuard from '../../components/store/StoreStatusGuard';
import { useStoreContext } from '../../context/StoreContext';
import { getDashboardAnalytics } from '../../services/b2c/b2cAnalyticsService';
import { getStoreOrders } from '../../services/b2c/b2cOrderService';

const StoreDashboard = () => {
  const { currentStore, loading: storeLoading } = useStoreContext();
  
  // ✅ Fetch dashboard analytics từ API
  const { data: analyticsData, error: analyticsError, isLoading: analyticsLoading } = useSWR(
    currentStore?.id ? ['dashboard-analytics', currentStore.id] : null,
    () => getDashboardAnalytics(currentStore.id),
    { revalidateOnFocus: false }
  );

  // ✅ Fetch recent orders từ API
  const { data: ordersData, error: ordersError, isLoading: ordersLoading } = useSWR(
    currentStore?.id ? ['recent-orders', currentStore.id] : null,
    () => getStoreOrders({ page: 0, size: 5, sortBy: 'createdAt', sortDir: 'desc' }),
    { revalidateOnFocus: false }
  );

  const analytics = analyticsData?.success ? analyticsData.data : null;
  const recentOrders = ordersData?.success ? (ordersData.data?.content || ordersData.data || []) : [];
  
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
                {/* Doanh thu hôm nay */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 hover:shadow-lg transition-all flex flex-col justify-center p-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-400 rounded-xl flex items-center justify-center shadow-md mx-auto mb-3">
                      <span className="text-3xl">💰</span>
                    </div>
                    <div className="text-sm font-medium text-gray-600 mb-1">Doanh thu hôm nay</div>
                    <div className="text-xl font-bold text-gray-900 mb-1">
                      {formatPrice(analytics?.todayRevenue || 0)}
                    </div>
                    {analytics?.todayRevenueGrowth !== undefined && (
                      <div className={`text-xs font-medium ${analytics.todayRevenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatGrowth(analytics.todayRevenueGrowth)}
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
                    <div className="text-xl font-bold text-gray-900 mb-1">
                      {analytics?.pendingOrders || 0}
                    </div>
                    <div className="text-xs text-blue-600 font-medium">+8 hôm nay</div>
                  </div>
                </div>

                {/* Sản phẩm đang bán */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 hover:shadow-lg transition-all flex flex-col justify-center p-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center shadow-md mx-auto mb-3">
                      <span className="text-3xl">📦</span>
                    </div>
                    <div className="text-sm font-medium text-gray-600 mb-1">Sản phẩm đang bán</div>
                    <div className="text-xl font-bold text-gray-900 mb-1">
                      {analytics?.activeProducts || 0}
                    </div>
                    <div className="text-xs text-purple-600 font-medium">+3 tuần</div>
                  </div>
                </div>

                {/* Khách hàng */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200 hover:shadow-lg transition-all flex flex-col justify-center p-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-400 rounded-xl flex items-center justify-center shadow-md mx-auto mb-3">
                      <span className="text-3xl">👥</span>
                    </div>
                    <div className="text-sm font-medium text-gray-600 mb-1">Khách hàng mới</div>
                    <div className="text-xl font-bold text-gray-900 mb-1">
                      {analytics?.totalCustomers || 0}
                    </div>
                    <div className="text-xs text-orange-600 font-medium">+15 tuần</div>
                  </div>
                </div>
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
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-sm">
                        <span className="text-white font-bold text-sm">
                          #{order.orderNumber?.slice(-4) || order.id.slice(-4)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {order.shippingAddress?.fullName || 'Khách hàng'}
                        </h4>
                        <p className="text-sm text-gray-600">{order.items?.length || 0} sản phẩm</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-lg mb-1">
                        {formatPrice(parseFloat(order.totalPrice) || order.totalAmount || 0)}
                      </p>
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
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
                ))}
              </div>
            )}
          </div>
        </div>
      </StoreLayout>
    </StoreStatusGuard>
  );
};

export default StoreDashboard;
