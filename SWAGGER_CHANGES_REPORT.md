# 📊 SWAGGER API CHANGES REPORT

**Ngày so sánh:** 19/11/2025  
**File cũ:** `Swagger_new_formatted.json`  
**File mới:** `Swagger.json`

---

## 📈 TỔNG QUAN

| Metric | Số lượng |
|--------|----------|
| **Tổng endpoints cũ** | 155 |
| **Tổng endpoints mới** | 160 |
| **✅ Endpoints mới** | 6 |
| **❌ Endpoints bị xóa** | 1 |
| **🔄 Endpoints thay đổi** | 4 |
| **Endpoints không đổi** | 150 |

---

## ✅ ENDPOINTS MỚI (6 APIs)

### 1. Admin Revenue Management (5 APIs mới)

#### 1.1. Get All Admin Revenues
```
GET /api/v1/admin/revenues
```
- **Tag:** Admin Revenue Management
- **Summary:** Get all admin revenues
- **Mô tả:** Retrieve all service fee records with pagination and sorting
- **Params:**
  - `status` (query, optional): Filter by status (PENDING/COLLECTED)
  - `page` (query, optional, default: 0): Page number (0-indexed)
  - `size` (query, optional, default: 10): Page size

#### 1.2. Get Collected Service Fees
```
GET /api/v1/admin/revenues/collected
```
- **Tag:** Admin Revenue Management
- **Summary:** Get collected service fees
- **Mô tả:** Retrieve all service fees already collected (status = COLLECTED)
- **Params:**
  - `page`, `size`, `sortBy`, `sortDir`

#### 1.3. Get Revenue by Date Range
```
GET /api/v1/admin/revenues/date-range
```
- **Tag:** Admin Revenue Management
- **Summary:** Get revenue by date range
- **Mô tả:** Get service fees collected in a specific date range
- **Params:**
  - `startDate` (required): Start date (format: yyyy-MM-dd)
  - `endDate` (required): End date (format: yyyy-MM-dd)
  - `page`, `size`

#### 1.4. Get Pending Service Fees
```
GET /api/v1/admin/revenues/pending
```
- **Tag:** Admin Revenue Management
- **Summary:** Get pending service fees
- **Mô tả:** Retrieve all service fees not yet collected (status = PENDING)
- **Params:**
  - `page`, `size`, `sortBy`, `sortDir`

#### 1.5. Get Revenue Statistics
```
GET /api/v1/admin/revenues/statistics
```
- **Tag:** Admin Revenue Management
- **Summary:** Get revenue statistics
- **Mô tả:** Get total, collected, and pending service fees

---

### 2. Product Browsing (1 API mới)

#### 2.1. Get Product by Variant ID
```
GET /api/v1/products/variant/{variantId}
```
- **Tag:** Product Browsing
- **Summary:** Get product by variant ID
- **Mô tả:** Retrieve product information using product variant ID

---

## ❌ ENDPOINTS BỊ XÓA (1 API)

### 1. Approve Withdrawal Request (REMOVED)
```
PUT /api/v1/admin/withdrawals/{requestId}/approve
```
- **Lý do:** Có thể đã được thay thế bằng API `/complete` hoặc logic đã thay đổi

---

## 🔄 ENDPOINTS THAY ĐỔI (4 APIs)

### 1. Get All Withdrawal Requests (Admin)
```
GET /api/v1/admin/withdrawals
```
**Thay đổi:**
- ✅ **Added params:** `sortDir`, `sortBy`
- Cho phép sort theo field và direction

---

### 2. Complete Withdrawal Transfer
```
PUT /api/v1/admin/withdrawals/{requestId}/complete
```
**Thay đổi:**
- ✅ **Added params:** `adminNote` (query, optional)
- Admin có thể thêm ghi chú khi hoàn tất withdrawal

---

### 3. Get Wallet Transactions
```
GET /api/v1/b2c/wallet/store/{storeId}/transactions
```
**Thay đổi:**
- ✅ **Added params:** `sortDir`, `sortBy`
- Cho phép sort transactions theo field và direction

