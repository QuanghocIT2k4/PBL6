# 💬 CHAT SYSTEM - IMPLEMENTATION GUIDE

## 📋 **Tổng quan**

Hệ thống Chat real-time sử dụng **WebSocket (STOMP)** + **REST API** để hỗ trợ:
- Chat giữa Buyer và Store (BUYER_SELLER)
- Chat giữa Buyer và Support (BUYER_SUPPORT)
- Chat giữa Store và Support (SELLER_SUPPORT)

---

## 🏗️ **Kiến trúc**

```
src/
├── services/
│   └── chat/
│       ├── chatService.js          ✅ REST API calls
│       └── chatWebSocket.js        ✅ WebSocket connection (STOMP)
├── context/
│   └── ChatContext.jsx             ✅ State management
├── components/
│   └── chat/
│       ├── ConversationList.jsx    ✅ Danh sách cuộc trò chuyện
│       ├── MessageList.jsx         ✅ Danh sách tin nhắn
│       ├── MessageBubble.jsx       ✅ Bubble tin nhắn
│       ├── MessageInput.jsx        ✅ Input gửi tin nhắn
│       └── ChatButton.jsx          ✅ Nút bắt đầu chat
└── pages/
    └── chat/
        └── ChatPage.jsx            ✅ Main chat page
```

---

## 🚀 **Đã Implement**

### ✅ **1. Services Layer**

#### **chatService.js** - REST API
- `createConversation()` - Tạo cuộc trò chuyện mới
- `getConversations()` - Lấy danh sách conversations (phân trang)
- `getConversationById()` - Lấy chi tiết 1 conversation
- `findOrCreateConversation()` - Tìm hoặc tạo conversation
- `getUnreadCount()` - Lấy số lượng chưa đọc
- `archiveConversation()` - Lưu trữ conversation
- `getMessages()` - Lấy lịch sử tin nhắn (phân trang)
- `sendMessage()` - Gửi tin nhắn (REST fallback)
- `markMessageAsRead()` - Đánh dấu 1 tin nhắn đã đọc
- `markConversationAsRead()` - Đánh dấu toàn bộ conversation đã đọc
- `deleteMessage()` - Xóa tin nhắn (soft delete)

#### **chatWebSocket.js** - WebSocket (STOMP)
- `connect()` - Kết nối WebSocket với JWT token
- `disconnect()` - Ngắt kết nối
- `subscribeToMessages()` - Subscribe nhận tin nhắn riêng tư
- `subscribeToTyping()` - Subscribe typing indicator
- `sendMessage()` - Gửi tin nhắn real-time
- `sendTypingIndicator()` - Gửi typing status
- `markAsRead()` - Đánh dấu đã đọc
- `sendPresence()` - Gửi online/offline status
- Auto-reconnect logic

---

### ✅ **2. Context & State Management**

#### **ChatContext.jsx**
**State:**
- `conversations` - Danh sách cuộc trò chuyện
- `currentConversation` - Conversation đang chọn
- `messages` - Tin nhắn của conversation hiện tại
- `unreadCount` - Tổng số tin nhắn chưa đọc
- `isConnected` - Trạng thái kết nối WebSocket
- `isTyping` - Có ai đó đang gõ
- `typingUsers` - Map của users đang gõ
- `loading` - Loading state

**Actions:**
- `loadConversations()` - Load danh sách conversations
- `createConversation()` - Tạo conversation mới
- `selectConversation()` - Chọn conversation và load messages
- `archiveConversation()` - Lưu trữ conversation
- `sendMessage()` - Gửi tin nhắn
- `deleteMessage()` - Xóa tin nhắn
- `loadMoreMessages()` - Load thêm tin nhắn (pagination)
- `handleTyping()` - Xử lý typing indicator (debounced)

---

### ✅ **3. Components**

#### **ConversationList.jsx**
- Hiển thị danh sách conversations
- Badge số lượng chưa đọc
- Online indicator
- Product info (nếu có)
- Last message preview
- Active state highlighting

#### **MessageList.jsx**
- Hiển thị tin nhắn với auto-scroll
- Infinite scroll (load more khi scroll lên)
- Typing indicator animation
- Empty state

#### **MessageBubble.jsx**
- Support nhiều loại tin nhắn:
  - TEXT - Văn bản
  - IMAGE - Hình ảnh
  - FILE - File đính kèm
  - PRODUCT_LINK - Link sản phẩm
  - SYSTEM - Thông báo hệ thống
- Read receipts (✓✓ đã đọc, ✓ đã nhận)
- Reply indicator
- Delete message
- Deleted message state

#### **MessageInput.jsx**
- Text input với auto-resize
- Emoji picker (10 emojis phổ biến)
- File upload button (UI only)
- Image upload button (UI only)
- Send button
- Enter to send (Shift+Enter for new line)
- Character count

#### **ChatButton.jsx**
- Nút để bắt đầu chat từ:
  - Product detail page
  - Store page
- Auto-create hoặc navigate to existing conversation
- Check login status

---

### ✅ **4. Main Page**

#### **ChatPage.jsx**
- **Layout:** Sidebar (conversations) + Main (messages)
- **Responsive:** Mobile-friendly với toggle sidebar
- **Features:**
  - Connection status indicator
  - Unread count badge
  - Conversation search (UI ready)
  - Message actions (delete, reply)
  - Typing indicator
  - Auto mark as read

