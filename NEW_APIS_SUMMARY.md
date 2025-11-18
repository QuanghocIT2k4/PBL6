# 🆕 TÓM TẮT APIs MỚI TRONG SWAGGER

**Ngày cập nhật:** November 18, 2025

---

## 📊 TỔNG QUAN

Swagger mới thêm **12 APIs** chia thành **3 nhóm chức năng**:

| Nhóm | Số APIs | Cho ai | Status |
|------|---------|--------|--------|
| **Buyer Payment Management** | 3 | Buyers | ⭐ Cần implement |
| **B2C Wallet Management** | 5 | Store Owners | ⭐ Cần implement |
| **Admin Withdrawal Management** | 4 | Admin | ⭐ Cần implement |
| **TOTAL** | **12** | - | **0% implemented** |

---

## 1️⃣ BUYER PAYMENT MANAGEMENT (3 APIs)

### 🎯 Mục đích:
Tích hợp VNPay gateway để buyers thanh toán online

### 📋 APIs:

```
POST /api/v1/buyer/payments/create_payment_url
POST /api/v1/buyer/payments/query
POST /api/v1/buyer/payments/refund
```

### 📁 Files cần tạo:
- `src/services/paymentService.js`
- `src/pages/Checkout/VNPayCallback.jsx`
- Cập nhật `src/pages/Checkout/CheckoutPage.jsx`

### 🔄 Flow:
1. User checkout → Chọn "Thanh toán VNPay"
2. Call API `create_payment_url` → Nhận URL VNPay
3. Redirect user đến VNPay gateway
4. VNPay xử lý thanh toán → Redirect về callback URL
5. Callback page call API `query` để verify
6. Tạo order nếu thanh toán thành công

---

## 2️⃣ B2C WALLET MANAGEMENT (5 APIs)

### 🎯 Mục đích:
Store owners quản lý ví tiền và tạo yêu cầu rút tiền

### 📋 APIs:

```
GET  /api/v1/b2c/wallet/store/{storeId}
POST /api/v1/b2c/wallet/store/{storeId}/withdrawal
GET  /api/v1/b2c/wallet/store/{storeId}/withdrawals
GET  /api/v1/b2c/wallet/store/{storeId}/withdrawal/{requestId}
GET  /api/v1/b2c/wallet/store/{storeId}/transactions
```

### 📁 Files cần tạo:
- `src/services/walletService.js`
- `src/pages/StoreDashboard/StoreWallet.jsx`
- `src/pages/StoreDashboard/WithdrawalHistory.jsx`
- Cập nhật `src/components/StoreDashboard/Sidebar.jsx`

### 🔄 Flow:
1. Store owner vào trang "Ví"
2. Xem số dư hiện tại
3. Click "Rút tiền" → Điền form (số tiền, tài khoản ngân hàng)
4. Submit → Tạo withdrawal request (status: PENDING)
5. Chờ admin duyệt
6. Sau khi admin approve & complete → Tiền về tài khoản

---

## 3️⃣ ADMIN WITHDRAWAL MANAGEMENT (4 APIs)

### 🎯 Mục đích:
Admin duyệt/từ chối yêu cầu rút tiền từ store owners

### 📋 APIs:

```
GET /api/v1/admin/withdrawals
PUT /api/v1/admin/withdrawals/{requestId}/approve
PUT /api/v1/admin/withdrawals/{requestId}/reject
PUT /api/v1/admin/withdrawals/{requestId}/complete
```

### 📁 Files cần tạo:
- `src/services/admin/adminWithdrawalService.js`
- `src/pages/AdminDashboard/AdminWithdrawals.jsx`
- Cập nhật `src/components/AdminDashboard/Sidebar.jsx`

### 🔄 Flow:
1. Admin vào trang "Quản lý rút tiền"
2. Xem danh sách yêu cầu (filter: PENDING, APPROVED, REJECTED, COMPLETED)
3. Click vào 1 request → Xem chi tiết
4. Kiểm tra thông tin ngân hàng
5. **APPROVE** → Chuyển tiền thực tế → **COMPLETE**
6. Hoặc **REJECT** → Ghi lý do từ chối

---

## 🔗 LIÊN KẾT GIỮA 3 NHÓM

