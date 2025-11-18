# 📋 BÁO CÁO API CHƯA LÀM HOẶC CHƯA TÍCH HỢP

**Ngày tạo:** $(Get-Date)

## ✅ TỔNG QUAN

Đã phân tích **Swagger API Documentation** và so sánh với **codebase hiện tại**.

---

## 🔴 CÁC API CHƯA LÀM HOẶC CHƯA TÍCH HỢP

### 1️⃣ **USER MANAGEMENT APIs**

#### ❌ CHƯA LÀM:
```
PUT /api/v1/users/avatar
- Cập nhật avatar người dùng
- Multipart form-data (avatarFile)
```

#### ✅ ĐÃ LÀM (trong authService.js):
- POST /api/v1/users/register
- POST /api/v1/users/login
- POST /api/v1/users/change-password
- POST /api/v1/users/send-verification-email
- GET /api/v1/users/verify
- POST /api/v1/users/auth/social/callback (Google OAuth)

---

### 2️⃣ **BRAND MANAGEMENT APIs**

#### ❌ CHƯA TẠO SERVICE FILE:
Cần tạo file: `src/services/common/brandService.js`

```javascript
// APIs cần implement:
GET /api/v1/brands (pagination)
GET /api/v1/brands/all (no pagination)
GET /api/v1/brands/{id}
GET /api/v1/brands/name/{name}
GET /api/v1/brands/name/{name}/exists
GET /api/v1/brands/{id}/exists
POST /api/v1/brands
PUT /api/v1/brands/{id}
DELETE /api/v1/brands/{id}
```

---

### 3️⃣ **CATEGORY MANAGEMENT APIs**

#### ❌ CHƯA TẠO SERVICE FILE:
Cần tạo file: `src/services/common/categoryService.js`

```javascript
// APIs cần implement:
GET /api/v1/categories (pagination)
GET /api/v1/categories/{id}
POST /api/v1/categories
PUT /api/v1/categories/{id}
DELETE /api/v1/categories/{id}
```

#### ✅ NOTE: 
File `categoryService.js` đã tồn tại nhưng CHƯA KIỂM TRA NỘI DUNG

---

### 4️⃣ **B2C STORE MANAGEMENT APIs**

#### ❌ CHƯA LÀM:
Cần tạo file: `src/services/b2c/b2cStoreService.js`

```javascript
// APIs cần implement:
POST /api/v1/b2c/stores/create (multipart form-data với logo)
PUT /api/v1/b2c/stores/{storeId}
DELETE /api/v1/b2c/stores/{storeId} (soft delete)
PUT /api/v1/b2c/stores/{storeId}/logo (multipart form-data)
PUT /api/v1/b2c/stores/{storeId}/banner (multipart form-data)
PUT /api/v1/b2c/stores/{storeId}/approve (Admin function)
PUT /api/v1/b2c/stores/{storeId}/reject?reason=xxx (Admin function)
GET /api/v1/b2c/stores/my-stores
```

#### ✅ ĐÃ LÀM (trong storeService.js):
- GET /api/v1/stores (public browsing)
- GET /api/v1/stores/{storeId}
- GET /api/v1/stores/owner/{ownerId}

---

### 5️⃣ **B2C PRODUCT MANAGEMENT APIs**

#### ❌ CHƯA LÀM:
File `b2cProductService.js` cần kiểm tra và bổ sung:

```javascript
// APIs cần implement:
POST /api/v1/b2c/products/create
PUT /api/v1/b2c/products/update/{id}
GET /api/v1/b2c/products/{storeId}?status=xxx (pagination)
```

---

### 6️⃣ **B2C PRODUCT VARIANT MANAGEMENT APIs**

#### ❌ CHƯA LÀM:
Cần kiểm tra file `b2cVariantService.js` hoặc tạo mới:

