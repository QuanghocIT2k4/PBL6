import React from 'react';
import NotificationItem from './NotificationItem';

/**
 * NotificationDropdown Component
 * Dropdown list of notifications
 * Style: Shopee/Lazada inspired
 */
const NotificationDropdown = ({
  notifications = [],
  unreadCount = 0,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onLoadMore,
  onClose,
  hasMore = false,
  loading = false,
  userType = 'buyer'
}) => {
  const handleMarkAllAsRead = () => {
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    }
  };

  const handleViewAll = () => {
    // Navigate to full notifications page
    if (userType === 'buyer') {
      window.location.href = '/notifications';
    } else {
      window.location.href = '/store-dashboard/notifications';
    }
    onClose();
  };

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span className="text-2xl">🔔</span>
            Thông báo
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full">
                {unreadCount}
              </span>
            )}
          </h3>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium hover:underline"
            >
              Đọc tất cả
            </button>
          )}
        </div>
      </div>

      {/* Notification List */}
      <div className="flex-1 overflow-y-auto">
        {loading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-center">Chưa có thông báo nào</p>
            <p className="text-gray-400 text-sm text-center mt-1">
              Các thông báo mới sẽ hiển thị ở đây
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && !loading && (
          <div className="p-4 text-center border-t border-gray-100">
            <button
              onClick={onLoadMore}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium hover:underline"
            >
              Xem thêm
            </button>
          </div>
        )}

        {loading && notifications.length > 0 && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleViewAll}
            className="w-full text-center text-sm text-orange-600 hover:text-orange-700 font-medium hover:underline"
          >
            Xem tất cả thông báo
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
