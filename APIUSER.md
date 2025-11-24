# 👤 TỔNG HỢP CÁC API NHÓM USER (BUYER)

**Dựa trên Swagger API Specification**  
**Cập nhật:** 22/11/2025  
**Role:** BUYER (Người mua hàng)

---

## 📊 TỔNG QUAN

- ✅ **Public APIs**: 27 APIs (không cần đăng nhập)
- ✅ **Buyer APIs**: 30 APIs (cần đăng nhập với role BUYER)
- **TOTAL**: 57 APIs (100% implemented)





📝 **TỔNG KẾT CÁC NHÓM API PUBLIC (Không cần đăng nhập):**

## 🌐 API PUBLIC - KHÔNG CẦN AUTHENTICATION

### 1. Product Variant Browsing (7 APIs) ✅
- `GET /api/v1/product-variants/{id}` - Chi tiết variant
- `GET /api/v1/product-variants/latest` - Sản phẩm mới nhất
- `GET /api/v1/product-variants/search` - Tìm kiếm (query: name)
- `GET /api/v1/product-variants/product/{productId}` - Variants của 1 sản phẩm
- `GET /api/v1/product-variants/store/{storeId}` - Sản phẩm của shop
- `GET /api/v1/product-variants/category/{category}` - Theo category
- `GET /api/v1/product-variants/category/{category}/brand/{brand}` - Lọc theo cả category + brand

### 2. Product Browsing (3 APIs) - KHÔNG DÙNG TRỰC TIẾP ⚠️
- `GET /api/v1/products` - Search products by name
- `GET /api/v1/products/{id}` - Chi tiết product
- `GET /api/v1/products/category/{name}` - Products theo category
- `GET /api/v1/products/category/{category}/brand/{brand}` - Lọc category + brand

**⚠️ LƯU Ý:** Product APIs KHÔNG CÓ ảnh và giá, chỉ dùng ProductVariant APIs

### 3. Store Browsing (3 APIs) ✅
- `GET /api/v1/stores` - Danh sách tất cả stores
- `GET /api/v1/stores/{storeId}` - Chi tiết store
- `GET /api/v1/stores/owner/{ownerId}` - Stores của 1 owner

### 4. Categories (1 API) ✅
- `GET /api/v1/categories/all` - Lấy tất cả categories

### 5. Brands (1 API) ✅
- `GET /api/v1/brands/all` - Lấy tất cả brands

### 6. Reviews - Public (3 APIs) ✅
- `GET /api/v1/reviews/{reviewId}` - Chi tiết 1 review
- `GET /api/v1/reviews/product/{productId}` - Reviews của product
- `GET /api/v1/reviews/product-variant/{productVariantId}` - Reviews của variant
- `GET /api/v1/reviews/product-variant/{productVariantId}/stats` - Thống kê rating

### 7. Promotions - Public (9 APIs) ✅
- `GET /api/v1/promotions` - All active promotions (tất cả)
- `GET /api/v1/promotions/{promotionId}` - Chi tiết promotion
- `GET /api/v1/promotions/code/{promotionCode}` - Get by code
- `GET /api/v1/promotions/platform` - Platform promotions (toàn sàn)
- `GET /api/v1/promotions/type/{type}` - Filter by type (PERCENTAGE, FIXED_AMOUNT...)
- `GET /api/v1/promotions/store/{storeId}/active` - Active promotions của shop
- `GET /api/v1/promotions/validate/{promotionId}` - Validate promotion
- `GET /api/v1/promotions/calculate-discount/{promotionId}` - Tính discount

---

## 🔐 API BUYER - CẦN AUTHENTICATION

### 1. User Management (6 APIs) ✅
- `POST /api/v1/users/register` - Đăng ký
- `POST /api/v1/users/login` - Đăng nhập
- `POST /api/v1/users/auth/social/callback` - Đăng nhập Google
- `GET /api/v1/users/verify` - Xác thực email
- `GET /api/v1/users/current` - Lấy thông tin user
- `PUT /api/v1/users/avatar` - Cập nhật avatar

### 2. Forgot Password (2 APIs) ✅
- `POST /forgot-password` - Yêu cầu reset password
- `POST /reset-password` - Đặt lại mật khẩu mới

### 3. Address Management (5 APIs) ✅
- `GET /api/v1/buyer/address` - Danh sách địa chỉ
- `GET /api/v1/buyer/address/check` - Check có địa chỉ chưa
- `POST /api/v1/buyer/address` - Thêm địa chỉ mới
- `PUT /api/v1/buyer/address/{addressId}` - Sửa địa chỉ
- `DELETE /api/v1/buyer/address/{addressId}` - Xóa địa chỉ