---

### 4. Get Withdrawal Requests (Store)
```
GET /api/v1/b2c/wallet/store/{storeId}/withdrawals
```
**Thay đổi:**
- ✅ **Added params:** `sortDir`, `sortBy`
- Cho phép sort withdrawal requests theo field và direction

---

## 📦 SCHEMA CHANGES

### ✅ Schemas Mới (4)
1. **AdminWithdrawalResponse** - Response structure cho admin withdrawal
2. **ApiResponseAdminWithdrawalResponse** - Wrapper cho admin withdrawal response
3. **ApiResponsePageAdminWithdrawalResponse** - Paginated admin withdrawal response
4. **StoreResponse** - Store information response

### ❌ Schemas Bị Xóa (1)
1. **ApiResponse** - Có thể đã được thay thế bằng các response types cụ thể hơn

---

## 🎯 HÀNH ĐỘNG CẦN THỰC HIỆN

### 1. **Admin Revenue Management (MỚI - QUAN TRỌNG)**
- [ ] Tạo service file: `src/services/admin/adminRevenueService.js`
- [ ] Implement 5 APIs mới cho revenue management
- [ ] Tạo page: `src/pages/admin/AdminRevenue.jsx`
- [ ] Thêm route trong admin router
- [ ] Thêm menu item trong admin sidebar

### 2. **Product Browsing**
- [ ] Update `productService.js` để thêm API `getProductByVariantId`
- [ ] Có thể dùng cho product detail page khi chỉ có variant ID

### 3. **Withdrawal Management**
- [ ] ❌ **XÓA** API call tới `/approve` endpoint (đã bị remove)
- [ ] ✅ **UPDATE** `adminWalletService.js`:
  - Thêm params `sortBy`, `sortDir` cho `getAllWithdrawalRequests`
  - Thêm param `adminNote` cho `completeWithdrawalRequest`
- [ ] ✅ **UPDATE** `walletService.js`:
  - Thêm params `sortBy`, `sortDir` cho `getWithdrawalRequests`
  - Thêm params `sortBy`, `sortDir` cho `getWalletTransactions`

### 4. **Schemas**
- [ ] Update TypeScript types nếu có
- [ ] Update JSDoc comments với schemas mới

---

## 📝 GHI CHÚ QUAN TRỌNG

### 🆕 Admin Revenue Management
- **Đây là tính năng MỚI HOÀN TOÀN** cho phép admin xem và quản lý service fees
- Service fee là phí nền tảng thu từ mỗi đơn hàng
- Có 2 trạng thái: PENDING (chưa thu) và COLLECTED (đã thu)
- Cần tạo UI hoàn chỉnh để hiển thị:
  - Tổng revenue
  - Revenue theo thời gian
  - Danh sách pending fees
  - Danh sách collected fees
  - Statistics dashboard

### 🔄 Withdrawal Changes
- API `/approve` đã bị XÓA
- Có thể workflow mới chỉ cần `/complete` để xử lý withdrawal
- Cần kiểm tra lại UI và logic xử lý withdrawal

### 📊 Sorting Support
- Nhiều APIs đã thêm support cho sorting
- Frontend nên implement UI controls để user có thể sort data

---

## ✅ KẾT LUẬN

**Thay đổi lớn nhất:** Thêm module **Admin Revenue Management** hoàn toàn mới với 5 APIs để quản lý service fees của nền tảng.

**Ảnh hưởng:** 
- Cần implement UI mới cho Admin Revenue Management
- Cần update các service files hiện có để support sorting
- Cần remove code liên quan đến `/approve` withdrawal endpoint

**Độ ưu tiên:**
1. 🔴 **HIGH:** Implement Admin Revenue Management (tính năng mới)
2. 🟡 **MEDIUM:** Update withdrawal services (remove approve, add sorting)
3. 🟢 **LOW:** Add getProductByVariantId (optional enhancement)
