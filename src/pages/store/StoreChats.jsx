import React, { useState } from 'react';
import StoreLayout from '../../layouts/StoreLayout';
import StoreStatusGuard from '../../components/store/StoreStatusGuard';
import { useStoreContext } from '../../context/StoreContext';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import ConversationList from '../../components/chat/ConversationList';
import MessageList from '../../components/chat/MessageList';
import MessageInput from '../../components/chat/MessageInput';
import { getConversationDisplayName, getConversationDisplayAvatar } from '../../services/chat/chatService';

/**
 * StoreChats - Chat interface for Store Dashboard
 * Store owner can chat with customers
 */
const StoreChats = () => {
  const { currentStore, loading: storeLoading } = useStoreContext();
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

  // ✅ Filter conversations: Chỉ lấy conversations của store này
  const storeConversations = conversations.filter(
    conv => conv.storeId === currentStore?.id
  );

  const handleSelectConversation = (conversation) => {
    selectConversation(conversation);
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  };

  const handleSendMessage = (content) => {
    sendMessage(content, 'TEXT');
  };

  return (
    <StoreStatusGuard currentStore={currentStore} pageName="chat" loading={storeLoading}>
      <StoreLayout>
        <div className="space-y-6">
          {/* Header */}
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
                <h1 className="text-2xl font-bold text-gray-900">💬 Chat với khách hàng</h1>
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

            {unreadCount > 0 && (
              <div className="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full">
                {unreadCount} chưa đọc
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="h-[calc(100vh-250px)] bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex h-full">
              {/* Sidebar - Conversation List */}
              <div 
                className={`
                  ${showSidebar ? 'block' : 'hidden'} 
                  md:block w-full md:w-80 lg:w-96 border-r flex-shrink-0
                `}
              >
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b bg-gray-50">
                    <h2 className="font-semibold text-gray-900">Tin nhắn</h2>
                    <p className="text-sm text-gray-600">{storeConversations.length} cuộc trò chuyện</p>
                  </div>

                  <ConversationList
                    conversations={storeConversations}
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
                          {isTyping && typingUsers.size > 0 && (
                            <p className="text-sm text-blue-500">Đang nhập...</p>
                          )}
                        </div>
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
                  <div className="flex-1 flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <div className="text-6xl mb-4">💬</div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Chọn một cuộc trò chuyện
                      </h3>
                      <p className="text-gray-600">
                        Chọn khách hàng từ danh sách để bắt đầu chat
                      </p>
                      <button
                        onClick={() => setShowSidebar(true)}
                        className="mt-4 md:hidden px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        Xem danh sách
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </StoreLayout>
    </StoreStatusGuard>
  );
};

export default StoreChats;
