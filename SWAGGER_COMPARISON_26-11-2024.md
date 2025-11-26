# 📊 SO SÁNH SWAGGER API - PHIÊN BẢN 26/11/2024

## 📅 Thông tin phiên bản
- **File mới**: `Swagger2611.json` (26/11/2024)
- **File cũ**: `Swagger_new_formatted.json` (phiên bản trước)
- **Ngày so sánh**: 26/11/2024

---

## 📈 TỔNG QUAN THAY ĐỔI

| Metric | Phiên bản cũ | Phiên bản mới | Thay đổi |
|--------|--------------|---------------|----------|
| **Tổng số API Groups (Tags)** | 27 | 34 | +7 groups |
| **Tổng số Endpoints** | 169 | 216 | +47 endpoints |

---

## ✅ API GROUPS MỚI (8 groups)

### 1. **Admin Notification Management** 🔔
APIs quản lý thông báo cho admin
- Xem danh sách thông báo
- Đánh dấu đã đọc
- Xóa thông báo
- Lọc theo loại

### 2. **Admin Revenue Management** 💰
APIs quản lý doanh thu cho admin
- Xem thống kê doanh thu
- Phí dịch vụ (service fees)
- Lỗ từ khuyến mãi platform
- Lọc theo khoảng thời gian

### 3. **B2C Shipment Management** 📦
APIs quản lý vận đơn cho store owner
- Xem danh sách shipments
- Cập nhật trạng thái vận chuyển
- Theo dõi đơn hàng

### 4. **B2C Store Notification Management** 🏪🔔
APIs quản lý thông báo cho cửa hàng
- Xem thông báo của store
- Đánh dấu đã đọc
- Đếm thông báo chưa đọc

### 5. **Buyer Notification Management** 👤🔔
APIs quản lý thông báo cho buyer
- Xem thông báo cá nhân
- Đánh dấu đã đọc/chưa đọc
- Xóa thông báo

### 6. **Chat** 💬
APIs hệ thống chat real-time
- Tạo/xem conversations
- Gửi/nhận messages
- Đánh dấu đã đọc
- Đếm tin nhắn chưa đọc
- Archive conversations

### 7. **Quản Lý Rút Tiền** 💸
APIs quản lý yêu cầu rút tiền
- Rút tiền từ ví store
- Rút tiền từ ví customer
- Duyệt/từ chối yêu cầu (admin)

### 8. **Ví Điện Tử Khách Hàng** 👛
APIs quản lý ví điện tử cho khách hàng
- Xem số dư
- Lịch sử giao dịch
- Yêu cầu rút tiền
- Hoàn tiền

---

## ❌ API GROUPS BỊ XÓA (1 group)

### **Admin Withdrawal Management**
→ Đã được tách thành 2 groups riêng biệt:
- `Quản Lý Rút Tiền` (cho store)
- `Ví Điện Tử Khách Hàng` (cho customer)

---

## 🆕 ENDPOINTS MỚI (47 endpoints)

### 📱 **Chat APIs (9 endpoints)**
```
GET    /api/v1/chat/conversations
POST   /api/v1/chat/conversations
GET    /api/v1/chat/conversations/{conversationId}
GET    /api/v1/chat/conversations/{conversationId}/messages
POST   /api/v1/chat/conversations/{conversationId}/read
POST   /api/v1/chat/conversations/{conversationId}/archive
GET    /api/v1/chat/conversations/find-or-create
GET    /api/v1/chat/conversations/unread-count
POST   /api/v1/chat/messages
DELETE /api/v1/chat/messages/{messageId}
POST   /api/v1/chat/messages/{messageId}/read
```

### 🔔 **Notification APIs (12 endpoints)**

#### Admin Notifications (5)
```
GET    /api/v1/admin/notifications
GET    /api/v1/admin/notifications/{notificationId}
DELETE /api/v1/admin/notifications/{notificationId}
GET    /api/v1/admin/notifications/unread-count
GET    /api/v1/admin/notifications/by-type/{type}
PUT    /api/v1/admin/notifications/{notificationId}/read
PUT    /api/v1/admin/notifications/mark-all-read
```

#### Buyer Notifications (3)
```
GET    /api/v1/buyer/notifications
GET    /api/v1/buyer/notifications/unread-count
DELETE /api/v1/buyer/notifications/{notificationId}
PUT    /api/v1/buyer/notifications/{notificationId}/read
PUT    /api/v1/buyer/notifications/read-all
```

#### Store Notifications (4)
```
GET    /api/v1/b2c/stores/{storeId}/notifications
GET    /api/v1/b2c/stores/{storeId}/notifications/unread-count
DELETE /api/v1/b2c/stores/{storeId}/notifications/{notificationId}
PUT    /api/v1/b2c/stores/{storeId}/notifications/{notificationId}/read
PUT    /api/v1/b2c/stores/{storeId}/notifications/read-all
```

### 💰 **Wallet & Withdrawal APIs (11 endpoints)**

#### Buyer Wallet (5)
```
GET    /api/v1/buyer/wallet/balance
GET    /api/v1/buyer/wallet/info
GET    /api/v1/buyer/wallet/transactions
GET    /api/v1/buyer/wallet/withdrawal-requests
GET    /api/v1/buyer/wallet/withdrawal-requests/{requestId}
POST   /api/v1/buyer/wallet/withdrawal-request
```

