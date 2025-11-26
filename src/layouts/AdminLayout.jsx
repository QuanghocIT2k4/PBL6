import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../services/common/authService';
import { useToast } from '../context/ToastContext';
import NotificationContainer from '../components/notifications/NotificationContainer';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { success: showSuccess } = useToast();
  const [loggingOut, setLoggingOut] = useState(false);

  const navItems = [
    { path: '/admin-dashboard', icon: '🏠', label: 'Tổng quan', exact: true },
    { path: '/admin-dashboard/users', icon: '👥', label: 'Người dùng' },
    { path: '/admin-dashboard/stores', icon: '🏪', label: 'Cửa hàng' },
    { path: '/admin-dashboard/products', icon: '📦', label: 'Sản phẩm' },
    { path: '/admin-dashboard/variants', icon: '🎨', label: 'Biến thể' },
    { path: '/admin-dashboard/promotions', icon: '🎁', label: 'Khuyến mãi' },
    { path: '/admin-dashboard/withdrawals', icon: '💰', label: 'Rút tiền' },
    { path: '/admin-dashboard/revenue', icon: '📊', label: 'Doanh Thu' },
  ];
  
  console.log('💰💰💰 [AdminLayout] navItems:', navItems);

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
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
      navigate('/auth');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-teal-600 to-cyan-700 text-white flex-shrink-0 shadow-2xl flex flex-col">
        <div className="p-6 flex-1">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-3xl">👑</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">Admin Panel</h2>
              <p className="text-xs text-teal-100">E-Commerce</p>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive(item.path, item.exact)
                    ? 'bg-white text-teal-700 font-bold shadow-lg'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Header Bar */}
        <header className="bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 text-white shadow-lg">
          <div className="px-8 py-4 flex items-center justify-between">
            {/* Left side - Empty space */}
            <div></div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-6">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="w-64 pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:bg-white/20 focus:border-white/40 transition-all"
                />
                <svg className="w-5 h-5 text-white/60 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Notifications */}
              <NotificationContainer userType="admin" />

              {/* Admin Profile */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">A</span>
                </div>
                <div className="text-sm">
                  <div className="font-semibold">Admin</div>
                  <div className="text-white/70 text-xs">Quản trị viên</div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-sm font-medium">{loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
              </button>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

// ĐÃ KHÔI PHỤC