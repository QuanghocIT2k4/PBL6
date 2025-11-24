import React, { useState, useEffect, useRef } from 'react';
import NotificationDropdown from './NotificationDropdown';

/**
 * NotificationBell Component
 * Bell icon with unread badge + dropdown
 * Style: Shopee/Lazada inspired
 */
const NotificationBell = ({ 
  notifications = [], 
  unreadCount = 0,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onLoadMore,
  hasMore = false,
  loading = false,
  userType = 'buyer' // 'buyer' or 'store'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
        aria-label="Notifications"
      >
        {/* Bell Icon */}
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[20px] animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Ping animation for new notifications */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex h-3 w-3 translate-x-1/2 -translate-y-1/2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
          onDelete={onDelete}
          onLoadMore={onLoadMore}
          onClose={() => setIsOpen(false)}
          hasMore={hasMore}
          loading={loading}
          userType={userType}
        />
      )}
    </div>
  );
};

export default NotificationBell;
