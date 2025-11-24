import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../utils/sweetalert';

/**
 * ChatButton Component
 * Nút để bắt đầu chat với store từ product detail hoặc store page
 */
const ChatButton = ({ 
  storeId, 
  storeName,
  productId = null,
  productName = null,
  type = 'BUYER_SELLER',
  className = '',
  children
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createConversation, conversations, selectConversation } = useChat();

  const handleStartChat = async () => {
    // Check if user is logged in
    if (!user || !user.id) {
      toast.warning('Vui lòng đăng nhập để chat');
      navigate('/auth');
      return;
    }

    // ✅ Check if conversation with this STORE already exists (ignore productId)
    const existingConversation = conversations.find(
      conv => conv.storeId === storeId
    );

    if (existingConversation) {
      // Navigate to existing conversation
      selectConversation(existingConversation);
      navigate('/chat');
      return;
    }

    // ✅ Create new conversation WITHOUT initial message
    const conversationData = {
      storeId,
      type,
      // ❌ KHÔNG GỬI initialMessage - User sẽ tự gõ tin nhắn đầu tiên
    };

    const newConversation = await createConversation(conversationData);
    
    if (newConversation) {
      selectConversation(newConversation);
      navigate('/chat');
    } else {
      toast.error('Không thể tạo cuộc trò chuyện. Vui lòng thử lại!');
    }
  };

  return (
    <button
      onClick={handleStartChat}
      className={className || 'flex items-center gap-2 px-4 py-2 bg-white border-2 border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors'}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      {children || 'Chat với shop'}
    </button>
  );
};

export default ChatButton;
