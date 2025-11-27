import React, { useState } from 'react';
import { 
  formatNotificationTime, 
  getNotificationIcon, 
  getNotificationColor 
} from '../../services/buyer/notificationService';

/**
 * Format số tiền trong message notification
 * VD: "2.05E+7 VNĐ" → "20,500,000 VNĐ"
 * VD: "500080.0 VNĐ" → "500,080 VNĐ"
 */
const formatMoneyInMessage = (message) => {
  if (!message) return message;
  
  // Regex để tìm số tiền (bao gồm scientific notation và số thập phân)
  // Matches: 2.05E+7, 500080.0, 1000000, etc.
  const moneyRegex = /(\d+\.?\d*(?:E[+-]?\d+)?)\s*(VNĐ|VND|đ)/gi;
  
  return message.replace(moneyRegex, (match, number, currency) => {
    try {
      // Parse số (xử lý cả scientific notation)
      const parsedNumber = parseFloat(number);
      
      if (isNaN(parsedNumber)) return match;
      
      // Format số với dấu phẩy ngăn cách hàng nghìn
      const formattedNumber = new Intl.NumberFormat('vi-VN').format(Math.round(parsedNumber));
      
      return `${formattedNumber} ${currency}`;
    } catch (e) {
      return match;
    }
  });
};

/**
 * NotificationItem Component
 * Single notification card
 * Style: Shopee/Lazada inspired
 */
const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
  const [showActions, setShowActions] = useState(false);

  const handleClick = () => {
    // Mark as read when clicked
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.data) {
      const { orderId, productId, storeId } = notification.data;
      
      if (orderId) {
        window.location.href = `/orders/${orderId}`;
      } else if (productId) {
        window.location.href = `/products/${productId}`;
      } else if (storeId) {
        window.location.href = `/stores/${storeId}`;
      }
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(notification.id);
    }
  };

  const handleMarkAsRead = (e) => {
    e.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const icon = getNotificationIcon(notification.type);
  const color = getNotificationColor(notification.type);
  const timeAgo = formatNotificationTime(notification.createdAt);

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    gray: 'bg-gray-100 text-gray-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div
      className={`relative px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
        !notification.isRead ? 'bg-orange-50/30' : ''
      }`}
      onClick={handleClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl ${colorClasses[color] || colorClasses.gray}`}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-start justify-between gap-2">
            <h4 className={`text-sm font-medium text-gray-900 ${!notification.isRead ? 'font-semibold' : ''}`}>
              {notification.title}
            </h4>
            {!notification.isRead && (
              <span className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-1"></span>
            )}
          </div>

          {/* Message - Format số tiền */}
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {formatMoneyInMessage(notification.message)}
          </p>

          {/* Time */}
          <p className="text-xs text-gray-400 mt-1">
            {timeAgo}
          </p>
        </div>
      </div>

      {/* Action Buttons (show on hover) */}
      {showActions && (
        <div className="absolute top-2 right-2 flex gap-1">
          {!notification.isRead && (
            <button
              onClick={handleMarkAsRead}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Đánh dấu đã đọc"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}
          <button
            onClick={handleDelete}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Xóa"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationItem;