### 4. Cart Management (6 APIs) ✅
- `GET /api/v1/buyer/cart` - Xem giỏ hàng
- `GET /api/v1/buyer/cart/count` - Đếm số sản phẩm trong giỏ
- `POST /api/v1/buyer/cart/add` - Thêm vào giỏ
- `PUT /api/v1/buyer/cart/{productVariantId}` - Cập nhật số lượng
- `DELETE /api/v1/buyer/cart/{productVariantId}` - Xóa 1 item
- `DELETE /api/v1/buyer/cart` - Xóa nhiều items (body: array of cart item IDs)

### 5. Order Management (4 APIs) ✅
- `GET /api/v1/buyer/orders` - Lịch sử đơn hàng
- `GET /api/v1/buyer/orders/{orderId}` - Chi tiết đơn hàng
- `POST /api/v1/buyer/orders/checkout` - Checkout/tạo đơn
- `PUT /api/v1/buyer/orders/{orderId}/cancel` - Hủy đơn

### 6. Review Management (4 APIs) ✅
- `GET /api/v1/buyer/reviews/my-reviews` - Danh sách reviews của tôi
- `POST /api/v1/buyer/reviews` - Tạo review mới
- `PUT /api/v1/buyer/reviews/{reviewId}` - Sửa review
- `DELETE /api/v1/buyer/reviews/{reviewId}` - Xóa review

### 7. Payment Management (3 APIs) ⭐ MỚI
- `POST /api/v1/buyer/payments/create_payment_url` - Tạo URL thanh toán VNPay
- `POST /api/v1/buyer/payments/query` - Kiểm tra trạng thái giao dịch
- `POST /api/v1/buyer/payments/refund` - Yêu cầu hoàn tiền

**🎯 VNPay Payment Flow:**
```javascript
// 1. Tạo payment URL
POST /api/v1/buyer/payments/create_payment_url
Body: {
  orderId: "xxx",
  amount: 1000000,
  orderInfo: "Thanh toán đơn hàng #123",
  returnUrl: "https://yoursite.com/payment/callback",
  ipAddress: "192.168.1.1"
}
Response: {
  paymentUrl: "https://sandbox.vnpayment.vn/...",
  transactionId: "xxx"
}

// 2. Redirect user đến paymentUrl
window.location.href = paymentUrl;

// 3. Sau khi thanh toán, VNPay redirect về returnUrl
// 4. Kiểm tra trạng thái
POST /api/v1/buyer/payments/query
Body: {
  transactionId: "xxx",
  orderId: "xxx"
}

// 5. Nếu cần hoàn tiền
POST /api/v1/buyer/payments/refund
Body: {
  transactionId: "xxx",
  amount: 1000000,
  reason: "Khách hàng yêu cầu hủy đơn"
}
```

---

## 📊 TỔNG KẾT

**TOTAL APIs FOR BUYERS/USERS: 57 APIs**

**PUBLIC APIs (không cần auth): 27 APIs**
- Product Variant Browsing: 7 APIs ✅
- Product Browsing: 4 APIs ⚠️ (không dùng trực tiếp)
- Store Browsing: 3 APIs ✅
- Categories: 1 API ✅
- Brands: 1 API ✅
- Reviews (Public): 4 APIs ✅
- Promotions (Public): 8 APIs ✅

**BUYER APIs (cần auth): 30 APIs** (+3 APIs mới)
- User Management: 6 APIs ✅
- Forgot Password: 2 APIs ✅
- Address Management: 5 APIs ✅
- Cart Management: 6 APIs ✅
- Order Management: 4 APIs ✅
- Review Management: 4 APIs ✅
- Payment Management: 3 APIs ⭐ MỚI

---

## ⭐ TÍNH NĂNG MỚI: VNPAY PAYMENT

### 📋 Cần implement:
1. **Checkout Page** - Thêm option "Thanh toán VNPay"
2. **Payment Callback Page** - Xử lý kết quả từ VNPay
3. **Payment Service** - API integration
4. **Order Flow** - Cập nhật flow thanh toán

### 📁 Files cần tạo:
```
src/pages/Checkout/
  ├── PaymentMethods.jsx      🔧 Cập nhật (thêm VNPay)
  └── VNPayCallback.jsx       ⭐ MỚI

src/services/
  └── paymentService.js       ⭐ MỚI
```

---

## ✅ STATUS: CẬP NHẬT VỚI SWAGGER MỚI

- ✅ Tất cả APIs cũ vẫn hoạt động bình thường
- ⭐ Thêm 3 APIs VNPay Payment mới
- 🚀 Cần implement tích hợp VNPay gateway