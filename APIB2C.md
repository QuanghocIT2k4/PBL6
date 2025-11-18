# 📊 TỔNG HỢP CÁC API B2C STORE DASHBOARD

**Dựa trên Swagger API Specification**  
**Role:** B2C Store Owner / Seller  
**Authentication:** Required (Bearer Token)

---

## ✅ TỔNG QUAN: 71 APIs cho B2C Store Management (+5 APIs mới)

---

## 1️⃣ QUẢN LÝ CỬA HÀNG (B2C Store Management) - 6 APIs

### ✅ Đã implement: 6/6 (100%)

| API Endpoint | Method | Mô tả | Service Function |
|--------------|--------|-------|------------------|
| `GET /api/v1/b2c/stores/my-stores` | GET | Lấy danh sách cửa hàng của tôi | `getMyStores()` ✅ |
| `POST /api/v1/b2c/stores/create` | POST | Tạo cửa hàng mới | `createStore()` ✅ |
| `PUT /api/v1/b2c/stores/{storeId}` | PUT | Cập nhật thông tin cửa hàng | `updateStore()` ✅ |
| `PUT /api/v1/b2c/stores/{storeId}/logo` | PUT | Upload logo cửa hàng | `uploadStoreLogo()` ✅ |
| `PUT /api/v1/b2c/stores/{storeId}/banner` | PUT | Upload banner cửa hàng | `uploadStoreBanner()` ✅ |
| `DELETE /api/v1/b2c/stores/{storeId}` | DELETE | Xóa cửa hàng (soft delete) | `deleteStore()` ✅ |

**📦 Files:**
- Service: `b2cStoreService.js`
- Pages: `StoreProfile.jsx`, `BecomeStoreOwner.jsx`

---

## 2️⃣ QUẢN LÝ SẢN PHẨM (B2C Product Management) - 3 APIs

### ✅ Đã implement: 3/3 (100%)

| API Endpoint | Method | Mô tả | Service Function |
|--------------|--------|-------|------------------|
| `GET /api/v1/b2c/products/{storeId}` | GET | Lấy danh sách products của store | `getProductsByStore()` ✅ |
| `POST /api/v1/b2c/products/create` | POST | Tạo product mới (sản phẩm cha) | `createProduct()` ✅ |
| `PUT /api/v1/b2c/products/update/{id}` | PUT | Cập nhật thông tin product | `updateProduct()` ✅ |

**📦 Files:**
- Service: `b2cProductService.js`
- Pages: `StoreProducts.jsx`, `StoreCreateProduct.jsx`

**🎯 Lưu ý:**
- Product là "sản phẩm cha" (VD: iPhone 15)
- Chứa thông tin chung: name, description, category, brand
- KHÔNG CÓ giá và stock (nằm ở Product Variant)

---

## 3️⃣ QUẢN LÝ BIẾN THỂ SẢN PHẨM (B2C Product Variant Management) - 9 APIs

### ✅ Đã implement: 9/9 (100%)

| API Endpoint | Method | Mô tả | Service Function |
|--------------|--------|-------|------------------|
| `GET /api/v1/b2c/product-variants/{storeId}` | GET | Lấy tất cả variants của store | `getProductVariantsByStore()` ✅ |
| `POST /api/v1/b2c/product-variants/create` | POST | Tạo variant mới (có ảnh) | `createProductVariant()` ✅ |
| `POST /api/v1/b2c/product-variants/create-without-image` | POST | Tạo variant mới (không ảnh) | `createProductVariantWithoutImage()` ✅ |
| `POST /api/v1/b2c/product-variants/add-colors/{id}` | POST | Thêm màu sắc cho variant | `addColorsToVariant()` ✅ |
| `PUT /api/v1/b2c/product-variants/update-stock/{id}` | PUT | Cập nhật stock (tồn kho) | `updateVariantStock()` ✅ |
| `PUT /api/v1/b2c/product-variants/update-price/{id}` | PUT | Cập nhật giá bán | `updateVariantPrice()` ✅ |
| `PUT /api/v1/b2c/product-variants/update-colors/{id}/color/{colorId}` | PUT | Cập nhật thông tin 1 màu | `updateVariantColor()` ✅ |
| `DELETE /api/v1/b2c/product-variants/{id}` | DELETE | Xóa variant | `deleteProductVariant()` ✅ |
| `DELETE /api/v1/b2c/product-variants/{id}/color/{colorId}` | DELETE | Xóa 1 màu của variant | `deleteVariantColor()` ✅ |

**📦 Files:**
- Service: `b2cProductService.js`
- Pages: `StoreVariants.jsx`, `AddProductVariant.jsx`, `StoreProductVariants.jsx`

