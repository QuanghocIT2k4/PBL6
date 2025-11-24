import api from '../common/api';

/**
 * Chat Service - REST API calls
 * Handles conversation and message management
 */

// ==================== CONVERSATION APIs ====================

/**
 * Tạo cuộc trò chuyện mới
 * @param {Object} data - { recipientId?, storeId?, type, productId?, initialMessage? }
 * @returns {Promise<ConversationDTO>}
 */
export const createConversation = async (data) => {
  try {
    const response = await api.post('/api/v1/chat/conversations', data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ Error creating conversation:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

/**
 * Lấy danh sách conversations (có phân trang)
 * @param {number} page - Page number (default: 0)
 * @param {number} size - Page size (default: 20)
 * @returns {Promise<PagedConversations>}
 */
export const getConversations = async (page = 0, size = 20) => {
  try {
    const response = await api.get('/api/v1/chat/conversations', {
      params: { page, size }
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

/**
 * Lấy chi tiết 1 conversation
 * @param {string} conversationId
 * @returns {Promise<ConversationDTO>}
 */
export const getConversationById = async (conversationId) => {
  try {
    const response = await api.get(`/api/v1/chat/conversations/${conversationId}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ Error fetching conversation:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

/**
 * Tìm hoặc tạo conversation giữa 2 user
 * @param {string} recipientId
 * @param {string} storeId
 * @returns {Promise<ConversationDTO>}
 */
export const findOrCreateConversation = async (recipientId, storeId) => {
  try {
    const response = await api.get('/api/v1/chat/conversations/find-or-create', {
      params: { recipientId, storeId }
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ Error finding/creating conversation:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

/**
 * Lấy số lượng conversations chưa đọc (badge count)
 * @returns {Promise<number>}
 */
export const getUnreadCount = async () => {
  try {
    const response = await api.get('/api/v1/chat/conversations/unread-count');
    return {
      success: true,
      data: response.data.unreadCount
    };
  } catch (error) {
    console.error('❌ Error fetching unread count:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

/**
 * Lưu trữ conversation
 * @param {string} conversationId
 * @returns {Promise}
 */
export const archiveConversation = async (conversationId) => {
  try {
    const response = await api.post(`/api/v1/chat/conversations/${conversationId}/archive`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ Error archiving conversation:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

// ==================== MESSAGE APIs ====================

/**
 * Lấy lịch sử tin nhắn (có phân trang)
 * @param {string} conversationId
 * @param {number} page - Page number (default: 0)
 * @param {number} size - Page size (default: 50)
 * @returns {Promise<PagedMessages>}
 */
export const getMessages = async (conversationId, page = 0, size = 50) => {
  try {
    const response = await api.get(`/api/v1/chat/conversations/${conversationId}/messages`, {
      params: { page, size }
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

/**
 * Gửi tin nhắn (REST - fallback, khuyến nghị dùng WebSocket)
 * @param {Object} data - { conversationId, content, type, attachments?, replyToMessageId? }
 * @returns {Promise<ChatMessageDTO>}
 */
export const sendMessage = async (data) => {
  try {
    const response = await api.post('/api/v1/chat/messages', data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ Error sending message:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

/**
 * Đánh dấu 1 tin nhắn đã đọc
 * @param {string} messageId
 * @returns {Promise}
 */
export const markMessageAsRead = async (messageId) => {
  try {
    const response = await api.post(`/api/v1/chat/messages/${messageId}/read`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ Error marking message as read:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

/**
 * Đánh dấu toàn bộ conversation đã đọc
 * @param {string} conversationId
 * @returns {Promise}
 */
export const markConversationAsRead = async (conversationId) => {
  try {
    const response = await api.post(`/api/v1/chat/conversations/${conversationId}/read`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ Error marking conversation as read:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

/**
 * Xóa tin nhắn (soft delete)
 * @param {string} messageId
 * @returns {Promise<ChatMessageDTO>}
 */
export const deleteMessage = async (messageId) => {
  try {
    const response = await api.delete(`/api/v1/chat/messages/${messageId}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ Error deleting message:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Format conversation type to Vietnamese
 * @param {string} type - BUYER_SELLER | BUYER_SUPPORT | SELLER_SUPPORT
 * @returns {string}
 */
export const formatConversationType = (type) => {
  const types = {
    BUYER_SELLER: 'Người mua - Cửa hàng',
    BUYER_SUPPORT: 'Người mua - Hỗ trợ',
    SELLER_SUPPORT: 'Người bán - Hỗ trợ'
  };
  return types[type] || type;
};

/**
 * Format message type to Vietnamese
 * @param {string} type - TEXT | IMAGE | FILE | SYSTEM | PRODUCT_LINK
 * @returns {string}
 */
export const formatMessageType = (type) => {
  const types = {
    TEXT: 'Văn bản',
    IMAGE: 'Hình ảnh',
    FILE: 'File đính kèm',
    SYSTEM: 'Thông báo hệ thống',
    PRODUCT_LINK: 'Link sản phẩm'
  };
  return types[type] || type;
};

/**
 * Format message status to Vietnamese
 * @param {string} status - SENT | DELIVERED | READ | DELETED
 * @returns {string}
 */
export const formatMessageStatus = (status) => {
  const statuses = {
    SENT: 'Đã gửi',
    DELIVERED: 'Đã nhận',
    READ: 'Đã đọc',
    DELETED: 'Đã xóa'
  };
  return statuses[status] || status;
};

/**
 * Format timestamp to readable format
 * @param {string} timestamp - ISO 8601 format
 * @returns {string}
 */
export const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Get conversation display name
 * @param {ConversationDTO} conversation
 * @param {string} currentUserId
 * @returns {string}
 */
export const getConversationDisplayName = (conversation, currentUserId) => {
  // ✅ Nếu có storeName → Luôn ưu tiên hiển thị (vì đây là chat với store)
  // Logic: Conversation có storeId/storeName = BUYER_SELLER chat
  if (conversation.storeName) {
    return conversation.storeName;
  }
  
  // ✅ Tìm người còn lại (không phải mình)
  const otherParticipant = conversation.participants?.find(
    p => p.userId !== currentUserId
  );
  
  // ✅ Nếu có tên người còn lại → Hiển thị tên đó
  if (otherParticipant?.userName) {
    return otherParticipant.userName;
  }
  
  return 'Unknown';
};

/**
 * Get conversation display avatar
 * @param {ConversationDTO} conversation
 * @param {string} currentUserId
 * @returns {string}
 */
export const getConversationDisplayAvatar = (conversation, currentUserId) => {
  // ✅ Nếu có storeAvatar → Luôn ưu tiên hiển thị (vì đây là chat với store)
  // Logic: Conversation có storeId/storeAvatar = BUYER_SELLER chat
  if (conversation.storeAvatar) {
    return conversation.storeAvatar;
  }
  
  // ✅ Tìm người còn lại (không phải mình)
  const otherParticipant = conversation.participants?.find(
    p => p.userId !== currentUserId
  );
  
  // ✅ Nếu có avatar người còn lại → Hiển thị avatar đó
  // Backend có thể trả về userAvatar hoặc avatar
  if (otherParticipant) {
    const avatar = otherParticipant.userAvatar || otherParticipant.avatar;
    if (avatar) {
      return avatar;
    }
  }
  
  return '/default-avatar.png';
};
