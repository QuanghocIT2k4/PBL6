# ✅ ĐÃ SỬA LOGIC PHÍ SHIP: PHÍ SHIP LÀ CỦA SÀN

## 📋 TÓM TẮT THAY ĐỔI

**Vấn đề:** Code cũ cho shop nhận phí ship, nhưng phí ship thực tế là của SÀN (sàn quản lý đội ngũ shipper).

**Giải pháp:** Sửa lại logic để:
- Shop **KHÔNG nhận phí ship**
- Admin/Sàn **nhận phí ship** vào revenue

---

## 🔧 CÁC FILE ĐÃ SỬA

### 1. ✅ `buyer-BE/src/services/walletService.js`

#### Sửa `calculateStoreReceiveAmount()`:
```javascript
// ❌ TRƯỚC (SAI):
const storeReceiveAmount = 0.95 * (productPrice - storeDiscountAmount) + shippingFee;

// ✅ SAU (ĐÚNG):
const storeReceiveAmount = 0.95 * (productPrice - storeDiscountAmount);
// BỎ shippingFee - Phí ship là của SÀN
```

#### Sửa `calculatePlatformCommission()`:
```javascript
// ❌ TRƯỚC (SAI):
const commission = 0.05 * (productPrice - storeDiscountAmount);

// ✅ SAU (ĐÚNG):
const commission = 0.05 * (productPrice - storeDiscountAmount) + shippingFee;
// CỘNG shippingFee - Phí ship là của SÀN
```

### 2. ✅ `FE/LOGIC_XU_LY_TIEN.md`

Đã sửa tất cả các công thức trong 5 trường hợp:

#### Trường hợp 1: Đơn hàng thành công
```
❌ TRƯỚC: Shop nhận = 0.95 × (productPrice - storeDiscountAmount) + shippingFee
✅ SAU:   Shop nhận = 0.95 × (productPrice - storeDiscountAmount)

❌ TRƯỚC: Admin nhận = 0.05 × (productPrice - storeDiscountAmount) - platformDiscountAmount
✅ SAU:   Admin nhận = 0.05 × (productPrice - storeDiscountAmount) + shippingFee - platformDiscountAmount
```

#### Trường hợp 2: Shop xác nhận return OK
```
❌ TRƯỚC: Shop trừ = 0.95 × (productPrice - storeDiscountAmount) + shippingFee
✅ SAU:   Shop trừ = 0.95 × (productPrice - storeDiscountAmount)

❌ TRƯỚC: Admin nhận = 0.05 × (productPrice - storeDiscountAmount)
✅ SAU:   Admin nhận = 0.05 × (productPrice - storeDiscountAmount) + shippingFee
```

#### Trường hợp 3: Shop thắng dispute
```
❌ TRƯỚC: Shop nhận = 0.95 × (productPrice - storeDiscountAmount) + shippingFee
✅ SAU:   Shop nhận = 0.95 × (productPrice - storeDiscountAmount)

❌ TRƯỚC: Admin nhận = 0.05 × (productPrice - storeDiscountAmount) - platformDiscountAmount
✅ SAU:   Admin nhận = 0.05 × (productPrice - storeDiscountAmount) + shippingFee - platformDiscountAmount
```

#### Trường hợp 4: Hoàn tiền một phần
```
❌ TRƯỚC: Shop nhận = [0.95 × (productPrice - storeDiscountAmount) + shippingFee] - partialRefundAmount
✅ SAU:   Shop nhận = [0.95 × (productPrice - storeDiscountAmount)] - partialRefundAmount

❌ TRƯỚC: Admin nhận = 0.05 × (productPrice - storeDiscountAmount) - platformDiscountAmount
✅ SAU:   Admin nhận = 0.05 × (productPrice - storeDiscountAmount) + shippingFee - platformDiscountAmount
```

#### Trường hợp 5: Khách thắng dispute
```
❌ TRƯỚC: Shop trừ = 0.95 × (productPrice - storeDiscountAmount) + shippingFee
✅ SAU:   Shop trừ = 0.95 × (productPrice - storeDiscountAmount)

❌ TRƯỚC: Admin nhận = 0.05 × (productPrice - storeDiscountAmount)
✅ SAU:   Admin nhận = 0.05 × (productPrice - storeDiscountAmount) + shippingFee
```

