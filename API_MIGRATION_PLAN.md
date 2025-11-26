# 🔄 KẾ HOẠCH MIGRATION API - SWAGGER 26/11/2024

## 📋 PHASE 1: SỬA CÁC API BỊ THAY ĐỔI (PRIORITY)

### ⚠️ 1. ORDER MANAGEMENT - MIGRATE SANG SHIPMENT-BASED

#### **Vấn đề:**
Các API cũ đã bị XÓA trong Swagger mới:
```
❌ PUT /api/v1/b2c/orders/{orderId}/status
❌ PUT /api/v1/b2c/orders/{orderId}/ship
❌ PUT /api/v1/b2c/orders/{orderId}/deliver
```

#### **Files bị ảnh hưởng:**
1. **`src/services/b2c/b2cOrderService.js`**
   - `updateOrderStatus()` - line 124
   - `shipOrder()` - line 179
   - `deliverOrder()` - line 213

2. **`src/pages/store/StoreOrders.jsx`**
   - `handleShipOrder()` - line 71
   - `handleDeliverOrder()` - line 108
   - Import statement - line 8

3. **`src/pages/store/StoreOrderDetail.jsx`**
   - `handleShip()` - line 113
   - `handleDeliver()` - line 144
   - Import statement - line 15-16

#### **Giải pháp:**
Chuyển sang sử dụng **Shipment Management APIs**:
```
✅ PUT /api/v1/b2c/shipments/{shipmentId}/status
✅ GET /api/v1/b2c/shipments/store/{storeId}
✅ GET /api/v1/b2c/shipments/order/{orderId}
```

#### **Action Items:**
- [ ] Sửa `b2cOrderService.js`:
  - Xóa `updateOrderStatus()`, `shipOrder()`, `deliverOrder()`
  - Thêm note redirect sang `shipmentService.js`
  
- [ ] Sửa `StoreOrders.jsx`:
  - Import `updateShipmentStatus` từ `shipmentService.js`
  - Sửa `handleShipOrder()` → Tạo shipment hoặc update shipment status
  - Sửa `handleDeliverOrder()` → Update shipment status = DELIVERED
  
- [ ] Sửa `StoreOrderDetail.jsx`:
  - Tương tự như StoreOrders.jsx
  - Fetch shipment info từ orderId
  - Update shipment status thay vì order status

#### **Logic mới:**
```javascript
// OLD (KHÔNG DÙNG NỮA):
await shipOrder(orderId, storeId);
await deliverOrder(orderId, storeId);

// NEW (DÙNG SHIPMENT):
// 1. Lấy shipment từ orderId
const shipment = await getShipmentByOrderId(orderId);

// 2. Update shipment status
await updateShipmentStatus(shipment.id, 'SHIPPING'); // Khi ship
await updateShipmentStatus(shipment.id, 'DELIVERED'); // Khi deliver
```

---

### ⚠️ 2. ADMIN WITHDRAWAL - TÁCH RIÊNG STORE/CUSTOMER

#### **Vấn đề:**
Các API cũ đã bị XÓA/THAY ĐỔI:
```
❌ GET /api/v1/admin/withdrawals
❌ PUT /api/v1/admin/withdrawals/{requestId}/approve
❌ PUT /api/v1/admin/withdrawals/{requestId}/reject
❌ PUT /api/v1/admin/withdrawals/{requestId}/complete
```

#### **Files bị ảnh hưởng:**
1. **`src/services/admin/adminWalletService.js`**
   - `getAllWithdrawalRequests()` - line 12
   - `approveWithdrawal()` - line 55
   - `completeWithdrawal()` - line 85
   - `rejectWithdrawal()` - line 116

#### **APIs mới (TÁCH RIÊNG):**

**Store Withdrawals:**
```
✅ GET /api/v1/admin/withdrawals/store
✅ PUT /api/v1/admin/withdrawals/store/{requestId}/approve
✅ PUT /api/v1/admin/withdrawals/store/{requestId}/reject
```

