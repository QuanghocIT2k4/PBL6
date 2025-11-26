import React, { useState, useEffect, useCallback } from 'react';
import NotificationBell from './NotificationBell';
import { useToast } from '../../context/ToastContext';

// Import services based on user type
import {
  getBuyerNotifications,
  getBuyerUnreadCount,
  markBuyerNotificationAsRead,
  markAllBuyerNotificationsAsRead,
  deleteBuyerNotification,
} from '../../services/notification/buyerNotificationService';

import {
  getStoreNotifications,
  getStoreUnreadCount,
  markStoreNotificationAsRead,
  markAllStoreNotificationsAsRead,
  deleteStoreNotification,
} from '../../services/notification/storeNotificationService';

import {
  getAdminNotifications,
  getAdminUnreadCount,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  deleteAdminNotification,
} from '../../services/notification/adminNotificationService';

/**
 * NotificationContainer Component
 * Handles all notification logic and state
 * Integrates with NotificationBell
 */
const NotificationContainer = ({ userType = 'buyer', storeId = null }) => {
  const { success, error: showError } = useToast();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Load notifications on mount and every 30 seconds
  useEffect(() => {
    loadNotifications();
    
    const interval = setInterval(() => {
      loadNotifications(true); // Silent reload
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [userType, storeId]);

  const loadNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    
    try {
      let result;
      
      if (userType === 'buyer') {
        result = await getBuyerNotifications({ page: 0, size: 10 });
      } else if (userType === 'admin') {
        result = await getAdminNotifications({ page: 0, size: 10 });
      } else if (userType === 'store' && storeId) {
        result = await getStoreNotifications(storeId, { page: 0, size: 10 });
      }
      
      if (result && result.success) {
        const data = result.data;
        // Đảm bảo notificationList luôn là array
        // ✅ Đảm bảo notificationList luôn là array
        let notificationList = [];
        if (Array.isArray(result.data)) {
          notificationList = result.data;
        } else if (Array.isArray(result.data?.content)) {
          notificationList = result.data.content;
        } else if (result.data?.notifications && Array.isArray(result.data.notifications)) {
          notificationList = result.data.notifications;
        }
        
        setNotifications(notificationList);
        
        const unread = notificationList.filter(n => !n.isRead).length;
        setUnreadCount(unread);
        setHasMore(data?.totalPages > 1);
        setPage(0);
      } else if (result && result.error) {
        // ✅ Chỉ log error, không hiển thị toast khi chưa đăng nhập
        console.warn('⚠️ Cannot load notifications:', result.error);
      }
    } catch (err) {
      console.error('❌ Error loading notifications:', err);
      // ✅ Không hiển thị toast lỗi cho user
    } finally {
      if (!silent) setLoading(false);
    }
  }, [userType, storeId, showError]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      let result;
      
      if (userType === 'admin') {
        result = await markAdminNotificationAsRead(notificationId);
      } else if (userType === 'store' && storeId) {
        result = await markStoreNotificationAsRead(storeId, notificationId);
      } else {
        result = await markBuyerNotificationAsRead(notificationId);
      }

      if (result.success) {
        // Update local state
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      let result;
      
      if (userType === 'admin') {
        result = await markAllAdminNotificationsAsRead();
      } else if (userType === 'store' && storeId) {
        result = await markAllStoreNotificationsAsRead(storeId);
      } else {
        result = await markAllBuyerNotificationsAsRead();
      }

      if (result.success) {
        success('Đã đánh dấu tất cả đã đọc');
        
        // Update local state
        setNotifications(prev =>
          prev.map(n => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
      } else {
        showError(result.error);
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
      showError('Không thể đánh dấu tất cả đã đọc');
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      let result;
      
      if (userType === 'admin') {
        result = await deleteAdminNotification(notificationId);
      } else if (userType === 'store' && storeId) {
        result = await deleteStoreNotification(storeId, notificationId);
      } else {
        result = await deleteBuyerNotification(notificationId);
      }

      if (result.success) {
        success('Đã xóa thông báo');
        
        // Update local state
        const deletedNotif = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        
        if (deletedNotif && !deletedNotif.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } else {
        showError(result.error);
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      showError('Không thể xóa thông báo');
    }
  };

  const handleLoadMore = async () => {
    setLoading(true);
    
    try {
      const nextPage = page + 1;
      let result;
      
      if (userType === 'store' && storeId) {
        result = await getStoreNotifications(storeId, { page: nextPage, size: 10 });
      } else {
        result = await getBuyerNotifications({ page: nextPage, size: 10 });
      }

      if (result.success) {
        const data = result.data;
        const notifList = data.content || data.notifications || [];
        
        setNotifications(prev => [...prev, ...notifList]);
        setPage(nextPage);
        setHasMore(nextPage < data.totalPages - 1);
      }
    } catch (err) {
      console.error('Error loading more notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <NotificationBell
      notifications={notifications}
      unreadCount={unreadCount}
      onMarkAsRead={handleMarkAsRead}
      onMarkAllAsRead={handleMarkAllAsRead}
      onDelete={handleDelete}
      onLoadMore={handleLoadMore}
      hasMore={hasMore}
      loading={loading}
      userType={userType}
    />
  );
};

export default NotificationContainer;