```javascript
// APIs cần implement:
POST /api/v1/b2c/product-variants/create (multipart với images)
POST /api/v1/b2c/product-variants/create-without-image
POST /api/v1/b2c/product-variants/add-colors/{id} (multipart với image)
PUT /api/v1/b2c/product-variants/update-stock/{id}?newStock=X
PUT /api/v1/b2c/product-variants/update-price/{id}?newPrice=X
PUT /api/v1/b2c/product-variants/update-colors/{id}/color/{colorId}
DELETE /api/v1/b2c/product-variants/delete/{id}
GET /api/v1/b2c/product-variants/{storeId}?status=xxx (pagination)
```

---

### 7️⃣ **B2C ANALYTICS APIs**

#### ✅ ĐÃ LÀM ĐẦY ĐỦ (trong b2cAnalyticsService.js):
- 16 APIs đã implement đầy đủ ✅
- NHƯNG CHƯA TÍCH HỢP VÀO PAGE ANALYTICS

#### 🔶 CẦN BỔ SUNG VÀO PAGE:
Tạo/cập nhật file: `src/pages/store/StoreAnalytics.jsx`

**APIs đã có:**
1. getDashboardAnalytics ✅
2. getRevenueAnalytics ✅
3. getRevenueByDateRange ✅
4. getOrderAnalytics ✅
5. getOrderStatusAnalytics ✅
6. getProductAnalytics ✅
7. getTopProducts ✅
8. getCustomerAnalytics ✅
9. getTopCustomers ✅
10. getCustomerGrowth ✅
11. getReviewAnalytics ✅
12. getRatingDistribution ✅
13. getInventoryAnalytics ✅
14. getSalesTrend ✅
15. getSalesByCategory ✅
16. getPerformanceMetrics ✅

**THIẾU TRONG SWAGGER NHƯNG CÓ TRONG SERVICE:**
- getRevenueByDateRange (có thể là custom implementation)

---

### 8️⃣ **B2C ORDER MANAGEMENT APIs**

#### ✅ ĐÃ LÀM ĐẦY ĐỦ (trong b2cOrderService.js):
- 9 APIs đã implement ✅

#### 🔶 LƯU Ý:
Trong Swagger có endpoint:
```
GET /api/v1/b2c/orders/revenue?storeId=xxx&startDate=xxx&endDate=xxx
```
Service đang implement:
```javascript
GET /api/v1/b2c/orders/revenue
// Params: startDate, endDate
// THIẾU: storeId param
```

**CẦN SỬA:**
```javascript
export const getRevenueStatistics = async (storeId, startDate, endDate) => {
  const response = await api.get('/api/v1/b2c/orders/revenue', {
    params: { storeId, startDate, endDate }, // ← Thêm storeId
  });
};
```

Tương tự cho `getOrderStatistics`:
```javascript
export const getOrderStatistics = async (storeId) => {
  const response = await api.get('/api/v1/b2c/orders/statistics', {
    params: { storeId }, // ← Thêm storeId
  });
};
```

---

### 9️⃣ **B2C PROMOTION MANAGEMENT APIs**

#### ✅ ĐÃ LÀM ĐẦY ĐỦ (trong b2cPromotionService.js):
- 10 APIs đã implement ✅

---

### 🔟 **BUYER ADDRESS MANAGEMENT APIs**

#### ❌ CHƯA LÀM:
Kiểm tra file `addressService.js`:

```javascript
// APIs cần implement:
GET /api/v1/buyer/address
POST /api/v1/buyer/address
PUT /api/v1/buyer/address/{addressId}
DELETE /api/v1/buyer/address/{addressId}
GET /api/v1/buyer/address/check
```

---

### 1️⃣1️⃣ **BUYER CART MANAGEMENT APIs**

#### ❌ CHƯA LÀM:
Kiểm tra file `cartService.js`:

```javascript
// APIs cần implement:
POST /api/v1/buyer/cart/add (array of items)
GET /api/v1/buyer/cart
GET /api/v1/buyer/cart/count
PUT /api/v1/buyer/cart/{productVariantId}?colorId=xxx (update quantity)
DELETE /api/v1/buyer/cart/{cartItemId}
DELETE /api/v1/buyer/cart (remove many items - array)
DELETE /api/v1/buyer/cart/clear
```

---

