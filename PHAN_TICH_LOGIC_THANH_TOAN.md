# 🔍 PHÂN TÍCH LOGIC THANH TOÁN ONLINE

## 📋 YÊU CẦU NGHIỆP VỤ

**Quy trình đúng:**
1. ✅ **Khi thanh toán online** → Tiền chuyển vào **tài khoản sàn** (KHÔNG vào balance store ngay)
2. ✅ **Khi đơn hàng hoàn tất** (status = COMPLETED, không hoàn trả) → Mới cộng tiền vào **ví (balance) của store**

---

## 🔴 VẤN ĐỀ PHÁT HIỆN

### 1. Logic tạo đơn hàng (orderController.js)

**File:** `buyer-BE/src/controllers/orderController.js`

**Dòng 47:**
```javascript
paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PAID_FAKE',
```

**Vấn đề:**
- ❌ Khi `paymentMethod = 'ONLINE'`, `paymentStatus` được set là `'PAID_FAKE'` (giả lập)
- ❌ **KHÔNG có logic** xử lý callback từ VNPay/MoMo để cập nhật `paymentStatus = 'PAID'` thật sự
- ❌ **KHÔNG có logic** chuyển tiền vào tài khoản sàn khi thanh toán thành công

**Kết luận:** Logic thanh toán online chưa được implement đầy đủ.

---

### 2. Logic hoàn tất đơn hàng (completeOrder)

**File:** `buyer-BE/src/controllers/orderController.js`

**Dòng 93-95:**
```javascript
order.status = 'COMPLETED';
order.completedAt = new Date();
await order.save();
```

**Vấn đề:**
- ❌ **KHÔNG có logic** cộng tiền vào ví store khi order completed
- ❌ **KHÔNG kiểm tra** paymentStatus có phải 'PAID' không
- ❌ **KHÔNG kiểm tra** đơn hàng có bị hoàn trả không

**Kết luận:** Logic cộng tiền vào ví store khi đơn hàng hoàn tất **CHƯA ĐƯỢC IMPLEMENT**.

---

### 3. Thiếu route xử lý payment callback

**File:** `buyer-BE/src/server.js`

**Vấn đề:**
- ❌ **KHÔNG có route** xử lý callback từ VNPay (`/api/v1/buyer/payments/vnpay_return`)
- ❌ **KHÔNG có route** xử lý callback từ MoMo (`/api/v1/buyer/payments/momo/return`)
- ❌ **KHÔNG có controller** xử lý payment callback

**Kết luận:** Backend chưa có endpoint để nhận callback từ payment gateway.

---

## ✅ LOGIC ĐÚNG CẦN IMPLEMENT

### 1. Khi thanh toán online thành công (Payment Callback)

**Flow:**
```
1. User thanh toán qua VNPay/MoMo
2. Payment gateway gọi callback URL
3. Backend xác thực callback
4. Cập nhật paymentStatus = 'PAID'
5. Chuyển tiền vào TÀI KHOẢN SÀN (không vào balance store)
```

**Cần implement:**
- ✅ Route: `POST /api/v1/buyer/payments/vnpay_return`
- ✅ Route: `POST /api/v1/buyer/payments/momo/return`
- ✅ Controller xử lý callback
- ✅ Cập nhật `paymentStatus = 'PAID'` cho các order liên quan
- ✅ Ghi nhận tiền vào tài khoản sàn (có thể là một bảng `PlatformWallet` hoặc `AdminRevenue`)

---

### 2. Khi đơn hàng hoàn tất (completeOrder)

**Flow:**
```
1. User xác nhận nhận hàng (status = DELIVERED)
2. User click "Hoàn tất" → status = COMPLETED
3. Kiểm tra:
   - paymentStatus = 'PAID' (đã thanh toán online)
   - status = 'COMPLETED'
   - KHÔNG có return request đang pending
4. Tính toán số tiền store nhận:
   - storeReceiveAmount = 95% × (productPrice - storeDiscount) + shippingFee
5. Cộng tiền vào ví store:
   - store.balance += storeReceiveAmount
   - Trừ tiền từ tài khoản sàn
```

**Cần implement:**
- ✅ Kiểm tra điều kiện trước khi cộng tiền
- ✅ Tính toán số tiền store nhận (theo LOGIC_XU_LY_TIEN.md)
- ✅ Cộng vào `store.balance` hoặc `store.wallet.balance`
- ✅ Trừ tiền từ tài khoản sàn
- ✅ Ghi log transaction

---

## 📝 CODE CẦN SỬA

### 1. Sửa completeOrder trong orderController.js

**Cần thêm:**
```javascript
// Kiểm tra điều kiện
if (order.paymentStatus !== 'PAID' && order.paymentMethod === 'ONLINE') {
  return res.status(400).json({
    success: false,
    message: 'Đơn hàng chưa thanh toán, không thể hoàn tất'
  });
}

// Kiểm tra không có return request đang pending
const hasPendingReturn = await ReturnRequest.findOne({
  orderId: order._id,
  status: { $in: ['PENDING', 'APPROVED'] }
});

if (hasPendingReturn) {
  return res.status(400).json({
    success: false,
    message: 'Đơn hàng đang có yêu cầu hoàn trả, không thể hoàn tất'
  });
}

// Tính toán số tiền store nhận
const storeReceiveAmount = calculateStoreReceiveAmount(order);

// Cộng tiền vào ví store
await updateStoreBalance(order.storeId, storeReceiveAmount);

// Trừ tiền từ tài khoản sàn
await deductFromPlatformWallet(storeReceiveAmount);
```

---

### 2. Tạo Payment Callback Controller

**Cần tạo file mới:** `buyer-BE/src/controllers/paymentController.js`

**Chức năng:**
- Xử lý callback từ VNPay
- Xử lý callback từ MoMo
- Cập nhật paymentStatus = 'PAID'
- Ghi nhận tiền vào tài khoản sàn

---

### 3. Tạo Wallet Service

**Cần tạo file mới:** `buyer-BE/src/services/walletService.js`

**Chức năng:**
- `updateStoreBalance(storeId, amount)` - Cộng tiền vào ví store
- `deductFromPlatformWallet(amount)` - Trừ tiền từ tài khoản sàn
- `calculateStoreReceiveAmount(order)` - Tính số tiền store nhận

---

## 🎯 KẾT LUẬN

### ❌ Logic hiện tại CHƯA ĐÚNG:

1. **Thanh toán online:**
   - ❌ Chỉ set `paymentStatus = 'PAID_FAKE'` (giả lập)
   - ❌ Không có callback handler
   - ❌ Không chuyển tiền vào tài khoản sàn

2. **Hoàn tất đơn hàng:**
   - ❌ Không cộng tiền vào ví store
   - ❌ Không kiểm tra điều kiện
   - ❌ Không trừ tiền từ tài khoản sàn

### ✅ Cần implement:

1. **Payment Callback Handler** - Xử lý callback từ VNPay/MoMo
2. **Platform Wallet** - Quản lý tài khoản sàn
3. **Store Balance Update** - Cộng tiền vào ví store khi order completed
4. **Validation Logic** - Kiểm tra điều kiện trước khi cộng tiền

---

**Ngày phân tích:** 25/12/2024  
**Trạng thái:** ⚠️ CẦN SỬA GẤP




