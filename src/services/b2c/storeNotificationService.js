import api from '../common/api';
import { getOrderCode } from '../../utils/displayCodeUtils';

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

    const response = await api.get(`/api/v1/b2c/stores/${storeId}/notifications`, {
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
    const response = await api.put(
      `/api/v1/b2c/stores/${storeId}/notifications/${notificationId}/read`
    );

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
    const response = await api.put(`/api/v1/b2c/stores/${storeId}/notifications/read-all`);

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
    const response = await api.delete(
      `/api/v1/b2c/stores/${storeId}/notifications/${notificationId}`
    );

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
 * Format số tiền trong message notification
 */
const formatMoneyInMessage = (message) => {
  if (!message) return message;
  
  // Regex để match số tiền có thể có dấu phẩy hoặc dấu chấm phân cách hàng nghìn
  // Ví dụ: "10,000,0 đ" hoặc "10000 đ" hoặc "10.000 đ"
  const moneyRegex = /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?)\s*(VNĐ|VND|đ)/gi;
  
  return message.replace(moneyRegex, (match, number, currency) => {
    try {
      // Loại bỏ tất cả dấu phẩy và dấu chấm phân cách hàng nghìn, chỉ giữ lại dấu thập phân cuối cùng
      // Ví dụ: "10,000,0" -> "10000.0" -> parseFloat -> 10000
      const cleanedNumber = number.replace(/[.,](?=\d{3})/g, ''); // Loại bỏ dấu phân cách hàng nghìn
      const parsedNumber = parseFloat(cleanedNumber);
      if (isNaN(parsedNumber)) return match;
      const roundedNumber = Math.round(parsedNumber);
      const formattedNumber = new Intl.NumberFormat('vi-VN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(roundedNumber);
      return `${formattedNumber} ${currency}`;
    } catch (e) {
      return match;
    }
  });
};

/**
 * Thay thế order ID trong message bằng mã hiển thị
 */
const replaceOrderIdInMessage = (message) => {
  if (!message) return message;
  
  const orderIdRegex = /#?([0-9a-f]{24}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;
  
  return message.replace(orderIdRegex, (match, orderId) => {
    const hasHash = match.startsWith('#');
    const displayCode = getOrderCode(orderId);
    return hasHash ? `#${displayCode}` : displayCode;
  });
};

/**
 * Format notification message (format money + replace order ID)
 */
export const formatNotificationMessage = (message) => {
  if (!message) return message;
  return replaceOrderIdInMessage(formatMoneyInMessage(message));
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
