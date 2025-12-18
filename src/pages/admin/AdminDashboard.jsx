import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Link } from 'react-router-dom';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import NotificationContainer from '../../components/notifications/NotificationContainer';
import { getPendingStores } from '../../services/admin/adminStoreService';
import { getPendingProducts } from '../../services/admin/adminProductService';
import { getPendingVariants } from '../../services/admin/adminVariantService';
import { getAllUsers } from '../../services/admin/adminUserService';
import { getAllPromotions } from '../../services/admin/adminPromotionService';
import { 
  getOverviewStatistics, 
  getRevenueStatistics,
  formatCurrency 
} from '../../services/admin/adminStatisticsService';
import { getShipperStatistics } from '../../services/admin/adminShipperService';
import Chart from '../../components/charts/Chart';

const AdminDashboard = () => {
  // Fetch summary data
  const { data: pendingStoresData } = useSWR(
    'admin-pending-stores-count',
    () => getPendingStores({ page: 0, size: 1 }),
    { revalidateOnFocus: false }
  );

  const { data: pendingProductsData } = useSWR(
    'admin-pending-products-count',
    () => getPendingProducts({ page: 0, size: 1 }),
    { revalidateOnFocus: false }
  );

  const { data: pendingVariantsData } = useSWR(
    'admin-pending-variants-count',
    () => getPendingVariants({ page: 0, size: 1 }),
    { revalidateOnFocus: false }
  );

  const { data: usersData } = useSWR(
    'admin-users-count',
    () => getAllUsers({ page: 0, size: 1 }),
    { revalidateOnFocus: false }
  );

  const { data: promotionsData } = useSWR(
    'admin-promotions-count',
    () => getAllPromotions({ page: 0, size: 1 }),
    { revalidateOnFocus: false }
  );

  // Fetch overview statistics
  const { data: overviewStats } = useSWR(
    'admin-overview-statistics',
    () => getOverviewStatistics(),
    { revalidateOnFocus: false }
  );

  // Fetch revenue statistics
  const { data: revenueStats } = useSWR(
    'admin-revenue-statistics',
    () => getRevenueStatistics(),
    { revalidateOnFocus: false }
  );

  // Fetch shipper statistics
  const { data: shipperStats } = useSWR(
    'admin-shipper-statistics',
    () => getShipperStatistics(),
    { revalidateOnFocus: false }
  );

  // Fetch all users to count by role
  const { data: allUsersData } = useSWR(
    'admin-all-users-for-stats',
    () => getAllUsers({ page: 0, size: 1000 }),
    { revalidateOnFocus: false }
  );

  // Parse counts with fallback logic
  const parseCount = (data, keys, fallback = 0) => {
    if (!data) return fallback;
    
    // Check overviewStats first
    if (overviewStats?.success && overviewStats?.data) {
      for (const key of keys) {
        if (overviewStats.data[key] !== undefined && overviewStats.data[key] !== null) {
          return overviewStats.data[key];
        }
      }
    }
    
    // Check individual API responses
    const response = data?.data || data;
    for (const key of keys) {
      if (response?.[key] !== undefined && response?.[key] !== null) {
        return response[key];
      }
    }
    
    // Check totalElements as fallback
    if (response?.totalElements !== undefined) {
      return response.totalElements;
    }
    
    return fallback;
  };

  const pendingStoresCount = parseCount(
    pendingStoresData, 
    ['pendingStores', 'pendingStoresCount', 'totalPendingStores', 'totalElements']
  );
  const pendingProductsCount = parseCount(
    pendingProductsData,
    ['pendingProducts', 'pendingProductsCount', 'totalPendingProducts', 'totalElements']
  );
  const pendingVariantsCount = parseCount(
    pendingVariantsData,
    ['pendingVariants', 'pendingVariantsCount', 'totalPendingVariants', 'totalElements']
  );
  const totalUsersCount = parseCount(
    usersData,
    ['totalUsers', 'usersCount', 'totalUsersCount', 'totalElements']
  );
  const totalPromotionsCount = parseCount(
    promotionsData,
    ['totalPromotions', 'promotionsCount', 'totalPromotionsCount', 'totalElements']
  );

  // Parse revenue data
  const parseRevenueValue = (keys, fallback = 0) => {
    // Check revenueStats first
    if (revenueStats?.success && revenueStats?.data) {
      for (const key of keys) {
        if (revenueStats.data[key] !== undefined && revenueStats.data[key] !== null) {
          return revenueStats.data[key];
        }
      }
    }
    
    // Check overviewStats as fallback
    if (overviewStats?.success && overviewStats?.data) {
      for (const key of keys) {
        if (overviewStats.data[key] !== undefined && overviewStats.data[key] !== null) {
          return overviewStats.data[key];
        }
      }
    }
    
    return fallback;
  };

  // 💰 Tổng hoa hồng nền tảng (ưu tiên field mới, fallback field cũ để tương thích)
  const totalServiceFee = parseRevenueValue(
    ['totalPlatformCommission', 'platformCommission', 'totalServiceFee', 'totalServiceFees', 'serviceFees']
  );
  const totalShippingFee = parseRevenueValue(
    ['totalShippingFee', 'shippingFee', 'totalShippingFees', 'shippingFees']
  );
  const totalPlatformDiscountLoss = parseRevenueValue(
    ['totalPlatformDiscountLoss', 'totalDiscountLoss', 'discountLoss', 'platformDiscountLoss']
  );
  const netRevenue = totalServiceFee + totalShippingFee - totalPlatformDiscountLoss;

  return (
    <div className="space-y-6">
      <style>{`
        .admin-quick-actions {
          background-color: #ffffff;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          padding: 24px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        }
        .admin-quick-actions h2 {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 24px;
        }
        .admin-user-distribution {
          background-color: #ffffff;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          padding: 24px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
          margin-bottom: 24px;
        }
        .admin-user-distribution h3 {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 16px;
        }
      `}</style>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Pending Stores */}
          <Link
            to="/admin-dashboard/stores"
            className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:shadow-xl transition-all hover:border-yellow-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <span className="text-3xl">🏪</span>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
                Chờ duyệt
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-2">Cửa hàng chờ duyệt</h3>
            <p className="text-4xl font-bold text-gray-900">{pendingStoresCount}</p>
            <p className="text-xs text-gray-500 mt-2">Cần xét duyệt</p>
          </Link>

          {/* Pending Products */}
          <Link
            to="/admin-dashboard/products"
            className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:shadow-xl transition-all hover:border-blue-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-3xl">📦</span>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                Chờ duyệt
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-2">Sản phẩm chờ duyệt</h3>
            <p className="text-4xl font-bold text-gray-900">{pendingProductsCount}</p>
            <p className="text-xs text-gray-500 mt-2">Cần xét duyệt</p>
          </Link>

          {/* Pending Variants */}
          <Link
            to="/admin-dashboard/products"
            className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:shadow-xl transition-all hover:border-indigo-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <span className="text-3xl">🎨</span>
              </div>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold">
                Chờ duyệt
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-2">Biến thể chờ duyệt</h3>
            <p className="text-4xl font-bold text-gray-900">{pendingVariantsCount}</p>
            <p className="text-xs text-gray-500 mt-2">Cần xét duyệt</p>
          </Link>

          {/* Total Users */}
          <Link
            to="/admin-dashboard/users"
            className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:shadow-xl transition-all hover:border-purple-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-3xl">👥</span>
              </div>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">
                Tổng số
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-2">Người dùng</h3>
            <p className="text-4xl font-bold text-gray-900">{totalUsersCount}</p>
            <p className="text-xs text-gray-500 mt-2">Đã đăng ký</p>
          </Link>

          {/* Total Promotions */}
          <Link
            to="/admin-dashboard/promotions"
            className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:shadow-xl transition-all hover:border-orange-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <span className="text-3xl">🎁</span>
              </div>
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold">
                Tổng số
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-2">Khuyến mãi</h3>
            <p className="text-4xl font-bold text-gray-900">{totalPromotionsCount}</p>
            <p className="text-xs text-gray-500 mt-2">Đã tạo</p>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="admin-quick-actions">
          <h2>Thao tác nhanh</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/admin-dashboard/stores"
              className="flex items-center gap-4 p-5 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl hover:shadow-lg transition-all border-2 border-transparent hover:border-yellow-300"
            >
              <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center">
                <span className="text-3xl">🏪</span>
              </div>
              <div>
                <p className="font-bold text-gray-900">Duyệt cửa hàng</p>
                <p className="text-sm text-gray-600">{pendingStoresCount} chờ duyệt</p>
              </div>
            </Link>

            <Link
              to="/admin-dashboard/products"
              className="flex items-center gap-4 p-5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-300"
            >
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-3xl">📦</span>
              </div>
              <div>
                <p className="font-bold text-gray-900">Duyệt sản phẩm</p>
                <p className="text-sm text-gray-600">{pendingProductsCount + pendingVariantsCount} chờ duyệt</p>
              </div>
            </Link>

            <Link
              to="/admin-dashboard/users"
              className="flex items-center gap-4 p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl hover:shadow-lg transition-all border-2 border-transparent hover:border-purple-300"
            >
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-3xl">👥</span>
              </div>
              <div>
                <p className="font-bold text-gray-900">Quản lý người dùng</p>
                <p className="text-sm text-gray-600">{totalUsersCount} người dùng</p>
              </div>
            </Link>

            <Link
              to="/admin-dashboard/promotions"
              className="flex items-center gap-4 p-5 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl hover:shadow-lg transition-all border-2 border-transparent hover:border-orange-300"
            >
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
                <span className="text-3xl">🎁</span>
              </div>
              <div>
                <p className="font-bold text-gray-900">Khuyến mãi</p>
                <p className="text-sm text-gray-600">{totalPromotionsCount} khuyến mãi</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Revenue Statistics Cards - Updated với shipping fees */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Service Fees / Platform Commission */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <span className="text-2xl">💰</span>
              </div>
              <span className="text-sm font-medium opacity-90">Hoa Hồng Nền Tảng</span>
            </div>
            <div className="text-3xl font-bold mb-2">
              {formatCurrency(totalServiceFee)}
            </div>
            <div className="text-sm opacity-90">
              Thu từ shop
            </div>
          </div>

          {/* Shipping Fees */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <span className="text-2xl">🚚</span>
              </div>
              <span className="text-sm font-medium opacity-90">Phí Vận Chuyển</span>
            </div>
            <div className="text-3xl font-bold mb-2">
              {formatCurrency(totalShippingFee)}
            </div>
            <div className="text-sm opacity-90">
              Thu từ đơn hàng
            </div>
          </div>

          {/* Platform Discount Loss */}
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <span className="text-2xl">📉</span>
              </div>
              <span className="text-sm font-medium opacity-90">Tiền Lỗ Giảm Giá</span>
            </div>
            <div className="text-3xl font-bold mb-2">
              {formatCurrency(totalPlatformDiscountLoss)}
            </div>
            <div className="text-sm opacity-90">
              Sàn chịu
            </div>
          </div>

          {/* Net Revenue */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <span className="text-2xl">📊</span>
              </div>
              <span className="text-sm font-medium opacity-90">Doanh Thu Ròng</span>
            </div>
            <div className="text-3xl font-bold mb-2">
              {formatCurrency(netRevenue)}
            </div>
            <div className="text-sm opacity-90">
              = HH + VC - Lỗ GG
            </div>
          </div>
        </div>

        {/* Overview Statistics Charts */}
        {overviewStats?.success && overviewStats.data && (() => {
          // Count users by role
          let adminCount = 0;
          let userCount = 0;
          const shipperCount = shipperStats?.data?.totalShippers || shipperStats?.data?.total || 0;
          
          if (allUsersData?.success && allUsersData.data) {
            const users = allUsersData.data.content || allUsersData.data.users || allUsersData.data || [];
            adminCount = users.filter(u => u.role === 'ADMIN' || u.roles?.includes('ADMIN')).length;
            userCount = users.filter(u => {
              const role = u.role || (u.roles && u.roles[0]);
              return role === 'USER' || role === 'BUYER' || (!role || (role !== 'ADMIN' && role !== 'SHIPPER'));
            }).length;
          } else {
            // Fallback: use overview stats
            adminCount = overviewStats.data.totalAdmins || overviewStats.data.admins || 0;
            userCount = (overviewStats.data.totalUsers || totalUsersCount) - adminCount - shipperCount;
          }
          
          return (
            <div className="admin-user-distribution">
              <h3>Phân bổ Người dùng</h3>
              <Chart
                data={[
                  { 
                    label: 'Quản trị viên', 
                    value: adminCount
                  },
                  { 
                    label: 'Người dùng', 
                    value: userCount
                  },
                  { 
                    label: 'Shipper', 
                    value: shipperCount
                  },
                ].filter(item => item.value > 0)}
                type="pie"
                height="500px"
                color="purple"
                showLegend={true}
              />
            </div>
          );
        })()}
    </div>
  );
};

export default AdminDashboard;