---

## 🔧 **Cấu hình**

### **1. Dependencies**
```bash
npm install sockjs-client @stomp/stompjs
```

### **2. App.jsx**
```javascript
import { ChatProvider } from './context/ChatContext';

<AuthProvider>
  <CartProvider>
    <StoreProvider>
      <ChatProvider>  {/* ← Thêm ChatProvider */}
        <ToastProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </ToastProvider>
      </ChatProvider>
    </StoreProvider>
  </CartProvider>
</AuthProvider>
```

### **3. Routes**
```javascript
<Route path="/chat" element={<ChatPage />} />
```

---

## 📱 **Cách sử dụng**

### **1. Từ Product Detail Page**
```jsx
import ChatButton from '../components/chat/ChatButton';

<ChatButton
  storeId={product.storeId}
  storeName={product.storeName}
  productId={product.id}
  productName={product.name}
  type="BUYER_SELLER"
>
  Chat với shop
</ChatButton>
```

### **2. Từ Store Page**
```jsx
<ChatButton
  storeId={store.id}
  storeName={store.name}
  type="BUYER_SELLER"
>
  Liên hệ cửa hàng
</ChatButton>
```

### **3. Từ bất kỳ đâu**
```jsx
import { useChat } from '../context/ChatContext';

const { createConversation } = useChat();

const handleChat = async () => {
  const conversation = await createConversation({
    storeId: 'store-id',
    type: 'BUYER_SELLER',
    productId: 'product-id',  // optional
    initialMessage: 'Xin chào!'
  });
  
  if (conversation) {
    navigate('/chat');
  }
};
```

---

## 🎯 **WebSocket Endpoints**

### **Subscribe (Receive)**
- `/user/queue/messages` - Nhận tin nhắn riêng tư
- `/topic/conversation/{conversationId}/typing` - Typing indicator

### **Publish (Send)**
- `/app/chat.sendMessage` - Gửi tin nhắn
- `/app/chat.typing` - Gửi typing status
- `/app/chat.markRead` - Đánh dấu đã đọc
- `/app/chat.userPresence` - Gửi online/offline status

---

## 🔥 **Features**

### ✅ **Đã có:**
1. Real-time messaging via WebSocket
2. REST API fallback
3. Typing indicator
4. Read receipts
5. Online/offline status
6. Unread count
7. Message pagination (infinite scroll)
8. Auto-reconnect
9. Optimistic UI updates
10. Delete message
11. Multiple message types (TEXT, IMAGE, FILE, PRODUCT_LINK, SYSTEM)
12. Emoji picker
13. Mobile responsive
14. Auto mark as read

### 🚧 **TODO (Future):**
1. File upload thực tế (hiện chỉ có UI)
2. Image upload thực tế
3. Reply to message
4. Edit message
5. Message search
6. Conversation search/filter
7. Block user
8. Report conversation
9. Voice message
10. Video call
11. Notification sound
12. Desktop notifications

---

## ⚠️ **Lưu ý**

### **1. WebSocket URL**
Hiện tại hardcode trong `chatWebSocket.js`:
```javascript
const wsUrl = 'https://e-commerce-raq1.onrender.com/ws/chat';
```

Nên chuyển sang environment variable:
```javascript
const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws/chat';
```

### **2. JWT Token**
Token được lấy từ `localStorage.getItem('token')`. Đảm bảo token luôn valid khi connect WebSocket.

### **3. Auto-reconnect**
WebSocket sẽ tự động reconnect tối đa 5 lần với delay tăng dần (3s, 6s, 9s, 12s, 15s).

### **4. Memory Leaks**
ChatContext đã cleanup tất cả subscriptions và handlers khi unmount.

### **5. Performance**
- Message list sử dụng virtualization nếu có > 100 messages
- Typing indicator debounced 2 seconds
- Auto-scroll chỉ khi user ở gần bottom

---

## 🐛 **Debugging**

### **Check WebSocket connection:**
```javascript
// In browser console
chatWebSocketService.isConnected()  // true/false
```

### **Check conversations:**
```javascript
// In ChatContext
console.log('Conversations:', conversations);
console.log('Current:', currentConversation);
console.log('Messages:', messages);
```

### **Check network:**
- F12 → Network → WS tab → Xem WebSocket frames
- F12 → Console → Xem logs từ STOMP client

---

## 📚 **API Documentation**

Xem chi tiết trong file backend đã cung cấp:
- REST API: `/api/v1/chat/*`
- WebSocket: `ws://localhost:8080/ws/chat`

---

## ✅ **Checklist**

- [x] REST API service
- [x] WebSocket service
- [x] ChatContext
- [x] ConversationList component
- [x] MessageList component
- [x] MessageBubble component
- [x] MessageInput component
- [x] ChatButton component
- [x] ChatPage
- [x] App.jsx integration
- [x] Routes setup
- [x] Dependencies installed
- [ ] Testing
- [ ] File upload implementation
- [ ] Image upload implementation
- [ ] Notification system

---

**Last Updated:** November 24, 2025  
**Status:** ✅ **READY FOR TESTING**

**Bước tiếp theo:** Test trên production và implement file/image upload!