**🎯 Lưu ý:**
- Variant là "sản phẩm con" (VD: iPhone 15 128GB Đen)
- Chứa: name, price, stock, attributes (size, color...)
- **Colors logic:**
  - Nếu variant KHÔNG có colors → Cập nhật price/stock trực tiếp
  - Nếu variant CÓ colors → Price = MIN của colors, Stock = SUM của colors

---

## 4️⃣ QUẢN LÝ ĐƠN HÀNG (B2C Order Management) - 9 APIs

### ✅ Đã implement: 9/9 (100%)

| API Endpoint | Method | Mô tả | Service Function |
|--------------|--------|-------|------------------|
| `GET /api/v1/b2c/orders` | GET | Lấy danh sách đơn hàng của store | `getStoreOrders()` ✅ |
| `GET /api/v1/b2c/orders/{orderId}` | GET | Chi tiết đơn hàng | `getStoreOrderById()` ✅ |
| `GET /api/v1/b2c/orders/statistics` | GET | Thống kê đơn hàng | `getOrderStatistics()` ✅ |
| `GET /api/v1/b2c/orders/revenue` | GET | Thống kê doanh thu | `getRevenueStatistics()` ✅ |
| `PUT /api/v1/b2c/orders/{orderId}/status` | PUT | Cập nhật trạng thái đơn hàng | `updateOrderStatus()` ✅ |
| `PUT /api/v1/b2c/orders/{orderId}/confirm` | PUT | Xác nhận đơn hàng | `confirmOrder()` ✅ |
| `PUT /api/v1/b2c/orders/{orderId}/ship` | PUT | Đánh dấu đang giao hàng | `shipOrder()` ✅ |
| `PUT /api/v1/b2c/orders/{orderId}/deliver` | PUT | Đánh dấu đã giao hàng | `deliverOrder()` ✅ |
| `PUT /api/v1/b2c/orders/{orderId}/cancel` | PUT | Hủy đơn hàng | `cancelOrder()` ✅ |

**📦 Files:**
- Service: `b2cOrderService.js`
- Pages: `StoreOrders.jsx`, `StoreOrderDetail.jsx`

**🎯 Order Status Flow:**
```
PENDING → CONFIRMED → SHIPPING → DELIVERED
   ↓
CANCELLED
```

**⚠️ Stock Management:**
- **PENDING**: Stock CHƯA trừ (chỉ reserve)
- **CONFIRMED**: Stock BỊ TRỪ tại đây
- **CANCELLED**: Restore stock nếu đã CONFIRMED

---

## 5️⃣ QUẢN LÝ KHUYẾN MÃI (B2C Promotion Management) - 9 APIs

### ✅ Đã implement: 9/9 (100%)

| API Endpoint | Method | Mô tả | Service Function |
|--------------|--------|-------|------------------|
| `GET /api/v1/b2c/promotions/store/{storeId}` | GET | Tất cả promotions của store | `getStorePromotions()` ✅ |
| `GET /api/v1/b2c/promotions/store/{storeId}/active` | GET | Promotions đang active | `getActivePromotions()` ✅ |
| `GET /api/v1/b2c/promotions/store/{storeId}/inactive` | GET | Promotions đang inactive | `getInactivePromotions()` ✅ |
| `GET /api/v1/b2c/promotions/store/{storeId}/expired` | GET | Promotions đã hết hạn | `getExpiredPromotions()` ✅ |
| `GET /api/v1/b2c/promotions/store/{storeId}/deleted` | GET | Promotions đã xóa | `getDeletedPromotions()` ✅ |
| `POST /api/v1/b2c/promotions` | POST | Tạo promotion mới | `createPromotion()` ✅ |
| `PUT /api/v1/b2c/promotions/{promotionId}` | PUT | Cập nhật promotion | `updatePromotion()` ✅ |
| `PUT /api/v1/b2c/promotions/{promotionId}/activate` | PUT | Kích hoạt promotion | `activatePromotion()` ✅ |
| `PUT /api/v1/b2c/promotions/{promotionId}/deactivate` | PUT | Tắt promotion | `deactivatePromotion()` ✅ |
| `DELETE /api/v1/b2c/promotions/{promotionId}` | DELETE | Xóa promotion | `deletePromotion()` ✅ |

**📦 Files:**
- Service: `b2cPromotionService.js`
- Pages: `StorePromotions.jsx`

**🎯 Promotion Types:**
- `PERCENTAGE`: Giảm theo % (VD: 10% off)
- `FIXED_AMOUNT`: Giảm cố định (VD: -50,000đ)

---

## 6️⃣ THỐNG KÊ & PHÂN TÍCH (B2C Analytics) - 17 APIs

### ✅ Đã implement: 17/17 (100%)

#### **A. Revenue Analytics (Doanh thu):**

