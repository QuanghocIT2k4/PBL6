# 📊 TỔNG HỢP CÁC API ADMIN DASHBOARD

**Dựa trên Swagger API Specification**  
**Role:** Platform Admin  
**Authentication:** Required (Bearer Token + Admin Role)

---

## ✅ TỔNG QUAN: 26 APIs cho Admin Management

---

## 1️⃣ QUẢN LÝ NGƯỜI DÙNG (Admin User Management) - 4 APIs

### ⚠️ Cần chỉnh sửa: 4/4 (Cần cập nhật theo Swagger mới)

| API Endpoint | Method | Mô tả | Service Function | Status |
|--------------|--------|-------|------------------|--------|
| `GET /api/v1/admin/users` | GET | Lấy danh sách users (pagination, filter) | `getUsers()` | ⚠️ Cần update params |
| `GET /api/v1/admin/users/check-ban/{userId}` | GET | Kiểm tra user có bị ban không | `checkBanStatus()` | ⚠️ Cần implement |
| `POST /api/v1/admin/users/ban` | POST | Ban user (tạm thời hoặc vĩnh viễn) | `banUser()` | ⚠️ Cần implement |
| `POST /api/v1/admin/users/unban/{userId}` | POST | Unban user | `unbanUser()` | ⚠️ Cần implement |

**📦 Files:**
- Service: `adminUserService.js` / `userService.js`
- Pages: `AdminUsers.jsx`

**🎯 User Management APIs (CHI TIẾT):**

#### **1.1. GET /api/v1/admin/users**
```javascript
// Lấy danh sách users với filter
GET /api/v1/admin/users?userName=John&userEmail=john@example.com&page=0&size=20

Query Parameters:
- userName (optional): Filter theo tên
- userEmail (optional): Filter theo email
- userPhone (optional): Filter theo số điện thoại
- page (optional): Trang (default: 0)
- size (optional): Số lượng/trang (default: 20)
- sortBy (optional): Sắp xếp theo field (default: "createdAt")
- sortDir (optional): Hướng sắp xếp "asc" hoặc "desc" (default: "desc")

Response: {
  success: true,
  data: {
    content: [
      {
        id: "user_id",
        fullName: "Nguyen Van A",
        email: "user@example.com",
        phone: "0123456789",
        avatar: "https://...",
        roles: ["BUYER"],
        createdAt: "2025-11-22T10:00:00",
        isBanned: false
      }
    ],
    totalPages: 10,
    totalElements: 200,
    size: 20,
    number: 0
  }
}
```

#### **1.2. GET /api/v1/admin/users/check-ban/{userId}**
```javascript
// Kiểm tra user có bị ban không
GET /api/v1/admin/users/check-ban/{userId}

Response: {
  success: true,
  data: {
    userId: "xxx",
    isBanned: true,
    banType: "TEMPORARY",
    reason: "Vi phạm điều khoản",
    bannedAt: "2025-11-20T10:00:00",
    bannedUntil: "2025-12-20T10:00:00", // null nếu PERMANENT
    durationDays: 30
  }
}
```

#### **1.3. POST /api/v1/admin/users/ban**
```javascript
// Ban user (tạm thời hoặc vĩnh viễn)
POST /api/v1/admin/users/ban
Body: {
  userId: "xxx",              // Required
  reason: "Vi phạm điều khoản", // Required
  banType: "TEMPORARY",       // Required: "TEMPORARY" | "PERMANENT"
  durationDays: 30            // Required nếu TEMPORARY, optional nếu PERMANENT
}

Response: {
  success: true,
  message: "User has been banned successfully",
  data: {
    userId: "xxx",
    isBanned: true,
    banType: "TEMPORARY",
    bannedUntil: "2025-12-20T10:00:00"
  }
}
```

#### **1.4. POST /api/v1/admin/users/unban/{userId}**
```javascript
// Unban user
POST /api/v1/admin/users/unban/{userId}

Response: {
  success: true,
  message: "User has been unbanned successfully",
  data: {
    userId: "xxx",
    isBanned: false
  }
}
```

