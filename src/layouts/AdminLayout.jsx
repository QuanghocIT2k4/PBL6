import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const AdminLayout = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/admin-dashboard', icon: '🏠', label: 'Tổng quan', exact: true },
    { path: '/admin-dashboard/users', icon: '👥', label: 'Người dùng' },
    { path: '/admin-dashboard/stores', icon: '🏪', label: 'Cửa hàng' },
    { path: '/admin-dashboard/products', icon: '📦', label: 'Sản phẩm' },
    { path: '/admin-dashboard/variants', icon: '🎨', label: 'Biến thể' },
    { path: '/admin-dashboard/promotions', icon: '🎁', label: 'Khuyến mãi' },
    { path: '/admin-dashboard/wallets', icon: '💰', label: 'Ví & Rút tiền' },
    { path: '/admin-dashboard/revenue', icon: '📊', label: 'Doanh Thu' },
  ];
  
  console.log('💰💰💰 [AdminLayout] navItems:', navItems);

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-teal-600 to-cyan-700 text-white flex-shrink-0 shadow-2xl">
        <div className="p-6">
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

        <div className="absolute bottom-6 left-6 right-6">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
          >
            <span className="text-2xl">🏠</span>
            <span>Về trang chủ</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

// ĐÃ KHÔI PHỤC