import api from '../common/api';

/**
 * ================================================
 * BUYER NOTIFICATION SERVICE
 * ================================================
 * Quản lý thông báo cho Buyer/Customer
 * 5 APIs: Get list, Get unread count, Mark as read,
 *         Mark all read, Delete
 * ================================================
 */

/**
 * 1. LẤY DANH SÁCH THÔNG BÁO
 * GET /api/v1/buyer/notifications
 * @param {Object} params - { page, size, sortBy, sortDir }
 */
export const getBuyerNotifications = async (params = {}) => {
  try {
    const { page = 0, size = 20, sortBy = 'createdAt', sortDir = 'desc' } = params;
    
      
    const response = await api.get('/api/v1/buyer/notifications', {
      params: { page, size, sortBy, sortDir },
    });
    
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
    console.error('❌ [Buyer] Error fetching notifications:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Lỗi khi tải thông báo',
    };
  }
};

/**
 * 2. ĐẾM SỐ THÔNG BÁO CHƯA ĐỌC
 * GET /api/v1/buyer/notifications/unread-count
 */
export const getBuyerUnreadCount = async () => {
  try {
    
    const response = await api.get('/api/v1/buyer/notifications/unread-count');
    
    
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
    console.error('❌ [Buyer] Error fetching unread count:', error);
    return {
      success: false,
      count: 0,
    };
  }
};

/**
 * 3. ĐÁNH DẤU ĐÃ ĐỌC
 * PUT /api/v1/buyer/notifications/{notificationId}/read
 */
export const markBuyerNotificationAsRead = async (notificationId) => {
  try {
    
    const response = await api.put(`/api/v1/buyer/notifications/${notificationId}/read`);
    
    
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
    console.error('❌ [Buyer] Error marking as read:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Lỗi khi đánh dấu đã đọc',
    };
  }
};

/**
 * 4. ĐÁNH DẤU TẤT CẢ ĐÃ ĐỌC
 * PUT /api/v1/buyer/notifications/read-all
 */
export const markAllBuyerNotificationsAsRead = async () => {
  try {
    
    const response = await api.put('/api/v1/buyer/notifications/read-all');
    
    
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
    console.error('❌ [Buyer] Error marking all as read:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Lỗi khi đánh dấu tất cả đã đọc',
    };
  }
};

/**
 * 5. XÓA THÔNG BÁO
 * DELETE /api/v1/buyer/notifications/{notificationId}
 */
export const deleteBuyerNotification = async (notificationId) => {
  try {
    
    const response = await api.delete(`/api/v1/buyer/notifications/${notificationId}`);
    
    
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
    console.error('❌ [Buyer] Error deleting notification:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Lỗi khi xóa thông báo',
    };
  }
};

// Export default object
export default {
  getBuyerNotifications,
  getBuyerUnreadCount,
  markBuyerNotificationAsRead,
  markAllBuyerNotificationsAsRead,
  deleteBuyerNotification,
};