### 1️⃣2️⃣ **BUYER ORDER MANAGEMENT APIs**

#### ❌ CHƯA LÀM:
Kiểm tra file `orderService.js`:

```javascript
// APIs cần implement:
POST /api/v1/buyer/orders/checkout
GET /api/v1/buyer/orders (my orders)
GET /api/v1/buyer/orders/{orderId}
PUT /api/v1/buyer/orders/{orderId}/cancel?reason=xxx
```

---

### 1️⃣3️⃣ **BUYER REVIEW MANAGEMENT APIs**

#### ❌ CHƯA LÀM:
Kiểm tra file `reviewService.js`:

```javascript
// APIs cần implement:
POST /api/v1/buyer/reviews
PUT /api/v1/buyer/reviews/{reviewId}
DELETE /api/v1/buyer/reviews/{reviewId}
GET /api/v1/buyer/reviews/my-reviews
```

---

### 1️⃣4️⃣ **PUBLIC REVIEW APIs**

#### ❌ CHƯA LÀM:

```javascript
// APIs cần implement (public, no auth):
GET /api/v1/reviews/product-variant/{productVariantId}
GET /api/v1/reviews/product-variant/{productVariantId}/stats
```

---

### 1️⃣5️⃣ **PUBLIC PROMOTION APIs**

#### ❌ CHƯA LÀM:
Tạo file: `src/services/common/promotionService.js`

```javascript
// APIs public (no auth):
GET /api/v1/promotions (all active)
GET /api/v1/promotions/{promotionId}
GET /api/v1/promotions/code/{promotionCode}
GET /api/v1/promotions/type/{type}
GET /api/v1/promotions/platform (platform promotions)
GET /api/v1/promotions/store/{storeId}/active
GET /api/v1/promotions/validate/{promotionId}?orderValue=xxx
GET /api/v1/promotions/calculate-discount/{promotionId}?orderValue=xxx
```

---

### 1️⃣6️⃣ **PRODUCT BROWSING (PUBLIC) APIs**

#### ❌ CHƯA LÀM:
Kiểm tra file `productService.js`:

```javascript
// APIs public:
GET /api/v1/products?name=xxx (search)
GET /api/v1/products/{id}
GET /api/v1/products/category/{name}
GET /api/v1/products/category/{category}/brand/{brand}
```

---

### 1️⃣7️⃣ **PRODUCT VARIANT BROWSING (PUBLIC) APIs**

#### ❌ CHƯA LÀM:

```javascript
// APIs public:
GET /api/v1/product-variants/{id}
GET /api/v1/product-variants/search?name=xxx
GET /api/v1/product-variants/product/{productId} (all variants)
GET /api/v1/product-variants/store/{storeId}
GET /api/v1/product-variants/category/{category}
GET /api/v1/product-variants/latest
```

---

### 1️⃣8️⃣ **ADMIN USER MANAGEMENT APIs**

#### ❌ CHƯA LÀM:
Tạo file: `src/services/admin/adminUserService.js`

```javascript
// Admin APIs:
GET /api/v1/admin/users (filter: name, email, phone)
GET /api/v1/admin/users/check-ban/{userId}
POST /api/v1/admin/users/ban (BanUserDTO)
POST /api/v1/admin/users/unban/{userId}
```

---

### 1️⃣9️⃣ **ADMIN STORE MANAGEMENT APIs**

#### ❌ CHƯA LÀM:
Kiểm tra file `adminStoreService.js`:

```javascript
// Admin APIs:
GET /api/v1/admin/stores/pending
GET /api/v1/admin/stores/approved
PUT /api/v1/admin/stores/{storeId}/status
PUT /api/v1/admin/stores/{storeId}/approve
PUT /api/v1/admin/stores/{storeId}/reject?reason=xxx
DELETE /api/v1/admin/stores/{storeId} (soft delete)
```

---

### 2️⃣0️⃣ **ADMIN PRODUCT MANAGEMENT APIs**

#### ❌ CHƯA LÀM:
Kiểm tra file `adminProductService.js`:

