import React, { useState } from 'react';
import useSWR from 'swr';
import { Link } from 'react-router-dom';
import { getPendingStores } from '../../services/admin/adminStoreService';
import { getPendingProducts } from '../../services/admin/adminProductService';
import { getPendingVariants } from '../../services/admin/adminVariantService';
import { getAllUsers } from '../../services/admin/adminUserService';
import { getAllPromotions } from '../../services/admin/adminPromotionService';

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

  const pendingStoresCount = pendingStoresData?.data?.totalElements || 0;
  const pendingProductsCount = pendingProductsData?.data?.totalElements || 0;
  const pendingVariantsCount = pendingVariantsData?.data?.totalElements || 0;
  const totalUsersCount = usersData?.data?.totalElements || 0;
  const totalPromotionsCount = promotionsData?.data?.totalElements || 0;

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-100 to-gray-100 rounded-2xl p-6">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-4xl">👑</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  <span className="text-slate-700">Admin</span> <span className="text-slate-600">Dashboard</span>
                </h1>
                <p className="text-gray-600 text-base">Tổng quan hệ thống E-Commerce</p>
              </div>
            </div>
          </div>
        </div>

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

        {/* System Info */}
        <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border-2 border-gray-200 p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-slate-700 rounded-xl flex items-center justify-center">
              <span className="text-3xl">⚙️</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Thông tin hệ thống</h2>
              <p className="text-gray-600">E-Commerce Platform Admin Panel</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Tổng cửa hàng chờ duyệt</p>
              <p className="text-3xl font-bold text-yellow-600">{pendingStoresCount}</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Tổng sản phẩm chờ duyệt</p>
              <p className="text-3xl font-bold text-blue-600">{pendingProductsCount + pendingVariantsCount}</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Tổng người dùng</p>
              <p className="text-3xl font-bold text-purple-600">{totalUsersCount}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
