import React, { useState, useEffect } from 'react';
import { 
  getAdminNotifications, 
  getAdminNotificationsByType,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  deleteAdminNotification 
} from '../../services/notification/adminNotificationService';
import { useToast } from '../../context/ToastContext';
import { confirmDelete } from '../../utils/sweetalert';

const AdminNotifications = () => {
  const { success, error: showError } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const notificationTypes = [
    { value: 'ALL', label: 'Tất cả', icon: '📋' },
    { value: 'ORDER', label: 'Đơn hàng', icon: '🛒' },
    { value: 'PRODUCT', label: 'Sản phẩm', icon: '📦' },
    { value: 'USER', label: 'Người dùng', icon: '👥' },
    { value: 'STORE', label: 'Cửa hàng', icon: '🏪' },
    { value: 'PAYMENT', label: 'Thanh toán', icon: '💳' },
    { value: 'SYSTEM', label: 'Hệ thống', icon: '⚙️' },
  ];

  useEffect(() => {
    loadNotifications();
  }, [selectedType, page]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      let result;
      
      if (selectedType === 'ALL') {
        result = await getAdminNotifications({ page, size: 20 });
      } else {
        result = await getAdminNotificationsByType(selectedType, { page, size: 20 });
      }

      if (result.success) {
        const data = result.data;
        const notifList = Array.isArray(data) ? data : (data.content || data.notifications || []);
        setNotifications(notifList);
        setTotalPages(data.totalPages || 1);
      } else {
        showError(result.error || 'Không thể tải thông báo');
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      showError('Lỗi khi tải thông báo');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    const result = await markAdminNotificationAsRead(notificationId);
    if (result.success) {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    const result = await markAllAdminNotificationsAsRead();
    if (result.success) {
      success('Đã đánh dấu tất cả đã đọc');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } else {
      showError(result.error);
    }
  };

  const handleDelete = async (notificationId) => {
    const confirmed = await confirmDelete('thông báo này');
    if (!confirmed) return;
    
    const result = await deleteAdminNotification(notificationId);
    if (result.success) {
      success('Đã xóa thông báo');
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } else {
      showError(result.error);
    }
  };

  const getNotificationIcon = (type) => {
    const typeObj = notificationTypes.find(t => t.value === type);
    return typeObj?.icon || '📬';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl p-6 shadow-lg">
        <h1 className="text-3xl font-bold text-white mb-2">📬 Thông báo Admin</h1>
        <p className="text-white/90">Quản lý tất cả thông báo hệ thống</p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {notificationTypes.map(type => (
              <button
                key={type.value}
                onClick={() => {
                  setSelectedType(type.value);
                  setPage(0);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedType === type.value
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-2">{type.icon}</span>
                {type.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
          >
            ✅ Đánh dấu tất cả đã đọc
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải thông báo...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-600 text-lg">Không có thông báo nào</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  !notification.isRead ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                    !notification.isRead ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className={`font-semibold ${
                          !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h3>
                        <p className="text-gray-600 mt-1">{notification.message}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-gray-500">
                            {formatDate(notification.createdAt)}
                          </span>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                            {notification.type}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Đánh dấu đã đọc"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Trước
            </button>
            <span className="text-gray-600">
              Trang {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
