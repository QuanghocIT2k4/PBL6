import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import chatWebSocketService from '../services/chat/chatWebSocket';
import * as chatService from '../services/chat/chatService';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [loading, setLoading] = useState(false);
  
  const typingTimeoutRef = useRef(null);
  const messageHandlerRef = useRef(null);
  const typingHandlerRef = useRef(null);
  const connectionHandlerRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // ==================== WEBSOCKET CONNECTION ====================

  /**
   * Kết nối WebSocket khi user đăng nhập
   */
  useEffect(() => {
    console.log('🔧 [ChatContext] useEffect - Checking WebSocket connection:', {
      hasUser: !!user,
      userId: user?.id,
      userName: user?.username
    });
    
    if (user && user.id) {
      const token = localStorage.getItem('token');
      console.log('🔑 [ChatContext] Token found:', !!token);
      
      if (token) {
        console.log('🚀 [ChatContext] Connecting WebSocket...');
        chatWebSocketService.connect(token);
        chatWebSocketService.sendPresence(user.id, true, 'online');
      } else {
        console.error('❌ [ChatContext] No token found!');
      }
    } else {
      console.log('⚠️ [ChatContext] No user, skipping WebSocket connection');
    }

    return () => {
      if (user && user.id) {
        console.log('🔌 [ChatContext] Cleanup - Disconnecting WebSocket');
        chatWebSocketService.sendPresence(user.id, false, 'offline');
        chatWebSocketService.disconnect();
      }
    };
  }, [user]);

  /**
   * Setup WebSocket event handlers
   */
  useEffect(() => {
    // Message handler - Nhận tin nhắn mới
    messageHandlerRef.current = (message) => {
      const isCurrentConversation = currentConversation?.id === message.conversationId;
      const isOwnMessage = message.senderId === user?.id;
      
      console.log('🔔 [ChatContext] Received NEW message via WebSocket:', {
        messageId: message.id,
        conversationId: message.conversationId,
        currentConversationId: currentConversation?.id,
        isCurrentConversation,
        isOwnMessage,
        'message.senderId': message.senderId,
        'user.id': user?.id,
        'senderId === user.id': message.senderId === user?.id,
        content: message.content
      });
      
      // 1. Nếu là conversation đang mở → Add vào messages
      if (isCurrentConversation) {
        setMessages(prev => {
          // Check duplicate by ID
          if (prev.some(m => m.id === message.id)) {
            console.log('⚠️ [ChatContext] Duplicate message (same ID), skipping');
            return prev;
          }
          
          // ⭐ Replace optimistic message nếu có (cùng content + senderId)
          const optimisticIndex = prev.findIndex(m => 
            m.id.startsWith('temp-') && 
            m.content === message.content && 
            m.senderId === message.senderId
          );
          
          if (optimisticIndex !== -1) {
            console.log('✅ [ChatContext] Replacing optimistic message with real message');
            const newMessages = [...prev];
            newMessages[optimisticIndex] = message;
            return newMessages;
          }
          
          console.log('✅ [ChatContext] Adding new message to current conversation');
          return [...prev, message];
        });
        
        // Auto mark as read (chỉ mark nếu KHÔNG phải tin của mình)
        if (!isOwnMessage) {
          chatWebSocketService.markAsRead(null, message.conversationId);
        }
      }
      
      // 2. Update conversation list (sidebar) - LUÔN LUÔN update
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv.id === message.conversationId) {
            // Tăng unread count nếu:
            // - Không phải conversation đang mở
            // - Không phải tin của chính mình
            const shouldIncreaseUnread = !isCurrentConversation && !isOwnMessage;
            
            return {
              ...conv,
              lastMessage: message.content,
              lastMessageTime: message.sentAt,
              lastMessageSenderId: message.senderId, // ⭐ Lưu senderId để hiển thị "Bạn: "
              unreadCount: shouldIncreaseUnread 
                ? (conv.unreadCount || 0) + 1 
                : conv.unreadCount || 0
            };
          }
          return conv;
        });
        
        // Sort by last message time (conversation mới nhất lên trên)
        const sorted = updated.sort((a, b) => 
          new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0)
        );
        
        // 3. Update global unread count (badge icon chat)
        // ⭐ ĐẾM SỐ CONVERSATIONS có tin chưa đọc, không phải tổng số tin
        const unreadConversationsCount = sorted.filter(conv => conv.unreadCount > 0).length;
        console.log('📬 [ChatContext] Updating global unread count:', unreadConversationsCount);
        setUnreadCount(unreadConversationsCount);
        
        return sorted;
      });
    };
    
    // ✅ READ Receipt handler - Cập nhật status khi người khác đọc
    const readReceiptHandler = (data) => {
      // data = { conversationId, messageId, userId }
      if (currentConversation && data.conversationId === currentConversation.id) {
        setMessages(prev => prev.map(msg => {
          // Update tất cả messages trong conversation thành READ
          if (msg.conversationId === data.conversationId && msg.senderId === user?.id) {
            return { ...msg, status: 'READ' };
          }
          return msg;
        }));
      }
    };

    // Typing handler
    typingHandlerRef.current = (typingData) => {
      if (typingData.userId === user?.id) return; // Ignore own typing
      
      setTypingUsers(prev => {
        const updated = new Map(prev);
        if (typingData.isTyping) {
          updated.set(typingData.userId, typingData.userName);
        } else {
          updated.delete(typingData.userId);
        }
        return updated;
      });
      
      setIsTyping(typingData.isTyping && typingData.userId !== user?.id);
    };

    // Connection handler
    connectionHandlerRef.current = (connected) => {
      setIsConnected(connected);
    };

    // Register handlers
    chatWebSocketService.onMessage(messageHandlerRef.current);
    chatWebSocketService.onTyping(typingHandlerRef.current);
    chatWebSocketService.onConnectionChange(connectionHandlerRef.current);
    
    // ✅ Register READ receipt handler
    chatWebSocketService.onReadReceipt(readReceiptHandler);

    return () => {
      // Cleanup handlers
      if (messageHandlerRef.current) {
        chatWebSocketService.offMessage(messageHandlerRef.current);
      }
      if (typingHandlerRef.current) {
        chatWebSocketService.offTyping(typingHandlerRef.current);
      }
      if (connectionHandlerRef.current) {
        chatWebSocketService.offConnectionChange(connectionHandlerRef.current);
      }
      // Cleanup READ receipt handler
      chatWebSocketService.offReadReceipt(readReceiptHandler);
    };
  }, [user, currentConversation]);

  // ==================== CONVERSATION MANAGEMENT ====================

  /**
   * Load conversations list
   */
  const loadConversations = useCallback(async (page = 0, size = 20) => {
    setLoading(true);
    try {
      const result = await chatService.getConversations(page, size);
      if (result.success) {
        const convs = result.data.content || [];
        setConversations(convs);
        
        // ⭐ Tính số conversations có tin chưa đọc
        const unreadConversationsCount = convs.filter(conv => conv.unreadCount > 0).length;
        setUnreadCount(unreadConversationsCount);
        console.log('📬 [ChatContext] Loaded conversations, unread count:', unreadConversationsCount);
      } else {
        console.error('❌ Failed to load conversations:', result.error);
      }
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load unread count
   */
  const loadUnreadCount = useCallback(async () => {
    try {
      const result = await chatService.getUnreadCount();
      if (result.success) {
        setUnreadCount(result.data);
      }
    } catch (error) {
      console.error('❌ Error loading unread count:', error);
    }
  }, []);

  /**
   * Create new conversation
   */
  const createConversation = useCallback(async (data) => {
    try {
      const result = await chatService.createConversation(data);
      if (result.success) {
        // ✅ Reload conversations để lấy conversation với ID đầy đủ từ backend
        await loadConversations();
        
        // ✅ Tìm conversation vừa tạo (theo storeId)
        const newConv = conversations.find(c => c.storeId === data.storeId) || result.data;
        return newConv;
      } else {
        console.error('❌ Failed to create conversation:', result.error);
        return null;
      }
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      return null;
    }
  }, [loadConversations, conversations]);

  /**
   * Select conversation and load messages
   */
  const selectConversation = useCallback(async (conversation) => {
    setCurrentConversation(conversation);
    setMessages([]);
    
    // ⭐ Nếu conversation = null → Chỉ clear, không load gì cả
    if (!conversation) {
      setLoading(false);
      return;
    }
    
    setLoading(true);

    try {
      // Load messages
      const result = await chatService.getMessages(conversation.id, 0, 50);
      if (result.success) {
        const loadedMessages = result.data.content?.reverse() || [];
        setMessages(loadedMessages);
        
        // ⭐ Update sidebar với tin nhắn mới nhất
        if (loadedMessages.length > 0) {
          const lastMsg = loadedMessages[loadedMessages.length - 1];
          setConversations(prev => prev.map(conv => 
            conv.id === conversation.id 
              ? {
                  ...conv,
                  lastMessage: lastMsg.content,
                  lastMessageTime: lastMsg.sentAt,
                  lastMessageSenderId: lastMsg.senderId
                }
              : conv
          ));
        }
      }

      // Mark as read
      await chatService.markConversationAsRead(conversation.id);
      
      // Subscribe to typing indicator
      chatWebSocketService.subscribeToTyping(conversation.id);
      
      // Subscribe to conversation topic (broadcast) ⭐ MỚI
      chatWebSocketService.subscribeToConversation(conversation.id);
      
      // Update unread count trong conversation và global badge
      setConversations(prev => {
        const updated = prev.map(conv => 
          conv.id === conversation.id 
            ? { ...conv, unreadCount: 0 }
            : conv
        );
        
        // ⭐ Cập nhật global badge = số conversations còn chưa đọc
        const unreadConversationsCount = updated.filter(conv => conv.unreadCount > 0).length;
        setUnreadCount(unreadConversationsCount);
        
        return updated;
      });
      
      loadUnreadCount();
    } catch (error) {
      console.error('❌ Error selecting conversation:', error);
    } finally {
      setLoading(false);
    }
  }, [loadUnreadCount]);

  /**
   * Archive conversation
   */
  const archiveConversation = useCallback(async (conversationId) => {
    try {
      const result = await chatService.archiveConversation(conversationId);
      if (result.success) {
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(null);
          setMessages([]);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error archiving conversation:', error);
      return false;
    }
  }, [currentConversation]);

  // ==================== MESSAGE MANAGEMENT ====================

  /**
   * Send message via WebSocket
   */
  const sendMessage = useCallback((content, type = 'TEXT', options = {}) => {
    if (!currentConversation) {
      console.error('❌ No conversation selected');
      return false;
    }

    const messageData = {
      conversationId: currentConversation.id,
      content,
      type,
      attachments: options.attachments || [],
      replyToMessageId: options.replyToMessageId || null,
      productId: options.productId || null
    };

    // Send via WebSocket
    const sent = chatWebSocketService.sendMessage(messageData);
    
    if (sent) {
      // Optimistic UI update
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        conversationId: currentConversation.id,
        senderId: user.id,
        senderName: user.fullName,
        senderAvatar: user.avatar,
        content,
        type,
        status: 'SENT',
        sentAt: new Date().toISOString(),
        ...options
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Stop typing indicator
      sendTypingIndicator(false);
    }
    
    return sent;
  }, [currentConversation, user]);

  /**
   * Send typing indicator
   */
  const sendTypingIndicator = useCallback((isTyping) => {
    if (!currentConversation || !user) return;

    chatWebSocketService.sendTypingIndicator(
      currentConversation.id,
      user.id,
      user.fullName,
      isTyping
    );
  }, [currentConversation, user]);

  /**
   * Handle input change (with debounced typing indicator)
   */
  const handleTyping = useCallback(() => {
    // Send typing = true
    sendTypingIndicator(true);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout: stop typing after 2s
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(false);
    }, 2000);
  }, [sendTypingIndicator]);

  /**
   * Delete message
   */
  const deleteMessage = useCallback(async (messageId) => {
    try {
      const result = await chatService.deleteMessage(messageId);
      if (result.success) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, status: 'DELETED', content: 'Tin nhắn đã bị xóa' }
              : msg
          )
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      return false;
    }
  }, []);

  /**
   * Load more messages (pagination)
   */
  const loadMoreMessages = useCallback(async () => {
    if (!currentConversation) return;

    const currentPage = Math.floor(messages.length / 50);
    setLoading(true);

    try {
      const result = await chatService.getMessages(currentConversation.id, currentPage, 50);
      if (result.success && result.data.content?.length > 0) {
        setMessages(prev => [...result.data.content.reverse(), ...prev]);
      }
    } catch (error) {
      console.error('❌ Error loading more messages:', error);
    } finally {
      setLoading(false);
    }
  }, [currentConversation, messages.length]);

  // ==================== INITIAL LOAD ====================

  useEffect(() => {
    if (user && user.id) {
      loadConversations();
      loadUnreadCount();
    }
  }, [user, loadConversations, loadUnreadCount]);

  // ==================== CONTEXT VALUE ====================

  const value = {
    // State
    conversations,
    currentConversation,
    messages,
    unreadCount,
    isConnected,
    isTyping,
    typingUsers,
    loading,
    
    // Conversation actions
    loadConversations,
    createConversation,
    selectConversation,
    archiveConversation,
    
    // Message actions
    sendMessage,
    deleteMessage,
    loadMoreMessages,
    handleTyping,
    
    // Utilities
    loadUnreadCount
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