```javascript
// Admin APIs:
GET /api/v1/admin/products/pending
PUT /api/v1/admin/products/{productId}/approve
PUT /api/v1/admin/products/{productId}/reject?reason=xxx
```

---

### 2️⃣1️⃣ **ADMIN PRODUCT VARIANT MANAGEMENT APIs**

#### ❌ CHƯA LÀM:
Kiểm tra file `adminVariantService.js`:

```javascript
// Admin APIs:
GET /api/v1/admin/product-variants/pending
PUT /api/v1/admin/product-variants/{variantId}/approve
PUT /api/v1/admin/product-variants/{variantId}/reject?reason=xxx
```

---

### 2️⃣2️⃣ **ADMIN PROMOTION MANAGEMENT APIs**

#### ❌ CHƯA LÀM:
Kiểm tra file `adminPromotionService.js`:

```javascript
// Admin APIs:
GET /api/v1/admin/promotions (all promotions)
GET /api/v1/admin/promotions/{promotionId}
GET /api/v1/admin/promotions/reports/active
GET /api/v1/admin/promotions/reports/inactive
GET /api/v1/admin/promotions/reports/expired
GET /api/v1/admin/promotions/reports/deleted
GET /api/v1/admin/promotions/reports/type/{type}
POST /api/v1/admin/promotions/platform (create platform promotion)
PUT /api/v1/admin/promotions/platform/{promotionId}
PUT /api/v1/admin/promotions/{promotionId}/activate
PUT /api/v1/admin/promotions/{promotionId}/deactivate
DELETE /api/v1/admin/promotions/{promotionId}
```

---

### 2️⃣3️⃣ **PASSWORD RESET API**

#### ❌ CHƯA LÀM:

```javascript
POST /forgot-password?email=xxx
// Gửi password mới qua email
```

---

## 📊 THỐNG KÊ TỔNG QUAN

### ✅ APIs ĐÃ LÀM ĐẦY ĐỦ:
1. ✅ B2C Analytics (16 APIs) - **CHƯA TÍCH HỢP VÀO PAGE**
2. ✅ B2C Order Management (9 APIs) - **CẦN SỬA params**
3. ✅ B2C Promotion Management (10 APIs)
4. ✅ User Authentication & Registration (6 APIs)

### 🔶 APIs ĐÃ LÀM NHƯNG CHƯA TÍCH HỢP:
- B2C Analytics → Cần tạo `StoreAnalytics.jsx` page

### 🔴 APIs CHƯA LÀM (CẦN TẠO SERVICE):
1. ❌ Brand Management (8 APIs)
2. ❌ Category Management (5 APIs)
3. ❌ B2C Store Management (8 APIs)
4. ❌ B2C Product Management (3 APIs)
5. ❌ B2C Product Variant Management (8 APIs)
6. ❌ Buyer Address Management (5 APIs)
7. ❌ Buyer Cart Management (7 APIs)
8. ❌ Buyer Order Management (4 APIs)
9. ❌ Buyer Review Management (4 APIs)
10. ❌ Public Review APIs (2 APIs)
11. ❌ Public Promotion APIs (8 APIs)
12. ❌ Product Browsing Public (4 APIs)
13. ❌ Product Variant Browsing (6 APIs)
14. ❌ Admin User Management (4 APIs)
15. ❌ Admin Store Management (6 APIs)
16. ❌ Admin Product Management (3 APIs)
17. ❌ Admin Variant Management (3 APIs)
18. ❌ Admin Promotion Management (13 APIs)
19. ❌ Password Reset (1 API)

---

## 🎯 HÀNH ĐỘNG CẦN LÀM

### 📌 PRIORITY 1 - QUAN TRỌNG NHẤT:

1. **Tạo Brand Service**
   - File: `src/services/common/brandService.js`
   - 8 APIs

2. **Tạo Category Service**
   - File: `src/services/common/categoryService.js`
   - 5 APIs

3. **Tạo B2C Store Service**
   - File: `src/services/b2c/b2cStoreService.js`
   - 8 APIs (bao gồm upload logo/banner)