**⚠️ LƯU Ý:**
- **TEMPORARY ban**: User bị ban trong X ngày, sau đó tự động unban
- **PERMANENT ban**: User bị ban vĩnh viễn, chỉ admin mới unban được
- Khi user bị ban, họ không thể login vào hệ thống
- Admin cần ghi rõ lý do ban để user biết

---

## 2️⃣ QUẢN LÝ CỬA HÀNG (Admin Store Management) - 6 APIs

### ✅ Đã implement: 6/6 (100%)

| API Endpoint | Method | Mô tả | Service Function |
|--------------|--------|-------|------------------|
| `GET /api/v1/admin/stores/pending` | GET | Lấy stores chờ duyệt | `getPendingStores()` ✅ |
| `GET /api/v1/admin/stores/approved` | GET | Lấy stores đã duyệt | `getApprovedStores()` ✅ |
| `PUT /api/v1/admin/stores/{storeId}/approve` | PUT | Duyệt store | `approveStore()` ✅ |
| `PUT /api/v1/admin/stores/{storeId}/reject` | PUT | Từ chối store (+ lý do) | `rejectStore()` ✅ |
| `PUT /api/v1/admin/stores/{storeId}/status` | PUT | Cập nhật trạng thái store | `updateStoreStatus()` ✅ |
| `DELETE /api/v1/admin/stores/{storeId}` | DELETE | Xóa store vĩnh viễn | `deleteStore()` ✅ |

**📦 Files:**
- Service: `adminStoreService.js`
- Pages: `AdminStores.jsx`

**🎯 Store Approval Flow:**
```
User tạo store → PENDING
   ↓
Admin review
   ↓
APPROVED (duyệt)  hoặc  REJECTED (từ chối + lý do)
```

**⚠️ Store Status:**
- `PENDING` - Chờ admin duyệt
- `APPROVED` - Đã duyệt, hoạt động
- `REJECTED` - Bị từ chối
- `SUSPENDED` - Bị tạm khóa
- `DELETED` - Đã xóa

---

## 3️⃣ QUẢN LÝ SẢN PHẨM (Admin Product Management) - 3 APIs

### ✅ Đã implement: 3/3 (100%)

| API Endpoint | Method | Mô tả | Service Function |
|--------------|--------|-------|------------------|
| `GET /api/v1/admin/products/pending` | GET | Lấy products chờ duyệt | `getPendingProducts()` ✅ |
| `PUT /api/v1/admin/products/{productId}/approve` | PUT | Duyệt product | `approveProduct()` ✅ |
| `PUT /api/v1/admin/products/{productId}/reject` | PUT | Từ chối product (+ lý do) | `rejectProduct()` ✅ |

**📦 Files:**
- Service: `adminProductService.js`
- Pages: `AdminProducts.jsx`

**🎯 Product Approval:**
```javascript
// Approve product
PUT /api/v1/admin/products/{productId}/approve

// Reject product
PUT /api/v1/admin/products/{productId}/reject
Body: {
  reason: "Sản phẩm không phù hợp với chính sách"
}
```

---

## 4️⃣ QUẢN LÝ BIẾN THỂ SẢN PHẨM (Admin ProductVariant Management) - 2 APIs

### ✅ Đã implement: 2/2 (100%)

| API Endpoint | Method | Mô tả | Service Function |
|--------------|--------|-------|------------------|
| `GET /api/v1/admin/product-variants/pending` | GET | Lấy variants chờ duyệt | `getPendingVariants()` ✅ |
| `PUT /api/v1/admin/product-variants/{variantId}/approve` | PUT | Duyệt variant | `approveVariant()` ✅ |
| `PUT /api/v1/admin/product-variants/{variantId}/reject` | PUT | Từ chối variant | `rejectVariant()` ✅ |

**📦 Files:**
- Service: `adminVariantService.js`
- Pages: `AdminVariants.jsx`

---

## 5️⃣ QUẢN LÝ KHUYẾN MÃI (Admin Promotion Management) - 12 APIs

### ✅ Đã implement: 12/12 (100%)

