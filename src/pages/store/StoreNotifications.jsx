import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StoreLayout from '../../layouts/StoreLayout';
import StoreStatusGuard from '../../components/store/StoreStatusGuard';
import { useStoreContext } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import {
  getStoreNotifications,
  markStoreNotificationAsRead,
  markAllStoreNotificationsAsRead,
  deleteStoreNotification,
  getUnreadCount,
  formatNotificationTime,
  getNotificationIcon,
  getNotificationColor,
} from '../../services/b2c/storeNotificationService';

const StoreNotifications = () => {
  const navigate = useNavigate();
  const { currentStore, loading: storeLoading } = useStoreContext();
  const { success, error: showError } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (currentStore?.id) {
      loadNotifications();
    }
  }, [currentStore, filter]);

  const loadNotifications = async (pageNum = 0) => {
    if (!currentStore?.id) return;

    setLoading(true);

    try {
      const isReadFilter = filter === 'all' ? null : filter === 'read';
      const result = await getStoreNotifications(currentStore.id, {
        page: pageNum,
        size: 20,
        isRead: isReadFilter,
      });

      if (result.success) {
        const data = result.data;
        const notifList = data.content || data.notifications || [];

        if (pageNum === 0) {
          setNotifications(notifList);
        } else {
          setNotifications((prev) => [...prev, ...notifList]);
        }

        setHasMore(pageNum < (data.totalPages - 1));
        setPage(pageNum);
      } else {
        showError(result.error);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
      showError('Không thể tải thông báo');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    const result = await markStoreNotificationAsRead(currentStore.id, notificationId);
    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    const result = await markAllStoreNotificationsAsRead(currentStore.id);
    if (result.success) {
      success('Đã đánh dấu tất cả đã đọc');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } else {
      showError(result.error);
    }
  };

  const handleDelete = async (notificationId) => {
    const result = await deleteStoreNotification(currentStore.id, notificationId);
    if (result.success) {
      success('Đã xóa thông báo');
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } else {
      showError(result.error);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    // Navigate based on type
    if (notification.data) {
      const { orderId, productId, withdrawalId } = notification.data;

      if (orderId) {
        navigate(`/store-dashboard/orders`);
      } else if (productId) {
        navigate(`/store-dashboard/products`);
      } else if (withdrawalId) {
        navigate(`/store-dashboard/wallet`);
      }
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadNotifications(page + 1);
    }
  };

  const unreadCount = getUnreadCount(notifications);

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    gray: 'bg-gray-100 text-gray-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    emerald: 'bg-emerald-100 text-emerald-600',
  };

  return (
    <StoreStatusGuard currentStore={currentStore} pageName="thông báo" loading={storeLoading}>
      <StoreLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Tất cả đã đọc'}
                </p>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Đọc tất cả
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'Tất cả' },
                { key: 'unread', label: 'Chưa đọc' },
                { key: 'read', label: 'Đã đọc' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === tab.key
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-500 text-center text-lg">Chưa có thông báo nào</p>
                <p className="text-gray-400 text-sm text-center mt-2">
                  Các thông báo mới sẽ hiển thị ở đây
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => {
                  const icon = getNotificationIcon(notification.type);
                  const color = getNotificationColor(notification.type);
                  const timeAgo = formatNotificationTime(notification.createdAt);

                  return (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.isRead ? 'bg-blue-50/30' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-4">
                        {/* Icon */}
                        <div
                          className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                            colorClasses[color] || colorClasses.gray
                          }`}
                        >
                          {icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3
                              className={`text-base font-medium text-gray-900 ${
                                !notification.isRead ? 'font-semibold' : ''
                              }`}
                            >
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                            )}
                          </div>

                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>

                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-400">{timeAgo}</p>

                            <div className="flex gap-2">
                              {!notification.isRead && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsRead(notification.id);
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                >
                                  Đánh dấu đã đọc
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(notification.id);
                                }}
                                className="text-xs text-red-600 hover:text-red-700 font-medium"
                              >
                                Xóa
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Load More */}
            {hasMore && !loading && (
              <div className="p-4 text-center border-t border-gray-100">
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Xem thêm
                </button>
              </div>
            )}

            {loading && notifications.length > 0 && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
        </div>
      </StoreLayout>
    </StoreStatusGuard>
  );
};

export default StoreNotifications;