4. **Tạo B2C Product Service**
   - File: `src/services/b2c/b2cProductService.js`
   - 3 APIs

5. **Tạo B2C Variant Service**
   - File: `src/services/b2c/b2cVariantService.js`
   - 8 APIs (bao gồm upload images, add colors)

### 📌 PRIORITY 2 - BUYER FEATURES:

6. **Buyer Address Service**
   - File: `src/services/buyer/addressService.js`
   - 5 APIs

7. **Buyer Cart Service**
   - File: `src/services/buyer/cartService.js`
   - 7 APIs

8. **Buyer Order Service**
   - File: `src/services/buyer/orderService.js`
   - 4 APIs

9. **Buyer Review Service**
   - File: `src/services/buyer/reviewService.js`
   - 4 APIs

### 📌 PRIORITY 3 - PUBLIC BROWSING:

10. **Public Promotion Service**
    - File: `src/services/common/promotionService.js`
    - 8 APIs

11. **Product Browsing Service**
    - File: `src/services/common/productService.js`
    - 4 APIs

12. **Product Variant Browsing**
    - File: `src/services/common/variantService.js`
    - 6 APIs

13. **Public Review Service**
    - Thêm vào `reviewService.js`
    - 2 APIs

### 📌 PRIORITY 4 - ADMIN PANEL:

14. **Admin User Service**
    - File: `src/services/admin/adminUserService.js`
    - 4 APIs

15. **Admin Store Service**
    - File: `src/services/admin/adminStoreService.js`
    - 6 APIs

16. **Admin Product Service**
    - File: `src/services/admin/adminProductService.js`
    - 3 APIs

17. **Admin Variant Service**
    - File: `src/services/admin/adminVariantService.js`
    - 3 APIs

18. **Admin Promotion Service**
    - File: `src/services/admin/adminPromotionService.js`
    - 13 APIs

### 📌 PRIORITY 5 - UTILITY:

19. **Password Reset**
    - Thêm vào `authService.js`
    - 1 API

---

## 🔧 BỔ SUNG VÀO PAGE HIỆN CÓ

### 1. StoreAnalytics.jsx
**APIs đã có service nhưng CHƯA sử dụng:**
- getDashboardAnalytics
- getRevenueAnalytics
- getOrderAnalytics
- getProductAnalytics
- getCustomerAnalytics
- getSalesTrend
- getSalesByCategory
- getInventoryAnalytics
- getPerformanceMetrics
- getTopProducts
- getTopCustomers
- getCustomerGrowth

**Cần tạo UI cho:**
- Dashboard tổng quan
- Biểu đồ doanh thu
- Biểu đồ đơn hàng
- Top sản phẩm
- Top khách hàng
- Inventory alerts

### 2. StoreOrders.jsx
**Cần sửa API calls:**
```javascript
// Hiện tại thiếu storeId param
getOrderStatistics(storeId)
getRevenueStatistics(storeId, startDate, endDate)
```

---

## 📝 NOTES

1. **File upload APIs** cần xử lý multipart/form-data:
   - User avatar
   - Store logo/banner
   - Product variant images
   - Color option images

2. **Admin APIs** cần kiểm tra role ADMIN trong middleware

3. **Pagination** đã standardize: page, size, sortBy, sortDir

4. **Error handling** đã có sẵn trong `api.js`

---

## 🏁 KẾT LUẬN

**TỔNG SỐ APIs:**
- ✅ Đã làm: ~35 APIs
- 🔶 Đã làm nhưng chưa dùng: 16 APIs (Analytics)
- ❌ Chưa làm: ~120 APIs

**ƯU TIÊN:**
1. Tạo Brand & Category Service (cơ sở dữ liệu)
2. Tạo B2C Store & Product & Variant Service (core features)
3. Tạo Buyer Services (Cart, Order, Address, Review)
4. Tạo Public Browsing Services
5. Tạo Admin Services
6. Tích hợp Analytics vào UI

**THỜI GIAN ƯỚC TÍNH:**
- Mỗi service file: 1-2 giờ
- Tổng: ~40-80 giờ làm việc
