import api from '../common/api';

/**
 * B2C STORE NOTIFICATION SERVICE
 * APIs for store sellers to manage store notifications
 */

/**
 * 1. GET STORE NOTIFICATIONS
 * GET /api/v1/b2c/stores/{storeId}/notifications
 * 
 * Lấy danh sách notification của store
 */
export const getStoreNotifications = async (storeId, params = {}) => {
  try {
    const {
      page = 0,
      size = 10,
      isRead = null, // true/false/null (all)
    } = params;

    console.log('📥 Fetching store notifications:', { storeId, page, size, isRead });

    const response = await api.get(`/api/v1/b2c/stores/${storeId}/notifications`, {
      params: {
        page,
        size,
        ...(isRead !== null && { isRead }),
      },
    });

    console.log('✅ Store notifications:', response.data);

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error('❌ Error fetching store notifications:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tải thông báo',
    };
  }
};

/**
 * 2. MARK STORE NOTIFICATION AS READ
 * PUT /api/v1/b2c/stores/{storeId}/notifications/{notificationId}/read
 * 
 * Đánh dấu 1 notification của store là đã đọc
 */
export const markStoreNotificationAsRead = async (storeId, notificationId) => {
  try {
    console.log('📖 Marking store notification as read:', { storeId, notificationId });

    const response = await api.put(
      `/api/v1/b2c/stores/${storeId}/notifications/${notificationId}/read`
    );

    console.log('✅ Store notification marked as read:', response.data);

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Đã đánh dấu đã đọc',
    };
  } catch (error) {
    console.error('❌ Error marking store notification as read:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể đánh dấu đã đọc',
    };
  }
};

/**
 * 3. MARK ALL STORE NOTIFICATIONS AS READ
 * PUT /api/v1/b2c/stores/{storeId}/notifications/read-all
 * 
 * Đánh dấu tất cả notification của store là đã đọc
 */
export const markAllStoreNotificationsAsRead = async (storeId) => {
  try {
    console.log('📖 Marking all store notifications as read:', storeId);

    const response = await api.put(`/api/v1/b2c/stores/${storeId}/notifications/read-all`);

    console.log('✅ All store notifications marked as read:', response.data);

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Đã đánh dấu tất cả đã đọc',
    };
  } catch (error) {
    console.error('❌ Error marking all store notifications as read:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể đánh dấu tất cả đã đọc',
    };
  }
};

/**
 * 4. DELETE STORE NOTIFICATION
 * DELETE /api/v1/b2c/stores/{storeId}/notifications/{notificationId}
 * 
 * Xóa 1 notification của store
 */
export const deleteStoreNotification = async (storeId, notificationId) => {
  try {
    console.log('🗑️ Deleting store notification:', { storeId, notificationId });

    const response = await api.delete(
      `/api/v1/b2c/stores/${storeId}/notifications/${notificationId}`
    );

    console.log('✅ Store notification deleted:', response.data);

    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Đã xóa thông báo',
    };
  } catch (error) {
    console.error('❌ Error deleting store notification:', error);
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
    PRODUCT: '📱',
    WITHDRAWAL: '💰',
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
    PRODUCT: 'indigo',
    WITHDRAWAL: 'emerald',
    DEFAULT: 'gray',
  };
  
  return colors[type] || colors.DEFAULT;
};

/**
 * Get notification priority badge
 */
export const getNotificationPriority = (priority) => {
  const priorities = {
    HIGH: { text: 'Quan trọng', color: 'red' },
    MEDIUM: { text: 'Bình thường', color: 'yellow' },
    LOW: { text: 'Thấp', color: 'gray' },
  };
  
  return priorities[priority] || priorities.MEDIUM;
};
