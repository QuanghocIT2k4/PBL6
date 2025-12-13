import React, { useState } from 'react';
import useSWR from 'swr';
import { Link } from 'react-router-dom';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import NotificationContainer from '../../components/notifications/NotificationContainer';
import { getPendingStores } from '../../services/admin/adminStoreService';
import { getPendingProducts } from '../../services/admin/adminProductService';
import { getPendingVariants } from '../../services/admin/adminVariantService';
import { getAllUsers } from '../../services/admin/adminUserService';
import { getAllPromotions } from '../../services/admin/adminPromotionService';
import { getOverviewStatistics, getRevenueStatistics } from '../../services/admin/adminStatisticsService';

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

  const { data: overviewStats } = useSWR(
    'admin-overview-statistics',
    () => getOverviewStatistics(),
    { revalidateOnFocus: false }
  );

  const { data: revenueStats } = useSWR(
    'admin-revenue-statistics',
    () => getRevenueStatistics(),
    { revalidateOnFocus: false }
  );

  // Debug logging
  React.useEffect(() => {
    console.log('📊 [AdminDashboard] pendingStoresData:', pendingStoresData);
    console.log('📊 [AdminDashboard] pendingProductsData:', pendingProductsData);
    console.log('📊 [AdminDashboard] pendingVariantsData:', pendingVariantsData);
    console.log('📊 [AdminDashboard] usersData:', usersData);
    console.log('📊 [AdminDashboard] promotionsData:', promotionsData);
    console.log('📊 [AdminDashboard] overviewStats:', overviewStats);
    console.log('📊 [AdminDashboard] revenueStats:', revenueStats);
  }, [pendingStoresData, pendingProductsData, pendingVariantsData, usersData, promotionsData, overviewStats, revenueStats]);

  // Parse counts từ API - ưu tiên overviewStats nếu có
  const parseCount = (data, key) => {
    if (!data) return null;
    const dataObj = data.data || data;
    return dataObj[key] || dataObj.totalElements || dataObj.total || dataObj.count || null;
  };

  // Ưu tiên dùng overviewStats, fallback sang API riêng lẻ
  const overview = overviewStats?.success ? overviewStats.data : {};
  
  // Parse với nhiều key có thể có
  const pendingStoresCount = 
    overview.pendingStores || 
    overview.pendingStoresCount || 
    overview.totalPendingStores ||
    parseCount(pendingStoresData, 'totalElements') || 
    0;
    
  const pendingProductsCount = 
    overview.pendingProducts || 
    overview.pendingProductsCount || 
    overview.totalPendingProducts ||
    parseCount(pendingProductsData, 'totalElements') || 
    0;
    
  const pendingVariantsCount = 
    overview.pendingVariants || 
    overview.pendingVariantsCount || 
    overview.totalPendingVariants ||
    parseCount(pendingVariantsData, 'totalElements') || 
    0;
    
  const totalUsersCount = 
    overview.totalUsers || 
    overview.usersCount || 
    overview.users ||
    parseCount(usersData, 'totalElements') || 
    0;
    
  const totalPromotionsCount = 
    overview.totalPromotions || 
    overview.promotionsCount || 
    overview.promotions ||
    parseCount(promotionsData, 'totalElements') || 
    0;
  
  // Parse revenue data - ưu tiên revenueStats, fallback sang overviewStats
  // Dùng đúng key như trong AdminRevenue.jsx
  const revenueData = revenueStats?.success ? revenueStats.data : {};
  const overviewRevenue = overviewStats?.success ? overviewStats.data : {};
  
  // Key đúng: totalServiceFee (không phải totalServiceFees)
  const totalServiceFee = revenueData.totalServiceFee || revenueData.totalServiceFees || revenueData.serviceFees || overviewRevenue.totalServiceFee || overviewRevenue.totalServiceFees || overviewRevenue.serviceFees || 0;
  
  // Key đúng: totalPlatformDiscountLoss (không phải totalDiscountLoss)
  const totalPlatformDiscountLoss = revenueData.totalPlatformDiscountLoss || revenueData.totalDiscountLoss || revenueData.discountLoss || overviewRevenue.totalPlatformDiscountLoss || overviewRevenue.totalDiscountLoss || overviewRevenue.discountLoss || 0;
  
  // Net Revenue = Service Fee - Discount Loss (tính toán như trong AdminRevenue)
  const netRevenue = revenueData.netRevenue || revenueData.net || (totalServiceFee - totalPlatformDiscountLoss) || overviewRevenue.netRevenue || overviewRevenue.net || 0;
  
  // Dùng tên biến giống AdminRevenue để dễ maintain
  const totalServiceFees = totalServiceFee;
  const totalDiscountLoss = totalPlatformDiscountLoss;

  return (
    <div className="space-y-6">
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
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Thao tác nhanh</h2>
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

        {/* Revenue Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Service Fees */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <span className="text-2xl">💰</span>
              </div>
              <span className="text-sm font-medium opacity-90">Phí Dịch Vụ</span>
            </div>
            <div className="text-3xl font-bold mb-2">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalServiceFees)}
            </div>
            <div className="text-sm opacity-90">
              Thu từ shop
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
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalDiscountLoss)}
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
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(netRevenue)}
            </div>
            <div className="text-sm opacity-90">
              = Phí DV - Lỗ GG
            </div>
          </div>
        </div>
    </div>
  );
};

export default AdminDashboard;
