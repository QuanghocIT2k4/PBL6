import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

/**
 * Chat WebSocket Service
 * Handles real-time messaging via WebSocket/STOMP
 */

class ChatWebSocketService {
  constructor() {
    this.stompClient = null;
    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000; // 3 seconds
    this.subscriptions = new Map();
    this.messageHandlers = [];
    this.typingHandlers = [];
    this.presenceHandlers = [];
    this.connectionHandlers = [];
    this.readReceiptHandlers = []; // ✅ Handler cho READ receipt
  }

  /**
   * Kết nối WebSocket với JWT token
   * @param {string} jwtToken - JWT authentication token
   */
  connect(jwtToken) {
    if (this.connected) {
      return;
    }

    const wsUrl = 'https://e-commerce-raq1.onrender.com/ws/chat';
    
    try {
      this.socket = new SockJS(wsUrl);
      this.stompClient = Stomp.over(() => this.socket);

      // Disable debug logs
      this.stompClient.debug = () => {};

      // Connect với JWT token trong header
      this.stompClient.connect(
        { Authorization: `Bearer ${jwtToken}` },
        () => this.onConnected(),
        (error) => this.onError(error)
      );

      // Handle socket close
      this.socket.onclose = () => {
        console.log('🔴 [WebSocket] Connection closed');
        this.connected = false;
        this.notifyConnectionHandlers(false);
        this.attemptReconnect(jwtToken);
      };
    } catch (error) {
      console.error('❌ [WebSocket] Error during connect:', error);
    }
  }

  /**
   * Callback khi kết nối thành công
   */
  onConnected() {
    console.log('✅ [WebSocket] Connected!');
    this.connected = true;
    this.reconnectAttempts = 0;
    this.notifyConnectionHandlers(true);

    this.subscribeToMessages();
    this.subscribeToReadReceipts();
  }

  /**
   * Callback khi có lỗi kết nối
   */
  onError(error) {
    console.error('❌ [WebSocket] Error:', error.message || error);
    this.connected = false;
    this.notifyConnectionHandlers(false);
  }

