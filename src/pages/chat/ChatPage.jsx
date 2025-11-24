import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import MainLayout from '../../layouts/MainLayout';
import ConversationList from '../../components/chat/ConversationList';
import MessageList from '../../components/chat/MessageList';
import MessageInput from '../../components/chat/MessageInput';
import { getConversationDisplayName, getConversationDisplayAvatar } from '../../services/chat/chatService';

/**
 * ChatPage - Main chat interface
 * Layout: Sidebar (conversations) + Main (messages)
 */
const ChatPage = () => {
  const { user } = useAuth();
  const {
    conversations,
    currentConversation,
    messages,
    unreadCount,
    isConnected,
    isTyping,
    typingUsers,
    loading,
    selectConversation,
    sendMessage,
    deleteMessage,
    loadMoreMessages,
    handleTyping
  } = useChat();

  const [showSidebar, setShowSidebar] = useState(true);

  // ⭐ Clear currentConversation khi unmount (navigate ra khỏi chat page)
  useEffect(() => {
    return () => {
      selectConversation(null);
    };
  }, []);

  const handleSelectConversation = (conversation) => {
    selectConversation(conversation);
    // Hide sidebar on mobile after selecting
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  };

  const handleSendMessage = (content) => {
    sendMessage(content, 'TEXT');
  };

  return (
    <MainLayout>
      <div className="bg-gray-50 py-6">
        {/* Page Header */}
        <div className="max-w-7xl mx-auto px-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">💬 Chat</h1>
                <p className="text-sm text-gray-600">
                  {isConnected ? (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Đang kết nối
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      Mất kết nối
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Unread badge */}
            {unreadCount > 0 && (
              <div className="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full">
                {unreadCount} chưa đọc
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 h-[calc(100vh-250px)]">
        <div className="flex h-full bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Sidebar - Conversation List */}
          <div 
            className={`
              ${showSidebar ? 'block' : 'hidden'} 
              md:block w-full md:w-80 lg:w-96 border-r flex-shrink-0
            `}
          >
            <div className="h-full flex flex-col">
              {/* Sidebar Header */}
              <div className="p-4 border-b bg-gray-50">
                <h2 className="font-semibold text-gray-900">Tin nhắn</h2>
                <p className="text-sm text-gray-600">{conversations.length} cuộc trò chuyện</p>
              </div>

              {/* Conversation List */}
              <ConversationList
                conversations={conversations}
                currentConversation={currentConversation}
                onSelectConversation={handleSelectConversation}
                currentUserId={user?.id}
                loading={loading && !currentConversation}
              />
            </div>
          </div>

          {/* Main - Messages */}
          <div className={`
            ${showSidebar ? 'hidden md:flex' : 'flex'} 
            flex-1 flex-col
          `}>
            {currentConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b bg-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowSidebar(true)}
                      className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    <img
                      src={getConversationDisplayAvatar(currentConversation, user?.id)}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full"
                      onError={(e) => { e.target.src = '/default-avatar.png'; }}
                    />
                    
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {getConversationDisplayName(currentConversation, user?.id)}
                      </h3>
                      {currentConversation.productName && (
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          {currentConversation.productName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="Thông tin"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <MessageList
                  messages={messages}
                  currentUserId={user?.id}
                  currentConversation={currentConversation}
                  isTyping={isTyping}
                  typingUsers={typingUsers}
                  onDelete={deleteMessage}
                  onLoadMore={loadMoreMessages}
                  loading={loading}
                />

                {/* Message Input */}
                <MessageInput
                  onSendMessage={handleSendMessage}
                  onTyping={handleTyping}
                  disabled={!isConnected}
                  placeholder={isConnected ? 'Nhập tin nhắn...' : 'Đang kết nối lại...'}
                />
              </>
            ) : (
              // No conversation selected
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                <svg className="w-24 h-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h2 className="text-xl font-semibold mb-2">Chọn một cuộc trò chuyện</h2>
                <p className="text-sm">Chọn từ danh sách bên trái để bắt đầu chat</p>
                
                <button
                  onClick={() => setShowSidebar(true)}
                  className="mt-4 md:hidden px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Xem danh sách
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </MainLayout>
  );
};

export default ChatPage;
