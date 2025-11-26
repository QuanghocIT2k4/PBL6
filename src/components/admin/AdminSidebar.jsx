import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AdminNotifications from './AdminNotifications';
import { logout } from '../../services/common/authService';
import { useToast } from '../../context/ToastContext';

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { success: showSuccess } = useToast();
  const [showNotifications, setShowNotifications] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const result = await logout();
      if (result.success) {
        showSuccess('Đăng xuất thành công!');
        navigate('/auth');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Vẫn redirect về login dù có lỗi
      navigate('/auth');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <aside className="w-80 bg-gray-800 h-screen flex flex-col overflow-y-auto fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <Link to="/admin-dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">
            <span className="text-red-300">Admin</span>
            <span className="text-orange-300">Panel</span>
          </h1>
        </Link>
      </div>

      {/* Admin Info Section */}
      <div className="px-4 py-4 border-b border-gray-700">
        <div className="text-gray-300 text-xs space-y-1 mb-3">
          <p className="flex items-center gap-1">
            <span className="w-4 h-4 flex items-center justify-center leading-none">👤</span>
            <span>Admin User</span>
          </p>
          <p className="flex items-center gap-1">
            <span className="w-4 h-4 flex items-center justify-center leading-none">🔐</span>
            <span>Super Admin</span>
          </p>
        </div>

        {/* Admin Status */}
        <div className="mb-3">
          <span className="px-2 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-200">
            Active
          </span>
        </div>

      </div>

      {/* Quick Stats */}
      <div className="px-4 py-4 border-b border-gray-700">
        <h4 className="text-gray-300 text-xs font-medium mb-3">THỐNG KÊ NHANH</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-700 rounded p-2">
            <div className="text-yellow-400 font-bold">12</div>
            <div className="text-gray-300">Store chờ duyệt</div>
          </div>
          <div className="bg-gray-700 rounded p-2">
            <div className="text-blue-400 font-bold">45</div>
            <div className="text-gray-300">Sản phẩm chờ duyệt</div>
          </div>
          <div className="bg-gray-700 rounded p-2">
            <div className="text-purple-400 font-bold">23</div>
            <div className="text-gray-300">Biến thể chờ duyệt</div>
          </div>
          <div className="bg-gray-700 rounded p-2">
            <div className="text-green-400 font-bold">156</div>
            <div className="text-gray-300">Tổng store</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-4 flex-1">
        <div className="px-4 space-y-2">
          <Link
            to="/admin-dashboard"
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              isActive('/admin-dashboard')
                ? 'bg-gray-100 text-gray-800 border-r-2 border-gray-800'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <span className="mr-3 text-lg">📊</span>
            Dashboard
          </Link>
          
          <Link
            to="/admin-dashboard/stores"
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              isActive('/admin-dashboard/stores')
                ? 'bg-gray-100 text-gray-800 border-r-2 border-gray-800'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <span className="mr-3 text-lg">🏪</span>
            Quản lý Store
          </Link>
          
          <Link
            to="/admin-dashboard/products"
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              isActive('/admin-dashboard/products')
                ? 'bg-gray-100 text-gray-800 border-r-2 border-gray-800'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <span className="mr-3 text-lg">📦</span>
            Quản lý Sản phẩm
          </Link>
          
          <Link
            to="/admin-dashboard/variants"
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              isActive('/admin-dashboard/variants')
                ? 'bg-gray-100 text-gray-800 border-r-2 border-gray-800'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <span className="mr-3 text-lg">🔧</span>
            Quản lý Biến thể
          </Link>
          
          <Link
            to="/admin-dashboard/users"
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              isActive('/admin-dashboard/users')
                ? 'bg-gray-100 text-gray-800 border-r-2 border-gray-800'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <span className="mr-3 text-lg">👥</span>
            Quản lý User
          </Link>
          
          {/* 💰 RÚT TIỀN MENU */}
          <Link
            to="/admin-dashboard/withdrawals"
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              isActive('/admin-dashboard/withdrawals')
                ? 'bg-gray-100 text-gray-800 border-r-2 border-gray-800'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <span className="mr-3 text-lg">💰</span>
            <span className="flex-1 text-left truncate">Rút tiền</span>
          </Link>
          
          <Link
            to="/admin-dashboard/analytics"
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              isActive('/admin-dashboard/analytics')
                ? 'bg-gray-100 text-gray-800 border-r-2 border-gray-800'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <span className="mr-3 text-lg">📈</span>
            Thống kê & Phân tích
          </Link>

          <button
            onClick={() => setShowNotifications(true)}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <span className="mr-3 text-lg">🔔</span>
            <span className="flex-1 text-left truncate">Thông báo</span>
            <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full flex-shrink-0">3</span>
          </button>

          <Link
            to="/admin-dashboard/complaints"
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              isActive('/admin-dashboard/complaints')
                ? 'bg-gray-100 text-gray-800 border-r-2 border-gray-800'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <span className="mr-3 text-lg">⚠️</span>
            <span className="flex-1 text-left truncate">Khiếu nại</span>
            <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full flex-shrink-0">8</span>
          </Link>
        </div>
      </nav>

      {/* Logout Button */}
      <div className="px-4 py-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="mr-3 text-lg">🚪</span>
          <span className="flex-1 text-left">
            {loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
          </span>
        </button>
      </div>

      {/* Notification Modal */}
      <AdminNotifications 
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </aside>
  );
};

export default AdminSidebar;
