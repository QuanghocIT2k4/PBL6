import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

/**
 * MessageList Component
 * Hiển thị danh sách tin nhắn với auto-scroll
 */
const MessageList = ({ 
  messages, 
  currentUserId,
  currentConversation = null, // ✅ Thêm conversation để lấy avatar
  isTyping,
  typingUsers,
  onDelete,
  onLoadMore,
  hasMore = false,
  loading = false
}) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const prevScrollHeightRef = useRef(0);

  // ❌ BỎ AUTO-SCROLL - User tự scroll
  // const scrollToBottom = () => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // };

  // useEffect(() => {
  //   // Only auto-scroll if user is near bottom
  //   const container = messagesContainerRef.current;
  //   if (container) {
  //     const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
  //     if (isNearBottom) {
  //       scrollToBottom();
  //     }
  //   }
  // }, [messages]);

  // Handle scroll for load more
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Load more when scrolled to top
    if (container.scrollTop === 0 && hasMore && !loading) {
      prevScrollHeightRef.current = container.scrollHeight;
      onLoadMore?.();
    }
  };

  // Restore scroll position after loading more
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container && prevScrollHeightRef.current > 0) {
      const newScrollHeight = container.scrollHeight;
      container.scrollTop = newScrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = 0;
    }
  }, [messages.length]);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p className="text-lg font-medium">Chưa có tin nhắn</p>
        <p className="text-sm">Bắt đầu cuộc trò chuyện bằng cách gửi tin nhắn</p>
      </div>
    );
  }

  return (
    <div 
      ref={messagesContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 space-y-2"
    >
      {/* Load more indicator */}
      {loading && (
        <div className="flex justify-center py-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Messages */}
      {messages.map((message, index) => {
        const isOwn = message.senderId === currentUserId;
        const prevMessage = index > 0 ? messages[index - 1] : null;
        
        // ✅ Kiểm tra xem sender có avatar không
        let showAvatar = false;
        let senderAvatar = null;
        if (!isOwn) {
          const sender = currentConversation.participants?.find(
            p => (p.userId === message.senderId) || (p.onlineId === message.senderId)
          );
          const hasAvatar = sender?.userAvatar || sender?.avatar || sender?.avatarUrl || message.senderAvatar;
          if (hasAvatar) {
            // Có avatar → Hiển thị avatar người đó
            showAvatar = true;
            senderAvatar = hasAvatar;
          } else if (currentConversation.storeAvatar) {
            // Không có avatar → Đây là store owner → Dùng storeAvatar
            showAvatar = true;
            senderAvatar = currentConversation.storeAvatar;
          }
        } else {
          showAvatar = !prevMessage || prevMessage.senderId !== message.senderId;
        }
        
        // ✅ Lấy avatar của người nhận từ conversation participants
        let recipientAvatar = null;
        if (isOwn && currentConversation?.participants) {
          const otherParticipant = currentConversation.participants.find(
            p => (p.userId !== currentUserId) && (p.onlineId !== currentUserId)
          );
          
          recipientAvatar = otherParticipant?.userAvatar 
            || otherParticipant?.avatar 
            || otherParticipant?.avatarUrl
            || currentConversation.storeAvatar
            || currentConversation.buyerAvatar;
        }
        
        // ✅ Check xem có phải tin nhắn CUỐI CÙNG TRONG TOÀN BỘ không
        const isLastOwnMessage = isOwn && index === messages.length - 1;
        
        let senderName = null;
        if (!isOwn && currentConversation?.participants) {
          const sender = currentConversation.participants.find(
            p => (p.userId === message.senderId) || (p.onlineId === message.senderId)
          );
          // Kiểm tra có avatar không
          const hasAvatar = sender?.userAvatar || sender?.avatar || sender?.avatarUrl;
          if (hasAvatar) {
            // Có avatar → Hiển thị tên người đó (buyer)
            senderName = sender?.userName || sender?.name;
          } else if (currentConversation.storeId && currentConversation.storeName) {
            // Không có avatar → Đây là store owner → Hiển thị storeName
            senderName = currentConversation.storeName;
          }
        }

        // Override message.senderAvatar nếu có senderAvatar mới
        const messageWithAvatar = senderAvatar 
          ? { ...message, senderAvatar } 
          : message;
        
        return (
          <MessageBubble
            key={message.id}
            message={messageWithAvatar}
            isOwn={isOwn}
            showAvatar={showAvatar}
            onDelete={onDelete}
            recipientAvatar={recipientAvatar}
            isLastOwnMessage={isLastOwnMessage}
            senderName={senderName}
          />
        );
      })}

      {/* Typing indicator */}
      {isTyping && typingUsers.size > 0 && (
        <div className="flex gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"></div>
          <div className="bg-gray-100 rounded-lg px-4 py-3 rounded-bl-none">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
