# 📊 SO SÁNH SWAGGER CŨ VÀ MỚI

## 🆕 TAGS MỚI ĐƯỢC THÊM VÀO (SWAGGER NEW)

### 1. **B2C Wallet Management** ⭐ MỚI
- **Mô tả:** APIs for store owners to manage wallet balance and withdrawal requests
- **Chức năng:** Quản lý ví và yêu cầu rút tiền cho chủ shop

**Endpoints:**
- `GET /api/v1/b2c/wallet/store/{storeId}` - Xem thông tin ví & số dư
- `POST /api/v1/b2c/wallet/store/{storeId}/withdrawal` - Tạo yêu cầu rút tiền
- `GET /api/v1/b2c/wallet/store/{storeId}/withdrawals` - Xem danh sách yêu cầu rút tiền
- `GET /api/v1/b2c/wallet/store/{storeId}/withdrawal/{requestId}` - Xem chi tiết yêu cầu rút tiền
- `GET /api/v1/b2c/wallet/store/{storeId}/transactions` - Xem lịch sử giao dịch

### 2. **Admin Withdrawal Management** ⭐ MỚI  
- **Mô tả:** Admin APIs for managing withdrawal requests from store owners
- **Chức năng:** Admin quản lý các yêu cầu rút tiền từ chủ shop

**Endpoints:**
- `GET /api/v1/admin/withdrawals` - Xem tất cả yêu cầu rút tiền (có filter theo status)
- `PUT /api/v1/admin/withdrawals/{requestId}/approve` - Duyệt yêu cầu rút tiền
- `PUT /api/v1/admin/withdrawals/{requestId}/reject` - Từ chối yêu cầu rút tiền
- `PUT /api/v1/admin/withdrawals/{requestId}/complete` - Đánh dấu đã chuyển tiền xong

### 3. **Buyer Payment Management** ⭐ MỚI
- **Mô tả:** APIs for buyers to manage payment transactions via VNPay gateway
- **Chức năng:** Người mua quản lý thanh toán qua VNPay

**Endpoints:**
- `POST /api/v1/buyer/payments/create_payment_url` - Tạo URL thanh toán VNPay
- `POST /api/v1/buyer/payments/query` - Kiểm tra trạng thái giao dịch
- `POST /api/v1/buyer/payments/refund` - Yêu cầu hoàn tiền

---

## 📋 TAGS GIỮ NGUYÊN (CÓ TRONG CẢ 2 PHIÊN BẢN)

1. **User Management** - Quản lý user, đăng ký, đăng nhập
2. **Brand Management** - Quản lý thương hiệu
3. **B2C Product Management** - Quản lý sản phẩm B2C
4. **B2C Product Variant Management** - Quản lý biến thể sản phẩm
5. **Admin Store Management** - Admin quản lý cửa hàng
6. **B2C Store Management** - Chủ shop quản lý cửa hàng
7. **Category Management** - Quản lý danh mục
8. **Product Variant Browsing** - Duyệt xem biến thể sản phẩm (public)
9. **B2C Analytics** - Thống kê & phân tích cho B2C
10. **Buyer Review Management** - Người mua quản lý đánh giá
11. **B2C Order Management** - Chủ shop quản lý đơn hàng
12. **Password Reset** - Quên mật khẩu
13. **Admin Product Management** - Admin duyệt sản phẩm
14. **Buyer Promotion APIs** - Người mua xem khuyến mãi
15. **Admin User Management** - Admin quản lý users
16. **Store Browsing** - Duyệt xem cửa hàng (public)
17. **Buyer Address Management** - Người mua quản lý địa chỉ
18. **Review Management** - Quản lý đánh giá (public)
19. **Buyer Cart Management** - Người mua quản lý giỏ hàng
20. **Public Promotion APIs** - Xem khuyến mãi (public)
21. **Buyer Order Management** - Người mua quản lý đơn hàng
22. **Product Browsing** - Duyệt xem sản phẩm (public)
23. **Admin Promotion Management** - Admin quản lý khuyến mãi
24. **B2C Promotion Management** - Chủ shop quản lý khuyến mãi

---

## 🔑 ĐIỂM KHÁC BIỆT CHÍNH

### ✅ SWAGGER MỚI THÊM 3 NHÓM API:

#### 1. **Hệ thống Ví (Wallet)**
- Store owners có thể xem số dư ví
- Tạo yêu cầu rút tiền
- Xem lịch sử giao dịch

#### 2. **Quản lý Rút tiền (Admin)**
- Admin duyệt/từ chối yêu cầu rút tiền
- Xem danh sách yêu cầu rút tiền
- Quản lý trạng thái withdrawal

#### 3. **Thanh toán VNPay (Buyer)**
- Tích hợp VNPay gateway
- Xử lý callback từ VNPay
- Quản lý giao dịch thanh toán

---

## 📊 TỔNG KẾT

| Tiêu chí | Swagger Cũ | Swagger Mới |
|----------|------------|-------------|
| **Tổng số Tags** | 24 | 27 |
| **Tags mới** | - | 3 (Wallet, Withdrawal, Payment) |
| **Tính năng chính thêm** | - | Hệ thống ví & thanh toán |

---

## 🎯 TÁC ĐỘNG ĐẾN FRONTEND

### ✅ CẦN IMPLEMENT:

#### 1. **Store Dashboard - Wallet Page** 🆕
- Hiển thị số dư ví
- Nút "Rút tiền"
- Lịch sử giao dịch
- Form yêu cầu rút tiền

#### 2. **Admin Dashboard - Withdrawal Management** 🆕
- Danh sách yêu cầu rút tiền
- Nút Approve/Reject
- Xem chi tiết withdrawal
- Filter theo trạng thái

#### 3. **Buyer Checkout - VNPay Integration** 🆕
- Chọn phương thức thanh toán VNPay
- Redirect đến VNPay gateway
- Handle callback sau thanh toán
- Hiển thị trạng thái thanh toán

---

## 🚀 HÀNH ĐỘNG TIẾP THEO

### Priority 1: **VNPay Payment** (Quan trọng nhất)
- [ ] Tạo trang checkout với VNPay option
- [ ] Implement VNPay redirect flow
- [ ] Handle payment callback
- [ ] Update order status sau thanh toán

### Priority 2: **Store Wallet**
- [ ] Tạo trang Wallet trong Store Dashboard
- [ ] API integration cho wallet balance
- [ ] Form rút tiền
- [ ] Lịch sử giao dịch

### Priority 3: **Admin Withdrawal**
- [ ] Trang quản lý withdrawal requests
- [ ] Approve/Reject actions
- [ ] Filter & search
- [ ] Chi tiết withdrawal

---

## 📝 GHI CHÚ

- **Swagger mới** có cấu trúc tương tự swagger cũ
- Chỉ **THÊM** 3 nhóm API mới, **KHÔNG XÓA** API nào
- Tất cả API cũ vẫn hoạt động bình thường
- Cần cập nhật sidebar Store Dashboard để thêm menu "Ví"
- Cần cập nhật sidebar Admin Dashboard để thêm menu "Quản lý rút tiền"