#### **A. Promotion Management:**

| API Endpoint | Method | Mô tả | Service Function |
|--------------|--------|-------|------------------|
| `GET /api/v1/admin/promotions` | GET | Lấy tất cả promotions | `getAllPromotions()` ✅ |
| `GET /api/v1/admin/promotions/{promotionId}` | GET | Chi tiết 1 promotion | `getPromotionById()` ✅ |
| `POST /api/v1/admin/promotions/platform` | POST | Tạo platform promotion | `createPlatformPromotion()` ✅ |
| `PUT /api/v1/admin/promotions/platform/{promotionId}` | PUT | Cập nhật platform promotion | `updatePlatformPromotion()` ✅ |
| `PUT /api/v1/admin/promotions/{promotionId}/activate` | PUT | Kích hoạt promotion | `activatePromotion()` ✅ |
| `PUT /api/v1/admin/promotions/{promotionId}/deactivate` | PUT | Tắt promotion | `deactivatePromotion()` ✅ |
| `DELETE /api/v1/admin/promotions/{promotionId}` | DELETE | Xóa promotion | `deletePromotion()` ✅ |

#### **B. Promotion Reports:**

| API Endpoint | Method | Mô tả | Service Function |
|--------------|--------|-------|------------------|
| `GET /api/v1/admin/promotions/reports/active` | GET | Promotions đang active | `getActivePromotions()` ✅ |
| `GET /api/v1/admin/promotions/reports/inactive` | GET | Promotions đang inactive | `getInactivePromotions()` ✅ |
| `GET /api/v1/admin/promotions/reports/expired` | GET | Promotions đã hết hạn | `getExpiredPromotions()` ✅ |
| `GET /api/v1/admin/promotions/reports/deleted` | GET | Promotions đã xóa | `getDeletedPromotions()` ✅ |
| `GET /api/v1/admin/promotions/reports/type/{type}` | GET | Promotions theo type | `getPromotionsByType()` ✅ |

**📦 Files:**
- Service: `adminPromotionService.js`
- Pages: `AdminPromotions.jsx`

**🎯 Platform Promotion:**
```javascript
// Tạo platform-wide promotion (toàn sàn)
POST /api/v1/admin/promotions/platform
Body: {
  code: "SALE2024",
  name: "Flash Sale 2024",
  description: "Giảm giá toàn sàn",
  discountType: "PERCENTAGE",
  discountValue: 10,
  maxDiscountAmount: 100000,
  minOrderAmount: 500000,
  startDate: "2024-01-01T00:00:00",
  endDate: "2024-12-31T23:59:59",
  maxUsageCount: 1000,
  maxUsagePerUser: 1
}
```

**⚠️ Promotion Types:**
- **PERCENTAGE**: Giảm theo % (VD: 10% off)
- **FIXED_AMOUNT**: Giảm cố định (VD: -50,000đ)

**🎯 Issuer Types:**
- **PLATFORM**: Khuyến mãi toàn sàn (Admin tạo)
- **STORE**: Khuyến mãi của shop (Store owner tạo)

---

## 6️⃣ QUẢN LÝ RÚT TIỀN (Admin Withdrawal Management) - 4 APIs ⭐ MỚI

### ⭐ Cần implement: 4/4 (0%)

| API Endpoint | Method | Mô tả | Service Function |
|--------------|--------|-------|------------------|
| `GET /api/v1/admin/withdrawals` | GET | Lấy tất cả yêu cầu rút tiền | `getAllWithdrawals()` ⭐ |
| `PUT /api/v1/admin/withdrawals/{requestId}/approve` | PUT | Duyệt yêu cầu rút tiền | `approveWithdrawal()` ⭐ |
| `PUT /api/v1/admin/withdrawals/{requestId}/reject` | PUT | Từ chối yêu cầu rút tiền | `rejectWithdrawal()` ⭐ |
| `PUT /api/v1/admin/withdrawals/{requestId}/complete` | PUT | Đánh dấu đã chuyển tiền | `completeWithdrawal()` ⭐ |

