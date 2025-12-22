import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStoreContext } from '../../context/StoreContext';
import { getStoreNotifications } from '../../services/b2c/storeNotificationService';

const StoreSidebar = () => {
  const { currentStore, userStores } = useStoreContext();
  const location = useLocation();
  const [violationCount, setViolationCount] = useState(null); // { currentCount, maxCount, remainingCount }

  // ✅ Fetch và parse số lần cảnh báo vi phạm từ store info hoặc notifications
  useEffect(() => {
    const fetchViolationCount = async () => {
      if (!currentStore?.id) {
        setViolationCount(null);
        return;
      }

      // ✅ Ưu tiên 1: Lấy từ store info nếu có returnWarningCount
      if (currentStore?.returnWarningCount !== undefined && currentStore?.returnWarningCount !== null) {
        const currentCount = parseInt(currentStore.returnWarningCount, 10) || 0;
        const maxCount = 5;
        const remainingCount = maxCount - currentCount;
        if (currentCount > 0) {
          setViolationCount({ currentCount, maxCount, remainingCount });
          return;
        } else {
          setViolationCount(null);
          return;
        }
      }

      // ✅ Ưu tiên 2: Tìm trong notifications nếu store info không có
      try {
        const result = await getStoreNotifications(currentStore.id, {
          page: 0,
          size: 50, // Tăng size để tìm được notification cũ hơn
          isRead: null, // Lấy cả đã đọc và chưa đọc
        });

        if (result.success) {
          const notifList = result.data?.content || result.data?.notifications || [];
          
          // ✅ Tìm notification cảnh báo vi phạm (nhiều pattern khác nhau)
          const violationNotif = notifList.find((notif) => {
            const message = (notif.message || '').toLowerCase();
            // Pattern 1: "xác nhận hàng trả về không có vấn đề" + "Đây là lần thứ" + "sẽ bị khóa"
            if (message.includes('xác nhận hàng trả về không có vấn đề') && 
                message.includes('đây là lần thứ') && 
                message.includes('sẽ bị khóa')) {
              return true;
            }
            // Pattern 2: "cảnh báo vi phạm" + số lần
            if (message.includes('cảnh báo vi phạm') && message.includes('lần')) {
              return true;
            }
            // Pattern 3: "đã bị cảnh báo" + số
            if (message.includes('đã bị cảnh báo') && /\d+/.test(message)) {
              return true;
            }
            // Pattern 4: "giao hàng lỗi" + số lần
            if (message.includes('giao hàng lỗi') && message.includes('lần')) {
              return true;
            }
            return false;
          });

          if (violationNotif) {
            const message = violationNotif.message || '';
            // Tìm số lần cảnh báo từ nhiều pattern
            let match = message.match(/đây là lần thứ\s+(\d+)/i);
            if (!match) {
              match = message.match(/đã bị cảnh báo\s+(\d+)/i);
            }
            if (!match) {
              match = message.match(/(\d+)\s*\/\s*5/i); // Format: "1/5"
            }
            if (!match) {
              match = message.match(/cảnh báo.*?(\d+)/i);
            }
            if (!match) {
              match = message.match(/lần thứ\s+(\d+)/i);
            }
            
            const currentCount = match ? parseInt(match[1], 10) : 0;
            const maxCount = 5;
            const remainingCount = maxCount - currentCount;
            
            if (currentCount > 0) {
              setViolationCount({ currentCount, maxCount, remainingCount });
            } else {
              setViolationCount(null);
            }
          } else {
            setViolationCount(null);
          }
        } else {
          setViolationCount(null);
        }
      } catch (err) {
        console.error('Error fetching violation count:', err);
        setViolationCount(null);
      }
    };

    fetchViolationCount();
    // Refresh mỗi 30 giây
    const interval = setInterval(fetchViolationCount, 30000);
    return () => clearInterval(interval);
  }, [currentStore?.id, currentStore?.returnWarningCount]);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'bg-transparent text-gray-300 border-transparent';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'APPROVED': return '';
      case 'PENDING': return 'Chờ duyệt';
      case 'REJECTED': return 'Bị từ chối';
      default: return 'Không xác định';
    }
  };

  if (!currentStore) {
    return (
      <aside className="w-64 bg-gray-700 min-h-screen">
        <div className="p-6 border-b border-gray-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">
              <span className="text-blue-300">Tech</span>
              <span className="text-purple-300">Store</span>
            </h1>
          </div>
        </div>
        
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Chưa chọn cửa hàng</h3>
          <p className="text-gray-300 text-sm mb-4">Vui lòng chọn một cửa hàng để tiếp tục</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-gray-700 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-600">
        <Link to={`/store-dashboard/dashboard`} className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">
              {currentStore?.name?.charAt(0)?.toUpperCase() || 'S'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-white">
            <span className="text-blue-300">Tech</span>
            <span className="text-purple-300">Store</span>
          </h1>
        </Link>
      </div>

      {/* Store Info Section */}
      <div className="px-4 py-4 border-b border-gray-600">
        
        {/* Store Count */}
        <div className="mb-3">
          <div className="bg-gray-600 rounded-lg p-2">
            <div className="flex items-center justify-between text-xs text-gray-300">
              <span className="font-medium">{userStores.length} chi nhánh</span>
            </div>
          </div>
        </div>

        {/* Store Info */}
        <div className="text-gray-300 text-xs space-y-1 mb-3">
          <p className="flex items-center gap-1">
            <span className="w-4 h-4 flex items-center justify-center leading-none">🏪</span>
            <span>{currentStore.storeName || currentStore.name}</span>
          </p>
          {currentStore.address && (
            <p className="flex items-center gap-1">
              <span className="w-4 h-4 flex items-center justify-center leading-none">📍</span>
              <span>
                {typeof currentStore.address === 'string' 
                  ? currentStore.address 
                  : (currentStore.address?.homeAddress || currentStore.address?.suggestedName || '') + 
                    (currentStore.address?.ward ? `, ${currentStore.address.ward}` : '') +
                    (currentStore.address?.province ? `, ${currentStore.address.province}` : '')
                }
              </span>
            </p>
          )}
          
          {/* ✅ Hiển thị số lần cảnh báo vi phạm */}
          {violationCount && (
            <div className="mt-2 p-2 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-yellow-400">⚠️</span>
                <span className="text-yellow-300 font-medium">
                  Cảnh báo: {violationCount.currentCount}/{violationCount.maxCount}
                </span>
                <span className="text-red-400 font-semibold">
                  (Còn {violationCount.remainingCount} lần)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Store Status */}
        <div className="mb-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(currentStore.status)}`}>
            {getStatusText(currentStore.status)}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-4">
        <div className="px-4 space-y-2">
          <Link
            to="/store-dashboard/dashboard"
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              isActive('/store-dashboard/dashboard')
                ? 'bg-gray-100 text-gray-700 border-r-2 border-gray-700'
                : 'text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
          >
            <span className="mr-3 text-lg">📊</span>
            Dashboard
          </Link>
          
          <Link
            to="/store-dashboard/profile"
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              isActive('/store-dashboard/profile')
                ? 'bg-gray-100 text-gray-700 border-r-2 border-gray-700'
                : 'text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
          >
            <span className="mr-3 text-lg">🏢</span>
            Thông tin store
          </Link>
          
          <Link
            to="/store-dashboard/products"
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              isActive('/store-dashboard/products')
                ? 'bg-gray-100 text-gray-700 border-r-2 border-gray-700'
                : 'text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
          >
            <span className="mr-3 text-lg">📦</span>
            Sản phẩm
          </Link>
          
          <Link
            to="/store-dashboard/product-variants"
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              isActive('/store-dashboard/product-variants')
                ? 'bg-gray-100 text-gray-700 border-r-2 border-gray-700'
                : 'text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
          >
            <span className="mr-3 text-lg">🎨</span>
            Quản lý Biến thể
          </Link>
          
          <Link
            to="/store-dashboard/orders"
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              isActive('/store-dashboard/orders')
                ? 'bg-gray-100 text-gray-700 border-r-2 border-gray-700'
                : 'text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
          >
            <span className="mr-3 text-lg">📋</span>
            Đơn hàng
          </Link>
          
          <Link
            to="/store-dashboard/returns"
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              isActive('/store-dashboard/returns') || location.pathname.includes('/store-dashboard/returns/disputes')
                ? 'bg-gray-100 text-gray-700 border-r-2 border-gray-700'
                : 'text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
          >
            <span className="mr-3 text-lg">↩️</span>
            Yêu cầu trả hàng
          </Link>
          
          <Link
            to="/store-dashboard/disputes"
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              location.pathname.includes('/store-dashboard/disputes') || location.pathname.includes('/store-dashboard/returns/disputes')
                ? 'bg-gray-100 text-gray-700 border-r-2 border-gray-700'
                : 'text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
          >
            <span className="mr-3 text-lg">⚖️</span>
            Khiếu nại
          </Link>
          
          <Link
            to="/store-dashboard/promotions"
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              isActive('/store-dashboard/promotions')
                ? 'bg-gray-100 text-gray-700 border-r-2 border-gray-700'
                : 'text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
          >
            <span className="mr-3 text-lg">🎯</span>
            Khuyến mãi
          </Link>
          
          <Link
            to={`/store-dashboard/wallet/${currentStore.id}`}
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              location.pathname.includes('/store-dashboard/wallet')
                ? 'bg-gray-100 text-gray-700 border-r-2 border-gray-700'
                : 'text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
          >
            <span className="mr-3 text-lg">💰</span>
            Ví của tôi
          </Link>
          
          <Link
            to="/store-dashboard/analytics"
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              isActive('/store-dashboard/analytics')
                ? 'bg-gray-100 text-gray-700 border-r-2 border-gray-700'
                : 'text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
          >
            <span className="mr-3 text-lg">📈</span>
            Thống kê & Phân tích
          </Link>
          
          <Link
            to="/store-dashboard/shipments"
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              isActive('/store-dashboard/shipments')
                ? 'bg-gray-100 text-gray-700 border-r-2 border-gray-700'
                : 'text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
          >
            <span className="mr-3 text-lg">🚚</span>
            Vận chuyển
          </Link>
          
          <Link
            to="/store-dashboard/notifications"
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              isActive('/store-dashboard/notifications')
                ? 'bg-gray-100 text-gray-700 border-r-2 border-gray-700'
                : 'text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
          >
            <span className="mr-3 text-lg">🔔</span>
            Thông báo
          </Link>
          
          <Link
            to="/store-dashboard/chats"
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              isActive('/store-dashboard/chats')
                ? 'bg-gray-100 text-gray-700 border-r-2 border-gray-700'
                : 'text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
          >
            <span className="mr-3 text-lg">💬</span>
            Chat
          </Link>
        </div>
      </nav>
    </aside>
  );
};

export default StoreSidebar;