**Customer Withdrawals:**
```
✅ GET /api/v1/admin/withdrawals/customer
✅ GET /api/v1/admin/withdrawals/customer/{requestId}
✅ PUT /api/v1/admin/withdrawals/customer/{requestId}/approve
✅ PUT /api/v1/admin/withdrawals/customer/{requestId}/reject
```

#### **Action Items:**
- [ ] Sửa `adminWalletService.js`:
  - Đổi tên `getAllWithdrawalRequests()` → `getStoreWithdrawals()`
  - Thêm `getCustomerWithdrawals()`
  - Sửa `approveWithdrawal()` → Thêm param `type` (store/customer)
  - Sửa `rejectWithdrawal()` → Thêm param `type` (store/customer)
  - **XÓA** `completeWithdrawal()` (không còn trong API mới)

- [ ] Tạo file mới `src/services/admin/adminCustomerWalletService.js`:
  - `getCustomerWithdrawals()`
  - `getCustomerWithdrawalById()`
  - `approveCustomerWithdrawal()`
  - `rejectCustomerWithdrawal()`

- [ ] Kiểm tra UI Admin:
  - Có trang quản lý withdrawal không?
  - Nếu có, cần tách thành 2 tabs: Store Withdrawals / Customer Withdrawals

#### **Logic mới:**
```javascript
// OLD:
await getAllWithdrawalRequests(); // Lấy tất cả
await approveWithdrawal(requestId, note);
await rejectWithdrawal(requestId, reason);

// NEW:
// Tách riêng store và customer
await getStoreWithdrawals(); // Chỉ store
await getCustomerWithdrawals(); // Chỉ customer

await approveWithdrawal(requestId, 'store', note); // Approve store
await approveWithdrawal(requestId, 'customer', note); // Approve customer
```

---

## 📋 PHASE 2: IMPLEMENT CÁC API MỚI

### 1. 💬 CHAT SYSTEM (11 endpoints) - PRIORITY HIGH

**Backend APIs sẵn sàng:**
```
✅ GET    /api/v1/chat/conversations
✅ POST   /api/v1/chat/conversations
✅ GET    /api/v1/chat/conversations/{conversationId}
✅ GET    /api/v1/chat/conversations/{conversationId}/messages
✅ POST   /api/v1/chat/conversations/{conversationId}/read
✅ POST   /api/v1/chat/conversations/{conversationId}/archive
✅ GET    /api/v1/chat/conversations/find-or-create
✅ GET    /api/v1/chat/conversations/unread-count
✅ POST   /api/v1/chat/messages
✅ DELETE /api/v1/chat/messages/{messageId}
✅ POST   /api/v1/chat/messages/{messageId}/read
```

**Files cần tạo:**
- [ ] `src/services/chat/chatService.js` - API calls
- [ ] `src/services/chat/chatWebSocket.js` - WebSocket real-time (ĐÃ CÓ)
- [ ] `src/pages/chat/ChatPage.jsx` - Main chat UI
- [ ] `src/components/chat/ConversationList.jsx` - Danh sách conversations
- [ ] `src/components/chat/MessageList.jsx` - Danh sách messages
- [ ] `src/components/chat/MessageInput.jsx` - Input gửi tin nhắn
- [ ] `src/components/chat/ChatBubble.jsx` - Message bubble component

**Features:**
- Real-time messaging với WebSocket
- Conversation list với unread count
- Message history với pagination
- Read receipts
- Archive conversations
- Delete messages

---

### 2. 🔔 NOTIFICATION SYSTEM (12 endpoints) - PRIORITY HIGH

**Backend APIs sẵn sàng:**

**Admin Notifications (5):**
```
✅ GET    /api/v1/admin/notifications
✅ GET    /api/v1/admin/notifications/{notificationId}
✅ DELETE /api/v1/admin/notifications/{notificationId}
✅ GET    /api/v1/admin/notifications/unread-count
✅ GET    /api/v1/admin/notifications/by-type/{type}
✅ PUT    /api/v1/admin/notifications/{notificationId}/read
✅ PUT    /api/v1/admin/notifications/mark-all-read
```