| API Endpoint | Method | Mô tả | Service Function |
|--------------|--------|-------|------------------|
| `GET /api/v1/b2c/analytics/revenue/{storeId}` | GET | Tổng quan doanh thu | `getRevenueOverview()` ✅ |
| `GET /api/v1/b2c/analytics/revenue/{storeId}/date-range` | GET | Doanh thu theo khoảng thời gian | `getRevenueByDateRange()` ✅ |
| `GET /api/v1/b2c/analytics/revenue/{storeId}/performance` | GET | Hiệu suất doanh thu | `getRevenuePerformance()` ✅ |

#### **B. Sales Analytics (Bán hàng):**

| API Endpoint | Method | Mô tả | Service Function |
|--------------|--------|-------|------------------|
| `GET /api/v1/b2c/analytics/sales/{storeId}/trend` | GET | Xu hướng bán hàng | `getSalesTrend()` ✅ |
| `GET /api/v1/b2c/analytics/sales/{storeId}/category` | GET | Bán hàng theo category | `getSalesByCategory()` ✅ |

#### **C. Order Analytics (Đơn hàng):**

| API Endpoint | Method | Mô tả | Service Function |
|--------------|--------|-------|------------------|
| `GET /api/v1/b2c/analytics/orders/{storeId}` | GET | Thống kê đơn hàng | `getOrderAnalytics()` ✅ |
| `GET /api/v1/b2c/analytics/orders/{storeId}/status` | GET | Đơn hàng theo status | `getOrdersByStatus()` ✅ |

#### **D. Product Analytics (Sản phẩm):**

| API Endpoint | Method | Mô tả | Service Function |
|--------------|--------|-------|------------------|
| `GET /api/v1/b2c/analytics/products/{storeId}` | GET | Thống kê sản phẩm | `getProductAnalytics()` ✅ |
| `GET /api/v1/b2c/analytics/products/{storeId}/low-stock` | GET | Sản phẩm sắp hết hàng | `getLowStockProducts()` ✅ |
| `GET /api/v1/b2c/analytics/products/{storeId}/best-selling` | GET | Sản phẩm bán chạy | `getBestSellingProducts()` ✅ |

#### **E. Customer Analytics (Khách hàng):**

| API Endpoint | Method | Mô tả | Service Function |
|--------------|--------|-------|------------------|
| `GET /api/v1/b2c/analytics/customers/{storeId}` | GET | Thống kê khách hàng | `getCustomerAnalytics()` ✅ |
| `GET /api/v1/b2c/analytics/customers/{storeId}/top` | GET | Top khách hàng | `getTopCustomers()` ✅ |
| `GET /api/v1/b2c/analytics/customers/{storeId}/growth` | GET | Tăng trưởng khách hàng | `getCustomerGrowth()` ✅ |

#### **F. Review Analytics (Đánh giá):**

| API Endpoint | Method | Mô tả | Service Function |
|--------------|--------|-------|------------------|
| `GET /api/v1/b2c/analytics/reviews/{storeId}` | GET | Tổng quan đánh giá | `getReviewOverview()` ✅ |
| `GET /api/v1/b2c/analytics/reviews/{storeId}/rating-distribution` | GET | Phân bố rating | `getRatingDistribution()` ✅ |
| `GET /api/v1/b2c/analytics/reviews/{storeId}/pending` | GET | Đánh giá chờ phản hồi | `getPendingReviews()` ✅ |

#### **G. Dashboard Analytics (Tổng quan):**

| API Endpoint | Method | Mô tả | Service Function |
|--------------|--------|-------|------------------|
| `GET /api/v1/b2c/analytics/dashboard/{storeId}` | GET | Dashboard metrics tổng hợp | `getDashboardAnalytics()` ✅ |

**📦 Files:**
- Service: `b2cAnalyticsService.js`
- Pages: `StoreDashboard.jsx`, `StoreAnalytics.jsx`

---

## 7️⃣ QUẢN LÝ VÍ (B2C Wallet Management) - 5 APIs ⭐ MỚI

### ⭐ Cần implement: 5/5 (0%)

| API Endpoint | Method | Mô tả | Service Function |
|--------------|--------|-------|------------------|
| `GET /api/v1/b2c/wallet/store/{storeId}` | GET | Xem thông tin ví & số dư | `getWalletInfo()` ⭐ |
| `POST /api/v1/b2c/wallet/store/{storeId}/withdrawal` | POST | Tạo yêu cầu rút tiền | `createWithdrawal()` ⭐ |
| `GET /api/v1/b2c/wallet/store/{storeId}/withdrawals` | GET | Danh sách yêu cầu rút tiền | `getWithdrawals()` ⭐ |
| `GET /api/v1/b2c/wallet/store/{storeId}/withdrawal/{requestId}` | GET | Chi tiết yêu cầu rút tiền | `getWithdrawalDetail()` ⭐ |
| `GET /api/v1/b2c/wallet/store/{storeId}/transactions` | GET | Lịch sử giao dịch | `getTransactions()` ⭐ |

