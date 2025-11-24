import api from '../common/api';

/**
 * BUYER NOTIFICATION SERVICE
 * APIs for buyers to manage their notifications
 */

/**
 * 1. GET BUYER NOTIFICATIONS
 * GET /api/v1/buyer/notifications
 * 
 * Lấy danh sách notification của buyer hiện tại
 */
export const getBuyerNotifications = async (params = {}) => {
  try {
    const {
      page = 0,
      size = 10,
      isRead = null, // true/false/null (all)
    } = params;

    const response = await api.get('/api/v1/buyer/notifications', {
      params: {
        page,
        size,
        ...(isRead !== null && { isRead }),
      },
    });

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ Error fetching buyer notifications:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tải thông báo',
    };
  }
};

/**
 * 2. MARK NOTIFICATION AS READ
 * PUT /api/v1/buyer/notifications/{notificationId}/read
 * 
 * Đánh dấu 1 notification là đã đọc
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await api.put(`/api/v1/buyer/notifications/${notificationId}/read`);

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Đã đánh dấu đã đọc',
    };
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể đánh dấu đã đọc',
    };
  }
};

/**
 * 3. MARK ALL NOTIFICATIONS AS READ
 * PUT /api/v1/buyer/notifications/read-all
 * 
 * Đánh dấu tất cả notification là đã đọc
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const response = await api.put('/api/v1/buyer/notifications/read-all');

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Đã đánh dấu tất cả đã đọc',
    };
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể đánh dấu tất cả đã đọc',
    };
  }
};

/**
 * 4. DELETE NOTIFICATION
 * DELETE /api/v1/buyer/notifications/{notificationId}
 * 
 * Xóa 1 notification
 */
export const deleteNotification = async (notificationId) => {
  try {
    const response = await api.delete(`/api/v1/buyer/notifications/${notificationId}`);

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Đã xóa thông báo',
    };
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể xóa thông báo',
    };
  }
};

/**
 * HELPER FUNCTIONS
 */

/**
 * Get unread count
 */
export const getUnreadCount = (notifications) => {
  if (!notifications || !Array.isArray(notifications)) return 0;
  return notifications.filter(n => !n.isRead).length;
};

/**
 * Format notification time
 */
export const formatNotificationTime = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Get notification icon based on type
 */
export const getNotificationIcon = (type) => {
  const icons = {
    ORDER: '📦',
    PAYMENT: '💳',
    SHIPPING: '🚚',
    PROMOTION: '🎁',
    SYSTEM: '🔔',
    REVIEW: '⭐',
    DEFAULT: '📢',
  };
  
  return icons[type] || icons.DEFAULT;
};

/**
 * Get notification color based on type
 */
export const getNotificationColor = (type) => {
  const colors = {
    ORDER: 'blue',
    PAYMENT: 'green',
    SHIPPING: 'purple',
    PROMOTION: 'orange',
    SYSTEM: 'gray',
    REVIEW: 'yellow',
    DEFAULT: 'gray',
  };
  
  return colors[type] || colors.DEFAULT;
};