**Buyer Notifications (3):**
```
✅ GET    /api/v1/buyer/notifications
✅ GET    /api/v1/buyer/notifications/unread-count
✅ DELETE /api/v1/buyer/notifications/{notificationId}
✅ PUT    /api/v1/buyer/notifications/{notificationId}/read
✅ PUT    /api/v1/buyer/notifications/read-all
```

**Store Notifications (4):**
```
✅ GET    /api/v1/b2c/stores/{storeId}/notifications
✅ GET    /api/v1/b2c/stores/{storeId}/notifications/unread-count
✅ DELETE /api/v1/b2c/stores/{storeId}/notifications/{notificationId}
✅ PUT    /api/v1/b2c/stores/{storeId}/notifications/{notificationId}/read
✅ PUT    /api/v1/b2c/stores/{storeId}/notifications/read-all
```

**Files cần tạo:**
- [ ] `src/services/notification/adminNotificationService.js`
- [ ] `src/services/notification/buyerNotificationService.js`
- [ ] `src/services/notification/storeNotificationService.js`
- [ ] `src/components/notification/NotificationBell.jsx` - Icon với badge count
- [ ] `src/components/notification/NotificationDropdown.jsx` - Dropdown list
- [ ] `src/components/notification/NotificationItem.jsx` - Single notification
- [ ] `src/pages/admin/AdminNotifications.jsx` - Admin notification page
- [ ] `src/pages/buyer/BuyerNotifications.jsx` - Buyer notification page
- [ ] `src/pages/store/StoreNotifications.jsx` - Store notification page

**Features:**
- Notification bell với unread count badge
- Dropdown notification list
- Mark as read (single/all)
- Delete notifications
- Filter by type (admin)
- Auto-refresh với polling hoặc WebSocket

---

### 3. 💰 WALLET & WITHDRAWAL (11 endpoints) - PRIORITY MEDIUM

**Buyer Wallet APIs (5):**
```
✅ GET  /api/v1/buyer/wallet/balance
✅ GET  /api/v1/buyer/wallet/info
✅ GET  /api/v1/buyer/wallet/transactions
✅ GET  /api/v1/buyer/wallet/withdrawal-requests
✅ GET  /api/v1/buyer/wallet/withdrawal-requests/{requestId}
✅ POST /api/v1/buyer/wallet/withdrawal-request
```

**Admin Withdrawal Management (6):**
```
✅ GET /api/v1/admin/withdrawals/customer
✅ GET /api/v1/admin/withdrawals/customer/{requestId}
✅ PUT /api/v1/admin/withdrawals/customer/{requestId}/approve
✅ PUT /api/v1/admin/withdrawals/customer/{requestId}/reject
✅ GET /api/v1/admin/withdrawals/store
✅ PUT /api/v1/admin/withdrawals/store/{requestId}/approve
✅ PUT /api/v1/admin/withdrawals/store/{requestId}/reject
```

**Files cần tạo:**
- [ ] `src/services/buyer/buyerWalletService.js`
- [ ] `src/services/admin/adminCustomerWalletService.js` (tách từ adminWalletService)
- [ ] `src/pages/buyer/BuyerWallet.jsx` - Buyer wallet page
- [ ] `src/components/wallet/WalletBalance.jsx` - Balance display
- [ ] `src/components/wallet/TransactionHistory.jsx` - Transaction list
- [ ] `src/components/wallet/WithdrawalForm.jsx` - Withdrawal request form
- [ ] `src/pages/admin/AdminWithdrawals.jsx` - Admin withdrawal management (2 tabs)

**Features:**
- Xem số dư ví
- Lịch sử giao dịch
- Yêu cầu rút tiền
- Tracking withdrawal status
- Admin approve/reject withdrawals (tách store/customer)

---

### 4. 📊 REVENUE MANAGEMENT (5 endpoints) - PRIORITY MEDIUM

**Backend APIs sẵn sàng:**
```
✅ GET /api/v1/admin/revenues
✅ GET /api/v1/admin/revenues/statistics
✅ GET /api/v1/admin/revenues/service-fees
✅ GET /api/v1/admin/revenues/platform-discount-losses
✅ GET /api/v1/admin/revenues/date-range
```