**📦 Files cần tạo:**
- Service: `walletService.js` ⭐ MỚI
- Pages: `StoreWallet.jsx`, `WithdrawalHistory.jsx` ⭐ MỚI

**🎯 Wallet Info DTO:**
```javascript
{
  storeId: "xxx",
  balance: 50000000,        // Số dư hiện tại (VND)
  currency: "VND",
  totalEarned: 100000000,   // Tổng đã kiếm được
  totalWithdrawn: 50000000, // Tổng đã rút
  pendingAmount: 0,         // Số tiền đang chờ rút
  lastUpdated: "2024-01-01T00:00:00Z"
}
```

**🎯 Create Withdrawal Request:**
```javascript
POST /api/v1/b2c/wallet/store/{storeId}/withdrawal
Body: {
  amount: 5000000,
  bankName: "Vietcombank",
  bankAccount: "1234567890",
  accountHolder: "NGUYEN VAN A",
  note: "Rút tiền tháng 11"
}
```

**🎯 Transaction Types:**
- `DEPOSIT` - Tiền vào (từ đơn hàng)
- `WITHDRAWAL` - Tiền ra (rút về ngân hàng)
- `COMMISSION` - Phí hoa hồng (trừ)
- `REFUND` - Hoàn tiền (trừ)

**⚠️ Lưu ý:**
- Chỉ rút được khi balance > 0
- Mỗi yêu cầu rút tiền phải chờ admin duyệt
- Số tiền rút phải <= balance hiện tại
- Sau khi tạo withdrawal, số tiền sẽ bị "hold" (pending)

---

## 8️⃣ ADMIN FUNCTIONS (⚠️ For Backend Use Only)

**Các API này CHỈ ADMIN mới có quyền gọi:**

| API Endpoint | Method | Mô tả | Note |
|--------------|--------|-------|------|
| `PUT /api/v1/b2c/stores/{storeId}/approve` | PUT | Approve store (Admin) | ⚠️ Admin only |
| `PUT /api/v1/b2c/stores/{storeId}/reject` | PUT | Reject store (Admin) | ⚠️ Admin only |

**⚠️ Lưu ý:** Store owners KHÔNG thể tự approve store của mình

---

## 📊 TỔNG KẾT APIs

| Nhóm | Total APIs | Implemented | % |
|------|------------|-------------|---|
| **Store Management** | 6 | 6 | 100% ✅ |
| **Product Management** | 3 | 3 | 100% ✅ |
| **Product Variant Management** | 9 | 9 | 100% ✅ |
| **Order Management** | 9 | 9 | 100% ✅ |
| **Promotion Management** | 9 | 9 | 100% ✅ |
| **Analytics** | 17 | 17 | 100% ✅ |
| **Wallet Management** | 5 | 0 | 0% ⭐ MỚI |
| **TOTAL** | **58** | **53** | **91%** |

---

## 🎯 PAGES TRONG STORE DASHBOARD

1. **Dashboard** (`StoreDashboard.jsx`) - Tổng quan metrics
2. **Thông tin Store** (`StoreProfile.jsx`) - Quản lý thông tin cửa hàng
3. **Sản phẩm** (`StoreProducts.jsx`) - Quản lý products
4. **Biến thể** (`StoreVariants.jsx`) - Quản lý variants (giá, tồn kho)
5. **Đơn hàng** (`StoreOrders.jsx`) - Quản lý đơn hàng
6. **Khuyến mãi** (`StorePromotions.jsx`) - Quản lý promotions
7. **Thống kê** (`StoreAnalytics.jsx`) - Analytics đầy đủ
8. **Ví** (`StoreWallet.jsx`) - Quản lý ví & rút tiền ⭐ MỚI

---

## ✅ KẾT LUẬN

**B2C Store APIs: CẬP NHẬT VỚI SWAGGER MỚI**

- ✅ 53/58 APIs đã implement (91%)
- ⭐ Thêm 5 APIs Wallet Management mới
- 🚀 Cần implement hệ thống ví & rút tiền

**📋 TODO:**
1. Tạo `walletService.js`
2. Tạo `StoreWallet.jsx` - Trang quản lý ví
3. Tạo `WithdrawalHistory.jsx` - Lịch sử rút tiền
4. Thêm menu "Ví" vào Store Dashboard Sidebar
5. Implement withdrawal request form
6. Test wallet & withdrawal flow

**🎯 Priority:**
- **HIGH**: Wallet Management (chủ shop cần rút tiền)
- Phối hợp với Admin Withdrawal Management để hoàn thiện flow

**Generated:** November 18, 2025
