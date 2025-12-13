import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../services/common/authService';
import { useToast } from '../context/ToastContext';
import NotificationContainer from '../components/notifications/NotificationContainer';
import { useAuth } from '../context/AuthContext';

const ShipperLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { success: showSuccess } = useToast();
  const { user } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const navItems = [
    { path: '/shipper', icon: '🚚', label: 'Dashboard', exact: true },
    { path: '/shipper/history', icon: '📋', label: 'Lịch sử', exact: false },
  ];

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-slate-200 to-slate-300 text-gray-800 flex-shrink-0 shadow-2xl flex flex-col">
        <div className="p-6 flex-1">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-3xl">🚚</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">Shipper Panel</h2>
              <p className="text-xs text-gray-600">Giao hàng</p>
            </div>
          </div>

          {/* User Info */}
          <div className="mb-6 p-4 bg-white/60 rounded-xl border border-gray-300/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center border border-gray-300">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.fullName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-xl">👤</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-gray-800">{user?.fullName || user?.name || 'Shipper'}</p>
                <p className="text-xs text-gray-600 truncate">{user?.email || ''}</p>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive(item.path, item.exact)
                    ? 'bg-white text-blue-700 font-bold shadow-lg border border-blue-200'
                    : 'text-gray-700 hover:bg-white/50'
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Logout Button */}
        <div className="p-6 border-t border-gray-400/30">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white/60 hover:bg-white/80 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 font-medium border border-gray-300/50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>{loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Header Bar */}
        <header className="bg-gradient-to-r from-slate-200 via-slate-100 to-gray-100 text-gray-800 shadow-lg border-b border-gray-300">
          <div className="px-8 py-4 flex items-center justify-between">
            {/* Left side - Empty space */}
            <div></div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-6">
              {/* Notifications */}
              <NotificationContainer userType="shipper" />

              {/* Shipper Profile */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-full flex items-center justify-center border border-gray-300">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.fullName} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-gray-700 text-sm font-bold">S</span>
                  )}
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-gray-800">{user?.fullName || user?.name || 'Shipper'}</div>
                  <div className="text-gray-600 text-xs">Người giao hàng</div>
                </div>
              </div>
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

export default ShipperLayout;