**Files cần tạo:**
- [ ] `src/services/admin/adminRevenueService.js`
- [ ] `src/pages/admin/AdminRevenue.jsx` - Revenue dashboard (CÓ RỒI - CẦN UPDATE)
- [ ] `src/components/admin/RevenueChart.jsx` - Chart component
- [ ] `src/components/admin/RevenueStats.jsx` - Stats cards

**Files cần sửa:**
- [ ] `src/pages/admin/AdminRevenue.jsx` - Thêm các APIs mới

**Features:**
- Tổng doanh thu
- Service fees tracking
- Platform discount losses
- Filter theo khoảng thời gian
- Charts và statistics

---

### 5. 📦 SHIPMENT MANAGEMENT (3 endpoints) - PRIORITY HIGH

**Backend APIs sẵn sàng:**
```
✅ GET /api/v1/b2c/shipments/store/{storeId}
✅ GET /api/v1/b2c/shipments/order/{orderId}
✅ PUT /api/v1/b2c/shipments/{shipmentId}/status
```

**Files đã có:**
- ✅ `src/services/b2c/shipmentService.js` - ĐÃ CÓ
- ✅ `src/pages/store/StoreShipments.jsx` - ĐÃ CÓ

**Cần làm:**
- [ ] Integrate shipment vào order flow (thay thế ship/deliver order)
- [ ] Update UI để hiển thị shipment tracking
- [ ] Thêm shipment status timeline

---

### 6. 🔐 AUTH IMPROVEMENTS (2 endpoints) - PRIORITY HIGH

**Backend APIs sẵn sàng:**
```
✅ POST /api/v1/users/logout
✅ POST /api/v1/users/refresh-token
```

**Files cần sửa:**
- [ ] `src/services/auth/authService.js` - Thêm logout và refresh token
- [ ] `src/context/AuthContext.jsx` - Implement logout function
- [ ] `src/utils/axiosConfig.js` - Auto refresh token khi 401

**Features:**
- Logout API call (clear token server-side)
- Auto refresh token khi expired
- Redirect to login khi refresh failed

---

## 📊 TỔNG KẾT

### ✅ Phase 1: Sửa API thay đổi (2 tasks)
- [ ] Order Management → Shipment-based
- [ ] Admin Withdrawal → Tách store/customer

### 🆕 Phase 2: Implement API mới (6 groups)
- [ ] Chat System (11 APIs)
- [ ] Notification System (12 APIs)
- [ ] Wallet & Withdrawal (11 APIs)
- [ ] Revenue Management (5 APIs)
- [ ] Shipment Management (3 APIs)
- [ ] Auth Improvements (2 APIs)

### 📈 Metrics
- **Tổng APIs cần sửa:** 7 endpoints
- **Tổng APIs mới:** 47 endpoints
- **Tổng files cần tạo:** ~30 files
- **Tổng files cần sửa:** ~10 files

---

## 🎯 KHUYẾN NGHỊ THỨ TỰ THỰC HIỆN

### Tuần 1: Fix Breaking Changes
1. ✅ Sửa Order Management (shipment-based) - **CRITICAL**
2. ✅ Sửa Admin Withdrawal (tách store/customer) - **HIGH**
3. ✅ Implement Auth improvements (logout, refresh) - **HIGH**

### Tuần 2: Core Features
4. ✅ Implement Notification System - **HIGH IMPACT**
5. ✅ Integrate Shipment Management vào UI - **HIGH**

### Tuần 3: User Features
6. ✅ Implement Chat System - **HIGH VALUE**
7. ✅ Implement Buyer Wallet - **MEDIUM**

### Tuần 4: Admin Features
8. ✅ Update Revenue Management - **MEDIUM**
9. ✅ Polish và testing - **REQUIRED**

---

**📝 Lưu ý:** 
- Ưu tiên sửa breaking changes trước để tránh lỗi production
- Các API mới có thể implement dần dần
- Test kỹ sau mỗi phase