#### Admin Withdrawal Management (6)
```
GET    /api/v1/admin/withdrawals/customer
GET    /api/v1/admin/withdrawals/customer/{requestId}
PUT    /api/v1/admin/withdrawals/customer/{requestId}/approve
PUT    /api/v1/admin/withdrawals/customer/{requestId}/reject
GET    /api/v1/admin/withdrawals/store
PUT    /api/v1/admin/withdrawals/store/{requestId}/approve
PUT    /api/v1/admin/withdrawals/store/{requestId}/reject
```

### 📊 **Revenue Management APIs (5 endpoints)**
```
GET    /api/v1/admin/revenues
GET    /api/v1/admin/revenues/statistics
GET    /api/v1/admin/revenues/service-fees
GET    /api/v1/admin/revenues/platform-discount-losses
GET    /api/v1/admin/revenues/date-range
```

### 📦 **Shipment Management APIs (3 endpoints)**
```
GET    /api/v1/b2c/shipments/store/{storeId}
GET    /api/v1/b2c/shipments/order/{orderId}
PUT    /api/v1/b2c/shipments/{shipmentId}/status
```

### 🔐 **Authentication APIs (2 endpoints)**
```
POST   /api/v1/users/logout
POST   /api/v1/users/refresh-token
```

### 🎨 **Product Variant APIs (2 endpoints)**
```
PUT    /api/v1/b2c/product-variants/update-images/{variantId}
DELETE /api/v1/b2c/product-variants/delete-color/{variantId}/color/{colorId}
```

### 🛍️ **Product Browsing (1 endpoint)**
```
GET    /api/v1/products/variant/{variantId}
```

---

## 🗑️ ENDPOINTS BỊ XÓA/THAY ĐỔI (7 endpoints)

### ❌ Order Management - Đã thay đổi cách quản lý
```
PUT /api/v1/b2c/orders/{orderId}/status     → Đã bỏ
PUT /api/v1/b2c/orders/{orderId}/ship       → Đã bỏ
PUT /api/v1/b2c/orders/{orderId}/deliver    → Đã bỏ
```
**Lý do**: Chuyển sang quản lý qua **Shipment Management** thay vì trực tiếp trên Order

### ❌ Admin Withdrawal - Đã tách riêng
```
GET /api/v1/admin/withdrawals                    → Tách thành 2 endpoints riêng
PUT /api/v1/admin/withdrawals/{requestId}/approve → Tách theo store/customer
PUT /api/v1/admin/withdrawals/{requestId}/reject  → Tách theo store/customer
PUT /api/v1/admin/withdrawals/{requestId}/complete → Đã bỏ
```
**Lý do**: Tách rõ ràng giữa withdrawal của **Store** và **Customer**

---

## 🎯 ĐIỂM NỔI BẬT

### ✨ Tính năng mới quan trọng:

1. **💬 Hệ thống Chat hoàn chỉnh**
   - Real-time messaging
   - Conversation management
   - Read receipts
   - Unread count tracking

2. **🔔 Hệ thống Notification đầy đủ**
   - Riêng cho Admin, Buyer, Store
   - Đánh dấu đã đọc
   - Đếm thông báo chưa đọc
   - Lọc theo loại

3. **💰 Quản lý Tài chính nâng cao**
   - Ví điện tử cho buyer
   - Rút tiền cho cả store và customer
   - Thống kê doanh thu chi tiết cho admin
   - Tracking service fees và platform losses

4. **📦 Quản lý Vận chuyển**
   - Tách riêng shipment khỏi order
   - Tracking chi tiết hơn
   - Cập nhật trạng thái linh hoạt

5. **🔐 Authentication cải thiện**
   - Logout API
   - Refresh token mechanism

---

## 📋 CHECKLIST IMPLEMENTATION

### ✅ Đã có Backend API
- [x] Chat system (11 endpoints)
- [x] Notifications (12 endpoints)
- [x] Wallet & Withdrawal (11 endpoints)
- [x] Revenue Management (5 endpoints)
- [x] Shipment Management (3 endpoints)
- [x] Auth improvements (2 endpoints)

### 🔨 Cần implement Frontend
- [ ] Chat UI (conversations, messages, real-time)
- [ ] Notification center (admin, buyer, store)
- [ ] Buyer wallet page
- [ ] Admin revenue dashboard
- [ ] Shipment tracking UI
- [ ] Logout & refresh token handling

### ⚠️ Cần kiểm tra
- [ ] Migrate từ order status sang shipment status
- [ ] Update withdrawal flow (tách store/customer)
- [ ] Test chat real-time functionality
- [ ] Test notification push system

---

## 🚀 KHUYẾN NGHỊ

### Ưu tiên cao:
1. **Implement Chat UI** - Tính năng quan trọng cho customer support
2. **Notification Center** - Cải thiện UX đáng kể
3. **Buyer Wallet** - Hoàn thiện payment flow

### Ưu tiên trung bình:
4. **Admin Revenue Dashboard** - Quan trọng cho business analytics
5. **Shipment Tracking** - Migrate từ order-based sang shipment-based

### Lưu ý:
- Backend đã sẵn sàng cho tất cả tính năng mới
- Cần update frontend để tận dụng đầy đủ APIs
- Một số endpoint cũ đã bị thay đổi/xóa, cần kiểm tra compatibility

---

**📝 Tổng kết**: Phiên bản mới bổ sung **47 endpoints mới** với 4 tính năng chính: Chat, Notifications, Wallet/Withdrawal, và Revenue Management. Đây là bản cập nhật lớn, hoàn thiện hệ thống e-commerce với đầy đủ tính năng cần thiết.