**📦 Files cần tạo:**
- Service: `adminWithdrawalService.js` ⭐ MỚI
- Pages: `AdminWithdrawals.jsx` ⭐ MỚI

**🎯 Withdrawal Status Flow:**
```
PENDING → APPROVED → COMPLETED
   ↓
REJECTED
```

**📋 Withdrawal Request DTO:**
```javascript
{
  requestId: "xxx",
  storeId: "xxx",
  storeName: "TechShop",
  amount: 5000000,
  bankName: "Vietcombank",
  bankAccount: "1234567890",
  accountHolder: "NGUYEN VAN A",
  status: "PENDING", // PENDING, APPROVED, REJECTED, COMPLETED
  requestDate: "2024-01-01T00:00:00Z",
  processedDate: null,
  note: "",
  rejectionReason: null
}
```

**🎯 Admin Actions:**
```javascript
// 1. Approve withdrawal
PUT /api/v1/admin/withdrawals/{requestId}/approve
Body: {
  note: "Đã duyệt yêu cầu rút tiền"
}

// 2. Reject withdrawal
PUT /api/v1/admin/withdrawals/{requestId}/reject
Body: {
  reason: "Thông tin tài khoản không hợp lệ"
}

// 3. Complete withdrawal (sau khi chuyển tiền thực tế)
PUT /api/v1/admin/withdrawals/{requestId}/complete
```

**⚠️ Lưu ý:**
- Admin phải kiểm tra thông tin ngân hàng trước khi approve
- Sau khi approve, admin chuyển tiền thực tế, sau đó mark COMPLETED
- Nếu reject, phải ghi rõ lý do để store owner biết

---

## 📊 TỔNG KẾT APIs

| Nhóm | Total APIs | Implemented | % |
|------|------------|-------------|---|
| **User Management** | 4 | 0 | 0% ⚠️ CHƯA IMPLEMENT |
| **Store Management** | 6 | 6 | 100% ✅ |
| **Product Management** | 3 | 3 | 100% ✅ |
| **ProductVariant Management** | 2 | 2 | 100% ✅ |
| **Promotion Management** | 12 | 12 | 100% ✅ |
| **Withdrawal Management** | 4 | 0 | 0% ⭐ MỚI |
| **TOTAL** | **31** | **23** | **74%** |

---

## 🎯 PAGES TRONG ADMIN DASHBOARD

1. **Dashboard** (`AdminDashboard.jsx`) - Tổng quan toàn hệ thống
2. **Users** (`AdminUsers.jsx`) - Quản lý người dùng, ban/unban
3. **Stores** (`AdminStores.jsx`) - Duyệt stores, quản lý status
4. **Products** (`AdminProducts.jsx`) - Duyệt products
5. **Variants** (`AdminVariants.jsx`) - Duyệt product variants
6. **Promotions** (`AdminPromotions.jsx`) - Quản lý promotions toàn sàn
7. **Withdrawals** (`AdminWithdrawals.jsx`) - Quản lý rút tiền ⭐ MỚI

---

## 🔐 PHÂN QUYỀN

### **Admin Role Requirements:**

```javascript
// Check admin role
const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('PLATFORM_ADMIN');

if (!isAdmin) {
  // Redirect to home or show 403 Forbidden
  navigate('/');
  toast.error('Bạn không có quyền truy cập');
}
```

### **Protected Routes:**

```javascript
// PrivateRoute.jsx
<Route path="/admin/*" element={
  <ProtectedRoute requiredRole="ADMIN">
    <AdminLayout />
  </ProtectedRoute>
}>
  <Route path="dashboard" element={<AdminDashboard />} />
  <Route path="users" element={<AdminUsers />} />
  <Route path="stores" element={<AdminStores />} />
  <Route path="products" element={<AdminProducts />} />
  <Route path="variants" element={<AdminVariants />} />
  <Route path="promotions" element={<AdminPromotions />} />
</Route>
```

---

## 📋 WORKFLOW DUYỆT NỘI DUNG

### **1. Store Approval Workflow:**