```
┌─────────────────┐
│  BUYER          │
│  Thanh toán     │ ──► VNPay Gateway
│  VNPay          │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  ORDER          │
│  Created        │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  STORE WALLET   │
│  Balance +      │ ──► Tạo withdrawal request
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  ADMIN          │
│  Approve/Reject │ ──► Chuyển tiền thực tế
└─────────────────┘
```

---

## 📊 IMPACT ANALYSIS

### Files cần cập nhật:
- ✅ `APIUSER.md` - Đã cập nhật (+3 APIs)
- ✅ `APIADMIN.md` - Đã cập nhật (+4 APIs)
- ✅ `APIB2C.md` - Đã cập nhật (+5 APIs)

### Files cần tạo mới:
**Services:**
- `src/services/paymentService.js`
- `src/services/walletService.js`
- `src/services/admin/adminWithdrawalService.js`

**Pages:**
- `src/pages/Checkout/VNPayCallback.jsx`
- `src/pages/StoreDashboard/StoreWallet.jsx`
- `src/pages/StoreDashboard/WithdrawalHistory.jsx`
- `src/pages/AdminDashboard/AdminWithdrawals.jsx`

**Components:**
- Cập nhật Store Dashboard Sidebar (thêm menu "Ví")
- Cập nhật Admin Dashboard Sidebar (thêm menu "Quản lý rút tiền")
- Cập nhật Checkout Page (thêm VNPay option)

---

## 🎯 IMPLEMENTATION PRIORITY

### Priority 1: VNPay Payment (CRITICAL)
**Lý do:** Users cần thanh toán online ngay
- [ ] Create `paymentService.js`
- [ ] Create `VNPayCallback.jsx`
- [ ] Update `CheckoutPage.jsx`
- [ ] Test VNPay sandbox

### Priority 2: Store Wallet (HIGH)
**Lý do:** Store owners cần rút tiền
- [ ] Create `walletService.js`
- [ ] Create `StoreWallet.jsx`
- [ ] Create `WithdrawalHistory.jsx`
- [ ] Update Store Sidebar

### Priority 3: Admin Withdrawal (MEDIUM)
**Lý do:** Phối hợp với Priority 2
- [ ] Create `adminWithdrawalService.js`
- [ ] Create `AdminWithdrawals.jsx`
- [ ] Update Admin Sidebar
- [ ] Test approval flow

---

## ⚠️ BREAKING CHANGES

**KHÔNG CÓ BREAKING CHANGES!**

- ✅ Tất cả APIs cũ vẫn hoạt động bình thường
- ✅ Chỉ THÊM APIs mới, không XÓA/SỬA APIs cũ
- ✅ Frontend hiện tại vẫn chạy được
- ✅ Có thể implement từng phần một

---

## 📝 NOTES

### VNPay Integration:
- Cần VNPay merchant account (sandbox hoặc production)
- Cần config VNPay credentials (TMN code, hash secret)
- Return URL phải là HTTPS trong production

### Wallet System:
- Balance tự động cập nhật khi order DELIVERED
- Withdrawal request phải chờ admin approve
- Không thể rút số tiền > balance

### Admin Approval:
- Admin phải kiểm tra thông tin ngân hàng kỹ
- Sau approve, admin chuyển tiền thực tế, rồi mark COMPLETED
- Nếu reject, phải ghi rõ lý do

---

## 🔍 TESTING CHECKLIST

### VNPay Payment:
- [ ] Tạo payment URL thành công
- [ ] Redirect đến VNPay sandbox
- [ ] Thanh toán thành công → Callback nhận đúng params
- [ ] Query transaction status chính xác
- [ ] Order được tạo sau thanh toán thành công
- [ ] Thanh toán thất bại → Hiển thị lỗi đúng

### Wallet:
- [ ] Hiển thị balance chính xác
- [ ] Tạo withdrawal request thành công
- [ ] Không cho rút > balance
- [ ] Danh sách withdrawals hiển thị đúng
- [ ] Transaction history đầy đủ

### Admin Withdrawal:
- [ ] Danh sách requests hiển thị đúng
- [ ] Filter theo status hoạt động
- [ ] Approve request thành công
- [ ] Reject request với lý do
- [ ] Complete request sau khi chuyển tiền
- [ ] Store owner nhận notification

---

## 📚 RELATED DOCS

- `SWAGGER_COMPARISON.md` - So sánh chi tiết Swagger cũ vs mới
- `SWAGGER_CHANGES_SUMMARY.md` - Tóm tắt thay đổi
- `Swagger_new_formatted.json` - File Swagger mới đã format