  /**
   * Thử kết nối lại
   */
  attemptReconnect(jwtToken) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnect attempts reached. Please refresh the page.');
      return;
    }

    this.reconnectAttempts++;

    setTimeout(() => {
      this.connect(jwtToken);
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  /**
   * Subscribe to receive private messages
   */
  subscribeToMessages() {
    if (!this.stompClient || !this.connected) {
      console.error('❌ Cannot subscribe: WebSocket not connected');
      return;
    }

    const subscription = this.stompClient.subscribe('/user/queue/messages', (message) => {
      try {
        const chatMessage = JSON.parse(message.body);
        console.log('📨 [WebSocket] Received message:', chatMessage);
        this.notifyMessageHandlers(chatMessage);
      } catch (error) {
        console.error('❌ Error parsing message:', error);
      }
    });

    this.subscriptions.set('messages', subscription);
  }
  
  /**
   * Subscribe to conversation topic (broadcast)
   */
  subscribeToConversation(conversationId) {
    if (!this.stompClient || !this.connected) {
      console.error('❌ Cannot subscribe to conversation: WebSocket not connected');
      return;
    }

    // Unsubscribe nếu đã subscribe conversation cũ
    const oldSub = this.subscriptions.get('conversation-topic');
    if (oldSub) {
      oldSub.unsubscribe();
    }

    // Subscribe conversation topic mới
    const subscription = this.stompClient.subscribe(
      `/topic/conversation/${conversationId}`,
      (message) => {
        try {
          const chatMessage = JSON.parse(message.body);
          console.log('📢 [WebSocket] Received from topic:', chatMessage);
          this.notifyMessageHandlers(chatMessage);
        } catch (error) {
          console.error('❌ Error parsing message from topic:', error);
        }
      }
    );

    this.subscriptions.set('conversation-topic', subscription);
    console.log(`✅ Subscribed to /topic/conversation/${conversationId}`);
  }

  /**
   * Subscribe to READ receipts
   */
  subscribeToReadReceipts() {
    if (!this.stompClient || !this.connected) {
      console.error('❌ Cannot subscribe: WebSocket not connected');
      return;
    }

    const subscription = this.stompClient.subscribe('/user/queue/read-receipts', (message) => {
      try {
        const readReceipt = JSON.parse(message.body);
        console.log('✅ [WebSocket] Received READ receipt:', readReceipt);
        this.notifyReadReceiptHandlers(readReceipt);
      } catch (error) {
        console.error('❌ Error parsing READ receipt:', error);
      }
    });

    this.subscriptions.set('read-receipts', subscription);
  }

  /**
   * Subscribe to typing indicator for a conversation
   * @param {string} conversationId
   */
  subscribeToTyping(conversationId) {
    if (!this.stompClient || !this.connected) {
      console.error('❌ Cannot subscribe: WebSocket not connected');
      return;
    }

    const key = `typing-${conversationId}`;
    
    // Unsubscribe if already subscribed
    if (this.subscriptions.has(key)) {
      this.subscriptions.get(key).unsubscribe();
    }

    const subscription = this.stompClient.subscribe(
      `/topic/conversation/${conversationId}/typing`,
      (message) => {
        try {
          const typingData = JSON.parse(message.body);
          this.notifyTypingHandlers(typingData);
        } catch (error) {
          console.error('❌ Error parsing typing data:', error);
        }
      }
    );

    this.subscriptions.set(key, subscription);
  }

  /**
   * Unsubscribe from typing indicator
   * @param {string} conversationId
   */
  unsubscribeFromTyping(conversationId) {
    const key = `typing-${conversationId}`;
    if (this.subscriptions.has(key)) {
      this.subscriptions.get(key).unsubscribe();
      this.subscriptions.delete(key);
    }
  }

  /**
   * Gửi tin nhắn qua WebSocket
   * @param {Object} messageData - { conversationId, content, type, attachments?, replyToMessageId?, productId? }
   */
  sendMessage(messageData) {
    if (!this.stompClient || !this.connected) {
      console.error('❌ Cannot send message: WebSocket not connected');
      return false;
    }

    try {
      this.stompClient.send(
        '/app/chat.sendMessage',
        {},
        JSON.stringify(messageData)
      );
      return true;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      return false;
    }
  }

  /**
   * Gửi typing indicator
   * @param {string} conversationId
   * @param {string} userId
   * @param {string} userName
   * @param {boolean} isTyping
   */
  sendTypingIndicator(conversationId, userId, userName, isTyping) {
    if (!this.stompClient || !this.connected) {
      return false;
    }

    try {
      this.stompClient.send(
        '/app/chat.typing',
        {},
        JSON.stringify({
          conversationId,
          userId,
          userName,
          isTyping
        })
      );
      return true;
    } catch (error) {
      console.error('❌ Error sending typing indicator:', error);
      return false;
    }
  }

  /**
   * Đánh dấu tin nhắn/conversation đã đọc
   * @param {string} messageId - ID tin nhắn (optional)
   * @param {string} conversationId - ID conversation (optional)
   */
  markAsRead(messageId = null, conversationId = null) {
    if (!this.stompClient || !this.connected) {
      return false;
    }

    try {
      this.stompClient.send(
        '/app/chat.markRead',
        {},
        JSON.stringify({
          messageId,
          conversationId
        })
      );
      return true;
    } catch (error) {
      console.error('❌ Error marking as read:', error);
      return false;
    }
  }

  /**
   * Gửi user presence status
   * @param {string} userId
   * @param {boolean} online
   * @param {string} status - 'online' | 'offline' | 'away'
   */
  sendPresence(userId, online, status = 'online') {
    if (!this.stompClient || !this.connected) {
      return false;
    }

    try {
      this.stompClient.send(
        '/app/chat.userPresence',
        {},
        JSON.stringify({
          userId,
          online,
          status
        })
      );
      return true;
    } catch (error) {
      console.error('❌ Error sending presence:', error);
      return false;
    }
  }

  /**
   * Ngắt kết nối WebSocket
   */
  disconnect() {
    if (this.stompClient && this.connected) {
      // Unsubscribe all
      this.subscriptions.forEach((subscription) => {
        subscription.unsubscribe();
      });
      this.subscriptions.clear();

      this.stompClient.disconnect();
      
      this.connected = false;
      this.notifyConnectionHandlers(false);
    }
  }

  /**
   * Kiểm tra trạng thái kết nối
   * @returns {boolean}
   */
  isConnected() {
    return this.connected;
  }

  // ==================== EVENT HANDLERS ====================

  /**
   * Đăng ký handler cho message mới
   * @param {Function} handler - (message) => void
   */
  onMessage(handler) {
    this.messageHandlers.push(handler);
  }

  /**
   * Hủy đăng ký message handler
   * @param {Function} handler
   */
  offMessage(handler) {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }

  /**
   * Notify all message handlers
   * @param {Object} message
   */
  notifyMessageHandlers(message) {
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('❌ Error in message handler:', error);
      }
    });
  }

  /**
   * Đăng ký handler cho typing indicator
   * @param {Function} handler - (typingData) => void
   */
  onTyping(handler) {
    this.typingHandlers.push(handler);
  }

  /**
   * Hủy đăng ký typing handler
   * @param {Function} handler
   */
  offTyping(handler) {
    this.typingHandlers = this.typingHandlers.filter(h => h !== handler);
  }

  /**
   * Notify all typing handlers
   * @param {Object} typingData
   */
  notifyTypingHandlers(typingData) {
    this.typingHandlers.forEach(handler => {
      try {
        handler(typingData);
      } catch (error) {
        console.error('❌ Error in typing handler:', error);
      }
    });
  }

  /**
   * Đăng ký handler cho connection status
   * @param {Function} handler - (connected) => void
   */
  onConnectionChange(handler) {
    this.connectionHandlers.push(handler);
  }

  /**
   * Hủy đăng ký connection handler
   * @param {Function} handler
   */
  offConnectionChange(handler) {
    this.connectionHandlers = this.connectionHandlers.filter(h => h !== handler);
  }

  /**
   * Notify all connection handlers
   * @param {boolean} connected
   */
  notifyConnectionHandlers(connected) {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(connected);
      } catch (error) {
        console.error('❌ Error in connection handler:', error);
      }
    });
  }
  
  /**
   * Đăng ký handler cho READ receipt
   * @param {Function} handler - (readReceipt) => void
   */
  onReadReceipt(handler) {
    this.readReceiptHandlers.push(handler);
  }

  /**
   * Hủy đăng ký READ receipt handler
   * @param {Function} handler
   */
  offReadReceipt(handler) {
    this.readReceiptHandlers = this.readReceiptHandlers.filter(h => h !== handler);
  }

  /**
   * Notify all READ receipt handlers
   * @param {Object} readReceipt
   */
  notifyReadReceiptHandlers(readReceipt) {
    this.readReceiptHandlers.forEach(handler => {
      try {
        handler(readReceipt);
      } catch (error) {
        console.error('❌ Error in READ receipt handler:', error);
      }
    });
  }
}

// Export singleton instance
const chatWebSocketService = new ChatWebSocketService();
export default chatWebSocketService;