```
1. User đăng ký store → Status: PENDING
2. Admin vào "Stores" → Tab "Chờ duyệt"
3. Admin xem thông tin store:
   - Tên store
   - Mô tả
   - Logo, banner
   - Thông tin chủ store
4. Admin quyết định:
   ✅ APPROVE → Store status: APPROVED (có thể bán hàng)
   ❌ REJECT → Store status: REJECTED (+ gửi lý do)
```

### **2. Product Approval Workflow:**

```
1. Store owner tạo product → Status: PENDING
2. Admin vào "Products" → Tab "Chờ duyệt"
3. Admin xem thông tin product:
   - Tên sản phẩm
   - Mô tả
   - Category, brand
   - Store owner
4. Admin quyết định:
   ✅ APPROVE → Product status: APPROVED (hiển thị công khai)
   ❌ REJECT → Product status: REJECTED (+ gửi lý do)
```

### **3. User Ban Workflow:**

```
1. Admin phát hiện user vi phạm
2. Admin vào "Users" → Tìm user
3. Admin click "Ban User":
   - Chọn loại: Temporary / Permanent
   - Nhập lý do
   - Nhập thời gian (nếu temporary)
4. User bị ban → Không thể login
5. Admin có thể unban bất cứ lúc nào
```

---

## ⚠️ LƯU Ý QUAN TRỌNG

### **1. Quyền hạn Admin:**
- ✅ Admin có thể approve/reject TẤT CẢ nội dung
- ✅ Admin có thể ban/unban users
- ✅ Admin có thể tạo platform-wide promotions
- ✅ Admin có thể xóa stores, products
- ⚠️ Admin KHÔNG THỂ tự tạo store (phải qua approval flow)

### **2. Platform Promotion:**
- ✅ CHỈ Admin mới tạo được
- ✅ Áp dụng cho TẤT CẢ stores
- ✅ Issuer type = "PLATFORM"
- ✅ storeId = null

### **3. Ban User:**
- **TEMPORARY**: Ban trong X ngày
- **PERMANENT**: Ban vĩnh viễn
- User bị ban → Không login được
- Admin có thể unban bất cứ lúc nào

### **4. Store Status:**
- **PENDING** → Chờ admin duyệt (không bán được)
- **APPROVED** → Đã duyệt (bán được)
- **REJECTED** → Bị từ chối (+ lý do)
- **SUSPENDED** → Bị tạm khóa bởi admin
- **DELETED** → Đã xóa

---

## 🚀 DEPLOYMENT CHECKLIST

### **Trước khi deploy Admin Dashboard:**

- [ ] ✅ Tất cả 26 APIs đã test
- [ ] ✅ Role-based access control đã implement
- [ ] ✅ Protected routes đã setup
- [ ] ✅ Admin pages đã hoàn thiện
- [ ] ✅ Error handling đầy đủ
- [ ] ✅ Logging cho admin actions
- [ ] ✅ Notifications cho users khi bị ban/reject
- [ ] ✅ Audit trail cho các actions quan trọng

---

## ✅ KẾT LUẬN

**Admin APIs: CẬP NHẬT VỚI SWAGGER MỚI**

- ✅ 23/31 APIs đã implement (74%)
- ⚠️ **4 APIs User Management CHƯA IMPLEMENT**
- ⭐ Thêm 4 APIs Withdrawal Management mới
- 🚀 Cần implement trang quản lý rút tiền

**📋 TODO PRIORITY:**

**Priority 1 (CRITICAL):**
1. ⚠️ Implement `adminUserService.js` với 4 APIs:
   - `getUsers()` - Lấy danh sách users
   - `checkBanStatus()` - Kiểm tra ban status
   - `banUser()` - Ban user
   - `unbanUser()` - Unban user
2. ⚠️ Cập nhật `AdminUsers.jsx` với UI ban/unban

**Priority 2 (HIGH):**
3. ⭐ Tạo `adminWithdrawalService.js`
4. ⭐ Tạo `AdminWithdrawals.jsx`
5. Thêm menu "Quản lý rút tiền" vào Admin Sidebar
6. Test withdrawal approval flow

**Generated:** November 18, 2025