---

## 📊 VÍ DỤ SO SÁNH

### Đơn Hàng: 10 Triệu, Phí Ship 50k, Mã Sàn 100k

#### ❌ Logic Cũ (SAI):
```
Shop nhận: 95% × 10,000,000 + 50,000 = 9,550,000 VND ❌
Admin nhận: 5% × 10,000,000 - 100,000 = 400,000 VND ❌
```

#### ✅ Logic Mới (ĐÚNG):
```
Shop nhận: 95% × 10,000,000 = 9,500,000 VND ✅
Admin nhận: 5% × 10,000,000 + 50,000 - 100,000 = 450,000 VND ✅
```

**Khác biệt:**
- Shop: Giảm 50,000 VND (không nhận phí ship)
- Admin: Tăng 50,000 VND (nhận phí ship)

---

## ⚠️ CẦN KIỂM TRA THÊM

### Backend Cần Implement:

1. **Complete Order API** (`PUT /api/v1/buyer/orders/{orderId}/complete`)
   - ✅ Đã sửa `calculateStoreReceiveAmount()` - Shop không nhận ship
   - ⚠️ Cần thêm code cộng hoa hồng + phí ship cho admin

2. **Confirm Return OK API** (`PUT /api/v1/b2c/returns/store/{storeId}/returnRequest/{returnRequestId}/confirm-ok`)
   - ⚠️ Cần implement logic trừ pendingAmount (KHÔNG có ship)
   - ⚠️ Cần implement logic cộng hoa hồng + phí ship cho admin

3. **Resolve Dispute APIs**
   - ⚠️ Cần implement logic theo công thức mới (KHÔNG có ship trong shop)

### Frontend Cần Kiểm Tra:

1. **Validation số tiền hoàn một phần**
   - ✅ Đã đúng (không tính ship vào maxRefundAmount)
   - ⚠️ Cần kiểm tra lại các file phân tích

2. **Hiển thị số tiền**
   - ⚠️ Cần kiểm tra các component hiển thị số tiền shop nhận
   - ⚠️ Cần kiểm tra các component hiển thị revenue admin

---

## 📝 CÔNG THỨC TỔNG QUÁT MỚI

### Khi Shop Nhận Tiền:
```
Shop nhận = 0.95 × (productPrice - storeDiscountAmount) ❌ KHÔNG CỘNG shippingFee
Admin nhận = 0.05 × (productPrice - storeDiscountAmount) + shippingFee - platformDiscountAmount (nếu có)
```

### Khi Shop Bị Phạt:
```
Shop trừ = 0.95 × (productPrice - storeDiscountAmount) ❌ KHÔNG CỘNG shippingFee
Admin nhận = 0.05 × (productPrice - storeDiscountAmount) + shippingFee (tiền phạt)
```

### Khi Hoàn Tiền Một Phần:
```
Shop nhận = [0.95 × (productPrice - storeDiscountAmount)] - partialRefundAmount ❌ KHÔNG CỘNG shippingFee
Admin nhận = 0.05 × (productPrice - storeDiscountAmount) + shippingFee - platformDiscountAmount (nếu có)
```

---

## ✅ KẾT LUẬN

### Đã Sửa:
- ✅ `buyer-BE/src/services/walletService.js` - Sửa công thức tính toán
- ✅ `FE/LOGIC_XU_LY_TIEN.md` - Sửa tất cả công thức trong 5 trường hợp

### Cần Làm Tiếp:
- ⚠️ Backend cần implement logic cộng hoa hồng + phí ship cho admin
- ⚠️ Backend cần implement logic xử lý return/refund/dispute theo công thức mới
- ⚠️ Frontend cần kiểm tra lại các component hiển thị số tiền

---

**Ngày sửa:** 26/12/2024  
**Trạng thái:** ✅ ĐÃ SỬA CODE TÍNH TOÁN - CẦN IMPLEMENT BACKEND LOGIC




