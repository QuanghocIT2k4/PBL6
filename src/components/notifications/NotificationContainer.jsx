import React, { useState, useEffect, useCallback } from 'react';
import NotificationBell from './NotificationBell';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

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
const NotificationContainer = ({ userType = 'buyer', storeId = null, autoLoad = true }) => {
  const { success, error: showError } = useToast();
  const { isAuthenticated } = useAuth();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // ✅ Define loadNotifications BEFORE useEffect to avoid initialization error
  const loadNotifications = useCallback(async (silent = false) => {
    // ✅ KHÔNG load nếu chưa đăng nhập - RETURN NGAY
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    if (!silent) setLoading(true);
    
    try {
      // ✅ Double check - nếu logout trong lúc đang gọi API
      if (!isAuthenticated) {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      let result;
      
      if (userType === 'buyer') {
        result = await getBuyerNotifications({ page: 0, size: 10 });
      } else if (userType === 'admin') {
        result = await getAdminNotifications({ page: 0, size: 10 });
      } else if (userType === 'store' && storeId) {
        result = await getStoreNotifications(storeId, { page: 0, size: 10 });
      }
      
      // ✅ Check lại isAuthenticated sau khi API trả về
      if (!isAuthenticated) {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
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
        // ✅ Chỉ log error nếu vẫn đang đăng nhập, không log khi đã logout
        if (isAuthenticated) {
          console.warn('⚠️ Cannot load notifications:', result.error);
        }
      }
    } catch (err) {
      // ✅ Chỉ log error nếu vẫn đang đăng nhập
      if (isAuthenticated) {
        console.error('❌ Error loading notifications:', err);
      }
      // ✅ Clear state nếu có lỗi và đã logout
      if (!isAuthenticated) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [userType, storeId, showError, isAuthenticated]);

  // ✅ Clear notifications IMMEDIATELY when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear ngay lập tức, không đợi
      setNotifications([]);
      setUnreadCount(0);
      setPage(0);
      setHasMore(false);
    }
  }, [isAuthenticated]);

  // Load notifications on mount và auto-poll mỗi 30s (nếu autoLoad === true)
  useEffect(() => {
    if (!autoLoad) {
      // Nếu tắt autoLoad: không tự gọi API ở đây
      return;
    }

    if (!isAuthenticated) {
      // Clear khi logout
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    loadNotifications();
    
    const interval = setInterval(() => {
      if (isAuthenticated) {
        loadNotifications(true); // Silent reload
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [userType, storeId, isAuthenticated, loadNotifications, autoLoad]);

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

  // ✅ CHỈ HIỂN THỊ BADGE KHI ĐÃ ĐĂNG NHẬP VÀ CÓ THÔNG BÁO
  // Icon luôn hiển thị, nhưng badge chỉ hiển thị khi isAuthenticated
  const displayUnreadCount = isAuthenticated ? unreadCount : 0;

  return (
    <NotificationBell
      notifications={isAuthenticated ? notifications : []}
      unreadCount={displayUnreadCount}
      onMarkAsRead={isAuthenticated ? handleMarkAsRead : undefined}
      onMarkAllAsRead={isAuthenticated ? handleMarkAllAsRead : undefined}
      onDelete={isAuthenticated ? handleDelete : undefined}
      onLoadMore={isAuthenticated ? handleLoadMore : undefined}
      hasMore={isAuthenticated ? hasMore : false}
      loading={loading}
      userType={userType}
      // Khi autoLoad = false: chỉ fetch khi user mở dropdown lần đầu
      onOpen={!autoLoad && isAuthenticated ? () => loadNotifications() : undefined}
    />
  );
};

export default NotificationContainer;
