import React from 'react';
import { formatMessageTime, getConversationDisplayName, getConversationDisplayAvatar } from '../../services/chat/chatService';

/**
 * ConversationList Component
 * Hiển thị danh sách cuộc trò chuyện
 */
const ConversationList = ({ 
  conversations, 
  currentConversation, 
  onSelectConversation,
  currentUserId,
  loading 
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p className="text-lg font-medium">Chưa có cuộc trò chuyện</p>
        <p className="text-sm">Bắt đầu chat với người bán hoặc hỗ trợ</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full">
      {conversations.map((conversation) => {
        const isActive = currentConversation?.id === conversation.id;
        const displayName = getConversationDisplayName(conversation, currentUserId);
        const displayAvatar = getConversationDisplayAvatar(conversation, currentUserId);
        const hasUnread = conversation.unreadCount > 0;

        return (
          <div
            key={conversation.id}
            onClick={() => onSelectConversation(conversation)}
            className={`
              flex items-center gap-3 p-4 cursor-pointer border-b transition-colors
              ${isActive ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'}
            `}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <img
                src={displayAvatar}
                alt={displayName}
                className="w-12 h-12 rounded-full object-cover"
                onError={(e) => {
                  e.target.src = '/default-avatar.png';
                }}
              />
              {/* Online indicator */}
              {conversation.participants?.some(p => p.online && p.userId !== currentUserId) && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Name & Time */}
              <div className="flex items-center justify-between mb-1">
                <h3 className={`font-semibold truncate ${hasUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                  {displayName}
                </h3>
                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                  {formatMessageTime(conversation.lastMessageTime)}
                </span>
              </div>

              {/* Last Message & Badge */}
              <div className="flex items-center justify-between">
                <p className={`text-sm truncate ${hasUnread ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                  {conversation.lastMessage || 'Chưa có tin nhắn'}
                </p>
                {hasUnread && (
                  <span className="flex-shrink-0 ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                    {conversation.unreadCount}
                  </span>
                )}
              </div>

              {/* Product info (if available) */}
              {conversation.productName && (
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span className="truncate">{conversation.productName}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConversationList;
