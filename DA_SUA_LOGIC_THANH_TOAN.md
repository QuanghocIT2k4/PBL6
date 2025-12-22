# ✅ ĐÃ SỬA LOGIC THANH TOÁN ONLINE

## 📋 TÓM TẮT THAY ĐỔI

Đã sửa logic thanh toán online theo đúng yêu cầu:
- ✅ **KHÔNG có ví sàn** - chỉ giả lập là tiền đã vào tài khoản sàn
- ✅ **Khi thanh toán online thành công** → Đánh dấu `paymentStatus = 'PAID'` (giả lập tiền vào sàn)
- ✅ **Khi order completed** → Tự động cộng tiền vào ví store qua API B2C

---

## 🔧 CÁC FILE ĐÃ SỬA/TẠO

### 1. **buyer-BE/src/models/Order.js**
- ✅ Thêm `storeId` (ref Store)
- ✅ Thêm các field: `productPrice`, `shippingFee`, `storeDiscountAmount`, `platformDiscountAmount`
- ✅ Sửa `paymentStatus` enum: thêm `'PAID'` (bỏ `'PAID_FAKE'`)
- ✅ Thêm `transactionId`, `transactionDate` để lưu thông tin giao dịch

### 2. **buyer-BE/src/services/walletService.js** (MỚI)
- ✅ `calculateStoreReceiveAmount()` - Tính số tiền store nhận (95% × (productPrice - storeDiscount) + shippingFee)
- ✅ `calculatePlatformCommission()` - Tính hoa hồng sàn (5%)
- ✅ `markPaymentReceived()` - Giả lập tiền vào tài khoản sàn (chỉ log)
- ✅ `addToStoreWallet()` - Gọi API B2C để cộng tiền vào ví store
- ✅ `transferToStoreWallet()` - Chuyển tiền từ sàn vào ví store khi order completed

### 3. **buyer-BE/src/controllers/paymentController.js** (MỚI)
- ✅ `handleVNPayCallback()` - Xử lý callback từ VNPay
- ✅ `handleMoMoCallback()` - Xử lý callback từ MoMo
- ✅ `queryPaymentStatus()` - Kiểm tra trạng thái thanh toán
- ✅ Khi callback thành công → Cập nhật `paymentStatus = 'PAID'` và giả lập tiền vào sàn

### 4. **buyer-BE/src/controllers/orderController.js**
- ✅ Sửa `completeOrder()`:
  - Kiểm tra `paymentStatus = 'PAID'` nếu thanh toán online
  - Kiểm tra không có return request đang pending
  - Tính số tiền store nhận
  - Gọi API B2C để cộng tiền vào ví store tự động

### 5. **buyer-BE/src/routes/paymentRoutes.js** (MỚI)
- ✅ `GET /api/v1/buyer/payments/vnpay_return` - Callback VNPay
- ✅ `POST /api/v1/buyer/payments/momo/return` - Callback MoMo
- ✅ `POST /api/v1/buyer/payments/query` - Query payment status

### 6. **buyer-BE/src/server.js**
- ✅ Thêm payment routes

### 7. **buyer-BE/package.json**
- ✅ Thêm `axios` dependency để gọi API B2C

---

## 🔄 FLOW XỬ LÝ

### 1. Khi thanh toán online thành công (VNPay/MoMo)

```
User thanh toán → Payment Gateway
    ↓
Callback về backend
    ↓
paymentController.handleVNPayCallback() / handleMoMoCallback()
    ↓
Cập nhật paymentStatus = 'PAID'
    ↓
Giả lập: Tiền vào tài khoản sàn (chỉ log)
```

**Code:**
```javascript
order.paymentStatus = 'PAID';
order.transactionId = vnp_TransactionNo;
await order.save();
await walletService.markPaymentReceived(order.totalPrice, orderId); // Chỉ log
```

---

### 2. Khi order completed

```
User xác nhận nhận hàng → completeOrder()
    ↓
Kiểm tra:
  - status = 'DELIVERED' ✅
  - paymentStatus = 'PAID' (nếu ONLINE) ✅
  - Không có return request pending ✅
    ↓
Cập nhật status = 'COMPLETED'
    ↓
Tính số tiền store nhận:
  storeReceiveAmount = 95% × (productPrice - storeDiscount) + shippingFee
    ↓
Gọi API B2C: POST /api/v1/b2c/wallet/store/{storeId}/add-balance
    ↓
Tự động cộng tiền vào ví store
```

**Code:**
```javascript
if (order.paymentMethod === 'ONLINE' && order.paymentStatus === 'PAID' && order.storeId) {
  const storeReceiveAmount = walletService.calculateStoreReceiveAmount(order);
  await walletService.transferToStoreWallet(order.storeId, storeReceiveAmount, orderId);
}
```

---

## ⚙️ CẤU HÌNH CẦN THIẾT

### Environment Variables

Thêm vào `.env`:
```env
# URL của B2C API để cập nhật ví store
B2C_API_URL=http://localhost:5001/api/v1/b2c

# URL frontend để redirect sau khi thanh toán
FRONTEND_URL=http://localhost:5173
```

---

## 📝 API ENDPOINTS

### Payment Callback (Public - không cần auth)
- `GET /api/v1/buyer/payments/vnpay_return` - VNPay callback
- `POST /api/v1/buyer/payments/momo/return` - MoMo callback
- `POST /api/v1/buyer/payments/query` - Query payment status

### Order Complete (Cần auth)
- `PUT /api/v1/buyer/orders/:orderId/complete` - Hoàn tất đơn hàng

---

## 🔗 API B2C CẦN IMPLEMENT

Backend B2C cần có endpoint để cộng tiền vào ví store:

```
POST /api/v1/b2c/wallet/store/{storeId}/add-balance

Body:
{
  "amount": 1000000,
  "orderId": "order_123",
  "type": "ORDER_COMPLETED",
  "description": "Thanh toán đơn hàng order_123"
}

Response:
{
  "success": true,
  "data": {
    "storeId": "store_123",
    "newBalance": 5000000,
    "amountAdded": 1000000
  }
}
```

---

## ✅ KIỂM TRA

### 1. Thanh toán online thành công
- [ ] VNPay callback cập nhật `paymentStatus = 'PAID'`
- [ ] MoMo callback cập nhật `paymentStatus = 'PAID'`
- [ ] Log "Tiền đã vào tài khoản sàn" (giả lập)

### 2. Order completed
- [ ] Kiểm tra điều kiện trước khi complete
- [ ] Tính đúng số tiền store nhận
- [ ] Gọi API B2C thành công
- [ ] Tiền được cộng vào ví store

### 3. Edge cases
- [ ] COD không cộng tiền vào ví store ở completeOrder
- [ ] Order có return request pending → không thể complete
- [ ] Order chưa thanh toán online → không thể complete

---

## 🚀 CÀI ĐẶT

```bash
cd buyer-BE
npm install  # Cài axios
npm run dev  # Chạy server
```

---

## 📌 LƯU Ý

1. **Không có ví sàn**: Chỉ giả lập, không lưu vào database
2. **API B2C**: Cần đảm bảo endpoint `/wallet/store/{storeId}/add-balance` tồn tại
3. **Error handling**: Nếu API B2C lỗi, sẽ log warning nhưng không block flow
4. **Transaction**: Có thể cần thêm transaction để đảm bảo tính nhất quán

---

**Ngày sửa:** 25/12/2024  
**Trạng thái:** ✅ HOÀN THÀNH


