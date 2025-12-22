import api from '../common/api';
import { getOrderCode } from '../../utils/displayCodeUtils';

/**
 * ================================================
 * ADMIN NOTIFICATION SERVICE
 * ================================================
 * Quản lý thông báo cho Admin
 * 7 APIs: Get list, Get detail, Get unread count, Get by type,
 *         Mark as read, Mark all read, Delete
 * ================================================
 */

/**
 * 1. LẤY DANH SÁCH THÔNG BÁO
 * GET /api/v1/admin/notifications
 * @param {Object} params - { page, size, sortBy, sortDir }
 */
export const getAdminNotifications = async (params = {}) => {
  try {
    const { page = 0, size = 20, sortBy = 'createdAt', sortDir = 'desc' } = params;
    
    console.log('📬 [Admin] Fetching notifications:', { page, size, sortBy, sortDir });
    
    const response = await api.get('/api/v1/admin/notifications', {
      params: { page, size, sortBy, sortDir },
    });
    
    console.log('✅ [Admin] Notifications response:', response.data);
    
    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Không thể tải thông báo',
      };
    }
  } catch (error) {
    console.error('❌ [Admin] Error fetching notifications:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Lỗi khi tải thông báo',
    };
  }
};

/**
 * 2. LẤY CHI TIẾT THÔNG BÁO
 * GET /api/v1/admin/notifications/{notificationId}
 */
export const getAdminNotificationById = async (notificationId) => {
  try {
    console.log('📬 [Admin] Fetching notification detail:', notificationId);
    
    const response = await api.get(`/api/v1/admin/notifications/${notificationId}`);
    
    console.log('✅ [Admin] Notification detail:', response.data);
    
    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Không tìm thấy thông báo',
      };
    }
  } catch (error) {
    console.error('❌ [Admin] Error fetching notification detail:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Lỗi khi tải chi tiết thông báo',
    };
  }
};

/**
 * 3. ĐẾM SỐ THÔNG BÁO CHƯA ĐỌC
 * GET /api/v1/admin/notifications/unread-count
 */
export const getAdminUnreadCount = async () => {
  try {
    console.log('🔢 [Admin] Fetching unread count');
    
    const response = await api.get('/api/v1/admin/notifications/unread-count');
    
    console.log('✅ [Admin] Unread count:', response.data);
    
    if (response.data.success) {
      return {
        success: true,
        count: response.data.data || 0,
      };
    } else {
      return {
        success: false,
        count: 0,
      };
    }
  } catch (error) {
    console.error('❌ [Admin] Error fetching unread count:', error);
    return {
      success: false,
      count: 0,
    };
  }
};

/**
 * 4. LẤY THÔNG BÁO THEO LOẠI
 * GET /api/v1/admin/notifications/by-type/{type}
 * @param {string} type - Loại thông báo (ORDER, PRODUCT, USER, STORE, etc.)
 * @param {Object} params - { page, size, sortBy, sortDir }
 */
export const getAdminNotificationsByType = async (type, params = {}) => {
  try {
    const { page = 0, size = 20, sortBy = 'createdAt', sortDir = 'desc' } = params;
    
    console.log('📬 [Admin] Fetching notifications by type:', { type, page, size });
    
    const response = await api.get(`/api/v1/admin/notifications/by-type/${type}`, {
      params: { page, size, sortBy, sortDir },
    });
    
    console.log('✅ [Admin] Notifications by type response:', response.data);
    
    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Không thể tải thông báo',
      };
    }
  } catch (error) {
    console.error('❌ [Admin] Error fetching notifications by type:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Lỗi khi tải thông báo',
    };
  }
};

/**
 * 5. ĐÁNH DẤU ĐÃ ĐỌC
 * PUT /api/v1/admin/notifications/{notificationId}/read
 */
export const markAdminNotificationAsRead = async (notificationId) => {
  try {
    console.log('✅ [Admin] Marking notification as read:', notificationId);
    
    const response = await api.put(`/api/v1/admin/notifications/${notificationId}/read`);
    
    console.log('✅ [Admin] Marked as read:', response.data);
    
    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
        message: 'Đã đánh dấu đã đọc',
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Không thể đánh dấu đã đọc',
      };
    }
  } catch (error) {
    console.error('❌ [Admin] Error marking as read:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Lỗi khi đánh dấu đã đọc',
    };
  }
};

/**
 * 6. ĐÁNH DẤU TẤT CẢ ĐÃ ĐỌC
 * PUT /api/v1/admin/notifications/mark-all-read
 */
export const markAllAdminNotificationsAsRead = async () => {
  try {
    console.log('✅ [Admin] Marking all notifications as read');
    
    const response = await api.put('/api/v1/admin/notifications/mark-all-read');
    
    console.log('✅ [Admin] Marked all as read:', response.data);
    
    if (response.data.success) {
      return {
        success: true,
        message: 'Đã đánh dấu tất cả đã đọc',
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Không thể đánh dấu tất cả đã đọc',
      };
    }
  } catch (error) {
    console.error('❌ [Admin] Error marking all as read:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Lỗi khi đánh dấu tất cả đã đọc',
    };
  }
};

/**
 * 7. XÓA THÔNG BÁO
 * DELETE /api/v1/admin/notifications/{notificationId}
 */
export const deleteAdminNotification = async (notificationId) => {
  try {
    console.log('🗑️ [Admin] Deleting notification:', notificationId);
    
    const response = await api.delete(`/api/v1/admin/notifications/${notificationId}`);
    
    console.log('✅ [Admin] Deleted notification:', response.data);
    
    if (response.data.success) {
      return {
        success: true,
        message: 'Đã xóa thông báo',
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Không thể xóa thông báo',
      };
    }
  } catch (error) {
    console.error('❌ [Admin] Error deleting notification:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Lỗi khi xóa thông báo',
    };
  }
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

// Export default object
export default {
  getAdminNotifications,
  getAdminNotificationById,
  getAdminUnreadCount,
  getAdminNotificationsByType,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  deleteAdminNotification,
};
